import json
import os
import hashlib
import secrets
import base64
import uuid
import smtplib
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from datetime import datetime, timezone, timedelta
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')
DEFAULT_SITE_URL = os.environ.get('SITE_URL', 'https://urokai.ru')

PLANS = {
    'month': {'days': 30, 'amount': '99.00', 'label': 'Подписка УрокАИ на 1 месяц'},
    'year': {'days': 365, 'amount': '890.00', 'label': 'Подписка УрокАИ на 1 год'},
}

FREE_LIMIT = 3

USAGE_COLUMNS = {
    'lesson': 'lessons_used',
    'game': 'games_used',
    'intensive': 'intensives_used',
    'task': 'tasks_used',
}


def get_plan_for_user(cur, user_id):
    cur.execute(
        f"SELECT plan, is_active, expires_at FROM {SCHEMA}.subscriptions "
        f"WHERE user_id = %s ORDER BY started_at DESC LIMIT 1",
        (user_id,)
    )
    sub = cur.fetchone()
    if not sub:
        return 'free', None
    plan_val, is_active, expires_at = sub
    expired = expires_at is not None and expires_at < datetime.now(timezone.utc)
    if not is_active or expired:
        if is_active and expired:
            cur.execute(
                f"UPDATE {SCHEMA}.subscriptions SET is_active = false WHERE user_id = %s AND is_active = true",
                (user_id,)
            )
        return 'free', None
    return plan_val, expires_at.isoformat() if expires_at else None


def get_usage_for_user(cur, user_id):
    cur.execute(
        f"SELECT lessons_used, games_used, intensives_used, tasks_used "
        f"FROM {SCHEMA}.usage_counts WHERE user_id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    if not row:
        cur.execute(f"INSERT INTO {SCHEMA}.usage_counts (user_id) VALUES (%s)", (user_id,))
        return {'lesson': 0, 'game': 0, 'intensive': 0, 'task': 0}
    lessons, games, intensives, tasks = row
    return {'lesson': lessons or 0, 'game': games or 0, 'intensive': intensives or 0, 'task': tasks or 0}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def hash_password(password: str) -> str:
    salt = 'urokai_static_salt_v1'
    return hashlib.sha256((salt + password).encode()).hexdigest()


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Content-Type': 'application/json'
    }


def get_token(event):
    headers = event.get('headers') or {}
    return headers.get('X-Authorization') or headers.get('x-authorization')


def get_user_id_by_token(cur, token):
    if not token:
        return None
    cur.execute(
        f"SELECT user_id FROM {SCHEMA}.sessions WHERE token = %s AND expires_at > now()",
        (token,)
    )
    row = cur.fetchone()
    return row[0] if row else None


def yookassa_auth_header():
    shop_id = os.environ.get('YKASSA_SHOP_ID') or os.environ.get('API_KEY_ID')
    secret_key = os.environ['API_YKASSA']
    creds = base64.b64encode(f"{shop_id}:{secret_key}".encode()).decode()
    return f"Basic {creds}"


def send_reset_email(to_email: str, reset_link: str):
    host = os.environ.get('SMTP_HOST')
    port = int(os.environ.get('SMTP_PORT', '465'))
    login = os.environ.get('SMTP_LOGIN')
    password = os.environ.get('SMTP_PASSWORD')

    if not host or not login or not password:
        raise RuntimeError('SMTP не настроен')

    subject = 'Восстановление доступа к УрокАИ'
    text = (
        f"Здравствуйте!\n\n"
        f"Вы запросили восстановление доступа к личному кабинету УрокАИ.\n"
        f"Перейдите по ссылке, чтобы задать новый пароль (ссылка действует 1 час):\n\n"
        f"{reset_link}\n\n"
        f"Если вы не запрашивали восстановление доступа, просто проигнорируйте это письмо."
    )
    msg = MIMEText(text, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = login
    msg['To'] = to_email

    if port == 465:
        with smtplib.SMTP_SSL(host, port, timeout=15) as server:
            server.login(login, password)
            server.sendmail(login, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(login, password)
            server.sendmail(login, [to_email], msg.as_string())


def handler(event: dict, context) -> dict:
    """Личный кабинет УрокАИ: регистрация/вход/выход, восстановление доступа по email, серверный учёт бесплатных генераций (лимит 3), сохранение материалов и оплата подписки через ЮКассу."""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            token = get_token(event)
            if not token:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Токен не передан'})}

            cur.execute(
                f"SELECT u.id, u.email, u.name FROM {SCHEMA}.sessions s "
                f"JOIN {SCHEMA}.users u ON u.id = s.user_id "
                f"WHERE s.token = %s AND s.expires_at > now()",
                (token,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Сессия истекла'})}

            user_id, email, name = row
            plan, expires_at = get_plan_for_user(cur, user_id)
            usage = get_usage_for_user(cur, user_id)
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'user': {'id': user_id, 'email': email, 'name': name},
                    'plan': plan,
                    'expires_at': expires_at,
                    'usage': usage,
                    'free_limit': FREE_LIMIT,
                })
            }

        body_data = json.loads(event.get('body') or '{}')
        action = body_data.get('action')

        if action == 'register':
            email = (body_data.get('email') or '').strip().lower()
            password = body_data.get('password') or ''
            name = (body_data.get('name') or '').strip()
            privacy_accepted = bool(body_data.get('privacy_accepted'))

            if not email or '@' not in email:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Некорректный email'})}
            if len(password) < 6:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Пароль должен быть не короче 6 символов'})}
            if not privacy_accepted:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Необходимо согласиться с политикой обработки персональных данных'})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': cors_headers(), 'body': json.dumps({'error': 'Пользователь с таким email уже зарегистрирован'})}

            pw_hash = hash_password(password)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (email, password_hash, name, privacy_accepted_at) VALUES (%s, %s, %s, now()) RETURNING id",
                (email, pw_hash, name or email.split('@')[0])
            )
            user_id = cur.fetchone()[0]

            cur.execute(f"INSERT INTO {SCHEMA}.usage_counts (user_id) VALUES (%s)", (user_id,))
            cur.execute(f"INSERT INTO {SCHEMA}.subscriptions (user_id, plan) VALUES (%s, 'free')", (user_id,))

            token = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'email': email, 'name': name},
                    'plan': 'free',
                    'usage': {'lesson': 0, 'game': 0, 'intensive': 0, 'task': 0},
                    'free_limit': FREE_LIMIT,
                })
            }

        elif action == 'login':
            email = (body_data.get('email') or '').strip().lower()
            password = body_data.get('password') or ''
            pw_hash = hash_password(password)

            cur.execute(f"SELECT id, name FROM {SCHEMA}.users WHERE email = %s AND password_hash = %s", (email, pw_hash))
            row = cur.fetchone()
            if not row:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неверный email или пароль'})}

            user_id, name = row
            token = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, token))

            plan, _ = get_plan_for_user(cur, user_id)
            usage = get_usage_for_user(cur, user_id)
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'token': token,
                    'user': {'id': user_id, 'email': email, 'name': name},
                    'plan': plan,
                    'usage': usage,
                    'free_limit': FREE_LIMIT,
                })
            }

        elif action == 'logout':
            token = get_token(event)
            if token:
                cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE token = %s", (token,))
                conn.commit()
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}

        elif action == 'forgot_password':
            email = (body_data.get('email') or '').strip().lower()
            if not email or '@' not in email:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Некорректный email'})}

            cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE email = %s", (email,))
            row = cur.fetchone()

            # Не раскрываем, существует ли email — всегда одинаковый ответ
            generic_response = {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'ok': True, 'message': 'Если такой email зарегистрирован, на него отправлено письмо с инструкцией'})
            }

            if not row:
                return generic_response

            user_id = row[0]
            reset_token = secrets.token_urlsafe(32)
            expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
            cur.execute(
                f"INSERT INTO {SCHEMA}.password_resets (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user_id, reset_token, expires_at)
            )
            conn.commit()

            headers_in = event.get('headers') or {}
            origin = (
                body_data.get('origin')
                or headers_in.get('Origin')
                or headers_in.get('origin')
                or headers_in.get('Referer')
                or headers_in.get('referer')
                or DEFAULT_SITE_URL
            ).rstrip('/')
            reset_link = f"{origin}/reset-password?token={reset_token}"
            try:
                send_reset_email(email, reset_link)
            except Exception as e:
                print(f"[send_reset_email] FAILED to send to {email}: {type(e).__name__}: {e}")

            return generic_response

        elif action == 'reset_password':
            reset_token = body_data.get('token') or ''
            new_password = body_data.get('new_password') or ''

            if not reset_token:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Токен не передан'})}
            if len(new_password) < 6:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Пароль должен быть не короче 6 символов'})}

            cur.execute(
                f"SELECT id, user_id, expires_at, used FROM {SCHEMA}.password_resets WHERE token = %s",
                (reset_token,)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Ссылка недействительна'})}

            reset_id, user_id, expires_at, used = row
            if used:
                return {'statusCode': 410, 'headers': cors_headers(), 'body': json.dumps({'error': 'Ссылка уже была использована'})}
            if expires_at < datetime.now(timezone.utc):
                return {'statusCode': 410, 'headers': cors_headers(), 'body': json.dumps({'error': 'Срок действия ссылки истёк'})}

            new_hash = hash_password(new_password)
            cur.execute(f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s", (new_hash, user_id))
            cur.execute(f"UPDATE {SCHEMA}.password_resets SET used = true WHERE id = %s", (reset_id,))
            cur.execute(f"DELETE FROM {SCHEMA}.sessions WHERE user_id = %s", (user_id,))

            token = secrets.token_hex(32)
            cur.execute(f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES (%s, %s)", (user_id, token))
            conn.commit()

            cur.execute(f"SELECT email, name FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            email, name = cur.fetchone()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'ok': True, 'token': token, 'user': {'id': user_id, 'email': email, 'name': name}})
            }

        elif action == 'register_use':
            user_id = get_user_id_by_token(cur, get_token(event))
            if not user_id:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется вход в личный кабинет'})}

            gen_type = body_data.get('type')
            column = USAGE_COLUMNS.get(gen_type)
            if not column:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестный тип генератора'})}

            plan, _ = get_plan_for_user(cur, user_id)
            is_paid = plan != 'free'

            usage = get_usage_for_user(cur, user_id)
            current = usage.get(gen_type, 0)

            if not is_paid and current >= FREE_LIMIT:
                return {
                    'statusCode': 403,
                    'headers': cors_headers(),
                    'body': json.dumps({'error': 'Бесплатный лимит исчерпан', 'usage': usage, 'free_limit': FREE_LIMIT})
                }

            cur.execute(
                f"UPDATE {SCHEMA}.usage_counts SET {column} = {column} + 1, updated_at = now() WHERE user_id = %s",
                (user_id,)
            )
            conn.commit()

            usage[gen_type] = current + 1

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'ok': True, 'usage': usage, 'free_limit': FREE_LIMIT})
            }

        elif action == 'save_material':
            user_id = get_user_id_by_token(cur, get_token(event))
            if not user_id:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется вход в личный кабинет'})}

            m_type = (body_data.get('type') or 'lesson').strip()
            title = (body_data.get('title') or '').strip()
            content = body_data.get('content') or ''
            if not title:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Не указан заголовок материала'})}

            cur.execute(
                f"INSERT INTO {SCHEMA}.saved_materials (user_id, type, title, content) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
                (user_id, m_type, title, content)
            )
            new_id, created_at = cur.fetchone()
            conn.commit()

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'id': new_id, 'created_at': created_at.isoformat()})
            }

        elif action == 'list_materials':
            user_id = get_user_id_by_token(cur, get_token(event))
            if not user_id:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется вход в личный кабинет'})}

            cur.execute(
                f"SELECT id, type, title, created_at FROM {SCHEMA}.saved_materials "
                f"WHERE user_id = %s AND is_archived = false ORDER BY created_at DESC",
                (user_id,)
            )
            items = [
                {'id': r[0], 'type': r[1], 'title': r[2], 'created_at': r[3].isoformat()}
                for r in cur.fetchall()
            ]
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'items': items})}

        elif action == 'get_material':
            user_id = get_user_id_by_token(cur, get_token(event))
            if not user_id:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется вход в личный кабинет'})}

            material_id = body_data.get('id')
            cur.execute(
                f"SELECT id, type, title, content, created_at FROM {SCHEMA}.saved_materials "
                f"WHERE id = %s AND user_id = %s",
                (material_id, user_id)
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Материал не найден'})}

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({'id': row[0], 'type': row[1], 'title': row[2], 'content': row[3], 'created_at': row[4].isoformat()})
            }

        elif action == 'delete_material':
            user_id = get_user_id_by_token(cur, get_token(event))
            if not user_id:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется вход в личный кабинет'})}

            material_id = body_data.get('id')
            cur.execute(
                f"UPDATE {SCHEMA}.saved_materials SET is_archived = true WHERE id = %s AND user_id = %s",
                (material_id, user_id)
            )
            conn.commit()
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'ok': True})}

        elif action == 'create_payment':
            user_id = get_user_id_by_token(cur, get_token(event))
            if not user_id:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется вход в личный кабинет'})}

            plan_key = body_data.get('plan')
            plan = PLANS.get(plan_key)
            if not plan:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестный тариф'})}

            return_url = body_data.get('return_url') or 'https://urokai.ru/'

            payment_payload = {
                'amount': {'value': plan['amount'], 'currency': 'RUB'},
                'confirmation': {'type': 'redirect', 'return_url': return_url},
                'capture': True,
                'description': plan['label'],
                'metadata': {'user_id': str(user_id), 'plan': plan_key},
            }

            req = urllib.request.Request(
                'https://api.yookassa.ru/v3/payments',
                data=json.dumps(payment_payload).encode(),
                method='POST',
                headers={
                    'Authorization': yookassa_auth_header(),
                    'Content-Type': 'application/json',
                    'Idempotence-Key': str(uuid.uuid4()),
                }
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    result = json.loads(resp.read().decode())
            except urllib.error.HTTPError as e:
                error_body = e.read().decode()
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': f'ЮКасса: {error_body}'})}

            return {
                'statusCode': 200,
                'headers': cors_headers(),
                'body': json.dumps({
                    'payment_id': result.get('id'),
                    'confirmation_url': result.get('confirmation', {}).get('confirmation_url'),
                })
            }

        elif action == 'check_payment':
            user_id = get_user_id_by_token(cur, get_token(event))
            if not user_id:
                return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется вход в личный кабинет'})}

            payment_id = body_data.get('payment_id')
            if not payment_id:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Не передан payment_id'})}

            req = urllib.request.Request(
                f'https://api.yookassa.ru/v3/payments/{payment_id}',
                method='GET',
                headers={'Authorization': yookassa_auth_header()}
            )
            try:
                with urllib.request.urlopen(req, timeout=15) as resp:
                    result = json.loads(resp.read().decode())
            except urllib.error.HTTPError as e:
                error_body = e.read().decode()
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': f'ЮКасса: {error_body}'})}

            status = result.get('status')
            paid = result.get('paid', False)

            if status == 'succeeded' and paid:
                metadata = result.get('metadata') or {}
                plan_key = metadata.get('plan')
                plan = PLANS.get(plan_key)
                if plan:
                    expires_at = datetime.now(timezone.utc) + timedelta(days=plan['days'])
                    cur.execute(
                        f"UPDATE {SCHEMA}.subscriptions SET is_active = false WHERE user_id = %s AND is_active = true",
                        (user_id,)
                    )
                    plan_label = '30days' if plan_key == 'month' else 'year'
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.subscriptions (user_id, plan, expires_at, is_active) VALUES (%s, %s, %s, true)",
                        (user_id, plan_label, expires_at)
                    )
                    conn.commit()
                    return {
                        'statusCode': 200,
                        'headers': cors_headers(),
                        'body': json.dumps({'status': status, 'paid': True, 'plan': plan_label, 'expires_at': expires_at.isoformat()})
                    }

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'status': status, 'paid': paid})}

        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестное действие'})}

    finally:
        cur.close()
        conn.close()