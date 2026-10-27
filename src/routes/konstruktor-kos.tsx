import { createFileRoute } from "@tanstack/react-router";
import KosBuilder from "@/pages/KosBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/konstruktor-kos")({ head: () => pageHead({ title: "Конструктор КОС", description: "Комплект оценочных средств: компетенции, индикаторы, задания и критерии оценивания. Экспорт в Word.", image: SEO_IMAGES.lessons }), component: KosBuilder });
