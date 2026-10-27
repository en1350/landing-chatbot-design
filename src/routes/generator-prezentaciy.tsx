import { createFileRoute } from "@tanstack/react-router";
import PresentationBuilder from "@/pages/PresentationBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/generator-prezentaciy")({ head: () => pageHead({ title: "Генератор презентаций", description: "ИИ создаст презентацию к уроку по вашей теме: структура, слайды и иллюстрации. Скачайте готовый файл.", image: SEO_IMAGES.projects }), component: PresentationBuilder });
