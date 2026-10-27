import { createFileRoute } from "@tanstack/react-router";
import WorksheetBuilder from "@/pages/WorksheetBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/konstruktor-rabochih-listov")({ head: () => pageHead({ title: "Конструктор рабочих листов", description: "Создавайте рабочие листы для учеников по теме урока: задания, таблицы, места для ответов. Готово к печати.", image: SEO_IMAGES.lessons }), component: WorksheetBuilder });
