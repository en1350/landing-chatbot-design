import base64
import json
import os
import uuid
import boto3
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
MAX_LEN = 1000
MAX_IMAGE_BYTES = 4 * 1024 * 1024
IMAGE_TYPES = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif'}


def upload_image(data_b64, content_type):
    ext = IMAGE_TYPES.get(content_type)
    if not ext:
        return None, 'Допустимы только JPG, PNG, WEBP или GIF'
    try:
        raw = base64.b64decode(data_b64, validate=False)
    except Exception:
        return None, 'Не удалось прочитать картинку'
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        return None, 'Картинка должна быть не больше 4 МБ'
    key = f"chat/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=raw, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}", None


def cors():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Content-Type': 'application/json',
    }


def resp(code, data):
    return {'statusCode': code, 'headers': cors(), 'body': json.dumps(data, default=str)}


def get_user(cur, event):
    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization')
    if not token:
        return None
    cur.execute(
        f"SELECT u.id, u.name, u.email FROM {SCHEMA}.sessions s JOIN {SCHEMA}.users u ON u.id = s.user_id "
        f"WHERE s.token = %s AND s.expires_at > now()",
        (token,),
    )
    return cur.fetchone()


def is_admin(email):
    admins = [e.strip().lower() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]
    return (email or '').lower() in admins


def handler(event: dict, context) -> dict:
    """Закрытый чат для зарегистрированных пользователей: список, отправка и удаление сообщений."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors(), 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        user = get_user(cur, event)
        if not user:
            return resp(401, {'error': 'Чат доступен только зарегистрированным пользователям'})
        user_id, name, email = user

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            if body.get('action') == 'delete':
                try:
                    msg_id = int(body.get('id'))
                except (TypeError, ValueError):
                    return resp(400, {'error': 'Не указано сообщение'})
                cur.execute(f"SELECT user_id FROM {SCHEMA}.chat_messages WHERE id = %s", (msg_id,))
                row = cur.fetchone()
                if not row:
                    return resp(200, {'deleted': True})
                if row[0] != user_id and not is_admin(email):
                    return resp(403, {'error': 'Можно удалять только свои сообщения'})
                cur.execute(f"DELETE FROM {SCHEMA}.chat_messages WHERE id = %s", (msg_id,))
                conn.commit()
                return resp(200, {'deleted': True})
            text = (body.get('message') or '').strip()
            image_url = None
            if body.get('image'):
                image_url, err = upload_image(body['image'], body.get('image_type') or '')
                if err:
                    return resp(400, {'error': err})
            if not text and not image_url:
                return resp(400, {'error': 'Пустое сообщение'})
            if len(text) > MAX_LEN:
                return resp(400, {'error': f'Сообщение длиннее {MAX_LEN} символов'})
            author = (name or '').strip() or email.split('@')[0]
            cur.execute(
                f"INSERT INTO {SCHEMA}.chat_messages (user_id, author_name, message, image_url) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (user_id, author[:80], text, image_url),
            )
            new_id, created_at = cur.fetchone()
            conn.commit()
            return resp(200, {'id': new_id, 'created_at': created_at})

        params = event.get('queryStringParameters') or {}
        if params.get('unread_after') is not None:
            try:
                after_id = int(params.get('unread_after') or 0)
            except ValueError:
                after_id = 0
            cur.execute(f"SELECT COALESCE(MAX(id), 0) FROM {SCHEMA}.chat_messages")
            latest_id = cur.fetchone()[0]
            cur.execute(
                f"SELECT COUNT(*) FROM {SCHEMA}.chat_messages WHERE id > %s AND user_id <> %s",
                (after_id, user_id),
            )
            return resp(200, {'unread': cur.fetchone()[0], 'latest_id': latest_id})
        try:
            since_id = int(params.get('since_id') or 0)
        except ValueError:
            since_id = 0

        if since_id > 0:
            cur.execute(
                f"SELECT id, user_id, author_name, message, created_at, image_url FROM {SCHEMA}.chat_messages "
                f"WHERE id > %s ORDER BY id ASC LIMIT 200",
                (since_id,),
            )
            rows = cur.fetchall()
        else:
            cur.execute(
                f"SELECT id, user_id, author_name, message, created_at, image_url FROM {SCHEMA}.chat_messages "
                f"ORDER BY id DESC LIMIT 100"
            )
            rows = list(reversed(cur.fetchall()))

        messages = [
            {'id': r[0], 'user_id': r[1], 'author': r[2], 'text': r[3], 'created_at': r[4], 'image_url': r[5]}
            for r in rows
        ]
        cur.execute(f"SELECT id FROM {SCHEMA}.chat_messages ORDER BY id DESC LIMIT 100")
        recent_ids = [r[0] for r in cur.fetchall()]
        return resp(200, {'messages': messages, 'me': user_id, 'is_admin': is_admin(email), 'recent_ids': recent_ids})
    finally:
        conn.close()
