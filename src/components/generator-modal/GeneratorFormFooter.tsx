import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import OvzSelect from "@/components/OvzSelect";
import { GeneratorType } from "@/context/AuthContext";
import { QuizFields } from "./types";

interface GeneratorFormFooterProps {
  type: GeneratorType;
  user: unknown;
  ovz: string[];
  setOvz: (v: string[]) => void;
  loading: boolean;
  error: string | null;
  quizFields: QuizFields;
  onGenerate: () => void;
  onOpenCardBuilder: () => void;
  onDownloadSelfAnalysis: () => void;
  onOpenTaskCardBuilder: () => void;
  onOpenGameBuilder: () => void;
  onOpenEventBuilder: () => void;
}

const GeneratorFormFooter = ({
  type,
  user,
  ovz,
  setOvz,
  loading,
  error,
  quizFields,
  onGenerate,
  onOpenCardBuilder,
  onDownloadSelfAnalysis,
  onOpenTaskCardBuilder,
  onOpenGameBuilder,
  onOpenEventBuilder,
}: GeneratorFormFooterProps) => {
  return (
    <>
      {type !== "antiplagiat" && <OvzSelect value={ovz} onChange={setOvz} disabled={loading} />}

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <Icon name="AlertCircle" size={14} />
          {error}
        </p>
      )}

      <Button
        className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        onClick={onGenerate}
        disabled={loading || (type === "quiz" && quizFields.questionTypes.length === 0)}
      >
        {loading ? (
          <>
            <Icon name="Loader2" size={17} className="animate-spin" />
            ИИ генерирует материал...
          </>
        ) : !user ? (
          <>
            <Icon name="LogIn" size={17} />
            Войти и сгенерировать
          </>
        ) : (
          <>
            <Icon name="Wand2" size={17} />
            Сгенерировать с ИИ
          </>
        )}
      </Button>

      {type === "lesson" && (
        <>
          <Button
            variant="outline"
            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
            onClick={onOpenCardBuilder}
          >
            <Icon name="LayoutTemplate" size={16} />
            Открыть в конструкторе карточки урока
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
          Открыть в конструкторе заданий
        </Button>
      )}

      {type === "game" && (
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={onOpenGameBuilder}
        >
          <Icon name="LayoutTemplate" size={16} />
          Открыть в конструкторе игры
        </Button>
      )}

      {type === "intensive" && (
        <Button
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5"
          onClick={onOpenEventBuilder}
        >
          <Icon name="LayoutTemplate" size={16} />
          Открыть в конструкторе мастер-классов
        </Button>
      )}
    </>
  );
};

export default GeneratorFormFooter;
