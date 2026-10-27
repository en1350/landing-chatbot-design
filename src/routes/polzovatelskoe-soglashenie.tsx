import { createFileRoute } from "@tanstack/react-router";
import UserAgreement from "@/pages/UserAgreement";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/polzovatelskoe-soglashenie")({ head: () => pageHead({ title: "Пользовательское соглашение", description: "Условия использования сервиса УрокАИ: права и обязанности пользователей, оплата и защита данных." }), component: UserAgreement });
