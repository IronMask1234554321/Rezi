import { assert, describe, test } from "@rezi-ui/testkit";
import { resolveMargin } from "../spacing.js";

describe("spacing", () => {
  test("resolveMargin: mt/mr/mb/ml overrides mx/my/m", () => {
    const out = resolveMargin({ m: 1, mx: 2, my: 3, mt: 4, ml: 5 });
    assert.deepEqual(out, { top: 4, right: 2, bottom: 3, left: 5 });
  });
});
