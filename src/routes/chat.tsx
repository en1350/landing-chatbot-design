import { createFileRoute } from "@tanstack/react-router";
import MemberChat from "@/pages/MemberChat";

const Pending = () => <span className="sr-only">Чат участников УрокАИ — загрузка…</span>;
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/chat")({ ssr: false, pendingComponent: Pending, head: () => pageHead({ title: "Чат педагогов", description: "Служебный раздел.", noindex: true }), component: MemberChat });
