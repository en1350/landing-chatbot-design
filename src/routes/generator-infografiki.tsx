import { createFileRoute } from "@tanstack/react-router";
import InfographicBuilder from "@/pages/InfographicBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/generator-infografiki")({ head: () => pageHead({ title: "Генератор инфографики", description: "Превратите текст в наглядную инфографику для урока или отчёта за пару минут с помощью ИИ.", image: SEO_IMAGES.projects }), component: InfographicBuilder });
