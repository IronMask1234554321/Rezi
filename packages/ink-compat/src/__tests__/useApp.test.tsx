import { assert, describe, test } from "@rezi-ui/testkit";
import React from "react";
import AppContext from "../context/AppContext.js";
import { Text, useApp } from "../index.js";
import reconciler, { type HostRoot } from "../reconciler.js";

describe("useApp()", () => {
  test("throws when used outside render() root", () => {
    const root: HostRoot = { kind: "root", children: [], staticVNodes: [], onCommit: () => {} };
    const container = reconciler.createContainer(root, 0, null, false, null, "id", () => {}, null);

    function App() {
      const { exit } = useApp();
      exit();
      return <Text>hi</Text>;
    }

    assert.throws(() => {
      reconciler.updateContainer(<App />, container, null, () => {});
    }, /AppContext missing/);
  });

  test("delegates exit() to AppContext", () => {
    const root: HostRoot = { kind: "root", children: [], staticVNodes: [], onCommit: () => {} };
    const container = reconciler.createContainer(root, 0, null, false, null, "id", () => {}, null);

    let seen: Error | undefined;

    function App() {
      const { exit } = useApp();
      exit(new Error("boom"));
      return <Text>hi</Text>;
    }

    const wrapped = React.createElement(
      AppContext.Provider,
      {
        value: {
          exit: (e) => {
            seen = e;
          },
        },
      },
      <App />,
    );
    reconciler.updateContainer(wrapped, container, null, () => {});

    assert.equal(seen?.message, "boom");
  });
});
