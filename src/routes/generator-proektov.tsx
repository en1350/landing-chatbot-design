import { createFileRoute } from "@tanstack/react-router";
import ProjectBuilder from "@/pages/ProjectBuilder";

export const Route = createFileRoute("/generator-proektov")({ component: ProjectBuilder });
