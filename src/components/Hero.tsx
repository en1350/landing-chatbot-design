import { Link } from "@/lib/router-compat";
import Icon from "@/components/ui/icon";
import MiniPlanPanel from "@/components/MiniPlanPanel";
import SiteDemo from "@/components/demo/SiteDemo";

const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container relative pt-6 pb-6 md:pb-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <div id="chat-anchor" className="flex justify-center w-full scroll-mt-24 order-2 lg:order-1">
            <div className="rounded-2xl border border-border bg-card shadow-xl shadow-primary/5 overflow-hidden w-full">
              <div className="flex items-center gap-2.5 px-4 py-3 bg-primary text-primary-foreground">
                <span className="text-lg">✨</span>
                <span className="font-display text-sm font-bold">Мини-конструктор урока · бесплатно</span>
              </div>
              <div className="p-4">
                <MiniPlanPanel />
              </div>
            </div>
          </div>
          <div className="w-full order-1 lg:order-2">
            <div className="mb-4 flex">
              <SiteDemo />
            </div>
            <a
              href="/pedagogical-row.html"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <span className="text-xl">🎓</span>
              Играть в «Педагогический ряд»
              <Icon name="ArrowRight" size={16} />
            </a>
            <Link
              to="/mini-test-pedagogov"
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-center font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Icon name="ClipboardCheck" size={18} />
              Мини-тест: современна ли ваша методическая копилка?
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;