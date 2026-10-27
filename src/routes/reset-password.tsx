import { createFileRoute } from "@tanstack/react-router";
import ResetPassword from "@/pages/ResetPassword";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({ head: () => pageHead({ title: "Восстановление пароля", description: "Служебный раздел.", noindex: true }), component: ResetPassword });
