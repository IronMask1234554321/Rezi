import { assert, describe, test } from "@rezi-ui/testkit";
import { createInputEventEmitter } from "../internal/emitter.js";

describe("internal emitter", () => {
  test("does not invoke listeners added during the same emit cycle", () => {
    const emitter = createInputEventEmitter<string>();
    const seen: string[] = [];

    const late = (value: string) => {
      seen.push(`late:${value}`);
    };

    emitter.on("input", (value) => {
      seen.push(`first:${value}`);
      emitter.on("input", late);
    });

    emitter.emit("input", "a");
    assert.deepEqual(seen, ["first:a"]);

    emitter.emit("input", "b");
    assert.deepEqual(seen, ["first:a", "first:b", "late:b"]);
  });

  test("keeps current-cycle delivery stable when listeners are removed mid-emit", () => {
    const emitter = createInputEventEmitter<string>();
    const seen: string[] = [];

    const second = (value: string) => {
      seen.push(`second:${value}`);
    };

    emitter.on("input", (value) => {
      seen.push(`first:${value}`);
      emitter.removeListener("input", second);
    });
    emitter.on("input", second);

    emitter.emit("input", "x");
    assert.deepEqual(seen, ["first:x", "second:x"]);
  });
});
