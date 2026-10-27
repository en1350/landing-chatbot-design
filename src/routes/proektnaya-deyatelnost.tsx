import { createFileRoute } from "@tanstack/react-router";
import ProjectActivity from "@/pages/ProjectActivity";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/proektnaya-deyatelnost")({ head: () => pageHead({ title: "Проектная деятельность", description: "Сопровождение проектной деятельности обучающихся: этапы, документы и справка для портфолио педагога.", image: SEO_IMAGES.projects }), component: ProjectActivity });
