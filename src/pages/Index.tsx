import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AutumnBanner from "@/components/AutumnBanner";
import NewsSection from "@/components/NewsSection";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import GeneratorsSection from "@/components/GeneratorsSection";
import NotebookCheck from "@/components/NotebookCheck";
import QualityAnalyticsPromo from "@/components/QualityAnalyticsPromo";
import PopularSections from "@/components/PopularSections";
import FeedbackSection from "@/components/FeedbackSection";
import Footer from "@/components/Footer";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import WisdomModal from "@/components/WisdomModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth, AUTH_URL } from "@/context/AuthContext";

const Index = () => {
  const { token, refresh } = useAuth();
  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [wisdomOpen, setWisdomOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    const timer = setTimeout(() => scrollTo(id), 150);
    return () => clearTimeout(timer);
  }, []);

  const openAuth = () => {
    setProfileOpen(false);
    setAuthOpen(true);
  };

  const openUpgrade = () => {
    setDecomposerOpen(false);
    setAntiplagiatOpen(false);
    setUpgradeOpen(true);
  };

  // Проверяем платёж при возврате с ЮКассы
  useEffect(() => {
    const pendingPayment = localStorage.getItem("urokai_pending_payment");
    if (!pendingPayment || !token) return;

    fetch(AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Authorization": token },
      body: JSON.stringify({ action: "check_payment", payment_id: pendingPayment }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.paid) {
          localStorage.removeItem("urokai_pending_payment");
          const w = window as unknown as { _tmr?: unknown[] };
          w._tmr = w._tmr || [];
          w._tmr.push({ type: "reachGoal", id: "3784935", goal: "Конверсия" });
          refresh();
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => scrollTo("notebook")}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={openAuth}
        onOpenPricing={() => setProfileOpen(true)}
      />

      <main className="flex-1">
        <div className="container flex justify-center pt-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Icon name="Sparkles" size={13} />
            3 бесплатные генерации на все инструменты
          </span>
        </div>
        <AutumnBanner />
        <NewsSection />
        <div className="container relative z-10 flex justify-center mb-4">
          <Button
            variant="outline"
            className="gap-2 rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10"
            onClick={() => setWisdomOpen(true)}
          >
            <Icon name="Lightbulb" size={16} className="text-primary" />
            Мудрая минутка
          </Button>
        </div>
        <PopularSections onScrollTo={scrollTo} />
        <Hero onScrollToGenerators={() => scrollTo("generators")} />
        <GeneratorsSection onNeedAuth={openAuth} />
        <NotebookCheck id="notebook" onNeedAuth={openAuth} onNeedUpgrade={openUpgrade} />
        <QualityAnalyticsPromo id="quality-analytics" />
        <FeedbackSection />
      </main>

      <Footer
        onOpenProfile={() => setProfileOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
      />

      <DecomposerModal
        open={decomposerOpen}
        onClose={() => setDecomposerOpen(false)}
        onNeedAuth={openAuth}
        onNeedUpgrade={openUpgrade}
      />
      <RandomizerModal open={randomizerOpen} onClose={() => setRandomizerOpen(false)} />
      <AntiplagiatModal
        open={antiplagiatOpen}
        onClose={() => setAntiplagiatOpen(false)}
        onNeedAuth={openAuth}
        onNeedUpgrade={openUpgrade}
      />
      <WisdomModal open={wisdomOpen} onClose={() => setWisdomOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={openAuth} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onNeedAuth={openAuth} />
    </div>
  );
};

export default Index;