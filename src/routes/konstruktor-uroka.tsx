import { createFileRoute } from "@tanstack/react-router";
import LessonCardBuilder from "@/pages/LessonCardBuilder";

export const Route = createFileRoute("/konstruktor-uroka")({ component: LessonCardBuilder });
