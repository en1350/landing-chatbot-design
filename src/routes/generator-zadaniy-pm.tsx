import { createFileRoute } from "@tanstack/react-router";
import PmTaskBuilder from "@/pages/PmTaskBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/generator-zadaniy-pm")({ head: () => pageHead({ title: "Генератор заданий для проектной работы", description: "Практические задания по управлению проектами для обучающихся: кейсы, роли и критерии оценки.", image: SEO_IMAGES.projects }), component: PmTaskBuilder });
