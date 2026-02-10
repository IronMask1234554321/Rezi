import React, { type ReactNode } from "react";

export type Props = Readonly<{
  /**
   * Function which transforms children output. It accepts children and must return
   * transformed children too.
   */
  transform: (children: string, index: number) => string;
  children?: ReactNode;
}>;

/**
 * Ink-compatible `<Transform>` component.
 *
 * In Ink, this transforms the rendered string output. In the Rezi compat layer,
 * we apply the transform to the flattened text content (best-effort).
 */
export default function Transform({ children, transform }: Props): React.JSX.Element | null {
  if (children === undefined || children === null) return null;
  return React.createElement("ink-text", { internal_transform: transform }, children);
}
