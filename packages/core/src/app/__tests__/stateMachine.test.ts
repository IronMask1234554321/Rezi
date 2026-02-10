import { assert, test } from "@rezi-ui/testkit";
import { ZrUiError } from "../../abi.js";
import { AppStateMachine } from "../stateMachine.js";

test("state machine transitions and guards (#56)", () => {
  const sm = new AppStateMachine();
  assert.equal(sm.state, "Created");

  sm.toRunning();
  assert.equal(sm.state, "Running");

  sm.toStopped();
  assert.equal(sm.state, "Stopped");

  sm.toRunning();
  assert.equal(sm.state, "Running");

  sm.dispose();
  assert.equal(sm.state, "Disposed");
  sm.dispose();
  assert.equal(sm.state, "Disposed");

  const sm2 = new AppStateMachine();
  assert.throws(
    () => sm2.toStopped(),
    (e: unknown) => e instanceof ZrUiError && e.code === "ZRUI_INVALID_STATE",
  );

  sm2.dispose();
  assert.equal(sm2.state, "Disposed");
});
