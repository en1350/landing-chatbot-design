import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { downloadDocx, downloadTxt } from "@/lib/download";
import SaveMaterialButton from "@/components/SaveMaterialButton";

interface ReportCardProps {
  report: string;
  reportTitle: string;
  loading: boolean;
  isPaid: boolean;
  onGenerate: () => void;
  onNeedAuth: () => void;
}

const ReportCard = ({ report, reportTitle, loading, isPaid, onGenerate, onNeedAuth }: ReportCardProps) => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
    <div className="flex flex-wrap gap-2 mb-4 no-print">
      <Button className="gap-2" onClick={onGenerate} disabled={loading}>
        {loading ? (
          <>
            <Icon name="Loader2" size={16} className="animate-spin" />
            ИИ составляет справку...
          </>
        ) : (
          <>
            <Icon name="Sparkles" size={16} />
            Сформировать справку с ИИ
          </>
        )}
      </Button>
      {report && (
        <>
          <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
            <Icon name="Printer" size={15} />
            Печать
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => downloadDocx(reportTitle, reportTitle, report)}>
            <Icon name="FileText" size={15} />
            Word
          </Button>
          <Button variant="outline" className="gap-1.5" onClick={() => downloadTxt(reportTitle, [reportTitle, "", report])}>
            <Icon name="Download" size={15} />
            TXT
          </Button>
          <SaveMaterialButton type="extracurricular_report" title={reportTitle} content={report} onNeedAuth={onNeedAuth} />
        </>
      )}
    </div>

    {!isPaid && (
      <p className="mb-4 text-xs text-muted-foreground no-print">
        ИИ-справка доступна по подписке. Учёт, таблица и статистика работают бесплатно.
      </p>
    )}

    {report ? (
      <div className="rounded-xl border border-border bg-muted/30 p-5 md:p-7">
        <h2 className="font-display text-lg font-bold text-primary text-center mb-4">{reportTitle}</h2>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{report}</p>
      </div>
    ) : (
      <p className="py-12 text-center text-muted-foreground">
        Нажмите «Сформировать справку с ИИ» — документ появится здесь
      </p>
    )}
  </div>
);

export default ReportCard;
