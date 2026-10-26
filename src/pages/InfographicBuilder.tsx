import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { toast } from "sonner";

const INFOGRAPHIC_URL = "https://functions.poehali.dev/a616ea0e-b15f-46c4-8b96-8fbf655de7f6";

const SUBJECTS = [
  "Математика",
  "Русский язык",
  "Литература",
  "История",
  "Обществознание",
  "География",
  "Биология",
  "Химия",
  "Физика",
  "Информатика",
  "Английский язык",
  "ОБЖ",
  "Экономика",
  "Право",
];

const STYLES = [
  { value: "flat", label: "Плоский, современный" },
  { value: "colorful", label: "Яркий, красочный" },
  { value: "minimal", label: "Минимализм" },
  { value: "school", label: "Школьный плакат" },
  { value: "isometric", label: "Изометрия 3D" },
  { value: "scheme", label: "Схема со стрелками" },
];

const InfographicBuilder = () => {
  const { canUsePaid: isPaid, token, user } = useAuth();

  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const [subject, setSubject] = usePersistedState("infographic_subject", "");
  const [topic, setTopic] = usePersistedState("infographic_topic", "");
  const [style, setStyle] = usePersistedState("infographic_style", "flat");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!isPaid) {
      setUpgradeOpen(true);
      return;
    }
    if (!subject || !topic.trim()) {
      toast.error("Выберите дисциплину и укажите тему");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(INFOGRAPHIC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "X-Authorization": token } : {}) },
        body: JSON.stringify({ subject, topic: topic.trim(), style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Не удалось создать инфографику");
      setImage(data.cdn_url || data.image);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать инфографику");
    } finally {
      setLoading(false);
    }
  };

  const download = async () => {
    if (!image) return;
    const blob = await (await fetch(image)).blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infographic-${topic.trim().slice(0, 30) || "image"}.png`;
    a.click();
    URL.revokeObjectURL(url);
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
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <Icon name="ArrowLeft" size={15} />
            На главную
          </Link>

          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-coral">Для педагога</span>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mt-2 mb-3">Генератор инфографики</h1>
            <p className="text-muted-foreground">
              Выберите дисциплину, укажите тему и стиль — ИИ нарисует наглядную инфографику для урока или презентации.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Дисциплина</label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите дисциплину" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Тема</label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  maxLength={200}
                  placeholder="Например: Строение клетки"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5">Стиль</label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите стиль" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={generate} disabled={loading} className="w-full">
                <Icon name={loading ? "Loader" : "Sparkles"} size={16} className={loading ? "animate-spin" : ""} />
                {loading ? "Создаю инфографику..." : "Создать инфографику"}
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm min-h-[20rem] flex flex-col items-center justify-center">
              {loading ? (
                <div className="text-center text-muted-foreground">
                  <Icon name="Loader" size={32} className="animate-spin mx-auto mb-3" />
                  Рисую инфографику, это займёт до минуты
                </div>
              ) : image ? (
                <div className="w-full space-y-4">
                  <img src={image} alt={`Инфографика: ${topic}`} className="w-full max-w-xl mx-auto rounded-xl border border-border" />
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={download}>
                      <Icon name="Download" size={16} />
                      Скачать
                    </Button>
                    <Button variant="outline" onClick={generate}>
                      <Icon name="RefreshCw" size={16} />
                      Другой вариант
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Icon name="ImagePlus" size={36} className="mx-auto mb-3 opacity-60" />
                  Здесь появится готовая инфографика
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

      <DecomposerModal open={decomposerOpen} onClose={() => setDecomposerOpen(false)} onNeedAuth={() => { setDecomposerOpen(false); setAuthOpen(true); }} onNeedUpgrade={() => { setDecomposerOpen(false); setUpgradeOpen(true); }} />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal open={antiplagiatOpen} onClose={() => setAntiplagiatOpen(false)} onNeedAuth={() => { setAntiplagiatOpen(false); setAuthOpen(true); }} onNeedUpgrade={() => { setAntiplagiatOpen(false); setUpgradeOpen(true); }} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={() => { setProfileOpen(false); setAuthOpen(true); }} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onNeedAuth={() => { setUpgradeOpen(false); setAuthOpen(true); }} />
    </div>
  );
};

export default InfographicBuilder;
