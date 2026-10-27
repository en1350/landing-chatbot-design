import { createFileRoute } from "@tanstack/react-router";
import TaskCardBuilder from "@/pages/TaskCardBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/konstruktor-zadaniy")({ head: () => pageHead({ title: "Конструктор заданий", description: "Составьте карточку задания по предмету и теме с учётом типа мышления и компетенций. Скачайте готовый документ.", image: SEO_IMAGES.lessons }), component: TaskCardBuilder });
