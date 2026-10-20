import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import SaveMaterialButton from "@/components/SaveMaterialButton";
import { useAuth } from "@/context/AuthContext";
import { downloadDocx, downloadTxt } from "@/lib/download";
import { toast } from "sonner";
import RpdGeneralSection from "@/components/rpd/RpdGeneralSection";
import RpdContentSection from "@/components/rpd/RpdContentSection";
import RpdKtpSection from "@/components/rpd/RpdKtpSection";
import RpdAssessmentSection from "@/components/rpd/RpdAssessmentSection";
import RpdSupportSection from "@/components/rpd/RpdSupportSection";
import RpdInstruction from "@/components/rpd/RpdInstruction";
import RpdPreview from "@/components/rpd/RpdPreview";
import { RPD_TITLE, rpdToText } from "@/components/rpd/rpdText";
import { RpdData, emptyCompetency, emptyKtpRow, emptyRpd, mergeRpd } from "@/components/rpd/rpdConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";
const DRAFT_KEY = "urokai_rpd_draft";

type Part = "content" | "ktp" | "assessment" | "support";

const loadDraft = (): RpdData => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? mergeRpd(JSON.parse(raw)) : emptyRpd();
  } catch {
    return emptyRpd();
  }
};

const RpdBuilder = () => {
  const { user, canUsePaid: isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [data, setData] = useState<RpdData>(loadDraft);
  const [loadingPart, setLoadingPart] = useState<Part | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(DRAFT_KEY, JSON.stringify(data)), 500);
    return () => clearTimeout(t);
  }, [data]);

  const patch = (p: Partial<RpdData>) => setData((d) => ({ ...d, ...p }));

  const fileName = (ext: string) => `РПД_${data.disciplineName.trim() || "программа"}.${ext}`;

  const callAi = async (part: Part) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    if (!data.disciplineName.trim()) {
      toast.error("Укажите название дисциплины — без него ИИ не сможет составить раздел");
      return;
    }
    const compsText = data.competencies
      .filter((c) => c.code.trim() || c.text.trim())
      .map((c) => `${c.code} ${c.text}`.trim())
      .join("\n");

    setLoadingPart(part);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({ action: "rpd", part, fields: { ...data, competenciesText: compsText } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Не удалось составить раздел");

      if (part === "content") {
        setData((d) => ({
          ...d,
          goal: json.goal || d.goal,
          tasks: json.tasks || d.tasks,
          prereq: json.prereq || d.prereq,
          postreq: json.postreq || d.postreq,
          structure: json.structure || d.structure,
          competencies: json.competencies?.length
            ? json.competencies.map((c: { code: string; text: string; tool: string }) => emptyCompetency(c))
            : d.competencies,
        }));
        toast.success("Цель, задачи, компетенции и структура готовы — проверьте и отредактируйте");
      } else if (part === "ktp") {
        setData((d) => ({ ...d, ktp: json.rows.map((r: object) => emptyKtpRow(r)) }));
        toast.success("Календарно-тематический план готов");
      } else if (part === "support") {
        setData((d) => ({
          ...d,
          mainLit: json.mainLit || d.mainLit,
          addLit: json.addLit || d.addLit,
          eResources: json.eResources || d.eResources,
          software: json.software || d.software,
          infoSystems: json.infoSystems || d.infoSystems,
          materials: json.materials || d.materials,
        }));
        toast.success("Обеспечение составлено — проверьте источники и выходные данные");
      } else {
        setData((d) => ({
          ...d,
          currentControl: json.currentControl || d.currentControl,
          intermediateControl: json.intermediateControl || d.intermediateControl,
          criteria: json.criteria || d.criteria,
          sampleTasks: json.sampleTasks || d.sampleTasks,
          evalMethods: json.evalMethods || d.evalMethods,
        }));
        toast.success("Оценочные средства готовы — проверьте и отредактируйте");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить раздел");
    } finally {
      setLoadingPart(null);
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName("json");
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setData(mergeRpd(JSON.parse(String(reader.result))));
        toast.success("Программа импортирована");
      } catch {
        toast.error("Не удалось прочитать файл");
      }
    };
    reader.readAsText(file);
  };

  const clearAll = () => {
    if (!window.confirm("Очистить все поля программы?")) return;
    setData(emptyRpd());
  };

  const text = rpdToText(data);
  const docTitle = `${RPD_TITLE}${data.disciplineName.trim() ? `: ${data.disciplineName.trim()}` : ""}`;

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
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">Конструктор рабочих программ</h1>
            <p className="text-muted-foreground">
              Заполните сведения о дисциплине — ИИ составит цель, компетенции, структуру, календарно-тематический план и
              оценочные средства. Готовую программу можно скачать в Word, TXT, JSON или распечатать.
            </p>
            {!isPaid && <p className="text-xs text-muted-foreground mt-2">ИИ-составление разделов доступно по платной подписке.</p>}
          </div>

          <div className="no-print">
            <RpdInstruction />
            <RpdGeneralSection data={data} patch={patch} />
            <RpdContentSection data={data} patch={patch} aiLoading={loadingPart === "content"} onGenerate={() => callAi("content")} />
            <RpdKtpSection data={data} patch={patch} aiLoading={loadingPart === "ktp"} onGenerate={() => callAi("ktp")} />
            <RpdAssessmentSection data={data} patch={patch} aiLoading={loadingPart === "assessment"} onGenerate={() => callAi("assessment")} />
            <RpdSupportSection data={data} patch={patch} aiLoading={loadingPart === "support"} onGenerate={() => callAi("support")} />
          </div>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
            <h2 className="font-display text-lg font-bold mb-4 no-print">Готовая программа</h2>
            <div className="flex flex-wrap gap-2 mb-5 no-print">
              <Button className="gap-1.5" onClick={() => downloadDocx(fileName("docx"), docTitle, text)}>
                <Icon name="FileText" size={15} />
                Скачать Word
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => downloadTxt(fileName("txt"), [docTitle, "", text])}>
                <Icon name="Download" size={15} />
                TXT
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => window.print()}>
                <Icon name="Printer" size={15} />
                Печать / PDF
              </Button>
              <SaveMaterialButton type="rpd" title={docTitle} content={text} onNeedAuth={() => setAuthOpen(true)} />
              <Button variant="outline" className="gap-1.5" onClick={exportJson}>
                <Icon name="FileJson" size={15} />
                Экспорт JSON
              </Button>
              <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importJson} />
              <Button variant="outline" className="gap-1.5" onClick={() => importRef.current?.click()}>
                <Icon name="Upload" size={15} />
                Импорт JSON
              </Button>
              <Button variant="outline" className="gap-1.5 text-destructive" onClick={clearAll}>
                <Icon name="Trash2" size={15} />
                Очистить всё
              </Button>
            </div>
            <RpdPreview data={data} />
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

export default RpdBuilder;
