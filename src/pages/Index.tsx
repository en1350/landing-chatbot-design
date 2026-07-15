import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import GeneratorsSection from "@/components/GeneratorsSection";
import NotebookCheck from "@/components/NotebookCheck";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import TrainerModal from "@/components/TrainerModal";
import DecomposerModal from "@/components/DecomposerModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import { useAuth, AUTH_URL } from "@/context/AuthContext";

const Index = () => {
  const { token, refresh } = useAuth();
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const openAuth = () => {
    setProfileOpen(false);
    setAuthOpen(true);
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
        onOpenTrainer={() => setTrainerOpen(true)}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenPricing={() => scrollTo("pricing")}
      />

      <main className="flex-1">
        <Hero onScrollToGenerators={() => scrollTo("generators")} />
        <GeneratorsSection onNeedAuth={openAuth} />
        <NotebookCheck id="notebook" />
        <PricingSection id="pricing" onNeedAuth={openAuth} />
      </main>

      <Footer onOpenProfile={() => setProfileOpen(true)} />

      <TrainerModal open={trainerOpen} onClose={() => setTrainerOpen(false)} />
      <DecomposerModal open={decomposerOpen} onClose={() => setDecomposerOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={openAuth} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
};

export default Index;
