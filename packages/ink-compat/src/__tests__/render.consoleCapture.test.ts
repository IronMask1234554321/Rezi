import { assert, describe, test } from "@rezi-ui/testkit";
import { createConsoleCapture } from "../render/consoleCapture.js";

type ConsoleState = Readonly<{ consoleLines: readonly string[] }>;

async function flushMicrotasks(count = 2): Promise<void> {
  for (let i = 0; i < count; i++) {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  }
}

describe("render/consoleCapture", () => {
  test("appends sanitized console lines and enforces max line cap", async () => {
    let exited = false;
    let state: ConsoleState = { consoleLines: [] };
    const app = {
      update(updater: (prev: ConsoleState) => ConsoleState) {
        state = updater(state);
      },
    };

    const capture = createConsoleCapture(app, () => exited, 2);
    capture.appendConsole("a\nb\n");
    await flushMicrotasks();

    assert.deepEqual(state.consoleLines, ["b", ""]);

    exited = true;
    capture.appendConsole("c");
    await flushMicrotasks();

    assert.deepEqual(state.consoleLines, ["b", ""]);
  });

  test("patchConsole captures console output and restore unpatches", async () => {
    let state: ConsoleState = { consoleLines: [] };
    const app = {
      update(updater: (prev: ConsoleState) => ConsoleState) {
        state = updater(state);
      },
    };

    const capture = createConsoleCapture(app, () => false, 10);
    const restore = capture.patchConsole();
    try {
      // eslint-disable-next-line no-console
      console.log("captured-line");
      await flushMicrotasks();
      assert.equal(state.consoleLines.includes("captured-line"), true);
    } finally {
      restore();
    }
  });
});
