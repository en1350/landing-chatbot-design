import { createFileRoute } from "@tanstack/react-router";
import VerifyEmail from "@/pages/VerifyEmail";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/verify-email")({ head: () => pageHead({ title: "Подтверждение почты", description: "Служебный раздел.", noindex: true }), component: VerifyEmail });
