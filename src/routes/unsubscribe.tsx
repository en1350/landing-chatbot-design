import { createFileRoute } from "@tanstack/react-router";
import Unsubscribe from "@/pages/Unsubscribe";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/unsubscribe")({ head: () => pageHead({ title: "Отписка от рассылки", description: "Служебный раздел.", noindex: true }), component: Unsubscribe });
