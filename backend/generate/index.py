import json
import os
import urllib.request
import urllib.error
import psycopg2

AITUNNEL_URL = "https://api.aitunnel.ru/v1/chat/completions"
MODEL = "gpt-4o-mini"
VISION_MODEL = "gpt-4o-mini"
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization',
        'Content-Type': 'application/json'
    }


def get_token(event):
    headers = event.get('headers') or {}
    return headers.get('X-Authorization') or headers.get('x-authorization')


def is_user_paid(event) -> bool:
    token = get_token(event)
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
        user_id = row[0]
        cur.execute(
            f"SELECT plan FROM {SCHEMA}.subscriptions WHERE user_id = %s AND is_active = true "
            f"AND (expires_at IS NULL OR expires_at > now()) ORDER BY started_at DESC LIMIT 1",
            (user_id,)
        )
        sub = cur.fetchone()
        cur.close()
        conn.close()
        return bool(sub and sub[0] != 'free')
    except Exception:
        return False


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


def build_extra_context_lines(f: dict) -> str:
    lines = []
    regional = (f.get('regionalComponent') or '').strip()
    professional = (f.get('professionalOrientation') or '').strip()
    if regional:
        lines.append(f"Региональный компонент: {regional}")
    if professional:
        lines.append(f"Профессиональная направленность: {professional}")
    return ("\n" + "\n".join(lines)) if lines else ""


def build_extra_context_instruction(f: dict) -> str:
    regional = (f.get('regionalComponent') or '').strip()
    professional = (f.get('professionalOrientation') or '').strip()
    parts = []
    if regional:
        parts.append(f"обязательно учти региональный компонент «{regional}» (используй местные примеры, факты, реалии региона)")
    if professional:
        parts.append(f"обязательно учти профессиональную направленность «{professional}» (подбирай примеры и контекст под этот профиль)")
    return (" Также " + "; ".join(parts) + ".") if parts else ""


def build_lesson_prompt(f: dict) -> str:
    subject = f.get('subject') or 'дисциплина не указана'
    topic = f.get('topic') or 'новая тема'
    goal = f.get('goal') or f'сформировать понимание темы «{topic}»'
    tasks = f.get('tasks') or 'не указаны'
    technology = f.get('technology') or 'смешанное обучение'
    age_count = f.get('ageCount') or 'не указано'
    duration = f.get('duration') or '45'
    t = LESSON_DURATION_MAP.get(duration, LESSON_DURATION_MAP['45'])
    extra_lines = build_extra_context_lines(f)
    extra_instruction = build_extra_context_instruction(f)

    return f"""Ты опытный методист-педагог. Составь подробный план урока на русском языке по следующим параметрам:

Предмет/дисциплина: {subject}
Тема: {topic}
Цель: {goal}
Задачи: {tasks}
Технология обучения: {technology}
Возраст / количество человек: {age_count}
Время урока: {duration} минут{extra_lines}

Структура плана строго такая (не меняй порядок и названия этапов), укажи рекомендованное время по каждому этапу (в сумме {duration} мин, ориентируйся на: оргмомент {t['org']} мин, актуализация {t['act']} мин, новая тема {t['new']} мин, практика {t['practice']} мин, рефлексия {t['reflect']} мин, домашнее задание {t['homework']} мин):

1. Организационный момент
2. Актуализация темы
3. Сообщение новой темы
4. Закрепление / выполнение практической части
5. Рефлексия
6. Домашнее задание

Для каждого этапа опиши конкретные действия учителя и учеников, а не общие фразы.{extra_instruction} Пиши развёрнуто, по-деловому, без markdown-разметки (без **, #), используй обычный текст с переносами строк и нумерацией."""


GAME_LABELS = {'5': '5 минут', '15': '15 минут', '45': '45 минут'}


def build_game_prompt(f: dict) -> str:
    subject = f.get('subject') or 'дисциплина не указана'
    duration = f.get('duration') or '15'
    people = f.get('peopleCount') or 'не указано'
    duration_label = GAME_LABELS.get(duration, duration + ' минут')
    extra_lines = build_extra_context_lines(f)
    extra_instruction = build_extra_context_instruction(f)

    return f"""Ты опытный педагог-игропрактик. Придумай образовательную игру на русском языке по параметрам:

Предмет/дисциплина: {subject}
Время игры: {duration_label}
Количество участников: {people}{extra_lines}

Опиши: формат игры, деление на команды (если нужно), пошаговый сценарий с таймингом внутри отведённого времени, правила, критерии подведения итогов.{extra_instruction} Пиши конкретно и практично, без markdown-разметки (без **, #), обычным текстом с нумерацией шагов."""


INTENSIVE_AUDIENCE_LABELS = {
    'schoolchildren': 'школьники',
    'students': 'студенты',
    'adults': 'взрослые',
}

INTENSIVE_DURATION_LABELS = {
    '15min': '15 минут',
    '30min': '30 минут',
    '45min': '45 минут',
    '90min': '90 минут',
    '1day': '1 день',
    '2days': '2 дня',
}

INTENSIVE_FORMAT_LABELS = {
    'intensive': 'интенсив',
    'masterclass': 'мастер-класс',
    'workshop': 'воркшоп',
    'hackathon': 'хакатон',
    'project_lab': 'проектная лаборатория',
    'immersive': 'иммерсивный интенсив',
}


def build_intensive_prompt(f: dict) -> str:
    topic = f.get('topic') or 'новая тема'
    audience = INTENSIVE_AUDIENCE_LABELS.get(f.get('audience'), 'взрослые')
    duration = INTENSIVE_DURATION_LABELS.get(f.get('duration'), '1 день')
    fmt = INTENSIVE_FORMAT_LABELS.get(f.get('format'), 'интенсив')
    goal = f.get('goal') or f'глубоко разобрать тему «{topic}» и получить практический результат'
    extra_lines = build_extra_context_lines(f)
    extra_instruction = build_extra_context_instruction(f)

    is_short = f.get('duration') in ('15min', '30min', '45min', '90min')
    structure_hint = (
        "Формат короткий — распиши поминутный сценарий (блоки с таймингом внутри общей продолжительности), без разбивки на дни."
        if is_short else
        "Формат многодневный — распиши программу по дням: цель дня, содержание, форматы работы, материалы."
    )

    return f"""Ты опытный методист и продюсер образовательных программ. Составь программу мероприятия на русском языке по параметрам:

Тема: {topic}
Формат: {fmt}
Целевая аудитория: {audience}
Продолжительность: {duration}
Цель: {goal}{extra_lines}

{structure_hint}

Обязательно укажи: структуру/сценарий с таймингом, форматы работы участников (лекция/практика/проект/дискуссия — подбери уместные для формата «{fmt}»), необходимые материалы и инструменты, ожидаемый результат для участников. Учитывай, что аудитория — {audience}, адаптируй сложность и подачу материала.{extra_instruction} Пиши конкретно, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов."""


TASK_COMPONENT_LABELS = {
    'cognitive': 'когнитивный компонент (знания, понимание, анализ информации)',
    'creative': 'креативный компонент (творческое, нестандартное мышление, генерация идей)',
    'critical': 'критический компонент (критическое мышление, оценка аргументов, поиск ошибок)',
    'communicative': 'коммуникативный компонент (умение объяснять, обсуждать, работать в команде)',
}


def build_task_prompt(f: dict) -> str:
    subject = f.get('subject') or 'дисциплина не указана'
    topic = f.get('topic') or 'новая тема'
    goal = f.get('goal') or f'закрепить материал по теме «{topic}»'
    component_key = f.get('component')
    component = TASK_COMPONENT_LABELS.get(component_key, 'сбалансированное сочетание всех компонентов (когнитивный, креативный, критический, коммуникативный)')
    extra_lines = build_extra_context_lines(f)
    extra_instruction = build_extra_context_instruction(f)

    return f"""Ты опытный педагог, специалист по разработке учебных заданий. Составь комплект учебных заданий на русском языке по параметрам:

Предмет/дисциплина: {subject}
Тема: {topic}
Цель: {goal}
Акцент на компонент мышления: {component}{extra_lines}

Сделай минимум 3 задания трёх уровней сложности (базовый, средний, продвинутый), каждое задание должно явно задействовать указанный акцентный компонент мышления.{extra_instruction} Для каждого задания укажи формулировку и критерии оценивания. Пиши конкретно и практично, без markdown-разметки (без **, #), обычным текстом с нумерацией."""


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


NOTEBOOK_SUBJECTS = {
    "Математика", "Русский язык", "Литература", "Информатика",
    "Физика", "Химия", "История", "Обществознание",
}


ANTIPLAGIAT_SYSTEM_PROMPT = """Ты — проверяющий на антиплагиат с высоким уровнем критичности.
Ценности в эпоху ИИ-контента
Прочитай работу и определи:
1. Насколько текст оригинален по стилю и формулировкам
2. используются ли идеи без объяснения и ссылок
3. есть ли признаки механического копирования;
4. есть ли подозрительно "идеальные" или слишком шаблонные фрагменты
5. присутствуют ли резкие смены стиля, слишком академичный язык у слабого студента и т.д.
6. хорошо ли студент перерабатывает источники или просто пересказывает
Составь предварительное заключение:
1. низкий/средний/высокий риск проблем с оригинальностью;
2. какие части требуют дополнительной проверки преподавателем.
Выдели подозрительные абзацы и дай рекомендации.

Верни ответ СТРОГО в формате JSON без markdown, пояснений или текста до/после:
{"risk_level": "низкий|средний|высокий", "summary": "краткое общее заключение, 2-4 предложения", "originality_notes": "насколько текст оригинален по стилю и формулировкам", "style_notes": "признаки механического копирования, шаблонности, резких смен стиля", "sources_notes": "как студент перерабатывает источники — пересказ или анализ", "suspicious_fragments": [{"quote": "короткая цитата подозрительного фрагмента из текста", "reason": "почему фрагмент вызывает подозрение"}], "review_parts": ["какая часть работы требует дополнительной проверки преподавателем"], "recommendations": ["конкретная рекомендация преподавателю"]}"""


def build_notebook_system_prompt(subject: str) -> str:
    subj = subject if subject in NOTEBOOK_SUBJECTS else "предмет не указан"
    return f"""Ты опытный учитель-предметник по дисциплине «{subj}», который проверяет фотографии тетрадей учеников именно по этому предмету. Проанализируй изображение: найди выполненные задания по предмету «{subj}», определи ошибки с учётом специфики предмета (для математики/физики/химии — проверяй вычисления и формулы, для русского языка/литературы — орфографию, пунктуацию и раскрытие темы, для информатики — логику и синтаксис, для истории/обществознания — фактическую точность и аргументацию), оцени качество и аккуратность оформления.

Верни ответ СТРОГО в формате JSON без markdown, пояснений или текста до/после:
{{"score": <целое число 0-100, процент правильности>, "correct": <целое число, сколько заданий верно>, "total": <целое число, сколько всего заданий видно на фото>, "notes": ["замечание 1", "замечание 2", "замечание 3"]}}

Если на фото не видно учебной работы (тетради, заданий), верни: {{"score": 0, "correct": 0, "total": 0, "notes": ["На фото не удалось распознать учебную работу. Попробуйте сделать снимок чётче и ближе."]}}

Замечания пиши кратко, конкретно, на русском языке, с указанием номера задания если возможно, учитывая специфику предмета «{subj}»."""


def handler(event: dict, context) -> dict:
    """Генерация учебных материалов, ИИ-чат-помощник через AITunnel. Декомпозитор компетенций, проверка тетради по фото и проверка на антиплагиат доступны только пользователям с платной подпиской."""
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
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Декомпозитор компетенций доступен только по платной подписке'})}

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
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Проверка тетради доступна только по платной подписке'})}

            image_base64 = body.get('image_base64') or ''
            subject = body.get('subject') or ''
            if not image_base64:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Не передано изображение'})}

            if not image_base64.startswith('data:'):
                image_base64 = f'data:image/jpeg;base64,{image_base64}'

            raw = call_ai([
                {'role': 'system', 'content': build_notebook_system_prompt(subject)},
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

        elif action == 'antiplagiat_check':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Антиплагиат доступен только по платной подписке'})}

            text = body.get('text') or ''
            if not text.strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Вставьте текст работы для проверки'})}

            text = text[:20000]

            raw = call_ai([
                {'role': 'system', 'content': ANTIPLAGIAT_SYSTEM_PROMPT},
                {'role': 'user', 'content': f'Работа: {text}'},
            ], temperature=0.4)

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