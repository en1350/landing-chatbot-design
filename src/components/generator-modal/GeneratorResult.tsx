import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import { GeneratorType } from "@/context/AuthContext";

interface GeneratorResultProps {
  type: GeneratorType;
  resultLabel: string;
  result: string;
  refineOpen: boolean;
  setRefineOpen: (v: boolean) => void;
  refineInstruction: string;
  setRefineInstruction: (v: string) => void;
  refineError: string | null;
  setRefineError: (v: string | null) => void;
  refining: boolean;
  saving: boolean;
  saved: boolean;
  downloadingDocx: boolean;
  onRefine: () => void;
  onReset: () => void;
  onSave: () => void;
  onDownload: () => void;
  onDownloadDocx: () => void;
  onOpenCardBuilder: () => void;
  onDownloadSelfAnalysis: () => void;
  onOpenTaskCardBuilder: () => void;
  onOpenGameBuilder: () => void;
  onOpenEventBuilder: () => void;
}

const GeneratorResult = ({
  type,
  resultLabel,
  result,
  refineOpen,
  setRefineOpen,
  refineInstruction,
  setRefineInstruction,
  refineError,
  setRefineError,
  refining,
  saving,
  saved,
  downloadingDocx,
  onRefine,
  onReset,
  onSave,
  onDownload,
  onDownloadDocx,
  onOpenCardBuilder,
  onDownloadSelfAnalysis,
  onOpenTaskCardBuilder,
  onOpenGameBuilder,
  onOpenEventBuilder,
}: GeneratorResultProps) => {
  return (
    <div className="mt-2 space-y-4 animate-fade-in">
      <div className="rounded-xl border border-border bg-secondary/50 p-4 max-h-80 overflow-y-auto">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
          Готовый {resultLabel}
        </p>
        <p className="text-sm leading-relaxed whitespace-pre-line">{result}</p>
      </div>

      {!refineOpen ? (
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={() => setRefineOpen(true)}
        >
          <Icon name="Sparkles" size={16} />
          Доработать с ИИ
        </Button>
      ) : (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 animate-fade-in">
          <label className="text-sm font-medium block">Что доработать или исправить?</label>
          <Textarea
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            placeholder="Например: добавь ещё один пример, сократи практическую часть, исправь ошибку в задаче 2..."
            rows={3}
          />
          {refineError && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <Icon name="AlertCircle" size={14} />
              {refineError}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              onClick={() => {
                setRefineOpen(false);
                setRefineInstruction("");
                setRefineError(null);
              }}
              disabled={refining}
            >
              Отмена
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-primary hover:bg-primary/90"
              onClick={onRefine}
              disabled={refining || !refineInstruction.trim()}
            >
              {refining ? (
                <Icon name="Loader2" size={15} className="animate-spin" />
              ) : (
                <Icon name="Sparkles" size={15} />
              )}
              Применить
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onReset}>
          <Icon name="RotateCcw" size={16} />
          Заново
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={onSave}
          disabled={saving || saved}
        >
          {saving ? (
            <Icon name="Loader2" size={16} className="animate-spin" />
          ) : saved ? (
            <Icon name="CheckCircle2" size={16} className="text-primary" />
          ) : (
            <Icon name="Save" size={16} />
          )}
          {saved ? "Сохранено" : "В кабинет"}
        </Button>
        <Button className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={onDownload}>
          <Icon name="Download" size={16} />
          Скачать .txt
        </Button>
      </div>

      {type === "quiz" && (
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={onDownloadDocx}
          disabled={downloadingDocx}
        >
          {downloadingDocx ? (
            <Icon name="Loader2" size={16} className="animate-spin" />
          ) : (
            <Icon name="FileText" size={16} />
          )}
          Скачать в Word (.docx)
        </Button>
      )}

      {type === "lesson" && (
        <>
          <Button
            variant="outline"
            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={onOpenCardBuilder}
          >
            <Icon name="LayoutTemplate" size={16} />
            Оформить карточку урока
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={onDownloadSelfAnalysis}
          >
            <Icon name="ClipboardList" size={16} />
            Шаблон самоанализа по уроку
          </Button>
        </>
      )}

      {type === "task" && (
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={onOpenTaskCardBuilder}
        >
          <Icon name="LayoutTemplate" size={16} />
          Оформить карточку задания
        </Button>
      )}

      {type === "game" && (
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={onOpenGameBuilder}
        >
          <Icon name="LayoutTemplate" size={16} />
          Оформить карточку игры
        </Button>
      )}

      {type === "intensive" && (
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={onOpenEventBuilder}
        >
          <Icon name="LayoutTemplate" size={16} />
          Оформить карточку мастер-класса
        </Button>
      )}
    </div>
  );
};

export default GeneratorResult;
