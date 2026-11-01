import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import AlgorithmsTask from "@/components/student-trainer/AlgorithmsTask";
import BackwardsAnalysisTask from "@/components/student-trainer/BackwardsAnalysisTask";
import NetworkProtocolsTask from "@/components/student-trainer/NetworkProtocolsTask";
import TrainerFullscreen from "@/components/student-trainer/TrainerFullscreen";
import { CategoryKey, TrainerKey, TrainerItem, TRAINERS, IFRAME_SRC, ASSET_VERSION } from "./trainerData";

interface TrainerViewProps {
  active: TrainerKey;
  activeTrainer: TrainerItem | undefined;
  category: CategoryKey | null;
  trainerParam: string | null;
  isPaid: boolean;
  user: unknown;
  setActive: (k: TrainerKey | null) => void;
  setSearchParams: (p: Record<string, string>) => void;
  openAuth: () => void;
  openUpgrade: () => void;
}

const TrainerView = ({
  active,
  activeTrainer,
  category,
  trainerParam,
  isPaid,
  user,
  setActive,
  setSearchParams,
  openAuth,
  openUpgrade,
}: TrainerViewProps) => {
  return (
    <>
      <button
        onClick={() => {
          setActive(null);
          if (trainerParam) setSearchParams({});
        }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <Icon name="ArrowLeft" size={15} />
        {category ? "Назад к разделу" : "Ко всем разделам"}
      </button>

      <div className="max-w-2xl mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2.5">
          <span className="text-2xl">{TRAINERS.find((t) => t.key === active)?.icon}</span>
          {TRAINERS.find((t) => t.key === active)?.title}
        </h1>
      </div>

      {TRAINERS.find((t) => t.key === active)?.paid && !isPaid ? (
        <div className="max-w-xl rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 sm:p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-3xl mb-4">
            🔒
          </div>
          <p className="font-display text-lg font-bold mb-1.5">Доступно по подписке</p>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed max-w-sm mx-auto">
            Этот тренажёр — премиум-инструмент. Оформите подписку, чтобы открыть его без
            ограничений.
          </p>
          <Button
            className="h-11 px-6 gap-2 bg-primary hover:bg-primary/90"
            onClick={user ? openUpgrade : openAuth}
          >
            <Icon name={user ? "Sparkles" : "LogIn"} size={17} />
            {user ? "Оформить подписку" : "Войти и оформить подписку"}
          </Button>
        </div>
      ) : (
        <TrainerFullscreen
          icon={activeTrainer?.icon || ""}
          title={activeTrainer?.title || ""}
          onClose={() => setActive(null)}
        >
          {IFRAME_SRC[active] ? (
            <iframe
              key={active}
              src={`${IFRAME_SRC[active]}?v=${ASSET_VERSION}`}
              title={activeTrainer?.title}
              className="block h-full w-full border-0"
            />
          ) : (
            <div className="mx-auto w-full max-w-3xl p-4 sm:p-8">
              {active === "algorithms" && <AlgorithmsTask />}
              {active === "backwards" && <BackwardsAnalysisTask />}
              {active === "network-protocols" && <NetworkProtocolsTask />}
            </div>
          )}
        </TrainerFullscreen>
      )}
    </>
  );
};

export default TrainerView;
