import { createFileRoute } from "@tanstack/react-router";
import MemberChat from "@/pages/MemberChat";

const Pending = () => <span className="sr-only">Чат участников УрокАИ — загрузка…</span>;

export const Route = createFileRoute("/chat")({ ssr: false, pendingComponent: Pending, component: MemberChat });
