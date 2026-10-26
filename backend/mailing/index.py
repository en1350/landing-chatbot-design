import json
import os
import smtplib
from email.mime.text import MIMEText
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
BATCH = 10


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Content-Type': 'application/json',
    }


def resp(code, data):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps(data, default=str)}


def admin_email(cur, event):
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


def build(to_email, subject, text, unsub_link):
    body = f"{text}\n\n--\nВы получили это письмо, потому что зарегистрированы на сайте УрокАИ.\nОтписаться от рассылки: {unsub_link}"
    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = os.environ['SMTP_LOGIN']
    msg['To'] = to_email
    msg['List-Unsubscribe'] = f"<{unsub_link}>"
    return msg


def send_many(messages):
    host = os.environ['SMTP_HOST']
    port = int(os.environ.get('SMTP_PORT', '465'))
    login = os.environ['SMTP_LOGIN']
    password = os.environ['SMTP_PASSWORD']
    sent, failed = 0, 0
    if port == 465:
        server = smtplib.SMTP_SSL(host, port, timeout=10)
    else:
        server = smtplib.SMTP(host, port, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
    try:
        server.login(login, password)
        for to_email, msg in messages:
            try:
                server.sendmail(login, [to_email], msg.as_string())
                sent += 1
            except Exception:
                failed += 1
    finally:
        try:
            server.quit()
        except Exception:
            pass
    return sent, failed


def audience_sql():
    return f"FROM {SCHEMA}.users WHERE email_verified = true AND mailing_optout = false AND email <> ''"


def handler(event: dict, context) -> dict:
    """Рассылка писем зарегистрированным пользователям: подсчёт получателей, тестовое письмо себе, отправка пачками (только администратор), отписка по ссылке из письма."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors(), 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        params = event.get('queryStringParameters') or {}

        if method == 'GET' and params.get('unsubscribe'):
            cur.execute(
                f"UPDATE {SCHEMA}.users SET mailing_optout = true WHERE unsub_token = %s RETURNING id",
                (params['unsubscribe'],),
            )
            found = cur.fetchone()
            conn.commit()
            if not found:
                return resp(404, {'error': 'Ссылка недействительна'})
            return resp(200, {'ok': True})

        me = admin_email(cur, event)
        if not me:
            return resp(403, {'error': 'Нет доступа'})

        if method == 'GET':
            cur.execute(f"SELECT COUNT(*) {audience_sql()}")
            total = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users WHERE mailing_optout = true")
            optout = cur.fetchone()[0]
            return resp(200, {'recipients': total, 'unsubscribed': optout, 'batch': BATCH})

        body = json.loads(event.get('body') or '{}')
        subject = (body.get('subject') or '').strip()[:200]
        text = (body.get('text') or '').strip()[:10000]
        origin = (body.get('origin') or '').rstrip('/')
        if not subject or not text:
            return resp(400, {'error': 'Заполните тему и текст письма'})
        if not origin.startswith('http'):
            return resp(400, {'error': 'Не удалось определить адрес сайта'})

        if body.get('action') == 'test':
            cur.execute(f"SELECT unsub_token FROM {SCHEMA}.users WHERE email = %s", (me,))
            row = cur.fetchone()
            link = f"{origin}/unsubscribe?token={row[0] if row else ''}"
            sent, failed = send_many([(me, build(me, '[Тест] ' + subject, text, link))])
            if not sent:
                return resp(502, {'error': 'Не удалось отправить тестовое письмо, проверьте настройки почты'})
            return resp(200, {'sent': sent, 'to': me})

        if body.get('action') == 'send':
            try:
                last_id = int(body.get('after_id') or 0)
            except (TypeError, ValueError):
                last_id = 0
            cur.execute(
                f"SELECT id, email, unsub_token {audience_sql()} AND id > %s ORDER BY id ASC LIMIT {BATCH}",
                (last_id,),
            )
            rows = cur.fetchall()
            if not rows:
                return resp(200, {'sent': 0, 'failed': 0, 'last_id': last_id, 'done': True})
            messages = [(r[1], build(r[1], subject, text, f"{origin}/unsubscribe?token={r[2]}")) for r in rows]
            sent, failed = send_many(messages)
            return resp(200, {'sent': sent, 'failed': failed, 'last_id': rows[-1][0], 'done': len(rows) < BATCH})

        return resp(400, {'error': 'Неизвестное действие'})
    finally:
        conn.close()
