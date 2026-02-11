import type React from "react";
import reconciler from "./reconciler/hostConfig.js";
import type { HostRoot } from "./reconciler/types.js";

export type RootContainer = ReturnType<typeof reconciler.createContainer>;

type RuntimeReconciler = Readonly<{
  createContainer: (
    containerInfo: HostRoot,
    tag: number,
    hydrationCallbacks: null,
    isStrictMode: boolean,
    concurrentUpdatesByDefaultOverride: null | boolean,
    identifierPrefix: string,
    onUncaughtError: (error: Error) => void,
    onCaughtError: (error: Error) => void,
    onRecoverableError: (error: Error) => void,
    transitionCallbacks: null,
  ) => RootContainer;
  updateContainer: (
    element: unknown,
    container: RootContainer,
    parentComponent: null,
    callback: (() => void) | null,
  ) => unknown;
  updateContainerSync?: (
    element: unknown,
    container: RootContainer,
    parentComponent: null,
    callback: (() => void) | null,
  ) => unknown;
  flushSyncFromReconciler?: (fn: () => void) => unknown;
  flushSyncWork?: () => unknown;
}>;

const runtimeReconciler = reconciler as unknown as RuntimeReconciler;
const noop = () => {};
const rethrow = (error: Error) => {
  throw error;
};

export function createRootContainer(root: HostRoot, identifierPrefix = "id"): RootContainer {
  return runtimeReconciler.createContainer(
    root,
    0,
    null,
    false,
    null,
    identifierPrefix,
    rethrow,
    rethrow,
    rethrow,
    undefined as unknown as null,
  );
}

export function updateRootContainer(
  container: RootContainer,
  element: React.ReactNode | null,
  callback: (() => void) | null = noop,
): void {
  if (typeof runtimeReconciler.updateContainerSync === "function") {
    runtimeReconciler.updateContainerSync(element, container, null, null);
  } else {
    runtimeReconciler.updateContainer(element, container, null, null);
  }

  // Drain sync + passive work until stable so callers can observe committed state.
  for (let i = 0; i < 100; i++) {
    const didSync = runtimeReconciler.flushSyncWork?.() === true;
    const didPassive = reconciler.flushPassiveEffects() === true;
    if (!didSync && !didPassive) break;
  }

  callback?.();
}

export default reconciler;
export type {
  HostContext,
  HostElement,
  HostNode,
  HostRoot,
  HostText,
  HostType,
} from "./reconciler/types.js";
