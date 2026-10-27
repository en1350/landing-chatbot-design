import { createFileRoute } from "@tanstack/react-router";
import PmTaskBuilder from "@/pages/PmTaskBuilder";

export const Route = createFileRoute("/generator-zadaniy-pm")({ component: PmTaskBuilder });
