import { assert, describe, test } from "@rezi-ui/testkit";
import { styled } from "../styled.js";

describe("styled", () => {
  test("styled button merges base + variants into props.style", () => {
    const Button = styled("button", {
      base: { bold: true },
      variants: {
        intent: {
          primary: { fg: { r: 1, g: 2, b: 3 } },
          danger: { fg: { r: 9, g: 9, b: 9 } },
        },
      },
      defaults: { intent: "primary" },
    });

    const v = Button({ id: "b", label: "B" });
    assert.equal(v.kind, "button");
    assert.deepEqual((v.props as { style?: unknown }).style, {
      bold: true,
      fg: { r: 1, g: 2, b: 3 },
    });
  });
});
