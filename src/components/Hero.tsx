import { Link } from "@/lib/router-compat";
import Icon from "@/components/ui/icon";
import ChatWidget from "@/components/ChatWidget";

const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="container relative pt-6 pb-6 md:pb-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <div id="chat-anchor" className="flex justify-center w-full scroll-mt-24 order-2 lg:order-1">
            <ChatWidget />
          </div>
          <div className="w-full order-1 lg:order-2">
            <Link to="/trenazher-dlya-uchenikov" className="group block w-full cursor-pointer" aria-label="Открыть тренажёры для учеников">
              <img
                src="https://cdn.poehali.dev/projects/3a27d5a9-016a-43ab-946d-4c4fe8129705/bucket/ad2cfcda-8fef-49ee-b33d-b5336f3b406e.png"
                alt="IT-тренажёры с сертификатом для учеников"
                className="w-full rounded-3xl shadow-xl shadow-primary/10 transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
            <a
              href="/pedagogical-row.html"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-5 py-3 font-semibold text-primary hover:bg-primary/10 transition-colors"
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