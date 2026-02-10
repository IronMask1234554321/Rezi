/**
 * packages/core/src/debug/eventTrace.ts — Event flow tracking and analysis.
 *
 * Why: Tracks the flow of events from terminal input through parsing and routing.
 * Enables debugging of event handling issues by providing a trace of all events
 * with their processing results and routing information.
 *
 * Usage:
 *   - getLastEvents(N): Get last N events
 *   - query(filter): Query events with filters
 */

import type { EventRecord } from "./types.js";

/**
 * Event type names for the engine's event type codes.
 */
const EVENT_TYPE_NAMES: ReadonlyMap<number, string> = new Map([
  [0, "unknown"],
  [1, "key"],
  [2, "text"],
  [3, "paste"],
  [4, "mouse"],
  [5, "resize"],
  [6, "tick"],
  [7, "user"],
]);

/**
 * Get event type name from numeric code.
 */
function getEventTypeName(code: number): string {
  return EVENT_TYPE_NAMES.get(code) ?? `type_${code}`;
}

/**
 * Trace record for a single event.
 */
export type EventTraceRecord = Readonly<{
  /** Unique event ID (from record_id) */
  eventId: bigint;
  /** Frame during which this event was processed */
  frameId: bigint;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Event type name */
  eventType: string;
  /** Parse result: 'ok' or error message */
  parseResult: "ok" | string;
  /** Original time_ms from the event */
  eventTimeMs: number;
  /** Raw bytes length (if captured) */
  rawBytesLen: number;
  /** Extended info: where the event was routed (set by TS runtime) */
  routedTo?: string;
  /** Extended info: whether a handler was invoked */
  handlerInvoked?: boolean;
}>;

/**
 * Filter for querying event traces.
 */
export type EventTraceFilter = Readonly<{
  /** Filter by event types */
  eventTypes?: readonly string[];
  /** Minimum frame ID */
  minFrameId?: bigint;
  /** Maximum frame ID */
  maxFrameId?: bigint;
  /** Only events with parse errors */
  onlyErrors?: boolean;
  /** Only events that were handled */
  onlyHandled?: boolean;
}>;

/**
 * Event trace interface for tracking event flow.
 */
export interface EventTrace {
  /**
   * Add an event record to the trace.
   * Called internally when processing debug records.
   */
  addEvent(record: EventRecord, recordId: bigint, timestampUs: bigint): void;

  /**
   * Annotate an existing event with routing information.
   * Called by the TS runtime after event routing.
   */
  annotateEvent(eventId: bigint, routedTo: string, handlerInvoked: boolean): void;

  /**
   * Get the last N events.
   * @param count - Number of events to return
   */
  getLastEvents(count: number): readonly EventTraceRecord[];

  /**
   * Query events with optional filters.
   * @param filter - Query filter
   */
  query(filter?: EventTraceFilter): readonly EventTraceRecord[];

  /**
   * Clear all stored event traces.
   */
  clear(): void;

  /**
   * Get the number of stored events.
   */
  readonly count: number;
}

/** Default maximum number of events to retain. */
const DEFAULT_MAX_EVENTS = 5000;

function normalizeMaxEvents(maxEvents: number): number {
  if (!Number.isFinite(maxEvents)) return DEFAULT_MAX_EVENTS;
  if (!Number.isInteger(maxEvents)) return DEFAULT_MAX_EVENTS;
  if (maxEvents < 0) return 0;
  return maxEvents;
}

/**
 * Create an event trace instance.
 *
 * @param maxEvents - Maximum number of events to retain (default: 5000)
 */
export function createEventTrace(maxEvents: number = DEFAULT_MAX_EVENTS): EventTrace {
  const events: Map<bigint, EventTraceRecord> = new Map();
  const eventOrder: bigint[] = [];
  let head = 0;

  const cap = normalizeMaxEvents(maxEvents);

  function addEvent(record: EventRecord, recordId: bigint, timestampUs: bigint): void {
    const traceRecord: EventTraceRecord = {
      eventId: recordId,
      frameId: record.frameId,
      timestamp: Number(timestampUs) / 1000,
      eventType: getEventTypeName(record.eventType),
      parseResult: record.parseResult === 0 ? "ok" : `error_${record.parseResult}`,
      eventTimeMs: record.timeMs,
      rawBytesLen: record.rawBytesLen,
    };

    if (!events.has(recordId)) {
      eventOrder.push(recordId);
    }
    events.set(recordId, traceRecord);

    // Evict oldest events if over capacity
    while (eventOrder.length - head > cap) {
      const oldest = eventOrder[head];
      if (oldest !== undefined) events.delete(oldest);
      head++;
    }

    // Avoid unbounded growth from a moving head index.
    if (head > 0 && head * 2 >= eventOrder.length) {
      eventOrder.splice(0, head);
      head = 0;
    }
  }

  function annotateEvent(eventId: bigint, routedTo: string, handlerInvoked: boolean): void {
    const existing = events.get(eventId);
    if (existing) {
      // Create new object with annotations (immutable)
      events.set(eventId, {
        ...existing,
        routedTo,
        handlerInvoked,
      });
    }
  }

  function getLastEvents(count: number): readonly EventTraceRecord[] {
    const result: EventTraceRecord[] = [];
    const available = eventOrder.length - head;
    const take = Math.max(0, Math.min(count, available));
    const start = eventOrder.length - take;

    for (let i = start; i < eventOrder.length; i++) {
      const id = eventOrder[i];
      if (id !== undefined) {
        const record = events.get(id);
        if (record) {
          result.push(record);
        }
      }
    }

    return result;
  }

  function query(filter?: EventTraceFilter): readonly EventTraceRecord[] {
    const result: EventTraceRecord[] = [];

    for (let i = head; i < eventOrder.length; i++) {
      const id = eventOrder[i];
      if (id === undefined) continue;
      const record = events.get(id);
      if (!record) continue;

      // Apply filters
      if (filter) {
        if (filter.eventTypes && !filter.eventTypes.includes(record.eventType)) {
          continue;
        }
        if (filter.minFrameId !== undefined && record.frameId < filter.minFrameId) {
          continue;
        }
        if (filter.maxFrameId !== undefined && record.frameId > filter.maxFrameId) {
          continue;
        }
        if (filter.onlyErrors && record.parseResult === "ok") {
          continue;
        }
        if (filter.onlyHandled && !record.handlerInvoked) {
          continue;
        }
      }

      result.push(record);
    }

    return result;
  }

  function clear(): void {
    events.clear();
    eventOrder.length = 0;
    head = 0;
  }

  return {
    addEvent,
    annotateEvent,
    getLastEvents,
    query,
    clear,
    get count() {
      return events.size;
    },
  };
}
