import { useEffect, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Icon from "@/components/ui/icon";
import DecomposerModal from "@/components/DecomposerModal";
import RandomizerModal from "@/components/RandomizerModal";
import AntiplagiatModal from "@/components/AntiplagiatModal";
import ProfileSheet from "@/components/ProfileSheet";
import AuthModal from "@/components/AuthModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useAuth } from "@/context/AuthContext";
import { reachGoal } from "@/lib/metrika";
import CategoryGrid from "@/components/student-trainer-page/CategoryGrid";
import TrainerList from "@/components/student-trainer-page/TrainerList";
import TrainerView from "@/components/student-trainer-page/TrainerView";
import { CategoryKey, TrainerKey, TrainerItem, CATEGORIES, TRAINERS } from "@/components/student-trainer-page/trainerData";

/* ---------- Страница ---------- */

const StudentTrainer = () => {
  const { user, isPaid: planPaid, trainersUnlocked } = useAuth();
  const isPaid = planPaid || trainersUnlocked;
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const catParam = searchParams.get("cat");
  const trainerParam = searchParams.get("trainer");
  const [active, setActive] = useState<TrainerKey | null>(null);
  useEffect(() => {
    const found = CATEGORIES.find((c) => c.key === catParam);
    const direct = TRAINERS.find((t) => t.key === trainerParam);
    setCategory(found ? found.key : null);
    setActive(direct ? direct.key : null);
  }, [catParam, trainerParam]);
  const activeTrainer = TRAINERS.find((t) => t.key === active);
  const [decomposerOpen, setDecomposerOpen] = useState(false);
  const [randomizerOpen, setRandomizerOpen] = useState(false);
  const [antiplagiatOpen, setAntiplagiatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const openAuth = () => {
    setProfileOpen(false);
    setAuthOpen(true);
  };

  const openUpgrade = () => {
    setDecomposerOpen(false);
    setAntiplagiatOpen(false);
    setUpgradeOpen(true);
  };

  const handleSelect = (t: TrainerItem) => {
    if (t.paid && !isPaid) {
      user ? openUpgrade() : openAuth();
      return;
    }
    reachGoal("trainer_started", { trainer: t.key, title: t.title });
    setActive(t.key);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenNotebook={() => (window.location.href = "/#notebook")}
        onOpenDecomposer={() => setDecomposerOpen(true)}
        onOpenRandomizer={() => setRandomizerOpen(true)}
        onOpenAntiplagiat={() => setAntiplagiatOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAuth={openAuth}
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

          {!category && !active ? (
            <CategoryGrid setCategory={setCategory} />
          ) : !active ? (
            <TrainerList category={category} isPaid={isPaid} setCategory={setCategory} handleSelect={handleSelect} />
          ) : (
            <TrainerView
              active={active}
              activeTrainer={activeTrainer}
              category={category}
              trainerParam={trainerParam}
              isPaid={isPaid}
              user={user}
              setActive={setActive}
              setSearchParams={setSearchParams}
              openAuth={openAuth}
              openUpgrade={openUpgrade}
            />
          )}
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
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} onNeedAuth={openAuth} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} onNeedAuth={openAuth} />
    </div>
  );
};

export default StudentTrainer;