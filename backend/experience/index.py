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


def is_paid(cur, user_id):
    cur.execute(
        f"SELECT plan FROM {SCHEMA}.subscriptions WHERE user_id = %s AND is_active = true "
        f"AND (expires_at IS NULL OR expires_at > now()) ORDER BY started_at DESC LIMIT 1",
        (user_id,),
    )
    row = cur.fetchone()
    return bool(row and row[0] != 'free')


def material_to_post(m_type, title, content):
    image_url, description = None, ''
    try:
        data = json.loads(content or '{}')
    except Exception:
        data = None
    if m_type == 'infographic' and isinstance(data, dict):
        image_url = data.get('image') if str(data.get('image', '')).startswith('http') else None
        description = f"Инфографика. Дисциплина: {data.get('subject', '')}. Тема: {data.get('topic', '')}."
        return 'work', image_url, description
    if m_type == 'presentation' and isinstance(data, dict):
        titles = [str(sl.get('title', '')) for sl in (data.get('slides') or []) if isinstance(sl, dict)]
        return 'work', None, 'Презентация. Слайды: ' + '; '.join(t for t in titles if t)
    if m_type == 'project' and isinstance(data, dict):
        plan = data.get('plan') or {}
        goal = plan.get('goal') or plan.get('description') or ''
        return 'work', None, f"План проекта. {goal}".strip()
    return 'work', None, (content or '')[:3000]


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
    """Трансляция опыта работы: открытая для просмотра лента работ и докладов педагогов; публикация для зарегистрированных, лайки и комментарии для платных пользователей."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors(), 'Access-Control-Max-Age': '86400'}, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    try:
        cur = conn.cursor()
        user = get_user(cur, event)
        user_id, name, email = user if user else (None, None, None)
        paid = bool(user_id) and is_paid(cur, user_id)
        author = ((name or '').strip() or (email or 'user').split('@')[0])[:80]

        if method == 'POST':
            if not user_id:
                return resp(401, {'error': 'Войдите в личный кабинет'})
            body = json.loads(event.get('body') or '{}')
            action = body.get('action')

            if action == 'hide':
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

            if action == 'like':
                if not paid:
                    return resp(403, {'error': 'Лайки доступны по платной подписке'})
                try:
                    post_id = int(body.get('id'))
                except (TypeError, ValueError):
                    return resp(400, {'error': 'Не указана публикация'})
                cur.execute(f"SELECT 1 FROM {SCHEMA}.experience_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))
                if cur.fetchone():
                    cur.execute(f"DELETE FROM {SCHEMA}.experience_likes WHERE post_id = %s AND user_id = %s", (post_id, user_id))
                    liked = False
                else:
                    cur.execute(f"INSERT INTO {SCHEMA}.experience_likes (post_id, user_id) VALUES (%s, %s)", (post_id, user_id))
                    liked = True
                conn.commit()
                cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.experience_likes WHERE post_id = %s", (post_id,))
                return resp(200, {'liked': liked, 'likes': cur.fetchone()[0]})

            if action == 'comment':
                if not paid:
                    return resp(403, {'error': 'Комментарии доступны по платной подписке'})
                try:
                    post_id = int(body.get('id'))
                except (TypeError, ValueError):
                    return resp(400, {'error': 'Не указана публикация'})
                text = (body.get('text') or '').strip()
                if not text:
                    return resp(400, {'error': 'Пустой комментарий'})
                if len(text) > 1000:
                    return resp(400, {'error': 'Комментарий длиннее 1000 символов'})
                cur.execute(
                    f"INSERT INTO {SCHEMA}.experience_comments (post_id, user_id, author_name, text) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                    (post_id, user_id, author, text),
                )
                new_id, created_at = cur.fetchone()
                conn.commit()
                return resp(200, {'id': new_id, 'created_at': created_at, 'author': author, 'text': text, 'user_id': user_id})

            if action == 'hide_comment':
                try:
                    cid = int(body.get('id'))
                except (TypeError, ValueError):
                    return resp(400, {'error': 'Не указан комментарий'})
                cur.execute(f"SELECT user_id FROM {SCHEMA}.experience_comments WHERE id = %s", (cid,))
                row = cur.fetchone()
                if row and (row[0] == user_id or is_admin(email)):
                    cur.execute(f"UPDATE {SCHEMA}.experience_comments SET is_hidden = true WHERE id = %s", (cid,))
                    conn.commit()
                    return resp(200, {'hidden': True})
                return resp(403, {'error': 'Можно убирать только свои комментарии'})

            if action == 'publish_material':
                try:
                    mid = int(body.get('id'))
                except (TypeError, ValueError):
                    return resp(400, {'error': 'Не указан материал'})
                cur.execute(
                    f"SELECT type, title, content FROM {SCHEMA}.saved_materials WHERE id = %s AND user_id = %s AND is_archived = false",
                    (mid, user_id),
                )
                row = cur.fetchone()
                if not row:
                    return resp(404, {'error': 'Материал не найден'})
                kind, image_url, description = material_to_post(*row)
                cur.execute(
                    f"INSERT INTO {SCHEMA}.experience_posts (user_id, author_name, kind, title, description, image_url) "
                    f"VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                    (user_id, author, kind, row[1][:200], description[:3000], image_url),
                )
                new_id = cur.fetchone()[0]
                conn.commit()
                return resp(200, {'id': new_id})

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
            cur.execute(
                f"INSERT INTO {SCHEMA}.experience_posts (user_id, author_name, kind, title, description, file_url, file_name) "
                f"VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id, created_at",
                (user_id, author, kind, title, description, file_url, file_name),
            )
            new_id, created_at = cur.fetchone()
            conn.commit()
            return resp(200, {'id': new_id, 'created_at': created_at})

        params = event.get('queryStringParameters') or {}
        if params.get('post_id'):
            try:
                pid = int(params['post_id'])
            except ValueError:
                return resp(400, {'error': 'Некорректная публикация'})
            cur.execute(
                f"SELECT id, user_id, author_name, text, created_at FROM {SCHEMA}.experience_comments "
                f"WHERE post_id = %s AND is_hidden = false ORDER BY id ASC LIMIT 200",
                (pid,),
            )
            comments = [{'id': r[0], 'user_id': r[1], 'author': r[2], 'text': r[3], 'created_at': r[4]} for r in cur.fetchall()]
            return resp(200, {'comments': comments})

        cur.execute(
            f"SELECT p.id, p.user_id, p.author_name, p.kind, p.title, p.description, p.file_url, p.file_name, p.created_at, p.image_url, "
            f"(SELECT COUNT(*) FROM {SCHEMA}.experience_likes l WHERE l.post_id = p.id), "
            f"(SELECT COUNT(*) FROM {SCHEMA}.experience_comments c WHERE c.post_id = p.id AND c.is_hidden = false), "
            f"EXISTS (SELECT 1 FROM {SCHEMA}.experience_likes l2 WHERE l2.post_id = p.id AND l2.user_id = %s) "
            f"FROM {SCHEMA}.experience_posts p WHERE p.is_hidden = false ORDER BY p.id DESC LIMIT 100",
            (user_id or 0,),
        )
        posts = [
            {'id': r[0], 'user_id': r[1], 'author': r[2], 'kind': r[3], 'title': r[4], 'description': r[5],
             'file_url': r[6], 'file_name': r[7], 'created_at': r[8], 'image_url': r[9],
             'likes': r[10], 'comments': r[11], 'liked': r[12]}
            for r in cur.fetchall()
        ]
        return resp(200, {'posts': posts, 'me': user_id, 'paid': paid, 'is_admin': bool(user_id) and is_admin(email)})
    finally:
        conn.close()
