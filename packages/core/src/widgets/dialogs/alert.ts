/**
 * packages/core/src/widgets/dialogs/alert.ts — Alert dialog factory.
 */

import type { VNode } from "../types.js";
import { ui } from "../ui.js";
import type { AlertDialogProps } from "./types.js";

export function alertDialog(props: AlertDialogProps): VNode {
  const { id, title, message, onClose } = props;

  return ui.modal({
    id,
    title,
    content: ui.text(message),
    actions: [
      ui.button({
        id: `${id}-close`,
        label: "Close",
        onPress: onClose,
      }),
    ],
    onClose,
  });
}
