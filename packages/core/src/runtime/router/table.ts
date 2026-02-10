import type { ZrevEvent } from "../../events.js";
import { computeSelection, getRowKeyAtIndex, selectAll } from "../../widgets/table.js";
import type { TableRoutingCtx, TableRoutingResult } from "./types.js";

/* --- Key Codes and Modifier Bits (locked by engine ABI) --- */
/* MUST match packages/core/src/keybindings/keyCodes.ts */
const ZR_KEY_ENTER = 2;
const ZR_KEY_HOME = 12;
const ZR_KEY_END = 13;
const ZR_KEY_PAGE_UP = 14;
const ZR_KEY_PAGE_DOWN = 15;
const ZR_KEY_UP = 20;
const ZR_KEY_DOWN = 21;
const ZR_KEY_SPACE = 32; /* Space as ASCII codepoint in ZREV key events */
const ZR_MOD_SHIFT = 1 << 0;

const ZR_KEY_A = 65; // 'A' ASCII code for Ctrl+A

/**
 * Route keyboard events for table navigation.
 *
 * Navigation keys:
 *   - ArrowUp/Down: Move focus by 1 row
 *   - PageUp/PageDown: Move by page
 *   - Home/End: Jump to first/last row
 *   - Enter: Emit rowPress action
 *   - Space: Toggle selection (multi mode)
 *   - Ctrl+A: Select all (multi mode)
 */
export function routeTableKey<T>(event: ZrevEvent, ctx: TableRoutingCtx<T>): TableRoutingResult {
  if (event.kind !== "key") return Object.freeze({ consumed: false });
  if (event.action !== "down") return Object.freeze({ consumed: false });
  if (!ctx.keyboardNavigation) return Object.freeze({ consumed: false });

  const { tableId, rowKeys, rowKeyToIndex, rowHeight, state, selection, selectionMode } = ctx;
  const { focusedRowIndex, scrollTop, viewportHeight, lastClickedKey } = state;
  const rowCount = rowKeys.length;

  if (rowCount === 0) return Object.freeze({ consumed: false });

  // Helper to compute scroll position for a given row index
  const scrollToRow = (rowIndex: number): number => {
    const rowTop = rowIndex * rowHeight;
    const rowBottom = rowTop + rowHeight;
    const viewportBottom = scrollTop + viewportHeight;

    // If row is above viewport, scroll up
    if (rowTop < scrollTop) {
      return rowTop;
    }
    // If row is below viewport, scroll down
    if (rowBottom > viewportBottom) {
      return Math.max(0, rowBottom - viewportHeight);
    }
    // Row is visible
    return scrollTop;
  };

  // Compute page size
  const pageSize = Math.max(1, Math.floor(viewportHeight / rowHeight));

  // Arrow Up
  if (event.key === ZR_KEY_UP) {
    const nextIndex = Math.max(0, focusedRowIndex - 1);
    if (nextIndex === focusedRowIndex) return Object.freeze({ consumed: true });

    const newScrollTop = scrollToRow(nextIndex);
    const result: TableRoutingResult = {
      nextFocusedRowIndex: nextIndex,
      consumed: true,
    };

    if (newScrollTop !== scrollTop) {
      return Object.freeze({ ...result, nextScrollTop: newScrollTop });
    }
    return Object.freeze(result);
  }

  // Arrow Down
  if (event.key === ZR_KEY_DOWN) {
    const nextIndex = Math.min(rowCount - 1, focusedRowIndex + 1);
    if (nextIndex === focusedRowIndex) return Object.freeze({ consumed: true });

    const newScrollTop = scrollToRow(nextIndex);
    const result: TableRoutingResult = {
      nextFocusedRowIndex: nextIndex,
      consumed: true,
    };

    if (newScrollTop !== scrollTop) {
      return Object.freeze({ ...result, nextScrollTop: newScrollTop });
    }
    return Object.freeze(result);
  }

  // Page Up
  if (event.key === ZR_KEY_PAGE_UP) {
    const nextIndex = Math.max(0, focusedRowIndex - pageSize);
    if (nextIndex === focusedRowIndex) return Object.freeze({ consumed: true });

    const newScrollTop = scrollToRow(nextIndex);
    const result: TableRoutingResult = {
      nextFocusedRowIndex: nextIndex,
      consumed: true,
    };

    if (newScrollTop !== scrollTop) {
      return Object.freeze({ ...result, nextScrollTop: newScrollTop });
    }
    return Object.freeze(result);
  }

  // Page Down
  if (event.key === ZR_KEY_PAGE_DOWN) {
    const nextIndex = Math.min(rowCount - 1, focusedRowIndex + pageSize);
    if (nextIndex === focusedRowIndex) return Object.freeze({ consumed: true });

    const newScrollTop = scrollToRow(nextIndex);
    const result: TableRoutingResult = {
      nextFocusedRowIndex: nextIndex,
      consumed: true,
    };

    if (newScrollTop !== scrollTop) {
      return Object.freeze({ ...result, nextScrollTop: newScrollTop });
    }
    return Object.freeze(result);
  }

  // Home
  if (event.key === ZR_KEY_HOME) {
    if (focusedRowIndex === 0) return Object.freeze({ consumed: true });

    return Object.freeze({
      nextFocusedRowIndex: 0,
      nextScrollTop: 0,
      consumed: true,
    });
  }

  // End
  if (event.key === ZR_KEY_END) {
    const lastIndex = rowCount - 1;
    if (focusedRowIndex === lastIndex) return Object.freeze({ consumed: true });

    const newScrollTop = scrollToRow(lastIndex);
    const result: TableRoutingResult = {
      nextFocusedRowIndex: lastIndex,
      consumed: true,
    };

    if (newScrollTop !== scrollTop) {
      return Object.freeze({ ...result, nextScrollTop: newScrollTop });
    }
    return Object.freeze(result);
  }

  // Enter - emit rowPress action
  if (event.key === ZR_KEY_ENTER) {
    return Object.freeze({
      action: { id: tableId, action: "rowPress" as const, rowIndex: focusedRowIndex },
      consumed: true,
    });
  }

  // Space - toggle selection (multi mode)
  if (event.key === ZR_KEY_SPACE) {
    if (selectionMode === "multi") {
      const rowKey = getRowKeyAtIndex(rowKeys, focusedRowIndex);
      if (rowKey !== undefined) {
        const hasShift = (event.mods & ZR_MOD_SHIFT) !== 0;
        const result = computeSelection(
          selection,
          rowKey,
          selectionMode,
          { shift: hasShift, ctrl: true }, // Space acts like Ctrl+click
          rowKeys,
          lastClickedKey,
          rowKeyToIndex,
        );

        if (result.changed) {
          return Object.freeze({
            nextSelection: result.selection,
            nextLastClickedKey: rowKey,
            consumed: true,
          });
        }
      }
    }
    return Object.freeze({ consumed: true });
  }

  // Ctrl+A - select all (multi mode)
  if (event.key === ZR_KEY_A && (event.mods & 2) !== 0) {
    // mods & 2 = ctrl
    if (selectionMode === "multi") {
      const result = selectAll(rowKeys, selection);
      if (result.changed) {
        return Object.freeze({
          nextSelection: result.selection,
          consumed: true,
        });
      }
    }
    return Object.freeze({ consumed: true });
  }

  return Object.freeze({ consumed: false });
}
