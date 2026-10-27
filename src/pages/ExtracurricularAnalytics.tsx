import PaywallLock from "@/components/PaywallLock";
import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { toast } from "sonner";
import StatsPanel from "@/components/extracurricular/StatsPanel";
import EventInputForm from "@/components/extracurricular/EventInputForm";
import EventsTable from "@/components/extracurricular/EventsTable";
import ReportCard from "@/components/extracurricular/ReportCard";
import PlanCard from "@/components/extracurricular/PlanCard";
import { EventRow, YEARS, ACTIVITY_TYPES, DEMO_ROWS, pct } from "@/components/extracurricular/types";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const newId = () => Math.random().toString(36).slice(2, 10);

const STORAGE_KEY = "urokai_extracurricular_rows";
const REPORT_KEY = "urokai_extracurricular_report";
const PLAN_KEY = "urokai_extracurricular_plan";
const PLAN_PERIODS = ["Следующий месяц", "Квартал", "Полугодие", "Учебный год"];

const loadStoredRows = (): EventRow[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const ExtracurricularAnalytics = () => {
  const { user, canUsePaid: isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [rows, setRows] = useState<EventRow[]>([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("");
  const [planPeriod, setPlanPeriod] = useState(PLAN_PERIODS[3]);
  const [planLoading, setPlanLoading] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [planSaved, setPlanSaved] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    setRows(loadStoredRows());
    try {
      setReport(localStorage.getItem(REPORT_KEY) || "");
      setPlan(localStorage.getItem(PLAN_KEY) || "");
    } catch {
      /* хранилище недоступно */
    }
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* хранилище переполнено или недоступно */
    }
  }, [rows, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      if (report) localStorage.setItem(REPORT_KEY, report);
      else localStorage.removeItem(REPORT_KEY);
    } catch {
      /* хранилище недоступно */
    }
  }, [report, storageLoaded]);

  const [year, setYear] = useState(YEARS[1]);
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [group, setGroup] = useState("");
  const [total, setTotal] = useState("");
  const [type, setType] = useState(ACTIVITY_TYPES[0]);
  const [desc, setDesc] = useState("");
  const [participants, setParticipants] = useState("");

  const addRow = () => {
    if (!subject.trim() || !group.trim() || !total) {
      toast.error("Заполните дисциплину, группу и численность группы");
      return;
    }
    setRows((prev) => [
      ...prev,
      {
        id: newId(),
        year,
        date,
        subject: subject.trim(),
        group: group.trim(),
        total: parseInt(total, 10) || 0,
        type,
        desc: desc.trim(),
        participants: parseInt(participants, 10) || 0,
      },
    ]);
    setGroup("");
    setTotal("");
    setParticipants("");
    setDesc("");
    toast.success("Мероприятие добавлено");
  };

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      if (plan) localStorage.setItem(PLAN_KEY, plan);
      else localStorage.removeItem(PLAN_KEY);
    } catch {
      /* хранилище недоступно */
    }
  }, [plan, storageLoaded]);

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const loadDemo = () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    setRows(DEMO_ROWS.map((r) => ({ ...r, id: newId() })));
    toast.success("Загружен пример на 9 мероприятий");
  };

  const clearAll = () => {
    if (rows.length > 0 && !window.confirm("Удалить все мероприятия и справку? Действие необратимо.")) return;
    setRows([]);
    setReport("");
    setPlan("");
    setPlanSaved(false);
    toast.success("Данные очищены");
  };

  const generateReport = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    if (rows.length === 0) {
      toast.error("Добавьте хотя бы одно мероприятие");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Authorization": token } : {}),
        },
        body: JSON.stringify({
          action: "extracurricular_analysis",
          data: { rows: rows.map(({ id, ...rest }) => rest) },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось составить справку");
      setReport(data.content || "");
      toast.success("Аналитическая справка готова");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить справку");
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    if (rows.length === 0) {
      toast.error("Добавьте хотя бы одно мероприятие");
      return;
    }

    setPlanLoading(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "X-Authorization": token } : {}),
        },
        body: JSON.stringify({
          action: "extracurricular_plan",
          data: { rows: rows.map(({ id, ...rest }) => rest), period: planPeriod },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось составить план");
      setPlan(data.content || "");
      setPlanSaved(false);
      toast.success("План внеаудиторной деятельности готов");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить план");
    } finally {
      setPlanLoading(false);
    }
  };

  const savePlan = async () => {
    if (!user || !token) {
      setAuthOpen(true);
      return;
    }
    setPlanSaving(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({
          action: "save_material",
          type: "extracurricular_plan",
          title: `${planTitle}: ${planPeriod.toLowerCase()}`,
          content: plan,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось сохранить");
      setPlanSaved(true);
      toast.success("План сохранён в личном кабинете, вкладка «Материалы»");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить план");
    } finally {
      setPlanSaving(false);
    }
  };

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error("Нет данных для экспорта");
      return;
    }
    const header = "Учебный год;Дата;Дисциплина;Группа;Численность;Вид деятельности;Описание;Участники;% охвата";
    const body = rows.map((r) =>
      [r.year, r.date, r.subject, r.group, r.total, r.type, r.desc, r.participants, `${pct(r).toFixed(1)}%`].join(";")
    );
    const blob = new Blob(["\uFEFF" + [header, ...body].join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vneauditornaya-deyatelnost.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const exportBackup = () => {
    if (rows.length === 0) {
      toast.error("Нет данных для сохранения");
      return;
    }
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vneauditornaya-rezervnaya-kopiya.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Резервная копия сохранена");
  };

  const importBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) throw new Error();
        const restored: EventRow[] = parsed.map((r) => ({
          id: newId(),
          year: r.year || YEARS[1],
          date: r.date || "",
          subject: r.subject || "",
          group: r.group || "",
          total: Number(r.total) || 0,
          type: r.type || ACTIVITY_TYPES[0],
          desc: r.desc || "",
          participants: Number(r.participants) || 0,
        }));
        setRows(restored);
        toast.success(`Загружено мероприятий: ${restored.length}`);
      } catch {
        toast.error("Не удалось прочитать файл — нужен файл резервной копии");
      }
    };
    reader.readAsText(file);
  };

  const reportTitle = "Аналитическая справка о вовлечении обучающихся во внеаудиторную деятельность";
  const planTitle = "План внеаудиторной деятельности";

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

      <main className="flex-1">
        <div className="container py-6 sm:py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 no-print"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8 no-print">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">
              Вовлечение во внеаудиторную деятельность
            </h1>
            <p className="text-muted-foreground">
              Ведите учёт мероприятий, смотрите статистику охвата и получайте готовую аналитическую справку от ИИ.
            </p>
          </div>

          {!isPaid ? (
            <PaywallLock
              description="Учёт мероприятий, таблица, статистика и аналитическая справка — премиум-инструмент. Оформите подписку, чтобы открыть раздел без ограничений."
              loggedIn={!!user}
              onAction={() => (user ? setUpgradeOpen(true) : setAuthOpen(true))}
            />
          ) : (
          <Tabs defaultValue="input">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 h-auto gap-1 w-full max-w-2xl no-print">
              <TabsTrigger value="input" className="text-sm py-2">Ввод</TabsTrigger>
              <TabsTrigger value="table" className="text-sm py-2">Таблица</TabsTrigger>
              <TabsTrigger value="stats" className="text-sm py-2">Статистика</TabsTrigger>
              <TabsTrigger value="report" className="text-sm py-2">Справка</TabsTrigger>
            </TabsList>


            <TabsContent value="input" className="mt-6">
              <EventInputForm
                year={year}
                setYear={setYear}
                date={date}
                setDate={setDate}
                subject={subject}
                setSubject={setSubject}
                group={group}
                setGroup={setGroup}
                total={total}
                setTotal={setTotal}
                type={type}
                setType={setType}
                desc={desc}
                setDesc={setDesc}
                participants={participants}
                setParticipants={setParticipants}
                rowsCount={rows.length}
                onAdd={addRow}
                onLoadDemo={loadDemo}
                onClearAll={clearAll}
                onExportBackup={exportBackup}
                onImportBackup={importBackup}
              />
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <EventsTable rows={rows} onExportCsv={exportCsv} onRemove={removeRow} />
            </TabsContent>

            {/* ===== СТАТИСТИКА ===== */}
            <TabsContent value="stats" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
                <StatsPanel rows={rows} />
              </div>
            </TabsContent>


            <TabsContent value="report" className="mt-6">
              <ReportCard
                report={report}
                reportTitle={reportTitle}
                loading={loading}
                isPaid={isPaid}
                onGenerate={generateReport}
                onNeedAuth={() => setAuthOpen(true)}
              />
              <PlanCard
                plan={plan}
                planTitle={planTitle}
                planPeriod={planPeriod}
                setPlanPeriod={setPlanPeriod}
                periods={PLAN_PERIODS}
                planLoading={planLoading}
                planSaving={planSaving}
                planSaved={planSaved}
                onGenerate={generatePlan}
                onSave={savePlan}
              />
            </TabsContent>
          </Tabs>
          )}
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

export default ExtracurricularAnalytics;