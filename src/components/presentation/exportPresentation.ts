import {
  PresentationData,
  StyleTheme,
  isCover,
  isLast,
} from "@/components/presentation/presentationConfig";

const hex = (c: string) => c.replace("#", "");
const safeName = (s: string) => (s.trim() || "Презентация").replace(/[\\/:*?"<>|]/g, "").slice(0, 80);

export async function exportPptx(data: PresentationData, theme: StyleTheme) {
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = data.title;

  const total = data.slides.length;
  data.slides.forEach((sl, i) => {
    const slide = pptx.addSlide();
    const dark = isCover(i) || isLast(i, total);
    slide.background = { color: hex(dark ? theme.bgAlt : theme.bg) };
    const textColor = dark ? (theme.key === "game" ? hex(theme.text) : "FFFFFF") : hex(theme.text);

    if (dark) {
      slide.addShape(pptx.ShapeType.ellipse, { x: 8.2, y: -1, w: 3.6, h: 3.6, fill: { color: hex(theme.accent), transparency: 75 }, line: { type: "none" } });
      slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 1.6, w: 1, h: 0.09, fill: { color: hex(theme.accent) }, line: { type: "none" } });
      slide.addText(isCover(i) ? data.title || sl.title : sl.title, {
        x: 0.8, y: 1.85, w: 8, h: 1.6, fontSize: 36, bold: true, color: textColor, fontFace: theme.titleFont, valign: "top",
      });
      const sub = isCover(i) && sl.title && sl.title !== data.title ? [sl.title] : [];
      const lines = [...sub, ...sl.bullets];
      if (lines.length) {
        slide.addText(lines.join("\n"), {
          x: 0.8, y: 3.5, w: 7.6, h: 1.7, fontSize: 18, color: textColor, fontFace: theme.bodyFont, valign: "top",
        });
      }
    } else {
      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.17, h: 5.625, fill: { color: hex(theme.accent) }, line: { type: "none" } });
      slide.addText(sl.title, {
        x: 0.65, y: 0.4, w: 8.7, h: 0.9, fontSize: 28, bold: true, color: hex(theme.accent), fontFace: theme.titleFont, valign: "middle",
      });
      slide.addShape(pptx.ShapeType.rect, { x: 0.65, y: 1.35, w: 0.75, h: 0.05, fill: { color: hex(theme.accent) }, line: { type: "none" } });
      const bw = sl.image ? 5.9 : 8.7;
      slide.addText(
        sl.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: 0.65, y: 1.65, w: bw, h: 3.4, fontSize: 20, color: hex(theme.text), fontFace: theme.bodyFont, valign: "top", paraSpaceAfter: 10 }
      );
      if (sl.imageUrl) {
        slide.addImage({ data: sl.imageUrl, x: 6.8, y: 1.7, w: 2.6, h: 2.7, sizing: { type: "cover", w: 2.6, h: 2.7 } });
      } else if (sl.image) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 6.8, y: 1.7, w: 2.6, h: 2.7, fill: { color: "FFFFFF", transparency: 100 }, line: { color: hex(theme.accent), width: 2, dashType: "dash" }, rectRadius: 0.15,
        });
        slide.addText("Изображение:\n" + sl.image, {
          x: 6.9, y: 1.8, w: 2.4, h: 2.5, fontSize: 12, color: hex(theme.muted), fontFace: theme.bodyFont, align: "center", valign: "middle",
        });
      }
      slide.addText(`${i + 1} / ${total}`, { x: 8.6, y: 5.1, w: 1.1, h: 0.3, fontSize: 11, color: hex(theme.muted), align: "right" });
    }
    if (sl.notes) slide.addNotes(sl.notes);
  });

  await pptx.writeFile({ fileName: `${safeName(data.title)}.pptx` });
}

export async function exportPdf(data: PresentationData, container: HTMLElement) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  const nodes = Array.from(container.querySelectorAll<HTMLElement>("[data-slide]"));
  if (!nodes.length) throw new Error("Нет слайдов для экспорта");

  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [960, 540], compress: true });
  for (let i = 0; i < nodes.length; i++) {
    const canvas = await html2canvas(nodes[i], { scale: 1.5, useCORS: true, backgroundColor: null });
    const img = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) pdf.addPage([960, 540], "landscape");
    pdf.addImage(img, "JPEG", 0, 0, 960, 540);
  }
  pdf.save(`${safeName(data.title)}.pdf`);
}
