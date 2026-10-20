import { usePersistedState } from "@/hooks/use-persisted-state";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth, AUTH_URL } from "@/context/AuthContext";
import OvzSelect from "@/components/OvzSelect";
import { toast } from "sonner";
import SavedPresentations from "@/components/presentation/SavedPresentations";
import {
  SavedPresentationMeta,
  parsePresentation,
  serializePresentation,
} from "@/components/presentation/savedPresentations";
import SlideView from "@/components/presentation/SlideView";
import ScaledSlide from "@/components/presentation/ScaledSlide";
import { exportPdf, exportPptx } from "@/components/presentation/exportPresentation";
import {
  PresentationData,
  SLIDE_COUNTS,
  STYLES,
  StyleKey,
  getTheme,
} from "@/components/presentation/presentationConfig";

const GENERATE_URL = "https://functions.poehali.dev/8dda2da8-746c-4e90-9562-b008e2c1a132";
const IMAGE_URL = "https://functions.poehali.dev/a7c1180e-adf0-4b4d-84f3-59bd9e9ce039";
const MAX_FILE_MB = 5;

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const readAsText = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });

const PresentationBuilder = () => {
  const { user, canUsePaid: isPaid, token } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [topic, setTopic] = usePersistedState("presentation_topic", "");
  const [style, setStyle] = usePersistedState<StyleKey>("presentation_style", "modern");
  const [slidesCount, setSlidesCount] = usePersistedState<number>("presentation_slidesCount", 10);
  const [sourceText, setSourceText] = usePersistedState("presentation_sourceText", "");
  const [fileName, setFileName] = usePersistedState("presentation_fileName", "");
  const [reading, setReading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ovz, setOvz] = useState<string[]>([]);
  const [withImages, setWithImages] = usePersistedState("presentation_withImages", true);
  const [imgBusy, setImgBusy] = useState<number[]>([]);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"" | "pdf" | "pptx">("");
  const [deck, setDeck] = useState<PresentationData | null>(null);
  const [deckStyle, setDeckStyle] = useState<StyleKey>("modern");

  const [savedId, setSavedId] = useState<number | null>(null);
  const [saved, setSaved] = useState<SavedPresentationMeta[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const lastSavedRef = useRef("");
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

  const loadSaved = useCallback(async () => {
    if (!token) {
      setSaved([]);
      return;
    }
    setLoadingList(true);
    try {
      const data = await authPost({ action: "list_materials" });
      setSaved((data.items || []).filter((m: { type: string }) => m.type === "presentation"));
    } catch {
      setSaved([]);
    } finally {
      setLoadingList(false);
    }
  }, [token, authPost]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const openSaved = useCallback(
    async (id: number) => {
      setOpeningId(id);
      try {
        const data = await authPost({ action: "get_material", id });
        const parsed = await parsePresentation(data.content || "");
        if (!parsed) throw new Error("Не удалось открыть презентацию");
        lastSavedRef.current = serializePresentation(parsed.deck, parsed.style);
        setDeck(parsed.deck);
        setDeckStyle(parsed.style);
        setStyle(parsed.style);
        setSavedId(id);
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Не удалось открыть презентацию");
      } finally {
        setOpeningId(null);
      }
    },
    [authPost]
  );

  useEffect(() => {
    const id = Number(searchParams.get("open"));
    if (id && token) {
      openSaved(id);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, token, openSaved, setSearchParams]);

  const renameSaved = async (id: number, title: string): Promise<boolean> => {
    try {
      await authPost({ action: "update_material", id, title });
      setSaved((list) => list.map((m) => (m.id === id ? { ...m, title } : m)));
      if (savedId === id) setDeck((d) => (d ? { ...d, title } : d));
      toast.success("Название изменено");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось переименовать");
      return false;
    }
  };

  const deleteSaved = async (id: number) => {
    try {
      await authPost({ action: "delete_material", id });
      setSaved((list) => list.filter((m) => m.id !== id));
      if (savedId === id) {
        setSavedId(null);
        setDeck(null);
      }
      toast.success("Презентация удалена");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось удалить");
    }
  };

  useEffect(() => {
    if (!deck || !savedId || imgBusy.length > 0) return;
    const content = serializePresentation(deck, deckStyle);
    if (content === lastSavedRef.current) return;
    const timer = setTimeout(async () => {
      try {
        await authPost({ action: "update_material", id: savedId, title: deck.title, content });
        lastSavedRef.current = content;
      } catch {
        /* повторим при следующем изменении */
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [deck, deckStyle, savedId, imgBusy.length, authPost]);

  const fileRef = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`Файл слишком большой — максимум ${MAX_FILE_MB} МБ`);
      return;
    }
    const ext = file.name.toLowerCase().split(".").pop() || "";
    if (!["txt", "pdf", "docx"].includes(ext)) {
      toast.error("Поддерживаются файлы TXT, DOCX и PDF");
      return;
    }
    setReading(true);
    try {
      let text = "";
      if (ext === "txt") {
        text = await readAsText(file);
      } else {
        const base64 = await readAsDataUrl(file);
        const res = await fetch(GENERATE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "extract_text", file_base64: base64, filename: file.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Не удалось прочитать файл");
        text = data.text;
      }
      if (!text.trim()) throw new Error("В файле не найден текст");
      setSourceText(text);
      setFileName(file.name);
      toast.success("Документ загружен — ИИ построит презентацию по нему");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось прочитать файл");
    } finally {
      setReading(false);
    }
  };

  const clearFile = () => {
    setSourceText("");
    setFileName("");
  };

  const generate = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    if (!topic.trim() && !sourceText) {
      toast.error("Укажите тему или загрузите документ");
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
          action: "presentation",
          fields: { topic, style, slidesCount, sourceText, ovz },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось составить презентацию");
      const deckTitle = data.title || topic || "Презентация";
      const newDeck: PresentationData = { title: deckTitle, slides: data.slides };
      setSavedId(null);
      setDeck(newDeck);
      setDeckStyle(style);
      toast.success("Презентация готова и сохранена в кабинете");
      if (withImages) {
        setLoading(false);
        void generateAllImages(data.slides, style, deckTitle);
      }
      try {
        const content = serializePresentation(newDeck, style);
        const saveRes = await authPost({ action: "save_material", type: "presentation", title: deckTitle, content });
        lastSavedRef.current = content;
        setSavedId(saveRes.id);
        loadSaved();
      } catch {
        toast.error("Не удалось сохранить презентацию в кабинет");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось составить презентацию");
    } finally {
      setLoading(false);
    }
  };

  const requestImage = async (hint: string, styleKey: StyleKey, deckTopic: string): Promise<{ image: string; cdn: string | null }> => {
    const res = await fetch(IMAGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
      body: JSON.stringify({ prompt: hint, style: styleKey, topic: deckTopic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Не удалось создать иллюстрацию");
    return { image: data.image as string, cdn: (data.cdn_url as string) || null };
  };

  const setSlideImage = (index: number, imageUrl: string, cdnUrl?: string) =>
    setDeck((d) => (d ? { ...d, slides: d.slides.map((sl, i) => (i === index ? { ...sl, imageUrl, cdnUrl } : sl)) } : d));

  const generateOneImage = async (index: number, hint: string, styleKey: StyleKey, deckTopic: string) => {
    setImgBusy((b) => [...b, index]);
    try {
      const { image, cdn } = await requestImage(hint, styleKey, deckTopic);
      setSlideImage(index, image, cdn || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось создать иллюстрацию");
    } finally {
      setImgBusy((b) => b.filter((x) => x !== index));
    }
  };

  const generateAllImages = async (slides: PresentationData["slides"], styleKey: StyleKey, deckTopic: string) => {
    const targets = slides.map((sl, i) => ({ sl, i })).filter(({ sl, i }) => sl.image && i !== 0 && i !== slides.length - 1);
    let next = 0;
    const worker = async () => {
      while (next < targets.length) {
        const { sl, i } = targets[next++];
        await generateOneImage(i, sl.image, styleKey, deckTopic);
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  };

  const REFINE_HINTS = ["Сделай проще", "Добавь пример", "Сократи текст", "Добавь вопросы для обсуждения"];

  const handleRefine = async () => {
    if (!deck) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    const instruction = refineText.trim();
    if (!instruction) return;

    setRefining(true);
    setRefineError(null);
    try {
      const res = await fetch(GENERATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({
          action: "presentation_refine",
          instruction,
          fields: {
            title: deck.title,
            style: deckStyle,
            ovz,
            slides: deck.slides.map(({ title, bullets, notes, image }) => ({ title, bullets, notes, image })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось доработать презентацию");

      const pool = deck.slides.filter((sl) => sl.imageUrl);
      const used = new Set<number>();
      const slides = (data.slides as PresentationData["slides"]).map((sl, i) => {
        const hint = (sl.image || "").trim();
        let idx = pool.findIndex((o, k) => !used.has(k) && hint && (o.image || "").trim() === hint);
        if (idx === -1) {
          const same = deck.slides[i];
          idx = same && same.imageUrl && (same.image || "").trim() === hint ? pool.indexOf(same) : -1;
          if (idx !== -1 && used.has(idx)) idx = -1;
        }
        if (idx === -1) return { ...sl, imageUrl: undefined, cdnUrl: undefined };
        used.add(idx);
        return { ...sl, imageUrl: pool[idx].imageUrl, cdnUrl: pool[idx].cdnUrl };
      });

      setDeck({ ...deck, slides });
      setRefineText("");
      setRefineOpen(false);
      toast.success("Презентация доработана");

      if (withImages) {
        const missing = slides
          .map((sl, i) => ({ sl, i }))
          .filter(({ sl, i }) => sl.image && !sl.imageUrl && i !== 0 && i !== slides.length - 1);
        let next = 0;
        const worker = async () => {
          while (next < missing.length) {
            const { sl, i } = missing[next++];
            await generateOneImage(i, sl.image, deckStyle, deck.title);
          }
        };
        void Promise.all([worker(), worker(), worker()]);
      }
    } catch (err) {
      setRefineError(err instanceof Error ? err.message : "Не удалось доработать презентацию");
    } finally {
      setRefining(false);
    }
  };

  const handleExport = async (kind: "pdf" | "pptx") => {
    if (!deck) return;
    setExporting(kind);
    try {
      if (kind === "pptx") await exportPptx(deck, getTheme(deckStyle));
      else if (exportRef.current) await exportPdf(deck, exportRef.current);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось скачать файл");
    } finally {
      setExporting("");
    }
  };

  const theme = getTheme(deckStyle);

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
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">Генератор презентаций</h1>
            <p className="text-muted-foreground">
              Укажите тему или загрузите документ — ИИ соберёт готовые слайды с заметками докладчика. Скачайте
              результат в PowerPoint или PDF.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Тема презентации</label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Например: Солнечная система" />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Документ с текстом (необязательно)</label>
                <input ref={fileRef} type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFile} />
                {fileName ? (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm">
                    <Icon name="FileText" size={16} className="text-primary shrink-0" />
                    <span className="flex-1 truncate">{fileName}</span>
                    <button type="button" onClick={clearFile} aria-label="Убрать файл" className="text-muted-foreground hover:text-foreground">
                      <Icon name="X" size={15} />
                    </button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={reading}>
                    {reading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Upload" size={16} />}
                    {reading ? "Читаю документ..." : "Загрузить TXT, DOCX или PDF"}
                  </Button>
                )}
                <p className="mt-1.5 text-xs text-muted-foreground">
                  ИИ построит слайды по тексту документа. Размер до {MAX_FILE_MB} МБ.
                </p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Стиль</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setStyle(s.key)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        style === s.key ? "border-primary bg-primary/10" : "border-border bg-muted/40 hover:bg-accent"
                      }`}
                    >
                      <div className="text-xl">{s.emoji}</div>
                      <div className="text-sm font-semibold mt-1 leading-tight">{s.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.hint}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-semibold mb-1.5">Количество слайдов</label>
                <div className="flex flex-wrap gap-2">
                  {SLIDE_COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSlidesCount(n)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                        slidesCount === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 border-border hover:bg-accent"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer">
                <input type="checkbox" checked={withImages} onChange={(e) => setWithImages(e.target.checked)} className="mt-0.5" />
                <span className="text-sm leading-snug">
                  <b>Создать иллюстрации ИИ</b>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Картинки появятся на слайдах по очереди, это займёт пару минут. Любую можно перегенерировать.
                  </span>
                </span>
              </label>

              <div className="mt-5">
                <OvzSelect value={ovz} onChange={setOvz} disabled={loading} />
              </div>

              <Button className="w-full mt-5 gap-2" onClick={generate} disabled={loading || reading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={17} className="animate-spin" />
                    ИИ создаёт презентацию...
                  </>
                ) : (
                  <>
                    <Icon name="Sparkles" size={17} />
                    Создать презентацию
                  </>
                )}
              </Button>
              {!isPaid && (
                <p className="mt-2 text-center text-xs text-muted-foreground">Генератор презентаций доступен по подписке.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm min-h-[20rem]">
              {!deck ? (
                <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center text-muted-foreground">
                  <div className="text-5xl mb-3">📊</div>
                  <p className="text-sm max-w-xs">Здесь появятся слайды. Заполните параметры слева и нажмите «Создать презентацию».</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="font-display text-lg font-bold leading-tight">{deck.title}</h2>
                      <p className="text-xs text-muted-foreground">
                        {deck.slides.length} слайдов · стиль «{theme.label}»
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button className="gap-1.5" onClick={() => handleExport("pptx")} disabled={!!exporting || imgBusy.length > 0}>
                        {exporting === "pptx" ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Presentation" size={15} />}
                        Скачать PPTX
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => setRefineOpen((v) => !v)}
                        disabled={imgBusy.length > 0}
                      >
                        <Icon name="Sparkles" size={15} />
                        Доработать с ИИ
                      </Button>
                      <Button variant="outline" className="gap-1.5" onClick={() => handleExport("pdf")} disabled={!!exporting || imgBusy.length > 0}>
                        {exporting === "pdf" ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="FileDown" size={15} />}
                        Скачать PDF
                      </Button>
                    </div>
                  </div>

                  {refineOpen && (
                    <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-2.5 animate-fade-in">
                      <label className="text-sm font-medium block">Что доработать или исправить?</label>
                      <Textarea
                        value={refineText}
                        onChange={(e) => setRefineText(e.target.value)}
                        placeholder="Например: сделай проще, добавь пример на слайд 3, сократи тезисы..."
                        rows={3}
                        disabled={refining}
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {REFINE_HINTS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            disabled={refining}
                            onClick={() => setRefineText(h)}
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
                            setRefineText("");
                            setRefineError(null);
                          }}
                        >
                          Отмена
                        </Button>
                        <Button size="sm" className="flex-1 gap-1.5" onClick={handleRefine} disabled={refining || !refineText.trim()}>
                          {refining ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Sparkles" size={15} />}
                          {refining ? "ИИ дорабатывает..." : "Применить"}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    {deck.slides.map((sl, i) => (
                      <div key={i}>
                        <ScaledSlide>
                          <SlideView slide={sl} index={i} total={deck.slides.length} deckTitle={deck.title} theme={theme} />
                        </ScaledSlide>
                        {sl.image && i !== 0 && i !== deck.slides.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-7 gap-1.5 px-2 text-xs"
                            disabled={imgBusy.includes(i)}
                            onClick={() => generateOneImage(i, sl.image, deckStyle, deck.title)}
                          >
                            {imgBusy.includes(i) ? (
                              <Icon name="Loader2" size={13} className="animate-spin" />
                            ) : (
                              <Icon name="ImagePlus" size={13} />
                            )}
                            {sl.imageUrl ? "Другая иллюстрация" : "Создать иллюстрацию"}
                          </Button>
                        )}
                        {sl.notes && (
                          <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
                            <b>Заметки:</b> {sl.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="container pb-10 md:pb-14 -mt-4">
          {user ? (
            <SavedPresentations
              items={saved}
              loading={loadingList}
              openingId={openingId}
              activeId={savedId}
              onOpen={openSaved}
              onDelete={deleteSaved}
              onRename={renameSaved}
            />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Войдите в личный кабинет, чтобы презентации сохранялись и были доступны позже.
            </div>
          )}
        </div>
      </main>

      {deck && (
        <div ref={exportRef} aria-hidden style={{ position: "fixed", left: -10000, top: 0, width: 960 }}>
          {deck.slides.map((sl, i) => (
            <div key={i} data-slide style={{ width: 960, height: 540 }}>
              <SlideView slide={sl} index={i} total={deck.slides.length} deckTitle={deck.title} theme={theme} />
            </div>
          ))}
        </div>
      )}

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

export default PresentationBuilder;
