import SiteDemo from "@/components/demo/SiteDemo";

const WinterBanner = () => {
  return (
    <section className="container py-4 md:py-6">
      <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-5 lg:items-stretch animate-fade-in">
        <div className="overflow-hidden rounded-xl shadow-lg sm:rounded-2xl lg:col-span-3">
          <img
            src="https://cdn.poehali.dev/projects/3a27d5a9-016a-43ab-946d-4c4fe8129705/bucket/96b32a4c-117f-4b13-af5e-ac1fde383f82.png"
            alt="Зимний стол педагога: блокнот, очки, горячий шоколад и еловая ветка"
            className="w-full h-auto lg:h-full lg:object-cover"
          />
        </div>
        <div className="flex lg:col-span-2">
          <SiteDemo />
        </div>
      </div>
    </section>
  );
};

export default WinterBanner;
