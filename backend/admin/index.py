import json
import os
import urllib.request
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def client_ip(event):
    headers = event.get('headers') or {}
    fwd = headers.get('X-Forwarded-For') or headers.get('x-forwarded-for') or ''
    ip = fwd.split(',')[0].strip()
    if not ip:
        ip = ((event.get('requestContext') or {}).get('identity') or {}).get('sourceIp') or ''
    return ip


def lookup_geo(ip):
    if not ip:
        return None, None
    try:
        req = urllib.request.Request(f"https://ipwho.is/{ip}?fields=success,country,city", headers={'User-Agent': 'urokai'})
        with urllib.request.urlopen(req, timeout=2) as r:
            data = json.loads(r.read().decode('utf-8'))
        if data.get('success'):
            return (data.get('country') or None), (data.get('city') or None)
    except Exception:
        pass
    return None, None


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Content-Type': 'application/json',
    }


def resp(code, data):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps(data, default=str)}


def get_admin_email(cur, event):
    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization')
    if not token:
        return None
    cur.execute(
        f"SELECT u.email FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > now()",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    admins = [e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]
    return row[0] if row[0].lower() in admins else None


def handler(event: dict, context) -> dict:
    """Админка УрокАИ: учёт посещений, статистика для администратора, новости сайта."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors(), 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'news')

            if action == 'news':
                cur.execute(
                    f"SELECT id, title, body, created_at FROM {SCHEMA}.news "
                    f"WHERE is_published = true ORDER BY created_at DESC LIMIT 20"
                )
                items = [{'id': r[0], 'title': r[1], 'body': r[2], 'created_at': r[3]} for r in cur.fetchall()]
                return resp(200, {'news': items})

            if action == 'feedback_public':
                cur.execute(
                    f"SELECT id, name, kind, message, created_at, admin_reply, replied_at FROM {SCHEMA}.feedback "
                    f"WHERE status = 'approved' ORDER BY created_at DESC LIMIT 30"
                )
                items = [
                    {'id': r[0], 'name': r[1], 'kind': r[2], 'message': r[3], 'created_at': r[4],
                     'admin_reply': r[5], 'replied_at': r[6]}
                    for r in cur.fetchall()
                ]
                return resp(200, {'feedback': items})

            if not get_admin_email(cur, event):
                return resp(403, {'error': 'Нет доступа'})

            if action == 'check':
                return resp(200, {'ok': True})

            if action == 'stats':
                cur.execute(
                    f"SELECT count(*), count(DISTINCT visitor_id) FROM {SCHEMA}.site_visits "
                    f"WHERE created_at > date_trunc('day', now())"
                )
                today_views, today_visitors = cur.fetchone()
                cur.execute(
                    f"SELECT count(*), count(DISTINCT visitor_id) FROM {SCHEMA}.site_visits "
                    f"WHERE created_at > now() - interval '7 days'"
                )
                week_views, week_visitors = cur.fetchone()
                cur.execute(
                    f"SELECT count(*), count(DISTINCT visitor_id) FROM {SCHEMA}.site_visits "
                    f"WHERE created_at > now() - interval '30 days'"
                )
                month_views, month_visitors = cur.fetchone()
                cur.execute(f"SELECT count(*), count(DISTINCT visitor_id) FROM {SCHEMA}.site_visits")
                total_views, total_visitors = cur.fetchone()
                cur.execute(
                    f"SELECT count(DISTINCT visitor_id) FROM {SCHEMA}.site_visits "
                    f"WHERE created_at > now() - interval '5 minutes'"
                )
                online = cur.fetchone()[0]
                cur.execute(
                    f"SELECT to_char(d::date, 'YYYY-MM-DD'), "
                    f"coalesce((SELECT count(*) FROM {SCHEMA}.site_visits v WHERE v.created_at::date = d::date), 0), "
                    f"coalesce((SELECT count(DISTINCT visitor_id) FROM {SCHEMA}.site_visits v WHERE v.created_at::date = d::date), 0) "
                    f"FROM generate_series(now() - interval '13 days', now(), interval '1 day') d ORDER BY d"
                )
                daily = [{'date': r[0], 'views': r[1], 'visitors': r[2]} for r in cur.fetchall()]
                cur.execute(
                    f"SELECT path, count(*) c FROM {SCHEMA}.site_visits "
                    f"WHERE created_at > now() - interval '30 days' GROUP BY path ORDER BY c DESC LIMIT 10"
                )
                top_pages = [{'path': r[0], 'views': r[1]} for r in cur.fetchall()]
                cur.execute(
                    f"SELECT coalesce(nullif(referrer, ''), 'Прямой заход') r, count(*) c FROM {SCHEMA}.site_visits "
                    f"WHERE created_at > now() - interval '30 days' GROUP BY r ORDER BY c DESC LIMIT 8"
                )
                sources = [{'source': r[0], 'views': r[1]} for r in cur.fetchall()]
                cur.execute(f"SELECT count(*) FROM {SCHEMA}.users")
                users_total = cur.fetchone()[0]
                cur.execute(f"SELECT count(*) FROM {SCHEMA}.users WHERE created_at > now() - interval '7 days'")
                users_week = cur.fetchone()[0]
                cur.execute(
                    f"SELECT count(DISTINCT user_id) FROM {SCHEMA}.subscriptions WHERE is_active = true AND plan <> 'free' AND (expires_at IS NULL OR expires_at > now())"
                )
                paid = cur.fetchone()[0]
                cur.execute(
                    f"SELECT count(*), coalesce(sum(amount), 0), "
                    f"count(*) FILTER (WHERE created_at > now() - interval '7 days'), "
                    f"count(*) FILTER (WHERE created_at > now() - interval '30 days'), "
                    f"count(DISTINCT user_id) "
                    f"FROM {SCHEMA}.processed_payments WHERE plan = 'single'"
                )
                sp = cur.fetchone()
                cur.execute(
                    f"SELECT coalesce(country, 'Не определено') c, count(DISTINCT visitor_id) FROM {SCHEMA}.site_visits "
                    f"GROUP BY c ORDER BY 2 DESC LIMIT 15"
                )
                geo_visitors = [{'country': r[0], 'count': r[1]} for r in cur.fetchall()]
                cur.execute(
                    f"SELECT coalesce(country, 'Не определено') c, count(*) FROM {SCHEMA}.users GROUP BY c ORDER BY 2 DESC LIMIT 15"
                )
                geo_registered = [{'country': r[0], 'count': r[1]} for r in cur.fetchall()]
                cur.execute(
                    f"SELECT coalesce(u.country, 'Не определено') c, count(*) FROM {SCHEMA}.users u WHERE u.id IN ("
                    f"SELECT user_id FROM {SCHEMA}.processed_payments UNION "
                    f"SELECT user_id FROM {SCHEMA}.subscriptions WHERE plan <> 'free') "
                    f"GROUP BY c ORDER BY 2 DESC LIMIT 15"
                )
                geo_paid = [{'country': r[0], 'count': r[1]} for r in cur.fetchall()]
                cur.execute(
                    f"SELECT coalesce(country, 'Не определено'), coalesce(city, 'Не определён'), count(DISTINCT visitor_id) "
                    f"FROM {SCHEMA}.site_visits WHERE created_at > now() - interval '30 days' "
                    f"GROUP BY 1, 2 ORDER BY 3 DESC LIMIT 15"
                )
                geo_cities = [{'country': r[0], 'city': r[1], 'count': r[2]} for r in cur.fetchall()]
                return resp(200, {
                    'geo': {'visitors': geo_visitors, 'registered': geo_registered, 'paid': geo_paid, 'cities': geo_cities},
                    'single_payments': {
                        'total': sp[0], 'amount': float(sp[1]),
                        'week': sp[2], 'month': sp[3], 'buyers': sp[4],
                    },
                    'today': {'views': today_views, 'visitors': today_visitors},
                    'week': {'views': week_views, 'visitors': week_visitors},
                    'month': {'views': month_views, 'visitors': month_visitors},
                    'total': {'views': total_views, 'visitors': total_visitors},
                    'online': online,
                    'daily': daily,
                    'top_pages': top_pages,
                    'sources': sources,
                    'users_total': users_total,
                    'users_week': users_week,
                    'paid_users': paid,
                })

            if action == 'news_all':
                cur.execute(
                    f"SELECT id, title, body, is_published, created_at FROM {SCHEMA}.news ORDER BY created_at DESC"
                )
                items = [
                    {'id': r[0], 'title': r[1], 'body': r[2], 'is_published': r[3], 'created_at': r[4]}
                    for r in cur.fetchall()
                ]
                return resp(200, {'news': items})

            if action == 'feedback_all':
                cur.execute(
                    f"SELECT id, name, kind, message, status, created_at, admin_reply FROM {SCHEMA}.feedback "
                    f"ORDER BY (status = 'pending') DESC, created_at DESC LIMIT 200"
                )
                items = [
                    {'id': r[0], 'name': r[1], 'kind': r[2], 'message': r[3], 'status': r[4], 'created_at': r[5],
                     'admin_reply': r[6]}
                    for r in cur.fetchall()
                ]
                return resp(200, {'feedback': items})

            return resp(400, {'error': 'Неизвестное действие'})

        body = json.loads(event.get('body') or '{}')
        action = body.get('action')

        if action == 'track':
            visitor_id = str(body.get('visitor_id') or '')[:64]
            path = str(body.get('path') or '/')[:300]
            referrer = str(body.get('referrer') or '')[:200]
            if not visitor_id:
                return resp(400, {'error': 'visitor_id'})
            cur.execute(
                f"SELECT country, city FROM {SCHEMA}.site_visits WHERE visitor_id = %s AND country IS NOT NULL "
                f"ORDER BY id DESC LIMIT 1",
                (visitor_id,),
            )
            known = cur.fetchone()
            if known:
                country, city = known
            else:
                country, city = lookup_geo(client_ip(event))
            cur.execute(
                f"INSERT INTO {SCHEMA}.site_visits (visitor_id, path, referrer, country, city) VALUES (%s, %s, %s, %s, %s)",
                (visitor_id, path, referrer, country, city),
            )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'feedback_submit':
            name = str(body.get('name') or '').strip()[:80]
            message = str(body.get('message') or '').strip()
            kind = body.get('kind') if body.get('kind') in ('review', 'wish') else 'review'
            visitor_id = str(body.get('visitor_id') or '')[:64]
            if not name or len(message) < 10:
                return resp(400, {'error': 'Укажите имя и напишите сообщение не короче 10 символов'})
            if len(message) > 1500:
                return resp(400, {'error': 'Сообщение слишком длинное (максимум 1500 символов)'})
            if visitor_id:
                cur.execute(
                    f"SELECT count(*) FROM {SCHEMA}.feedback WHERE visitor_id = %s "
                    f"AND created_at > now() - interval '1 day'",
                    (visitor_id,),
                )
                if cur.fetchone()[0] >= 3:
                    return resp(429, {'error': 'Лимит: не более 3 сообщений в сутки'})
            cur.execute(
                f"INSERT INTO {SCHEMA}.feedback (name, kind, message, visitor_id) VALUES (%s, %s, %s, %s)",
                (name, kind, message, visitor_id or None),
            )
            conn.commit()
            return resp(200, {'ok': True})

        if not get_admin_email(cur, event):
            return resp(403, {'error': 'Нет доступа'})

        if action == 'feedback_moderate':
            status = body.get('status')
            if status not in ('approved', 'rejected', 'pending'):
                return resp(400, {'error': 'Неверный статус'})
            cur.execute(
                f"UPDATE {SCHEMA}.feedback SET status = %s, moderated_at = now() WHERE id = %s",
                (status, int(body.get('id'))),
            )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'feedback_reply':
            reply = (body.get('reply') or '').strip()[:1500]
            if reply:
                cur.execute(
                    f"UPDATE {SCHEMA}.feedback SET admin_reply = %s, replied_at = now() WHERE id = %s",
                    (reply, int(body.get('id'))),
                )
            else:
                cur.execute(
                    f"UPDATE {SCHEMA}.feedback SET admin_reply = NULL, replied_at = NULL WHERE id = %s",
                    (int(body.get('id')),),
                )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'feedback_delete':
            cur.execute(f"DELETE FROM {SCHEMA}.feedback WHERE id = %s", (int(body.get('id')),))
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'news_create':
            title = (body.get('title') or '').strip()
            text = (body.get('body') or '').strip()
            if not title or not text:
                return resp(400, {'error': 'Заполните заголовок и текст'})
            cur.execute(
                f"INSERT INTO {SCHEMA}.news (title, body) VALUES (%s, %s) RETURNING id",
                (title, text),
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return resp(200, {'id': new_id})

        if action == 'news_update':
            cur.execute(
                f"UPDATE {SCHEMA}.news SET title = %s, body = %s, is_published = %s WHERE id = %s",
                (
                    (body.get('title') or '').strip(),
                    (body.get('body') or '').strip(),
                    bool(body.get('is_published', True)),
                    int(body.get('id')),
                ),
            )
            conn.commit()
            return resp(200, {'ok': True})

        if action == 'news_delete':
            cur.execute(f"DELETE FROM {SCHEMA}.news WHERE id = %s", (int(body.get('id')),))
            conn.commit()
            return resp(200, {'ok': True})

        return resp(400, {'error': 'Неизвестное действие'})
    finally:
        cur.close()
        conn.close()