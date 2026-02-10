import { assert, describe, readFixture, test } from "@rezi-ui/testkit";
import type { ZrevEvent } from "../../events.js";
import { type FocusState, applyPendingFocusChange, requestPendingFocusChange } from "../focus.js";
import { type RoutedAction, routeMouse } from "../router.js";

type ExpectedStep = Readonly<{
  focusedId: string | null;
  pressedId: string | null;
  emittedKinds: readonly ("engine" | "action")[];
  action?: RoutedAction;
}>;

type FixtureStep = Readonly<{
  event: ZrevEvent;
  hitTestTargetId: string | null;
  expected: ExpectedStep;
}>;

type MouseRoutingCase = Readonly<{
  name: string;
  enabledById: Readonly<Record<string, boolean>>;
  initialFocusedId: string | null;
  initialPressedId: string | null;
  steps: readonly FixtureStep[];
}>;

type MouseRoutingFixture = Readonly<{ schemaVersion: 1; cases: readonly MouseRoutingCase[] }>;

async function loadFixture(): Promise<MouseRoutingFixture> {
  const bytes = await readFixture("routing/mouse_routing.json");
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as MouseRoutingFixture;
}

function stepEmittedKinds(action: RoutedAction | undefined): ("engine" | "action")[] {
  const kinds: ("engine" | "action")[] = ["engine"];
  if (action) kinds.push("action");
  return kinds;
}

describe("routing (locked) - MOUSE golden fixtures", () => {
  test("mouse_routing.json", async () => {
    const f = await loadFixture();
    assert.equal(f.schemaVersion, 1);

    for (const c of f.cases) {
      let focusState: FocusState = Object.freeze({ focusedId: c.initialFocusedId });
      let pressedId: string | null = c.initialPressedId;
      const enabledById = new Map<string, boolean>(Object.entries(c.enabledById));

      for (const s of c.steps) {
        const res = routeMouse(s.event, {
          pressedId,
          hitTestTargetId: s.hitTestTargetId,
          enabledById,
        });

        const emittedKinds = stepEmittedKinds(res.action);
        assert.deepEqual(emittedKinds, s.expected.emittedKinds, `${c.name}: emittedKinds`);

        if (s.expected.action) assert.deepEqual(res.action, s.expected.action, `${c.name}: action`);
        else assert.equal(res.action, undefined, `${c.name}: action`);

        if (res.nextPressedId !== undefined) pressedId = res.nextPressedId;

        if (res.nextFocusedId !== undefined) {
          focusState = requestPendingFocusChange(focusState, res.nextFocusedId);
        }
        focusState = applyPendingFocusChange(focusState);

        assert.equal(focusState.focusedId, s.expected.focusedId, `${c.name}: focusedId`);
        assert.equal(pressedId, s.expected.pressedId, `${c.name}: pressedId`);
      }
    }
  });
});
