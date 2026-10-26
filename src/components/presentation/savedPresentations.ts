import { PresentationData, StyleKey, STYLES } from "@/components/presentation/presentationConfig";

export interface SavedPresentationMeta {
  id: number;
  title: string;
  created_at: string;
}

export const serializePresentation = (deck: PresentationData, style: StyleKey): string =>
  JSON.stringify({
    v: 1,
    style,
    title: deck.title,
    slides: deck.slides.map((sl) => ({
      title: sl.title,
      bullets: sl.bullets,
      notes: sl.notes,
      image: sl.image,
      imageFit: sl.imageFit,
      imageUrl: sl.cdnUrl || (sl.imageUrl && sl.imageUrl.startsWith("http") ? sl.imageUrl : undefined),
    })),
  });

export const toDataUrl = async (url: string): Promise<string> => {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return url;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
};

export const parsePresentation = async (
  content: string
): Promise<{ deck: PresentationData; style: StyleKey } | null> => {
  try {
    const raw = JSON.parse(content);
    if (!raw || !Array.isArray(raw.slides)) return null;
    const style: StyleKey = STYLES.some((s) => s.key === raw.style) ? raw.style : "modern";
    const slides = await Promise.all(
      raw.slides.map(async (sl: Record<string, unknown>) => {
        const cdnUrl = typeof sl.imageUrl === "string" ? sl.imageUrl : undefined;
        return {
          title: String(sl.title || ""),
          bullets: Array.isArray(sl.bullets) ? sl.bullets.map(String) : [],
          notes: String(sl.notes || ""),
          image: String(sl.image || ""),
          cdnUrl,
          imageFit: sl.imageFit === "contain" ? ("contain" as const) : undefined,
          imageUrl: cdnUrl ? await toDataUrl(cdnUrl) : undefined,
        };
      })
    );
    return { deck: { title: String(raw.title || "Презентация"), slides }, style };
  } catch {
    return null;
  }
};
