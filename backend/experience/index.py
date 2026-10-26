import base64
import json
import os
import re
import uuid
from urllib.parse import quote
import boto3
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
MAX_FILE_BYTES = 10 * 1024 * 1024
KINDS = ('work', 'report')
FILE_TYPES = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}


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


def upload_file(data_b64, file_name):
    name = re.sub(r'[\\/\r\n\t]', '_', (file_name or '').strip())[:150]
    ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
    content_type = FILE_TYPES.get(ext)
    if not content_type:
        return None, None, 'Допустимы файлы PDF, Word, Excel и PowerPoint'
    try:
        raw = base64.b64decode(data_b64, validate=False)
    except Exception:
        return None, None, 'Не удалось прочитать файл'
    if not raw or len(raw) > MAX_FILE_BYTES:
        return None, None, 'Файл должен быть не больше 10 МБ'
    key = f"experience/{uuid.uuid4().hex}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(
        Bucket='files', Key=key, Body=raw, ContentType=content_type,
        ContentDisposition=f"attachment; filename*=UTF-8''{quote(name)}",
    )
    url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return url, name, None


def handler(event: dict, context) -> dict:
    """Трансляция опыта работы: лента готовых работ и докладов педагогов, публикация и скрытие своих материалов. Только для зарегистрированных пользователей."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors(), 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        user = get_user(cur, event)
        if not user:
            return resp(401, {'error': 'Трансляция опыта доступна только зарегистрированным педагогам'})
        user_id, name, email = user

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            if body.get('action') == 'hide':
                try:
                    post_id = int(body.get('id'))
                except (TypeError, ValueError):
                    return resp(400, {'error': 'Не указана публикация'})
                cur.execute(f"SELECT user_id FROM {SCHEMA}.experience_posts WHERE id = %s", (post_id,))
                row = cur.fetchone()
                if not row:
                    return resp(200, {'hidden': True})
                if row[0] != user_id and not is_admin(email):
                    return resp(403, {'error': 'Можно убирать только свои публикации'})
                cur.execute(f"UPDATE {SCHEMA}.experience_posts SET is_hidden = true WHERE id = %s", (post_id,))
                conn.commit()
                return resp(200, {'hidden': True})

            title = (body.get('title') or '').strip()
            description = (body.get('description') or '').strip()
            kind = body.get('kind') if body.get('kind') in KINDS else 'work'
            if not title:
                return resp(400, {'error': 'Укажите название'})
            if len(title) > 200:
                return resp(400, {'error': 'Название длиннее 200 символов'})
            if len(description) > 3000:
                return resp(400, {'error': 'Описание длиннее 3000 символов'})
            file_url, file_name = None, None
            if body.get('file'):
                file_url, file_name, err = upload_file(body['file'], body.get('file_name'))
                if err:
                    return resp(400, {'error': err})
            if not description and not file_url:
                return resp(400, {'error': 'Добавьте описание или прикрепите файл'})
            author = (name or '').strip() or email.split('@')[0]
            cur.execute(
                f"INSERT INTO {SCHEMA}.experience_posts (user_id, author_name, kind, title, description, file_url, file_name) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at",
                (user_id, author[:80], kind, title, description, file_url, file_name),
            )
            new_id, created_at = cur.fetchone()
            conn.commit()
            return resp(200, {'id': new_id, 'created_at': created_at})

        cur.execute(
            f"SELECT id, user_id, author_name, kind, title, description, file_url, file_name, created_at "
            f"FROM {SCHEMA}.experience_posts WHERE is_hidden = false ORDER BY id DESC LIMIT 100"
        )
        posts = [
            {'id': r[0], 'user_id': r[1], 'author': r[2], 'kind': r[3], 'title': r[4], 'description': r[5],
             'file_url': r[6], 'file_name': r[7], 'created_at': r[8]}
            for r in cur.fetchall()
        ]
        return resp(200, {'posts': posts, 'me': user_id, 'is_admin': is_admin(email)})
    finally:
        conn.close()
