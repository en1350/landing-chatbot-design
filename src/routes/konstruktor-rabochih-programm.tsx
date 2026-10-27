import { createFileRoute } from "@tanstack/react-router";
import RpdBuilder from "@/pages/RpdBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/konstruktor-rabochih-programm")({ head: () => pageHead({ title: "Конструктор рабочих программ", description: "Соберите рабочую программу дисциплины: цели, темы, часы, оценочные материалы. Скачайте в Word.", image: SEO_IMAGES.lessons }), component: RpdBuilder });
