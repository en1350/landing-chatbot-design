import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { downloadDocx } from "@/lib/download";
import { downloadMatrixCsv, downloadMatrixExcel, matrixToText } from "@/lib/techMatrixExport";
import { DOC_TITLE, MatrixData, TechRow } from "@/components/tech-matrix/techMatrixConfig";

interface TechMatrixTableProps {
  data: MatrixData;
  isPaid: boolean;
  aiCount: string;
  setAiCount: (v: string) => void;
  aiLoading: boolean;
  saving: boolean;
  saved: boolean;
  reportLoading: boolean;
  filledCount: number;
  suggest: () => void;
  fillNames: () => void;
  updateRow: (i: number, p: Partial<TechRow>) => void;
  removeRow: (i: number) => void;
  addRow: (row?: TechRow) => void;
  save: () => void;
  ensureRows: () => boolean;
  generateReport: () => void;
}

const TechMatrixTable = ({
  data,
  isPaid,
  aiCount,
  setAiCount,
  aiLoading,
  saving,
  saved,
  reportLoading,
  filledCount,
  suggest,
  fillNames,
  updateRow,
  removeRow,
  addRow,
  save,
  ensureRows,
  generateReport,
}: TechMatrixTableProps) => (
  <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
    <h2 className="font-display text-lg font-bold mb-1 no-print">2. Матрица технологий</h2>
    <p className="text-xs text-muted-foreground mb-4 no-print">
      Одна строка — одна технология. Пустые места «___» впишите своими цифрами результатов.
    </p>

    <div className="flex flex-wrap items-center gap-2 mb-5 no-print">
      <Select value={aiCount} onValueChange={setAiCount}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Сколько технологий подобрать">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {["3", "5", "7", "10"].map((n) => (
            <SelectItem key={n} value={n}>
              Подобрать {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button className="gap-2" onClick={suggest} disabled={aiLoading}>
        {aiLoading ? (
          <Icon name="Loader2" size={16} className="animate-spin" />
        ) : (
          <Icon name="Sparkles" size={16} />
        )}
        {aiLoading ? "ИИ работает..." : "Подобрать технологии с ИИ"}
      </Button>
      <Button variant="outline" className="gap-2" onClick={fillNames} disabled={aiLoading}>
        <Icon name="WandSparkles" size={16} />
        Заполнить по моим названиям
      </Button>
      {!isPaid && (
        <span className="text-xs text-muted-foreground">ИИ доступен по платной подписке</span>
      )}
    </div>

    <div className="hidden md:grid grid-cols-[2.5rem_1fr_1.5fr_1.5fr_2.5rem] gap-3 rounded-t-lg bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground">
      <span className="text-center">№</span>
      <span>Технология</span>
      <span>Обоснование выбора технологии</span>
      <span>Методическая и практическая результативность</span>
      <span />
    </div>

    <div className="divide-y divide-border border border-border md:border-t-0 rounded-b-lg">
      {data.rows.map((row, i) => (
        <div
          key={i}
          className="grid md:grid-cols-[2.5rem_1fr_1.5fr_1.5fr_2.5rem] gap-3 p-3 items-start"
        >
          <span className="hidden md:block text-center text-sm font-semibold text-muted-foreground pt-2">
            {i + 1}
          </span>
          <Textarea
            value={row.t}
            onChange={(e) => updateRow(i, { t: e.target.value })}
            rows={3}
            placeholder="Название технологии"
            aria-label="Технология"
          />
          <Textarea
            value={row.o}
            onChange={(e) => updateRow(i, { o: e.target.value })}
            rows={5}
            placeholder="Почему выбрана: связь с ФГОС СПО, спецификой профессии, уровнем группы"
            aria-label="Обоснование выбора технологии"
          />
          <Textarea
            value={row.r}
            onChange={(e) => updateRow(i, { r: e.target.value })}
            rows={5}
            placeholder="Измеримый результат: качество знаний, средний балл, сформированность ПК/ОК"
            aria-label="Результативность"
          />
          <Button
            variant="outline"
            size="icon"
            className="no-print text-destructive"
            onClick={() => removeRow(i)}
            aria-label="Удалить строку"
            disabled={data.rows.length === 1 && !row.t && !row.o && !row.r}
          >
            <Icon name="X" size={15} />
          </Button>
        </div>
      ))}
    </div>

    <div className="flex flex-wrap items-center gap-3 mt-4 no-print">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addRow()}>
        <Icon name="Plus" size={15} />
        Добавить строку
      </Button>
      <span className="text-xs text-muted-foreground">Заполнено строк: {filledCount} из {data.rows.length}</span>
    </div>

    <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-border no-print">
      <Button className="gap-1.5" onClick={save} disabled={saving || saved}>
        {saving ? (
          <Icon name="Loader2" size={15} className="animate-spin" />
        ) : (
          <Icon name={saved ? "Check" : "Save"} size={15} />
        )}
        {saved ? "Сохранено" : "Сохранить в кабинет"}
      </Button>
      <Button
        variant="outline"
        className="gap-1.5"
        onClick={() => ensureRows() && downloadMatrixExcel(data)}
      >
        <Icon name="Table" size={15} />
        Скачать Excel
      </Button>
      <Button
        variant="outline"
        className="gap-1.5"
        onClick={() => ensureRows() && downloadMatrixCsv(data)}
      >
        <Icon name="Download" size={15} />
        CSV
      </Button>
      <Button
        variant="outline"
        className="gap-1.5"
        onClick={() => ensureRows() && downloadDocx(DOC_TITLE, DOC_TITLE, matrixToText(data))}
      >
        <Icon name="FileText" size={15} />
        Скачать Word
      </Button>
      <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
        <Icon name="Printer" size={15} />
        Печать / PDF
      </Button>
      <Button className="gap-1.5" onClick={generateReport} disabled={reportLoading}>
        {reportLoading ? (
          <>
            <Icon name="Loader2" size={15} className="animate-spin" />
            ИИ составляет справку...
          </>
        ) : (
          <>
            <Icon name="Sparkles" size={15} />
            Сформировать аналитическую справку
          </>
        )}
      </Button>
    </div>
    {!isPaid && (
      <p className="mt-3 text-xs text-muted-foreground no-print">
        Аналитическая справка от ИИ доступна по подписке.
      </p>
    )}
  </section>
);

export default TechMatrixTable;
