import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import { filledRows, matrixProf, matrixToText } from "@/lib/techMatrixExport";
import { DOC_TITLE, MatrixData, TechRow, emptyMatrix } from "@/components/tech-matrix/techMatrixConfig";
import { toast } from "sonner";
import TechMatrixPassport from "@/components/tech-matrix/TechMatrixPassport";
import TechMatrixTable from "@/components/tech-matrix/TechMatrixTable";
import TechMatrixReport from "@/components/tech-matrix/TechMatrixReport";
import TechMatrixReference from "@/components/tech-matrix/TechMatrixReference";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";
const DRAFT_KEY = "urokai_tech_matrix_draft";

const loadDraft = (): MatrixData => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return emptyMatrix();
    const parsed = JSON.parse(raw) as MatrixData;
    const base = emptyMatrix();
    return {
      ...base,
      subject: parsed.subject || "",
      prof: parsed.prof || "",
      profOther: parsed.profOther || "",
      region: parsed.region || "",
      fgos: { ...base.fgos, ...(parsed.fgos || {}) },
      rows: parsed.rows && parsed.rows.length ? parsed.rows : base.rows,
    };
  } catch {
    return emptyMatrix();
  }
};

const TechMatrix = () => {
  const { user, canUsePaid: isPaid, token } = useAuth();

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
  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

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
          prof: matrixProf(data),
          region: data.region,
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

  const generateReport = async () => {
    if (!requirePaid()) return;
    const rows = filledRows(data.rows);
    if (rows.length === 0) {
      toast.error("Заполните хотя бы одну строку матрицы");
      return;
    }
    setReportLoading(true);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({
          action: "tech_matrix_analysis",
          data: {
            subject: data.subject,
            prof: matrixProf(data),
            region: data.region,
            fgos: data.fgos,
            rows,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось составить справку");
      setReport(json.content || "");
      toast.success("Аналитическая справка готова");
      setTimeout(() => document.getElementById("tech-report")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить справку");
    } finally {
      setReportLoading(false);
    }
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

          <TechMatrixPassport data={data} patch={patch} patchFgos={patchFgos} />

          <TechMatrixTable
            data={data}
            isPaid={isPaid}
            aiCount={aiCount}
            setAiCount={setAiCount}
            aiLoading={aiLoading}
            saving={saving}
            saved={saved}
            reportLoading={reportLoading}
            filledCount={filledCount}
            suggest={suggest}
            fillNames={fillNames}
            updateRow={updateRow}
            removeRow={removeRow}
            addRow={addRow}
            save={save}
            ensureRows={ensureRows}
            generateReport={generateReport}
          />

          {report && <TechMatrixReport report={report} subject={data.subject} onNeedAuth={() => setAuthOpen(true)} />}

          <TechMatrixReference showRef={showRef} onToggle={() => setShowRef((v) => !v)} addRow={addRow} />
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
