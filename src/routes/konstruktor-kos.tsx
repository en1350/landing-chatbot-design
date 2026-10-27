import { createFileRoute } from "@tanstack/react-router";
import KosBuilder from "@/pages/KosBuilder";

export const Route = createFileRoute("/konstruktor-kos")({ component: KosBuilder });
