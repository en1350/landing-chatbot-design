const FILES = "https://cdn.poehali.dev/projects/***/files/";

export const SEO_IMAGES = {
  lessons: FILES + "8583ca15-7228-41f4-b5e2-48f25242eb2c.jpg",
  trainers: FILES + "f5cbbdad-8137-484f-9588-835931fb4ef5.jpg",
  analytics: FILES + "fd39c99c-dbe5-4af8-8235-29d0e5a4daef.jpg",
  projects: FILES + "d9d9dcfd-c795-4b69-a309-05a454b791bf.jpg",
  main: FILES + "4f0fb8d2-79e1-48c8-bb5c-7b2719a7a367.jpg",
} as const;

interface PageSeo {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
}

export function pageHead({ title, description, image = SEO_IMAGES.main, noindex }: PageSeo) {
  const full = title + " | УрокАИ";
  return {
    meta: [
      { title: full },
      { name: "description", content: description },
      { property: "og:title", content: full },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { name: "twitter:title", content: full },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      ...(noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
    ],
  };
}
