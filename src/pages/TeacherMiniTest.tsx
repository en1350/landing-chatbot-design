import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

interface Option {
  text: string;
  points: number;
}

interface Question {
  topic: string;
  title: string;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    topic: "ИКТ в образовании",
    title: "Как вы чаще всего используете информационные технологии в своей работе?",
    options: [
      { text: "Только для печати документов и заполнения отчетов.", points: 1 },
      { text: "Периодически показываю презентации и использую мессенджеры для связи с родителями/студентами.", points: 2 },
      { text: "Активно применяю интерактивные инструменты: создаю базы данных в Excel для педагогических наблюдений, использую онлайн-квизы, мультимедиа и элементы проектного обучения.", points: 3 },
    ],
  },
  {
    topic: "Инклюзивный подход",
    title: "Студент с ограниченными возможностями здоровья (ОВЗ) или временными трудностями в обучении пришел на ваше занятие. Ваши действия?",
    options: [
      { text: "Буду вести занятие по общей программе, надеясь, что он сам подтянется.", points: 1 },
      { text: "Постараюсь объяснить материал проще, но без изменения структуры занятия.", points: 2 },
      { text: "Заранее адаптирую материалы (шрифт, формат, темп), использую дифференцированные задания и создаю ситуацию успеха, опираясь на сильные стороны студента.", points: 3 },
    ],
  },
  {
    topic: "Проектная деятельность и гранты",
    title: "Что вы думаете о социально значимых проектах в образовании?",
    options: [
      { text: "Это лишняя бумажная работа, которая отвлекает от основных обязанностей.", points: 1 },
      { text: "Участвую, если администрация попросит или даст готовый шаблон.", points: 2 },
      { text: "Это мощный инструмент развития студенческого самоуправления. Я инициирую проекты, оформляю заявки на гранты и привлекаю партнеров (вузы, общественные организации).", points: 3 },
    ],
  },
  {
    topic: "Работа с молодежью (16–20 лет)",
    title: "Какой подход к профилактике девиантного поведения и формированию ЗОЖ вы считаете наиболее эффективным?",
    options: [
      { text: "Строгие лекции о недопустимости нарушений и последствиях.", points: 1 },
      { text: "Беседы и просмотр социальных роликов с последующим обсуждением.", points: 2 },
      { text: "Интерактивные форматы: тренинги, мастер-классы (например, по здоровому питанию), вовлечение в волонтерство и создание равными для равных (peer-to-peer).", points: 3 },
    ],
  },
  {
    topic: "Рефлексия и оценка",
    title: "Как вы понимаете, что ваше занятие прошло действительно успешно?",
    options: [
      { text: "Если никто не опоздал и все тихо сидели.", points: 1 },
      { text: "Если студенты правильно ответили на контрольные вопросы в конце.", points: 2 },
      { text: "Если студенты проявили инициативу, задавали вопросы, а на этапе рефлексии показали осознанное понимание темы и эмоциональную вовлеченность.", points: 3 },
    ],
  },
];

const LETTERS = ["А", "Б", "В"];

interface Result {
  range: string;
  title: string;
  text: string;
  advice: string;
  bonus: string;
  icon: string;
}

const getResult = (score: number): Result => {
  if (score <= 7) {
    return {
      range: "5–7 баллов",
      title: "Начинающий исследователь",
      icon: "Sprout",
      text: "У вас есть прочная классическая база, но мир педагогики меняется! Вы только в начале пути освоения современных ИКТ и инклюзивных практик.",
      advice: "Начните с малого: попробуйте провести один урок с использованием онлайн-квиза или создайте простую таблицу учета в Excel.",
      bonus: "Чек-лист: 5 простых ИКТ-инструментов для педагога",
    };
  }
  if (score <= 11) {
    return {
      range: "8–11 баллов",
      title: "Уверенный практик",
      icon: "Target",
      text: "Вы отлично чувствуете себя в аудитории, идете в ногу со временем и уже применяете современные подходы. Вам не хватает лишь систематизации или смелости для масштабирования своего опыта.",
      advice: "Попробуйте оформить свой опыт в виде методической статьи или подайте заявку на небольшой грант для развития студенческого проекта.",
      bonus: "Шаблон описания успешного педагогического кейса для конференции",
    };
  }
  return {
    range: "12–15 баллов",
    title: "Методический гуру и лидер инноваций",
    icon: "Crown",
    text: "Браво! Вы не просто преподаете, вы создаете образовательную среду. Инклюзия, ИКТ, проектная деятельность и психологическая поддержка для вас – не пустые слова, а ежедневная практика. Вы готовы делиться опытом на республиканских и международных площадках.",
    advice: "Создавайте свой личный бренд, запускайте авторские курсы или методические вебинары. Коллеги готовы у вас учиться!",
    bonus: "Гайд: Как оформить и выиграть грант на социальный образовательный проект",
  };
};

const TeacherMiniTest = () => {
  const [answers, setAnswers] = useState<(number | null)[]>(QUESTIONS.map(() => null));
  const [finished, setFinished] = useState(false);

  const answered = answers.filter((a) => a !== null).length;
  const score = answers.reduce<number>((sum, a, i) => sum + (a === null ? 0 : QUESTIONS[i].options[a].points), 0);
  const result = getResult(score);

  const select = (q: number, o: number) => setAnswers((prev) => prev.map((a, i) => (i === q ? o : a)));

  const restart = () => {
    setAnswers(QUESTIONS.map(() => null));
    setFinished(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const noop = () => {};

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={noop}
        onOpenDecomposer={noop}
        onOpenRandomizer={noop}
        onOpenAntiplagiat={noop}
        onOpenProfile={noop}
        onOpenAuth={noop}
        onOpenPricing={noop}
      />

      <main className="flex-1">
        <div className="container max-w-3xl py-6 sm:py-10">
          <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <p className="text-xs font-bold uppercase tracking-widest text-coral">Мини-тест для педагогов</p>
          <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-4xl">
            Насколько современна ваша методическая копилка?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Выберите один вариант ответа в каждом вопросе. За каждый ответ начисляются баллы: от 1 до 3.
          </p>

          {!finished ? (
            <>
              <div className="mt-6 space-y-5">
                {QUESTIONS.map((q, qi) => (
                  <fieldset key={q.title} className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
                    <legend className="sr-only">Вопрос {qi + 1}</legend>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Вопрос {qi + 1}. {q.topic}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold leading-snug">{q.title}</p>
                    <div className="mt-4 space-y-2.5">
                      {q.options.map((o, oi) => {
                        const checked = answers[qi] === oi;
                        return (
                          <label
                            key={o.text}
                            className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-sm transition-colors sm:text-base ${
                              checked ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${qi}`}
                              checked={checked}
                              onChange={() => select(qi, oi)}
                              className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                            />
                            <span>
                              <b>{LETTERS[oi]})</b> {o.text}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>

              <div className="sticky bottom-0 mt-6 flex flex-col gap-2 border-t border-border bg-background/95 py-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground">
                  Отвечено: {answered} из {QUESTIONS.length}
                </span>
                <Button size="lg" disabled={answered < QUESTIONS.length} onClick={() => { setFinished(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  Узнать результат
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border-2 border-primary/30 bg-card p-5 shadow-md sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name={result.icon} size={26} />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Ваш результат: {score} из {QUESTIONS.length * 3} ({result.range})
                  </p>
                  <h2 className="font-display text-xl font-bold leading-tight sm:text-2xl">«{result.title}»</h2>
                </div>
              </div>
              <p className="mt-4">{result.text}</p>
              <div className="mt-4 rounded-xl bg-primary/5 p-4">
                <p className="font-semibold">Совет</p>
                <p className="mt-1 text-sm sm:text-base">{result.advice}</p>
              </div>
              <div className="mt-3 rounded-xl border border-coral/40 bg-coral/10 p-4">
                <p className="font-semibold">Ваш бонус</p>
                <p className="mt-1 text-sm sm:text-base">{result.bonus}</p>
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button onClick={restart} variant="outline">
                  Пройти ещё раз
                </Button>
                <Button asChild>
                  <Link to="/">На главную</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer onOpenProfile={noop} onOpenRandomizer={noop} onOpenAntiplagiat={noop} />
    </div>
  );
};

export default TeacherMiniTest;
