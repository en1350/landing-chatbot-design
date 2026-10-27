import { createFileRoute } from "@tanstack/react-router";
import GameCardBuilder from "@/pages/GameCardBuilder";

export const Route = createFileRoute("/konstruktor-igry")({ component: GameCardBuilder });
