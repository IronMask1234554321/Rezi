import { assert, describe, test } from "@rezi-ui/testkit";
import { isCompositeVNode } from "../composition.js";
import { alertDialog, confirmDialog, promptDialog } from "../dialogs/index.js";

describe("dialogs", () => {
  test("confirmDialog returns a modal with actions", () => {
    const v = confirmDialog({
      id: "c",
      title: "T",
      message: "M",
      onConfirm: () => {},
      onCancel: () => {},
    });
    assert.equal(v.kind, "modal");
    const props = v.props as { id?: unknown; title?: unknown; actions?: unknown };
    assert.equal(props.id, "c");
    assert.equal(props.title, "T");
    assert.ok(Array.isArray(props.actions));
  });

  test("alertDialog returns a modal", () => {
    const v = alertDialog({ id: "a", title: "T", message: "M", onClose: () => {} });
    assert.equal(v.kind, "modal");
    assert.equal((v.props as { id?: unknown }).id, "a");
  });

  test("promptDialog returns a composite vnode", () => {
    const v = promptDialog({ id: "p", title: "T", onSubmit: () => {}, onCancel: () => {} });
    assert.equal(isCompositeVNode(v), true);
  });
});
