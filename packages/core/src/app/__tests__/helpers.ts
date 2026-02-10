import { ZREV_MAGIC, ZR_EVENT_BATCH_VERSION_V1 } from "../../abi.js";
import type { BackendEventBatch } from "../../backend.js";

export async function flushMicrotasks(count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  }
}

function align4(n: number): number {
  return (n + 3) & ~3;
}

type EncodedEvent =
  | Readonly<{
      kind: "key";
      timeMs: number;
      key: number;
      mods?: number;
      action: "down" | "up" | "repeat";
    }>
  | Readonly<{ kind: "text"; timeMs: number; codepoint: number }>
  | Readonly<{
      kind: "mouse";
      timeMs: number;
      x: number;
      y: number;
      mouseKind: number;
      mods?: number;
      buttons?: number;
      wheelX?: number;
      wheelY?: number;
    }>
  | Readonly<{ kind: "resize"; timeMs: number; cols: number; rows: number }>;

export function encodeZrevBatchV1(
  opts: Readonly<{ flags?: number; events?: readonly EncodedEvent[] }>,
): Uint8Array {
  const flags = opts.flags ?? 0;
  const events = opts.events ?? [];

  let totalSize = 24;
  for (const ev of events) {
    if (ev.kind === "text") totalSize += 24;
    else if (ev.kind === "key") totalSize += 32;
    else if (ev.kind === "mouse") totalSize += 48;
    else totalSize += 32;
  }
  totalSize = align4(totalSize);

  const bytes = new Uint8Array(totalSize);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  dv.setUint32(0, ZREV_MAGIC, true);
  dv.setUint32(4, ZR_EVENT_BATCH_VERSION_V1, true);
  dv.setUint32(8, totalSize, true);
  dv.setUint32(12, events.length, true);
  dv.setUint32(16, flags, true);
  dv.setUint32(20, 0, true);

  let off = 24;
  for (const ev of events) {
    if (ev.kind === "key") {
      dv.setUint32(off + 0, 1, true);
      dv.setUint32(off + 4, 32, true);
      dv.setUint32(off + 8, ev.timeMs, true);
      dv.setUint32(off + 12, 0, true);
      dv.setUint32(off + 16, ev.key, true);
      dv.setUint32(off + 20, ev.mods ?? 0, true);
      const actionRaw = ev.action === "down" ? 1 : ev.action === "up" ? 2 : 3;
      dv.setUint32(off + 24, actionRaw, true);
      dv.setUint32(off + 28, 0, true);
      off += 32;
      continue;
    }

    if (ev.kind === "text") {
      dv.setUint32(off + 0, 2, true);
      dv.setUint32(off + 4, 24, true);
      dv.setUint32(off + 8, ev.timeMs, true);
      dv.setUint32(off + 12, 0, true);
      dv.setUint32(off + 16, ev.codepoint, true);
      dv.setUint32(off + 20, 0, true);
      off += 24;
      continue;
    }

    if (ev.kind === "mouse") {
      dv.setUint32(off + 0, 4, true);
      dv.setUint32(off + 4, 48, true);
      dv.setUint32(off + 8, ev.timeMs, true);
      dv.setUint32(off + 12, 0, true);
      dv.setInt32(off + 16, ev.x, true);
      dv.setInt32(off + 20, ev.y, true);
      dv.setUint32(off + 24, ev.mouseKind, true);
      dv.setUint32(off + 28, ev.mods ?? 0, true);
      dv.setUint32(off + 32, ev.buttons ?? 0, true);
      dv.setInt32(off + 36, ev.wheelX ?? 0, true);
      dv.setInt32(off + 40, ev.wheelY ?? 0, true);
      dv.setUint32(off + 44, 0, true);
      off += 48;
      continue;
    }

    dv.setUint32(off + 0, 5, true);
    dv.setUint32(off + 4, 32, true);
    dv.setUint32(off + 8, ev.timeMs, true);
    dv.setUint32(off + 12, 0, true);
    dv.setUint32(off + 16, ev.cols, true);
    dv.setUint32(off + 20, ev.rows, true);
    dv.setUint32(off + 24, 0, true);
    dv.setUint32(off + 28, 0, true);
    off += 32;
  }

  return bytes;
}

export function makeBackendBatch(
  opts: Readonly<{
    bytes: Uint8Array;
    droppedBatches?: number;
    onRelease?: () => void;
  }>,
): BackendEventBatch {
  let released = false;
  return {
    bytes: opts.bytes,
    droppedBatches: opts.droppedBatches ?? 0,
    release: () => {
      if (released) return;
      released = true;
      opts.onRelease?.();
    },
  };
}
