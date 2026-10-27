import { createFileRoute } from "@tanstack/react-router";
import Admin from "@/pages/Admin";

const Pending = () => <span className="sr-only">Панель администратора УрокАИ — загрузка…</span>;

export const Route = createFileRoute("/admin")({ ssr: false, pendingComponent: Pending, component: Admin });
