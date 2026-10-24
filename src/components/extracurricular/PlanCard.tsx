import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { downloadDocx, downloadTxt } from "@/lib/download";

interface PlanCardProps {
  plan: string;
  planTitle: string;
  planPeriod: string;
  setPlanPeriod: (v: string) => void;
  periods: string[];
  planLoading: boolean;
  planSaving: boolean;
  planSaved: boolean;
  onGenerate: () => void;
  onSave: () => void;
}

const PlanCard = ({
  plan,
  planTitle,
  planPeriod,
  setPlanPeriod,
  periods,
  planLoading,
  planSaving,
  planSaved,
  onGenerate,
  onSave,
}: PlanCardProps) => (
  <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
    <h2 className="font-display text-lg font-bold mb-1">📅 {planTitle}</h2>
    <p className="text-xs text-muted-foreground mb-4 no-print">
      ИИ учтёт проведённые мероприятия и охват: усилит слабые направления и распределит новые по месяцам.
    </p>

    <div className="flex flex-wrap items-center gap-2 mb-4 no-print">
      <Select value={planPeriod} onValueChange={setPlanPeriod}>
        <SelectTrigger className="w-full sm:w-52" aria-label="Период плана">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="gap-2" onClick={onGenerate} disabled={planLoading}>
        {planLoading ? (
          <>
            <Icon name="Loader2" size={16} className="animate-spin" />
            ИИ составляет план...
          </>
        ) : (
          <>
            <Icon name="CalendarPlus" size={16} />
            Составить план внеаудиторной деятельности
          </>
        )}
      </Button>
    </div>

    {plan ? (
      <>
        <div className="flex flex-wrap gap-2 mb-4 no-print">
          <Button variant="outline" className="gap-1.5" onClick={onSave} disabled={planSaving || planSaved}>
            {planSaving ? (
              <Icon name="Loader2" size={15} className="animate-spin" />
            ) : (
              <Icon name={planSaved ? "Check" : "Save"} size={15} />
            )}
            {planSaved ? "Сохранено" : "Сохранить в кабинет"}
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadDocx(`${planTitle} — ${planPeriod}`, planTitle, plan)}
          >
            <Icon name="FileText" size={15} />
            Скачать Word
          </Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadTxt(`${planTitle} — ${planPeriod}`, [planTitle, "", plan])}
          >
            <Icon name="Download" size={15} />
            Скачать TXT
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-5 md:p-7">
          <h3 className="font-display text-lg font-bold text-primary text-center mb-4">
            {planTitle}
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{plan}</p>
        </div>
      </>
    ) : (
      <p className="py-8 text-center text-muted-foreground">
        Выберите период и нажмите «Составить план внеаудиторной деятельности»
      </p>
    )}
  </div>
);

export default PlanCard;
