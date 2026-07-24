import re

_MATH_EXPR_RE = re.compile(
    r'([0-9xyzXYZ.,+\-*/^()\s]{1,60})=([0-9xyzXYZ.,+\-*/^()\s]{1,60})(?=$|\n|[а-яА-Я;])',
    re.MULTILINE,
)

_MORPH = None


def _get_morph():
    global _MORPH
    if _MORPH is None:
        import pymorphy3
        _MORPH = pymorphy3.MorphAnalyzer()
    return _MORPH


def check_math_expressions(text: str, subject: str) -> list:
    """Находит в тексте равенства вида "выражение = выражение" и проверяет их через sympy.
    Возвращает список найденных численных/алгебраических ошибок."""
    if subject not in ('Математика', 'Физика', 'Химия'):
        return []
    if not text:
        return []

    import sympy as sp

    errors = []
    seen = set()
    for m in _MATH_EXPR_RE.finditer(text + '\n'):
        lhs_raw, rhs_raw = m.group(1).strip(), m.group(2).strip()
        if not lhs_raw or not rhs_raw or len(lhs_raw) > 40 or len(rhs_raw) > 40:
            continue
        key = (lhs_raw, rhs_raw)
        if key in seen:
            continue
        seen.add(key)
        try:
            lhs_expr = lhs_raw.replace('^', '**').replace(',', '.')
            rhs_expr = rhs_raw.replace('^', '**').replace(',', '.')
            lhs = sp.sympify(lhs_expr)
            rhs = sp.sympify(rhs_expr)
            diff = sp.simplify(lhs - rhs)
            if diff != 0:
                errors.append(f"Проверка вычислений: «{lhs_raw} = {rhs_raw}» — похоже на ошибку (левая и правая части не равны)")
        except Exception:
            continue
        if len(errors) >= 5:
            break
    return errors


def check_spelling(text: str, subject: str) -> list:
    """Проверяет отдельные русские слова на потенциальные орфографические ошибки через pymorphy3
    (по низкой уверенности разбора словоформы). Возвращает список подозрительных слов."""
    if subject not in ('Русский язык', 'Литература'):
        return []
    if not text:
        return []

    words = re.findall(r'[а-яА-ЯёЁ]{3,}', text)
    if not words:
        return []

    try:
        morph = _get_morph()
    except Exception:
        return []

    suspicious = []
    seen = set()
    for w in words:
        low = w.lower()
        if low in seen:
            continue
        seen.add(low)
        try:
            parses = morph.parse(w)
        except Exception:
            continue
        if not parses:
            continue
        best_score = parses[0].score
        if best_score < 0.3:
            suspicious.append(w)
        if len(suspicious) >= 8:
            break
    return suspicious
