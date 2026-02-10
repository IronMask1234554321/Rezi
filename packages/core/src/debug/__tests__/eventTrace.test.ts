/**
 * packages/core/src/debug/__tests__/eventTrace.test.ts — Event trace tests.
 *
 * Why: Verifies event trace ordering, eviction behavior, and annotations.
 */

import { assert, describe, test } from "@rezi-ui/testkit";
import { createEventTrace } from "../eventTrace.js";
import type { EventRecord } from "../types.js";

function makeEventRecord(overrides: Partial<EventRecord> = {}): EventRecord {
  return {
    frameId: 1n,
    eventType: 1,
    eventFlags: 0,
    timeMs: 123,
    rawBytesLen: 0,
    parseResult: 0,
    ...overrides,
  };
}

describe("createEventTrace", () => {
  test("stores events in insertion order and supports annotation", () => {
    const trace = createEventTrace(10);

    trace.addEvent(makeEventRecord({ eventType: 1, timeMs: 10 }), 1n, 1000n);
    trace.addEvent(makeEventRecord({ eventType: 2, timeMs: 20 }), 2n, 2000n);
    trace.addEvent(makeEventRecord({ eventType: 1, timeMs: 30 }), 3n, 3000n);

    assert.equal(trace.count, 3);

    const last2 = trace.getLastEvents(2);
    assert.equal(last2.length, 2);
    assert.equal(last2[0]?.eventId, 2n);
    assert.equal(last2[1]?.eventId, 3n);

    const keys = trace.query({ eventTypes: ["key"] });
    assert.equal(keys.length, 2);
    assert.equal(keys[0]?.eventId, 1n);
    assert.equal(keys[1]?.eventId, 3n);

    trace.annotateEvent(2n, "root/commandPalette", true);
    const annotated = trace.query().find((r) => r.eventId === 2n);
    assert.notEqual(annotated, undefined);
    assert.equal(annotated?.routedTo, "root/commandPalette");
    assert.equal(annotated?.handlerInvoked, true);
  });

  test("evicts oldest events when capacity exceeded", () => {
    const trace = createEventTrace(2);

    trace.addEvent(makeEventRecord({ timeMs: 1 }), 1n, 1000n);
    trace.addEvent(makeEventRecord({ timeMs: 2 }), 2n, 2000n);
    trace.addEvent(makeEventRecord({ timeMs: 3 }), 3n, 3000n);

    assert.equal(trace.count, 2);
    const all = trace.query();
    assert.equal(all.length, 2);
    assert.equal(all[0]?.eventId, 2n);
    assert.equal(all[1]?.eventId, 3n);
  });

  test("negative maxEvents clamps to 0 (stores nothing)", () => {
    const trace = createEventTrace(-1);
    trace.addEvent(makeEventRecord(), 1n, 1000n);
    assert.equal(trace.count, 0);
    assert.deepEqual(trace.query(), []);
    assert.deepEqual(trace.getLastEvents(1), []);
  });
});
