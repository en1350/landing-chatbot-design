from concurrent.futures import ThreadPoolExecutor
import base64
import io
import json
import os
import urllib.request
import urllib.error
import psycopg2

AITUNNEL_URL = "https://api.aitunnel.ru/v1/chat/completions"
MODEL = "gemini-3.8-flash"
VISION_MODEL = "gemini-3.8-flash"
SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 'public')


def extract_text_from_file(file_base64: str, filename: str) -> str:
    """Извлекает текст из base64-содержимого PDF или DOCX файла по расширению имени файла."""
    if ',' in file_base64:
        file_base64 = file_base64.split(',', 1)[1]
    raw = base64.b64decode(file_base64)
    ext = (filename or '').lower().rsplit('.', 1)[-1] if '.' in (filename or '') else ''

    if ext == 'pdf':
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(raw))
        pages = [page.extract_text() or '' for page in reader.pages]
        return '\n'.join(pages).strip()

    if ext == 'docx':
        from docx import Document
        doc = Document(io.BytesIO(raw))
        paragraphs = [p.text for p in doc.paragraphs]
        return '\n'.join(paragraphs).strip()

    raise ValueError('Поддерживаются только файлы PDF и DOCX')


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


ACCESS = {'user_id': None, 'via_credit': False, 'action': None}
CREDIT_EXCLUDED_ACTIONS = {'pm_task_refine', 'presentation_refine', 'project_refine', 'kos_refine', 'kos_task_criteria'}


def is_user_paid(event) -> bool:
    token = get_token(event)
    if not token:
        return False
    conn = None
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
        if sub and sub[0] != 'free':
            return True
        if ACCESS['action'] in CREDIT_EXCLUDED_ACTIONS:
            return False
        cur.execute(
            f"UPDATE {SCHEMA}.single_credits SET credits = credits - 1, updated_at = now() "
            f"WHERE user_id = %s AND credits > 0 RETURNING credits",
            (user_id,)
        )
        if cur.fetchone():
            conn.commit()
            ACCESS['user_id'] = user_id
            ACCESS['via_credit'] = True
            return True
        return False
    except Exception:
        return False
    finally:
        if conn:
            conn.close()


def refund_credit():
    if not (ACCESS['via_credit'] and ACCESS['user_id']):
        return
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.single_credits SET credits = credits + 1, updated_at = now() WHERE user_id = %s",
            (ACCESS['user_id'],)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


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

PRACTICE_DURATION_MAP = {
    '45': {'org': 2, 'motiv': 5, 'briefing': 8, 'drill': 17, 'current': 5, 'consolid': 4, 'reflect': 2, 'grades': 1, 'homework': 1},
    '90': {'org': 3, 'motiv': 8, 'briefing': 12, 'drill': 40, 'current': 12, 'consolid': 8, 'reflect': 4, 'grades': 2, 'homework': 1},
}


def get_ovz(f: dict) -> list:
    raw = f.get('ovz')
    if isinstance(raw, list):
        items = [str(x).strip() for x in raw]
    elif isinstance(raw, str):
        items = [x.strip() for x in raw.split(',')]
    else:
        items = []
    return [x for x in items if x]


def build_ovz_note(f: dict) -> str:
    ovz = get_ovz(f)
    if not ovz:
        return ""
    cats = ", ".join(ovz)
    return (
        f"Среди обучающихся есть дети/студенты с ОВЗ (ограниченными возможностями здоровья): {cats}. "
        f"Обязательно адаптируй материал под эти категории: добавь отдельный блок «Адаптация для обучающихся с ОВЗ» "
        f"с конкретными приёмами для каждой указанной категории (формат подачи, наглядность, темп, формулировки заданий, "
        f"допустимые средства поддержки, способ проверки результата). Не снижай образовательную цель, меняй только способы достижения."
    )


def with_ovz(prompt: str, f: dict) -> str:
    ovz = get_ovz(f)
    if not ovz:
        return prompt
    marker = 'Верни ответ СТРОГО'
    note = (
        f"Среди обучающихся есть дети/студенты с ОВЗ (ограниченными возможностями здоровья): {', '.join(ovz)}. "
        f"Встрой адаптацию под эти категории прямо в текст существующих полей ответа: укажи конкретные приёмы "
        f"(формат подачи, наглядность, темп, формулировки заданий, допустимые средства поддержки, способ проверки результата) "
        f"и помечай их словами «Для обучающихся с ОВЗ:». Не меняй структуру и названия полей JSON и не снижай образовательную цель."
    )
    if marker in prompt:
        return prompt.replace(marker, note + "\n\n" + marker, 1)
    return prompt + "\n\n" + note


def build_extra_context_lines(f: dict) -> str:
    lines = []
    regional = (f.get('regionalComponent') or '').strip()
    professional = (f.get('professionalOrientation') or '').strip()
    ovz = get_ovz(f)
    if regional:
        lines.append(f"Региональный компонент: {regional}")
    if professional:
        lines.append(f"Профессиональная направленность: {professional}")
    if ovz:
        lines.append(f"Обучающиеся с ОВЗ: {', '.join(ovz)}")
    return ("\n" + "\n".join(lines)) if lines else ""


def build_extra_context_instruction(f: dict) -> str:
    regional = (f.get('regionalComponent') or '').strip()
    professional = (f.get('professionalOrientation') or '').strip()
    parts = []
    if regional:
        parts.append(f"обязательно учти региональный компонент «{regional}» (используй местные примеры, факты, реалии региона)")
    if professional:
        parts.append(f"обязательно учти профессиональную направленность «{professional}» (подбирай примеры и контекст под этот профиль)")
    result = (" Также " + "; ".join(parts) + ".") if parts else ""
    note = build_ovz_note(f)
    if note:
        result += " " + note
    return result


def build_competencies_lines(f: dict) -> str:
    competencies = (f.get('competencies') or '').strip()
    return f"\nФормируемые ОК/УУД (общие/универсальные учебные действия): {competencies}" if competencies else ""


def build_competencies_instruction(f: dict) -> str:
    competencies = (f.get('competencies') or '').strip()
    if not competencies:
        return ""
    return f" Обязательно покажи, на каких этапах и как именно формируются выбранные ОК/УУД: {competencies}."


def build_lesson_prompt(f: dict) -> str:
    subject = f.get('subject') or 'дисциплина не указана'
    topic = f.get('topic') or 'новая тема'
    goal = f.get('goal') or f'сформировать понимание темы «{topic}»'
    tasks = f.get('tasks') or 'не указаны'
    technology = f.get('technology') or 'смешанное обучение'
    age_count = f.get('ageCount') or 'не указано'
    duration = f.get('duration') or '45'
    lesson_type = f.get('lessonType') or 'theory'
    extra_lines = build_extra_context_lines(f)
    extra_instruction = build_extra_context_instruction(f)
    competencies_lines = build_competencies_lines(f)
    competencies_instruction = build_competencies_instruction(f)

    common_header = f"""Предмет/дисциплина: {subject}
Тема: {topic}
Цель: {goal}
Задачи: {tasks}
Технология обучения: {technology}
Возраст / количество человек: {age_count}
Время урока: {duration} минут{extra_lines}{competencies_lines}"""

    if lesson_type == 'practice':
        t = PRACTICE_DURATION_MAP.get(duration, PRACTICE_DURATION_MAP['45'])
        return f"""Ты опытный методист-педагог, специалист по практическому (производственному) обучению. Составь подробную готовую разработку практического занятия на русском языке по параметрам:

{common_header}

Это практическое занятие (отработка умений и навыков). Структура строго такая (не меняй порядок и названия этапов), укажи рекомендованное время по каждому этапу (в сумме {duration} мин, ориентируйся на: приветствие {t['org']} мин, мотивация/актуализация {t['motiv']} мин, первичный инструктаж {t['briefing']} мин, отработка практического навыка {t['drill']} мин, текущий инструктаж {t['current']} мин, закрепление {t['consolid']} мин, рефлексия {t['reflect']} мин, выставление оценок {t['grades']} мин, домашнее задание {t['homework']} мин):

1. Приветствие
2. Мотивация / актуализация
3. Первичный инструктаж (ознакомление с алгоритмом работы)
4. Отработка практического навыка
5. Текущий инструктаж (промежуточная оценка работ, отметка типичных ошибок)
6. Закрепление
7. Рефлексия
8. Выставление оценок
9. Домашнее задание

Для каждого этапа обязательно укажи:
- конкретные действия преподавателя и обучающихся (без общих фраз);
- название и краткое описание применяемого педагогического приёма или метода (например: инструктаж по ТБ, демонстрация алгоритма, работа по карточке-инструкции, метод показа с пояснением, взаимоконтроль в парах, приём «светофор», целевые обходы рабочих мест, приём «доведи до эталона» и т.п.) — подбирай приёмы, уместные именно для темы «{topic}» и предмета «{subject}», а не шаблонные;
- в этапе «Первичный инструктаж» пропиши пошаговый алгоритм выполнения практической работы и требования охраны труда/безопасности, если это уместно для темы;
- в этапе «Отработка практического навыка» опиши конкретное практическое задание для обучающихся;
- в этапе «Текущий инструктаж» опиши, на что обращает внимание преподаватель при обходе, какие типичные ошибки нужно отследить и как их скорректировать;
- в этапе «Выставление оценок» опиши критерии оценивания практической работы.
{extra_instruction}{competencies_instruction} Пиши развёрнуто, по-деловому, без markdown-разметки (без **, #), используй обычный текст с переносами строк и нумерацией."""

    t = LESSON_DURATION_MAP.get(duration, LESSON_DURATION_MAP['45'])
    return f"""Ты опытный методист-педагог. Составь подробную готовую разработку теоретического занятия на русском языке по параметрам:

{common_header}

Это теоретическое занятие. Структура строго такая (не меняй порядок и названия этапов), укажи рекомендованное время по каждому этапу (в сумме {duration} мин, ориентируйся на: приветствие {t['org']} мин, актуализация {t['act']} мин, сообщение новой темы {t['new']} мин, закрепление изученного материала {t['practice']} мин, рефлексия {t['reflect']} мин, домашнее задание {t['homework']} мин; проверку выполненной работы включи внутри этапа закрепления):

1. Приветствие
2. Актуализация
3. Сообщение новой темы
4. Закрепление изученного материала
5. Проверка выполненной работы
6. Рефлексия
7. Домашнее задание

Для каждого этапа обязательно укажи:
- конкретные действия учителя и учеников (без общих фраз);
- название и краткое описание применяемого педагогического приёма или метода (например: приём «яркое пятно», фронтальный опрос, приём «корзина идей», проблемный вопрос, работа в парах/группах, приём «инсерт», кластер, приём «верно/неверно», взаимопроверка по эталону, приём «синквейн», приём «незаконченное предложение» и т.п.) — подбирай приёмы, уместные именно для темы «{topic}» и предмета «{subject}», а не шаблонные;
- в этапе «Проверка выполненной работы» опиши конкретный способ и критерии проверки (что именно и как проверяется).
{extra_instruction}{competencies_instruction} Пиши развёрнуто, по-деловому, без markdown-разметки (без **, #), используй обычный текст с переносами строк и нумерацией."""


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
    competencies_lines = build_competencies_lines(f)
    competencies_instruction = build_competencies_instruction(f)

    return f"""Ты опытный педагог, специалист по разработке учебных заданий. Составь комплект учебных заданий на русском языке по параметрам:

Предмет/дисциплина: {subject}
Тема: {topic}
Цель: {goal}
Акцент на компонент мышления: {component}{extra_lines}{competencies_lines}

Сделай минимум 3 задания трёх уровней сложности (базовый, средний, продвинутый), каждое задание должно явно задействовать указанный акцентный компонент мышления.{extra_instruction}{competencies_instruction} Для каждого задания укажи формулировку и критерии оценивания. Пиши конкретно и практично, без markdown-разметки (без **, #), обычным текстом с нумерацией."""


QUIZ_DIFFICULTY_LABELS = {
    'easy': 'базовый (лёгкий)',
    'medium': 'средний',
    'hard': 'продвинутый (сложный)',
    'mixed': 'смешанный (базовый + средний + продвинутый в равной пропорции)',
}

QUIZ_TYPE_LABELS = {
    'single': 'с выбором одного правильного ответа из нескольких вариантов',
    'multiple': 'с выбором нескольких правильных ответов из нескольких вариантов',
    'matching': 'на установление соответствия между двумя списками элементов',
    'sequence': 'на установление правильной последовательности элементов',
}


def build_quiz_prompt(f: dict) -> str:
    subject = f.get('subject') or 'дисциплина не указана'
    topic = f.get('topic') or 'новая тема'
    count = f.get('questionCount') or '10'
    difficulty_key = f.get('difficulty') or 'mixed'
    difficulty = QUIZ_DIFFICULTY_LABELS.get(difficulty_key, QUIZ_DIFFICULTY_LABELS['mixed'])

    type_keys = f.get('questionTypes') or []
    if isinstance(type_keys, str):
        type_keys = [t.strip() for t in type_keys.split(',') if t.strip()]
    if not type_keys:
        type_keys = ['single']
    types_desc = "; ".join(f"«{QUIZ_TYPE_LABELS.get(t, t)}»" for t in type_keys if t in QUIZ_TYPE_LABELS)

    extra_lines = build_extra_context_lines(f)
    extra_instruction = build_extra_context_instruction(f)

    return f"""Ты опытный педагог, специалист по разработке тестовых заданий. Составь тест на русском языке по параметрам:

Предмет/дисциплина: {subject}
Тема: {topic}
Количество вопросов: {count}
Уровень сложности: {difficulty}
Типы вопросов, которые нужно использовать (распредели вопросы равномерно между этими типами): {types_desc}{extra_lines}

Для каждого вопроса укажи:
- номер и текст вопроса
- уровень сложности вопроса (базовый/средний/продвинутый)
- тип вопроса
- для вопроса «с выбором одного ответа» — 4 варианта ответа (А, Б, В, Г), укажи какой верный
- для вопроса «с выбором нескольких ответов» — 5-6 вариантов ответа, укажи все верные
- для вопроса «на установление соответствия» — два списка элементов (например, левый и правый столбец) и правильные пары
- для вопроса «на установление последовательности» — перечень элементов в перепутанном порядке и правильный порядок (по номерам)

В конце теста добавь отдельный раздел «Ключ ответов» со сводным списком правильных ответов по каждому вопросу.{extra_instruction} Пиши конкретно и практично, без markdown-разметки (без **, #), обычным текстом с чёткой нумерацией вопросов."""


def build_correction_plan_prompt(data: dict) -> str:
    discipline = data.get('discipline') or 'дисциплина не указана'
    group = data.get('group') or 'группа не указана'
    group_avg = data.get('groupAvg')
    quality = data.get('quality')

    skill_lines = []
    for s in (data.get('skills') or []):
        skill_lines.append(f"- {s.get('name')}: средний балл {s.get('avg')}, уровень «{s.get('level')}»")
    skills_block = "\n".join(skill_lines) if skill_lines else "нет данных"

    deficit_lines = []
    for d in (data.get('groupDeficits') or []):
        deficit_lines.append(f"- {d.get('name')} (ср. балл {d.get('avg')}, уровень «{d.get('level')}»)")
    deficits_block = "\n".join(deficit_lines) if deficit_lines else "дефицитных навыков на уровне группы не выявлено"

    risk_lines = []
    for st in (data.get('riskStudents') or []):
        deficits = "; ".join(f"{x.get('name')} ({x.get('grade')})" for x in (st.get('deficits') or []))
        risk_lines.append(f"- {st.get('name')} (ср. балл {st.get('avg')}, уровень «{st.get('level')}»), дефицитные навыки: {deficits or 'не указаны'}")
    risk_block = "\n".join(risk_lines) if risk_lines else "студентов группы риска не выявлено"

    excellent_names = ", ".join((data.get('excellentStudents') or []))
    excellent_block = excellent_names if excellent_names else "студентов с высоким уровнем не выявлено"

    return f"""Ты опытный методист и эксперт по педагогической диагностике. На основе результатов уровневой диагностики качества освоения предметных умений составь развёрнутый план коррекционной работы на русском языке.

Дисциплина: {discipline}
Группа: {group}
Средний балл группы: {group_avg} из 5
Качественная успеваемость (оценки 4 и 5): {quality}%

Освоение навыков группой:
{skills_block}

Дефицитные навыки группы (требуют коррекции):
{deficits_block}

Студенты группы риска (средний балл ниже 3.5) и их дефицитные навыки:
{risk_block}

Студенты с высоким уровнем освоения:
{excellent_block}

Составь план коррекционной работы из четырёх разделов со следующими заголовками (используй именно их):
1. Групповая коррекционная работа — для каждого дефицитного навыка группы предложи 3-5 конкретных методических мероприятий (форматы занятий, методы, приёмы), адаптированных именно под этот навык и предмет.
2. Индивидуальная работа со студентами группы риска — для каждого студента из списка дай персональные рекомендации с учётом именно его дефицитных навыков (не общие фразы, а конкретику по предмету и навыкам).
3. Работа со студентами высокого уровня — предложи мероприятия для развития и вовлечения (олимпиады, наставничество, исследовательские задания и т.п.).
4. Организационно-методические мероприятия — общие шаги для преподавателя и методической комиссии (сроки, ответственные, повторная диагностика).

Пиши развёрнуто, конкретно, по-деловому, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов и пунктов внутри них."""


def build_kz_analysis_prompt(data: dict) -> str:
    rows = data.get('rows') or []
    row_lines = []
    for r in rows:
        discipline = r.get('discipline') or 'дисциплина не указана'
        group = r.get('group') or 'группа не указана'
        start = r.get('start')
        end = r.get('end')
        line = f"- {discipline} / группа {group}: "
        parts = []
        if start:
            parts.append(
                f"начало курса — N={start.get('N')}, КЗ={start.get('kz')}%, успеваемость={start.get('usp')}%, "
                f"СО={start.get('so')}, неуспевающих={start.get('n2')}"
            )
        if end:
            parts.append(
                f"окончание курса — N={end.get('N')}, КЗ={end.get('kz')}%, успеваемость={end.get('usp')}%, "
                f"СО={end.get('so')}, неуспевающих={end.get('n2')}"
            )
        if start and end:
            delta = round((end.get('kz') or 0) - (start.get('kz') or 0), 1)
            parts.append(f"прирост КЗ={delta} п.п.")
        line += "; ".join(parts) if parts else "недостаточно данных"
        row_lines.append(line)
    rows_block = "\n".join(row_lines) if row_lines else "нет данных"

    return f"""Ты опытный методист и эксперт по педагогической диагностике. На основе автоматизированного расчёта качества знаний по группам и дисциплинам составь развёрнутый аналитический отчёт на русском языке.

Данные по группам и дисциплинам (КЗ — качество знаний, СО — средний балл, N — число студентов):
{rows_block}

Составь отчёт из следующих разделов (используй именно эти заголовки):
1. Общие выводы — по всем группам и дисциплинам сразу: какие показатели выше/ниже нормы, есть ли выраженные тенденции.
2. Разбор по каждой паре «дисциплина — группа» — краткий комментарий по динамике (рост/падение/стабильность), возможные причины.
3. Группы и дисциплины, требующие внимания — где качество знаний или динамика вызывают тревогу, почему.
4. Рекомендации — конкретные методические и организационные шаги для повышения качества знаний в проблемных группах.

Пиши развёрнуто, конкретно, по-деловому, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов."""


LESSON_CARD_STAGES = [
    ('s1', 'Приветствие'),
    ('s2', 'Актуализация'),
    ('s3', 'Повторение пройденного материала'),
    ('s4', 'Сообщение новой темы'),
    ('s5', 'Закрепление изученной темы'),
    ('s6', 'Рефлексия'),
    ('s7', 'Домашнее задание'),
]


def build_lesson_card_prompt(f: dict) -> str:
    discipline = (f.get('discipline') or '').strip() or 'дисциплина не указана'
    group = (f.get('group') or '').strip() or 'группа не указана'
    topic = (f.get('topic') or '').strip() or 'тема не указана'
    goal = (f.get('goal') or '').strip()
    duration = str(f.get('duration') or '45')
    lesson_type = (f.get('lessonType') or 'Теоретическое занятие').strip()
    competencies = f.get('competencies') or []
    technologies = f.get('technologies') or []
    times = f.get('times') or {}

    comp_block = "\n".join(f"- {c}" for c in competencies) if competencies else "не выбраны"
    tech_block = ", ".join(technologies) if technologies else "не выбраны"
    goal_line = goal if goal else "цель не сформулирована преподавателем — сформулируй её сам, исходя из темы"

    stage_lines = []
    for key, name in LESSON_CARD_STAGES:
        mins = times.get(key) or 0
        stage_lines.append(f'"{key}" — этап «{name}», {mins} мин')
    stages_block = "\n".join(stage_lines)

    return f"""Ты опытный методист-педагог СПО. Составь содержание карточки урока на русском языке.

Дисциплина: {discipline}
Класс / группа: {group}
Тема урока: {topic}
Цель урока: {goal_line}
Время урока: {duration} минут
Тип занятия: {lesson_type}
Формируемые компетенции:
{comp_block}
Технологии обучения: {tech_block}

Этапы урока с отведённым временем:
{stages_block}

Для КАЖДОГО этапа напиши содержание: конкретные действия преподавателя и обучающихся, применяемые приёмы и методы, уместные именно для темы «{topic}» и дисциплины «{discipline}». Учитывай тип занятия ({lesson_type}) и выбранные технологии обучения. Объём каждого этапа — 2-5 содержательных предложений, соразмерно отведённому времени. Без общих фраз и без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"goal": "сформулированная цель урока одним предложением", "stages": {{"s1": "текст", "s2": "текст", "s3": "текст", "s4": "текст", "s5": "текст", "s6": "текст", "s7": "текст"}}}}"""


def build_task_card_prompt(f: dict) -> str:
    discipline = (f.get('discipline') or '').strip() or 'дисциплина не указана'
    group = (f.get('group') or '').strip() or 'группа не указана'
    topic = (f.get('topic') or '').strip() or 'тема не указана'
    goal = (f.get('goal') or '').strip()
    time_label = (f.get('time') or '10 минут').strip()
    task_type = (f.get('taskType') or 'Репродуктивное').strip()
    self_assessment = (f.get('selfAssessment') or 'Да').strip()
    competencies = f.get('competencies') or []
    task_text = (f.get('task') or '').strip()

    comp_block = "\n".join(f"- {c}" for c in competencies) if competencies else "не выбраны"
    goal_line = goal if goal else "цель не сформулирована преподавателем — сформулируй её сам, исходя из темы и типа задания"
    task_line = f"\nЧерновик задания от преподавателя (доработай и приведи в готовый вид): {task_text}" if task_text else ""
    self_line = (
        " Также добавь в текст задания короткий блок самооценки: 2-3 вопроса, по которым обучающийся сам оценит выполнение."
        if self_assessment == 'Да' else ""
    )

    return f"""Ты опытный педагог-методист СПО, специалист по разработке учебных заданий. Составь содержание карточки учебного задания на русском языке.

Дисциплина: {discipline}
Класс / группа: {group}
Тема задания: {topic}
Цель задания: {goal_line}
Время выполнения: {time_label}
Тип задания: {task_type}
Формируемые компетенции:
{comp_block}{task_line}

Задание должно быть реально выполнимым за {time_label} и соответствовать типу «{task_type}». Формулируй конкретно, по шагам, обращаясь к обучающемуся на «вы». Критерии оценки опиши понятно, с указанием баллов или уровней.{self_line} Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"goal": "сформулированная цель задания одним предложением", "task": "полный текст задания для обучающегося", "criteria": "критерии оценки"}}"""


def build_lesson_card_refine_prompt(f: dict, instruction: str) -> str:
    discipline = (f.get('discipline') or '').strip() or 'дисциплина не указана'
    group = (f.get('group') or '').strip() or 'группа не указана'
    topic = (f.get('topic') or '').strip() or 'тема не указана'
    duration = str(f.get('duration') or '45')
    lesson_type = (f.get('lessonType') or 'Теоретическое занятие').strip()
    competencies = f.get('competencies') or []
    technologies = f.get('technologies') or []
    times = f.get('times') or {}
    goal = (f.get('goal') or '').strip()
    contents = f.get('contents') or {}

    comp_block = "\n".join(f"- {c}" for c in competencies) if competencies else "не выбраны"
    tech_block = ", ".join(technologies) if technologies else "не выбраны"

    stage_lines = []
    for key, name in LESSON_CARD_STAGES:
        mins = times.get(key) or 0
        text = (contents.get(key) or '').strip() or '(пусто)'
        stage_lines.append(f'"{key}" — этап «{name}», {mins} мин. Текущий текст: {text}')
    stages_block = "\n".join(stage_lines)

    return f"""Ты опытный методист-педагог СПО. Вот текущая карточка урока:

Дисциплина: {discipline}
Класс / группа: {group}
Тема урока: {topic}
Время урока: {duration} минут
Тип занятия: {lesson_type}
Формируемые компетенции:
{comp_block}
Технологии обучения: {tech_block}

Текущая цель урока: {goal or '(не сформулирована)'}

Текущее содержание этапов:
{stages_block}

Преподаватель просит доработать карточку по инструкции: «{instruction}»

Обнови содержание этапов и/или цель урока в соответствии с инструкцией, сохраняя структуру из 7 этапов и их названия. Если инструкция касается конкретного этапа — измени в первую очередь его, но верни ВСЕ этапы целиком (не только изменённый). Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"goal": "обновлённая или прежняя цель урока одним предложением", "stages": {{"s1": "текст", "s2": "текст", "s3": "текст", "s4": "текст", "s5": "текст", "s6": "текст", "s7": "текст"}}}}"""


def build_task_card_refine_prompt(f: dict, instruction: str) -> str:
    discipline = (f.get('discipline') or '').strip() or 'дисциплина не указана'
    group = (f.get('group') or '').strip() or 'группа не указана'
    topic = (f.get('topic') or '').strip() or 'тема не указана'
    time_label = (f.get('time') or '10 минут').strip()
    task_type = (f.get('taskType') or 'Репродуктивное').strip()
    self_assessment = (f.get('selfAssessment') or 'Да').strip()
    competencies = f.get('competencies') or []
    goal = (f.get('goal') or '').strip()
    task_text = (f.get('task') or '').strip()
    criteria_text = (f.get('criteria') or '').strip()

    comp_block = "\n".join(f"- {c}" for c in competencies) if competencies else "не выбраны"

    return f"""Ты опытный педагог-методист СПО. Вот текущая карточка учебного задания:

Дисциплина: {discipline}
Класс / группа: {group}
Тема задания: {topic}
Время выполнения: {time_label}
Тип задания: {task_type}
Самооценка предусмотрена: {self_assessment}
Формируемые компетенции:
{comp_block}

Текущая цель задания: {goal or '(не сформулирована)'}
Текущий текст задания: {task_text or '(пусто)'}
Текущие критерии оценки: {criteria_text or '(пусто)'}

Преподаватель просит доработать карточку по инструкции: «{instruction}»

Обнови цель, текст задания и/или критерии оценки в соответствии с инструкцией. Если инструкция касается только одной части — измени в первую очередь её, но верни ВСЕ три поля целиком. Задание должно оставаться выполнимым за {time_label} и соответствовать типу «{task_type}». Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"goal": "обновлённая или прежняя цель задания одним предложением", "task": "полный обновлённый текст задания", "criteria": "обновлённые критерии оценки"}}"""


def build_event_card_context(f: dict) -> str:
    scenario = f.get('scenario') or []
    scenario_lines = []
    for i, s in enumerate(scenario, 1):
        scenario_lines.append(
            f"{i}. {(s.get('title') or '').strip() or '(без названия)'} | {(s.get('time') or '').strip() or '(время не указано)'} | {(s.get('desc') or '').strip() or '(пусто)'}"
        )
    scenario_block = "\n".join(scenario_lines) if scenario_lines else "(сценарий пуст)"
    return f"""Название / тема: {(f.get('title') or '').strip() or 'не указана'}
Формат: {(f.get('format') or 'Мастер-класс').strip()}
Целевая аудитория: {(f.get('audience') or 'Школьники').strip()}
Длительность: {(f.get('duration') or '45 минут').strip()}
Уровень сложности: {(f.get('level') or 'Начальный').strip()}
Проведение: {(f.get('mode') or 'Онлайн').strip()}
Участников: от {f.get('minParticipants') or '?'} до {f.get('maxParticipants') or '?'}
Описание / цели: {(f.get('description') or '').strip() or '(пусто)'}
Результат для участника: {(f.get('result') or '').strip() or '(пусто)'}
Необходимые материалы: {(f.get('materials') or '').strip() or '(пусто)'}
Сценарий (этап | время | содержание):
{scenario_block}"""


EVENT_CARD_JSON_FORMAT = """{"description": "описание и цели события, 2-4 предложения", "result": "что получит участник после события, 1-3 предложения", "scenario": [{"title": "название этапа", "time": "10 мин", "desc": "содержание этапа, 1-3 предложения"}], "materials": "каждый материал с новой строки"}"""


def build_event_card_prompt(f: dict) -> str:
    return f"""Ты опытный методист и продюсер образовательных событий. Составь содержание карточки образовательного события на русском языке.

{build_event_card_context(f)}

Заполни или улучши описание, результат для участника, поминутный сценарий и список материалов. Если поля уже заполнены преподавателем — сохрани их смысл и дополни. Сценарий: 4-8 этапов, сумма времени должна укладываться в длительность «{(f.get('duration') or '45 минут').strip()}», формы работы подбирай под формат «{(f.get('format') or 'Мастер-класс').strip()}» и аудиторию «{(f.get('audience') or 'Школьники').strip()}». Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{EVENT_CARD_JSON_FORMAT}"""


def build_event_card_refine_prompt(f: dict, instruction: str) -> str:
    return f"""Ты опытный методист и продюсер образовательных событий. Вот текущая карточка события:

{build_event_card_context(f)}

Преподаватель просит доработать карточку по инструкции: «{instruction}»

Измени описание, результат, сценарий и/или материалы в соответствии с инструкцией. Если она касается одной части — измени в первую очередь её, но верни ВСЕ поля целиком. Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{EVENT_CARD_JSON_FORMAT}"""


def build_game_card_prompt(f: dict) -> str:
    topic = (f.get('topic') or '').strip() or 'тема не указана'
    game_type = (f.get('gameType') or '').strip() or 'Квиз'
    time_label = (f.get('time') or '10 минут').strip()
    people = (f.get('people') or '').strip() or 'не указано'
    goal = (f.get('goal') or '').strip() or 'Закрепление'
    scenario = (f.get('scenario') or '').strip()
    scenario_line = f"\nПожелания и условия преподавателя (обязательно учти): {scenario}" if scenario else ""

    return f"""Ты опытный педагог-игропрактик. Составь карточку образовательной игры на русском языке.

Тема урока: {topic}
Вид игры: {game_type}
Время проведения: {time_label}
Количество участников: {people}
Цель игры: {goal}{scenario_line}

Игра должна быть реально проводимой за {time_label}, а тайминг этапов в сумме должен давать это время. Содержание привязывай именно к теме «{topic}»: приведи конкретные примеры вопросов, ролей, ситуаций или заданий. Разбей участников на команды, если это уместно. Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"goal": "цель игры одним-двумя предложениями", "stages": [{{"name": "название этапа", "minutes": 3, "description": "что делают ведущий и участники"}}], "rules": "правила игры и система баллов", "materials": ["материал 1", "материал 2"], "tips": ["совет 1", "совет 2"], "criteria": "как подвести итоги и определить победителей"}}"""


def normalize_game_card(parsed: dict) -> dict:
    stages = []
    for st in (parsed.get('stages') or []):
        if not isinstance(st, dict):
            continue
        try:
            minutes = int(st.get('minutes') or 0)
        except (TypeError, ValueError):
            minutes = 0
        stages.append({
            'name': str(st.get('name') or '').strip(),
            'minutes': minutes,
            'description': str(st.get('description') or '').strip(),
        })
    return {
        'goal': str(parsed.get('goal') or '').strip(),
        'stages': stages,
        'rules': str(parsed.get('rules') or '').strip(),
        'materials': [str(x).strip() for x in (parsed.get('materials') or []) if str(x).strip()],
        'tips': [str(x).strip() for x in (parsed.get('tips') or []) if str(x).strip()],
        'criteria': str(parsed.get('criteria') or '').strip(),
    }


PRESENTATION_STYLE_HINTS = {
    'modern': 'современный деловой стиль: чёткие тезисы, лаконичные формулировки, цифры и факты',
    'creative': 'творческий стиль: яркие образы, метафоры, неожиданные вопросы к аудитории',
    'game': 'игровой стиль: интерактив, квесты, загадки, задания для зрителей, элементы соревнования',
    'storyteller': 'стиль визуального рассказчика: связная история, минимум текста на слайде, образные подписи, подсказки какой образ или фото показать',
}


def build_presentation_prompt(f: dict) -> str:
    topic = (f.get('topic') or '').strip() or 'тема не указана'
    style = (f.get('style') or 'modern').strip()
    style_hint = PRESENTATION_STYLE_HINTS.get(style, PRESENTATION_STYLE_HINTS['modern'])
    try:
        count = int(f.get('slidesCount') or 10)
    except (TypeError, ValueError):
        count = 10
    count = max(3, min(count, 25))
    source = (f.get('sourceText') or '').strip()[:12000]
    source_block = f"\n\nИсходный текст, на основе которого нужно построить презентацию (опирайся на него, не выдумывай факты):\n{source}" if source else ""

    return f"""Ты опытный методист и дизайнер учебных презентаций. Составь содержание презентации на русском языке.

Тема: {topic}
Стиль: {style_hint}
Количество слайдов: ровно {count} (включая титульный и заключительный){source_block}

Требования: первый слайд титульный, последний слайд итоговый (выводы или вопросы). На каждом слайде: короткий заголовок до 8 слов и от 3 до 5 тезисов, каждый тезис до 15 слов. Для каждого слайда добавь заметки докладчика (1-2 предложения) и подсказку, какое изображение уместно на слайде (одно короткое предложение). Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"title": "название презентации", "slides": [{{"title": "заголовок слайда", "bullets": ["тезис 1", "тезис 2"], "notes": "заметки докладчика", "image": "подсказка для изображения"}}]}}"""


def build_presentation_refine_prompt(f: dict, instruction: str) -> str:
    title = (f.get('title') or '').strip() or 'Презентация'
    style = (f.get('style') or 'modern').strip()
    style_hint = PRESENTATION_STYLE_HINTS.get(style, PRESENTATION_STYLE_HINTS['modern'])
    slides = f.get('slides') or []
    blocks = []
    for i, sl in enumerate(slides, 1):
        bullets = "\n".join(f"  - {b}" for b in (sl.get('bullets') or [])) or "  (нет тезисов)"
        blocks.append(
            f"Слайд {i}: {(sl.get('title') or '').strip()}\n{bullets}\n"
            f"  Заметки докладчика: {(sl.get('notes') or '').strip() or '(пусто)'}\n"
            f"  Подсказка для изображения: {(sl.get('image') or '').strip() or '(нет)'}"
        )
    slides_block = "\n\n".join(blocks)
    count = len(slides)

    return f"""Ты опытный методист и дизайнер учебных презентаций. Вот текущая презентация на русском языке.

Название: {title}
Стиль: {style_hint}
Количество слайдов: {count}

{slides_block}

Преподаватель просит доработать презентацию по замечанию: «{instruction}»

Обнови слайды в соответствии с замечанием. Сохраняй количество слайдов ({count}), если замечание прямо не просит добавить или убрать слайды. Первый слайд остаётся титульным, последний итоговым. Если замечание касается одного слайда или части материала, измени в первую очередь его, но верни ВСЕ слайды целиком. Заголовок слайда до 8 слов, от 3 до 5 тезисов, каждый до 15 слов. Не меняй подсказку для изображения, если замечание её не касается. Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"title": "название презентации", "slides": [{{"title": "заголовок слайда", "bullets": ["тезис 1", "тезис 2"], "notes": "заметки докладчика", "image": "подсказка для изображения"}}]}}"""


def normalize_presentation(parsed: dict) -> dict:
    slides = []
    for sl in (parsed.get('slides') or []):
        if not isinstance(sl, dict):
            continue
        slides.append({
            'title': str(sl.get('title') or '').strip(),
            'bullets': [str(x).strip() for x in (sl.get('bullets') or []) if str(x).strip()],
            'notes': str(sl.get('notes') or '').strip(),
            'image': str(sl.get('image') or '').strip(),
        })
    return {'title': str(parsed.get('title') or '').strip(), 'slides': slides}


def parse_ai_json(raw: str):
    cleaned = raw.strip()
    if cleaned.startswith('```'):
        cleaned = cleaned.split('```')[1]
        if cleaned.startswith('json'):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()
    return json.loads(cleaned)


PM_TASK_JSON_FORMAT = """{"instruction": "инструкция для обучающегося, 2-3 предложения", "tasks": [{"text": "полный текст задания", "level": "basic | medium | high"}], "criteria": [{"grade": "оценка", "criterion": "критерий", "match": "соответствие ПК и ОК"}], "equipment": "материально-техническое обеспечение, каждый пункт с новой строки", "answerKey": "эталон ответа или ключи для преподавателя"}"""

PM_TASK_TYPES = {
    'practical': 'Практическая работа',
    'lab': 'Лабораторная работа',
    'control': 'Контрольная работа',
    'situational': 'Ситуационные задачи',
    'test': 'Тестовые задания',
    'project': 'Проектное задание',
    'complex': 'Комплексное задание',
}

PM_LEVELS = {
    'basic': 'базовый (репродуктивный): задания по образцу и инструкции',
    'medium': 'средний (конструктивный): применение знаний с анализом и выводами',
    'high': 'высокий (творческий): нестандартные условия, обоснование решений',
    'mixed': 'смешанный: распредели задания по уровням basic, medium и high от простого к сложному',
}


def pm_task_context(f: dict) -> str:
    task_type = PM_TASK_TYPES.get((f.get('taskType') or 'practical').strip(), (f.get('taskType') or 'Практическая работа'))
    level = PM_LEVELS.get((f.get('level') or 'medium').strip(), PM_LEVELS['medium'])
    return f"""Профессиональный модуль: {(f.get('pmCode') or '').strip()} {(f.get('pmName') or '').strip() or 'не указан'}
МДК: {(f.get('mdkCode') or '').strip()} {(f.get('mdkTopic') or '').strip() or 'тема не указана'}
Вид профессиональной деятельности: {(f.get('vd') or '').strip() or 'не указан'}
Формируемые профессиональные компетенции (ПК): {(f.get('pk') or '').strip() or 'не указаны'}
Формируемые общие компетенции (ОК): {(f.get('ok') or '').strip() or 'не указаны'}
Тип задания: {task_type}
Количество заданий: {f.get('taskCount') or 5}
Уровень сложности: {level}
Время выполнения: {f.get('duration') or 90} минут
Форма контроля: {(f.get('controlForm') or 'Дифференцированный зачёт').strip()}
Дополнительные условия: {(f.get('spec') or '').strip() or 'нет'}"""


def build_pm_task_prompt(f: dict) -> str:
    try:
        count = max(1, min(int(f.get('taskCount') or 5), 20))
    except (TypeError, ValueError):
        count = 5
    return f"""Ты опытный методист СПО, специалист по разработке оценочных средств по профессиональным модулям по методическим рекомендациям О.В. Алтынниковой. Составь комплект заданий на русском языке.

{pm_task_context(f)}

Требования: ровно {count} заданий, каждое конкретное, по теме МДК, выполнимое в рамках указанного времени, с привязкой к профессиональной деятельности и формируемым ПК и ОК. В заданиях указывай реальные операции, исходные данные, требуемый результат и форму отчёта. Критерии оценивания дай по четырём уровням: «отлично» / зачтено, «хорошо», «удовлетворительно», «неудовлетворительно» / не зачтено, с указанием, какие ПК и ОК сформированы. Эталон ответа подробный, чтобы преподаватель мог проверять. Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{PM_TASK_JSON_FORMAT}"""


def build_pm_task_refine_prompt(f: dict, instruction: str) -> str:
    tasks = f.get('tasks') or []
    task_lines = "\n".join(f"{i}. [{(t.get('level') or 'medium')}] {(t.get('text') or '').strip()}" for i, t in enumerate(tasks, 1)) or "(нет заданий)"
    crit = f.get('criteria') or []
    crit_lines = "\n".join(f"- {(c.get('grade') or '').strip()} | {(c.get('criterion') or '').strip()} | {(c.get('match') or '').strip()}" for c in crit) or "(нет)"
    return f"""Ты опытный методист СПО. Вот текущий комплект заданий по профессиональному модулю.

{pm_task_context(f)}

Инструкция для обучающегося: {(f.get('instructionText') or '').strip() or '(пусто)'}

Текущие задания:
{task_lines}

Текущие критерии оценивания (оценка | критерий | соответствие):
{crit_lines}

Материально-техническое обеспечение: {(f.get('equipment') or '').strip() or '(пусто)'}
Эталон ответа: {(f.get('answerKey') or '').strip() or '(пусто)'}

Преподаватель просит доработать комплект по замечанию: «{instruction}»

Обнови комплект в соответствии с замечанием. Количество заданий сохраняй, если замечание прямо не просит добавить или убрать. Если замечание касается одного задания или раздела, измени в первую очередь его, но верни ВСЕ поля целиком. Эталон ответа обнови так, чтобы он соответствовал заданиям. Без markdown-разметки.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{PM_TASK_JSON_FORMAT}"""


def normalize_pm_task(parsed: dict) -> dict:
    tasks = []
    for t in parsed.get('tasks') or []:
        if isinstance(t, str):
            t = {'text': t}
        text = str(t.get('text') or '').strip()
        if not text:
            continue
        level = str(t.get('level') or 'medium').strip().lower()
        if level not in ('basic', 'medium', 'high'):
            level = 'medium'
        tasks.append({'text': text, 'level': level})
    criteria = []
    for c in parsed.get('criteria') or []:
        if not isinstance(c, dict):
            continue
        row = {
            'grade': str(c.get('grade') or '').strip(),
            'criterion': str(c.get('criterion') or '').strip(),
            'match': str(c.get('match') or '').strip(),
        }
        if row['grade'] or row['criterion']:
            criteria.append(row)
    return {
        'instruction': str(parsed.get('instruction') or '').strip(),
        'tasks': tasks,
        'criteria': criteria,
        'equipment': str(parsed.get('equipment') or '').strip(),
        'answerKey': str(parsed.get('answerKey') or '').strip(),
    }


def normalize_event_card(parsed: dict) -> dict:
    scenario = []
    for s in parsed.get('scenario') or []:
        if isinstance(s, dict):
            scenario.append({
                'title': str(s.get('title') or ''),
                'time': str(s.get('time') or ''),
                'desc': str(s.get('desc') or ''),
            })
    materials = parsed.get('materials') or ''
    if isinstance(materials, list):
        materials = "\n".join(str(m) for m in materials)
    return {
        'description': str(parsed.get('description') or ''),
        'result': str(parsed.get('result') or ''),
        'scenario': scenario,
        'materials': str(materials),
    }


def build_extracurricular_prompt(data: dict) -> str:
    rows = data.get('rows') or []
    lines = []
    for r in rows:
        total = r.get('total') or 0
        participants = r.get('participants') or 0
        pct = round(participants / total * 100, 1) if total else 0
        lines.append(
            f"{r.get('year', '')}; {r.get('date', '')}; дисциплина «{r.get('subject', '')}»; "
            f"группа {r.get('group', '')}; в группе {total} чел.; вид «{r.get('type', '')}»; "
            f"{r.get('desc', '')}; участников {participants} ({pct}%)"
        )
    rows_block = "\n".join(lines) if lines else "нет данных"

    return f"""Ты опытный методист и заместитель директора по воспитательной работе. На основе учёта внеаудиторных мероприятий составь развёрнутую аналитическую справку на русском языке.

Данные по мероприятиям (учебный год; дата; дисциплина; группа; численность; вид деятельности; описание; участники и процент охвата):
{rows_block}

Составь справку из следующих разделов (используй именно эти заголовки):
1. Общие количественные показатели — сколько мероприятий, групп, дисциплин, суммарный охват и средний процент вовлечённости.
2. Структура по видам деятельности — какие форматы преобладают, насколько сбалансирована работа.
3. Анализ уровня вовлечённости — где охват высокий (75% и выше), средний (40-74%), низкий (менее 40%), с конкретными примерами и возможными причинами.
4. Содержательный анализ — какие направления воспитательной и профессионально-ориентированной работы реализуются.
5. Выводы и рекомендации — сильные стороны, зоны роста и конкретные шаги по повышению вовлечённости обучающихся.

Пиши развёрнуто, конкретно, по-деловому, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов."""


def build_project_activity_prompt(data: dict) -> str:
    rows = data.get('rows') or []
    lines = []
    for r in rows:
        lines.append(
            f"{r.get('year', '')}; направление «{r.get('category', '')}»; «{r.get('title', '')}»; "
            f"уровень {r.get('level', '')}; содержание: {r.get('content', '')}; результат: {r.get('result', '')}"
        )
    rows_block = "\n".join(lines) if lines else "нет данных"

    return f"""Ты опытный методист и заместитель директора по научно-методической работе. На основе учёта проектной и исследовательской деятельности педагога составь развёрнутую аналитическую справку на русском языке.

Данные (год; направление; название; уровень; содержание деятельности; результат):
{rows_block}

Составь справку из следующих разделов (используй именно эти заголовки):
1. Общие показатели — количество проектов и исследований, охваченные годы, распределение по направлениям.
2. Уровни представления результатов — муниципальный, региональный, всероссийский, международный; динамика по годам.
3. Содержательный анализ — основные темы, методы и подходы, их связь с образовательным процессом.
4. Результативность — награды, публикации, внедрение в практику, значимость результатов.
5. Выводы и рекомендации — сильные стороны, зоны роста, конкретные шаги по развитию проектной и исследовательской деятельности.

Опирайся только на переданные данные, не выдумывай факты. Пиши развёрнуто, по-деловому, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов."""


def build_correction_work_prompt(data: dict) -> str:
    rows = data.get('rows') or []
    lines = []
    for r in rows:
        lines.append(
            f"Учебный год {_s(r.get('year'))}; категория: {_s(r.get('category'))}\n"
            f"   Лексико-грамматический строй речи: {_s(r.get('lexis')) or '—'}\n"
            f"   Связная речь: {_s(r.get('coherent')) or '—'}\n"
            f"   Звукопроизношение: {_s(r.get('sound')) or '—'}\n"
            f"   ФФ процессы: {_s(r.get('phonemic')) or '—'}\n"
            f"   Письменная речь: {_s(r.get('written')) or '—'}"
        )
    rows_block = "\n".join(lines) if lines else "нет данных"

    return f"""Ты опытный учитель-логопед, методист и эксперт по коррекционной работе. На основе таблицы направлений коррекционной работы составь развёрнутую аналитическую справку на русском языке.

Данные по учебным годам и категориям обучающихся:
{rows_block}

Составь справку из следующих разделов (используй именно эти заголовки):
1. Общая характеристика коррекционной работы — охваченные учебные годы и категории обучающихся (дошкольники, школьники), общая структура направлений.
2. Содержание работы по направлениям — лексико-грамматический строй речи, связная речь, звукопроизношение, фонематические (ФФ) процессы, письменная речь: что реализуется, какие приёмы и виды упражнений.
3. Преемственность и динамика — как менялось содержание работы по годам и от дошкольного к школьному возрасту.
4. Системность и полнота — какие направления представлены широко, какие раскрыты недостаточно или пропущены.
5. Выводы и рекомендации — сильные стороны, зоны роста, конкретные шаги по развитию коррекционной работы.

Опирайся только на переданные данные, не выдумывай факты и статистику. Если направление не заполнено, отметь это как зону роста. Для дошкольников письменная речь не заполняется — это нормально, не считай это недостатком. Пиши развёрнуто, по-деловому, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов."""


def build_extracurricular_plan_prompt(data: dict) -> str:
    rows = data.get('rows') or []
    period = (data.get('period') or 'год').strip()
    lines = []
    for r in rows:
        total = r.get('total') or 0
        participants = r.get('participants') or 0
        pct = round(participants / total * 100, 1) if total else 0
        lines.append(
            f"{r.get('year', '')}; {r.get('date', '')}; дисциплина «{r.get('subject', '')}»; "
            f"группа {r.get('group', '')}; вид «{r.get('type', '')}»; {r.get('desc', '')}; охват {pct}%"
        )
    rows_block = "\n".join(lines) if lines else "нет данных"

    return f"""Ты опытный методист и заместитель директора по воспитательной работе. На основе учёта проведённых внеаудиторных мероприятий составь план внеаудиторной деятельности на русском языке на период: {period}.

Данные о проведённых мероприятиях (учебный год; дата; дисциплина; группа; вид деятельности; описание; процент охвата):
{rows_block}

Что нужно сделать: сохрани удачные форматы с высоким охватом, усиль направления с низким охватом, добавь виды деятельности, которых не хватает, распредели мероприятия равномерно по месяцам периода.

Структура плана (используй именно эти заголовки):
1. Цель и задачи внеаудиторной деятельности на период.
2. План мероприятий по месяцам — для каждого мероприятия: название, вид деятельности, целевая группа, ответственный (роль), ожидаемый охват.
3. Меры по повышению вовлечённости обучающихся.
4. Ожидаемые результаты и показатели эффективности.

Пиши конкретно, по-деловому, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов и пунктов."""


CHAT_SYSTEM_PROMPT = """Ты ИИ-помощник УрокАИ для учителей и педагогов. Ты дружелюбно и по-деловому помогаешь с методическими вопросами: как составить план урока, придумать игру, оценить работу учеников, подобрать технологию обучения и т.д.

Правила:
- Отвечай кратко (3-6 предложений), по-деловому, дружелюбно, на русском языке
- Если вопрос касается урока, игры, интенсива или задания — porекомендуй использовать соответствующий генератор на сайте (Генератор уроков / Генератор игры / Генератор интенсивов / Генератор заданий)
- Если вопрос про проверку тетрадей — упомяни раздел «Проверка тетради по фото»
- Не пиши markdown-разметку (без **, #)
- Можешь использовать 1-2 уместных эмодзи"""


def build_tech_matrix_prompt(data: dict) -> str:
    fgos = data.get('fgos') or {}
    names = [str(n).strip() for n in (data.get('technologies') or []) if str(n).strip()]
    count = _int(data.get('count'), 1, 10, 5)
    ctx = [
        f"Дисциплина / МДК / ПМ: {_s(data.get('subject')) or 'не указано'}",
        f"Профессиональная направленность: {_s(data.get('prof')) or 'не указано'}",
        f"Региональный компонент: {_s(data.get('region')) or 'не указан'}",
    ]
    if fgos.get('on'):
        ctx.append("Требования ФГОС СПО учитываются.")
        if _s(fgos.get('code')):
            ctx.append(f"Профессия / специальность: {_s(fgos.get('code'))}")
        if _s(fgos.get('level')):
            ctx.append(f"Уровень: {_s(fgos.get('level'))}")
        if _s(fgos.get('komps')):
            ctx.append(f"Формируемые компетенции: {_s(fgos.get('komps'))}")
        if _s(fgos.get('req')):
            ctx.append(f"Учтённые требования: {_s(fgos.get('req'))}")
    else:
        ctx.append("Требования ФГОС СПО отдельно не указаны, опирайся на общие принципы компетентностного подхода.")
    ctx_block = "\n".join(ctx)

    if names:
        task = "Заполни матрицу для следующих технологий обучения (названия не меняй, порядок сохрани):\n" + "\n".join(f"- {n}" for n in names)
    else:
        task = f"Подбери {count} наиболее подходящих современных технологий обучения для этой дисциплины и заполни по ним матрицу."

    return f"""Ты опытный методист колледжа. Составь строки «Матрицы используемых технологий обучения» для методической документации преподавателя.

{ctx_block}

{task}

Для каждой технологии напиши:
- t: название технологии;
- o: обоснование выбора технологии (3-4 предложения): связь со спецификой дисциплины и профессии, региональным компонентом (если указан), требованиями ФГОС СПО и формируемыми компетенциями;
- r: методическая и практическая результативность применения (3-4 предложения): какие измеримые показатели отслеживаются (качество знаний, средний балл, сформированность ПК и ОК, результаты практики, участие в конкурсах). Не выдумывай конкретную статистику: вместо чисел ставь пропуски «___», чтобы преподаватель вписал свои данные.

Пиши по-деловому, на русском языке, без markdown-разметки.
Верни строго валидный JSON без пояснений в формате: {{"rows": [{{"t": "...", "o": "...", "r": "..."}}]}}"""


def build_tech_matrix_analysis_prompt(data: dict) -> str:
    fgos = data.get('fgos') or {}
    rows = data.get('rows') or []
    lines = []
    for i, r in enumerate(rows, 1):
        lines.append(f"{i}. Технология: {_s(r.get('t'))}\n   Обоснование: {_s(r.get('o'))}\n   Результативность: {_s(r.get('r'))}")
    rows_block = "\n".join(lines) if lines else "нет данных"
    fgos_line = "Требования ФГОС СПО учитываются." if fgos.get('on') else "Требования ФГОС СПО отдельно не указаны."
    if fgos.get('on') and _s(fgos.get('komps')):
        fgos_line += f" Формируемые компетенции: {_s(fgos.get('komps'))}."

    return f"""Ты опытный методист колледжа и заместитель директора по учебно-методической работе. На основе заполненной «Матрицы используемых технологий обучения» составь развёрнутую аналитическую справку на русском языке.

Дисциплина / МДК / ПМ: {_s(data.get('subject')) or 'не указано'}
Профессиональная направленность: {_s(data.get('prof')) or 'не указано'}
Региональный компонент: {_s(data.get('region')) or 'не указан'}
{fgos_line}

Матрица технологий:
{rows_block}

Составь справку из следующих разделов (используй именно эти заголовки):
1. Общая характеристика — сколько технологий применяется, какие группы они образуют (проектные, проблемные, цифровые, игровые и т.д.).
2. Обоснование выбора технологий — как они связаны со спецификой дисциплины, профессии, региональным компонентом (если указан) и требованиями ФГОС СПО.
3. Результативность применения — какие показатели отслеживаются и каких результатов достигнуто; если в данных остались пропуски «___», отметь, какие показатели нужно дополнить.
4. Влияние на формирование компетенций — вклад технологий в профессиональные и общие компетенции.
5. Выводы и рекомендации — сильные стороны, зоны роста, какие технологии стоит добавить или усилить.

Опирайся только на переданные данные, не выдумывай цифры и факты. Пиши развёрнуто, по-деловому, без markdown-разметки (без **, #), обычным текстом с нумерацией разделов."""


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
    "Математика", "Русский язык", "Информатика",
    "Физика", "Химия",
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
Оцени процент уникальности текста (originality_percent) — целое число от 0 до 100, где 100 — полностью оригинальный авторский текст, 0 — полностью скопированный/пересказанный без переработки.
Составь предварительное заключение:
1. низкий/средний/высокий риск проблем с оригинальностью;
2. какие части требуют дополнительной проверки преподавателем.
Выдели подозрительные абзацы и дай рекомендации.

Верни ответ СТРОГО в формате JSON без markdown, пояснений или текста до/после:
{"originality_percent": 0, "risk_level": "низкий|средний|высокий", "summary": "краткое общее заключение, 2-4 предложения", "originality_notes": "насколько текст оригинален по стилю и формулировкам", "style_notes": "признаки механического копирования, шаблонности, резких смен стиля", "sources_notes": "как студент перерабатывает источники — пересказ или анализ", "suspicious_fragments": [{"quote": "короткая цитата подозрительного фрагмента из текста", "reason": "почему фрагмент вызывает подозрение"}], "review_parts": ["какая часть работы требует дополнительной проверки преподавателем"], "recommendations": ["конкретная рекомендация преподавателю"]}"""


def build_notebook_system_prompt(subject: str) -> str:
    subj = subject if subject in NOTEBOOK_SUBJECTS else "предмет не указан"
    return f"""Ты опытный учитель-предметник по дисциплине «{subj}», который проверяет фотографии тетрадей учеников именно по этому предмету. Проанализируй изображение: найди выполненные задания по предмету «{subj}», определи ошибки с учётом специфики предмета (для математики/физики/химии — проверяй вычисления и формулы, для русского языка/литературы — орфографию, пунктуацию и раскрытие темы, для информатики — логику и синтаксис, для истории/обществознания — фактическую точность и аргументацию), оцени качество и аккуратность оформления.

Верни ответ СТРОГО в формате JSON без markdown, пояснений или текста до/после:
{{"score": <целое число 0-100, процент правильности>, "correct": <целое число, сколько заданий верно>, "total": <целое число, сколько всего заданий видно на фото>, "notes": ["замечание 1", "замечание 2", "замечание 3"], "recognized_text": "распознанный с фото текст работы дословно, включая все числа, формулы и равенства через знак =, каждое отдельное задание/строку с новой строки"}}

Если на фото не видно учебной работы (тетради, заданий), верни: {{"score": 0, "correct": 0, "total": 0, "notes": ["На фото не удалось распознать учебную работу. Попробуйте сделать снимок чётче и ближе."], "recognized_text": ""}}

Замечания пиши кратко, конкретно, на русском языке, с указанием номера задания если возможно, учитывая специфику предмета «{subj}»."""


PROJECT_FORMAT_1 = """{"name": "название проекта", "description": "краткое описание 2 предложения", "problem": {"text": "в чём проблема", "relevance": "актуальность", "scale": "масштаб и последствия"}, "audience": [{"segment": "сегмент", "traits": "характеристики", "needs": "потребности", "size": "оценка численности"}], "smart": {"s": "конкретность", "m": "измеримость", "a": "достижимость", "r": "значимость", "t": "срок"}, "goal": "итоговая формулировка цели", "tasks": [{"name": "задача", "responsible": "роль ответственного", "startWeek": 1, "endWeek": 3, "priority": "Высокий | Средний | Низкий"}], "stages": [{"name": "этап", "result": "результат этапа", "period": "сроки", "responsible": "ответственный"}], "milestones": [{"when": "срок", "name": "веха", "criterion": "критерий достижения"}]}"""

PROJECT_FORMAT_2 = """{"team": [{"role": "роль", "duties": "зона ответственности", "load": "загрузка"}], "stakeholders": [{"name": "сторона", "type": "тип", "interest": "интерес и влияние", "strategy": "стратегия взаимодействия"}], "lifecycle": [{"phase": "Инициация | Планирование | Исполнение | Мониторинг | Завершение", "actions": "основные действия", "results": "результаты", "period": "сроки"}], "assumptions": [{"text": "допущение", "basis": "обоснование"}], "constraints": [{"type": "Время | Бюджет | Ресурсы | Нормативные | Организационные", "description": "описание", "impact": "влияние", "mitigation": "как смягчить"}], "risks": [{"risk": "риск", "category": "категория", "probability": 3, "impact": 4, "strategy": "Избежание | Снижение | Передача | Принятие", "measures": "меры реагирования"}], "kpi": [{"name": "показатель", "target": "целевое значение", "frequency": "частота измерения"}], "reporting": [{"type": "отчёт или совещание", "frequency": "периодичность", "content": "содержание"}], "changeProcedure": "порядок внесения изменений"}"""

PROJECT_JSON_FORMAT = PROJECT_FORMAT_1[:-1] + ", " + PROJECT_FORMAT_2[1:]


def project_context(f: dict) -> str:
    lines = [
        f"Тема / идея проекта: {(f.get('topic') or '').strip()}",
        f"Тип проекта: {(f.get('projectType') or 'Учебный проект').strip()}",
        f"Организация: {(f.get('org') or 'не указана').strip()}",
        f"Целевая аудитория: {(f.get('audience') or 'определи самостоятельно').strip()}",
        f"Длительность: {(f.get('duration') or '3 месяца').strip()}",
        f"Размер команды: {(f.get('teamSize') or 'определи самостоятельно').strip()}",
        f"Бюджет: {(f.get('budget') or 'не указан').strip()}",
    ]
    extra = (f.get('extra') or '').strip()
    if extra:
        lines.append(f"Дополнительные пожелания: {extra}")
    return "\n".join(lines)


def build_project_prompt(f: dict, part: int = 1) -> str:
    if part == 1:
        req = """- цель по критериям SMART, итоговая формулировка цели одним предложением;
- 2-3 сегмента аудитории;
- 5-7 задач; startWeek и endWeek целые числа (недели от начала проекта), укладываются в длительность проекта;
- 4-5 этапов, 3-4 вехи."""
        fmt = PROJECT_FORMAT_1
    else:
        req = """- 3-5 участников команды, 3-4 стейкхолдера;
- жизненный цикл: ровно 5 фаз (Инициация, Планирование, Исполнение, Мониторинг, Завершение);
- 3-4 допущения, 3-4 ограничения, 5-6 рисков (probability и impact целые числа от 1 до 5), 4-5 KPI, 3 вида отчётности."""
        fmt = PROJECT_FORMAT_2
    return f"""Ты опытный руководитель проектов и методист. Составь часть плана проекта на русском языке по исходным данным.

{project_context(f)}

Требования:
{req}
- каждое текстовое поле — одна короткая фраза (до 15 слов), конкретно по теме, без общих слов.

Верни строго валидный JSON без markdown и пояснений в формате:
{fmt}"""


def build_project_refine_prompt(f: dict, instruction: str) -> str:
    current = json.dumps(f.get('project') or {}, ensure_ascii=False)
    return f"""Ты опытный руководитель проектов. Ниже исходные данные и текущий план проекта. Доработай план по замечанию пользователя, сохранив структуру и всё, что замечание не затрагивает.

{project_context(f)}

Текущий план (JSON):
{current}

Замечание пользователя: {instruction}

Текстовые поля пиши короткими фразами (до 15 слов). Верни полный обновлённый план строго валидным JSON без markdown и пояснений в формате:
{PROJECT_JSON_FORMAT}"""


def _s(v) -> str:
    return str(v).strip() if v is not None else ''


def _int(v, lo, hi, default):
    try:
        n = int(v)
    except (TypeError, ValueError):
        return default
    return max(lo, min(hi, n))


def _rows(parsed: dict, key: str, fields: list) -> list:
    items = parsed.get(key)
    if not isinstance(items, list):
        return []
    out = []
    for it in items:
        if isinstance(it, dict):
            out.append({k: _s(it.get(k)) for k in fields})
    return out


def normalize_project(parsed: dict) -> dict:
    if not isinstance(parsed, dict):
        parsed = {}
    problem = parsed.get('problem') if isinstance(parsed.get('problem'), dict) else {}
    smart = parsed.get('smart') if isinstance(parsed.get('smart'), dict) else {}

    tasks = []
    for it in parsed.get('tasks') or []:
        if isinstance(it, dict) and _s(it.get('name')):
            start = _int(it.get('startWeek'), 1, 200, 1)
            end = _int(it.get('endWeek'), 1, 200, start)
            if end < start:
                end = start
            tasks.append({
                'name': _s(it.get('name')),
                'responsible': _s(it.get('responsible')),
                'startWeek': start,
                'endWeek': end,
                'priority': _s(it.get('priority')) or 'Средний',
            })

    risks = []
    for it in parsed.get('risks') or []:
        if isinstance(it, dict) and _s(it.get('risk')):
            risks.append({
                'risk': _s(it.get('risk')),
                'category': _s(it.get('category')),
                'probability': _int(it.get('probability'), 1, 5, 3),
                'impact': _int(it.get('impact'), 1, 5, 3),
                'strategy': _s(it.get('strategy')),
                'measures': _s(it.get('measures')),
            })

    return {
        'name': _s(parsed.get('name')),
        'description': _s(parsed.get('description')),
        'problem': {k: _s(problem.get(k)) for k in ('text', 'relevance', 'scale')},
        'audience': _rows(parsed, 'audience', ['segment', 'traits', 'needs', 'size']),
        'smart': {k: _s(smart.get(k)) for k in ('s', 'm', 'a', 'r', 't')},
        'goal': _s(parsed.get('goal')),
        'tasks': tasks,
        'stages': _rows(parsed, 'stages', ['name', 'result', 'period', 'responsible']),
        'milestones': _rows(parsed, 'milestones', ['when', 'name', 'criterion']),
        'team': _rows(parsed, 'team', ['role', 'duties', 'load']),
        'stakeholders': _rows(parsed, 'stakeholders', ['name', 'type', 'interest', 'strategy']),
        'lifecycle': _rows(parsed, 'lifecycle', ['phase', 'actions', 'results', 'period']),
        'assumptions': _rows(parsed, 'assumptions', ['text', 'basis']),
        'constraints': _rows(parsed, 'constraints', ['type', 'description', 'impact', 'mitigation']),
        'risks': risks,
        'kpi': _rows(parsed, 'kpi', ['name', 'target', 'frequency']),
        'reporting': _rows(parsed, 'reporting', ['type', 'frequency', 'content']),
        'changeProcedure': _s(parsed.get('changeProcedure')),
    }


WORKSHEET_TYPES = {'open', 'choice', 'table'}


def worksheet_context(f: dict) -> str:
    plan = (f.get('planText') or '').strip()[:6000]
    plan_line = f"\nПлан-конспект урока (опирайся на него):\n{plan}" if plan else ""
    return f"""Тема урока: {(f.get('topic') or 'не указана').strip()}
Дисциплина: {(f.get('discipline') or 'не указана').strip()}
Группа / класс: {(f.get('group') or 'не указана').strip()}
Уровень сложности: {(f.get('level') or 'средний').strip()}{plan_line}"""


WORKSHEET_JSON_FORMAT = """{"tasks": [{"title": "короткое название задания", "type": "open | choice | table", "description": "полный текст условия для обучающегося", "options": ["вариант ответа"], "columns": ["заголовок столбца"], "rows": 3}]}"""


def build_worksheet_prompt(f: dict) -> str:
    try:
        count = max(1, min(int(f.get('taskCount') or 5), 12))
    except (TypeError, ValueError):
        count = 5
    types = [t for t in (f.get('types') or []) if t in WORKSHEET_TYPES] or ['open', 'choice', 'table']
    return f"""Составь задания для рабочего листа, который обучающиеся заполнят на занятии.

{worksheet_context(f)}

Количество заданий: {count}
Допустимые типы заданий: {', '.join(types)}
Типы: open — открытый ответ на строках; choice — выбор правильного ответа (поле options содержит 3-4 варианта, пустым не оставляй); table — таблица для заполнения (поле columns содержит 2-4 заголовка, rows — число пустых строк от 2 до 6).
Чередуй типы из допустимых, задания должны идти от простого к сложному, формулируй конкретно, на «вы». Без markdown-разметки.

Верни ТОЛЬКО валидный JSON в формате:
{WORKSHEET_JSON_FORMAT}"""


def build_worksheet_refine_prompt(f: dict, instruction: str) -> str:
    lines = []
    for i, t in enumerate(f.get('tasks') or [], 1):
        lines.append(f"{i}. [{t.get('type') or 'open'}] {(t.get('title') or '').strip()}: {(t.get('description') or '').strip()}")
    return f"""Ты дорабатываешь задания рабочего листа по запросу преподавателя.

{worksheet_context(f)}

Текущие задания:
{chr(10).join(lines) or '(нет заданий)'}

Инструкция преподавателя: {instruction}

Верни ВСЕ задания целиком с учётом инструкции, сохраняя те, которых она не касается. Типы: open, choice (options 3-4 варианта), table (columns 2-4 заголовка, rows 2-6). Без markdown-разметки.

Верни ТОЛЬКО валидный JSON в формате:
{WORKSHEET_JSON_FORMAT}"""


def normalize_worksheet(parsed: dict) -> list:
    tasks = []
    for t in parsed.get('tasks') or []:
        if not isinstance(t, dict):
            continue
        ttype = t.get('type') if t.get('type') in WORKSHEET_TYPES else 'open'
        description = str(t.get('description') or '').strip()
        if not description:
            continue
        options = [str(o).strip() for o in (t.get('options') or []) if str(o).strip()][:6]
        columns = [str(c).strip() for c in (t.get('columns') or []) if str(c).strip()][:5]
        try:
            rows = max(2, min(int(t.get('rows') or 3), 8))
        except (TypeError, ValueError):
            rows = 3
        if ttype == 'choice' and len(options) < 2:
            ttype = 'open'
        if ttype == 'table' and len(columns) < 2:
            columns = ['Показатель', 'Ответ']
        tasks.append({
            'title': str(t.get('title') or 'Задание').strip(),
            'type': ttype,
            'description': description,
            'options': options if ttype == 'choice' else [],
            'columns': columns if ttype == 'table' else [],
            'rows': rows,
        })
    return tasks


def rpd_context(f: dict) -> str:
    def v(key, default='не указано'):
        return str(f.get(key) or '').strip() or default
    hours = f"лекции {v('hoursLecture', '0')}, практические {v('hoursPractice', '0')}, лабораторные {v('hoursLab', '0')}, СРС {v('hoursSelf', '0')}, контроль {v('hoursControl', '0')}"
    return f"""Дисциплина: {v('disciplineName')}
Код дисциплины: {v('disciplineCode')}
ФГОС: {v('fgos')}
Направление подготовки / специальность: {v('direction')}
Образовательная программа: {v('programName')}
Профиль: {v('profile')}
Курс: {v('course')}, семестр: {v('semester')}
Общая трудоёмкость: {v('totalHours')} ч., {v('credits')} ЗЕ
Форма промежуточной аттестации: {v('attestationType')}
Объём по видам работы (часы): {hours}"""


def build_rpd_prompt(part: str, f: dict) -> str:
    ctx = rpd_context(f)
    wishes = (f.get('wishes') or '').strip()
    wishes_line = f"\nПожелания преподавателя: {wishes}" if wishes else ""
    if part == 'content':
        return f"""Составь основу рабочей программы дисциплины (РПД) для вуза или колледжа.

{ctx}{wishes_line}

Требования: цель — одно-два предложения; 4-7 задач; 3-6 компетенций с кодами в логике ФГОС (если ФГОС указан — используй его реальные коды, иначе универсальные УК/ОПК/ПК) и подходящим оценочным средством для каждой; пререквизиты и постреквизиты через запятую; структура — 3-6 разделов по 2-4 темы в формате «Раздел 1. Название» и «Тема 1.1. Название», каждая строка отдельно. Без markdown-разметки.

Верни ТОЛЬКО валидный JSON:
{{"goal": "цель", "tasks": ["задача"], "competencies": [{{"code": "УК-1", "text": "формулировка компетенции", "tool": "оценочное средство"}}], "prereq": "текст", "postreq": "текст", "structure": "разделы и темы, каждая с новой строки"}}"""
    if part == 'ktp':
        structure = (f.get('structure') or '').strip() or 'структура не задана — придумай её сам по названию дисциплины'
        return f"""Составь календарно-тематический план (КТП) для рабочей программы дисциплины.

{ctx}

Структура дисциплины:
{structure}

Требования: по одной строке на тему (разделы можно давать отдельной строкой без часов); в каждой строке часы: total = lect + pract + lab + self; суммы по столбцам должны точно совпадать с заданным объёмом по видам работы (лекции, практические, лабораторные, СРС); если для вида работы указан 0 — ставь 0. Поле control — вид контроля по теме (тест, контрольная работа, коллоквиум, отчёт и т.п., можно пустое). Без markdown-разметки.

Верни ТОЛЬКО валидный JSON:
{{"rows": [{{"topic": "Тема 1.1. Название", "total": 4, "lect": 2, "pract": 2, "lab": 0, "self": 0, "control": "тест"}}]}}"""
    if part == 'support':
        structure = (f.get('structure') or '').strip()
        return f"""Составь раздел «Учебно-методическое обеспечение» рабочей программы дисциплины.

{ctx}

Структура дисциплины:
{structure or 'не задана'}{wishes_line}

Требования: основная литература — 2-4 источника, дополнительная — 3-5; только реальные, широко известные учебники и пособия по этой дисциплине, не старше 10-12 лет, если они существуют; оформляй по ГОСТ: «Автор И.О. Название. — Город: Издательство, Год. — Объём с.»; если не уверен в точных выходных данных (издательство, год, число страниц) — не выдумывай их, укажи только то, что знаешь точно. Электронные образовательные ресурсы — 3-5 надёжных ресурсов (портал, курс, электронная библиотека) с названием и адресом, если адрес известен точно. Программное обеспечение — 3-6 пунктов в формате «Название — назначение», с приоритетом отечественного и свободного ПО. Информационные справочные системы — 2-4 пункта. Материально-техническое обеспечение — оборудование аудиторий и лабораторий под виды занятий этой дисциплины. Каждый пункт с новой строки. Без markdown-разметки.

Верни ТОЛЬКО валидный JSON:
{{"mainLit": "источники, каждый с новой строки", "addLit": "источники, каждый с новой строки", "eResources": "ресурсы, каждый с новой строки", "software": "пункты, каждый с новой строки", "infoSystems": "пункты, каждый с новой строки", "materials": "описание оборудования"}}"""
    structure = (f.get('structure') or '').strip()
    comps = (f.get('competenciesText') or '').strip()
    return f"""Составь оценочные средства для рабочей программы дисциплины.

{ctx}

Структура дисциплины:
{structure or 'не задана'}

Компетенции:
{comps or 'не заданы'}{wishes_line}

Требования: текущий контроль и промежуточная аттестация (с учётом формы аттестации) — конкретные формы и когда проводятся; критерии оценивания по шкале «отлично / хорошо / удовлетворительно / неудовлетворительно» (для зачёта — «зачтено / не зачтено»); 6-10 типовых контрольных заданий или вопросов по темам; процедура оценивания (как проходит аттестация, сколько времени, какие материалы разрешены). Каждое поле — связный текст, строки разделяй переносами. Без markdown-разметки.

Верни ТОЛЬКО валидный JSON:
{{"currentControl": "текст", "intermediateControl": "текст", "criteria": "текст", "sampleTasks": "текст", "evalMethods": "текст"}}"""


def rpd_text(value) -> str:
    if isinstance(value, list):
        return '\n'.join(str(x).strip() for x in value if str(x).strip())
    return str(value or '').strip()


def rpd_int(value) -> int:
    try:
        return max(0, int(float(value)))
    except (TypeError, ValueError):
        return 0


def normalize_rpd(part: str, parsed: dict) -> dict:
    if part == 'content':
        comps = []
        for c in parsed.get('competencies') or []:
            if isinstance(c, dict) and (c.get('code') or c.get('text')):
                comps.append({'code': rpd_text(c.get('code')), 'text': rpd_text(c.get('text')), 'tool': rpd_text(c.get('tool'))})
        return {
            'goal': rpd_text(parsed.get('goal')),
            'tasks': rpd_text(parsed.get('tasks')),
            'competencies': comps,
            'prereq': rpd_text(parsed.get('prereq')),
            'postreq': rpd_text(parsed.get('postreq')),
            'structure': rpd_text(parsed.get('structure')),
        }
    if part == 'ktp':
        rows = []
        for r in parsed.get('rows') or []:
            if not isinstance(r, dict) or not rpd_text(r.get('topic')):
                continue
            lect, pract, lab, self_ = rpd_int(r.get('lect')), rpd_int(r.get('pract')), rpd_int(r.get('lab')), rpd_int(r.get('self'))
            total = lect + pract + lab + self_ or rpd_int(r.get('total'))
            rows.append({'topic': rpd_text(r.get('topic')), 'total': total, 'lect': lect, 'pract': pract, 'lab': lab, 'self': self_, 'control': rpd_text(r.get('control'))})
        return {'rows': rows}
    if part == 'support':
        return {k: rpd_text(parsed.get(k)) for k in ('mainLit', 'addLit', 'eResources', 'software', 'infoSystems', 'materials')}
    return {k: rpd_text(parsed.get(k)) for k in ('currentControl', 'intermediateControl', 'criteria', 'sampleTasks', 'evalMethods')}


KOS_TASK_TYPES = ['Практическое задание', 'Лабораторная работа', 'Тест', 'Кейс-задача', 'Курсовой проект', 'Устный опрос', 'Коллоквиум', 'Демонстрационный экзамен', 'Другое']
KOS_CONTROL_TYPES = ['Текущий', 'Промежуточный', 'Итоговый', 'Демонстрационный экзамен']
KOS_PARTS = ('competencies', 'control', 'tasks', 'criteria')

KOS_FORMATS = {
    'competencies': '{"competencies": [{"code": "ОК 01 или ПК 1.1", "name": "формулировка компетенции по ФГОС СПО", "indicators": [{"code": "З.1 | У.1 | В.1 | ПО.1", "name": "что знает, умеет или владеет обучающийся"}]}]}',
    'control': '{"current": "виды текущего контроля", "intermediate": "виды промежуточного контроля", "final": "итоговая аттестация", "selfStudy": "самостоятельная работа"}',
    'tasks': '{"tasks": [{"name": "название оценочного средства", "type": "один из допустимых типов", "controlType": "один из допустимых видов контроля", "indicator": "КОД_КОМПЕТЕНЦИИ.КОД_ЭЛЕМЕНТА строго из списка", "description": "формулировка задания, условия, требования к результату"}]}',
    'criteria': '{"scale": "шкала оценивания, каждая оценка с новой строки", "generalCriteria": "общие критерии, каждый с новой строки", "levels": [{"name": "название уровня", "description": "диапазон, например 86-100%", "criteria": "признаки уровня"}]}',
}


def kos_context(f: dict) -> str:
    p = f.get('passport') or {}
    comps = f.get('competencies') or []
    comp_lines = []
    for c in comps:
        inds = "; ".join(f"{_s(i.get('code'))} {_s(i.get('name'))}" for i in (c.get('indicators') or []))
        comp_lines.append(f"- {_s(c.get('code'))} {_s(c.get('name'))} (элементы: {inds or 'нет'})")
    tasks = f.get('tasks') or []
    task_lines = [f"- {_s(t.get('name'))} [{_s(t.get('type'))}, {_s(t.get('controlType'))}]" for t in tasks]
    return f"""Специальность СПО: {_s(p.get('direction')) or 'не указана'}
Дисциплина / МДК: {_s(p.get('discipline')) or 'не указана'}
Трудоёмкость: {_s(p.get('credits')) or 'не указана'}
Форма промежуточной аттестации: {_s(p.get('intermediate')) or 'не указана'}
Компетенции:
{chr(10).join(comp_lines) or '(пока не заданы)'}
Уже есть оценочные средства:
{chr(10).join(task_lines) or '(пока нет)'}"""


def build_kos_part_prompt(part: str, f: dict) -> str:
    wish = _s(f.get('wish'))
    wish_line = f"\nПожелания преподавателя: {wish}" if wish else ""
    base = f"""Ты опытный методист СПО, разрабатываешь фонд оценочных средств (ФОС/КОС) по ФГОС СПО. Пиши на русском языке, конкретно, без markdown-разметки.

{kos_context(f)}{wish_line}

"""
    if part == 'competencies':
        count = _int(f.get('compCount'), 1, 12, 4)
        task = f"Подбери {count} компетенций (общих ОК и профессиональных ПК), которые реально формируются по этой дисциплине / МДК в рамках указанной специальности. Для каждой дай 2-3 элемента (знать / уметь / владеть) с кодами вида З.1, У.1, В.1 (коды уникальны внутри компетенции). Если компетенции уже заданы, предложи только недостающие."
    elif part == 'control':
        task = "Сформулируй формы и виды контроля: текущий, промежуточный, итоговый (с учётом формы промежуточной аттестации) и самостоятельную работу обучающихся. Каждое поле 1-3 предложения."
    elif part == 'tasks':
        count = _int(f.get('taskCount'), 1, 15, 5)
        comps = f.get('competencies') or []
        codes = [f"{_s(c.get('code'))}.{_s(i.get('code'))}" for c in comps for i in (c.get('indicators') or [])]
        task = f"""Составь {count} оценочных средств (заданий) для этой дисциплины / МДК. Каждое задание конкретное, выполнимое, с исходными данными и требуемым результатом. Распредели виды контроля от текущего к итоговому.
Допустимые типы: {', '.join(KOS_TASK_TYPES)}.
Допустимые виды контроля: {', '.join(KOS_CONTROL_TYPES)}.
Поле indicator заполняй СТРОГО одним значением из списка: {', '.join(codes) if codes else 'оставь пустую строку, компетенции не заданы'}."""
    else:
        task = "Составь шкалу оценивания (5-балльная, с процентами), общие критерии оценивания и 3 уровня сформированности компетенций (высокий, средний, низкий) с диапазонами и признаками."
    return f"""{base}{task}

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{KOS_FORMATS[part]}"""


def normalize_kos_part(part: str, parsed: dict) -> dict:
    if part == 'competencies':
        out = []
        for c in parsed.get('competencies') or []:
            if not isinstance(c, dict):
                continue
            inds = [{'code': _s(i.get('code')), 'name': _s(i.get('name'))} for i in (c.get('indicators') or []) if isinstance(i, dict) and (_s(i.get('code')) or _s(i.get('name')))]
            if _s(c.get('code')) or _s(c.get('name')):
                out.append({'code': _s(c.get('code')), 'name': _s(c.get('name')), 'indicators': inds or [{'code': '', 'name': ''}]})
        return {'competencies': out}
    if part == 'control':
        return {k: _s(parsed.get(k)) for k in ('current', 'intermediate', 'final', 'selfStudy')}
    if part == 'tasks':
        out = []
        for t in parsed.get('tasks') or []:
            if not isinstance(t, dict) or not _s(t.get('name')):
                continue
            ttype = _s(t.get('type'))
            ctype = _s(t.get('controlType'))
            out.append({
                'name': _s(t.get('name')),
                'type': ttype if ttype in KOS_TASK_TYPES else 'Практическое задание',
                'controlType': ctype if ctype in KOS_CONTROL_TYPES else 'Текущий',
                'indicator': _s(t.get('indicator')),
                'description': _s(t.get('description')),
                'competency': '',
            })
        return {'tasks': out}
    levels = [{'name': _s(l.get('name')), 'description': _s(l.get('description')), 'criteria': _s(l.get('criteria'))} for l in (parsed.get('levels') or []) if isinstance(l, dict) and _s(l.get('name'))]
    return {'scale': _s(parsed.get('scale')), 'generalCriteria': _s(parsed.get('generalCriteria')), 'levels': levels}


def run_kos_part(part: str, fields: dict) -> dict:
    raw = call_ai([
        {'role': 'system', 'content': 'Ты профессиональный методист СПО. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
        {'role': 'user', 'content': build_kos_part_prompt(part, fields)},
    ], temperature=0.6)
    return normalize_kos_part(part, parse_ai_json(raw))


def kos_current_part(part: str, f: dict) -> str:
    if part == 'competencies':
        data = f.get('competencies') or []
    elif part == 'control':
        data = f.get('control') or {}
    elif part == 'tasks':
        data = [
            {'name': _s(t.get('name')), 'type': _s(t.get('type')), 'controlType': _s(t.get('controlType')), 'indicator': _s(t.get('indicator')), 'description': _s(t.get('description'))}
            for t in (f.get('tasks') or [])
        ]
    else:
        data = {'scale': _s(f.get('scale')), 'generalCriteria': _s(f.get('generalCriteria')), 'levels': f.get('levels') or []}
    return json.dumps(data, ensure_ascii=False)


def build_kos_refine_prompt(part: str, f: dict, instruction: str) -> str:
    extra = ''
    if part == 'tasks':
        comps = f.get('competencies') or []
        codes = [f"{_s(c.get('code'))}.{_s(i.get('code'))}" for c in comps for i in (c.get('indicators') or [])]
        extra = f"\nДопустимые типы: {', '.join(KOS_TASK_TYPES)}.\nДопустимые виды контроля: {', '.join(KOS_CONTROL_TYPES)}.\nПоле indicator заполняй СТРОГО значением из списка: {', '.join(codes) if codes else 'пустая строка'}. Если у задания уже был корректный indicator, сохрани его.\nКоличество заданий сохраняй, если замечание прямо не просит добавить или убрать."
    if part == 'competencies':
        extra = "\nКоды компетенций и элементов, которые уже есть, не меняй: на них ссылаются задания. Новые коды допустимы только для добавляемых компетенций."
    return f"""Ты опытный методист СПО, дорабатываешь фонд оценочных средств (ФОС/КОС) по ФГОС СПО. Пиши на русском языке, конкретно, без markdown-разметки.

{kos_context(f)}

Текущее содержимое раздела в JSON:
{kos_current_part(part, f)}

Преподаватель просит доработать раздел по замечанию: «{instruction}»

Обнови раздел в соответствии с замечанием и верни его ЦЕЛИКОМ, включая неизменённые элементы.{extra}

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{KOS_FORMATS[part]}"""


def run_kos_refine_part(part: str, fields: dict, instruction: str) -> dict:
    raw = call_ai([
        {'role': 'system', 'content': 'Ты профессиональный методист СПО. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
        {'role': 'user', 'content': build_kos_refine_prompt(part, fields, instruction)},
    ], temperature=0.6)
    return normalize_kos_part(part, parse_ai_json(raw))


def build_kos_task_criteria_prompt(f: dict, task: dict, max_score) -> str:
    ind = _s(task.get('indicator'))
    ind_line = ''
    for c in (f.get('competencies') or []):
        for i in (c.get('indicators') or []):
            if f"{_s(c.get('code'))}.{_s(i.get('code'))}" == ind:
                ind_line = f"{_s(c.get('code'))} {_s(c.get('name'))}; элемент {_s(i.get('code'))}: {_s(i.get('name'))}"
    scale = _s(f.get('scale'))
    return f"""Ты опытный методист СПО. Составь критерии оценивания именно для одного оценочного средства фонда оценочных средств. Пиши на русском языке, конкретно, без markdown-разметки.

Специальность СПО: {_s((f.get('passport') or {}).get('direction')) or 'не указана'}
Дисциплина / МДК: {_s((f.get('passport') or {}).get('discipline')) or 'не указана'}
Оценочное средство: {_s(task.get('name'))}
Тип: {_s(task.get('type'))}; вид контроля: {_s(task.get('controlType'))}
Проверяемая компетенция: {ind_line or 'не указана'}
Шкала оценивания дисциплины: {scale or 'не задана'}
Формулировка задания:
{_s(task.get('description')) or '(не задана, опирайся на название и тип)'}

Максимальный балл за задание: {max_score}. Критерии должны опираться на конкретные требования этого задания (что именно проверяется в результате), а не быть общими. Сумма баллов по критериям равна {max_score}. Затем опиши 3 уровня выполнения (высокий, средний, низкий) с диапазонами баллов, которые покрывают шкалу от {max_score} до 0 без пропусков, и с признаками выполнения именно этого задания.

Верни ответ СТРОГО в формате JSON без markdown, пояснений и текста до/после:
{{"criteria": [{{"criterion": "что проверяется", "score": 2}}], "levels": [{{"name": "Высокий", "range": "9-10 баллов", "description": "признаки"}}]}}"""


def format_kos_task_criteria(parsed: dict, max_score) -> str:
    lines = [f"Максимальный балл: {max_score}", "Критерии:"]
    for c in parsed.get('criteria') or []:
        if isinstance(c, dict) and _s(c.get('criterion')):
            lines.append(f"- {_s(c.get('criterion'))} — {_s(c.get('score'))} б.")
    lines.append("Уровни выполнения:")
    for l in parsed.get('levels') or []:
        if isinstance(l, dict) and _s(l.get('name')):
            lines.append(f"- {_s(l.get('name'))} ({_s(l.get('range'))}): {_s(l.get('description'))}")
    return "\n".join(lines)


def process(event: dict, context) -> dict:
    """Генерация учебных материалов, ИИ-чат-помощник через AITunnel. Декомпозитор компетенций, проверка тетради по фото, план коррекционной работы (аналитика качества обученности) и ИИ-анализ качества знаний по дисциплинам доступны только пользователям с платной подпиской. Антиплагиат (проверка текста и извлечение из PDF/DOCX) доступен бесплатно с лимитом попыток, учёт которых ведётся в backend/auth."""
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
            elif gen_type == 'quiz':
                prompt = build_quiz_prompt(fields)
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

            recognized_text = result.pop('recognized_text', '') or ''
            try:
                from nlp_check import check_math_expressions, check_spelling
                math_errors = check_math_expressions(recognized_text, subject)
                spelling_flags = check_spelling(recognized_text, subject)
                notes = result.get('notes') or []
                notes.extend(math_errors)
                if spelling_flags:
                    notes.append(
                        f"Проверка орфографии: обратите внимание на слова — {', '.join(spelling_flags)}"
                    )
                result['notes'] = notes
            except Exception:
                pass

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, ensure_ascii=False)}

        elif action == 'antiplagiat_check':
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

        elif action == 'correction_plan':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'План коррекционной работы доступен только по платной подписке'})}

            data = body.get('data') or {}
            if not data.get('skills'):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Недостаточно данных для формирования плана'})}

            content = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист и эксперт по педагогической диагностике. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': build_correction_plan_prompt(data)},
            ], temperature=0.6)

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'kz_analysis':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ-анализ качества знаний доступен только по платной подписке'})}

            data = body.get('data') or {}
            if not data.get('rows'):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Недостаточно данных для анализа'})}

            content = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист и эксперт по педагогической диагностике. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': build_kz_analysis_prompt(data)},
            ], temperature=0.6)

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'lesson_card':
            fields = body.get('fields') or {}
            if not (fields.get('topic') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему урока'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-методист. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(build_lesson_card_prompt(fields), fields)},
            ], temperature=0.7)

            cleaned = raw.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('```')[1]
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()

            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({
                'goal': parsed.get('goal') or '',
                'stages': parsed.get('stages') or {},
            }, ensure_ascii=False)}

        elif action == 'task_card':
            fields = body.get('fields') or {}
            if not (fields.get('topic') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему задания'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-методист. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(build_task_card_prompt(fields), fields)},
            ], temperature=0.7)

            cleaned = raw.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('```')[1]
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()

            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({
                'goal': parsed.get('goal') or '',
                'task': parsed.get('task') or '',
                'criteria': parsed.get('criteria') or '',
            }, ensure_ascii=False)}

        elif action == 'lesson_card_refine':
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            if not (fields.get('topic') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему урока'})}
            if not instruction:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-методист, дорабатываешь карточку урока по запросу преподавателя. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(build_lesson_card_refine_prompt(fields, instruction), fields)},
            ], temperature=0.6)

            cleaned = raw.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('```')[1]
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()

            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({
                'goal': parsed.get('goal') or '',
                'stages': parsed.get('stages') or {},
            }, ensure_ascii=False)}

        elif action in ('pm_task', 'pm_task_refine'):
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Генератор заданий по ПМ доступен по платной подписке'})}
            if not ((fields.get('mdkTopic') or '').strip() or (fields.get('pmName') or '').strip()):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите наименование ПМ или тему МДК'})}
            if action == 'pm_task_refine':
                if not instruction:
                    return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}
                prompt = build_pm_task_refine_prompt(fields, instruction)
            else:
                prompt = build_pm_task_prompt(fields)

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный методист СПО. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(prompt, fields)},
            ], temperature=0.6)

            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            result = normalize_pm_task(parsed)
            if not result['tasks']:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ не вернул задания, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, ensure_ascii=False)}

        elif action in ('worksheet', 'worksheet_refine'):
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            if not ((fields.get('topic') or '').strip() or (fields.get('planText') or '').strip()):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему урока или загрузите план-конспект'})}
            if action == 'worksheet_refine':
                if not instruction:
                    return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}
                prompt = build_worksheet_refine_prompt(fields, instruction)
            else:
                prompt = build_worksheet_prompt(fields)

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-методист. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': prompt},
            ], temperature=0.7)

            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            tasks = normalize_worksheet(parsed if isinstance(parsed, dict) else {})
            if not tasks:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ не вернул задания, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'tasks': tasks}, ensure_ascii=False)}

        elif action == 'rpd':
            fields = body.get('fields') or {}
            part = body.get('part')
            if part not in ('content', 'ktp', 'assessment', 'support'):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестная часть программы'})}
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Конструктор рабочих программ доступен по платной подписке'})}
            if not (fields.get('disciplineName') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите название дисциплины'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист образовательной организации, разрабатываешь рабочие программы дисциплин по ФГОС. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': build_rpd_prompt(part, fields)},
            ], temperature=0.6)

            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            result = normalize_rpd(part, parsed if isinstance(parsed, dict) else {})
            if part == 'ktp' and not result['rows']:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ не вернул план, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, ensure_ascii=False)}

        elif action == 'task_card_refine':
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            if not (fields.get('topic') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему задания'})}
            if not instruction:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-методист, дорабатываешь карточку учебного задания по запросу преподавателя. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(build_task_card_refine_prompt(fields, instruction), fields)},
            ], temperature=0.6)

            cleaned = raw.strip()
            if cleaned.startswith('```'):
                cleaned = cleaned.split('```')[1]
                if cleaned.startswith('json'):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()

            try:
                parsed = json.loads(cleaned)
            except json.JSONDecodeError:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({
                'goal': parsed.get('goal') or '',
                'task': parsed.get('task') or '',
                'criteria': parsed.get('criteria') or '',
            }, ensure_ascii=False)}

        elif action in ('event_card', 'event_card_refine'):
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            if not (fields.get('title') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите название события'})}
            if action == 'event_card_refine' and not instruction:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}

            prompt = with_ovz(build_event_card_prompt(fields) if action == 'event_card' else build_event_card_refine_prompt(fields, instruction), fields)
            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный методист образовательных событий. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': prompt},
            ], temperature=0.7)

            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(normalize_event_card(parsed), ensure_ascii=False)}

        elif action == 'game_card':
            fields = body.get('fields') or {}
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ-наполнение игры доступно по платной подписке'})}
            if not (fields.get('topic') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему урока'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный педагог-игропрактик. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(build_game_card_prompt(fields), fields)},
            ], temperature=0.8)

            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(normalize_game_card(parsed), ensure_ascii=False)}

        elif action == 'presentation':
            fields = body.get('fields') or {}
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Генератор презентаций доступен по платной подписке'})}
            if not (fields.get('topic') or '').strip() and not (fields.get('sourceText') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему или загрузите документ'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный методист и автор презентаций. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(build_presentation_prompt(fields), fields)},
            ], temperature=0.7)

            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            result = normalize_presentation(parsed)
            if not result['slides']:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ не составил слайды, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, ensure_ascii=False)}

        elif action == 'presentation_refine':
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Доработка презентаций доступна по платной подписке'})}
            if not instruction:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}
            if not (fields.get('slides') or []):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Нет слайдов для доработки'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный методист и автор презентаций. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': with_ovz(build_presentation_refine_prompt(fields, instruction), fields)},
            ], temperature=0.7)

            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            result = normalize_presentation(parsed)
            if not result['slides']:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ не вернул слайды, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, ensure_ascii=False)}

        elif action == 'extracurricular_analysis':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ-справка по внеаудиторной деятельности доступна только по платной подписке'})}

            data = body.get('data') or {}
            if not data.get('rows'):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Недостаточно данных для анализа'})}

            content = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист и специалист по воспитательной работе. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': build_extracurricular_prompt(data)},
            ], temperature=0.6)

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'project_activity_analysis':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ-справка по проектной деятельности доступна только по платной подписке'})}

            data = body.get('data') or {}
            if not data.get('rows'):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Недостаточно данных для анализа'})}

            content = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист и специалист по научно-методической работе. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': build_project_activity_prompt(data)},
            ], temperature=0.6)

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'correction_work_analysis':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ-справка по коррекционной работе доступна только по платной подписке'})}

            data = body.get('data') or {}
            if not data.get('rows'):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Недостаточно данных для анализа'})}

            content = call_ai([
                {'role': 'system', 'content': 'Ты опытный учитель-логопед и методист по коррекционной работе. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': build_correction_work_prompt(data)},
            ], temperature=0.6)

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'tech_matrix':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Заполнение матрицы с ИИ доступно только по платной подписке'})}

            data = body.get('data') or {}
            if not _s(data.get('subject')):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите дисциплину, МДК или модуль'})}

            raw = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист колледжа. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': build_tech_matrix_prompt(data)},
            ], temperature=0.6)

            try:
                parsed = parse_ai_json(raw)
            except json.JSONDecodeError:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            rows = []
            for r in (parsed.get('rows') or []) if isinstance(parsed, dict) else []:
                if isinstance(r, dict) and _s(r.get('t')):
                    rows.append({'t': _s(r.get('t')), 'o': _s(r.get('o')), 'r': _s(r.get('r'))})

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'rows': rows}, ensure_ascii=False)}

        elif action == 'tech_matrix_analysis':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ-справка по матрице технологий доступна только по платной подписке'})}

            data = body.get('data') or {}
            rows = [r for r in (data.get('rows') or []) if isinstance(r, dict) and (_s(r.get('t')) or _s(r.get('o')) or _s(r.get('r')))]
            if not rows:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Заполните хотя бы одну строку матрицы'})}
            data['rows'] = rows

            content = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист колледжа. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': build_tech_matrix_analysis_prompt(data)},
            ], temperature=0.6)

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action == 'extracurricular_plan':
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Составление плана доступно только по платной подписке'})}

            data = body.get('data') or {}
            if not data.get('rows'):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Недостаточно данных для составления плана'})}

            content = call_ai([
                {'role': 'system', 'content': 'Ты опытный методист и специалист по воспитательной работе. Отвечай развёрнуто, по-деловому и всегда на русском языке.'},
                {'role': 'user', 'content': build_extracurricular_plan_prompt(data)},
            ], temperature=0.6)

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'content': content}, ensure_ascii=False)}

        elif action in ('project_gen', 'project_refine'):
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Генератор проектов доступен по платной подписке'})}
            if not (fields.get('topic') or '').strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите тему или идею проекта'})}
            sys_msg = {'role': 'system', 'content': 'Ты опытный руководитель проектов. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'}
            try:
                if action == 'project_refine':
                    if not instruction:
                        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}
                    raw = call_ai([sys_msg, {'role': 'user', 'content': build_project_refine_prompt(fields, instruction)}], temperature=0.5)
                    parsed = parse_ai_json(raw)
                else:
                    with ThreadPoolExecutor(max_workers=2) as pool:
                        f1 = pool.submit(call_ai, [sys_msg, {'role': 'user', 'content': build_project_prompt(fields, 1)}], 0.5)
                        f2 = pool.submit(call_ai, [sys_msg, {'role': 'user', 'content': build_project_prompt(fields, 2)}], 0.5)
                        parsed = {**parse_ai_json(f1.result()), **parse_ai_json(f2.result())}
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}

            result = normalize_project(parsed)
            if not result['tasks']:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ не составил план, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps(result, ensure_ascii=False)}

        elif action == 'kos_fill':
            fields = body.get('fields') or {}
            parts = [p for p in (body.get('parts') or []) if p in KOS_PARTS]
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ в конструкторе КОС доступен по платной подписке'})}
            p = fields.get('passport') or {}
            if not parts:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Выберите, что заполнить'})}
            if not (_s(p.get('discipline')) or _s(p.get('direction'))):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите дисциплину / МДК или специальность в паспорте'})}

            def safe(part):
                try:
                    return part, run_kos_part(part, fields), None
                except Exception:
                    return part, None, True

            with ThreadPoolExecutor(max_workers=len(parts)) as pool:
                results = list(pool.map(safe, parts))
            out = {}
            failed = []
            for part, data, err in results:
                if err or not data:
                    failed.append(part)
                else:
                    out[part] = data
            if not out:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'result': out, 'failed': failed}, ensure_ascii=False)}

        elif action == 'kos_refine':
            fields = body.get('fields') or {}
            instruction = (body.get('instruction') or '').strip()
            parts = [p for p in (body.get('parts') or []) if p in KOS_PARTS]
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Доработка КОС с ИИ доступна по платной подписке'})}
            if not instruction:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите, что нужно доработать'})}
            if not parts:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Выберите разделы для доработки'})}

            def safe_refine(part):
                try:
                    return part, run_kos_refine_part(part, fields, instruction), None
                except Exception:
                    return part, None, True

            with ThreadPoolExecutor(max_workers=len(parts)) as pool:
                results = list(pool.map(safe_refine, parts))
            out = {}
            failed = []
            for part, data, err in results:
                empty_tasks = part == 'tasks' and not (data or {}).get('tasks')
                empty_comps = part == 'competencies' and not (data or {}).get('competencies')
                if err or not data or empty_tasks or empty_comps:
                    failed.append(part)
                else:
                    out[part] = data
            if not out:
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'result': out, 'failed': failed}, ensure_ascii=False)}

        elif action == 'kos_task_criteria':
            fields = body.get('fields') or {}
            task = body.get('task') or {}
            max_score = _int(body.get('maxScore'), 1, 100, 10)
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Генерация критериев с ИИ доступна по платной подписке'})}
            if not (_s(task.get('name')) or _s(task.get('description'))):
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Заполните название или описание задания'})}
            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный методист СПО. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': build_kos_task_criteria_prompt(fields, task, max_score)},
            ], temperature=0.5)
            try:
                parsed = parse_ai_json(raw)
            except (json.JSONDecodeError, IndexError):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}
            if not (parsed.get('criteria') or []):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ не составил критерии, попробуйте снова'})}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'criteria': format_kos_task_criteria(parsed, max_score)}, ensure_ascii=False)}

        elif action == 'kos_from_program':
            file_base64 = body.get('file_base64') or ''
            filename = body.get('filename') or ''
            if not is_user_paid(event):
                return {'statusCode': 403, 'headers': cors_headers(), 'body': json.dumps({'error': 'Загрузка рабочей программы доступна по платной подписке'})}
            if not file_base64:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Файл не передан'})}
            try:
                program_text = extract_text_from_file(file_base64, filename)
            except ValueError as e:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}
            if not program_text.strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Не удалось извлечь текст из файла — возможно, в нём только изображения'})}
            options = ['Экзамен', 'Зачёт', 'Дифференцированный зачёт', 'Курсовой проект', 'Демонстрационный экзамен']
            prompt = f"""Ты методист СПО. Ниже текст рабочей программы дисциплины или профессионального модуля. Извлеки из него данные для фонда оценочных средств. Ничего не выдумывай: если данных нет, оставь пустую строку или пустой список.

Верни СТРОГО JSON без markdown и пояснений:
{{"direction": "код и наименование специальности СПО, например 09.02.07 Информационные системы и программирование", "discipline": "код и наименование дисциплины / МДК", "intermediate": "форма промежуточной аттестации строго одним из значений: {', '.join(options)}, либо пустая строка", "credits": "общая трудоёмкость, например 108 часов", "competencies": [{{"code": "ОК 01 или ПК 1.1", "name": "формулировка компетенции дословно из программы", "indicators": [{{"code": "З.1 | У.1 | В.1 | ПО.1", "name": "что знает, умеет или владеет обучающийся"}}]}}]}}

Текст рабочей программы:
{program_text[:20000]}"""
            raw = call_ai([
                {'role': 'system', 'content': 'Ты профессиональный методист СПО. Отвечаешь строго валидным JSON без markdown и пояснений, всегда на русском языке.'},
                {'role': 'user', 'content': prompt},
            ], temperature=0.2)
            parsed = parse_ai_json(raw)
            if not isinstance(parsed, dict):
                return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': 'ИИ вернул некорректный ответ, попробуйте снова'})}
            intermediate = _s(parsed.get('intermediate'))
            result = {
                'direction': _s(parsed.get('direction')),
                'discipline': _s(parsed.get('discipline')),
                'intermediate': intermediate if intermediate in options else '',
                'credits': _s(parsed.get('credits')),
                'competencies': normalize_kos_part('competencies', parsed)['competencies'],
            }
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'result': result}, ensure_ascii=False)}

        elif action == 'extract_text':
            file_base64 = body.get('file_base64') or ''
            filename = body.get('filename') or ''
            if not file_base64:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Файл не передан'})}

            try:
                text = extract_text_from_file(file_base64, filename)
            except ValueError as e:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}

            if not text.strip():
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Не удалось извлечь текст из файла — возможно, он пустой или содержит только изображения'})}

            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'text': text}, ensure_ascii=False)}

        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестное действие'})}

    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return {'statusCode': 502, 'headers': cors_headers(), 'body': json.dumps({'error': f'Ошибка ИИ-сервиса: {error_body}'})}
    except Exception as e:
        return {'statusCode': 500, 'headers': cors_headers(), 'body': json.dumps({'error': str(e)})}


def handler(event: dict, context) -> dict:
    """Генерация учебных материалов, ИИ-чат-помощник через AITunnel. Платные сервисы доступны по подписке или за разовую оплату: одно использование списывается только после успешного результата и возвращается при ошибке."""
    ACCESS['user_id'] = None
    ACCESS['via_credit'] = False
    ACCESS['action'] = None
    try:
        ACCESS['action'] = (json.loads(event.get('body') or '{}') or {}).get('action')
    except Exception:
        pass
    result = process(event, context)
    if ACCESS['via_credit'] and result.get('statusCode') != 200:
        refund_credit()
    return result
