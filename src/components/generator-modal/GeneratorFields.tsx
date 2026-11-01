import { Dispatch, SetStateAction } from "react";
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
import { GeneratorType } from "@/context/AuthContext";
import {
  LessonFields,
  GameFields,
  IntensiveFields,
  TaskFields,
  QuizFields,
  AUDIENCE_OPTIONS,
  INTENSIVE_DURATION_OPTIONS,
  FORMAT_OPTIONS,
  LESSON_TYPE_OPTIONS,
  COMPONENT_OPTIONS,
  QUIZ_DIFFICULTY_OPTIONS,
  QUIZ_TYPE_OPTIONS,
  COMPETENCY_OPTIONS,
} from "./types";

interface GeneratorFieldsProps {
  type: GeneratorType;
  lessonFields: LessonFields;
  setLessonFields: Dispatch<SetStateAction<LessonFields>>;
  gameFields: GameFields;
  setGameFields: Dispatch<SetStateAction<GameFields>>;
  intensiveFields: IntensiveFields;
  setIntensiveFields: Dispatch<SetStateAction<IntensiveFields>>;
  taskFields: TaskFields;
  setTaskFields: Dispatch<SetStateAction<TaskFields>>;
  quizFields: QuizFields;
  setQuizFields: Dispatch<SetStateAction<QuizFields>>;
}

const GeneratorFields = ({
  type,
  lessonFields,
  setLessonFields,
  gameFields,
  setGameFields,
  intensiveFields,
  setIntensiveFields,
  taskFields,
  setTaskFields,
  quizFields,
  setQuizFields,
}: GeneratorFieldsProps) => {
  return (
    <>
      {type === "lesson" && (
        <>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Тип занятия</label>
            <Select
              value={lessonFields.lessonType}
              onValueChange={(v: LessonFields["lessonType"]) => setLessonFields((s) => ({ ...s, lessonType: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESSON_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Предмет/дисциплина</label>
            <Input
              value={lessonFields.subject}
              onChange={(e) => setLessonFields((s) => ({ ...s, subject: e.target.value }))}
              placeholder="Например: Биология, Математика, История..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Тема</label>
            <Input
              value={lessonFields.topic}
              onChange={(e) => setLessonFields((s) => ({ ...s, topic: e.target.value }))}
              placeholder="Например: Фотосинтез, Дроби..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Цель</label>
            <Input
              value={lessonFields.goal}
              onChange={(e) => setLessonFields((s) => ({ ...s, goal: e.target.value }))}
              placeholder="Например: сформировать понимание процесса фотосинтеза"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Задачи</label>
            <Textarea
              value={lessonFields.tasks}
              onChange={(e) => setLessonFields((s) => ({ ...s, tasks: e.target.value }))}
              placeholder="Каждую задачу с новой строки или через запятую"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Технология обучения</label>
            <Input
              value={lessonFields.technology}
              onChange={(e) => setLessonFields((s) => ({ ...s, technology: e.target.value }))}
              placeholder="Например: проблемное обучение, смешанное обучение"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Возраст / количество человек</label>
            <Input
              value={lessonFields.ageCount}
              onChange={(e) => setLessonFields((s) => ({ ...s, ageCount: e.target.value }))}
              placeholder="Например: 7 класс, 25 человек"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Время урока</label>
            <Select
              value={lessonFields.duration}
              onValueChange={(v: "45" | "90") => setLessonFields((s) => ({ ...s, duration: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="45">45 минут</SelectItem>
                <SelectItem value="90">90 минут</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ОК / УУД (необязательно)</label>
            <div className="space-y-2 rounded-lg border border-border p-3 max-h-52 overflow-y-auto">
              {COMPETENCY_OPTIONS.map((c) => (
                <label key={c} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    className="mt-0.5"
                    checked={lessonFields.competencies.includes(c)}
                    onCheckedChange={(checked) =>
                      setLessonFields((s) => ({
                        ...s,
                        competencies: checked
                          ? [...s.competencies, c]
                          : s.competencies.filter((x) => x !== c),
                      }))
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Региональный компонент</label>
            <Input
              value={lessonFields.regionalComponent}
              onChange={(e) => setLessonFields((s) => ({ ...s, regionalComponent: e.target.value }))}
              placeholder="Например: особенности региона, местные примеры (необязательно)"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Профессиональная направленность</label>
            <Input
              value={lessonFields.professionalOrientation}
              onChange={(e) => setLessonFields((s) => ({ ...s, professionalOrientation: e.target.value }))}
              placeholder="Например: инженерный класс, медицинский профиль (необязательно)"
            />
          </div>
        </>
      )}

      {type === "game" && (
        <>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Тема урока</label>
            <Input
              value={gameFields.subject}
              onChange={(e) => setGameFields((s) => ({ ...s, subject: e.target.value }))}
              placeholder="Например: Прошедшее время в английском, Периодическая таблица..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Время</label>
            <Select
              value={gameFields.duration}
              onValueChange={(v: "5" | "15" | "45") => setGameFields((s) => ({ ...s, duration: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 минут</SelectItem>
                <SelectItem value="15">15 минут</SelectItem>
                <SelectItem value="45">45 минут</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Количество человек</label>
            <Input
              value={gameFields.peopleCount}
              onChange={(e) => setGameFields((s) => ({ ...s, peopleCount: e.target.value }))}
              placeholder="Например: 20"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Региональный компонент</label>
            <Input
              value={gameFields.regionalComponent}
              onChange={(e) => setGameFields((s) => ({ ...s, regionalComponent: e.target.value }))}
              placeholder="Например: особенности региона, местные примеры (необязательно)"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Профессиональная направленность</label>
            <Input
              value={gameFields.professionalOrientation}
              onChange={(e) => setGameFields((s) => ({ ...s, professionalOrientation: e.target.value }))}
              placeholder="Например: инженерный класс, медицинский профиль (необязательно)"
            />
          </div>
        </>
      )}

      {type === "intensive" && (
        <>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Тема</label>
            <Input
              value={intensiveFields.topic}
              onChange={(e) => setIntensiveFields((s) => ({ ...s, topic: e.target.value }))}
              placeholder="Например: Критическое мышление, Основы дизайна..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Целевая аудитория</label>
            <Select
              value={intensiveFields.audience}
              onValueChange={(v: IntensiveFields["audience"]) => setIntensiveFields((s) => ({ ...s, audience: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Продолжительность</label>
            <Select
              value={intensiveFields.duration}
              onValueChange={(v: IntensiveFields["duration"]) => setIntensiveFields((s) => ({ ...s, duration: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENSIVE_DURATION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Формат</label>
            <Select
              value={intensiveFields.format}
              onValueChange={(v: IntensiveFields["format"]) => setIntensiveFields((s) => ({ ...s, format: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Цель</label>
            <Input
              value={intensiveFields.goal}
              onChange={(e) => setIntensiveFields((s) => ({ ...s, goal: e.target.value }))}
              placeholder="Например: научить участников базовым принципам дизайна"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Региональный компонент</label>
            <Input
              value={intensiveFields.regionalComponent}
              onChange={(e) => setIntensiveFields((s) => ({ ...s, regionalComponent: e.target.value }))}
              placeholder="Например: особенности региона, местные примеры (необязательно)"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Профессиональная направленность</label>
            <Input
              value={intensiveFields.professionalOrientation}
              onChange={(e) => setIntensiveFields((s) => ({ ...s, professionalOrientation: e.target.value }))}
              placeholder="Например: инженерный класс, медицинский профиль (необязательно)"
            />
          </div>
        </>
      )}

      {type === "task" && (
        <>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Предмет/дисциплина</label>
            <Input
              value={taskFields.subject}
              onChange={(e) => setTaskFields((s) => ({ ...s, subject: e.target.value }))}
              placeholder="Например: Математика, Литература..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Тема</label>
            <Input
              value={taskFields.topic}
              onChange={(e) => setTaskFields((s) => ({ ...s, topic: e.target.value }))}
              placeholder="Например: Квадратные уравнения"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Цель</label>
            <Input
              value={taskFields.goal}
              onChange={(e) => setTaskFields((s) => ({ ...s, goal: e.target.value }))}
              placeholder="Например: закрепить навык решения уравнений"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Акцент на компонент мышления</label>
            <Select
              value={taskFields.component}
              onValueChange={(v: TaskFields["component"]) => setTaskFields((s) => ({ ...s, component: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPONENT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">ОК / УУД (необязательно)</label>
            <div className="space-y-2 rounded-lg border border-border p-3 max-h-52 overflow-y-auto">
              {COMPETENCY_OPTIONS.map((c) => (
                <label key={c} className="flex items-start gap-2 text-sm cursor-pointer">
                  <Checkbox
                    className="mt-0.5"
                    checked={taskFields.competencies.includes(c)}
                    onCheckedChange={(checked) =>
                      setTaskFields((s) => ({
                        ...s,
                        competencies: checked
                          ? [...s.competencies, c]
                          : s.competencies.filter((x) => x !== c),
                      }))
                    }
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Региональный компонент</label>
            <Input
              value={taskFields.regionalComponent}
              onChange={(e) => setTaskFields((s) => ({ ...s, regionalComponent: e.target.value }))}
              placeholder="Например: особенности региона, местные примеры (необязательно)"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Профессиональная направленность</label>
            <Input
              value={taskFields.professionalOrientation}
              onChange={(e) => setTaskFields((s) => ({ ...s, professionalOrientation: e.target.value }))}
              placeholder="Например: инженерный класс, медицинский профиль (необязательно)"
            />
          </div>
        </>
      )}

      {type === "quiz" && (
        <>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Предмет/дисциплина</label>
            <Input
              value={quizFields.subject}
              onChange={(e) => setQuizFields((s) => ({ ...s, subject: e.target.value }))}
              placeholder="Например: Биология, Математика, История..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Тема</label>
            <Input
              value={quizFields.topic}
              onChange={(e) => setQuizFields((s) => ({ ...s, topic: e.target.value }))}
              placeholder="Например: Фотосинтез, Дроби..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Количество вопросов</label>
            <Input
              type="number"
              min={1}
              max={30}
              value={quizFields.questionCount}
              onChange={(e) => setQuizFields((s) => ({ ...s, questionCount: e.target.value }))}
              placeholder="Например: 10"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Уровень сложности</label>
            <Select
              value={quizFields.difficulty}
              onValueChange={(v: QuizFields["difficulty"]) => setQuizFields((s) => ({ ...s, difficulty: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUIZ_DIFFICULTY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Типы вопросов</label>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {QUIZ_TYPE_OPTIONS.map((o) => (
                <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={quizFields.questionTypes.includes(o.value)}
                    onCheckedChange={(checked) =>
                      setQuizFields((s) => ({
                        ...s,
                        questionTypes: checked
                          ? [...s.questionTypes, o.value]
                          : s.questionTypes.filter((t) => t !== o.value),
                      }))
                    }
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Региональный компонент</label>
            <Input
              value={quizFields.regionalComponent}
              onChange={(e) => setQuizFields((s) => ({ ...s, regionalComponent: e.target.value }))}
              placeholder="Например: особенности региона, местные примеры (необязательно)"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Профессиональная направленность</label>
            <Input
              value={quizFields.professionalOrientation}
              onChange={(e) => setQuizFields((s) => ({ ...s, professionalOrientation: e.target.value }))}
              placeholder="Например: инженерный класс, медицинский профиль (необязательно)"
            />
          </div>
        </>
      )}
    </>
  );
};

export default GeneratorFields;
