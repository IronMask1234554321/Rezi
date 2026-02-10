import { assert, describe, test } from "@rezi-ui/testkit";
import React from "react";
import { Box, Newline, Spacer, Text } from "../../index.js";
import { createHarness } from "./harness.js";

describe("integration: nested layout", () => {
  test("nested <Box> trees map into the expected Rezi VNode structure", () => {
    const h = createHarness();

    function App() {
      return (
        <Box
          flexDirection="column"
          padding={1}
          margin={1}
          borderStyle="double"
          borderTop={false}
          gap={1}
        >
          <Box flexDirection="row" paddingX={2} marginLeft={1} gap={1}>
            <Text>Left</Text>
            <Spacer />
            <Text>Right</Text>
          </Box>
          <Box flexDirection="column-reverse">
            <Text>First</Text>
            <Text>Second</Text>
          </Box>
          <Text>
            A
            <Newline />B
          </Text>
        </Box>
      );
    }

    h.update(<App />);
    const vnode = h.getLast();

    // Outer border wrapper should be a box containing a column stack.
    assert.equal(vnode.kind, "box");
    assert.equal(vnode.props.border, "double");
    assert.equal((vnode.props as { borderTop?: unknown }).borderTop, false);
    assert.equal(vnode.children.length, 1);
    assert.equal(vnode.children[0]?.kind, "column");

    const outerStack = vnode.children[0];
    if (!outerStack || outerStack.kind !== "column") {
      assert.fail("expected outer stack to be a column");
    }

    // First child: row with spacer in the middle.
    const row = outerStack.children[0];
    assert.equal(row?.kind, "row");
    if (!row || row.kind !== "row") {
      assert.fail("expected first child to be a row");
    }
    assert.equal(row.children.length, 3);
    assert.equal(row.children[1]?.kind, "spacer");

    // Second child: column-reverse => "Second" then "First".
    const rev = outerStack.children[1];
    assert.equal(rev?.kind, "column");
    if (!rev || rev.kind !== "column") {
      assert.fail("expected second child to be a column");
    }
    assert.equal(rev.children[0]?.kind, "text");
    assert.equal(rev.children[0]?.text, "Second");
    assert.equal(rev.children[1]?.kind, "text");
    assert.equal(rev.children[1]?.text, "First");

    // Third child: multiline <Text> becomes a column of lines.
    const multi = outerStack.children[2];
    assert.equal(multi?.kind, "column");

    h.unmount();
  });
});
