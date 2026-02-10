/**
 * packages/core/src/widgets/styled.ts — Simple variant-based styled factories.
 */

import type { TextStyle } from "./style.js";
import { mergeStyles } from "./styleUtils.js";
import type { ButtonProps, VNode } from "./types.js";
import { ui } from "./ui.js";

type VariantDefinition<V extends string> = Record<V, TextStyle>;

type StyledConfig<Variants extends Record<string, VariantDefinition<string>>> = Readonly<{
  base?: TextStyle;
  variants?: Variants;
  defaults?: { [K in keyof Variants]?: keyof Variants[K] };
}>;

type VariantProps<Variants extends Record<string, VariantDefinition<string>>> = {
  [K in keyof Variants]?: keyof Variants[K];
};

export function styled<
  Kind extends "button" | "text",
  Variants extends Record<string, VariantDefinition<string>>,
>(
  kind: Kind,
  config: StyledConfig<Variants>,
): (
  props: (Kind extends "button" ? ButtonProps : { text: string }) & VariantProps<Variants>,
) => VNode {
  const variantEntries = config.variants
    ? (Object.entries(config.variants) as ReadonlyArray<[string, VariantDefinition<string>]>)
    : Object.freeze([]);

  return (props) => {
    let style: TextStyle = config.base ?? {};

    for (const [variantKey, variantDef] of variantEntries) {
      const selected =
        (props as Record<string, unknown>)[variantKey] ??
        (config.defaults?.[variantKey] as unknown);
      if (typeof selected !== "string") continue;
      const v = variantDef[selected];
      if (!v) continue;
      style = mergeStyles(style, v);
    }

    if (kind === "button") {
      const userStyle = (props as { style?: TextStyle }).style;
      const finalStyle = userStyle ? mergeStyles(style, userStyle) : style;
      return ui.button({ ...(props as ButtonProps), style: finalStyle });
    }

    return ui.text((props as { text: string }).text, { style });
  };
}
