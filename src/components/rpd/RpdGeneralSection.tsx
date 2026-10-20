import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RpdField from "./RpdField";
import { ATTESTATIONS, COURSES, LANGUAGES, RpdData } from "./rpdConfig";

interface Props {
  data: RpdData;
  patch: (p: Partial<RpdData>) => void;
}

const RpdGeneralSection = ({ data, patch }: Props) => (
  <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
    <h2 className="font-display text-lg font-bold mb-1">1. Общие сведения о дисциплине</h2>
    <p className="text-xs text-muted-foreground mb-4">Эти данные попадают в документ и используются ИИ при составлении разделов.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <RpdField label="Дисциплина / предмет / курс">
        <Input value={data.disciplineName} onChange={(e) => patch({ disciplineName: e.target.value })} placeholder="Например: Математический анализ" />
      </RpdField>
      <RpdField label="Код дисциплины">
        <Input value={data.disciplineCode} onChange={(e) => patch({ disciplineCode: e.target.value })} placeholder="Например: Б1.О.01" />
      </RpdField>
      <RpdField label="ФГОС">
        <Input value={data.fgos} onChange={(e) => patch({ fgos: e.target.value })} placeholder="Например: ФГОС ВО 3++ 01.03.02 ПМИ" />
      </RpdField>
      <RpdField label="Направление подготовки / специальность">
        <Input value={data.direction} onChange={(e) => patch({ direction: e.target.value })} placeholder="01.03.02 Прикладная математика и информатика" />
      </RpdField>
      <RpdField label="Образовательная программа">
        <Input value={data.programName} onChange={(e) => patch({ programName: e.target.value })} placeholder="Математическое и компьютерное моделирование" />
      </RpdField>
      <RpdField label="Профиль / направленность">
        <Input value={data.profile} onChange={(e) => patch({ profile: e.target.value })} placeholder="Математическое моделирование" />
      </RpdField>
      <RpdField label="Курс обучения">
        <Select value={data.course} onValueChange={(v) => patch({ course: v })}>
          <SelectTrigger aria-label="Курс обучения">
            <SelectValue placeholder="Выберите курс" />
          </SelectTrigger>
          <SelectContent>
            {COURSES.map((c) => (
              <SelectItem key={c} value={c}>
                {c} курс
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RpdField>
      <RpdField label="Семестр">
        <Input type="number" min={1} max={12} value={data.semester} onChange={(e) => patch({ semester: e.target.value })} placeholder="Номер семестра" />
      </RpdField>
      <RpdField label="Общая трудоёмкость (часов)">
        <Input type="number" min={1} value={data.totalHours} onChange={(e) => patch({ totalHours: e.target.value })} placeholder="108" />
      </RpdField>
      <RpdField label="Трудоёмкость (зачётных единиц)">
        <Input type="number" min={0} step={0.5} value={data.credits} onChange={(e) => patch({ credits: e.target.value })} placeholder="3" />
      </RpdField>
      <RpdField label="Вид промежуточной аттестации">
        <Select value={data.attestationType} onValueChange={(v) => patch({ attestationType: v })}>
          <SelectTrigger aria-label="Вид промежуточной аттестации">
            <SelectValue placeholder="Выберите вид" />
          </SelectTrigger>
          <SelectContent>
            {ATTESTATIONS.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RpdField>
      <RpdField label="Язык обучения">
        <Select value={data.language} onValueChange={(v) => patch({ language: v })}>
          <SelectTrigger aria-label="Язык обучения">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </RpdField>
      <RpdField label="Пререквизиты (что нужно знать до изучения)" className="md:col-span-1">
        <Textarea rows={3} value={data.prereq} onChange={(e) => patch({ prereq: e.target.value })} placeholder="Дисциплины и темы, изученные ранее" />
      </RpdField>
      <RpdField label="Постреквизиты (какие дисциплины опираются на эту)" className="md:col-span-1">
        <Textarea rows={3} value={data.postreq} onChange={(e) => patch({ postreq: e.target.value })} placeholder="Последующие дисциплины" />
      </RpdField>
    </div>
  </section>
);

export default RpdGeneralSection;
