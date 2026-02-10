import { assert, describe, readFixture, test } from "@rezi-ui/testkit";
import type { ZrevEvent } from "../../events.js";
import { applyInputEditEvent } from "../inputEditor.js";

type JsonPasteEvent = Readonly<{ kind: "paste"; timeMs: number; bytes: readonly number[] }>;
type JsonKeyEvent = Readonly<{
  kind: "key";
  timeMs: number;
  key: number;
  mods: number;
  action: "down" | "up" | "repeat";
}>;
type JsonTextEvent = Readonly<{ kind: "text"; timeMs: number; codepoint: number }>;
type JsonInputEvent = JsonKeyEvent | JsonTextEvent | JsonPasteEvent;

type ExpectedAction = Readonly<{
  kind: "action";
  id: string;
  action: "input";
  value: string;
  cursor: number;
}>;

type ExpectedStep = Readonly<{
  value: string;
  cursor: number;
  emittedKinds: readonly ("engine" | "action")[];
  action?: ExpectedAction;
}>;

type FixtureStep = Readonly<{
  event: JsonInputEvent;
  expected: ExpectedStep;
}>;

type InputRoutingCase = Readonly<{
  name: string;
  enabledById: Readonly<Record<string, boolean>>;
  initialFocusedId: string | null;
  initialValue: string;
  initialCursor: number;
  steps: readonly FixtureStep[];
}>;

type InputRoutingFixture = Readonly<{ schemaVersion: 1; cases: readonly InputRoutingCase[] }>;

async function loadFixture(): Promise<InputRoutingFixture> {
  const bytes = await readFixture("routing/input_editing.json");
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as InputRoutingFixture;
}

function toZrevEvent(e: JsonInputEvent): ZrevEvent {
  if (e.kind === "paste") {
    return { kind: "paste", timeMs: e.timeMs, bytes: Uint8Array.from(e.bytes) };
  }
  return e satisfies Exclude<JsonInputEvent, JsonPasteEvent>;
}

function emittedKinds(action: ExpectedAction | undefined): ("engine" | "action")[] {
  const out: ("engine" | "action")[] = ["engine"];
  if (action) out.push("action");
  return out;
}

describe("routing + editing (docs/18) - Input golden fixtures", () => {
  test("input_editing.json", async () => {
    const f = await loadFixture();
    assert.equal(f.schemaVersion, 1);

    for (const c of f.cases) {
      const enabledById = new Map<string, boolean>(Object.entries(c.enabledById));
      const focusedId: string | null = c.initialFocusedId;
      let value = c.initialValue;
      let cursor = c.initialCursor;

      for (const s of c.steps) {
        const ev = toZrevEvent(s.event);

        let actionEv: ExpectedAction | undefined;
        const targetId =
          focusedId !== null && enabledById.get(focusedId) === true ? focusedId : null;
        if (targetId !== null) {
          const res = applyInputEditEvent(ev, { id: targetId, value, cursor });
          if (res) {
            value = res.nextValue;
            cursor = res.nextCursor;
            if (res.action) {
              actionEv = { kind: "action", ...res.action };
            }
          }
        }

        assert.deepEqual(
          emittedKinds(actionEv),
          s.expected.emittedKinds,
          `${c.name}: emittedKinds`,
        );
        assert.equal(value, s.expected.value, `${c.name}: value`);
        assert.equal(cursor, s.expected.cursor, `${c.name}: cursor`);

        if (s.expected.action) {
          assert.deepEqual(actionEv, s.expected.action, `${c.name}: action`);
        } else {
          assert.equal(actionEv, undefined, `${c.name}: action`);
        }
      }
    }
  });
});
