import { assert, test } from "@rezi-ui/testkit";
import { createApp } from "../createApp.js";
import { encodeZrevBatchV1, flushMicrotasks, makeBackendBatch } from "./helpers.js";
import { StubBackend } from "./stubBackend.js";

test("onEvent handler ordering + unsubscribe semantics (#80)", async () => {
  const backend = new StubBackend();
  const app = createApp({ backend, initialState: 0 });

  app.draw((g) => g.clear());

  const calls: string[] = [];

  let unsubB: (() => void) | null = null;
  app.onEvent((ev) => {
    if (ev.kind !== "engine") return;
    calls.push("A");
    if (calls.length === 1) unsubB?.();
  });
  unsubB = app.onEvent((ev) => {
    if (ev.kind !== "engine") return;
    calls.push("B");
  });
  app.onEvent((ev) => {
    if (ev.kind !== "engine") return;
    calls.push("C");
  });

  await app.start();

  const bytes = encodeZrevBatchV1({
    events: [
      { kind: "text", timeMs: 1, codepoint: 65 },
      { kind: "text", timeMs: 2, codepoint: 66 },
    ],
  });
  backend.pushBatch(makeBackendBatch({ bytes }));

  await flushMicrotasks(5);

  // B is unsubscribed during the first event dispatch, but still receives that event.
  // It is not called for subsequent events.
  assert.deepEqual(calls, ["A", "B", "C", "A", "C"]);
});
