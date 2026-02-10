import type { RenderOptions } from "../types.js";

function isWriteStream(v: unknown): v is NodeJS.WriteStream {
  return (
    typeof v === "object" &&
    v !== null &&
    "write" in v &&
    typeof (v as { write?: unknown }).write === "function"
  );
}

export function normalizeRenderOptions(
  options?: RenderOptions | NodeJS.WriteStream,
): RenderOptions {
  if (!options) return {};
  return isWriteStream(options) ? { stdout: options } : options;
}
