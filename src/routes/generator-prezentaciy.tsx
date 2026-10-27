import { createFileRoute } from "@tanstack/react-router";
import PresentationBuilder from "@/pages/PresentationBuilder";

export const Route = createFileRoute("/generator-prezentaciy")({ component: PresentationBuilder });
