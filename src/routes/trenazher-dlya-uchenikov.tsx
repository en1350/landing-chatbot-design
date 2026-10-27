import { createFileRoute } from "@tanstack/react-router";
import StudentTrainer from "@/pages/StudentTrainer";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/trenazher-dlya-uchenikov")({ head: () => pageHead({ title: "Тренажёры и интерактивные уроки для учеников", description: "Интерактивные уроки по информатике, ОВЗ и подготовке к ЕГЭ, симуляторы кода. Теория, практика, тест и сертификат.", image: SEO_IMAGES.trainers }), component: StudentTrainer });
