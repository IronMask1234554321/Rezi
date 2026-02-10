/**
 * packages/core/src/protocol/zrev_v1.ts — ZREV v1 event batch parser.
 *
 * Why: Parses the binary ZREV event batch format produced by the Zireael C engine
 * into type-safe TypeScript event objects. Enforces strict validation of all
 * fields before producing output, ensuring no partial/invalid events propagate
 * to the runtime.
 *
 * Format structure (ZREV v1):
 *   - Header: 24 bytes (magic, version, total_size, event_count, flags, reserved)
 *   - Records: Variable-length, each with 16-byte header + payload
 *   - All offsets/sizes must be 4-byte aligned
 *
 * Invariants:
 *   - No partial effects: returns error or complete batch, never partial
 *   - All size/count fields validated against caps before use
 *   - Cursor must exactly match total_size after parsing all events
 *
 * @see docs/protocol/abi.md
 * @see docs/protocol/index.md
 */

import { ZREV_MAGIC, ZR_EVENT_BATCH_VERSION_V1 } from "../abi.js";
import { BinaryReader } from "../binary/reader.js";
import type {
  EventTimeUnwrapState,
  ParseErrorCode,
  ParseResult,
  ZrevEvent,
  ZrevMouseKind,
} from "./types.js";

/**
 * Parser configuration options with cap enforcement.
 * Caps prevent resource exhaustion from malformed/malicious input.
 */
export type ParseEventBatchV1Opts = Readonly<{
  maxTotalSize?: number;
  maxEvents?: number;
  maxPasteBytes?: number;
  maxUserPayloadBytes?: number;
  /**
   * Optional mutable state for unwrapping the engine's u32 millisecond
   * timestamp across wrap-around (~49.7 days).
   */
  timeUnwrap?: EventTimeUnwrapState;
}>;

/* --- Format Constants --- */

const HEADER_SIZE = 24; /* magic(4) + version(4) + total_size(4) + event_count(4) + flags(4) + reserved(4) */
const RECORD_HEADER_SIZE = 16; /* type(4) + size(4) + time_ms(4) + flags(4) */

/** Construct a parse failure result with error context. */
function fail<T>(code: ParseErrorCode, offset: number, detail: string): ParseResult<T> {
  return { ok: false, error: { code, offset, detail } };
}

/** Round up to next 4-byte boundary. */
function align4(n: number): number {
  const rem = n % 4;
  return rem === 0 ? n : n + (4 - rem);
}

function isNonNegativeInteger(n: number): boolean {
  return Number.isInteger(n) && n >= 0;
}

function unwrapTimeMs(raw: number, state: EventTimeUnwrapState | undefined): number {
  if (!state) return raw;
  const prev = state.lastRawMs;
  if (prev !== null && raw < prev) {
    state.epochMs += 0x1_0000_0000;
  }
  state.lastRawMs = raw;
  return state.epochMs + raw;
}

/**
 * Parse a ZREV v1 event batch from raw bytes.
 *
 * Validates header magic/version, enforces configured caps, parses all event
 * records, and verifies cursor matches declared total_size.
 *
 * @param bytes - Raw event batch bytes from the engine
 * @param opts - Parser caps (defaults: maxEvents=4096, maxPasteBytes=256KiB, maxUserPayloadBytes=256KiB)
 * @returns ParseResult with batch flags and event array on success, or error on failure
 */
export function parseEventBatchV1(
  bytes: Uint8Array,
  opts: ParseEventBatchV1Opts = {},
): ParseResult<{ flags: number; events: readonly ZrevEvent[] }> {
  if (!isNonNegativeInteger(bytes.byteLength)) {
    return fail("ZR_INVALID_RECORD", 0, "bytes.byteLength must be a non-negative integer");
  }

  if (bytes.byteLength < HEADER_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${HEADER_SIZE} byte(s) for header but only ${bytes.byteLength} available`,
    );
  }

  const maxTotalSize =
    opts.maxTotalSize === undefined
      ? bytes.byteLength
      : isNonNegativeInteger(opts.maxTotalSize)
        ? opts.maxTotalSize
        : Number.NaN;
  const maxEvents =
    opts.maxEvents === undefined
      ? 4096
      : isNonNegativeInteger(opts.maxEvents)
        ? opts.maxEvents
        : Number.NaN;
  const maxPasteBytes =
    opts.maxPasteBytes === undefined
      ? 256 * 1024
      : isNonNegativeInteger(opts.maxPasteBytes)
        ? opts.maxPasteBytes
        : Number.NaN;
  const maxUserPayloadBytes =
    opts.maxUserPayloadBytes === undefined
      ? 256 * 1024
      : isNonNegativeInteger(opts.maxUserPayloadBytes)
        ? opts.maxUserPayloadBytes
        : Number.NaN;

  if (!Number.isFinite(maxTotalSize) || !Number.isFinite(maxEvents)) {
    return fail("ZR_LIMIT", 0, "invalid parser caps");
  }
  if (!Number.isFinite(maxPasteBytes) || !Number.isFinite(maxUserPayloadBytes)) {
    return fail("ZR_LIMIT", 0, "invalid parser caps");
  }

  const r0 = new BinaryReader(bytes);
  const magic = r0.readU32();
  if (magic !== ZREV_MAGIC) {
    return fail("ZR_BAD_MAGIC", 0, "magic must be ZREV");
  }

  const version = r0.readU32();
  if (version !== ZR_EVENT_BATCH_VERSION_V1) {
    return fail("ZR_UNSUPPORTED_VERSION", 4, "version must be 1");
  }

  const totalSize = r0.readU32();
  const eventCount = r0.readU32();
  const batchFlags = r0.readU32();
  r0.readU32(); // reserved0

  if (totalSize < HEADER_SIZE) {
    return fail("ZR_SIZE_MISMATCH", 8, "total_size must be >= 24");
  }
  if ((totalSize & 3) !== 0) {
    return fail("ZR_MISALIGNED", 8, "total_size must be 4-byte aligned");
  }
  if (totalSize > bytes.byteLength) {
    return fail("ZR_TRUNCATED", 8, "total_size exceeds input length");
  }
  if (totalSize > maxTotalSize) {
    return fail("ZR_LIMIT", 8, "total_size exceeds maxTotalSize");
  }
  if (eventCount > maxEvents) {
    return fail("ZR_LIMIT", 12, "event_count exceeds maxEvents");
  }

  const bounded = bytes.subarray(0, totalSize);
  const r = new BinaryReader(bounded);
  r.skip(HEADER_SIZE);

  const events: ZrevEvent[] = new Array<ZrevEvent>(eventCount);
  let eventIndex = 0;
  const timeUnwrap = opts.timeUnwrap;
  for (let i = 0; i < eventCount; i++) {
    const recordStart = r.offset;
    if (r.remaining < RECORD_HEADER_SIZE) {
      return fail("ZR_TRUNCATED", recordStart, "truncated record header");
    }

    const type = r.readU32();
    const size = r.readU32();
    const timeMs = unwrapTimeMs(r.readU32(), timeUnwrap);
    r.readU32(); // event flags (ignored)

    if (size < RECORD_HEADER_SIZE) {
      return fail("ZR_INVALID_RECORD", recordStart, "record size must be >= 16");
    }
    if ((size & 3) !== 0) {
      return fail("ZR_MISALIGNED", recordStart, "record size must be 4-byte aligned");
    }

    const payloadBytes = size - RECORD_HEADER_SIZE;
    if (payloadBytes > r.remaining) {
      return fail("ZR_OUT_OF_BOUNDS", recordStart, "record exceeds total_size");
    }

    const payloadStart = r.offset;

    switch (type) {
      case 1: {
        if (payloadBytes !== 16) {
          return fail("ZR_INVALID_RECORD", recordStart, "KEY payload size mismatch");
        }
        const key = r.readU32();
        const mods = r.readU32();
        const actionRaw = r.readU32();
        r.readU32(); // reserved0

        const action =
          actionRaw === 1 ? "down" : actionRaw === 2 ? "up" : actionRaw === 3 ? "repeat" : null;
        if (action === null) return fail("ZR_INVALID_RECORD", recordStart, "KEY invalid action");

        events[eventIndex++] = { kind: "key", timeMs, key, mods, action };
        break;
      }
      case 2: {
        if (payloadBytes !== 8) {
          return fail("ZR_INVALID_RECORD", recordStart, "TEXT payload size mismatch");
        }
        const codepoint = r.readU32();
        r.readU32(); // reserved0
        events[eventIndex++] = { kind: "text", timeMs, codepoint };
        break;
      }
      case 3: {
        if (payloadBytes < 8) {
          return fail("ZR_INVALID_RECORD", recordStart, "PASTE payload too small");
        }
        if (r.remaining < 8) return fail("ZR_TRUNCATED", r.offset, "truncated PASTE header");

        const byteLen = r.readU32();
        r.readU32(); // reserved0

        if (byteLen > maxPasteBytes) {
          return fail("ZR_LIMIT", payloadStart, "paste.byte_len exceeds maxPasteBytes");
        }

        const padded = align4(byteLen);
        const expectedPayloadBytes = 8 + padded;
        if (payloadBytes !== expectedPayloadBytes) {
          return fail("ZR_INVALID_RECORD", recordStart, "PASTE payload size mismatch");
        }
        if (r.remaining < padded) {
          return fail("ZR_TRUNCATED", r.offset, "truncated PASTE bytes");
        }

        const paddedBytes = r.readBytes(padded);
        const data = paddedBytes.subarray(0, byteLen);
        events[eventIndex++] = { kind: "paste", timeMs, bytes: data };
        break;
      }
      case 4: {
        if (payloadBytes !== 32) {
          return fail("ZR_INVALID_RECORD", recordStart, "MOUSE payload size mismatch");
        }
        const x = r.readI32();
        const y = r.readI32();
        const mouseKindRaw = r.readU32();
        const mouseKind: ZrevMouseKind | null =
          mouseKindRaw === 1 ||
          mouseKindRaw === 2 ||
          mouseKindRaw === 3 ||
          mouseKindRaw === 4 ||
          mouseKindRaw === 5
            ? (mouseKindRaw as ZrevMouseKind)
            : null;
        if (mouseKind === null) {
          return fail("ZR_INVALID_RECORD", recordStart, "MOUSE invalid kind");
        }
        const mods = r.readU32();
        const buttons = r.readU32();
        const wheelX = r.readI32();
        const wheelY = r.readI32();
        r.readU32(); // reserved0
        events[eventIndex++] = {
          kind: "mouse",
          timeMs,
          x,
          y,
          mouseKind,
          mods,
          buttons,
          wheelX,
          wheelY,
        };
        break;
      }
      case 5: {
        if (payloadBytes !== 16) {
          return fail("ZR_INVALID_RECORD", recordStart, "RESIZE payload size mismatch");
        }
        const cols = r.readU32();
        const rows = r.readU32();
        r.readU32(); // reserved0
        r.readU32(); // reserved1
        events[eventIndex++] = { kind: "resize", timeMs, cols, rows };
        break;
      }
      case 6: {
        if (payloadBytes !== 16) {
          return fail("ZR_INVALID_RECORD", recordStart, "TICK payload size mismatch");
        }
        const dtMs = r.readU32();
        r.readU32(); // reserved0
        r.readU32(); // reserved1
        r.readU32(); // reserved2
        events[eventIndex++] = { kind: "tick", timeMs, dtMs };
        break;
      }
      case 7: {
        if (payloadBytes < 16) {
          return fail("ZR_INVALID_RECORD", recordStart, "USER payload too small");
        }
        if (r.remaining < 16) return fail("ZR_TRUNCATED", r.offset, "truncated USER header");

        const tag = r.readU32();
        const byteLen = r.readU32();
        r.readU32(); // reserved0
        r.readU32(); // reserved1

        if (byteLen > maxUserPayloadBytes) {
          return fail("ZR_LIMIT", payloadStart + 4, "user.byte_len exceeds maxUserPayloadBytes");
        }

        const padded = align4(byteLen);
        const expectedPayloadBytes = 16 + padded;
        if (payloadBytes !== expectedPayloadBytes) {
          return fail("ZR_INVALID_RECORD", recordStart, "USER payload size mismatch");
        }
        if (r.remaining < padded) {
          return fail("ZR_TRUNCATED", r.offset, "truncated USER payload");
        }

        const paddedBytes = r.readBytes(padded);
        const payload = paddedBytes.subarray(0, byteLen);
        events[eventIndex++] = { kind: "user", timeMs, tag, payload };
        break;
      }
      default:
        return fail("ZR_INVALID_RECORD", recordStart, `unknown record type: ${type}`);
    }
  }

  if (r.offset !== totalSize) {
    return fail("ZR_SIZE_MISMATCH", r.offset, "cursor does not match total_size");
  }

  if (eventIndex < events.length) events.length = eventIndex;
  return { ok: true, value: { flags: batchFlags, events } };
}
