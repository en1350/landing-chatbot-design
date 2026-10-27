import { createFileRoute } from "@tanstack/react-router";
import CorrectionWork from "@/pages/CorrectionWork";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/korrektsionnaya-rabota")({ head: () => pageHead({ title: "Коррекционная работа", description: "Планирование коррекционной работы с обучающимися: выявление пробелов и подбор заданий для их устранения.", image: SEO_IMAGES.lessons }), component: CorrectionWork });
