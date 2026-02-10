/**
 * packages/core/src/debug/__tests__/parsers.test.ts — Debug parser tests.
 *
 * Why: Verifies that debug record parsers correctly decode binary payloads
 * and handle edge cases like truncated buffers and invalid data.
 */

import { assert, describe, test } from "@rezi-ui/testkit";
import {
  DEBUG_DRAWLIST_RECORD_SIZE,
  DEBUG_ERROR_RECORD_SIZE,
  DEBUG_EVENT_RECORD_SIZE,
  DEBUG_FRAME_RECORD_SIZE,
  DEBUG_PERF_RECORD_SIZE,
  DEBUG_QUERY_RESULT_SIZE,
  DEBUG_RECORD_HEADER_SIZE,
  DEBUG_STATS_SIZE,
} from "../constants.js";
import {
  parseDrawlistRecord,
  parseErrorRecord,
  parseEventRecord,
  parseFrameRecord,
  parsePerfRecord,
  parseQueryResult,
  parseRecordHeader,
  parseStats,
} from "../parsers.js";

/** Create a buffer with space for the struct and write little-endian values. */
function createBuffer(size: number): { buf: Uint8Array; dv: DataView } {
  const buf = new Uint8Array(size);
  const dv = new DataView(buf.buffer);
  return { buf, dv };
}

/** Write a u64 value as two u32s (little-endian). */
function writeU64(dv: DataView, offset: number, value: bigint): void {
  dv.setUint32(offset, Number(value & 0xffffffffn), true);
  dv.setUint32(offset + 4, Number((value >> 32n) & 0xffffffffn), true);
}

describe("parseRecordHeader", () => {
  test("parses valid header", () => {
    const { buf, dv } = createBuffer(DEBUG_RECORD_HEADER_SIZE);

    // record_id: 123
    writeU64(dv, 0, 123n);
    // timestamp_us: 456789
    writeU64(dv, 8, 456789n);
    // frame_id: 10
    writeU64(dv, 16, 10n);
    // category: 1 (frame)
    dv.setUint32(24, 1, true);
    // severity: 1 (info)
    dv.setUint32(28, 1, true);
    // code: 42
    dv.setUint32(32, 42, true);
    // payload_size: 56
    dv.setUint32(36, 56, true);

    const result = parseRecordHeader(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.recordId, 123n);
    assert.equal(result.value.timestampUs, 456789n);
    assert.equal(result.value.frameId, 10n);
    assert.equal(result.value.category, "frame");
    assert.equal(result.value.severity, "info");
    assert.equal(result.value.code, 42);
    assert.equal(result.value.payloadSize, 56);
  });

  test("returns error for truncated buffer", () => {
    const buf = new Uint8Array(DEBUG_RECORD_HEADER_SIZE - 1);
    const result = parseRecordHeader(buf);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "ZR_TRUNCATED");
  });

  test("returns error for invalid category", () => {
    const { buf, dv } = createBuffer(DEBUG_RECORD_HEADER_SIZE);
    dv.setUint32(24, 99, true); // Invalid category
    dv.setUint32(28, 1, true); // Valid severity

    const result = parseRecordHeader(buf);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "ZR_DEBUG_INVALID_CATEGORY");
  });

  test("returns error for invalid severity", () => {
    const { buf, dv } = createBuffer(DEBUG_RECORD_HEADER_SIZE);
    dv.setUint32(24, 1, true); // Valid category
    dv.setUint32(28, 99, true); // Invalid severity

    const result = parseRecordHeader(buf);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.error.code, "ZR_DEBUG_INVALID_SEVERITY");
  });

  test("parses header at non-zero offset", () => {
    const { buf, dv } = createBuffer(DEBUG_RECORD_HEADER_SIZE + 8);

    // Write header at offset 8
    writeU64(dv, 8, 999n); // record_id
    writeU64(dv, 16, 1000n); // timestamp_us
    writeU64(dv, 24, 5n); // frame_id
    dv.setUint32(32, 2, true); // category: event
    dv.setUint32(36, 2, true); // severity: warn
    dv.setUint32(40, 100, true); // code
    dv.setUint32(44, 24, true); // payload_size

    const result = parseRecordHeader(buf, 8);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.recordId, 999n);
    assert.equal(result.value.category, "event");
    assert.equal(result.value.severity, "warn");
  });
});

describe("parseFrameRecord", () => {
  test("parses valid frame record", () => {
    const { buf, dv } = createBuffer(DEBUG_FRAME_RECORD_SIZE);

    writeU64(dv, 0, 42n); // frame_id
    dv.setUint32(8, 80, true); // cols
    dv.setUint32(12, 24, true); // rows
    dv.setUint32(16, 1024, true); // drawlist_bytes
    dv.setUint32(20, 50, true); // drawlist_cmds
    dv.setUint32(24, 512, true); // diff_bytes_emitted
    dv.setUint32(28, 5, true); // dirty_lines
    dv.setUint32(32, 100, true); // dirty_cells
    dv.setUint32(36, 3, true); // damage_rects
    dv.setUint32(40, 1000, true); // us_drawlist
    dv.setUint32(44, 500, true); // us_diff
    dv.setUint32(48, 200, true); // us_write

    const result = parseFrameRecord(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.frameId, 42n);
    assert.equal(result.value.cols, 80);
    assert.equal(result.value.rows, 24);
    assert.equal(result.value.drawlistBytes, 1024);
    assert.equal(result.value.drawlistCmds, 50);
    assert.equal(result.value.diffBytesEmitted, 512);
    assert.equal(result.value.dirtyLines, 5);
    assert.equal(result.value.dirtyCells, 100);
    assert.equal(result.value.damageRects, 3);
    assert.equal(result.value.usDrawlist, 1000);
    assert.equal(result.value.usDiff, 500);
    assert.equal(result.value.usWrite, 200);
  });

  test("returns error for truncated buffer", () => {
    const buf = new Uint8Array(DEBUG_FRAME_RECORD_SIZE - 1);
    const result = parseFrameRecord(buf);
    assert.equal(result.ok, false);
  });
});

describe("parseEventRecord", () => {
  test("parses valid event record", () => {
    const { buf, dv } = createBuffer(DEBUG_EVENT_RECORD_SIZE);

    writeU64(dv, 0, 100n); // frame_id
    dv.setUint32(8, 1, true); // event_type (key)
    dv.setUint32(12, 0, true); // event_flags
    dv.setUint32(16, 12345, true); // time_ms
    dv.setUint32(20, 0, true); // raw_bytes_len
    dv.setUint32(24, 0, true); // parse_result (OK)

    const result = parseEventRecord(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.frameId, 100n);
    assert.equal(result.value.eventType, 1);
    assert.equal(result.value.timeMs, 12345);
    assert.equal(result.value.parseResult, 0);
  });
});

describe("parseErrorRecord", () => {
  test("parses valid error record with strings", () => {
    const { buf, dv } = createBuffer(DEBUG_ERROR_RECORD_SIZE);

    writeU64(dv, 0, 50n); // frame_id
    dv.setUint32(8, -1, true); // error_code (cast as u32)
    dv.setUint32(12, 123, true); // source_line
    dv.setUint32(16, 5, true); // occurrence_count

    // source_file at offset 24 (32 bytes)
    const sourceFile = "test.c";
    for (let i = 0; i < sourceFile.length; i++) {
      buf[24 + i] = sourceFile.charCodeAt(i);
    }

    // message at offset 56 (64 bytes)
    const message = "Test error message";
    for (let i = 0; i < message.length; i++) {
      buf[56 + i] = message.charCodeAt(i);
    }

    const result = parseErrorRecord(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.frameId, 50n);
    assert.equal(result.value.sourceLine, 123);
    assert.equal(result.value.occurrenceCount, 5);
    assert.equal(result.value.sourceFile, "test.c");
    assert.equal(result.value.message, "Test error message");
  });
});

describe("parseDrawlistRecord", () => {
  test("parses valid drawlist record", () => {
    const { buf, dv } = createBuffer(DEBUG_DRAWLIST_RECORD_SIZE);

    writeU64(dv, 0, 30n); // frame_id
    dv.setUint32(8, 2048, true); // total_bytes
    dv.setUint32(12, 100, true); // cmd_count
    dv.setUint32(16, 1, true); // version
    dv.setUint32(20, 0, true); // validation_result
    dv.setUint32(24, 0, true); // execution_result
    dv.setUint32(28, 4, true); // clip_stack_max_depth
    dv.setUint32(32, 50, true); // text_runs
    dv.setUint32(36, 20, true); // fill_rects

    const result = parseDrawlistRecord(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.frameId, 30n);
    assert.equal(result.value.totalBytes, 2048);
    assert.equal(result.value.cmdCount, 100);
    assert.equal(result.value.version, 1);
    assert.equal(result.value.validationResult, 0);
    assert.equal(result.value.clipStackMaxDepth, 4);
    assert.equal(result.value.textRuns, 50);
    assert.equal(result.value.fillRects, 20);
  });
});

describe("parsePerfRecord", () => {
  test("parses valid perf record", () => {
    const { buf, dv } = createBuffer(DEBUG_PERF_RECORD_SIZE);

    writeU64(dv, 0, 25n); // frame_id
    dv.setUint32(8, 1, true); // phase (submit)
    dv.setUint32(12, 500, true); // us_elapsed
    dv.setUint32(16, 1024, true); // bytes_processed

    const result = parsePerfRecord(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.frameId, 25n);
    assert.equal(result.value.phase, 1);
    assert.equal(result.value.usElapsed, 500);
    assert.equal(result.value.bytesProcessed, 1024);
  });
});

describe("parseStats", () => {
  test("parses valid stats", () => {
    const { buf, dv } = createBuffer(DEBUG_STATS_SIZE);

    writeU64(dv, 0, 1000n); // total_records
    writeU64(dv, 8, 50n); // total_dropped
    dv.setUint32(16, 10, true); // error_count
    dv.setUint32(20, 25, true); // warn_count
    dv.setUint32(24, 500, true); // current_ring_usage
    dv.setUint32(28, 1000, true); // ring_capacity

    const result = parseStats(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.totalRecords, 1000n);
    assert.equal(result.value.totalDropped, 50n);
    assert.equal(result.value.errorCount, 10);
    assert.equal(result.value.warnCount, 25);
    assert.equal(result.value.currentRingUsage, 500);
    assert.equal(result.value.ringCapacity, 1000);
  });
});

describe("parseQueryResult", () => {
  test("parses valid query result", () => {
    const { buf, dv } = createBuffer(DEBUG_QUERY_RESULT_SIZE);

    dv.setUint32(0, 50, true); // records_returned
    dv.setUint32(4, 100, true); // records_available
    writeU64(dv, 8, 1n); // oldest_record_id
    writeU64(dv, 16, 100n); // newest_record_id
    dv.setUint32(24, 5, true); // records_dropped

    const result = parseQueryResult(buf);
    assert.equal(result.ok, true);
    if (!result.ok) return;

    assert.equal(result.value.recordsReturned, 50);
    assert.equal(result.value.recordsAvailable, 100);
    assert.equal(result.value.oldestRecordId, 1n);
    assert.equal(result.value.newestRecordId, 100n);
    assert.equal(result.value.recordsDropped, 5);
  });
});
