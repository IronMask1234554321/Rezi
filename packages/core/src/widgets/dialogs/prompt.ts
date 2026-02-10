/**
 * packages/core/src/widgets/dialogs/prompt.ts — Prompt dialog factory.
 *
 * Note: Implemented as a composite widget to hold local input state.
 */

import { defineWidget } from "../composition.js";
import type { VNode } from "../types.js";
import { ui } from "../ui.js";
import type { PromptDialogProps } from "./types.js";

type PromptDialogWidgetProps = PromptDialogProps & Readonly<{ key?: string }>;

const PromptDialog = defineWidget<PromptDialogWidgetProps>(
  (props, ctx) => {
    const { id, title, placeholder, defaultValue, onSubmit, onCancel } = props;
    const [value, setValue] = ctx.useState(defaultValue ?? "");

    return ui.modal({
      id,
      title,
      content: ui.column({ gap: 1 }, [
        placeholder ? ui.text(placeholder) : null,
        ui.input({
          id: `${id}-input`,
          value,
          onInput: (v) => setValue(v),
        }),
      ]),
      actions: [
        ui.button({
          id: `${id}-submit`,
          label: "Submit",
          onPress: () => onSubmit(value),
        }),
        ui.button({
          id: `${id}-cancel`,
          label: "Cancel",
          onPress: onCancel,
        }),
      ],
      onClose: onCancel,
    });
  },
  { name: "PromptDialog" },
);

export function promptDialog(props: PromptDialogProps): VNode {
  return PromptDialog(props);
}
