import type { TextStyle } from "../../index.js";

export type ResolvedTextStyle = Readonly<
  {
    fg: NonNullable<TextStyle["fg"]>;
    bg: NonNullable<TextStyle["bg"]>;
  } & Pick<TextStyle, "bold" | "dim" | "italic" | "underline" | "inverse">
>;

export const DEFAULT_BASE_STYLE: ResolvedTextStyle = Object.freeze({
  fg: Object.freeze({ r: 232, g: 238, b: 245 }),
  bg: Object.freeze({ r: 7, g: 10, b: 12 }),
});

export function mergeTextStyle(
  base: ResolvedTextStyle,
  override: TextStyle | undefined,
): ResolvedTextStyle {
  if (!override) return base;
  if (
    override.fg === undefined &&
    override.bg === undefined &&
    override.bold === undefined &&
    override.dim === undefined &&
    override.italic === undefined &&
    override.underline === undefined &&
    override.inverse === undefined
  ) {
    return base;
  }
  const fg = override.fg ?? base.fg;
  const bg = override.bg ?? base.bg;
  const bold = override.bold ?? base.bold;
  const dim = override.dim ?? base.dim;
  const italic = override.italic ?? base.italic;
  const underline = override.underline ?? base.underline;
  const inverse = override.inverse ?? base.inverse;

  if (
    fg.r === base.fg.r &&
    fg.g === base.fg.g &&
    fg.b === base.fg.b &&
    bg.r === base.bg.r &&
    bg.g === base.bg.g &&
    bg.b === base.bg.b &&
    bold === base.bold &&
    dim === base.dim &&
    italic === base.italic &&
    underline === base.underline &&
    inverse === base.inverse
  ) {
    return base;
  }

  const merged: {
    fg: NonNullable<TextStyle["fg"]>;
    bg: NonNullable<TextStyle["bg"]>;
    bold?: boolean;
    dim?: boolean;
    italic?: boolean;
    underline?: boolean;
    inverse?: boolean;
  } = {
    fg,
    bg,
  };

  if (bold !== undefined) merged.bold = bold;
  if (dim !== undefined) merged.dim = dim;
  if (italic !== undefined) merged.italic = italic;
  if (underline !== undefined) merged.underline = underline;
  if (inverse !== undefined) merged.inverse = inverse;
  return merged;
}

export function shouldFillForStyleOverride(override: TextStyle | undefined): boolean {
  if (!override) return false;
  return override.bg !== undefined;
}
