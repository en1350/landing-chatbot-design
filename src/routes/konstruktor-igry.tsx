import { createFileRoute } from "@tanstack/react-router";
import GameCardBuilder from "@/pages/GameCardBuilder";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/konstruktor-igry")({ head: () => pageHead({ title: "Конструктор игры для урока", description: "Создайте сценарий учебной игры: правила, этапы, время, количество участников. Готовая карточка игры для печати.", image: SEO_IMAGES.lessons }), component: GameCardBuilder });
