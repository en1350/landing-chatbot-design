import { createFileRoute } from "@tanstack/react-router";
import LessonCardBuilder from "@/pages/LessonCardBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/konstruktor-uroka")({ head: () => pageHead({ title: "Конструктор урока и технологической карты", description: "Соберите технологическую карту урока по ФГОС за минуты: этапы, время, технологии, УУД. Печать и скачивание в Word.", image: SEO_IMAGES.lessons }), component: LessonCardBuilder });
