import type { ZrevEvent } from "../../events.js";
import type { FocusMove } from "../focus.js";
import { computeMovedFocusId } from "../focus.js";
import type { EnabledById, KeyRoutingCtx, RoutedAction, RoutingResult } from "./types.js";

/* --- Key Codes and Modifier Bits (locked by engine ABI) --- */
/* MUST match packages/core/src/keybindings/keyCodes.ts */
const ZR_KEY_ENTER = 2;
const ZR_KEY_TAB = 3;
const ZR_KEY_SPACE = 32; /* Space as ASCII codepoint in ZREV key events */
const ZR_MOD_SHIFT = 1 << 0;

function isEnabled(enabledById: EnabledById, id: string): boolean {
  return enabledById.get(id) === true;
}

/**
 * Deterministic KEY routing rules (docs/10 "Routing").
 *
 * This function MUST NOT emit UiEvents; it returns a routing result so the app
 * runtime can preserve the locked ordering (engine event, then immediate action).
 */
export function routeKey(event: ZrevEvent, ctx: KeyRoutingCtx): RoutingResult {
  if (event.kind !== "key") return Object.freeze({});
  if (event.action !== "down") return Object.freeze({});

  if (event.key === ZR_KEY_TAB) {
    const move: FocusMove = (event.mods & ZR_MOD_SHIFT) !== 0 ? "prev" : "next";
    const nextFocusedId = computeMovedFocusId(ctx.focusList, ctx.focusedId, move);
    return Object.freeze({ nextFocusedId });
  }

  if (event.key === ZR_KEY_ENTER || event.key === ZR_KEY_SPACE) {
    const focusedId = ctx.focusedId;
    if (focusedId !== null && isEnabled(ctx.enabledById, focusedId)) {
      if (ctx.pressableIds && !ctx.pressableIds.has(focusedId)) return Object.freeze({});
      const action: RoutedAction = Object.freeze({ id: focusedId, action: "press" });
      return Object.freeze({ action });
    }
    return Object.freeze({});
  }

  return Object.freeze({});
}
