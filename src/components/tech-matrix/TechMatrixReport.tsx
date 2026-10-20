import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import SaveMaterialButton from "@/components/SaveMaterialButton";
import { downloadDocx, downloadTxt } from "@/lib/download";
import { REPORT_TITLE } from "@/components/tech-matrix/techMatrixConfig";

interface TechMatrixReportProps {
  report: string;
  subject: string;
  onNeedAuth: () => void;
}

const TechMatrixReport = ({ report, subject, onNeedAuth }: TechMatrixReportProps) => (
  <section id="tech-report" className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
    <div className="flex flex-wrap gap-2 mb-4 no-print">
      <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
        <Icon name="Printer" size={15} />
        Печать
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => downloadDocx(REPORT_TITLE, REPORT_TITLE, report)}>
        <Icon name="FileText" size={15} />
        Word
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => downloadTxt(REPORT_TITLE, [REPORT_TITLE, "", report])}>
        <Icon name="Download" size={15} />
        TXT
      </Button>
      <SaveMaterialButton type="tech_matrix_report" title={`${REPORT_TITLE}${subject ? `: ${subject}` : ""}`} content={report} onNeedAuth={onNeedAuth} />
    </div>
    <div className="rounded-xl border border-border bg-muted/30 p-5 md:p-7">
      <h2 className="font-display text-lg font-bold text-primary text-center mb-4">{REPORT_TITLE}</h2>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{report}</p>
    </div>
  </section>
);

export default TechMatrixReport;
