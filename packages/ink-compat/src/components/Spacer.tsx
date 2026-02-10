import React from "react";

/**
 * Ink-compatible `<Spacer>` component.
 *
 * Ink implements this as `<Box flexGrow={1} />`. For Rezi, we map it directly
 * to a spacer node to avoid creating unnecessary layout containers.
 */
export default function Spacer(): React.JSX.Element {
  return React.createElement("ink-spacer", null);
}
