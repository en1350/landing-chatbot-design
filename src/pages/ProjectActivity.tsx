import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { downloadDocx, downloadTxt } from "@/lib/download";
import { toast } from "sonner";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const ROWS_KEY = "urokai_project_activity_rows";
const REPORT_KEY = "urokai_project_activity_report";

const CATEGORIES = [
  "Проектная",
  "Исследовательская",
  "Научно-экспериментальная",
  "Инновационная",
  "Программно-методическая",
];
const LEVELS = ["Локальный", "Муниципальный", "Региональный", "Всероссийский", "Международный"];

interface ActivityRow {
  id: string;
  year: string;
  category: string;
  title: string;
  level: string;
  content: string;
  result: string;
}

const newId = () => Math.random().toString(36).slice(2, 10);

const DEMO_ROW: Omit<ActivityRow, "id"> = {
  year: "2024",
  category: CATEGORIES[0],
  title: "«Цифровая среда современного студенческого общежития»",
  level: "Региональный",
  content:
    "Разработка и внедрение концепции цифровизации быта и досуга обучающихся с использованием QR-кодов и интерактивных стендов.",
  result: "Диплом I степени на региональном конкурсе; внедрение в практику учреждения.",
};

const loadRows = (): ActivityRow[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ROWS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const emptyForm = { year: String(new Date().getFullYear()), category: CATEGORIES[0], title: "", level: LEVELS[0], content: "", result: "" };

const ProjectActivity = () => {
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [rows, setRows] = useState<ActivityRow[]>(loadRows);
  const [report, setReport] = useState(() => localStorage.getItem(REPORT_KEY) || "");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState("table");

  useEffect(() => {
    try {
      localStorage.setItem(ROWS_KEY, JSON.stringify(rows));
    } catch {
      /* хранилище недоступно */
    }
  }, [rows]);

  useEffect(() => {
    try {
      if (report) localStorage.setItem(REPORT_KEY, report);
      else localStorage.removeItem(REPORT_KEY);
    } catch {
      /* хранилище недоступно */
    }
  }, [report]);

  const setField = (k: keyof typeof emptyForm, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const addRow = () => {
    if (!form.title.trim()) {
      toast.error("Укажите название проекта или исследования");
      return;
    }
    setRows((prev) => [...prev, { id: newId(), ...form, title: form.title.trim(), content: form.content.trim(), result: form.result.trim() }]);
    setForm((p) => ({ ...emptyForm, year: p.year, category: p.category, level: p.level }));
    toast.success("Запись добавлена");
  };

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const loadDemo = () => {
    setRows((prev) => [...prev, { id: newId(), ...DEMO_ROW }]);
    toast.success("Добавлен пример заполнения");
  };

  const clearAll = () => {
    if (rows.length > 0 && !window.confirm("Удалить все записи и справку? Действие необратимо.")) return;
    setRows([]);
    setReport("");
  };

  const reportTitle = "Аналитическая справка о проектной и исследовательской деятельности";

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
      toast.error("Добавьте хотя бы одну запись");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({
          action: "project_activity_analysis",
          data: { rows: rows.map(({ id, ...rest }) => rest) },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось составить справку");
      setReport(data.content || "");
      setTab("report");
      toast.success("Аналитическая справка готова");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить справку");
    } finally {
      setLoading(false);
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
              Проектная и исследовательская деятельность
            </h1>
            <p className="text-muted-foreground">
              Заполните таблицу своих проектов, исследований и экспериментов и получите готовую аналитическую справку от ИИ.
            </p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-2 h-auto gap-1 w-full max-w-md no-print">
              <TabsTrigger value="table" className="text-sm py-2">Таблица</TabsTrigger>
              <TabsTrigger value="report" className="text-sm py-2">Справка</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-6 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm no-print">
                <h2 className="font-display text-lg font-bold mb-4">Добавить запись</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Input value={form.year} onChange={(e) => setField("year", e.target.value)} placeholder="Год" aria-label="Год" />
                  <Select value={form.category} onValueChange={(v) => setField("category", v)}>
                    <SelectTrigger aria-label="Направление"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.level} onValueChange={(v) => setField("level", v)}>
                    <SelectTrigger aria-label="Уровень"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input
                    className="sm:col-span-2 lg:col-span-4"
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="Название проекта, исследования, эксперимента"
                  />
                  <Textarea
                    className="sm:col-span-2"
                    value={form.content}
                    onChange={(e) => setField("content", e.target.value)}
                    placeholder="Содержание деятельности: этапы и методы работы"
                    rows={3}
                  />
                  <Textarea
                    className="sm:col-span-2"
                    value={form.result}
                    onChange={(e) => setField("result", e.target.value)}
                    placeholder="Результат: диплом, сертификат, публикация, акт внедрения"
                    rows={3}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button className="gap-2" onClick={addRow}>
                    <Icon name="Plus" size={16} />
                    Добавить
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={loadDemo}>
                    <Icon name="Lightbulb" size={16} />
                    Пример заполнения
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 no-print">
                  <h2 className="font-display text-lg font-bold">Записей: {rows.length}</h2>
                  <div className="flex flex-wrap gap-2">
                    <Button className="gap-1.5" onClick={generateReport} disabled={loading}>
                      {loading ? (
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
                    <Button variant="outline" className="gap-1.5" onClick={() => window.print()} disabled={rows.length === 0}>
                      <Icon name="Printer" size={15} />
                      Печать
                    </Button>
                    <Button variant="outline" className="gap-1.5" onClick={clearAll} disabled={rows.length === 0}>
                      <Icon name="Trash2" size={15} />
                      Очистить
                    </Button>
                  </div>
                </div>

                {rows.length === 0 ? (
                  <p className="py-10 text-center text-muted-foreground">Пока нет записей. Добавьте первую выше.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full min-w-[800px] text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="p-3 w-16">Год</th>
                          <th className="p-3">Направление</th>
                          <th className="p-3">Название</th>
                          <th className="p-3">Уровень</th>
                          <th className="p-3">Содержание</th>
                          <th className="p-3">Результат</th>
                          <th className="p-3 w-10 no-print" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id} className="border-t border-border align-top">
                            <td className="p-3">{r.year}</td>
                            <td className="p-3">{r.category}</td>
                            <td className="p-3 font-medium">{r.title}</td>
                            <td className="p-3">{r.level}</td>
                            <td className="p-3">{r.content}</td>
                            <td className="p-3">{r.result}</td>
                            <td className="p-3 no-print">
                              <button
                                onClick={() => removeRow(r.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                                aria-label="Удалить запись"
                              >
                                <Icon name="Trash2" size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="report" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
                <div className="flex flex-wrap gap-2 mb-4 no-print">
                  <Button className="gap-2" onClick={generateReport} disabled={loading}>
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
                    </>
                  )}
                </div>

                {!isPaid && (
                  <p className="mb-4 text-xs text-muted-foreground no-print">
                    ИИ-справка доступна по подписке. Таблица работает бесплатно.
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
            </TabsContent>
          </Tabs>
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

export default ProjectActivity;