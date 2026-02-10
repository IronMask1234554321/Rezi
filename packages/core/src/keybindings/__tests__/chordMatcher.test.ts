import { assert, describe, test } from "@rezi-ui/testkit";
import {
  CHORD_TIMEOUT_MS,
  INITIAL_CHORD_STATE,
  buildTrie,
  isChordTimedOut,
  matchKey,
  resetChordState,
} from "../chordMatcher.js";
import { EMPTY_MODS } from "../keyCodes.js";
import { parseKeySequence } from "../parser.js";
import type { KeyBinding, ParsedKey } from "../types.js";

type TestContext = { value: string };

function makeBinding(keyStr: string, priority = 0): KeyBinding<TestContext> {
  const result = parseKeySequence(keyStr);
  if (!result.ok) throw new Error(`Invalid key: ${keyStr}`);

  return Object.freeze({
    sequence: result.value,
    priority,
    handler: () => {},
  });
}

function makeKey(keyStr: string): ParsedKey {
  const result = parseKeySequence(keyStr);
  if (!result.ok) throw new Error(`Invalid key: ${keyStr}`);
  const key = result.value.keys[0];
  if (!key) throw new Error(`No key in: ${keyStr}`);
  return key;
}

describe("buildTrie", () => {
  test("builds trie from single binding", () => {
    const bindings = [makeBinding("a")];
    const trie = buildTrie(bindings);

    assert.equal(trie.hasDescendants, true);
    assert.equal(trie.binding, null);
  });

  test("builds trie from multiple bindings", () => {
    const bindings = [makeBinding("a"), makeBinding("b"), makeBinding("ctrl+s")];
    const trie = buildTrie(bindings);

    assert.equal(trie.hasDescendants, true);
    assert.equal(trie.children.size, 3);
  });

  test("handles chord sequences", () => {
    const bindings = [makeBinding("g g")];
    const trie = buildTrie(bindings);

    assert.equal(trie.hasDescendants, true);
    // First 'g' should be a child
    const gKey = makeKey("g");
    const gNode = trie.children.get(`${String(gKey.key)}:0`);
    assert.ok(gNode);
    if (!gNode) return;

    assert.equal(gNode.hasDescendants, true);
    assert.equal(gNode.binding, null);
  });

  test("higher priority wins on conflict", () => {
    let handler1Called = false;
    let handler2Called = false;

    const binding1: KeyBinding<TestContext> = {
      ...makeBinding("a"),
      priority: 10,
      handler: () => {
        handler1Called = true;
      },
    };

    const binding2: KeyBinding<TestContext> = {
      ...makeBinding("a"),
      priority: 5,
      handler: () => {
        handler2Called = true;
      },
    };

    const trie = buildTrie([binding1, binding2]);
    const key = makeKey("a");
    const result = matchKey(trie, INITIAL_CHORD_STATE, key, 0);

    assert.equal(result.result.kind, "matched");
    if (result.result.kind !== "matched") return;

    // Execute the handler
    result.result.binding.handler({ value: "test" });

    assert.equal(handler1Called, true);
    assert.equal(handler2Called, false);
  });
});

describe("matchKey", () => {
  describe("single key matching", () => {
    test("matches single key", () => {
      const bindings = [makeBinding("a")];
      const trie = buildTrie(bindings);
      const key = makeKey("a");

      const result = matchKey(trie, INITIAL_CHORD_STATE, key, 0);

      assert.equal(result.result.kind, "matched");
    });

    test("returns none for unbound key", () => {
      const bindings = [makeBinding("a")];
      const trie = buildTrie(bindings);
      const key = makeKey("b");

      const result = matchKey(trie, INITIAL_CHORD_STATE, key, 0);

      assert.equal(result.result.kind, "none");
    });

    test("matches key with modifiers", () => {
      const bindings = [makeBinding("ctrl+s")];
      const trie = buildTrie(bindings);
      const key = makeKey("ctrl+s");

      const result = matchKey(trie, INITIAL_CHORD_STATE, key, 0);

      assert.equal(result.result.kind, "matched");
    });

    test("does not match if modifiers differ", () => {
      const bindings = [makeBinding("ctrl+s")];
      const trie = buildTrie(bindings);
      const key = makeKey("s"); // No ctrl

      const result = matchKey(trie, INITIAL_CHORD_STATE, key, 0);

      assert.equal(result.result.kind, "none");
    });
  });

  describe("chord matching", () => {
    test("returns pending for chord prefix", () => {
      const bindings = [makeBinding("g g")];
      const trie = buildTrie(bindings);
      const key = makeKey("g");

      const result = matchKey(trie, INITIAL_CHORD_STATE, key, 0);

      assert.equal(result.result.kind, "pending");
      assert.equal(result.nextState.pendingKeys.length, 1);
    });

    test("matches complete chord", () => {
      const bindings = [makeBinding("g g")];
      const trie = buildTrie(bindings);
      const key = makeKey("g");

      // First g
      const result1 = matchKey(trie, INITIAL_CHORD_STATE, key, 0);
      assert.equal(result1.result.kind, "pending");

      // Second g
      const result2 = matchKey(trie, result1.nextState, key, 100);
      assert.equal(result2.result.kind, "matched");
    });

    test("resets chord state after match", () => {
      const bindings = [makeBinding("g g")];
      const trie = buildTrie(bindings);
      const key = makeKey("g");

      const result1 = matchKey(trie, INITIAL_CHORD_STATE, key, 0);
      const result2 = matchKey(trie, result1.nextState, key, 100);

      assert.equal(result2.nextState.pendingKeys.length, 0);
    });

    test("handles three-key chord", () => {
      const bindings = [makeBinding("g t t")];
      const trie = buildTrie(bindings);

      const g = makeKey("g");
      const t = makeKey("t");

      const r1 = matchKey(trie, INITIAL_CHORD_STATE, g, 0);
      assert.equal(r1.result.kind, "pending");

      const r2 = matchKey(trie, r1.nextState, t, 100);
      assert.equal(r2.result.kind, "pending");

      const r3 = matchKey(trie, r2.nextState, t, 200);
      assert.equal(r3.result.kind, "matched");
    });

    test("wrong key resets chord and tries fresh", () => {
      const bindings = [makeBinding("g g"), makeBinding("h")];
      const trie = buildTrie(bindings);

      const g = makeKey("g");
      const h = makeKey("h");

      // Start g g chord
      const r1 = matchKey(trie, INITIAL_CHORD_STATE, g, 0);
      assert.equal(r1.result.kind, "pending");

      // Press h instead - should reset and match h
      const r2 = matchKey(trie, r1.nextState, h, 100);
      assert.equal(r2.result.kind, "matched");
    });
  });

  describe("timeout handling", () => {
    test("timeout resets incomplete chord", () => {
      const bindings = [makeBinding("g g")];
      const trie = buildTrie(bindings);
      const key = makeKey("g");

      // First g at time 0
      const r1 = matchKey(trie, INITIAL_CHORD_STATE, key, 0);
      assert.equal(r1.result.kind, "pending");

      // Second g after timeout (> 1000ms)
      const r2 = matchKey(trie, r1.nextState, key, CHORD_TIMEOUT_MS + 100);

      // Should start fresh, so this becomes a new pending
      assert.equal(r2.result.kind, "pending");
      assert.equal(r2.nextState.pendingKeys.length, 1);
    });

    test("no timeout within window", () => {
      const bindings = [makeBinding("g g")];
      const trie = buildTrie(bindings);
      const key = makeKey("g");

      // First g at time 0
      const r1 = matchKey(trie, INITIAL_CHORD_STATE, key, 0);

      // Second g just before timeout
      const r2 = matchKey(trie, r1.nextState, key, CHORD_TIMEOUT_MS - 100);

      // Should match
      assert.equal(r2.result.kind, "matched");
    });
  });

  describe("priority", () => {
    test("higher priority binding wins", () => {
      let lowPriorityHandler = false;
      let highPriorityHandler = false;

      const lowBinding: KeyBinding<TestContext> = {
        ...makeBinding("ctrl+s"),
        priority: 1,
        handler: () => {
          lowPriorityHandler = true;
        },
      };

      const highBinding: KeyBinding<TestContext> = {
        ...makeBinding("ctrl+s"),
        priority: 10,
        handler: () => {
          highPriorityHandler = true;
        },
      };

      const trie = buildTrie([lowBinding, highBinding]);
      const key = makeKey("ctrl+s");

      const result = matchKey(trie, INITIAL_CHORD_STATE, key, 0);
      assert.equal(result.result.kind, "matched");
      if (result.result.kind !== "matched") return;

      result.result.binding.handler({ value: "" });

      assert.equal(highPriorityHandler, true);
      assert.equal(lowPriorityHandler, false);
    });
  });
});

describe("isChordTimedOut", () => {
  test("returns false for initial state", () => {
    assert.equal(isChordTimedOut(INITIAL_CHORD_STATE, 5000), false);
  });

  test("returns false within timeout", () => {
    const state = { pendingKeys: [makeKey("g")], startTimeMs: 1000 };
    assert.equal(isChordTimedOut(state, 1500), false);
  });

  test("returns true after timeout", () => {
    const state = { pendingKeys: [makeKey("g")], startTimeMs: 1000 };
    assert.equal(isChordTimedOut(state, 1000 + CHORD_TIMEOUT_MS + 1), true);
  });
});

describe("resetChordState", () => {
  test("returns initial state", () => {
    const state = resetChordState();
    assert.equal(state.pendingKeys.length, 0);
    assert.equal(state.startTimeMs, 0);
  });
});
