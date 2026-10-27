import { createFileRoute } from "@tanstack/react-router";
import InfographicBuilder from "@/pages/InfographicBuilder";

export const Route = createFileRoute("/generator-infografiki")({ component: InfographicBuilder });
