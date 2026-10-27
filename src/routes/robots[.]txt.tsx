import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => {
        const origin = new URL(request.url).origin;
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /chat",
          "Disallow: /reset-password",
          "Disallow: /verify-email",
          "Disallow: /unsubscribe",
          "Disallow: /_serverFn/",
          "",
          "User-agent: Yandex",
          "Allow: /",
          "Disallow: /admin",
          "Disallow: /chat",
          "Disallow: /reset-password",
          "Disallow: /verify-email",
          "Disallow: /unsubscribe",
          "Disallow: /_serverFn/",
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
      },
    },
  },
});
