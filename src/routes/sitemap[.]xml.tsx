import { createFileRoute } from "@tanstack/react-router";
import { SITEMAP_LESSONS, SITEMAP_PAGES, SITEMAP_TRAINER_CATEGORIES } from "@/lib/sitemapData";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => {
        const origin = new URL(request.url).origin;
        const today = new Date().toISOString().slice(0, 10);
        const entry = (loc: string, priority: string, changefreq: string) =>
          `<url><loc>${origin}${loc.replace(/&/g, "&amp;")}</loc><lastmod>${today}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
        const urls = [
          ...SITEMAP_PAGES.map((p) => entry(p.path, p.priority, p.changefreq)),
          ...SITEMAP_TRAINER_CATEGORIES.map((c) => entry(`/trenazher-dlya-uchenikov?cat=${c}`, "0.7", "weekly")),
          ...SITEMAP_LESSONS.map((l) => entry(`/${l}.html`, "0.6", "monthly")),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
