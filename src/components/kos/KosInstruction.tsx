import { useState } from "react";
import Icon from "@/components/ui/icon";

const STEPS: { title: string; text: string }[] = [
  {
    title: "Заполните паспорт",
    text: "Во вкладке «Паспорт» укажите специальность, квалификацию, дисциплину или МДК, курс и форму аттестации. ИИ опирается именно на эти данные, поэтому дисциплина или специальность должны быть заполнены.",
  },
  {
    title: "Запустите ИИ или заполняйте вручную",
    text: "Кнопка «Заполнить с ИИ» создаёт выбранные разделы: компетенции с элементами, формы контроля, задания, шкалу и уровни. Новые компетенции и задания добавляются к уже введённым, формы контроля, шкала, критерии и уровни перезаписываются. Любой раздел можно вести вручную.",
  },
  {
    title: "Добавьте задания из генераторов",
    text: "Кнопка «Задания из генераторов» открывает три вкладки: тесты, комплекты заданий и задания по профессиональному модулю. Сгенерируйте материал, при желании поправьте текст, привяжите его к компетенции и добавьте в КОС.",
  },
  {
    title: "Привяжите задания к компетенциям",
    text: "У каждого задания во вкладке «Оценочные средства» выберите тип, вид контроля и компетенцию с элементом. По этим привязкам строится матрица соответствия.",
  },
  {
    title: "Составьте критерии для задания",
    text: "В карточке задания укажите максимальный балл и нажмите «Сгенерировать критерии оценки». ИИ распишет баллы по критериям и три уровня выполнения именно под это задание. Текст можно править вручную, а кнопка «Составить критерии заново» создаст новый вариант.",
  },
  {
    title: "Доработайте результат с ИИ",
    text: "Кнопка «Доработать с ИИ» принимает замечание, например «сделай задания сложнее». Отметьте разделы, которые нужно обновить, остальные ИИ не тронет. Составленные критерии заданий при этом сохраняются.",
  },
  {
    title: "Проверьте матрицу и скачайте документ",
    text: "Во вкладке «Матрица» видно, какие компетенции закрыты заданиями. В «Предпросмотре» можно распечатать КОС, скачать в Word или TXT и сохранить в личный кабинет.",
  },
];

const NOTES: string[] = [
  "Данные сохраняются в вашем браузере автоматически. Чтобы перенести КОС на другой компьютер, используйте «Экспорт JSON» и «Импорт JSON».",
  "ИИ в конструкторе КОС доступен по подписке. Тесты и комплекты заданий из генераторов расходуют общий лимит бесплатных генераций.",
  "Результаты ИИ нужно проверять: сверяйте формулировки компетенций с вашим ФГОС СПО и рабочей программой.",
];

const KosInstruction = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 rounded-2xl border border-border bg-muted/30 no-print">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 p-4 sm:p-5 text-left"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon name="BookOpen" size={20} />
        </span>
        <span className="flex-1">
          <span className="block font-display text-base font-bold">Инструкция по работе с конструктором</span>
          <span className="block text-sm text-muted-foreground">Семь шагов: от паспорта до готового документа</span>
        </span>
        <Icon name={open ? "ChevronUp" : "ChevronDown"} size={20} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-5 pt-4 sm:px-5 animate-fade-in">
          <ol className="space-y-3.5 text-sm leading-relaxed">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-semibold text-foreground">{s.title}</span>
                  <span className="text-muted-foreground">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-xl border border-border bg-background p-4">
            <p className="mb-2 text-sm font-semibold">Важно знать</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {NOTES.map((n) => (
                <li key={n} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default KosInstruction;
