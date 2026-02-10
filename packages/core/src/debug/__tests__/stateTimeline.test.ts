/**
 * packages/core/src/debug/__tests__/stateTimeline.test.ts — State timeline tests.
 *
 * Why: Verifies state change tracking, queries, eviction, and diff helper.
 */

import { assert, describe, test } from "@rezi-ui/testkit";
import { createStateTimeline, diffState } from "../stateTimeline.js";

describe("createStateTimeline", () => {
  test("records changes and can query by frame", () => {
    const tl = createStateTimeline(10);

    tl.recordChange(1n, 1000, "a", 1, 2);
    tl.recordChange(2n, 2000, "b", "x", "y");

    assert.equal(tl.count, 2);

    const all = tl.getChanges();
    assert.equal(all.length, 2);
    assert.equal(all[0]?.field, "a");
    assert.equal(all[1]?.field, "b");

    const since1 = tl.getChanges(1n);
    assert.equal(since1.length, 1);
    assert.equal(since1[0]?.frameId, 2n);

    const f2 = tl.getFrameChanges(2n);
    assert.equal(f2.length, 1);
    assert.equal(f2[0]?.field, "b");

    tl.clear();
    assert.equal(tl.count, 0);
    assert.deepEqual(tl.getChanges(), []);
  });

  test("evicts oldest changes when capacity exceeded", () => {
    const tl = createStateTimeline(2);

    tl.recordChange(1n, 1000, "a", 1, 2);
    tl.recordChange(2n, 2000, "b", 2, 3);
    tl.recordChange(3n, 3000, "c", 3, 4);

    assert.equal(tl.count, 2);
    const all = tl.getChanges();
    assert.equal(all.length, 2);
    assert.equal(all[0]?.field, "b");
    assert.equal(all[1]?.field, "c");
  });

  test("negative maxChanges clamps to 0 (stores nothing)", () => {
    const tl = createStateTimeline(-1);
    tl.recordChange(1n, 1000, "a", 1, 2);
    assert.equal(tl.count, 0);
    assert.deepEqual(tl.getChanges(), []);
  });
});

describe("diffState", () => {
  test("returns shallow changes across keys", () => {
    const changes = diffState({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });

    assert.equal(changes.length, 2);
    const byField = new Map(changes.map((c) => [c.field, c]));
    assert.deepEqual(byField.get("b"), { field: "b", before: 2, after: 3 });
    assert.deepEqual(byField.get("c"), { field: "c", before: undefined, after: 4 });
  });
});
