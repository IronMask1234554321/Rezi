import React from "react";

export type Props = Readonly<{
  /**
   * Number of newlines to insert.
   *
   * @default 1
   */
  count?: number;
}>;

/**
 * Ink-compatible `<Newline>` component.
 *
 * Adds one or more newline (`\n`) characters. Intended to be used within `<Text>`.
 */
export default function Newline({ count = 1 }: Props): React.JSX.Element {
  return React.createElement("ink-text", null, "\n".repeat(count));
}
