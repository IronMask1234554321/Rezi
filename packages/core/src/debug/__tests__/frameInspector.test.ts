/**
 * packages/core/src/debug/__tests__/frameInspector.test.ts — Frame inspector tests.
 *
 * Why: Verifies that the frame inspector correctly stores, retrieves, and
 * compares frame snapshots.
 */

import { assert, describe, test } from "@rezi-ui/testkit";
import { createFrameInspector } from "../frameInspector.js";
import type { FrameRecord } from "../types.js";

function makeFrameRecord(frameId: bigint, overrides: Partial<FrameRecord> = {}): FrameRecord {
  return {
    frameId,
    cols: 80,
    rows: 24,
    drawlistBytes: 1024,
    drawlistCmds: 50,
    diffBytesEmitted: 512,
    dirtyLines: 5,
    dirtyCells: 100,
    damageRects: 3,
    usDrawlist: 1000,
    usDiff: 500,
    usWrite: 200,
    ...overrides,
  };
}

describe("createFrameInspector", () => {
  test("creates empty inspector", () => {
    const inspector = createFrameInspector();
    assert.equal(inspector.count, 0);
    assert.deepEqual(inspector.getSnapshots(), []);
  });

  test("adds frame and retrieves by id", () => {
    const inspector = createFrameInspector();
    const record = makeFrameRecord(1n);

    inspector.addFrame(record, 1000000n);

    assert.equal(inspector.count, 1);
    const frame = inspector.getFrame(1n);
    assert.notEqual(frame, null);
    assert.equal(frame?.frameId, 1n);
    assert.equal(frame?.cols, 80);
    assert.equal(frame?.timestamp, 1000); // 1000000us = 1000ms
  });

  test("returns null for non-existent frame", () => {
    const inspector = createFrameInspector();
    assert.equal(inspector.getFrame(999n), null);
  });

  test("getSnapshots returns frames in order", () => {
    const inspector = createFrameInspector();

    inspector.addFrame(makeFrameRecord(1n), 1000000n);
    inspector.addFrame(makeFrameRecord(2n), 2000000n);
    inspector.addFrame(makeFrameRecord(3n), 3000000n);

    const snapshots = inspector.getSnapshots();
    assert.equal(snapshots.length, 3);
    assert.equal(snapshots[0]?.frameId, 1n);
    assert.equal(snapshots[1]?.frameId, 2n);
    assert.equal(snapshots[2]?.frameId, 3n);
  });

  test("getSnapshots with limit returns last N frames", () => {
    const inspector = createFrameInspector();

    inspector.addFrame(makeFrameRecord(1n), 1000000n);
    inspector.addFrame(makeFrameRecord(2n), 2000000n);
    inspector.addFrame(makeFrameRecord(3n), 3000000n);

    const snapshots = inspector.getSnapshots(2);
    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]?.frameId, 2n);
    assert.equal(snapshots[1]?.frameId, 3n);
  });

  test("compareFrames identifies changed fields", () => {
    const inspector = createFrameInspector();

    inspector.addFrame(makeFrameRecord(1n, { cols: 80, rows: 24 }), 1000000n);
    inspector.addFrame(makeFrameRecord(2n, { cols: 120, rows: 40 }), 2000000n);

    const diff = inspector.compareFrames(1n, 2n);
    assert.notEqual(diff, null);
    assert.equal(diff?.frameA, 1n);
    assert.equal(diff?.frameB, 2n);

    const colsChange = diff?.changed.find((c) => c.field === "cols");
    assert.notEqual(colsChange, undefined);
    assert.equal(colsChange?.before, 80);
    assert.equal(colsChange?.after, 120);

    const rowsChange = diff?.changed.find((c) => c.field === "rows");
    assert.notEqual(rowsChange, undefined);
    assert.equal(rowsChange?.before, 24);
    assert.equal(rowsChange?.after, 40);
  });

  test("compareFrames returns null for non-existent frames", () => {
    const inspector = createFrameInspector();
    inspector.addFrame(makeFrameRecord(1n), 1000000n);

    assert.equal(inspector.compareFrames(1n, 999n), null);
    assert.equal(inspector.compareFrames(999n, 1n), null);
  });

  test("evicts old frames when capacity exceeded", () => {
    const inspector = createFrameInspector(3);

    inspector.addFrame(makeFrameRecord(1n), 1000000n);
    inspector.addFrame(makeFrameRecord(2n), 2000000n);
    inspector.addFrame(makeFrameRecord(3n), 3000000n);
    inspector.addFrame(makeFrameRecord(4n), 4000000n);

    assert.equal(inspector.count, 3);
    assert.equal(inspector.getFrame(1n), null); // Evicted
    assert.notEqual(inspector.getFrame(2n), null);
    assert.notEqual(inspector.getFrame(3n), null);
    assert.notEqual(inspector.getFrame(4n), null);
  });

  test("clear removes all frames", () => {
    const inspector = createFrameInspector();

    inspector.addFrame(makeFrameRecord(1n), 1000000n);
    inspector.addFrame(makeFrameRecord(2n), 2000000n);
    inspector.clear();

    assert.equal(inspector.count, 0);
    assert.equal(inspector.getFrame(1n), null);
    assert.deepEqual(inspector.getSnapshots(), []);
  });

  test("updating same frame replaces previous snapshot", () => {
    const inspector = createFrameInspector();

    inspector.addFrame(makeFrameRecord(1n, { cols: 80 }), 1000000n);
    inspector.addFrame(makeFrameRecord(1n, { cols: 120 }), 2000000n);

    assert.equal(inspector.count, 1);
    const frame = inspector.getFrame(1n);
    assert.equal(frame?.cols, 120);
  });
});
