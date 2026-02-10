import { assert, test } from "@rezi-ui/testkit";
import { ZrUiError } from "../../abi.js";
import { createApp } from "../createApp.js";
import { flushMicrotasks } from "./helpers.js";
import { StubBackend } from "./stubBackend.js";

test("mode selection rules (#59)", () => {
  const b1 = new StubBackend();
  const app1 = createApp({ backend: b1, initialState: 0 });
  app1.draw((g) => {
    g.clear();
  });
  assert.throws(
    () => app1.view(() => ({ kind: "text", text: "x", props: {} })),
    (e: unknown) => e instanceof ZrUiError && e.code === "ZRUI_MODE_CONFLICT",
  );

  const b2 = new StubBackend();
  const app2 = createApp({ backend: b2, initialState: 0 });
  app2.view(() => ({ kind: "text", text: "x", props: {} }));
  assert.throws(
    () => app2.draw((g) => g.clear()),
    (e: unknown) => e instanceof ZrUiError && e.code === "ZRUI_MODE_CONFLICT",
  );
});

test("start without mode throws synchronously (#59)", () => {
  const b = new StubBackend();
  const app = createApp({ backend: b, initialState: 0 });
  assert.throws(
    () => app.start(),
    (e: unknown) => e instanceof ZrUiError && e.code === "ZRUI_NO_RENDER_MODE",
  );
});

test("view/draw while Running throws ZRUI_INVALID_STATE (#59)", async () => {
  const b = new StubBackend();
  const app = createApp({ backend: b, initialState: 0 });
  app.draw((g) => g.clear());
  await app.start();
  assert.throws(
    () => app.draw((g) => g.clear()),
    (e: unknown) => e instanceof ZrUiError && e.code === "ZRUI_INVALID_STATE",
  );
});

test("config is immutable after createApp (#59)", async () => {
  const cfg = { maxDrawlistBytes: 64 };
  const b = new StubBackend();
  const app = createApp({ backend: b, initialState: 0, config: cfg });

  const fatal: string[] = [];
  app.onEvent((ev) => {
    if (ev.kind === "fatal") fatal.push(ev.code);
  });

  app.draw((g) => {
    g.clear();
  });

  // If the runtime holds a live reference to cfg, this would "fix" the cap.
  cfg.maxDrawlistBytes = 1024 * 1024;

  await app.start();
  await flushMicrotasks(3);

  assert.deepEqual(fatal, ["ZRUI_DRAWLIST_BUILD_ERROR"]);
});
