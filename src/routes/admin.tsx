import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";

const Pending = () => <span className="sr-only">Панель администратора УрокАИ — загрузка…</span>;
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin")({ ssr: false, pendingComponent: Pending, head: () => pageHead({ title: "Панель администратора", description: "Служебный раздел.", noindex: true }), component: Admin });
