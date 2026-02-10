/**
 * packages/core/src/forms/bind.ts — Simple binding helpers.
 */

import type { StateUpdater } from "../app/updateQueue.js";
import type { CheckboxProps, InputProps, SelectProps } from "../widgets/types.js";

type Updater<S> = (update: StateUpdater<S>) => void;

function setField<S extends Record<string, unknown>, K extends keyof S>(
  prev: Readonly<S>,
  field: K,
  value: S[K],
): S {
  return { ...(prev as S), [field]: value } as S;
}

export function bind<S extends Record<string, unknown>, K extends keyof S>(
  state: S,
  field: K,
  update: Updater<S>,
): Pick<InputProps, "value" | "onInput"> {
  return {
    value: String(state[field]),
    onInput: (value: string) => {
      update((prev) => setField(prev, field, value as S[K]));
    },
  };
}

export function bindTransform<S extends Record<string, unknown>, K extends keyof S>(
  state: S,
  field: K,
  update: Updater<S>,
  transform: {
    get: (value: S[K]) => string;
    set: (value: string) => S[K];
  },
): Pick<InputProps, "value" | "onInput"> {
  return {
    value: transform.get(state[field]),
    onInput: (value: string) => {
      const next = transform.set(value);
      update((prev) => setField(prev, field, next));
    },
  };
}

export function bindChecked<S extends Record<string, unknown>, K extends keyof S>(
  state: S,
  field: K,
  update: Updater<S>,
): Pick<CheckboxProps, "checked" | "onChange"> {
  return {
    checked: Boolean(state[field]),
    onChange: (checked: boolean) => {
      update((prev) => setField(prev, field, checked as S[K]));
    },
  };
}

export function bindSelect<S extends Record<string, unknown>, K extends keyof S>(
  state: S,
  field: K,
  update: Updater<S>,
): Pick<SelectProps, "value" | "onChange"> {
  return {
    value: String(state[field]),
    onChange: (value: string) => {
      update((prev) => setField(prev, field, value as S[K]));
    },
  };
}
