import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FGOS_LEVELS, MatrixData, PROF_OPTIONS, PROF_OTHER } from "@/components/tech-matrix/techMatrixConfig";

interface TechMatrixPassportProps {
  data: MatrixData;
  patch: (p: Partial<MatrixData>) => void;
  patchFgos: (p: Partial<MatrixData["fgos"]>) => void;
}

const TechMatrixPassport = ({ data, patch, patchFgos }: TechMatrixPassportProps) => {
  const profSelectValue = PROF_OPTIONS.includes(data.prof) || data.prof === PROF_OTHER ? data.prof : data.prof ? PROF_OTHER : "";

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6 no-print">
      <h2 className="font-display text-lg font-bold mb-1">1. Паспорт разработки</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Эти данные попадают в файл и помогают ИИ точнее подобрать технологии.
      </p>
      <div className="grid gap-4 md:grid-cols-6">
        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-1.5 block">Название документа</label>
          <Input
            value={data.docTitle}
            onChange={(e) => patch({ docTitle: e.target.value })}
            placeholder="Матрица технологий обучения по дисциплине …"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-1.5 block">Преподаватель (ФИО)</label>
          <Input
            value={data.author}
            onChange={(e) => patch({ author: e.target.value })}
            placeholder="Иванова Елена Петровна"
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-sm font-medium mb-1.5 block">Дата</label>
          <Input type="date" value={data.date} onChange={(e) => patch({ date: e.target.value })} />
        </div>

        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-1.5 block">Образовательная организация</label>
          <Input
            value={data.org}
            onChange={(e) => patch({ org: e.target.value })}
            placeholder="ГБПОУ «…», специальность / профессия"
          />
        </div>
        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-1.5 block">Дисциплина, МДК или модуль</label>
          <Input
            value={data.subject}
            onChange={(e) => patch({ subject: e.target.value })}
            placeholder="Например: МДК 02.01. Технология приготовления пищи"
          />
        </div>

        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-1.5 block">Профессиональная направленность</label>
          <Select
            value={profSelectValue}
            onValueChange={(v) => patch({ prof: v === PROF_OTHER ? PROF_OTHER : v, profOther: "" })}
          >
            <SelectTrigger aria-label="Профессиональная направленность">
              <SelectValue placeholder="Выберите направленность" />
            </SelectTrigger>
            <SelectContent>
              {[...PROF_OPTIONS, PROF_OTHER].map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {profSelectValue === PROF_OTHER && (
          <div className="md:col-span-3">
            <label className="text-sm font-medium mb-1.5 block">Укажите направленность</label>
            <Input
              value={data.profOther}
              onChange={(e) => patch({ profOther: e.target.value })}
              placeholder="Своя формулировка"
            />
          </div>
        )}
        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-1.5 block">Курс / группа</label>
          <Input
            value={data.course}
            onChange={(e) => patch({ course: e.target.value })}
            placeholder="2 курс, гр. ТС-21"
          />
        </div>

        <div className="md:col-span-6">
          <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 cursor-pointer">
            <Checkbox
              checked={data.fgos.on}
              onCheckedChange={(v) => patchFgos({ on: v === true })}
              className="mt-0.5"
            />
            <span>
              <span className="text-sm font-semibold block">Учитывать требования ФГОС СПО</span>
              <span className="text-xs text-muted-foreground">
                Откроются поля для кода специальности и компетенций. ИИ сошлётся на них в обосновании.
              </span>
            </span>
          </label>
        </div>

        {data.fgos.on && (
          <>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1.5 block">Код и наименование профессии / специальности</label>
              <Input
                value={data.fgos.code}
                onChange={(e) => patchFgos({ code: e.target.value })}
                placeholder="43.02.11 Гостиничный сервис"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1.5 block">Уровень СПО</label>
              <Select value={data.fgos.level} onValueChange={(v) => patchFgos({ level: v })}>
                <SelectTrigger aria-label="Уровень СПО">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FGOS_LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1.5 block">Реквизиты ФГОС (приказ)</label>
              <Input
                value={data.fgos.order}
                onChange={(e) => patchFgos({ order: e.target.value })}
                placeholder="Приказ Минпросвещения РФ от … № …"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium mb-1.5 block">Формируемые компетенции (ОК / ПК)</label>
              <Input
                value={data.fgos.komps}
                onChange={(e) => patchFgos({ komps: e.target.value })}
                placeholder="ОК 01–09; ПК 2.1, ПК 2.4"
              />
            </div>
            <div className="md:col-span-6">
              <label className="text-sm font-medium mb-1.5 block">Учтённые требования ФГОС СПО</label>
              <Textarea
                value={data.fgos.req}
                onChange={(e) => patchFgos({ req: e.target.value })}
                rows={2}
                placeholder="Практико-ориентированность, модульная организация, демонстрационный экзамен, ВОСР"
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default TechMatrixPassport;
