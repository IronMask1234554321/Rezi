/**
 * packages/core/src/debug/errorAggregator.ts — Error collection and deduplication.
 *
 * Why: Aggregates errors from the debug trace by a unique key to avoid flooding
 * the user with duplicate errors. Tracks occurrence counts and frame ranges for
 * each unique error, enabling efficient error diagnosis.
 *
 * Usage:
 *   - all(): Get all aggregated errors
 *   - byCategory(cat): Filter by category
 *   - bySeverity(sev): Filter by minimum severity
 *   - on('error', handler): Subscribe to new errors
 */

import { severityToNum } from "./constants.js";
import type { DebugCategory, DebugSeverity, ErrorRecord } from "./types.js";

/**
 * Aggregated error with deduplication and tracking.
 */
export type AggregatedError = Readonly<{
  /** Unique ID (hash of code + message + sourceFile) */
  id: string;
  /** Error category */
  category: DebugCategory;
  /** Error severity */
  severity: DebugSeverity;
  /** Error code from the engine */
  code: number;
  /** Error message */
  message: string;
  /** Source file (if available) */
  sourceFile: string | undefined;
  /** Source line (if available) */
  sourceLine: number | undefined;
  /** First occurrence timestamp (ms) */
  firstOccurrence: number;
  /** Last occurrence timestamp (ms) */
  lastOccurrence: number;
  /** Total occurrence count */
  count: number;
  /** Frame IDs where this error occurred (limited) */
  frameIds: readonly bigint[];
}>;

/** Maximum number of frame IDs to store per error. */
const MAX_FRAME_IDS_PER_ERROR = 100;

/**
 * Create a unique ID for an error based on its characteristics.
 */
function createErrorId(code: number, message: string, sourceFile: string | undefined): string {
  const parts = [String(code), message];
  if (sourceFile) {
    parts.push(sourceFile);
  }
  // Simple hash: join and create a stable string
  return parts.join("|");
}

/**
 * Error handler callback type.
 */
export type ErrorHandler = (error: AggregatedError) => void;

/**
 * Error aggregator interface for collecting and querying errors.
 */
export interface ErrorAggregator {
  /**
   * Add an error record to the aggregator.
   * Called internally when processing debug records.
   */
  addError(
    record: ErrorRecord,
    category: DebugCategory,
    severity: DebugSeverity,
    timestampUs: bigint,
  ): void;

  /**
   * Get all aggregated errors.
   */
  all(): readonly AggregatedError[];

  /**
   * Get errors filtered by category.
   */
  byCategory(category: DebugCategory): readonly AggregatedError[];

  /**
   * Get errors at or above the specified severity.
   */
  bySeverity(minSeverity: DebugSeverity): readonly AggregatedError[];

  /**
   * Clear all aggregated errors.
   */
  clear(): void;

  /**
   * Subscribe to new errors.
   * Returns an unsubscribe function.
   */
  on(event: "error", handler: ErrorHandler): () => void;

  /**
   * Get the number of unique errors.
   */
  readonly count: number;

  /**
   * Get the total number of error occurrences.
   */
  readonly totalOccurrences: number;
}

/**
 * Internal mutable error state for tracking.
 */
type MutableError = {
  id: string;
  category: DebugCategory;
  severity: DebugSeverity;
  code: number;
  message: string;
  sourceFile: string | undefined;
  sourceLine: number | undefined;
  firstOccurrence: number;
  lastOccurrence: number;
  count: number;
  frameIds: bigint[];
};

/**
 * Create an error aggregator instance.
 */
export function createErrorAggregator(): ErrorAggregator {
  const errors: Map<string, MutableError> = new Map();
  const errorOrder: string[] = [];
  const handlers: Set<ErrorHandler> = new Set();
  let totalOccurrences = 0;

  function notifyHandlers(error: AggregatedError): void {
    for (const handler of handlers) {
      try {
        handler(error);
      } catch {
        // Ignore handler errors
      }
    }
  }

  function toImmutable(error: MutableError): AggregatedError {
    return {
      id: error.id,
      category: error.category,
      severity: error.severity,
      code: error.code,
      message: error.message,
      sourceFile: error.sourceFile,
      sourceLine: error.sourceLine,
      firstOccurrence: error.firstOccurrence,
      lastOccurrence: error.lastOccurrence,
      count: error.count,
      frameIds: [...error.frameIds],
    };
  }

  function addError(
    record: ErrorRecord,
    category: DebugCategory,
    severity: DebugSeverity,
    timestampUs: bigint,
  ): void {
    const timestamp = Number(timestampUs) / 1000;
    const sourceFile = record.sourceFile || undefined;
    const id = createErrorId(record.errorCode, record.message, sourceFile);

    totalOccurrences++;

    const existing = errors.get(id);
    if (existing) {
      // Update existing error
      existing.lastOccurrence = timestamp;
      existing.count++;
      if (existing.frameIds.length < MAX_FRAME_IDS_PER_ERROR) {
        // Only add if not already present
        if (!existing.frameIds.includes(record.frameId)) {
          existing.frameIds.push(record.frameId);
        }
      }
      notifyHandlers(toImmutable(existing));
    } else {
      // Create new error
      const newError: MutableError = {
        id,
        category,
        severity,
        code: record.errorCode,
        message: record.message,
        sourceFile,
        sourceLine: record.sourceLine || undefined,
        firstOccurrence: timestamp,
        lastOccurrence: timestamp,
        count: 1,
        frameIds: [record.frameId],
      };
      errors.set(id, newError);
      errorOrder.push(id);
      notifyHandlers(toImmutable(newError));
    }
  }

  function all(): readonly AggregatedError[] {
    const result: AggregatedError[] = [];
    for (const id of errorOrder) {
      const error = errors.get(id);
      if (error) {
        result.push(toImmutable(error));
      }
    }
    return result;
  }

  function byCategory(category: DebugCategory): readonly AggregatedError[] {
    return all().filter((e) => e.category === category);
  }

  function bySeverity(minSeverity: DebugSeverity): readonly AggregatedError[] {
    const minSevNum = severityToNum(minSeverity);
    if (minSevNum === null) return all();

    return all().filter((e) => {
      const sevNum = severityToNum(e.severity);
      return sevNum !== null && sevNum >= minSevNum;
    });
  }

  function clear(): void {
    errors.clear();
    errorOrder.length = 0;
    totalOccurrences = 0;
  }

  function on(event: "error", handler: ErrorHandler): () => void {
    if (event !== "error") {
      return () => {};
    }
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }

  return {
    addError,
    all,
    byCategory,
    bySeverity,
    clear,
    on,
    get count() {
      return errors.size;
    },
    get totalOccurrences() {
      return totalOccurrences;
    },
  };
}
