/**
 * packages/core/src/widgets/checkbox.ts — Checkbox widget utilities.
 *
 * Why: Provides utilities for creating and managing checkbox widgets.
 * Handles the checked/unchecked visual state and Space key toggling.
 *
 * @see docs/widgets/checkbox.md (GitHub issue #119)
 */

import type { CheckboxProps, VNode } from "./types.js";

/** Character for unchecked checkbox. */
export const CHECKBOX_UNCHECKED = "[ ]";

/** Character for checked checkbox. */
export const CHECKBOX_CHECKED = "[x]";

/** Character for disabled unchecked checkbox. */
export const CHECKBOX_DISABLED_UNCHECKED = "[-]";

/** Character for disabled checked checkbox. */
export const CHECKBOX_DISABLED_CHECKED = "[x]";

/**
 * Get the display character for a checkbox state.
 *
 * @param checked - Whether the checkbox is checked
 * @param disabled - Whether the checkbox is disabled
 * @returns Display character for the checkbox
 */
export function getCheckboxIndicator(checked: boolean, disabled?: boolean): string {
  if (disabled) {
    return checked ? CHECKBOX_DISABLED_CHECKED : CHECKBOX_DISABLED_UNCHECKED;
  }
  return checked ? CHECKBOX_CHECKED : CHECKBOX_UNCHECKED;
}

/**
 * Build the display text for a checkbox with optional label.
 *
 * @param checked - Whether the checkbox is checked
 * @param label - Optional label text
 * @param disabled - Whether the checkbox is disabled
 * @returns Full display text
 */
export function buildCheckboxText(checked: boolean, label?: string, disabled?: boolean): string {
  const indicator = getCheckboxIndicator(checked, disabled);
  if (label) {
    return `${indicator} ${label}`;
  }
  return indicator;
}

/**
 * Toggle a checkbox value.
 *
 * @param current - Current checked state
 * @returns Toggled state
 */
export function toggleCheckbox(current: boolean): boolean {
  return !current;
}

/**
 * Create a VNode for a checkbox widget.
 *
 * @param props - Checkbox properties
 * @returns VNode representing the checkbox
 */
export function createCheckboxVNode(props: CheckboxProps): VNode {
  return {
    kind: "checkbox",
    props,
  };
}
