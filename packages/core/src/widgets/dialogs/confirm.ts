/**
 * packages/core/src/widgets/dialogs/confirm.ts — Confirm dialog factory.
 */

import type { VNode } from "../types.js";
import { ui } from "../ui.js";
import type { ConfirmDialogProps } from "./types.js";

export function confirmDialog(props: ConfirmDialogProps): VNode {
  const {
    id,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    intent = "primary",
    onConfirm,
    onCancel,
  } = props;

  void intent;

  return ui.modal({
    id,
    title,
    content: ui.text(message),
    actions: [
      ui.button({
        id: `${id}-confirm`,
        label: confirmLabel,
        onPress: onConfirm,
      }),
      ui.button({
        id: `${id}-cancel`,
        label: cancelLabel,
        onPress: onCancel,
      }),
    ],
    onClose: onCancel,
  });
}
