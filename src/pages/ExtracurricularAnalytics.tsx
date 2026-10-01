import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import StatsPanel from "@/components/extracurricular/StatsPanel";
import { EventRow, YEARS, ACTIVITY_TYPES, DEMO_ROWS, pct, levelOf } from "@/components/extracurricular/types";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";

const newId = () => Math.random().toString(36).slice(2, 10);

const STORAGE_KEY = "urokai_extracurricular_rows";
const REPORT_KEY = "urokai_extracurricular_report";

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
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [rows, setRows] = useState<EventRow[]>(loadStoredRows);
  const [report, setReport] = useState(() => localStorage.getItem(REPORT_KEY) || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      /* хранилище переполнено или недоступно */
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

  const removeRow = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));

  const loadDemo = () => {
    setRows(DEMO_ROWS.map((r) => ({ ...r, id: newId() })));
    toast.success("Загружен пример на 9 мероприятий");
  };

  const clearAll = () => {
    if (rows.length > 0 && !window.confirm("Удалить все мероприятия и справку? Действие необратимо.")) return;
    setRows([]);
    setReport("");
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

  const levelClass = (p: number) => {
    const l = levelOf(p);
    return l === "high" ? "text-emerald-600" : l === "mid" ? "text-amber-600" : "text-destructive";
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
        <div className="container py-10 md:py-14">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 no-print"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8 no-print">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">
              Вовлечение во внеаудиторную деятельность
            </h1>
            <p className="text-muted-foreground">
              Ведите учёт мероприятий, смотрите статистику охвата и получайте готовую аналитическую справку от ИИ.
            </p>
          </div>

          <Tabs defaultValue="input">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl no-print">
              <TabsTrigger value="input" className="text-xs sm:text-sm">Ввод</TabsTrigger>
              <TabsTrigger value="table" className="text-xs sm:text-sm">Таблица</TabsTrigger>
              <TabsTrigger value="stats" className="text-xs sm:text-sm">Статистика</TabsTrigger>
              <TabsTrigger value="report" className="text-xs sm:text-sm">Справка</TabsTrigger>
            </TabsList>

            {/* ===== ВВОД ===== */}
            <TabsContent value="input" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <h2 className="font-display text-lg font-bold mb-4">Добавить мероприятие</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Учебный год</label>
                    <Select value={year} onValueChange={setYear}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {YEARS.map((y) => (
                          <SelectItem key={y} value={y}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Дата</label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Вид деятельности</label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-semibold mb-1.5">Наименование УД / МДК / ПМ / практики</label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Например: Основы реабилитации" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Группа</label>
                    <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Например: 234" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Численность группы</label>
                    <Input type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="24" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Участников</label>
                    <Input type="number" min={0} value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="18" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-semibold mb-1.5">Описание мероприятия</label>
                    <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Например: мастер-класс «СЛР»" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-5">
                  <Button className="gap-2" onClick={addRow}>
                    <Icon name="Plus" size={16} />
                    Добавить
                  </Button>
                  <Button variant="outline" className="gap-2" onClick={loadDemo}>
                    <Icon name="Sparkles" size={16} />
                    Загрузить пример
                  </Button>
                  <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={clearAll}>
                    <Icon name="Trash2" size={16} />
                    Очистить всё
                  </Button>
                </div>

                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Icon name="Save" size={16} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Таблица сохраняется автоматически в этом браузере
                      {rows.length > 0 && <> — сейчас записей: <b className="text-foreground">{rows.length}</b></>}.
                      Чтобы перенести данные на другой компьютер, сделайте резервную копию.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={exportBackup}>
                      <Icon name="HardDriveDownload" size={15} />
                      Сохранить копию
                    </Button>
                    <label className="inline-flex">
                      <input
                        type="file"
                        accept="application/json,.json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) importBackup(f);
                          e.target.value = "";
                        }}
                      />
                      <span className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent transition-colors">
                        <Icon name="HardDriveUpload" size={15} />
                        Восстановить из копии
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ===== ТАБЛИЦА ===== */}
            <TabsContent value="table" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <div className="flex flex-wrap gap-2 mb-4 no-print">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
                    <Icon name="FileSpreadsheet" size={15} />
                    Экспорт CSV
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
                    <Icon name="Printer" size={15} />
                    Печать
                  </Button>
                </div>

                {rows.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">
                    Данных пока нет — добавьте мероприятия на вкладке «Ввод»
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
                          {["№", "Год", "Дата", "Дисциплина", "Группа", "Чел.", "Вид", "Описание", "Уч.", "%", ""].map((h) => (
                            <th key={h} className="px-2.5 py-2.5 text-left font-semibold whitespace-nowrap first:rounded-l-lg last:rounded-r-lg">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, i) => {
                          const p = pct(r);
                          return (
                            <tr key={r.id} className="border-b border-border hover:bg-accent/40 transition-colors">
                              <td className="px-2.5 py-2">{i + 1}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap">{r.year}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap">
                                {r.date ? new Date(r.date).toLocaleDateString("ru-RU") : "—"}
                              </td>
                              <td className="px-2.5 py-2 min-w-[180px]">{r.subject}</td>
                              <td className="px-2.5 py-2">{r.group}</td>
                              <td className="px-2.5 py-2">{r.total}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap">{r.type}</td>
                              <td className="px-2.5 py-2 min-w-[160px]">{r.desc || "—"}</td>
                              <td className="px-2.5 py-2">{r.participants}</td>
                              <td className={`px-2.5 py-2 font-bold ${levelClass(p)}`}>{p.toFixed(1)}%</td>
                              <td className="px-2.5 py-2 no-print">
                                <button
                                  onClick={() => removeRow(r.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Icon name="X" size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ===== СТАТИСТИКА ===== */}
            <TabsContent value="stats" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
                <StatsPanel rows={rows} />
              </div>
            </TabsContent>

            {/* ===== СПРАВКА ===== */}
            <TabsContent value="report" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
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
                    ИИ-справка доступна по подписке. Учёт, таблица и статистика работают бесплатно.
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

export default ExtracurricularAnalytics;