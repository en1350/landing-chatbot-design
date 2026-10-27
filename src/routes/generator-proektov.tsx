import { createFileRoute } from "@tanstack/react-router";
import ProjectBuilder from "@/pages/ProjectBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/generator-proektov")({ head: () => pageHead({ title: "Генератор проектов", description: "Идеи и план учебного проекта: цели, этапы, продукт и критерии оценки. Готовая структура для обучающихся.", image: SEO_IMAGES.projects }), component: ProjectBuilder });
