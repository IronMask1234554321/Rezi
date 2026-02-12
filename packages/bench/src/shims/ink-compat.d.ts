declare module "@rezi-ui/ink-compat" {
  import type { ReactNode } from "react";

  export const Box: unknown;
  export const Text: unknown;
  export const Spacer: unknown;

  export interface CompatRenderResult {
    rerender(tree: ReactNode): void;
    unmount(): void;
  }

  export function render(tree: ReactNode, options?: unknown): CompatRenderResult;
}
