import { assert, describe, test } from "@rezi-ui/testkit";
import { normalizeRenderOptions } from "../render/options.js";

describe("render/options", () => {
  test("normalizes a WriteStream shorthand into options", () => {
    const stdout = {
      write: () => true,
    } as unknown as NodeJS.WriteStream;

    const out = normalizeRenderOptions(stdout);
    assert.equal(out.stdout, stdout);
  });

  test("passes object options through unchanged", () => {
    const out = normalizeRenderOptions({ debug: true, exitOnCtrlC: false });
    assert.equal(out.debug, true);
    assert.equal(out.exitOnCtrlC, false);
  });
});
