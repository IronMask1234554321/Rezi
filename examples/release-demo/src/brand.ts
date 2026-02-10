import { type RichTextSpan, type TextStyle, rgb } from "@rezi-ui/core";

type Color = ReturnType<typeof rgb>;

const logoStops = [rgb(64, 228, 255), rgb(94, 201, 255), rgb(124, 179, 255), rgb(152, 166, 255)];

export const brandColors = Object.freeze({
  bg: rgb(5, 8, 21),
  panel: rgb(10, 14, 36),
  panelAlt: rgb(14, 20, 47),
  panelRaised: rgb(19, 27, 61),
  border: rgb(45, 82, 163),
  borderBright: rgb(105, 189, 255),
  fg: rgb(227, 235, 255),
  fgMuted: rgb(145, 169, 216),
  fgDim: rgb(84, 102, 150),
  accent: rgb(98, 210, 255),
  accentWarm: rgb(255, 189, 126),
  success: rgb(114, 238, 165),
  warning: rgb(255, 200, 103),
  danger: rgb(255, 132, 167),
  logoStops,
});

function clamp01(v: number): number {
  if (v <= 0) return 0;
  if (v >= 1) return 1;
  return v;
}

function mix(a: Color, b: Color, t: number): Color {
  const clamped = clamp01(t);
  return rgb(
    Math.round(a.r + (b.r - a.r) * clamped),
    Math.round(a.g + (b.g - a.g) * clamped),
    Math.round(a.b + (b.b - a.b) * clamped),
  );
}

function brighten(color: Color, amount: number): Color {
  return mix(color, rgb(255, 255, 255), amount);
}

function gradientColor(at: number): Color {
  const pos = clamp01(at) * (logoStops.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(logoStops.length - 1, lo + 1);
  const from = logoStops[lo] ?? logoStops[0] ?? rgb(255, 255, 255);
  const to = logoStops[hi] ?? from;
  return mix(from, to, pos - lo);
}

export function span(text: string, style?: TextStyle): RichTextSpan {
  return style ? { text, style } : { text };
}

function logoLetterColor(index: number, total: number, shinePos?: number): Color {
  let fg = gradientColor(total <= 1 ? 0 : index / (total - 1));
  if (shinePos !== undefined) {
    const d = Math.abs(index - shinePos);
    if (d <= 0.45) fg = brighten(fg, 0.65);
    else if (d <= 0.9) fg = brighten(fg, 0.35);
  }
  return fg;
}

function colorizeGlyphLine(line: string, shineColumn?: number): RichTextSpan[] {
  const spans: RichTextSpan[] = [];
  const raw = line.replace(/\s+$/, "");
  const length = Math.max(1, raw.length - 1);
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (!ch) continue;
    if (ch === " ") {
      spans.push(span(" ", { fg: brandColors.fgDim }));
      continue;
    }
    let fg = gradientColor(i / length);
    if (shineColumn !== undefined) {
      const d = Math.abs(i - shineColumn);
      if (d <= 0.7) fg = brighten(fg, 0.6);
      else if (d <= 1.5) fg = brighten(fg, 0.3);
    }
    spans.push(span(ch, { fg, bold: true }));
  }
  return spans;
}

const heroLogoGlyphs = [
  "██████  ███████ ███████ ██",
  "██   ██ ██         ███  ██",
  "██████  █████      ██   ██",
  "██  ██  ██        ███   ██",
  "██   ██ ███████ ███████ ██",
] as const;

export function reziHeroLogo(shineColumn?: number): RichTextSpan[][] {
  const width = heroLogoGlyphs[0]?.length ?? 1;
  const shine = shineColumn === undefined ? undefined : Math.floor(shineColumn % width);
  return heroLogoGlyphs.map((line) => colorizeGlyphLine(line, shine));
}

export function reziCompactLogo(shineColumn?: number): RichTextSpan[][] {
  const letters = ["R", "E", "Z", "I"];
  const shinePos = shineColumn === undefined ? undefined : (shineColumn / 8) * (letters.length - 1);
  const line: RichTextSpan[] = [];
  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    if (!letter) continue;
    line.push(
      span(` ${letter} `, {
        fg: rgb(4, 8, 22),
        bg: logoLetterColor(i, letters.length, shinePos),
        bold: true,
      }),
    );
    if (i < letters.length - 1) line.push(span(" ", { fg: brandColors.fgDim }));
  }
  return [line];
}
