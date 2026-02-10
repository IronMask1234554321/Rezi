/**
 * packages/core/src/debug/frameInspector.ts — Frame snapshot collection and analysis.
 *
 * Why: Provides frame-by-frame inspection capabilities for diagnosing rendering
 * issues. Captures frame metrics from the debug trace and enables comparison
 * between frames to identify regressions or anomalies.
 *
 * Usage:
 *   - getSnapshots(N): Get last N frame snapshots
 *   - getFrame(frameId): Get specific frame
 *   - compareFrames(a, b): Compare two frames field-by-field
 */

import type { FrameRecord } from "./types.js";

/**
 * Frame snapshot with metrics for a single rendered frame.
 */
export type FrameSnapshot = Readonly<{
  frameId: bigint;
  timestamp: number;
  cols: number;
  rows: number;
  drawlistBytes: number;
  drawlistCmds: number;
  diffBytesEmitted: number;
  dirtyLines: number;
  dirtyCells: number;
  damageRects: number;
  usDrawlist: number;
  usDiff: number;
  usWrite: number;
}>;

/**
 * Field-level change between two frame snapshots.
 */
export type FrameFieldChange = Readonly<{
  field: string;
  before: unknown;
  after: unknown;
}>;

/**
 * Difference between two frame snapshots.
 */
export type FrameDiff = Readonly<{
  frameA: bigint;
  frameB: bigint;
  changed: readonly FrameFieldChange[];
}>;

/**
 * Frame inspector interface for analyzing frame history.
 */
export interface FrameInspector {
  /**
   * Add a frame record to the inspector.
   * Called internally when processing debug records.
   */
  addFrame(record: FrameRecord, timestampUs: bigint): void;

  /**
   * Get the last N frame snapshots.
   * @param last - Number of frames to return (default: all)
   */
  getSnapshots(last?: number): readonly FrameSnapshot[];

  /**
   * Get a specific frame by ID.
   * @param frameId - The frame ID to look up
   */
  getFrame(frameId: bigint): FrameSnapshot | null;

  /**
   * Compare two frames and return the differences.
   * @param a - First frame ID
   * @param b - Second frame ID
   */
  compareFrames(a: bigint, b: bigint): FrameDiff | null;

  /**
   * Clear all stored frame snapshots.
   */
  clear(): void;

  /**
   * Get the number of stored snapshots.
   */
  readonly count: number;
}

/** Default maximum number of frames to retain. */
const DEFAULT_MAX_FRAMES = 1000;

function normalizeMaxFrames(maxFrames: number): number {
  if (!Number.isFinite(maxFrames)) return DEFAULT_MAX_FRAMES;
  if (!Number.isInteger(maxFrames)) return DEFAULT_MAX_FRAMES;
  if (maxFrames < 0) return 0;
  return maxFrames;
}

/**
 * Create a frame inspector instance.
 *
 * @param maxFrames - Maximum number of frames to retain (default: 1000)
 */
export function createFrameInspector(maxFrames: number = DEFAULT_MAX_FRAMES): FrameInspector {
  const frames: Map<bigint, FrameSnapshot> = new Map();
  const frameOrder: bigint[] = [];
  let head = 0;

  const cap = normalizeMaxFrames(maxFrames);

  function addFrame(record: FrameRecord, timestampUs: bigint): void {
    const snapshot: FrameSnapshot = {
      frameId: record.frameId,
      timestamp: Number(timestampUs) / 1000, // Convert to ms
      cols: record.cols,
      rows: record.rows,
      drawlistBytes: record.drawlistBytes,
      drawlistCmds: record.drawlistCmds,
      diffBytesEmitted: record.diffBytesEmitted,
      dirtyLines: record.dirtyLines,
      dirtyCells: record.dirtyCells,
      damageRects: record.damageRects,
      usDrawlist: record.usDrawlist,
      usDiff: record.usDiff,
      usWrite: record.usWrite,
    };

    // If frame already exists, update it
    if (!frames.has(record.frameId)) {
      frameOrder.push(record.frameId);
    }
    frames.set(record.frameId, snapshot);

    // Evict oldest frames if over capacity
    while (frameOrder.length - head > cap) {
      const oldest = frameOrder[head];
      if (oldest !== undefined) frames.delete(oldest);
      head++;
    }

    // Avoid unbounded growth from a moving head index.
    if (head > 0 && head * 2 >= frameOrder.length) {
      frameOrder.splice(0, head);
      head = 0;
    }
  }

  function getSnapshots(last?: number): readonly FrameSnapshot[] {
    const result: FrameSnapshot[] = [];
    const start =
      last !== undefined
        ? Math.max(head, frameOrder.length - last)
        : Math.min(head, frameOrder.length);

    for (let i = start; i < frameOrder.length; i++) {
      const id = frameOrder[i];
      if (id !== undefined) {
        const snapshot = frames.get(id);
        if (snapshot) {
          result.push(snapshot);
        }
      }
    }

    return result;
  }

  function getFrame(frameId: bigint): FrameSnapshot | null {
    return frames.get(frameId) ?? null;
  }

  function compareFrames(a: bigint, b: bigint): FrameDiff | null {
    const frameA = frames.get(a);
    const frameB = frames.get(b);

    if (!frameA || !frameB) {
      return null;
    }

    const changed: FrameFieldChange[] = [];
    const fieldsToCompare: (keyof FrameSnapshot)[] = [
      "cols",
      "rows",
      "drawlistBytes",
      "drawlistCmds",
      "diffBytesEmitted",
      "dirtyLines",
      "dirtyCells",
      "damageRects",
      "usDrawlist",
      "usDiff",
      "usWrite",
    ];

    for (const field of fieldsToCompare) {
      const beforeVal = frameA[field];
      const afterVal = frameB[field];
      if (beforeVal !== afterVal) {
        changed.push({
          field,
          before: beforeVal,
          after: afterVal,
        });
      }
    }

    return {
      frameA: a,
      frameB: b,
      changed,
    };
  }

  function clear(): void {
    frames.clear();
    frameOrder.length = 0;
    head = 0;
  }

  return {
    addFrame,
    getSnapshots,
    getFrame,
    compareFrames,
    clear,
    get count() {
      return frames.size;
    },
  };
}
