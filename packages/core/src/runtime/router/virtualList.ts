import type { ZrevEvent } from "../../events.js";
import {
  clampScrollTop,
  ensureVisible,
  getItemHeight,
  getItemOffset,
  getTotalHeight,
} from "../../widgets/virtualList.js";
import type {
  VirtualListRoutingCtx,
  VirtualListRoutingResult,
  VirtualListWheelCtx,
} from "./types.js";

/* --- Key Codes (locked by engine ABI) --- */
/* MUST match packages/core/src/keybindings/keyCodes.ts */
const ZR_KEY_ENTER = 2;
const ZR_KEY_HOME = 12;
const ZR_KEY_END = 13;
const ZR_KEY_PAGE_UP = 14;
const ZR_KEY_PAGE_DOWN = 15;
const ZR_KEY_UP = 20;
const ZR_KEY_DOWN = 21;
const ZR_KEY_SPACE = 32; /* Space as ASCII codepoint in ZREV key events */

/**
 * Route keyboard events for virtual list navigation.
 *
 * Navigation keys:
 *   - ArrowUp/Down: Move selection by 1, auto-scroll to keep visible
 *   - PageUp/PageDown: Move by floor(viewportHeight / avgItemHeight) items
 *   - Home/End: Jump to first/last item
 *   - Enter/Space: Emit select action for current item
 */
export function routeVirtualListKey<T>(
  event: ZrevEvent,
  ctx: VirtualListRoutingCtx<T>,
): VirtualListRoutingResult {
  if (event.kind !== "key") return Object.freeze({});
  if (event.action !== "down") return Object.freeze({});
  if (!ctx.keyboardNavigation) return Object.freeze({});

  const { items, itemHeight, state, wrapAround, virtualListId } = ctx;
  const { selectedIndex, scrollTop, viewportHeight } = state;
  const itemCount = items.length;

  if (itemCount === 0) return Object.freeze({});

  // Helper to compute scroll position for a given selection
  const scrollToIndex = (index: number): number => {
    const offset = getItemOffset(items, itemHeight, index);
    const height = getItemHeight(items, itemHeight, index);
    const totalHeight = getTotalHeight(items, itemHeight);
    const newScrollTop = ensureVisible(scrollTop, viewportHeight, offset, height);
    return clampScrollTop(newScrollTop, totalHeight, viewportHeight);
  };

  // Compute items per page for PageUp/PageDown
  const computePageSize = (): number => {
    if (typeof itemHeight === "number") {
      return Math.max(1, Math.floor(viewportHeight / itemHeight));
    }
    // Variable heights: estimate based on visible items in current viewport
    // Use the actual visible range from state if available, otherwise estimate
    const visibleCount = state.endIndex - state.startIndex;
    if (visibleCount > 0) {
      return Math.max(1, visibleCount);
    }
    // Fallback: estimate average item height from first few items
    let sampleHeight = 0;
    const sampleCount = Math.min(10, itemCount);
    for (let i = 0; i < sampleCount; i++) {
      const item = items[i];
      if (item !== undefined) {
        sampleHeight += itemHeight(item, i);
      }
    }
    const avgHeight = sampleCount > 0 ? sampleHeight / sampleCount : 1;
    return Math.max(1, Math.floor(viewportHeight / avgHeight));
  };

  // Move selection up
  if (event.key === ZR_KEY_UP) {
    let nextIndex = selectedIndex - 1;
    if (nextIndex < 0) {
      nextIndex = wrapAround ? itemCount - 1 : 0;
    }
    if (nextIndex === selectedIndex) return Object.freeze({});

    const newScrollTop = scrollToIndex(nextIndex);
    if (newScrollTop !== scrollTop) {
      return Object.freeze({ nextSelectedIndex: nextIndex, nextScrollTop: newScrollTop });
    }
    return Object.freeze({ nextSelectedIndex: nextIndex });
  }

  // Move selection down
  if (event.key === ZR_KEY_DOWN) {
    let nextIndex = selectedIndex + 1;
    if (nextIndex >= itemCount) {
      nextIndex = wrapAround ? 0 : itemCount - 1;
    }
    if (nextIndex === selectedIndex) return Object.freeze({});

    const newScrollTop = scrollToIndex(nextIndex);
    if (newScrollTop !== scrollTop) {
      return Object.freeze({ nextSelectedIndex: nextIndex, nextScrollTop: newScrollTop });
    }
    return Object.freeze({ nextSelectedIndex: nextIndex });
  }

  // Page up
  if (event.key === ZR_KEY_PAGE_UP) {
    const pageSize = computePageSize();
    const nextIndex = Math.max(0, selectedIndex - pageSize);
    if (nextIndex === selectedIndex) return Object.freeze({});

    const newScrollTop = scrollToIndex(nextIndex);
    if (newScrollTop !== scrollTop) {
      return Object.freeze({ nextSelectedIndex: nextIndex, nextScrollTop: newScrollTop });
    }
    return Object.freeze({ nextSelectedIndex: nextIndex });
  }

  // Page down
  if (event.key === ZR_KEY_PAGE_DOWN) {
    const pageSize = computePageSize();
    const nextIndex = Math.min(itemCount - 1, selectedIndex + pageSize);
    if (nextIndex === selectedIndex) return Object.freeze({});

    const newScrollTop = scrollToIndex(nextIndex);
    if (newScrollTop !== scrollTop) {
      return Object.freeze({ nextSelectedIndex: nextIndex, nextScrollTop: newScrollTop });
    }
    return Object.freeze({ nextSelectedIndex: nextIndex });
  }

  // Home - jump to first item
  if (event.key === ZR_KEY_HOME) {
    if (selectedIndex === 0) return Object.freeze({});

    return Object.freeze({
      nextSelectedIndex: 0,
      nextScrollTop: 0,
    });
  }

  // End - jump to last item
  if (event.key === ZR_KEY_END) {
    const lastIndex = itemCount - 1;
    if (selectedIndex === lastIndex) return Object.freeze({});

    const totalHeight = getTotalHeight(items, itemHeight);
    const nextScrollTop = clampScrollTop(totalHeight, totalHeight, viewportHeight);
    return Object.freeze({
      nextSelectedIndex: lastIndex,
      nextScrollTop,
    });
  }

  // Enter/Space - emit select action
  if (event.key === ZR_KEY_ENTER || event.key === ZR_KEY_SPACE) {
    return Object.freeze({
      action: { id: virtualListId, action: "select" as const, index: selectedIndex },
    });
  }

  return Object.freeze({});
}

/**
 * Route mouse wheel events for virtual list scrolling.
 *
 * @param event - The ZREV event
 * @param ctx - Wheel routing context
 * @returns New scrollTop value if scrolling occurred
 */
export function routeVirtualListWheel(
  event: ZrevEvent,
  ctx: VirtualListWheelCtx,
): VirtualListRoutingResult {
  if (event.kind !== "mouse") return Object.freeze({});
  // Mouse kind 5 is scroll/wheel
  if (event.mouseKind !== 5) return Object.freeze({});

  const SCROLL_LINES = 3; // Lines per wheel tick
  // Use wheelY for vertical scrolling (negative = scroll up, positive = scroll down)
  const scrollDelta = event.wheelY * SCROLL_LINES;

  const { scrollTop, totalHeight, viewportHeight } = ctx;
  const nextScrollTop = clampScrollTop(scrollTop + scrollDelta, totalHeight, viewportHeight);

  if (nextScrollTop === scrollTop) return Object.freeze({});

  return Object.freeze({ nextScrollTop });
}
