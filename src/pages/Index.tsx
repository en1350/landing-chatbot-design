import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import GeneratorsSection from "@/components/GeneratorsSection";
import NotebookCheck from "@/components/NotebookCheck";
import PricingSection from "@/components/PricingSection";
import Footer from "@/components/Footer";
import TrainerModal from "@/components/TrainerModal";
import DecomposerModal from "@/components/DecomposerModal";
import ProfileSheet from "@/components/ProfileSheet";

const Index = () => {
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

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
        <GeneratorsSection />
        <NotebookCheck id="notebook" />
        <PricingSection id="pricing" />
      </main>

      <Footer onOpenProfile={() => setProfileOpen(true)} />

      <TrainerModal open={trainerOpen} onClose={() => setTrainerOpen(false)} />
      <DecomposerModal open={decomposerOpen} onClose={() => setDecomposerOpen(false)} />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};

export default Index;
