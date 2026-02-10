import { assert, describe, test } from "@rezi-ui/testkit";
import { match, maybe, show, when } from "../conditionals.js";
import { ui } from "../ui.js";

describe("conditionals", () => {
  test("show returns node when true", () => {
    const n = ui.text("ok");
    assert.equal(show(true, n), n);
  });

  test("show returns null when false and no fallback", () => {
    assert.equal(show(false, ui.text("no")), null);
  });

  test("show returns fallback when false", () => {
    const fb = ui.text("fb");
    assert.equal(show(false, ui.text("no"), fb), fb);
  });

  test("when lazily evaluates only selected branch", () => {
    let a = 0;
    let b = 0;
    const v = when(
      true,
      () => {
        a++;
        return ui.text("A");
      },
      () => {
        b++;
        return ui.text("B");
      },
    );
    assert.equal(v?.kind, "text");
    assert.equal(a, 1);
    assert.equal(b, 0);
  });

  test("match uses exact match and _ fallback", () => {
    const cases = {
      a: () => ui.text("A"),
      b: () => ui.text("B"),
      _: () => ui.text("D"),
    } as const;
    const v1 = match("a", cases);
    const v2 = match("b", cases);
    assert.equal(v1?.kind, "text");
    assert.equal(v2?.kind, "text");
    assert.equal((v1 as { text: string }).text, "A");
    assert.equal((v2 as { text: string }).text, "B");
  });

  test("maybe renders only when value is present", () => {
    assert.equal(
      maybe(null, () => ui.text("x")),
      null,
    );
    const v = maybe(123, (n) => ui.text(String(n)));
    assert.equal(v?.kind, "text");
  });
});
