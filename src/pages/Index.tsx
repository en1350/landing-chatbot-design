import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import AutumnBanner from "@/components/AutumnBanner";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import GeneratorsSection from "@/components/GeneratorsSection";
import NotebookCheck from "@/components/NotebookCheck";
import QualityAnalyticsPromo from "@/components/QualityAnalyticsPromo";
import PricingSection from "@/components/PricingSection";
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
        onOpenPricing={() => scrollTo("pricing")}
      />

      <main className="flex-1">
        <AutumnBanner onScrollToGenerators={() => scrollTo("generators")} />
        <div className="container relative z-10 flex justify-center -mb-4 md:-mb-8">
          <Button
            variant="outline"
            className="gap-2 rounded-full border-primary/30 bg-primary/5 hover:bg-primary/10"
            onClick={() => setWisdomOpen(true)}
          >
            <Icon name="Lightbulb" size={16} className="text-primary" />
            Мудрая минутка
          </Button>
        </div>
        <Hero onScrollToGenerators={() => scrollTo("generators")} />
        <GeneratorsSection onNeedAuth={openAuth} />
        <NotebookCheck id="notebook" onNeedAuth={openAuth} onNeedUpgrade={openUpgrade} />
        <QualityAnalyticsPromo id="quality-analytics" />
        <PricingSection id="pricing" onNeedAuth={openAuth} />
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