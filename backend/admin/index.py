import json
import os
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


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
                    f"SELECT count(DISTINCT user_id) FROM {SCHEMA}.subscriptions WHERE is_active = true AND plan <> 'free'"
                )
                paid = cur.fetchone()[0]
                return resp(200, {
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
                f"INSERT INTO {SCHEMA}.site_visits (visitor_id, path, referrer) VALUES (%s, %s, %s)",
                (visitor_id, path, referrer),
            )
            conn.commit()
            return resp(200, {'ok': True})

        if not get_admin_email(cur, event):
            return resp(403, {'error': 'Нет доступа'})

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