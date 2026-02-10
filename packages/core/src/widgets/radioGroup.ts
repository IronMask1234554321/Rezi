/**
 * packages/core/src/widgets/radioGroup.ts — Radio group widget utilities.
 *
 * Why: Provides utilities for creating and managing radio group widgets.
 * Handles keyboard navigation (ArrowUp/Down) for option selection and
 * renders a group of mutually exclusive radio buttons.
 *
 * @see docs/widgets/radio-group.md (GitHub issue #119)
 */

import type { RadioGroupProps, SelectOption, VNode } from "./types.js";

/** Character for unselected radio button. */
export const RADIO_UNSELECTED = "( )";

/** Character for selected radio button. */
export const RADIO_SELECTED = "(*)";

/** Character for disabled unselected radio button. */
export const RADIO_DISABLED_UNSELECTED = "(-)";

/** Character for disabled selected radio button. */
export const RADIO_DISABLED_SELECTED = "(*)";

/**
 * Get the display character for a radio button state.
 *
 * @param selected - Whether this option is selected
 * @param disabled - Whether this option is disabled
 * @returns Display character for the radio button
 */
export function getRadioIndicator(selected: boolean, disabled?: boolean): string {
  if (disabled) {
    return selected ? RADIO_DISABLED_SELECTED : RADIO_DISABLED_UNSELECTED;
  }
  return selected ? RADIO_SELECTED : RADIO_UNSELECTED;
}

/**
 * Build the display text for a radio option.
 *
 * @param selected - Whether this option is selected
 * @param label - Option label
 * @param disabled - Whether this option is disabled
 * @returns Full display text
 */
export function buildRadioOptionText(selected: boolean, label: string, disabled?: boolean): string {
  const indicator = getRadioIndicator(selected, disabled);
  return `${indicator} ${label}`;
}

/**
 * Find the index of the selected option.
 *
 * @param value - Current selected value
 * @param options - Available options
 * @returns Index of selected option, or -1 if not found
 */
export function findSelectedIndex(value: string, options: readonly SelectOption[]): number {
  return options.findIndex((opt) => opt.value === value);
}

/**
 * Get the next selectable option index (for ArrowDown or ArrowRight).
 * Skips disabled options.
 *
 * @param currentIndex - Current selected index
 * @param options - Available options
 * @param wrapAround - Whether to wrap from last to first
 * @returns Next selectable index, or current if none found
 */
export function getNextRadioIndex(
  currentIndex: number,
  options: readonly SelectOption[],
  wrapAround = true,
): number {
  const len = options.length;
  if (len === 0) return -1;

  let index = currentIndex + 1;
  let iterations = 0;

  while (iterations < len) {
    if (index >= len) {
      if (wrapAround) {
        index = 0;
      } else {
        return currentIndex;
      }
    }

    const opt = options[index];
    if (opt && !opt.disabled) {
      return index;
    }

    index++;
    iterations++;
  }

  return currentIndex;
}

/**
 * Get the previous selectable option index (for ArrowUp or ArrowLeft).
 * Skips disabled options.
 *
 * @param currentIndex - Current selected index
 * @param options - Available options
 * @param wrapAround - Whether to wrap from first to last
 * @returns Previous selectable index, or current if none found
 */
export function getPrevRadioIndex(
  currentIndex: number,
  options: readonly SelectOption[],
  wrapAround = true,
): number {
  const len = options.length;
  if (len === 0) return -1;

  let index = currentIndex - 1;
  let iterations = 0;

  while (iterations < len) {
    if (index < 0) {
      if (wrapAround) {
        index = len - 1;
      } else {
        return currentIndex;
      }
    }

    const opt = options[index];
    if (opt && !opt.disabled) {
      return index;
    }

    index--;
    iterations++;
  }

  return currentIndex;
}

/**
 * Select the option at the given index.
 *
 * @param index - Index of option to select
 * @param options - Available options
 * @returns Value of the selected option, or undefined if invalid
 */
export function selectRadioAtIndex(
  index: number,
  options: readonly SelectOption[],
): string | undefined {
  const opt = options[index];
  if (opt && !opt.disabled) {
    return opt.value;
  }
  return undefined;
}

/**
 * Create a VNode for a radio group widget.
 *
 * @param props - Radio group properties
 * @returns VNode representing the radio group
 */
export function createRadioGroupVNode(props: RadioGroupProps): VNode {
  return {
    kind: "radioGroup",
    props,
  };
}
