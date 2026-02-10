/**
 * packages/core/src/debug/parsers.ts — Binary parsers for debug trace records.
 *
 * Why: Parses the binary debug record structures produced by the Zireael C engine
 * into type-safe TypeScript objects. Enforces strict validation of all fields
 * before producing output, ensuring no partial/invalid records propagate.
 *
 * Binary safety rules:
 *   - All reads validate bounds before access
 *   - DataView constructed with correct byteOffset
 *   - Little-endian byte order enforced
 *   - Return ParseResult (no thrown exceptions for parse failures)
 *
 * @see docs/protocol/safety.md
 */

import { BinaryReader } from "../binary/reader.js";
import {
  DEBUG_DRAWLIST_RECORD_SIZE,
  DEBUG_ERROR_RECORD_SIZE,
  DEBUG_EVENT_RECORD_SIZE,
  DEBUG_FRAME_RECORD_SIZE,
  DEBUG_PERF_RECORD_SIZE,
  DEBUG_QUERY_RESULT_SIZE,
  DEBUG_RECORD_HEADER_SIZE,
  DEBUG_STATS_SIZE,
  categoryFromNum,
  severityFromNum,
} from "./constants.js";
import type {
  DebugParseError,
  DebugParseResult,
  DebugQueryResult,
  DebugRecordHeader,
  DebugStats,
  DrawlistBytesPayload,
  DrawlistRecord,
  ErrorRecord,
  EventRecord,
  FrameRecord,
  PerfRecord,
} from "./types.js";

/** Construct a parse failure result with error context. */
function fail<T>(
  code: DebugParseError["code"],
  offset: number,
  detail: string,
): DebugParseResult<T> {
  return { ok: false, error: { code, offset, detail } };
}

/**
 * Read a u64 value as bigint from a BinaryReader.
 * Reads as two u32 values (little-endian) and combines them.
 */
function readU64(r: BinaryReader): bigint {
  const lo = r.readU32();
  const hi = r.readU32();
  return BigInt(lo) | (BigInt(hi) << 32n);
}

/**
 * Read a null-terminated string from a fixed-size buffer.
 * Decodes as UTF-8, truncating at the first null byte.
 */
function readFixedString(bytes: Uint8Array): string {
  let end = bytes.indexOf(0);
  if (end === -1) end = bytes.length;
  const slice = bytes.subarray(0, end);
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(slice);
  } catch {
    return "";
  }
}

/**
 * Parse a debug record header from bytes.
 *
 * Layout (40 bytes):
 *   - record_id: u64 (bytes 0-7)
 *   - timestamp_us: u64 (bytes 8-15)
 *   - frame_id: u64 (bytes 16-23)
 *   - category: u32 (bytes 24-27)
 *   - severity: u32 (bytes 28-31)
 *   - code: u32 (bytes 32-35)
 *   - payload_size: u32 (bytes 36-39)
 *
 * @param bytes - Raw bytes containing the header
 * @param offset - Starting offset in bytes (default 0)
 */
export function parseRecordHeader(
  bytes: Uint8Array,
  offset = 0,
): DebugParseResult<DebugRecordHeader> {
  if (bytes.byteLength - offset < DEBUG_RECORD_HEADER_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      offset,
      `need ${DEBUG_RECORD_HEADER_SIZE} bytes for header but only ${bytes.byteLength - offset} available`,
    );
  }

  const slice = bytes.subarray(offset, offset + DEBUG_RECORD_HEADER_SIZE);
  const r = new BinaryReader(slice);

  const recordId = readU64(r);
  const timestampUs = readU64(r);
  const frameId = readU64(r);
  const categoryNum = r.readU32();
  const severityNum = r.readU32();
  const code = r.readU32();
  const payloadSize = r.readU32();

  const category = categoryFromNum(categoryNum);
  if (category === null) {
    return fail("ZR_DEBUG_INVALID_CATEGORY", offset + 24, `invalid category: ${categoryNum}`);
  }

  const severity = severityFromNum(severityNum);
  if (severity === null) {
    return fail("ZR_DEBUG_INVALID_SEVERITY", offset + 28, `invalid severity: ${severityNum}`);
  }

  return {
    ok: true,
    value: {
      recordId,
      timestampUs,
      frameId,
      category,
      severity,
      code,
      payloadSize,
    },
  };
}

/**
 * Parse a frame record payload.
 *
 * Layout (56 bytes):
 *   - frame_id: u64 (bytes 0-7)
 *   - cols: u32 (bytes 8-11)
 *   - rows: u32 (bytes 12-15)
 *   - drawlist_bytes: u32 (bytes 16-19)
 *   - drawlist_cmds: u32 (bytes 20-23)
 *   - diff_bytes_emitted: u32 (bytes 24-27)
 *   - dirty_lines: u32 (bytes 28-31)
 *   - dirty_cells: u32 (bytes 32-35)
 *   - damage_rects: u32 (bytes 36-39)
 *   - us_drawlist: u32 (bytes 40-43)
 *   - us_diff: u32 (bytes 44-47)
 *   - us_write: u32 (bytes 48-51)
 *   - _pad0: u32 (bytes 52-55)
 */
export function parseFrameRecord(bytes: Uint8Array): DebugParseResult<FrameRecord> {
  if (bytes.byteLength < DEBUG_FRAME_RECORD_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${DEBUG_FRAME_RECORD_SIZE} bytes for frame record but only ${bytes.byteLength} available`,
    );
  }

  const r = new BinaryReader(bytes);

  const frameId = readU64(r);
  const cols = r.readU32();
  const rows = r.readU32();
  const drawlistBytes = r.readU32();
  const drawlistCmds = r.readU32();
  const diffBytesEmitted = r.readU32();
  const dirtyLines = r.readU32();
  const dirtyCells = r.readU32();
  const damageRects = r.readU32();
  const usDrawlist = r.readU32();
  const usDiff = r.readU32();
  const usWrite = r.readU32();
  // Skip _pad0

  return {
    ok: true,
    value: {
      frameId,
      cols,
      rows,
      drawlistBytes,
      drawlistCmds,
      diffBytesEmitted,
      dirtyLines,
      dirtyCells,
      damageRects,
      usDrawlist,
      usDiff,
      usWrite,
    },
  };
}

/**
 * Parse an event record payload.
 *
 * Layout (32 bytes):
 *   - frame_id: u64 (bytes 0-7)
 *   - event_type: u32 (bytes 8-11)
 *   - event_flags: u32 (bytes 12-15)
 *   - time_ms: u32 (bytes 16-19)
 *   - raw_bytes_len: u32 (bytes 20-23)
 *   - parse_result: u32 (bytes 24-27)
 *   - _pad0: u32 (bytes 28-31)
 */
export function parseEventRecord(bytes: Uint8Array): DebugParseResult<EventRecord> {
  if (bytes.byteLength < DEBUG_EVENT_RECORD_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${DEBUG_EVENT_RECORD_SIZE} bytes for event record but only ${bytes.byteLength} available`,
    );
  }

  const r = new BinaryReader(bytes);

  const frameId = readU64(r);
  const eventType = r.readU32();
  const eventFlags = r.readU32();
  const timeMs = r.readU32();
  const rawBytesLen = r.readU32();
  const parseResult = r.readU32();
  r.readU32(); // Skip _pad0

  return {
    ok: true,
    value: {
      frameId,
      eventType,
      eventFlags,
      timeMs,
      rawBytesLen,
      parseResult,
    },
  };
}

/**
 * Parse an error record payload.
 *
 * Layout (120 bytes):
 *   - frame_id: u64 (bytes 0-7)
 *   - error_code: u32 (bytes 8-11)
 *   - source_line: u32 (bytes 12-15)
 *   - occurrence_count: u32 (bytes 16-19)
 *   - _pad0: u32 (bytes 20-23)
 *   - source_file: char[32] (bytes 24-55)
 *   - message: char[64] (bytes 56-119)
 */
export function parseErrorRecord(bytes: Uint8Array): DebugParseResult<ErrorRecord> {
  if (bytes.byteLength < DEBUG_ERROR_RECORD_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${DEBUG_ERROR_RECORD_SIZE} bytes for error record but only ${bytes.byteLength} available`,
    );
  }

  const r = new BinaryReader(bytes);

  const frameId = readU64(r);
  const errorCode = r.readU32();
  const sourceLine = r.readU32();
  const occurrenceCount = r.readU32();
  r.readU32(); // _pad0

  const sourceFileBytes = r.readBytes(32);
  const messageBytes = r.readBytes(64);

  const sourceFile = readFixedString(sourceFileBytes);
  const message = readFixedString(messageBytes);

  return {
    ok: true,
    value: {
      frameId,
      errorCode,
      sourceLine,
      occurrenceCount,
      sourceFile,
      message,
    },
  };
}

/**
 * Parse a drawlist record payload.
 *
 * Layout (48 bytes):
 *   - frame_id: u64 (bytes 0-7)
 *   - total_bytes: u32 (bytes 8-11)
 *   - cmd_count: u32 (bytes 12-15)
 *   - version: u32 (bytes 16-19)
 *   - validation_result: u32 (bytes 20-23)
 *   - execution_result: u32 (bytes 24-27)
 *   - clip_stack_max_depth: u32 (bytes 28-31)
 *   - text_runs: u32 (bytes 32-35)
 *   - fill_rects: u32 (bytes 36-39)
 *   - _pad0: u32 (bytes 40-43)
 *   - _pad1: u32 (bytes 44-47)
 */
export function parseDrawlistRecord(bytes: Uint8Array): DebugParseResult<DrawlistRecord> {
  if (bytes.byteLength < DEBUG_DRAWLIST_RECORD_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${DEBUG_DRAWLIST_RECORD_SIZE} bytes for drawlist record but only ${bytes.byteLength} available`,
    );
  }

  const r = new BinaryReader(bytes);

  const frameId = readU64(r);
  const totalBytes = r.readU32();
  const cmdCount = r.readU32();
  const version = r.readU32();
  const validationResult = r.readU32();
  const executionResult = r.readU32();
  const clipStackMaxDepth = r.readU32();
  const textRuns = r.readU32();
  const fillRects = r.readU32();
  // Skip _pad0, _pad1

  return {
    ok: true,
    value: {
      frameId,
      totalBytes,
      cmdCount,
      version,
      validationResult,
      executionResult,
      clipStackMaxDepth,
      textRuns,
      fillRects,
    },
  };
}

/**
 * Parse a performance record payload.
 *
 * Layout (24 bytes):
 *   - frame_id: u64 (bytes 0-7)
 *   - phase: u32 (bytes 8-11)
 *   - us_elapsed: u32 (bytes 12-15)
 *   - bytes_processed: u32 (bytes 16-19)
 *   - _pad0: u32 (bytes 20-23)
 */
export function parsePerfRecord(bytes: Uint8Array): DebugParseResult<PerfRecord> {
  if (bytes.byteLength < DEBUG_PERF_RECORD_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${DEBUG_PERF_RECORD_SIZE} bytes for perf record but only ${bytes.byteLength} available`,
    );
  }

  const r = new BinaryReader(bytes);

  const frameId = readU64(r);
  const phase = r.readU32();
  const usElapsed = r.readU32();
  const bytesProcessed = r.readU32();
  // Skip _pad0

  return {
    ok: true,
    value: {
      frameId,
      phase,
      usElapsed,
      bytesProcessed,
    },
  };
}

/**
 * Parse a debug query result.
 *
 * Layout (32 bytes):
 *   - records_returned: u32 (bytes 0-3)
 *   - records_available: u32 (bytes 4-7)
 *   - oldest_record_id: u64 (bytes 8-15)
 *   - newest_record_id: u64 (bytes 16-23)
 *   - records_dropped: u32 (bytes 24-27)
 *   - _pad0: u32 (bytes 28-31)
 */
export function parseQueryResult(bytes: Uint8Array): DebugParseResult<DebugQueryResult> {
  if (bytes.byteLength < DEBUG_QUERY_RESULT_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${DEBUG_QUERY_RESULT_SIZE} bytes for query result but only ${bytes.byteLength} available`,
    );
  }

  const r = new BinaryReader(bytes);

  const recordsReturned = r.readU32();
  const recordsAvailable = r.readU32();
  const oldestRecordId = readU64(r);
  const newestRecordId = readU64(r);
  const recordsDropped = r.readU32();
  // Skip _pad0

  return {
    ok: true,
    value: {
      recordsReturned,
      recordsAvailable,
      oldestRecordId,
      newestRecordId,
      recordsDropped,
    },
  };
}

/**
 * Parse debug statistics.
 *
 * Layout (32 bytes):
 *   - total_records: u64 (bytes 0-7)
 *   - total_dropped: u64 (bytes 8-15)
 *   - error_count: u32 (bytes 16-19)
 *   - warn_count: u32 (bytes 20-23)
 *   - current_ring_usage: u32 (bytes 24-27)
 *   - ring_capacity: u32 (bytes 28-31)
 */
export function parseStats(bytes: Uint8Array): DebugParseResult<DebugStats> {
  if (bytes.byteLength < DEBUG_STATS_SIZE) {
    return fail(
      "ZR_TRUNCATED",
      0,
      `need ${DEBUG_STATS_SIZE} bytes for stats but only ${bytes.byteLength} available`,
    );
  }

  const r = new BinaryReader(bytes);

  const totalRecords = readU64(r);
  const totalDropped = readU64(r);
  const errorCount = r.readU32();
  const warnCount = r.readU32();
  const currentRingUsage = r.readU32();
  const ringCapacity = r.readU32();

  return {
    ok: true,
    value: {
      totalRecords,
      totalDropped,
      errorCount,
      warnCount,
      currentRingUsage,
      ringCapacity,
    },
  };
}

/**
 * Parse the payload for a record based on its category.
 *
 * @param category - The record category
 * @param bytes - The payload bytes
 * @returns The parsed payload or null if category has no payload
 */
export function parsePayload(
  category: string,
  bytes: Uint8Array,
): DebugParseResult<
  | FrameRecord
  | EventRecord
  | ErrorRecord
  | DrawlistRecord
  | DrawlistBytesPayload
  | PerfRecord
  | null
> {
  switch (category) {
    case "frame":
      return parseFrameRecord(bytes);
    case "event":
      return parseEventRecord(bytes);
    case "error":
      return parseErrorRecord(bytes);
    case "drawlist":
      if (bytes.byteLength === DEBUG_DRAWLIST_RECORD_SIZE) {
        return parseDrawlistRecord(bytes);
      }
      return { ok: true, value: { kind: "drawlistBytes", bytes } };
    case "perf":
      return parsePerfRecord(bytes);
    case "none":
    case "state":
      // These categories may not have structured payloads
      return { ok: true, value: null };
    default:
      return fail("ZR_DEBUG_INVALID_CATEGORY", 0, `unknown category: ${category}`);
  }
}
