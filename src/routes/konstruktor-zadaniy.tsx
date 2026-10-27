import { createFileRoute } from "@tanstack/react-router";
import TaskCardBuilder from "@/pages/TaskCardBuilder";

export const Route = createFileRoute("/konstruktor-zadaniy")({ component: TaskCardBuilder });
