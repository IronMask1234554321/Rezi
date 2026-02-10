/**
 * packages/core/src/runtime/instances.ts — Instance registry for composite widgets.
 *
 * Why: Manages per-instance state for composite widgets created with defineWidget.
 * Stores hook state (useState values, refs, effects), tracks render order for
 * hook call validation, and handles cleanup on unmount.
 *
 * Instance lifecycle:
 *   - Created when composite widget first renders
 *   - Reused on subsequent renders if instance ID matches
 *   - Cleaned up when instance is unmounted (effects run cleanup)
 *
 * @see docs/guide/runtime-and-layout.md
 */

import type { InstanceId } from "./instance.js";

/** Effect cleanup function returned by effect callbacks. */
export type EffectCleanup = () => void;

/** Stored effect state for useEffect. */
export type EffectState = Readonly<{
  deps: readonly unknown[] | undefined;
  cleanup: EffectCleanup | undefined;
  /** Effect callback to run after commit. */
  effect: () => undefined | EffectCleanup;
}>;

/** Stored ref state for useRef. */
export type RefState<T = unknown> = { current: T };

/** Per-hook-index state storage. */
export type HookState =
  | {
      kind: "state";
      value: unknown;
    }
  | {
      kind: "ref";
      ref: RefState;
    }
  | {
      kind: "effect";
      effect: EffectState;
    };

/** Complete instance state for a composite widget. */
export type CompositeInstanceState = Readonly<{
  /** Unique instance identifier (matches RuntimeInstance.instanceId). */
  instanceId: InstanceId;
  /** Widget definition key for identity checking. */
  widgetKey: string;
  /** Mutable array of hook states, indexed by hook call order. */
  hooks: HookState[];
  /** Current hook index during render (reset at start of each render). */
  hookIndex: number;
  /** Whether this instance needs re-render. */
  needsRender: boolean;
  /** Pending effects to run after commit. */
  pendingEffects: EffectState[];
  /** Generation counter for detecting stale updates. */
  generation: number;
}>;

/** Mutable version for internal use. */
type MutableInstanceState = {
  instanceId: InstanceId;
  widgetKey: string;
  hooks: HookState[];
  hookIndex: number;
  needsRender: boolean;
  pendingEffects: EffectState[];
  generation: number;
};

/** Instance registry store interface. */
export type CompositeInstanceRegistry = Readonly<{
  /** Get instance state by ID, or undefined if not found. */
  get: (instanceId: InstanceId) => CompositeInstanceState | undefined;

  /** Create new instance state. Throws if already exists. */
  create: (instanceId: InstanceId, widgetKey: string) => CompositeInstanceState;

  /** Delete instance and run cleanup. Returns true if instance existed. */
  delete: (instanceId: InstanceId) => boolean;

  /** Mark instance as needing re-render. */
  invalidate: (instanceId: InstanceId) => void;

  /** Reset hook index for a new render pass. */
  beginRender: (instanceId: InstanceId) => void;

  /** Validate hook order after render and collect pending effects. */
  endRender: (instanceId: InstanceId) => readonly EffectState[];

  /** Increment generation and return new value. */
  incrementGeneration: (instanceId: InstanceId) => number;

  /** Get all instance IDs (for debugging/testing). */
  getAllIds: () => readonly InstanceId[];
}>;

/**
 * Compare dependency arrays for equality.
 * Returns true only if both are arrays with equal elements.
 * If either is undefined (no deps), returns false to trigger re-run.
 */
function depsEqual(
  prev: readonly unknown[] | undefined,
  next: readonly unknown[] | undefined,
): boolean {
  // No deps array = run every render (React behavior)
  if (prev === undefined || next === undefined) return false;
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i++) {
    if (!Object.is(prev[i], next[i])) return false;
  }
  return true;
}

/**
 * Run cleanup for an effect if it has one.
 */
function runEffectCleanup(effect: EffectState): void {
  if (effect.cleanup) {
    try {
      effect.cleanup();
    } catch {
      // Cleanup errors are swallowed (React behavior)
    }
  }
}

/**
 * Run all cleanups for an instance's effects.
 */
function runAllCleanups(state: MutableInstanceState): void {
  for (const hook of state.hooks) {
    if (hook.kind === "effect") {
      runEffectCleanup(hook.effect);
    }
  }
}

/** Create a new composite instance registry. */
export function createCompositeInstanceRegistry(): CompositeInstanceRegistry {
  const instances = new Map<InstanceId, MutableInstanceState>();

  return Object.freeze({
    get(instanceId: InstanceId): CompositeInstanceState | undefined {
      return instances.get(instanceId);
    },

    create(instanceId: InstanceId, widgetKey: string): CompositeInstanceState {
      if (instances.has(instanceId)) {
        throw new Error(`CompositeInstanceRegistry: instance ${String(instanceId)} already exists`);
      }

      const state: MutableInstanceState = {
        instanceId,
        widgetKey,
        hooks: [],
        hookIndex: 0,
        needsRender: true,
        pendingEffects: [],
        generation: 0,
      };

      instances.set(instanceId, state);
      return state;
    },

    delete(instanceId: InstanceId): boolean {
      const state = instances.get(instanceId);
      if (!state) return false;

      // Run all effect cleanups
      runAllCleanups(state);

      instances.delete(instanceId);
      return true;
    },

    invalidate(instanceId: InstanceId): void {
      const state = instances.get(instanceId);
      if (state) {
        state.needsRender = true;
      }
    },

    beginRender(instanceId: InstanceId): void {
      const state = instances.get(instanceId);
      if (state) {
        state.hookIndex = 0;
        state.pendingEffects = [];
      }
    },

    endRender(instanceId: InstanceId): readonly EffectState[] {
      const state = instances.get(instanceId);
      if (!state) return [];

      state.needsRender = false;
      // No slice needed: beginRender replaces the array rather than mutating it
      return Object.freeze(state.pendingEffects);
    },

    incrementGeneration(instanceId: InstanceId): number {
      const state = instances.get(instanceId);
      if (!state) return 0;

      state.generation++;
      return state.generation;
    },

    getAllIds(): readonly InstanceId[] {
      return Object.freeze(Array.from(instances.keys()));
    },
  });
}

/** Hook context for hook implementations. */
export type HookContext = Readonly<{
  /** Get or create state hook at current index. */
  useState: <T>(initial: T | (() => T)) => [T, (v: T | ((prev: T) => T)) => void];

  /** Get or create ref hook at current index. */
  useRef: <T>(initial: T) => RefState<T>;

  /** Register effect hook at current index. */
  useEffect: {
    (effect: () => void, deps?: readonly unknown[]): void;
    (effect: () => EffectCleanup, deps?: readonly unknown[]): void;
  };
}>;

/**
 * Create hook context for a render pass.
 * Tracks hook order and validates consistent call order.
 */
export function createHookContext(
  state: CompositeInstanceState,
  onInvalidate: () => void,
): HookContext {
  const mutableState = state as MutableInstanceState;

  function getHookIndex(): number {
    const index = mutableState.hookIndex;
    mutableState.hookIndex++;
    return index;
  }

  return Object.freeze({
    useState<T>(initial: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void] {
      const index = getHookIndex();
      const existing = mutableState.hooks[index];

      if (existing === undefined) {
        // First render: initialize state
        const initialValue = typeof initial === "function" ? (initial as () => T)() : initial;

        mutableState.hooks[index] = {
          kind: "state",
          value: initialValue,
        };
      } else if (existing.kind !== "state") {
        throw new Error(
          `Hook order mismatch at index ${index}: expected state, got ${existing.kind}`,
        );
      }

      const hookState = mutableState.hooks[index] as { kind: "state"; value: T };
      const currentGeneration = mutableState.generation;

      const setValue = (v: T | ((prev: T) => T)) => {
        // Stale closure check
        if (mutableState.generation !== currentGeneration) {
          return; // Ignore updates from stale closures
        }

        const nextValue = typeof v === "function" ? (v as (prev: T) => T)(hookState.value) : v;

        if (!Object.is(hookState.value, nextValue)) {
          hookState.value = nextValue;
          onInvalidate();
        }
      };

      return [hookState.value, setValue];
    },

    useRef<T>(initial: T): RefState<T> {
      const index = getHookIndex();
      const existing = mutableState.hooks[index];

      if (existing === undefined) {
        // First render: initialize ref
        const ref: RefState<T> = { current: initial };
        mutableState.hooks[index] = {
          kind: "ref",
          ref,
        };
      } else if (existing.kind !== "ref") {
        throw new Error(
          `Hook order mismatch at index ${index}: expected ref, got ${existing.kind}`,
        );
      }

      return (mutableState.hooks[index] as { kind: "ref"; ref: RefState<T> }).ref;
    },

    useEffect(effect: () => unknown, deps?: readonly unknown[]): void {
      const index = getHookIndex();
      const existing = mutableState.hooks[index];
      const normalizedEffect = (): undefined | EffectCleanup => {
        const result = effect();
        return typeof result === "function" ? (result as EffectCleanup) : undefined;
      };

      if (existing === undefined) {
        // First render: schedule effect
        const effectState: EffectState = {
          deps,
          cleanup: undefined,
          effect: normalizedEffect,
        };
        mutableState.hooks[index] = {
          kind: "effect",
          effect: effectState,
        };
        mutableState.pendingEffects.push(effectState);
      } else if (existing.kind !== "effect") {
        throw new Error(
          `Hook order mismatch at index ${index}: expected effect, got ${existing.kind}`,
        );
      } else {
        // Subsequent render: check deps
        const prevEffect = existing.effect;
        if (!depsEqual(prevEffect.deps, deps)) {
          // Deps changed: run cleanup and schedule new effect
          runEffectCleanup(prevEffect);

          const effectState: EffectState = {
            deps,
            cleanup: undefined,
            effect: normalizedEffect,
          };
          mutableState.hooks[index] = {
            kind: "effect",
            effect: effectState,
          };
          mutableState.pendingEffects.push(effectState);
        }
      }
    },
  });
}

/**
 * Run pending effects after commit.
 * Returns cleanup functions registered by effects.
 */
export function runPendingEffects(effects: readonly EffectState[]): void {
  for (const effectState of effects) {
    const cleanup = effectState.effect();
    if (typeof cleanup === "function") {
      (effectState as { cleanup: EffectCleanup | undefined }).cleanup = cleanup;
    }
  }
}

/**
 * Garbage collect unmounted instances.
 * Takes a set of currently mounted instance IDs and removes any not in the set.
 */
export function gcUnmountedInstances(
  registry: CompositeInstanceRegistry,
  mountedIds: ReadonlySet<InstanceId>,
): readonly InstanceId[] {
  const allIds = registry.getAllIds();
  const removed: InstanceId[] = [];

  for (const id of allIds) {
    if (!mountedIds.has(id)) {
      registry.delete(id);
      removed.push(id);
    }
  }

  return Object.freeze(removed);
}
