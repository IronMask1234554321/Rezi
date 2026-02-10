import { assert, describe, readFixture, test } from "@rezi-ui/testkit";
import type { ZrevEvent } from "../../events.js";
import { type FocusState, applyPendingFocusChange, requestPendingFocusChange } from "../focus.js";
import { type RoutedAction, routeKey } from "../router.js";

type ExpectedStep = Readonly<{
  focusedId: string | null;
  emittedKinds: readonly ("engine" | "action")[];
  action?: RoutedAction;
}>;

type FixtureStep = Readonly<{
  event: ZrevEvent;
  expected: ExpectedStep;
}>;

type KeyRoutingCase = Readonly<{
  name: string;
  focusList: readonly string[];
  enabledById: Readonly<Record<string, boolean>>;
  initialFocusedId: string | null;
  steps: readonly FixtureStep[];
}>;

type KeyRoutingFixture = Readonly<{ schemaVersion: 1; cases: readonly KeyRoutingCase[] }>;

async function loadFixture(): Promise<KeyRoutingFixture> {
  const bytes = await readFixture("routing/key_routing.json");
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as KeyRoutingFixture;
}

function stepEmittedKinds(action: RoutedAction | undefined): ("engine" | "action")[] {
  const kinds: ("engine" | "action")[] = ["engine"];
  if (action) kinds.push("action");
  return kinds;
}

describe("routing (locked) - KEY golden fixtures", () => {
  test("key_routing.json", async () => {
    const f = await loadFixture();
    assert.equal(f.schemaVersion, 1);

    for (const c of f.cases) {
      let focusState: FocusState = Object.freeze({ focusedId: c.initialFocusedId });
      const enabledById = new Map<string, boolean>(Object.entries(c.enabledById));

      for (const s of c.steps) {
        const res = routeKey(s.event, {
          focusedId: focusState.focusedId,
          focusList: c.focusList,
          enabledById,
        });

        const emittedKinds = stepEmittedKinds(res.action);
        assert.deepEqual(emittedKinds, s.expected.emittedKinds, `${c.name}: emittedKinds`);

        if (s.expected.action) assert.deepEqual(res.action, s.expected.action, `${c.name}: action`);
        else assert.equal(res.action, undefined, `${c.name}: action`);

        if (res.nextFocusedId !== undefined) {
          focusState = requestPendingFocusChange(focusState, res.nextFocusedId);
        }
        focusState = applyPendingFocusChange(focusState);

        assert.equal(focusState.focusedId, s.expected.focusedId, `${c.name}: focusedId`);
      }
    }
  });
});
