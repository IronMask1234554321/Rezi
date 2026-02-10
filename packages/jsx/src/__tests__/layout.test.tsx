/** @jsxImportSource @rezi-ui/jsx */

import { ui } from "@rezi-ui/core";
import { assert, describe, test } from "@rezi-ui/testkit";
import { Box, Column, Divider, Layers, Row, Spacer, Text } from "../index.js";

describe("layout components", () => {
  test("Box maps props and children", () => {
    const vnode = (
      <Box border="rounded" p={1} m={1} width={30} style={{ bold: true }}>
        <Text>inside</Text>
      </Box>
    );

    assert.deepEqual(
      vnode,
      ui.box({ border: "rounded", p: 1, m: 1, width: 30, style: { bold: true } }, [
        ui.text("inside"),
      ]),
    );
  });

  test("Box supports empty children", () => {
    const vnode = <Box border="single" />;
    assert.deepEqual(vnode, ui.box({ border: "single" }, []));
  });

  test("Row and Column map stack props", () => {
    const vnode = (
      <Column gap={1} p={1} mx={2} minWidth={20}>
        <Row gap={2} justify="between" items="center">
          <Text>A</Text>
          <Text>B</Text>
        </Row>
      </Column>
    );

    assert.deepEqual(
      vnode,
      ui.column({ gap: 1, p: 1, mx: 2, minWidth: 20 }, [
        ui.row({ gap: 2, justify: "between", items: "center" }, [ui.text("A"), ui.text("B")]),
      ]),
    );
  });

  test("Spacer and Divider are leaf widgets", () => {
    assert.deepEqual(<Spacer />, ui.spacer());
    assert.deepEqual(<Spacer size={2} flex={1} />, ui.spacer({ size: 2, flex: 1 }));
    assert.deepEqual(
      <Divider direction="horizontal" char="-" label="Section" color="cyan" />,
      ui.divider({ direction: "horizontal", char: "-", label: "Section", color: "cyan" }),
    );
  });

  test("Layers normalizes children including conditionals and maps", () => {
    const showOverlay = false;
    const items = [
      { id: "1", name: "Alpha" },
      { id: "2", name: "Beta" },
    ] as const;

    const vnode = (
      <Layers>
        <Column>
          {showOverlay && <Text>hidden</Text>}
          <Text>visible</Text>
          {items.map((item) => (
            <Text key={item.id}>{item.name}</Text>
          ))}
        </Column>
      </Layers>
    );

    assert.deepEqual(
      vnode,
      ui.layers([
        ui.column({}, [
          ui.text("visible"),
          ui.text("Alpha", { key: "1" }),
          ui.text("Beta", { key: "2" }),
        ]),
      ]),
    );
  });
});
