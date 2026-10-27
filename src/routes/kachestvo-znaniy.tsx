import { createFileRoute } from "@tanstack/react-router";
import QualityAnalysisTool from "@/pages/QualityAnalysisTool";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/kachestvo-znaniy")({ head: () => pageHead({ title: "Анализ качества знаний", description: "Расчёт успеваемости и качества знаний по классу: процент успеваемости, средний балл, выводы для портфолио.", image: SEO_IMAGES.analytics }), component: QualityAnalysisTool });
