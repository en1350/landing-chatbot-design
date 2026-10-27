import { createFileRoute } from "@tanstack/react-router";
import ExtracurricularAnalytics from "@/pages/ExtracurricularAnalytics";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/vneauditornaya-deyatelnost")({ head: () => pageHead({ title: "Аналитика внеурочной деятельности", description: "Справка по внеурочной деятельности для аттестации: охват, результаты, достижения обучающихся.", image: SEO_IMAGES.analytics }), component: ExtracurricularAnalytics });
