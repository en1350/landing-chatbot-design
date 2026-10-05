import { ReactNode, useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  icon: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

const TrainerFullscreen = ({ icon, title, onClose, children }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onChange = () => setIsNativeFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const toggleNative = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      rootRef.current?.requestFullscreen?.().catch(() => undefined);
    }
  };

  const canNative = typeof document !== "undefined" && !!document.documentElement.requestFullscreen;

  return (
    <div ref={rootRef} className="fixed inset-0 z-[60] flex flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-2 sm:px-4">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Icon name="ArrowLeft" size={16} />
          <span className="hidden sm:inline">Назад к разделу</span>
        </button>
        <h1 className="flex min-w-0 flex-1 items-center gap-2 font-display text-sm font-bold sm:text-base">
          <span className="text-lg">{icon}</span>
          <span className="truncate">{title}</span>
        </h1>
        {canNative && (
          <button
            onClick={toggleNative}
            title={isNativeFullscreen ? "Выйти из полного экрана" : "На весь экран"}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Icon name={isNativeFullscreen ? "Minimize2" : "Maximize2"} size={16} />
            <span className="hidden sm:inline">{isNativeFullscreen ? "Свернуть" : "На весь экран"}</span>
          </button>
        )}
        <button
          onClick={onClose}
          title="Закрыть"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Icon name="X" size={18} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
};

export default TrainerFullscreen;
