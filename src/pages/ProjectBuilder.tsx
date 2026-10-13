import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { downloadDocx, downloadTxt } from "@/lib/download";
import { toast } from "sonner";
import ProjectPreview from "@/components/project/ProjectPreview";
import { PROJECT_TYPES, ProjectPlan, planToLines } from "@/components/project/projectTypes";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const REFINE_HINTS = ["Добавь больше рисков", "Сократи сроки", "Сделай задачи подробнее", "Добавь KPI"];

const ProjectBuilder = () => {
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [topic, setTopic] = useState("");
  const [projectType, setProjectType] = useState(PROJECT_TYPES[0]);
  const [org, setOrg] = useState("");
  const [audience, setAudience] = useState("");
  const [duration, setDuration] = useState("3 месяца");
  const [teamSize, setTeamSize] = useState("");
  const [budget, setBudget] = useState("");
  const [extra, setExtra] = useState("");

  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [savedId, setSavedId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const authPost = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка сохранения");
      return data;
    },
    [token]
  );

  useEffect(() => {
    const id = Number(searchParams.get("open"));
    if (!id || !token) return;
    setSearchParams({}, { replace: true });
    (async () => {
      try {
        const data = await authPost({ action: "get_material", id });
        const parsed = JSON.parse(data.content || "{}");
        if (!parsed.plan) throw new Error("Не удалось открыть проект");
        const f = parsed.fields || {};
        setTopic(f.topic || "");
        setProjectType(f.projectType || PROJECT_TYPES[0]);
        setOrg(f.org || "");
        setAudience(f.audience || "");
        setDuration(f.duration || "3 месяца");
        setTeamSize(f.teamSize || "");
        setBudget(f.budget || "");
        setExtra(f.extra || "");
        setPlan(parsed.plan);
        setSavedId(id);
        toast.success("Проект открыт из личного кабинета");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось открыть проект");
      }
    })();
  }, [searchParams, token, authPost, setSearchParams]);

  const baseFields = { topic, projectType, org, audience, duration, teamSize, budget, extra };

  const checkAccess = () => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return false;
    }
    if (!topic.trim()) {
      toast.error("Укажите тему или идею проекта — без этого ИИ не сможет составить план");
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
    return data as ProjectPlan;
  };

  const generate = async () => {
    if (!checkAccess()) return;
    setLoading(true);
    try {
      setPlan(await request("project_gen", baseFields));
      setSavedId(null);
      toast.success("План проекта готов — проверьте и при необходимости доработайте");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить план");
    } finally {
      setLoading(false);
    }
  };

  const handleRefine = async () => {
    if (!checkAccess() || !plan || !refineInstruction.trim()) return;
    setRefining(true);
    setRefineError(null);
    try {
      setPlan(await request("project_refine", { ...baseFields, project: plan }, refineInstruction.trim()));
      setRefineInstruction("");
      setRefineOpen(false);
      toast.success("План доработан — проверьте изменения");
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать план");
    } finally {
      setRefining(false);
    }
  };

  const savePlan = async () => {
    if (!plan) return;
    if (!user || !token) {
      setAuthOpen(true);
      return;
    }
    setSaving(true);
    try {
      const content = JSON.stringify({ fields: baseFields, plan });
      if (savedId) {
        await authPost({ action: "update_material", id: savedId, title: plan.name || "План проекта", content });
        toast.success("Изменения сохранены в личном кабинете");
      } else {
        const res = await authPost({ action: "save_material", type: "project", title: plan.name || "План проекта", content });
        setSavedId(res.id);
        toast.success("План сохранён в личном кабинете, вкладка «Материалы»");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить план");
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    if ((plan || topic) && !window.confirm("Очистить все поля и результат?")) return;
    [setTopic, setOrg, setAudience, setTeamSize, setBudget, setExtra].forEach((fn) => fn(""));
    setDuration("3 месяца");
    setPlan(null);
    setSavedId(null);
    setRefineOpen(false);
  };

  const docTitle = plan?.name || "План проекта";
  const handleDownloadTxt = () => plan && downloadTxt(docTitle, planToLines(plan));
  const handleDownloadDocx = () => plan && downloadDocx(docTitle, docTitle, planToLines(plan).slice(1).join("\n"));
  const handleCopy = async () => {
    if (!plan) return;
    try {
      await navigator.clipboard.writeText(planToLines(plan).join("\n"));
      toast.success("Текст скопирован в буфер обмена");
    } catch {
      toast.error("Не удалось скопировать текст");
    }
  };

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

      <main className="flex-1 py-6 sm:py-8 md:py-12">
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
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">Генератор проектов</h1>
            <p className="text-muted-foreground">
              Опишите идею — ИИ составит полный план: цель по SMART, задачи, диаграмму Ганта, команду, риски и контроль.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[26rem_minmax(0,1fr)]">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm no-print h-fit">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Тема или идея проекта</label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  placeholder="Например: школьная экологическая тропа с QR-кодами"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Тип проекта</label>
                <Select value={projectType} onValueChange={setProjectType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Организация</label>
                <Input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Школа, колледж, кафедра..." />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Целевая аудитория</label>
                <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Например: ученики 5–7 классов" />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Длительность</label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="3 месяца" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Команда</label>
                  <Input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="5 человек" />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Бюджет</label>
                <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Например: 50 000 ₽ или без бюджета" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Дополнительные пожелания</label>
                <Textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} placeholder="Особые условия, партнёры, форматы..." />
              </div>

              <Button className="w-full mt-5 gap-2" onClick={generate} disabled={loading || refining}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    ИИ составляет план...
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

              {plan && !refineOpen && (
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
              {plan && refineOpen && (
                <div className="mt-2.5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 animate-fade-in">
                  <label className="text-sm font-medium block">Что доработать или исправить?</label>
                  <Textarea
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    placeholder="Например: добавь этап тестирования, уточни риски по срокам..."
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

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm min-w-0">
              <h2 className="font-display text-lg font-bold mb-4 no-print">📋 План проекта</h2>
              {plan ? (
                <ProjectPreview plan={plan} />
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  <div className="text-5xl mb-3">🗂️</div>
                  <p className="text-sm max-w-xs mx-auto">
                    Здесь появится план проекта. Опишите идею слева и нажмите «Сгенерировать с ИИ».
                  </p>
                </div>
              )}
              {plan && (
                <div className="mt-4 flex flex-wrap gap-2 no-print">
                  <Button className="gap-1.5" onClick={savePlan} disabled={saving}>
                    {saving ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name={savedId ? "Check" : "Save"} size={15} />}
                    {savedId ? "Обновить в кабинете" : "Сохранить в личный кабинет"}
                  </Button>
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

export default ProjectBuilder;
