import { ReactNode, useEffect, useRef, useState } from "react";
import { SLIDE_H, SLIDE_W } from "@/components/presentation/presentationConfig";

const ScaledSlide = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SLIDE_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="w-full overflow-hidden rounded-lg border border-border shadow-sm" style={{ aspectRatio: `${SLIDE_W} / ${SLIDE_H}` }}>
      <div style={{ width: SLIDE_W, height: SLIDE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
};

export default ScaledSlide;
