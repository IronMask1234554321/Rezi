import { assert, describe, test } from "@rezi-ui/testkit";
import { ui } from "../ui.js";

describe("overlay widgets - VNode construction", () => {
  test("dropdown creates VNode with all props", () => {
    const items = [
      { id: "new", label: "New", shortcut: "Ctrl+N" },
      { id: "divider", label: "", divider: true },
      { id: "exit", label: "Exit", disabled: true },
    ] as const;
    const vnode = ui.dropdown({
      id: "file-menu",
      anchorId: "file-btn",
      position: "below-end",
      items,
      onSelect: () => undefined,
      onClose: () => undefined,
    });

    assert.equal(vnode.kind, "dropdown");
    assert.deepEqual(vnode.props, {
      id: "file-menu",
      anchorId: "file-btn",
      position: "below-end",
      items,
      onSelect: vnode.props.onSelect,
      onClose: vnode.props.onClose,
    });
  });

  test("commandPalette creates VNode and preserves query/open state", () => {
    const source = {
      id: "cmd",
      name: "Commands",
      prefix: ">",
      getItems: (query: string) =>
        [{ id: "echo", label: `Echo ${query}`, sourceId: "cmd" }] as const,
    } as const;

    const vnode = ui.commandPalette({
      id: "palette",
      open: true,
      query: "ec",
      sources: [source],
      selectedIndex: 0,
      loading: false,
      placeholder: "Type a command",
      maxVisible: 15,
      onQueryChange: () => undefined,
      onSelect: () => undefined,
      onClose: () => undefined,
      onSelectionChange: () => undefined,
    });

    assert.equal(vnode.kind, "commandPalette");
    assert.equal(vnode.props.id, "palette");
    assert.equal(vnode.props.open, true);
    assert.equal(vnode.props.query, "ec");
    assert.equal(vnode.props.sources.length, 1);
    assert.equal(vnode.props.maxVisible, 15);
  });

  test("toolApprovalDialog creates VNode and handles optional focused action", () => {
    const vnode = ui.toolApprovalDialog({
      id: "approval",
      open: true,
      request: {
        toolId: "shell",
        toolName: "Shell",
        riskLevel: "high",
        command: "rm -rf /tmp/demo",
      },
      focusedAction: "deny",
      onAllow: () => undefined,
      onDeny: () => undefined,
      onAllowForSession: () => undefined,
      onClose: () => undefined,
    });

    assert.equal(vnode.kind, "toolApprovalDialog");
    assert.equal(vnode.props.request.toolId, "shell");
    assert.equal(vnode.props.request.riskLevel, "high");
    assert.equal(vnode.props.focusedAction, "deny");
  });

  test("toastContainer creates VNode with edge values", () => {
    const vnode = ui.toastContainer({
      toasts: [
        {
          id: "t1",
          message: "Saved",
          type: "success",
          duration: 0,
          progress: Number.POSITIVE_INFINITY,
          action: { label: "Undo", onAction: () => undefined },
        },
      ],
      position: "top-left",
      maxVisible: 0,
      onDismiss: () => undefined,
    });

    assert.equal(vnode.kind, "toastContainer");
    assert.equal(vnode.props.toasts.length, 1);
    assert.equal(vnode.props.position, "top-left");
    assert.equal(vnode.props.maxVisible, 0);
  });
});
