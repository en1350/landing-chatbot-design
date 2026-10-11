import base64
import json
import os
import urllib.request
import urllib.error
import uuid
import boto3
import psycopg2

IMAGES_URL = "https://api.aitunnel.ru/v1/images/generations"
IMAGE_MODEL = "recraft-v4.1-flash"
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')

STYLE_HINTS = {
    'modern': 'clean modern flat vector illustration, minimal, blue palette, white background',
    'creative': 'colorful artistic illustration, warm orange and pink tones, expressive hand-drawn feel',
    'game': 'playful game-style illustration, vibrant purple and yellow, cartoon, fun',
    'storyteller': 'cinematic editorial illustration, warm natural light, storytelling mood, soft painterly style',
}


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Content-Type': 'application/json'
    }


def is_user_paid(event) -> bool:
    headers = event.get('headers') or {}
    token = headers.get('X-Authorization') or headers.get('x-authorization')
    if not token:
        return False
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"SELECT s.user_id FROM {SCHEMA}.sessions s WHERE s.token = %s AND s.expires_at > now()",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return False
        cur.execute(
            f"SELECT plan FROM {SCHEMA}.subscriptions WHERE user_id = %s AND is_active = true "
            f"AND (expires_at IS NULL OR expires_at > now()) ORDER BY started_at DESC LIMIT 1",
            (row[0],)
        )
        sub = cur.fetchone()
        cur.close()
        conn.close()
        return bool(sub and sub[0] != 'free')
    except Exception:
        return False


def err(status: int, message: str) -> dict:
    return {'statusCode': status, 'headers': cors_headers(), 'body': json.dumps({'error': message}, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    """Генерация иллюстрации для слайда презентации через AITunnel. Только для пользователей с платной подпиской. Возвращает картинку в формате data URL."""
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}
    if method != 'POST':
        return err(405, 'Метод не поддерживается')

    if not is_user_paid(event):
        return err(403, 'Генерация иллюстраций доступна по платной подписке')

    body = json.loads(event.get('body') or '{}')
    hint = (body.get('prompt') or '').strip()
    if not hint:
        return err(400, 'Опишите, что должно быть на картинке')
    topic = (body.get('topic') or '').strip()
    style = STYLE_HINTS.get(body.get('style') or 'modern', STYLE_HINTS['modern'])

    prompt = (
        f"Illustration for a presentation slide about «{topic}». {hint}. "
        f"Style: {style}. No text, no letters, no captions, no logos. If people appear, they have Slavic European appearance."
    )[:900]

    payload = json.dumps({
        'model': IMAGE_MODEL,
        'prompt': prompt,
        'n': 1,
        'aspect_ratio': '1:1',
    }).encode('utf-8')
    req = urllib.request.Request(
        IMAGES_URL,
        data=payload,
        method='POST',
        headers={
            'Authorization': f"Bearer {os.environ['AITUNNEL_API_KEY']}",
            'Content-Type': 'application/json',
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=55) as resp:
            data = json.loads(resp.read().decode())
        item = (data.get('data') or [{}])[0]
        if item.get('b64_json'):
            b64 = item['b64_json']
        elif item.get('url'):
            with urllib.request.urlopen(item['url'], timeout=30) as img:
                b64 = base64.b64encode(img.read()).decode()
        else:
            return err(502, 'ИИ не вернул изображение, попробуйте снова')
    except urllib.error.HTTPError as e:
        return err(502, f'Ошибка ИИ-сервиса: {e.read().decode()[:300]}')

    if b64.startswith('data:'):
        b64 = b64.split(',', 1)[1]
    mime = 'image/jpeg' if b64.startswith('/9j/') else 'image/webp' if b64.startswith('UklGR') else 'image/png'
    ext = {'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png'}[mime]

    cdn_url = None
    try:
        s3 = boto3.client(
            's3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        )
        key = f"presentations/{uuid.uuid4().hex}.{ext}"
        s3.put_object(Bucket='files', Key=key, Body=base64.b64decode(b64), ContentType=mime)
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    except Exception:
        cdn_url = None

    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps({'image': f'data:{mime};base64,{b64}', 'cdn_url': cdn_url})
    }
