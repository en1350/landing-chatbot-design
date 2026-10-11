import { Slide, StyleTheme, SLIDE_H, SLIDE_W, isCover, isLast } from "@/components/presentation/presentationConfig";

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
    return (
      <div style={{ ...base, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
        <div style={{ position: "absolute", right: -80, top: -80, width: 320, height: 320, borderRadius: "50%", background: theme.accent, opacity: 0.25 }} />
        <div style={{ position: "absolute", right: 60, bottom: -100, width: 220, height: 220, borderRadius: "50%", background: theme.accent, opacity: 0.4 }} />
        <div style={{ width: 90, height: 8, background: theme.accent, borderRadius: 4, marginBottom: 28 }} />
        <div style={{ fontFamily: theme.titleFont, fontSize: isCover(index) ? 54 : 46, fontWeight: 700, lineHeight: 1.15, maxWidth: 760 }}>
          {isCover(index) ? deckTitle || slide.title : slide.title}
        </div>
        {isCover(index) && slide.title && slide.title !== deckTitle && (
          <div style={{ fontSize: 26, marginTop: 20, opacity: 0.85, maxWidth: 720 }}>{slide.title}</div>
        )}
        {slide.bullets.length > 0 && (
          <div style={{ marginTop: 26, fontSize: 22, lineHeight: 1.5, opacity: 0.92, maxWidth: 740 }}>
            {slide.bullets.map((b, i) => (
              <div key={i}>{b}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const storyteller = theme.key === "storyteller";
  return (
    <div style={{ ...base, padding: "48px 64px" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 16, background: theme.accent }} />
      <div style={{ fontFamily: theme.titleFont, fontSize: storyteller ? 44 : 38, fontWeight: 700, lineHeight: 1.2, color: theme.accent, maxWidth: 800 }}>
        {slide.title}
      </div>
      <div style={{ width: 70, height: 5, background: theme.accent, borderRadius: 3, margin: "16px 0 28px" }} />
      <div style={{ display: "flex", gap: 32 }}>
        <div style={{ flex: 1 }}>
          {slide.bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 14, fontSize: storyteller ? 28 : 25, lineHeight: 1.4, marginBottom: 16 }}>
              <span style={{ color: theme.accent, fontWeight: 700 }}>{theme.key === "game" ? "★" : "●"}</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ width: 250, height: 260, flexShrink: 0, objectFit: "cover", borderRadius: 18, border: `3px solid ${theme.accent}` }}
          />
        ) : (
          slide.image && (
            <div
              style={{
                width: 250,
                height: 260,
                flexShrink: 0,
                border: `3px dashed ${theme.accent}`,
                borderRadius: 18,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 18,
                textAlign: "center",
                color: theme.muted,
                fontSize: 17,
                lineHeight: 1.35,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>🖼️</div>
              {slide.image}
            </div>
          )
        )}
      </div>
      <div style={{ position: "absolute", right: 40, bottom: 22, fontSize: 16, color: theme.muted }}>
        {index + 1} / {total}
      </div>
    </div>
  );
};

export default SlideView;
