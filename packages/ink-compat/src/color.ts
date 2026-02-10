import { type Rgb, rgb } from "@rezi-ui/core";

const RGB_RE = /^rgb\(\s?(\d+),\s?(\d+),\s?(\d+)\s?\)$/;
const ANSI256_RE = /^ansi256\(\s?(\d+)\s?\)$/;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Deterministic xterm 256-color palette conversion.
// This is *not* terminal-theme-aware, but provides stable RGBs for Rezi truecolor rendering.
const ANSI16_TABLE: readonly Rgb[] = Object.freeze([
  rgb(0, 0, 0), // 0 black
  rgb(128, 0, 0), // 1 red
  rgb(0, 128, 0), // 2 green
  rgb(128, 128, 0), // 3 yellow
  rgb(0, 0, 128), // 4 blue
  rgb(128, 0, 128), // 5 magenta
  rgb(0, 128, 128), // 6 cyan
  rgb(192, 192, 192), // 7 white (light gray)
  rgb(128, 128, 128), // 8 blackBright (dark gray)
  rgb(255, 0, 0), // 9 redBright
  rgb(0, 255, 0), // 10 greenBright
  rgb(255, 255, 0), // 11 yellowBright
  rgb(0, 0, 255), // 12 blueBright
  rgb(255, 0, 255), // 13 magentaBright
  rgb(0, 255, 255), // 14 cyanBright
  rgb(255, 255, 255), // 15 whiteBright
]);

const ANSI_NAME_TO_ANSI256: ReadonlyMap<string, number> = new Map<string, number>([
  ["black", 0],
  ["red", 1],
  ["green", 2],
  ["yellow", 3],
  ["blue", 4],
  ["magenta", 5],
  ["cyan", 6],
  ["white", 7],
  ["blackBright", 8],
  ["gray", 8],
  ["grey", 8],
  ["redBright", 9],
  ["greenBright", 10],
  ["yellowBright", 11],
  ["blueBright", 12],
  ["magentaBright", 13],
  ["cyanBright", 14],
  ["whiteBright", 15],
]);

function clampByte(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.trunc(n)));
}

function parseHexColor(s: string): Rgb | undefined {
  if (!HEX_RE.test(s)) return undefined;
  const hex = s.length === 4 ? `${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}` : s.slice(1);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  if (!Number.isFinite(r) || !Number.isFinite(g) || !Number.isFinite(b)) return undefined;
  return rgb(r, g, b);
}

function parseRgbFunc(s: string): Rgb | undefined {
  const m = RGB_RE.exec(s);
  if (!m) return undefined;
  return rgb(clampByte(Number(m[1])), clampByte(Number(m[2])), clampByte(Number(m[3])));
}

function ansi256ToRgb(code: number): Rgb | undefined {
  if (!Number.isInteger(code) || code < 0 || code > 255) return undefined;

  if (code < 16) return ANSI16_TABLE[code];

  // 6x6x6 color cube: 16..231
  if (code >= 16 && code <= 231) {
    const idx = code - 16;
    const r = Math.floor(idx / 36);
    const g = Math.floor((idx % 36) / 6);
    const b = idx % 6;
    const conv = (n: number): number => (n === 0 ? 0 : 55 + n * 40);
    return rgb(conv(r), conv(g), conv(b));
  }

  // Grayscale ramp: 232..255 (24 steps)
  const gray = 8 + (code - 232) * 10;
  return rgb(gray, gray, gray);
}

function parseAnsi256Func(s: string): Rgb | undefined {
  const m = ANSI256_RE.exec(s);
  if (!m) return undefined;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return undefined;
  return ansi256ToRgb(Math.trunc(n));
}

/**
 * Resolve an Ink-style color string to a Rezi RGB value.
 *
 * Supported (mirrors Ink's `colorize()`):
 * - Named colors (chalk foreground names): "red", "greenBright", "gray", ...
 * - Hex: "#RRGGBB"
 * - "rgb(r,g,b)"
 * - "ansi256(n)"
 *
 * Returns undefined when input is undefined or unrecognized.
 */
export function resolveInkColor(color: string | undefined): Rgb | undefined {
  if (!color) return undefined;

  const named = ANSI_NAME_TO_ANSI256.get(color);
  if (named !== undefined) return ansi256ToRgb(named);

  if (color.startsWith("#")) return parseHexColor(color);
  if (color.startsWith("ansi256")) return parseAnsi256Func(color);
  if (color.startsWith("rgb")) return parseRgbFunc(color);

  return undefined;
}

// Exposed for unit tests.
export const __private = Object.freeze({ ansi256ToRgb });
