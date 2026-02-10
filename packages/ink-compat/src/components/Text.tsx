import React from "react";
import type { TextProps } from "../types.js";

/**
 * Ink-compatible `<Text>` component.
 *
 * Mirrors Ink behavior: returns null when `children` is null/undefined.
 */
export default function Text(props: TextProps): React.JSX.Element | null {
  if (props.children === undefined || props.children === null) return null;
  const { children, ...rest } = props;
  return React.createElement("ink-text", rest, children);
}
