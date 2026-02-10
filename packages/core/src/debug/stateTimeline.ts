/**
 * packages/core/src/debug/stateTimeline.ts — Application state change tracking.
 *
 * Why: Tracks state changes across frames to enable debugging of state-related
 * issues. Since the C engine doesn't capture application state, this is a
 * TypeScript-side feature that records state changes from app.update() calls.
 *
 * Usage:
 *   - recordChange(frameId, field, before, after): Record a state change
 *   - getChanges(since): Get changes since a frame
 *   - getStateAt(frameId): Reconstruct state at a frame (limited)
 */

/**
 * Record of a single state field change.
 */
export type StateChange = Readonly<{
  /** Frame during which the change occurred */
  frameId: bigint;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Field path that changed (e.g., "user.name") */
  field: string;
  /** Value before the change */
  before: unknown;
  /** Value after the change */
  after: unknown;
}>;

/**
 * State timeline interface for tracking state changes.
 */
export interface StateTimeline {
  /**
   * Record a state change.
   * Called by the app runtime when state is updated.
   */
  recordChange(
    frameId: bigint,
    timestamp: number,
    field: string,
    before: unknown,
    after: unknown,
  ): void;

  /**
   * Get all changes since a given frame ID.
   * @param since - Frame ID to start from (exclusive)
   */
  getChanges(since?: bigint): readonly StateChange[];

  /**
   * Get changes for a specific frame.
   * @param frameId - The frame ID
   */
  getFrameChanges(frameId: bigint): readonly StateChange[];

  /**
   * Clear all recorded changes.
   */
  clear(): void;

  /**
   * Get the number of recorded changes.
   */
  readonly count: number;
}

/** Default maximum number of state changes to retain. */
const DEFAULT_MAX_CHANGES = 10000;

function normalizeMaxChanges(maxChanges: number): number {
  if (!Number.isFinite(maxChanges)) return DEFAULT_MAX_CHANGES;
  if (!Number.isInteger(maxChanges)) return DEFAULT_MAX_CHANGES;
  if (maxChanges < 0) return 0;
  return maxChanges;
}

/**
 * Create a state timeline instance.
 *
 * @param maxChanges - Maximum number of changes to retain (default: 10000)
 */
export function createStateTimeline(maxChanges: number = DEFAULT_MAX_CHANGES): StateTimeline {
  const changes: StateChange[] = [];
  let head = 0;

  const cap = normalizeMaxChanges(maxChanges);

  function recordChange(
    frameId: bigint,
    timestamp: number,
    field: string,
    before: unknown,
    after: unknown,
  ): void {
    const change: StateChange = {
      frameId,
      timestamp,
      field,
      before,
      after,
    };

    changes.push(change);

    // Evict oldest changes if over capacity
    while (changes.length - head > cap) {
      head++;
    }

    // Avoid unbounded growth from a moving head index.
    if (head > 0 && head * 2 >= changes.length) {
      changes.splice(0, head);
      head = 0;
    }
  }

  function getChanges(since?: bigint): readonly StateChange[] {
    if (since === undefined) {
      return changes.slice(head);
    }

    const result: StateChange[] = [];
    for (let i = head; i < changes.length; i++) {
      const c = changes[i];
      if (c !== undefined && c.frameId > since) result.push(c);
    }
    return result;
  }

  function getFrameChanges(frameId: bigint): readonly StateChange[] {
    const result: StateChange[] = [];
    for (let i = head; i < changes.length; i++) {
      const c = changes[i];
      if (c !== undefined && c.frameId === frameId) result.push(c);
    }
    return result;
  }

  function clear(): void {
    changes.length = 0;
    head = 0;
  }

  return {
    recordChange,
    getChanges,
    getFrameChanges,
    clear,
    get count() {
      return changes.length - head;
    },
  };
}

/**
 * Utility to compute the difference between two state objects.
 * Returns an array of field changes.
 *
 * Note: This is a shallow diff - nested objects are compared by reference.
 */
export function diffState<T extends object>(
  before: T,
  after: T,
): Array<{ field: string; before: unknown; after: unknown }> {
  const changes: Array<{ field: string; before: unknown; after: unknown }> = [];
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of allKeys) {
    const beforeVal = (before as Record<string, unknown>)[key];
    const afterVal = (after as Record<string, unknown>)[key];

    if (beforeVal !== afterVal) {
      changes.push({
        field: key,
        before: beforeVal,
        after: afterVal,
      });
    }
  }

  return changes;
}
