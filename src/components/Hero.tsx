import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section id="top" className="relative overflow-hidden paper-texture">
      <div
        className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-coral/20 blur-3xl animate-float"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-40 -left-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-float"
        style={{ animationDelay: "1.5s" }}
        aria-hidden
      />

      <div className="container relative pt-10 pb-6 sm:pt-16 md:pt-24 md:pb-8 grid md:grid-cols-2 gap-12 items-start">
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 px-6 text-base gap-2 border-border"
              onClick={() => document.getElementById("chat-anchor")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Icon name="MessageCircle" size={18} />
              Спросить у ИИ
            </Button>
          </div>

        </div>

        <div className="flex justify-center md:justify-end md:pt-12 animate-fade-in w-full" style={{ animationDelay: "0.15s" }}>
          <div className="w-full max-w-xl">
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
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;