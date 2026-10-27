import { createFileRoute } from "@tanstack/react-router";
import TeacherMiniTest from "@/pages/TeacherMiniTest";
import { pageHead, SEO_IMAGES } from "@/lib/seo";

export const Route = createFileRoute("/mini-test-pedagogov")({ head: () => pageHead({ title: "Мини-тест для педагогов", description: "Короткий тест для педагогов: проверьте знания и получите разбор ответов.", image: SEO_IMAGES.analytics }), component: TeacherMiniTest });
