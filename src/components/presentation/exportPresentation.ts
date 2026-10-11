import {
  LAYOUT,
  PresentationData,
  SLIDE_H,
  SLIDE_W,
  StyleTheme,
  fitBulletsSize,
  fitTitleSize,
  isCover,
  isLast,
} from "@/components/presentation/presentationConfig";

const hex = (c: string) => c.replace("#", "");
const PX = 1 / 96;
const PT = 0.75;
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
      const cover = isCover(i);
      const heading = cover ? data.title || sl.title : sl.title;
      const headingPx = fitTitleSize(heading, 760, cover ? 54 : 46, 28, 3);
      const subtitle = cover && sl.title && sl.title !== data.title ? sl.title : "";
      const subPx = subtitle ? fitTitleSize(subtitle, 720, 26, 16, 2) : 0;
      const headingLines = Math.min(3, Math.max(1, Math.ceil((heading.length * headingPx * 0.56) / 760)));
      const headingH = headingPx * 1.2 * headingLines;
      const subH = subtitle ? subPx * 1.35 * 2 : 0;
      const bulletsTop = 150 + headingH + subH + 24;
      const bulletsH = Math.max(60, SLIDE_H - 40 - bulletsTop);
      const bulletsPx = sl.bullets.length ? fitBulletsSize(sl.bullets, 740, bulletsH, 22, 13, 1.4) : 0;

      slide.addShape(pptx.ShapeType.ellipse, { x: 8.2, y: -1, w: 3.6, h: 3.6, fill: { color: hex(theme.accent), transparency: 75 }, line: { type: "none" } });
      slide.addShape(pptx.ShapeType.rect, { x: 0.8, y: 130 * PX, w: 1, h: 0.09, fill: { color: hex(theme.accent) }, line: { type: "none" } });
      slide.addText(heading, {
        x: 0.8, y: 150 * PX, w: 760 * PX, h: headingH * PX, fontSize: headingPx * PT, bold: true, color: textColor, fontFace: theme.titleFont, valign: "top", margin: 0, fit: "shrink",
      });
      if (subtitle) {
        slide.addText(subtitle, {
          x: 0.8, y: (150 + headingH + 12) * PX, w: 720 * PX, h: subH * PX, fontSize: subPx * PT, color: textColor, fontFace: theme.bodyFont, valign: "top", margin: 0, fit: "shrink",
        });
      }
      if (sl.bullets.length) {
        slide.addText(sl.bullets.join("\n"), {
          x: 0.8, y: bulletsTop * PX, w: 740 * PX, h: bulletsH * PX, fontSize: bulletsPx * PT, color: textColor, fontFace: theme.bodyFont, valign: "top", margin: 0, fit: "shrink", paraSpaceAfter: bulletsPx * 0.3 * PT,
        });
      }
    } else {
      const storyteller = theme.key === "storyteller";
      const hasImage = !!(sl.imageUrl || sl.image);
      const innerW = SLIDE_W - LAYOUT.padX * 2 - 16;
      const bodyW = hasImage ? innerW - LAYOUT.imageW - LAYOUT.gap : innerW;
      const titlePx = fitTitleSize(sl.title, innerW, storyteller ? 42 : 38, 24, LAYOUT.titleMaxLines);
      const titleLines = Math.min(LAYOUT.titleMaxLines, Math.max(1, Math.ceil((sl.title.length * titlePx * 0.56) / innerW)));
      const titleH = titlePx * 1.2 * titleLines;
      const lineY = LAYOUT.padTop + titleH + 14;
      const bodyTop = lineY + 5 + 22;
      const bodyH = SLIDE_H - LAYOUT.padTop - titleH - 5 - 40 - 56;
      const bulletPx = fitBulletsSize(sl.bullets, bodyW, bodyH, storyteller ? 28 : 25, 13);
      const imgH = Math.min(LAYOUT.imageH, Math.max(160, bodyH));
      const x0 = (LAYOUT.padX + 8) * PX;

      slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.17, h: 5.625, fill: { color: hex(theme.accent) }, line: { type: "none" } });
      slide.addText(sl.title, {
        x: x0, y: LAYOUT.padTop * PX, w: innerW * PX, h: titleH * PX, fontSize: titlePx * PT, bold: true, color: hex(theme.accent), fontFace: theme.titleFont, valign: "top", margin: 0, fit: "shrink",
      });
      slide.addShape(pptx.ShapeType.rect, { x: x0, y: lineY * PX, w: 0.73, h: 0.05, fill: { color: hex(theme.accent) }, line: { type: "none" } });
      slide.addText(
        sl.bullets.map((b) => ({ text: b, options: { bullet: true, breakLine: true } })),
        { x: x0, y: bodyTop * PX, w: bodyW * PX, h: bodyH * PX, fontSize: bulletPx * PT, color: hex(theme.text), fontFace: theme.bodyFont, valign: "top", margin: 0, fit: "shrink", paraSpaceAfter: bulletPx * 0.5 * PT }
      );
      const imgX = (LAYOUT.padX + 8 + bodyW + LAYOUT.gap) * PX;
      if (sl.imageUrl) {
        slide.addImage({ data: sl.imageUrl, x: imgX, y: bodyTop * PX, w: LAYOUT.imageW * PX, h: imgH * PX, sizing: { type: "cover", w: LAYOUT.imageW * PX, h: imgH * PX } });
      } else if (sl.image) {
        slide.addShape(pptx.ShapeType.roundRect, {
          x: imgX, y: bodyTop * PX, w: LAYOUT.imageW * PX, h: imgH * PX, fill: { color: "FFFFFF", transparency: 100 }, line: { color: hex(theme.accent), width: 2, dashType: "dash" }, rectRadius: 0.15,
        });
        slide.addText("Изображение:\n" + sl.image, {
          x: imgX + 0.1, y: bodyTop * PX + 0.1, w: LAYOUT.imageW * PX - 0.2, h: imgH * PX - 0.2, fontSize: 11, color: hex(theme.muted), fontFace: theme.bodyFont, align: "center", valign: "middle", fit: "shrink",
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
