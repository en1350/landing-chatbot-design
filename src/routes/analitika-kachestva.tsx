import { createFileRoute } from "@tanstack/react-router";
import QualityAnalytics from "@/pages/QualityAnalytics";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/analitika-kachestva")({ head: () => pageHead({ title: "Аналитика качества образования", description: "Аналитические справки для аттестации: внесите результаты обучающихся и получите готовую справку с выводами и динамикой.", image: SEO_IMAGES.analytics }), component: QualityAnalytics });
