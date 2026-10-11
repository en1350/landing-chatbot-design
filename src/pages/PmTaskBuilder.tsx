import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import OvzSelect from "@/components/OvzSelect";
import { useAuth } from "@/context/AuthContext";
import { downloadDocx, downloadTxt } from "@/lib/download";
import { toast } from "sonner";
import PmTaskPreview from "@/components/pm-task/PmTaskPreview";
import {
  LEVEL_LABEL,
  PM_CONTROL_FORMS,
  PM_LEVELS,
  PM_TASK_TYPES,
  PmCriterion,
  PmTaskItem,
} from "@/components/pm-task/pmTaskConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const REFINE_HINTS = ["Сделай задания сложнее", "Добавь практический пример", "Уточни критерии оценки", "Сократи формулировки"];

const PmTaskBuilder = () => {
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [pmName, setPmName] = useState("");
  const [pmCode, setPmCode] = useState("");
  const [mdkCode, setMdkCode] = useState("");
  const [mdkTopic, setMdkTopic] = useState("");
  const [vd, setVd] = useState("");
  const [pk, setPk] = useState("");
  const [ok, setOk] = useState("");
  const [taskType, setTaskType] = useState("practical");
  const [taskCount, setTaskCount] = useState("5");
  const [level, setLevel] = useState("medium");
  const [duration, setDuration] = useState("90");
  const [controlForm, setControlForm] = useState(PM_CONTROL_FORMS[0]);
  const [spec, setSpec] = useState("");
  const [ovz, setOvz] = useState<string[]>([]);

  const [instructionText, setInstructionText] = useState("");
  const [tasks, setTasks] = useState<PmTaskItem[]>([]);
  const [criteria, setCriteria] = useState<PmCriterion[]>([]);
  const [equipment, setEquipment] = useState("");
  const [answerKey, setAnswerKey] = useState("");
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const [loading, setLoading] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const baseFields = { pmName, pmCode, mdkCode, mdkTopic, vd, pk, ok, taskType, taskCount: Number(taskCount) || 5, level, duration, controlForm, spec, ovz };

  const applyResult = (data: {
    instruction?: string;
    tasks?: PmTaskItem[];
    criteria?: PmCriterion[];
    equipment?: string;
    answerKey?: string;
  }) => {
    setInstructionText(data.instruction || "");
    setTasks(data.tasks || []);
    setCriteria(data.criteria || []);
    setEquipment(data.equipment || "");
    setAnswerKey(data.answerKey || "");
  };

  const checkAccess = () => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return false;
    }
    if (!pmName.trim() && !mdkTopic.trim()) {
      toast.error("Укажите наименование ПМ или тему МДК — без этого ИИ не сможет составить задания");
      return false;
    }
    return true;
  };

  const request = async (action: string, fields: object, instruction?: string) => {
    const res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
      body: JSON.stringify({ action, fields, ...(instruction ? { instruction } : {}) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось получить ответ от ИИ");
    return data;
  };

  const generate = async () => {
    if (!checkAccess()) return;
    setLoading(true);
    try {
      applyResult(await request("pm_task", baseFields));
      setShowAnswerKey(false);
      toast.success("Задания готовы — проверьте и при необходимости доработайте");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить задания");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!checkAccess()) return;
    if (!refineInstruction.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      const data = await request(
        "pm_task_refine",
        { ...baseFields, instructionText, tasks, criteria, equipment, answerKey },
        refineInstruction.trim()
      );
      applyResult(data);
      setRefineInstruction("");
      setRefineOpen(false);
      toast.success("Задания доработаны — проверьте изменения");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать задания");
    } finally {
      setRefining(false);
    }
  };

  const clearAll = () => {
    if ((tasks.length > 0 || pmName || mdkTopic) && !window.confirm("Очистить все поля и результат?")) return;
    [setPmName, setPmCode, setMdkCode, setMdkTopic, setVd, setPk, setOk, setSpec, setInstructionText, setEquipment, setAnswerKey].forEach(
      (fn) => fn("")
    );
    setTasks([]);
    setCriteria([]);
    setOvz([]);
    setShowAnswerKey(false);
    setRefineOpen(false);
  };

  const typeLabel = PM_TASK_TYPES.find((t) => t.value === taskType)?.label || "";
  const docTitle = `${typeLabel} — ${(pmCode + " " + pmName).trim() || mdkTopic.trim() || "ПМ"}`;

  const buildLines = (withKey: boolean) => [
    `${typeLabel}`,
    `ПМ: ${(pmCode + " " + pmName).trim() || "—"}`,
    `МДК: ${(mdkCode + " " + mdkTopic).trim() || "—"}`,
    `ВД: ${vd.trim() || "—"}`,
    `ПК: ${pk.trim() || "—"} | ОК: ${ok.trim() || "—"}`,
    `Время выполнения: ${duration} мин. | Форма контроля: ${controlForm}`,
    ...(instructionText.trim() ? ["", instructionText.trim()] : []),
    "",
    "ЗАДАНИЯ",
    ...tasks.flatMap((t, i) => [`Задание ${i + 1} (${LEVEL_LABEL[t.level]}). ${t.text}`, ""]),
    ...(criteria.length
      ? ["КРИТЕРИИ ОЦЕНИВАНИЯ", ...criteria.map((c) => `${c.grade}: ${c.criterion} (${c.match})`), ""]
      : []),
    ...(equipment.trim() ? ["МАТЕРИАЛЬНО-ТЕХНИЧЕСКОЕ ОБЕСПЕЧЕНИЕ", equipment.trim(), ""] : []),
    ...(withKey && answerKey.trim() ? ["ЭТАЛОН ОТВЕТА (ДЛЯ ПРЕПОДАВАТЕЛЯ)", answerKey.trim()] : []),
  ];

  const exportKey = showAnswerKey;
  const handleDownloadTxt = () => downloadTxt(docTitle, buildLines(exportKey));
  const handleDownloadDocx = () => downloadDocx(docTitle, typeLabel, buildLines(exportKey).slice(1).join("\n"));
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildLines(exportKey).join("\n"));
      toast.success("Текст скопирован в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать текст");
    }
  };

  const hasResult = tasks.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => (window.location.href = "/#notebook")}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={() => {
          setProfileOpen(false);
          setAuthOpen(true);
        }}
        onOpenPricing={() => setProfileOpen(true)}
      />

      <main className="flex-1 py-8 md:py-12">
        <div className="container">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 no-print"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8 no-print">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">Генератор заданий по профессиональному модулю</h1>
            <p className="text-muted-foreground">
              Укажите ПМ, МДК и компетенции — ИИ составит задания, критерии оценивания и эталон ответа по методике
              Алтынниковой О.В. Результат можно доработать замечанием, распечатать или скачать в Word.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm no-print">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Наименование ПМ</label>
                <Input value={pmName} onChange={(e) => setPmName(e.target.value)} placeholder="Например: Выполнение работ по профессии" />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Код ПМ</label>
                  <Input value={pmCode} onChange={(e) => setPmCode(e.target.value)} placeholder="ПМ.02" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Код МДК</label>
                  <Input value={mdkCode} onChange={(e) => setMdkCode(e.target.value)} placeholder="МДК.02.01" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Тема МДК</label>
                <Input value={mdkTopic} onChange={(e) => setMdkTopic(e.target.value)} placeholder="Например: Выполнение столярных работ" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Вид профессиональной деятельности (ВД)</label>
                <Input value={vd} onChange={(e) => setVd(e.target.value)} placeholder="Например: Выполнение работ по профессии" />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Формируемые ПК</label>
                  <Input value={pk} onChange={(e) => setPk(e.target.value)} placeholder="ПК 2.1, ПК 2.2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Формируемые ОК</label>
                  <Input value={ok} onChange={(e) => setOk(e.target.value)} placeholder="ОК 1, ОК 2, ОК 4" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Тип задания</label>
                <Select value={taskType} onValueChange={setTaskType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PM_TASK_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Количество заданий</label>
                  <Input type="number" min={1} max={20} value={taskCount} onChange={(e) => setTaskCount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Уровень сложности</label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PM_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Время выполнения (мин)</label>
                  <Input type="number" min={5} value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Форма контроля</label>
                  <Select value={controlForm} onValueChange={setControlForm}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PM_CONTROL_FORMS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Спецификация / дополнительные условия</label>
                <Textarea value={spec} onChange={(e) => setSpec(e.target.value)} rows={3} placeholder="Материалы, оборудование, особые требования..." />
              </div>

              <div className="mt-5">
                <OvzSelect value={ovz} onChange={setOvz} disabled={loading || refining} />
              </div>

              <Button className="w-full mt-5 gap-2" onClick={generate} disabled={loading || refining}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    ИИ составляет задания...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={17} />
                    Сгенерировать с ИИ
                  </>
                )}
              </Button>
              {!isPaid && (
                <p className="mt-2 text-center text-xs text-muted-foreground">Генерация с ИИ доступна по подписке.</p>
              )}

              {hasResult && !refineOpen && (
                <Button
                  variant="outline"
                  className="w-full mt-2.5 gap-2 border-primary/30 text-primary hover:bg-primary/5"
                  onClick={() => setRefineOpen(true)}
                  disabled={loading}
                >
                  <Icon name="Sparkles" size={16} />
                  Доработать с ИИ
                </Button>
              )}
              {hasResult && refineOpen && (
                <div className="mt-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 animate-fade-in">
                  <label className="text-sm font-medium block">Что доработать или исправить?</label>
                  <Textarea
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="Например: добавь задание на диагностику, сделай критерии строже, замени пример в задании 2..."
                    rows={3}
                    disabled={refining}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {REFINE_HINTS.map((h) => (
                      <button
                        key={h}
                        type="button"
                        disabled={refining}
                        onClick={() => setRefineInstruction(h)}
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent transition-colors disabled:opacity-50"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
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
                      disabled={refining}
                      onClick={() => {
                        setRefineOpen(false);
                        setRefineInstruction("");
                        setRefineError(null);
                      }}
                    >
                      Отмена
                    </Button>
                    <Button size="sm" className="flex-1 gap-1.5" onClick={handleRefine} disabled={refining || !refineInstruction.trim()}>
                      {refining ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Sparkles" size={15} />}
                      {refining ? "ИИ дорабатывает..." : "Применить"}
                    </Button>
                  </div>
                </div>
              )}

              <Button variant="ghost" className="w-full mt-2 gap-1.5 text-muted-foreground" onClick={clearAll}>
                <Icon name="Trash2" size={15} />
                Очистить
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
              <h2 className="font-display text-lg font-bold mb-4 no-print">📋 Сгенерированное задание</h2>
              <PmTaskPreview
                data={{
                  pmCode, pmName, mdkCode, mdkTopic, vd, pk, ok, taskType, duration, controlForm,
                  instructionText, tasks, criteria, equipment, answerKey, showAnswerKey,
                }}
              />
              {hasResult && answerKey.trim() && (
                <label className="mt-4 flex items-center gap-2 text-sm cursor-pointer no-print">
                  <input type="checkbox" checked={showAnswerKey} onChange={(e) => setShowAnswerKey(e.target.checked)} />
                  Показать и включить в файлы эталон ответа (для преподавателя)
                </label>
              )}
              {hasResult && (
                <div className="mt-4 flex flex-wrap gap-2 no-print">
                  <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
                    <Icon name="Printer" size={15} />
                    Печать / PDF
                  </Button>
                  <Button variant="outline" className="gap-1.5" onClick={handleDownloadDocx}>
                    <Icon name="FileText" size={15} />
                    Скачать Word
                  </Button>
                  <Button variant="outline" className="gap-1.5" onClick={handleDownloadTxt}>
                    <Icon name="Download" size={15} />
                    Скачать TXT
                  </Button>
                  <Button variant="ghost" className="gap-1.5" onClick={handleCopy}>
                    <Icon name="Copy" size={15} />
                    Копировать
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer
        onOpenProfile={() => setProfileOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
      />

      <DecomposerModal
        open={decomposerOpen}
        onClose={() => setDecomposerOpen(false)}
        onNeedAuth={() => {
          setDecomposerOpen(false);
          setAuthOpen(true);
        }}
        onNeedUpgrade={() => {
          setDecomposerOpen(false);
          setUpgradeOpen(true);
        }}
      />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal
        open={antiplagiatOpen}
        onClose={() => setAntiplagiatOpen(false)}
        onNeedAuth={() => {
          setAntiplagiatOpen(false);
          setAuthOpen(true);
        }}
        onNeedUpgrade={() => {
          setAntiplagiatOpen(false);
          setUpgradeOpen(true);
        }}
      />
      <ProfileSheet
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onNeedAuth={() => {
          setProfileOpen(false);
          setAuthOpen(true);
        }}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onNeedAuth={() => {
          setUpgradeOpen(false);
          setAuthOpen(true);
        }}
      />
    </div>
  );
};

export default PmTaskBuilder;