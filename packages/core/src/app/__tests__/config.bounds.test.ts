import { assert, test } from "@rezi-ui/testkit";
import { ZrUiError } from "../../abi.js";
import { createApp } from "../createApp.js";
import { StubBackend } from "./stubBackend.js";

test("config bounds: fpsCap must be <= 1000", () => {
  const backend = new StubBackend();
  assert.throws(
    () =>
      createApp({
        backend,
        initialState: { value: 0 },
        config: { fpsCap: 1001 },
      }),
    (err: unknown) =>
      err instanceof ZrUiError &&
      err.code === "ZRUI_INVALID_PROPS" &&
      err.message.includes("fpsCap must be <= 1000"),
  );
});

test("config bounds: maxEventBytes must be <= 4 MiB", () => {
  const backend = new StubBackend();
  assert.throws(
    () =>
      createApp({
        backend,
        initialState: { value: 0 },
        config: { maxEventBytes: (4 << 20) + 1 },
      }),
    (err: unknown) =>
      err instanceof ZrUiError &&
      err.code === "ZRUI_INVALID_PROPS" &&
      err.message.includes("maxEventBytes must be <= 4194304"),
  );
});
