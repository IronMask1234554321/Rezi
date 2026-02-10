/** @jsxImportSource @rezi-ui/jsx */

import { type VNode, ui } from "@rezi-ui/core";
import { assert, describe, test } from "@rezi-ui/testkit";
import { Column, type JsxChildren, Text } from "../index.js";

describe("function components", () => {
  test("simple component returning a VNode", () => {
    function Label(): VNode {
      return <Text>ready</Text>;
    }

    assert.deepEqual(<Label />, ui.text("ready"));
  });

  test("typed props are passed correctly", () => {
    function StatusLine(props: { message: string; level: "info" | "error" }): VNode {
      return (
        <Text>
          {props.level}: {props.message}
        </Text>
      );
    }

    assert.deepEqual(<StatusLine message="ok" level="info" />, ui.text("info: ok"));
  });

  test("nested function components compose correctly", () => {
    function Item(props: { value: string }): VNode {
      return <Text>{props.value}</Text>;
    }

    function List(): VNode {
      return (
        <Column>
          <Item value="A" />
          <Item value="B" />
        </Column>
      );
    }

    assert.deepEqual(<List />, ui.column({}, [ui.text("A"), ui.text("B")]));
  });

  test("components can receive and render children", () => {
    function Frame(props: { title: string; children?: JsxChildren }): VNode {
      return (
        <Column>
          <Text>{props.title}</Text>
          {props.children}
        </Column>
      );
    }

    assert.deepEqual(
      <Frame title="T">
        <Text>A</Text>
      </Frame>,
      ui.column({}, [ui.text("T"), ui.text("A")]),
    );
  });

  test("components can render conditionally", () => {
    function Maybe(props: { show: boolean }): VNode {
      return <Column>{props.show && <Text>shown</Text>}</Column>;
    }

    assert.deepEqual(<Maybe show={true} />, ui.column({}, [ui.text("shown")]));
    assert.deepEqual(<Maybe show={false} />, ui.column({}, []));
  });
});
