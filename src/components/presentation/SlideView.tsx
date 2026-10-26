import {
  LAYOUT,
  Slide,
  StyleTheme,
  SLIDE_H,
  SLIDE_W,
  fitBulletsSize,
  fitTitleSize,
  isCover,
  isLast,
} from "@/components/presentation/presentationConfig";

interface Props {
  slide: Slide;
  index: number;
  total: number;
  deckTitle: string;
  theme: StyleTheme;
}

const SlideView = ({ slide, index, total, deckTitle, theme }: Props) => {
  const dark = isCover(index) || isLast(index, total);
  const bg = dark ? theme.bgAlt : theme.bg;
  const textColor = dark ? (theme.key === "game" ? theme.text : "#FFFFFF") : theme.text;
  const base = {
    width: SLIDE_W,
    height: SLIDE_H,
    background: bg,
    color: textColor,
    fontFamily: theme.bodyFont,
    position: "relative" as const,
    overflow: "hidden" as const,
    boxSizing: "border-box" as const,
  };

  if (dark) {
    const cover = isCover(index);
    const heading = cover ? deckTitle || slide.title : slide.title;
    const headingSize = fitTitleSize(heading, 760, cover ? 54 : 46, 28, 3);
    const subtitle = cover && slide.title && slide.title !== deckTitle ? slide.title : "";
    const subSize = subtitle ? fitTitleSize(subtitle, 720, 26, 16, 2) : 0;
    const used = headingSize * 1.15 * Math.min(3, Math.ceil(heading.length / Math.max(8, 760 / (headingSize * 0.56)))) + (subtitle ? subSize * 2.6 : 0) + 80;
    const bulletsH = Math.max(80, SLIDE_H - 120 - used);
    const bulletsSize = slide.bullets.length ? fitBulletsSize(slide.bullets, 740, bulletsH, 22, 13, 1.4) : 0;
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 80px" }}>
        <div style={{ position: "absolute", right: -80, top: -80, width: 320, height: 320, borderRadius: "50%", background: theme.accent, opacity: 0.25 }} />
        <div style={{ position: "absolute", right: 60, bottom: -100, width: 220, height: 220, borderRadius: "50%", background: theme.accent, opacity: 0.4 }} />
        <div style={{ position: "relative", width: 90, height: 8, background: theme.accent, borderRadius: 4, marginBottom: 24, flexShrink: 0 }} />
        <div style={{ position: "relative", fontFamily: theme.titleFont, fontSize: headingSize, fontWeight: 700, lineHeight: 1.15, maxWidth: 760, overflowWrap: "anywhere" }}>
          {heading}
        </div>
        {subtitle && (
          <div style={{ position: "relative", fontSize: subSize, marginTop: 16, opacity: 0.85, maxWidth: 720, lineHeight: 1.3, overflowWrap: "anywhere" }}>
            {subtitle}
          </div>
        )}
        {slide.bullets.length > 0 && (
          <div style={{ position: "relative", marginTop: 22, fontSize: bulletsSize, lineHeight: 1.4, opacity: 0.92, maxWidth: 740, overflowWrap: "anywhere" }}>
            {slide.bullets.map((b, i) => (
              <div key={i} style={{ marginBottom: bulletsSize * 0.3 }}>{b}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const storyteller = theme.key === "storyteller";
  const hasImage = !!(slide.imageUrl || slide.image);
  const innerW = SLIDE_W - LAYOUT.padX * 2 - 16;
  const bodyW = hasImage ? innerW - LAYOUT.imageW - LAYOUT.gap : innerW;
  const titleSize = fitTitleSize(slide.title, innerW, storyteller ? 42 : 38, 24, LAYOUT.titleMaxLines);
  const titleLines = Math.min(LAYOUT.titleMaxLines, Math.max(1, Math.ceil((slide.title.length * titleSize * 0.56) / innerW)));
  const titleH = titleSize * 1.2 * titleLines;
  const bodyH = SLIDE_H - LAYOUT.padTop - titleH - 5 - 40 - 56;
  const bulletSize = fitBulletsSize(slide.bullets, bodyW, bodyH, storyteller ? 28 : 25, 13);
  const imgH = Math.min(LAYOUT.imageH, Math.max(160, bodyH));

  return (
    <div style={{ ...base, padding: `${LAYOUT.padTop}px ${LAYOUT.padX}px 0 ${LAYOUT.padX + 8}px` }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: theme.accent }} />
      <div style={{ fontFamily: theme.titleFont, fontSize: titleSize, fontWeight: 700, lineHeight: 1.2, color: theme.accent, maxWidth: innerW, overflowWrap: "anywhere" }}>
        {slide.title}
      </div>
      <div style={{ width: 70, height: 5, background: theme.accent, borderRadius: 3, margin: "14px 0 22px" }} />
      <div style={{ display: "flex", gap: LAYOUT.gap, height: bodyH, overflow: "hidden" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {slide.bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: bulletSize * 0.5, fontSize: bulletSize, lineHeight: 1.35, marginBottom: bulletSize * 0.55 }}>
              <span style={{ color: theme.accent, fontWeight: 700, flexShrink: 0 }}>{theme.key === "game" ? "★" : "●"}</span>
              <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{b}</span>
            </div>
          ))}
        </div>
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: LAYOUT.imageW, height: imgH, flexShrink: 0, objectFit: slide.imageFit === "contain" ? "contain" : "cover", background: slide.imageFit === "contain" ? "#FFFFFF" : undefined, borderRadius: 18, border: `3px solid ${theme.accent}` }}
          />
        ) : (
          slide.image && (
            <div
              style={{
                width: LAYOUT.imageW,
                height: imgH,
                flexShrink: 0,
                border: `3px dashed ${theme.accent}`,
                borderRadius: 18,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                textAlign: "center",
                color: theme.muted,
                fontSize: 15,
                lineHeight: 1.3,
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 6 }}>🖼️</div>
              <span style={{ overflowWrap: "anywhere" }}>{slide.image}</span>
            </div>
          )
        )}
      </div>
      <div style={{ position: "absolute", right: 40, bottom: 20, fontSize: 16, color: theme.muted }}>
        {index + 1} / {total}
      </div>
    </div>
  );
};

export default SlideView;
