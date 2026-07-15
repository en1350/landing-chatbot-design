import json
import os
import urllib.request
import urllib.error

AITUNNEL_URL = "https://api.aitunnel.ru/v1/chat/completions"
MODEL = "gpt-4o-mini"
VISION_MODEL = "gpt-4o-mini"


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Content-Type': 'application/json'
    }


def call_ai(messages: list, temperature: float = 0.7, model: str = MODEL) -> str:
    api_key = os.environ['AITUNNEL_API_KEY']
    payload = json.dumps({
        'model': model,
        'messages': messages,
        'temperature': temperature,
    }).encode('utf-8')

    req = urllib.request.Request(
        AITUNNEL_URL,
        data=payload,
        method='POST',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        }
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode())
    return data['choices'][0]['message']['content'].strip()


LESSON_DURATION_MAP = {
    '45': {'org': 3, 'act': 7, 'new': 15, 'practice': 15, 'reflect': 3, 'homework': 2},
    '90': {'org': 5, 'act': 15, 'new': 30, 'practice': 30, 'reflect': 7, 'homework': 3},
}


def build_lesson_prompt(f: dict) -> str:
    subject = f.get('subject') or 'дисциплина не указана'
    topic = f.get('topic') or 'новая тема'
    goal = f.get('goal') or f'сформировать понимание темы «{topic}»'
    tasks = f.get('tasks') or 'не указаны'
    technology = f.get('technology') or 'смешанное обучение'
    age_count = f.get('ageCount') or 'не указано'
    duration = f.get('duration') or '45'
    t = LESSON_DURATION_MAP.get(duration, LESSON_DURATION_MAP['45'])

    return f"""Ты опытный методист-педагог. Составь подробный план урока на русском языке по следующим параметрам:

Предмет/дисциплина: {subject}
Тема: {topic}
Цель: {goal}
Задачи: {tasks}
Технология обучения: {technology}
Возраст / количество человек: {age_count}
Время урока: {duration} минут

Структура плана строго такая (не меняй порядок и названия этапов), укажи рекомендованное время по каждому этапу (в сумме {duration} мин, ориентируйся на: оргмомент {t['org']} мин, актуализация {t['act']} мин, новая тема {t['new']} мин, практика {t['practice']} мин, рефлексия {t['reflect']} мин, домашнее задание {t['homework']} мин):

1. Организационный момент
2. Актуализация темы
3. Сообщение новой темы
4. Закрепление / выполнение практической части
5. Рефлексия
6. Домашнее задание

Для каждого этапа опиши конкретные действия учителя и учеников, а не общие фразы. Пиши развёрнуто, по-деловому, без markdown-разметки (без **, #), используй обычный текст с переносами строк и нумерацией."""


GAME_LABELS = {'5': '5 минут', '15': '15 минут', '45': '45 минут'}


def build_game_prompt(f: dict) -> str:
    subject = f.get('subject') or 'дисциплина не указана'
    duration = f.get('duration') or '15'
    people = f.get('peopleCount') or 'не указано'
    duration_label = GAME_LABELS.get(duration, duration + ' минут')

    return f"""Ты опытный педагог-игропрактик. Придумай образовательную игру на русском языке по параметрам:

Предмет/дисциплина: {subject}
Время игры: {duration_label}
Количество участников: {people}

Опиши: формат игры, деление на команды (если нужно), пошаговый сценарий с таймингом внутри отведённого времени, правила, критерии подведения итогов. Пиши конкретно и практично, без markdown-разметки (без **, #), обычным текстом с нумерацией шагов."""


def build_intensive_prompt(f: dict) -> str:
    topic = f.get('topic') or 'новая тема'
    grade = f.get('grade') or '7 класс'

    return f"""Ты опытный методист. Составь программу 3-дневного образовательного интенсива или мастер-класса на русском языке по теме «{topic}» для аудитории: {grade}.

Опиши по каждому дню: цель дня, содержание, форматы работы (лекция/практика/проект), материалы. Добавь список итоговых материалов курса. Пиши конкретно, без markdown-разметки (без **, #), обычным текстом."""


def build_task_prompt(f: dict) -> str:
    topic = f.get('topic') or 'новая тема'
    grade = f.get('grade') or '7 класс'

    return f"""Ты опытный педагог. Составь комплект учебных заданий на русском языке по теме «{topic}» для уровня: {grade}.

Сделай минимум 3 задания трёх уровней сложности (базовый, средний, продвинутый), для каждого укажи формулировку и критерии оценивания. Пиши конкретно и практично, без markdown-разметки (без **, #), обычным текстом с нумерацией."""


CHAT_SYSTEM_PROMPT = """Ты ИИ-помощник УрокАИ для учителей и педагогов. Ты дружелюбно и по-деловому помогаешь с методическими вопросами: как составить план урока, придумать игру, оценить работу учеников, подобрать технологию обучения и т.д.

Правила:
- Отвечай кратко (3-6 предложений), по-деловому, дружелюбно, на русском языке
- Если вопрос касается урока, игры, интенсива или задания — porекомендуй использовать соответствующий генератор на сайте (Генератор уроков / Генератор игры / Генератор интенсивов / Генератор заданий)
- Если вопрос про проверку тетрадей — упомяни раздел «Проверка тетради по фото»
- Не пиши markdown-разметку (без **, #)
- Можешь использовать 1-2 уместных эмодзи"""


def build_decompose_prompt(competency: str) -> str:
    c = competency or 'выбранная компетенция'
    return f"""Ты опытный методист, специалист по таксономии Блума. Разложи компетенцию «{c}» на 5 уровней освоения по таксономии Блума: Знание, Понимание, Применение, Анализ, Оценка.

Для каждого уровня напиши одно развёрнутое предложение (что конкретно умеет ученик на этом уровне применительно к компетенции «{c}»).

Верни ответ СТРОГО в формате JSON-массива без каких-либо дополнительных пояснений, markdown или текста до/после:
[
  {{"level": "Знание", "desc": "..."}},
  {{"level": "Понимание", "desc": "..."}},
  {{"level": "Применение", "desc": "..."}},
  {{"level": "Анализ", "desc": "..."}},
  {{"level": "Оценка", "desc": "..."}}
]"""


NOTEBOOK_SYSTEM_PROMPT = """Ты опытный педагог-эксперт, который проверяет фотографии тетрадей учеников. Проанализируй изображение: найди выполненные задания, определи ошибки, оцени качество и аккуратность оформления.

Верни ответ СТРОГО в формате JSON без markdown, пояснений или текста до/после:
{"score": <целое число 0-100, процент правильности>, "correct": <целое число, сколько заданий верно>, "total": <целое число, сколько всего заданий видно на фото>, "notes": ["замечание 1", "замечание 2", "замечание 3"]}

Если на фото не видно учебной работы (тетради, заданий), верни: {"score": 0, "correct": 0, "total": 0, "notes": ["На фото не удалось распознать учебную работу. Попробуйте сделать снимок чётче и ближе."]}

Замечания пиши кратко, конкретно, на русском языке, с указанием номера задания если возможно."""


def handler(event: dict, context) -> dict:
    """Генерация учебных материалов, ИИ-чат-помощник, проверка тетради по фото и декомпозитор компетенций через ИИ AITunnel."""
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': ''}

    if method != 'POST':
        return {'statusCode': 405, 'headers': cors_headers(), 'body': json.dumps({'error': 'Метод не поддерживается'})}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')

    try:
        if action == 'generate':
            gen_type = body.get('type')
            fields = body.get('fields') or {}

            if gen_type == 'lesson':
                prompt = build_lesson_prompt(fields)
            elif gen_type == 'game':
                prompt = build_game_prompt(fields)
            elif gen_type == 'intensive':
                prompt = build_intensive_prompt(fields)
            elif gen_type == 'task':
                prompt = build_task_prompt(fields)
            else:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестный тип генератора'})}

            content = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-методист, помогаешь учителям готовить материалы к урокам. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': prompt},
            ])

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'refine':
            current_content = body.get('content') or ''
            instruction = body.get('instruction') or ''

            if not current_content or not instruction:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Нужны текущий материал и инструкция для доработки'})}

            prompt = f"""Вот текущий учебный материал:

---
{current_content}
---

Доработай или отладь этот материал по инструкции преподавателя: «{instruction}»

Верни ПОЛНЫЙ обновлённый текст материала целиком (не только изменённую часть), сохраняя общую структуру, без markdown-разметки (без **, #), обычным текстом."""

            content = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-методист, дорабатываешь и отлаживаешь учебные материалы по запросу преподавателя. Отвечай всегда на русском языке, возвращай полный обновлённый текст.'},
                {'role': 'user', 'content': prompt},
            ])

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'chat':
            history = body.get('history') or []
            user_message = body.get('message') or ''

            if not user_message.strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Сообщение не может быть пустым'})}

            messages = [{'role': 'system', 'content': CHAT_SYSTEM_PROMPT}]
            for m in history[-10:]:
                role = 'user' if m.get('role') == 'user' else 'assistant'
                messages.append({'role': role, 'content': m.get('text', '')})
            messages.append({'role': 'user', 'content': user_message})

            reply = call_ai(messages, temperature=0.8)
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'reply': reply}, ensure_ascii=False)}

        elif action == 'decompose':
            competency = body.get('competency') or ''
            if not competency.strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите компетенцию'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты эксперт-методист по таксономии Блума. Отвечаешь строго валидным JSON без markdown и пояснений.'},
                {'role': 'user', 'content': build_decompose_prompt(competency)},
            ], temperature=0.6)

            cleaned = raw.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.strip('`')
                if cleaned.lower().startswith('json'):
                    cleaned = cleaned[4:]
            try:
                levels = json.loads(cleaned)
            except json.JSONDecodeError:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный формат, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'levels': levels}, ensure_ascii=False)}

        elif action == 'notebook_check':
            image_base64 = body.get('image_base64') or ''
            if not image_base64:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Не передано изображение'})}

            if not image_base64.startswith('data:'):
                image_base64 = f'data:image/jpeg;base64,{image_base64}'

            raw = call_ai([
                {'role': 'system', 'content': NOTEBOOK_SYSTEM_PROMPT},
                {
                    'role': 'user',
                    'content': [
                        {'type': 'text', 'text': 'Проверь эту работу ученика и верни результат строго в формате JSON, описанном в системном промпте.'},
                        {'type': 'image_url', 'image_url': {'url': image_base64}},
                    ],
                },
            ], temperature=0.4, model=VISION_MODEL)

            cleaned = raw.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.strip('`')
                if cleaned.lower().startswith('json'):
                    cleaned = cleaned[4:]
            try:
                result = json.loads(cleaned)
            except json.JSONDecodeError:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный формат, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, ensure_ascii=False)}

        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестное действие'})}

    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': f'Ошибка ИИ-сервиса: {error_body}'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}
