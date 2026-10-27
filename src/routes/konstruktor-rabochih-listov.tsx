import { createFileRoute } from "@tanstack/react-router";
import WorksheetBuilder from "@/pages/WorksheetBuilder";

export const Route = createFileRoute("/konstruktor-rabochih-listov")({ component: WorksheetBuilder });
