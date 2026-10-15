import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
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
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { downloadDocx } from "@/lib/download";
import {
  downloadMatrixCsv,
  downloadMatrixExcel,
  filledRows,
  matrixProf,
  matrixToText,
} from "@/lib/techMatrixExport";
import {
  FGOS_LEVELS,
  MatrixData,
  PROF_OPTIONS,
  PROF_OTHER,
  TECH_REFERENCE,
  TechRow,
  emptyMatrix,
} from "@/components/tech-matrix/techMatrixConfig";
import { toast } from "sonner";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";
const DRAFT_KEY = "urokai_tech_matrix_draft";
const DOC_TITLE = "Матрица используемых технологий обучения";

const loadDraft = (): MatrixData => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyMatrix();
    const parsed = JSON.parse(raw) as MatrixData;
    const base = emptyMatrix();
    return {
      ...base,
      ...parsed,
      fgos: { ...base.fgos, ...(parsed.fgos || {}) },
      rows: parsed.rows && parsed.rows.length ? parsed.rows : base.rows,
    };
  } catch {
    return emptyMatrix();
  }
};

const TechMatrix = () => {
  const { user, isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [data, setData] = useState<MatrixData>(loadDraft);
  const [aiCount, setAiCount] = useState("5");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showRef, setShowRef] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(data)), 500);
    return () => clearTimeout(t);
  }, [data]);

  const patch = (p: Partial<MatrixData>) => {
    setSaved(false);
    setData((d) => ({ ...d, ...p }));
  };
  const patchFgos = (p: Partial<MatrixData["fgos"]>) => {
    setSaved(false);
    setData((d) => ({ ...d, fgos: { ...d.fgos, ...p } }));
  };
  const setRows = (rows: TechRow[]) => patch({ rows: rows.length ? rows : [{ t: "", o: "", r: "" }] });
  const updateRow = (i: number, p: Partial<TechRow>) =>
    setRows(data.rows.map((r, idx) => (idx === i ? { ...r, ...p } : r)));
  const removeRow = (i: number) => setRows(data.rows.filter((_, idx) => idx !== i));
  const addRow = (row: TechRow = { t: "", o: "", r: "" }) => {
    const onlyEmpty = data.rows.length === 1 && !data.rows[0].t && !data.rows[0].o && !data.rows[0].r;
    setRows(onlyEmpty ? [row] : [...data.rows, row]);
  };

  const requirePaid = () => {
    if (!user) {
      setAuthOpen(true);
      return false;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return false;
    }
    return true;
  };

  const callAi = async (technologies: string[], count: number) => {
    const res = await fetch(GENERATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
      body: JSON.stringify({
        action: "tech_matrix",
        data: {
          subject: data.subject,
          org: data.org,
          prof: matrixProf(data),
          course: data.course,
          fgos: data.fgos,
          technologies,
          count,
        },
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Не удалось заполнить матрицу");
    return (json.rows || []) as TechRow[];
  };

  const requireSubject = () => {
    if (!data.subject.trim()) {
      toast.error("Укажите дисциплину, МДК или модуль — без неё ИИ не сможет подобрать технологии");
      return false;
    }
    return true;
  };

  const suggest = async () => {
    if (!requirePaid() || !requireSubject()) return;
    setAiLoading(true);
    try {
      const rows = await callAi([], Number(aiCount));
      if (!rows.length) throw new Error("ИИ не вернул технологий, попробуйте снова");
      const kept = filledRows(data.rows);
      setRows([...kept, ...rows]);
      toast.success(`ИИ добавил технологий: ${rows.length}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось подобрать технологии");
    } finally {
      setAiLoading(false);
    }
  };

  const fillNames = async () => {
    if (!requirePaid() || !requireSubject()) return;
    const names = data.rows.filter((r) => r.t.trim()).map((r) => r.t.trim());
    if (!names.length) {
      toast.error("Впишите названия технологий в первый столбец — ИИ заполнит остальное");
      return;
    }
    setAiLoading(true);
    try {
      const rows = await callAi(names, names.length);
      const byName = new Map(rows.map((r) => [r.t.trim().toLowerCase(), r]));
      setRows(
        data.rows.map((r) => {
          const found = byName.get(r.t.trim().toLowerCase());
          if (!found) return r;
          return { t: r.t, o: found.o || r.o, r: found.r || r.r };
        }),
      );
      toast.success("ИИ заполнил обоснование и результативность");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось заполнить матрицу");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!user || !token) {
      setAuthOpen(true);
      return;
    }
    if (!filledRows(data.rows).length) {
      toast.error("Добавьте хотя бы одну заполненную строку матрицы");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Authorization": token },
        body: JSON.stringify({
          action: "save_material",
          type: "tech_matrix",
          title: `${DOC_TITLE}${data.subject ? `: ${data.subject}` : ""}`,
          content: matrixToText(data),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось сохранить");
      setSaved(true);
      toast.success("Матрица сохранена в личном кабинете, вкладка «Материалы»");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить матрицу");
    } finally {
      setSaving(false);
    }
  };

  const ensureRows = () => {
    if (!filledRows(data.rows).length) {
      toast.error("Матрица пуста");
      return false;
    }
    return true;
  };

  const profSelectValue = PROF_OPTIONS.includes(data.prof) || data.prof === PROF_OTHER ? data.prof : data.prof ? PROF_OTHER : "";
  const filledCount = filledRows(data.rows).length;

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
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">{DOC_TITLE}</h1>
            <p className="text-muted-foreground">
              Заполните паспорт разработки, а ИИ подберёт технологии и составит обоснование и результативность.
              Готовую матрицу можно скачать в Excel, Word или сохранить в кабинет.
            </p>
          </div>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6 no-print">
            <h2 className="font-display text-lg font-bold mb-1">1. Паспорт разработки</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Эти данные попадают в файл и помогают ИИ точнее подобрать технологии.
            </p>
            <div className="grid gap-4 md:grid-cols-6">
              <div className="md:col-span-3">
                <label className="text-sm font-medium mb-1.5 block">Название документа</label>
                <Input
                  value={data.docTitle}
                  onChange={(e) => patch({ docTitle: e.target.value })}
                  placeholder="Матрица технологий обучения по дисциплине …"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Преподаватель (ФИО)</label>
                <Input
                  value={data.author}
                  onChange={(e) => patch({ author: e.target.value })}
                  placeholder="Иванова Елена Петровна"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm font-medium mb-1.5 block">Дата</label>
                <Input type="date" value={data.date} onChange={(e) => patch({ date: e.target.value })} />
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-medium mb-1.5 block">Образовательная организация</label>
                <Input
                  value={data.org}
                  onChange={(e) => patch({ org: e.target.value })}
                  placeholder="ГБПОУ «…», специальность / профессия"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-sm font-medium mb-1.5 block">Дисциплина, МДК или модуль</label>
                <Input
                  value={data.subject}
                  onChange={(e) => patch({ subject: e.target.value })}
                  placeholder="Например: МДК 02.01. Технология приготовления пищи"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-sm font-medium mb-1.5 block">Профессиональная направленность</label>
                <Select
                  value={profSelectValue}
                  onValueChange={(v) => patch({ prof: v === PROF_OTHER ? PROF_OTHER : v, profOther: "" })}
                >
                  <SelectTrigger aria-label="Профессиональная направленность">
                    <SelectValue placeholder="Выберите направленность" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...PROF_OPTIONS, PROF_OTHER].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {profSelectValue === PROF_OTHER && (
                <div className="md:col-span-3">
                  <label className="text-sm font-medium mb-1.5 block">Укажите направленность</label>
                  <Input
                    value={data.profOther}
                    onChange={(e) => patch({ profOther: e.target.value })}
                    placeholder="Своя формулировка"
                  />
                </div>
              )}
              <div className="md:col-span-3">
                <label className="text-sm font-medium mb-1.5 block">Курс / группа</label>
                <Input
                  value={data.course}
                  onChange={(e) => patch({ course: e.target.value })}
                  placeholder="2 курс, гр. ТС-21"
                />
              </div>

              <div className="md:col-span-6">
                <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 cursor-pointer">
                  <Checkbox
                    checked={data.fgos.on}
                    onCheckedChange={(v) => patchFgos({ on: v === true })}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="text-sm font-semibold block">Учитывать требования ФГОС СПО</span>
                    <span className="text-xs text-muted-foreground">
                      Откроются поля для кода специальности и компетенций. ИИ сошлётся на них в обосновании.
                    </span>
                  </span>
                </label>
              </div>

              {data.fgos.on && (
                <>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium mb-1.5 block">Код и наименование профессии / специальности</label>
                    <Input
                      value={data.fgos.code}
                      onChange={(e) => patchFgos({ code: e.target.value })}
                      placeholder="43.02.11 Гостиничный сервис"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium mb-1.5 block">Уровень СПО</label>
                    <Select value={data.fgos.level} onValueChange={(v) => patchFgos({ level: v })}>
                      <SelectTrigger aria-label="Уровень СПО">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FGOS_LEVELS.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium mb-1.5 block">Реквизиты ФГОС (приказ)</label>
                    <Input
                      value={data.fgos.order}
                      onChange={(e) => patchFgos({ order: e.target.value })}
                      placeholder="Приказ Минпросвещения РФ от … № …"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium mb-1.5 block">Формируемые компетенции (ОК / ПК)</label>
                    <Input
                      value={data.fgos.komps}
                      onChange={(e) => patchFgos({ komps: e.target.value })}
                      placeholder="ОК 01–09; ПК 2.1, ПК 2.4"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <label className="text-sm font-medium mb-1.5 block">Учтённые требования ФГОС СПО</label>
                    <Textarea
                      value={data.fgos.req}
                      onChange={(e) => patchFgos({ req: e.target.value })}
                      rows={2}
                      placeholder="Практико-ориентированность, модульная организация, демонстрационный экзамен, ВОСР"
                    />
                  </div>
                </>
              )}
            </div>
          </section>

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
                onClick={() => ensureRows() && downloadDocx(data.docTitle || DOC_TITLE, data.docTitle || DOC_TITLE, matrixToText(data))}
              >
                <Icon name="FileText" size={15} />
                Скачать Word
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
                <Icon name="Printer" size={15} />
                Печать / PDF
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm no-print">
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setShowRef((v) => !v)}
            >
              <span className="font-display text-lg font-bold">3. Справочник готовых формулировок</span>
              <Icon name={showRef ? "ChevronUp" : "ChevronDown"} size={18} />
            </button>
            {showRef && (
              <div className="mt-4 space-y-3">
                {TECH_REFERENCE.map((ref) => (
                  <div key={ref.t} className="rounded-xl border border-border p-4">
                    <p className="font-semibold text-primary">{ref.t}</p>
                    <p className="text-sm mt-2">
                      <span className="font-semibold">Обоснование:</span> {ref.o}
                    </p>
                    <p className="text-sm mt-1.5">
                      <span className="font-semibold">Результативность:</span> {ref.r}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 gap-1.5"
                      onClick={() => {
                        addRow(ref);
                        toast.success("Строка добавлена в матрицу");
                      }}
                    >
                      <Icon name="Plus" size={14} />
                      Вставить в матрицу
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
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

export default TechMatrix;
