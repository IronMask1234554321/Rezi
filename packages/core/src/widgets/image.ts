import type { ImageFit, ImageProtocol } from "./types.js";

export type ImageBinaryFormat = "png" | "rgba";

export type ImageSourceAnalysis = Readonly<{
  ok: boolean;
  format?: ImageBinaryFormat;
  bytes?: Uint8Array;
  width?: number;
  height?: number;
  error?: string;
}>;

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function isPngBuffer(bytes: Uint8Array): boolean {
  if (bytes.byteLength < PNG_SIGNATURE.byteLength) return false;
  for (let index = 0; index < PNG_SIGNATURE.byteLength; index++) {
    if (bytes[index] !== PNG_SIGNATURE[index]) return false;
  }
  return true;
}

export function detectImageFormat(bytes: Uint8Array): ImageBinaryFormat {
  return isPngBuffer(bytes) ? "png" : "rgba";
}

function readU32Be(bytes: Uint8Array, off: number): number {
  return (
    (((bytes[off] ?? 0) << 24) |
      ((bytes[off + 1] ?? 0) << 16) |
      ((bytes[off + 2] ?? 0) << 8) |
      (bytes[off + 3] ?? 0)) >>>
    0
  );
}

export function readPngDimensions(
  bytes: Uint8Array,
): Readonly<{ width: number; height: number }> | null {
  if (!isPngBuffer(bytes)) return null;
  if (bytes.byteLength < 24) return null;
  const ihdrLength = readU32Be(bytes, 8);
  const ihdrType =
    (bytes[12] === 0x49 && bytes[13] === 0x48 && bytes[14] === 0x44 && bytes[15] === 0x52) === true;
  if (!ihdrType || ihdrLength < 13) return null;
  const width = readU32Be(bytes, 16);
  const height = readU32Be(bytes, 20);
  if (width === 0 || height === 0) return null;
  return Object.freeze({ width, height });
}

export function inferRgbaDimensions(
  byteLength: number,
  dstCols: number,
  dstRows: number,
): Readonly<{ width: number; height: number }> | null {
  if (!Number.isInteger(byteLength) || byteLength <= 0 || (byteLength & 3) !== 0) return null;
  const pixels = byteLength >>> 2;
  if (!Number.isInteger(pixels) || pixels <= 0) return null;
  const safeCols = Number.isInteger(dstCols) && dstCols > 0 ? dstCols : 0;
  const safeRows = Number.isInteger(dstRows) && dstRows > 0 ? dstRows : 0;
  if (safeCols > 0 && safeRows > 0 && safeCols * safeRows === pixels) {
    return Object.freeze({ width: safeCols, height: safeRows });
  }
  if (safeCols > 0 && pixels % safeCols === 0) {
    return Object.freeze({ width: safeCols, height: pixels / safeCols });
  }
  if (safeRows > 0 && pixels % safeRows === 0) {
    return Object.freeze({ width: pixels / safeRows, height: safeRows });
  }
  const square = Math.floor(Math.sqrt(pixels));
  if (square > 0 && square * square === pixels) {
    return Object.freeze({ width: square, height: square });
  }
  return Object.freeze({ width: pixels, height: 1 });
}

export function analyzeImageSource(src: Uint8Array): ImageSourceAnalysis {
  if (!(src instanceof Uint8Array)) {
    return Object.freeze({ ok: false, error: "src must be a Uint8Array" });
  }
  if (src.byteLength === 0) {
    return Object.freeze({ ok: false, error: "src is empty" });
  }
  const format = detectImageFormat(src);
  if (format === "png") {
    const dims = readPngDimensions(src);
    return Object.freeze({
      ok: true,
      bytes: src,
      format,
      ...(dims ? { width: dims.width, height: dims.height } : {}),
    });
  }
  return Object.freeze({
    ok: true,
    bytes: src,
    format,
  });
}

export function normalizeImageFit(fit: ImageFit | undefined): ImageFit {
  switch (fit) {
    case "fill":
    case "contain":
    case "cover":
      return fit;
    default:
      return "contain";
  }
}

export function normalizeImageProtocol(protocol: ImageProtocol | undefined): ImageProtocol {
  switch (protocol) {
    case "auto":
    case "kitty":
    case "sixel":
    case "iterm2":
    case "blitter":
      return protocol;
    default:
      return "auto";
  }
}

export function hashImageBytes(bytes: Uint8Array): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < bytes.byteLength; index++) {
    hash ^= bytes[index] ?? 0;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
