import { createFileRoute } from "@tanstack/react-router";
import TechMatrix from "@/pages/TechMatrix";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/matritsa-tehnologiy")({ head: () => pageHead({ title: "Матрица педагогических технологий", description: "Подберите образовательную технологию под задачу урока: сравнение, описание и примеры применения.", image: SEO_IMAGES.lessons }), component: TechMatrix });
