import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuth, AUTH_URL, GeneratorType } from "@/context/AuthContext";
import { useUsage } from "@/context/UsageContext";
import { downloadTxt, downloadDocx } from "@/lib/download";
import { saveLessonCardPrefill, matchTechnologies } from "@/components/lesson-card/prefill";
import { saveTaskCardPrefill, COMPONENT_TO_TASK_TYPE } from "@/components/task-card/taskCardConfig";
import { saveGameCardPrefill, matchPeopleBucket } from "@/components/game-card/gameCardConfig";
import { saveEventPrefill, mapIntensiveToEvent } from "@/components/event-card/eventCardConfig";
import GeneratorFields from "@/components/generator-modal/GeneratorFields";
import GeneratorFormFooter from "@/components/generator-modal/GeneratorFormFooter";
import GeneratorResult from "@/components/generator-modal/GeneratorResult";
import {
  META,
  LessonFields,
  GameFields,
  IntensiveFields,
  TaskFields,
  QuizFields,
  requestGeneration,
  requestRefine,
} from "@/components/generator-modal/types";

interface GeneratorModalProps {
  open: boolean;
  onClose: () => void;
  type: GeneratorType | null;
  onNeedUpgrade: () => void;
  onNeedAuth: () => void;
}

const GeneratorModal = ({ open, onClose, type, onNeedUpgrade, onNeedAuth }: GeneratorModalProps) => {
  const { token, user, canUseGenerator, registerGeneratorUse, remainingUse, isPaid } = useAuth();
  const { incrementServices } = useUsage();

  const [lessonFields, setLessonFields] = useState<LessonFields>({
    subject: "",
    topic: "",
    goal: "",
    tasks: "",
    technology: "",
    ageCount: "",
    duration: "45",
    lessonType: "theory",
    competencies: [],
    regionalComponent: "",
    professionalOrientation: "",
  });
  const [gameFields, setGameFields] = useState<GameFields>({
    subject: "",
    duration: "15",
    peopleCount: "",
    regionalComponent: "",
    professionalOrientation: "",
  });
  const [intensiveFields, setIntensiveFields] = useState<IntensiveFields>({
    topic: "",
    audience: "schoolchildren",
    duration: "1day",
    format: "intensive",
    goal: "",
    regionalComponent: "",
    professionalOrientation: "",
  });
  const [taskFields, setTaskFields] = useState<TaskFields>({
    subject: "",
    topic: "",
    goal: "",
    component: "balanced",
    competencies: [],
    regionalComponent: "",
    professionalOrientation: "",
  });
  const [quizFields, setQuizFields] = useState<QuizFields>({
    subject: "",
    topic: "",
    questionCount: "10",
    difficulty: "mixed",
    questionTypes: ["single"],
    regionalComponent: "",
    professionalOrientation: "",
  });

  const [ovz, setOvz] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  if (!type) return null;
  const meta = META[type];

  const reset = () => {
    setLessonFields({ subject: "", topic: "", goal: "", tasks: "", technology: "", ageCount: "", duration: "45", lessonType: "theory", competencies: [], regionalComponent: "", professionalOrientation: "" });
    setGameFields({ subject: "", duration: "15", peopleCount: "", regionalComponent: "", professionalOrientation: "" });
    setIntensiveFields({ topic: "", audience: "schoolchildren", duration: "1day", format: "intensive", goal: "", regionalComponent: "", professionalOrientation: "" });
    setTaskFields({ subject: "", topic: "", goal: "", component: "balanced", competencies: [], regionalComponent: "", professionalOrientation: "" });
    setQuizFields({ subject: "", topic: "", questionCount: "10", difficulty: "mixed", questionTypes: ["single"], regionalComponent: "", professionalOrientation: "" });
    setOvz([]);
    setResult(null);
    setError(null);
    setLoading(false);
    setSaved(false);
    setDownloadingDocx(false);
    setRefineOpen(false);
    setRefineInstruction("");
    setRefineError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGenerate = async () => {
    if (!user) {
      onNeedAuth();
      return;
    }
    if (!canUseGenerator(type)) {
      onNeedUpgrade();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const baseFields: Record<string, string> =
        type === "lesson"
          ? { ...lessonFields, competencies: lessonFields.competencies.join(", ") }
          : type === "game"
          ? { ...gameFields }
          : type === "intensive"
          ? { ...intensiveFields }
          : type === "quiz"
          ? { ...quizFields, questionTypes: quizFields.questionTypes.join(",") }
          : { ...taskFields, competencies: taskFields.competencies.join(", ") };
      const fields: Record<string, string> = { ...baseFields, ovz: ovz.join(", ") };
      const registered = await registerGeneratorUse(type);
      if (!registered) {
        onNeedUpgrade();
        setLoading(false);
        return;
      }
      const content = await requestGeneration(type, fields);
      setResult(content);
      incrementServices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка генерации, попробуйте снова");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!result || !refineInstruction.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      const updated = await requestRefine(result, refineInstruction.trim());
      setResult(updated);
      setRefineInstruction("");
      setRefineOpen(false);
      setSaved(false);
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать материал");
    } finally {
      setRefining(false);
    }
  };

  const resultTopic =
    type === "lesson"
      ? lessonFields.topic
      : type === "game"
      ? gameFields.subject
      : type === "intensive"
      ? intensiveFields.topic
      : type === "quiz"
      ? quizFields.topic
      : taskFields.topic;
  const resultTitle = `${meta.title}: ${resultTopic || "без темы"}`;

  const handleDownload = () => {
    if (!result) return;
    downloadTxt(resultTitle, [resultTitle, "", result]);
  };

  const handleOpenCardBuilder = () => {
    saveLessonCardPrefill({
      discipline: lessonFields.subject,
      group: lessonFields.ageCount,
      topic: lessonFields.topic,
      goal: lessonFields.goal,
      duration: lessonFields.duration,
      lessonType: lessonFields.lessonType === "practice" ? "Практическое занятие" : "Теоретическое занятие",
      competencies: lessonFields.competencies,
      technologies: matchTechnologies(lessonFields.technology),
    });
    window.location.href = "/konstruktor-uroka";
  };

  const handleOpenGameBuilder = () => {
    saveGameCardPrefill({
      topic: gameFields.subject,
      time: `${gameFields.duration} минут`,
      people: matchPeopleBucket(gameFields.peopleCount) || "",
    });
    window.location.href = "/konstruktor-igry";
  };

  const handleOpenEventBuilder = () => {
    saveEventPrefill(mapIntensiveToEvent(intensiveFields));
    window.location.href = "/konstruktor-masterklassov";
  };

  const handleOpenTaskCardBuilder = () => {
    saveTaskCardPrefill({
      discipline: taskFields.subject,
      group: "",
      topic: taskFields.topic,
      goal: taskFields.goal,
      taskType: COMPONENT_TO_TASK_TYPE[taskFields.component] || "Репродуктивное",
      competencies: taskFields.competencies,
    });
    window.location.href = "/konstruktor-zadaniy";
  };

  const handleDownloadSelfAnalysis = () => {
    const isPractice = lessonFields.lessonType === "practice";
    const title = `Шаблон самоанализа урока: ${lessonFields.topic || "без темы"}`;
    const lines = [
      title,
      "",
      "1. Общие сведения",
      `Дата: _______________`,
      `Предмет/дисциплина: ${lessonFields.subject || "_______________"}`,
      `Тема: ${lessonFields.topic || "_______________"}`,
      `Класс/группа, количество обучающихся: ${lessonFields.ageCount || "_______________"}`,
      `Тип занятия: ${isPractice ? "практическое" : "теоретическое"}`,
      `Цель занятия: ${lessonFields.goal || "_______________"}`,
      "",
      "2. Достижение цели и задач",
      "Была ли достигнута цель занятия (да/частично/нет), обоснование: _______________",
      "Все ли поставленные задачи решены: _______________",
      "",
      "3. Соответствие содержания и структуры занятия",
      "Соответствие содержания теме и цели: _______________",
      isPractice
        ? "Соответствие этапов практического занятия плану (приветствие, мотивация/актуализация, первичный инструктаж, отработка навыка, текущий инструктаж, закрепление, рефлексия, выставление оценок, домашнее задание): _______________"
        : "Соответствие этапов теоретического занятия плану (приветствие, актуализация, сообщение новой темы, закрепление, проверка выполненной работы, рефлексия, домашнее задание): _______________",
      "",
      "4. Методы и приёмы обучения",
      "Какие педагогические приёмы и методы были использованы, их эффективность: _______________",
      "Использование ОК/УУД (если запланированы): _______________",
      "",
      "5. Организация деятельности обучающихся",
      "Уровень активности и вовлечённости обучающихся: _______________",
      "Работа с разными группами обучающихся (сильные/слабые, индивидуальный подход): _______________",
      isPractice
        ? "Качество отработки практического навыка, типичные ошибки и их коррекция в ходе текущего инструктажа: _______________"
        : "Качество усвоения нового материала, результаты проверки выполненной работы: _______________",
      "",
      "6. Результаты занятия",
      "Что усвоено обучающимися, каков реальный результат: _______________",
      "Объективность и обоснованность выставленных оценок: _______________",
      "",
      "7. Трудности и их преодоление",
      "Какие трудности возникли на занятии и как они были преодолены: _______________",
      "",
      "8. Выводы и перспективы",
      "Что следует изменить/доработать при повторном проведении занятия: _______________",
      "Самооценка занятия (по 5-балльной шкале) и комментарий: _______________",
    ];
    downloadTxt(title, lines);
  };

  const handleDownloadDocx = async () => {
    if (!result) return;
    setDownloadingDocx(true);
    try {
      await downloadDocx(resultTitle, resultTitle, result);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    if (!token || !user) {
      onNeedAuth();
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({
          action: "save_material",
          type,
          title: resultTitle,
          content: result,
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-2xl">{meta.icon}</span>
            {meta.title}
          </DialogTitle>
          <DialogDescription>
            {!user
              ? "Войдите в личный кабинет, чтобы получить 3 бесплатные генерации на все инструменты"
              : isPaid
              ? "Безлимитная генерация по вашему тарифу"
              : `Осталось бесплатных генераций (на все инструменты): ${remainingUse(type)} из 3`}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-2">
            <GeneratorFields
              type={type}
              lessonFields={lessonFields}
              setLessonFields={setLessonFields}
              gameFields={gameFields}
              setGameFields={setGameFields}
              intensiveFields={intensiveFields}
              setIntensiveFields={setIntensiveFields}
              taskFields={taskFields}
              setTaskFields={setTaskFields}
              quizFields={quizFields}
              setQuizFields={setQuizFields}
            />
            <GeneratorFormFooter
              type={type}
              user={user}
              ovz={ovz}
              setOvz={setOvz}
              loading={loading}
              error={error}
              quizFields={quizFields}
              onGenerate={handleGenerate}
              onOpenCardBuilder={handleOpenCardBuilder}
              onDownloadSelfAnalysis={handleDownloadSelfAnalysis}
              onOpenTaskCardBuilder={handleOpenTaskCardBuilder}
              onOpenGameBuilder={handleOpenGameBuilder}
              onOpenEventBuilder={handleOpenEventBuilder}
            />
          </div>
        ) : (
          <GeneratorResult
            type={type}
            resultLabel={meta.resultLabel}
            result={result}
            refineOpen={refineOpen}
            setRefineOpen={setRefineOpen}
            refineInstruction={refineInstruction}
            setRefineInstruction={setRefineInstruction}
            refineError={refineError}
            setRefineError={setRefineError}
            refining={refining}
            saving={saving}
            saved={saved}
            downloadingDocx={downloadingDocx}
            onRefine={handleRefine}
            onReset={reset}
            onSave={handleSave}
            onDownload={handleDownload}
            onDownloadDocx={handleDownloadDocx}
            onOpenCardBuilder={handleOpenCardBuilder}
            onDownloadSelfAnalysis={handleDownloadSelfAnalysis}
            onOpenTaskCardBuilder={handleOpenTaskCardBuilder}
            onOpenGameBuilder={handleOpenGameBuilder}
            onOpenEventBuilder={handleOpenEventBuilder}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GeneratorModal;
