import { createFileRoute } from "@tanstack/react-router";
import EventCardBuilder from "@/pages/EventCardBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/konstruktor-masterklassov")({ head: () => pageHead({ title: "Конструктор мастер-классов и интенсивов", description: "Спланируйте мастер-класс, воркшоп или интенсив: цели, программа по времени, материалы. Готовая карточка мероприятия.", image: SEO_IMAGES.lessons }), component: EventCardBuilder });
