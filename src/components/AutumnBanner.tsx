import { Link } from "react-router-dom";

const AutumnBanner = () => {
  return (
    <section className="container py-6 md:py-8">
      <Link
        to="/generator-prezentaciy"
        aria-label="Открыть генератор презентаций"
        className="group block overflow-hidden rounded-2xl shadow-lg animate-fade-in"
      >
        <img
          src="https://cdn.poehali.dev/projects/3a27d5a9-016a-43ab-946d-4c4fe8129705/bucket/ce900e0e-f936-487f-b13f-cd5ef3209cb8.jpg"
          alt="УрокАИ: создавай презентации и проверяй работы на антиплагиат"
          className="w-full h-auto transition-transform duration-300 group-hover:scale-[1.01]"
        />
      </Link>
    </section>
  );
};

export default AutumnBanner;
