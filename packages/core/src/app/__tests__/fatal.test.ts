import { assert, test } from "@rezi-ui/testkit";
import { ZrUiError } from "../../abi.js";
import { createApp } from "../createApp.js";
import { flushMicrotasks, makeBackendBatch } from "./helpers.js";
import { StubBackend } from "./stubBackend.js";

test("fatal emission ordering + post-fault guards (#63)", async () => {
  const backend = new StubBackend();
  const app = createApp({ backend, initialState: 0 });
  app.draw((g) => g.clear());

  const order: string[] = [];
  app.onEvent((ev) => {
    if (ev.kind === "fatal") order.push("h1");
  });
  app.onEvent((ev) => {
    if (ev.kind === "fatal") order.push("h2");
  });

  await app.start();

  backend.pushBatch(makeBackendBatch({ bytes: new Uint8Array(24) }));
  await flushMicrotasks(5);

  assert.deepEqual(order, ["h1", "h2"]);
  assert.deepEqual(backend.callLog.slice(0, 3), ["start", "requestFrame", "stop"]);

  assert.throws(
    () => app.update((s) => s),
    (e: unknown) => e instanceof ZrUiError && e.code === "ZRUI_INVALID_STATE",
  );
  app.dispose();
});
