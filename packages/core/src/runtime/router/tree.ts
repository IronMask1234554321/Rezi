import type { ZrevEvent } from "../../events.js";
import {
  expandAllSiblings,
  findFirstChildIndex,
  findNodeIndex,
  findParentIndex,
  toggleExpanded,
} from "../../widgets/tree.js";
import type { TreeRoutingCtx, TreeRoutingResult } from "./types.js";

/* --- Key Codes (locked by engine ABI) --- */
/* MUST match packages/core/src/keybindings/keyCodes.ts */
const ZR_KEY_ENTER = 2;
const ZR_KEY_HOME = 12;
const ZR_KEY_END = 13;
const ZR_KEY_UP = 20;
const ZR_KEY_DOWN = 21;
const ZR_KEY_LEFT = 22;
const ZR_KEY_RIGHT = 23;
const ZR_KEY_SPACE = 32; /* Space as ASCII codepoint in ZREV key events */

const ZR_KEY_ASTERISK = 42; // '*' ASCII code for expand all siblings

/**
 * Route keyboard events for tree navigation.
 *
 * Navigation keys:
 *   - ArrowUp/Down: Move to prev/next visible node
 *   - ArrowRight: Expand node or move to first child
 *   - ArrowLeft: Collapse node or move to parent
 *   - Enter: Activate node
 *   - Space: Toggle expand/collapse
 *   - Home/End: Jump to first/last visible node
 *   - Asterisk (*): Expand all siblings
 */
export function routeTreeKey<T>(event: ZrevEvent, ctx: TreeRoutingCtx<T>): TreeRoutingResult {
  if (event.kind !== "key") return Object.freeze({ consumed: false });
  if (event.action !== "down") return Object.freeze({ consumed: false });
  if (!ctx.keyboardNavigation) return Object.freeze({ consumed: false });

  const { treeId, flatNodes, expanded, state } = ctx;
  const { focusedKey } = state;
  const nodeCount = flatNodes.length;

  if (nodeCount === 0) return Object.freeze({ consumed: false });

  // Find current focused index
  const currentIndex = focusedKey !== null ? findNodeIndex(flatNodes, focusedKey) : -1;
  const currentNode = currentIndex >= 0 ? flatNodes[currentIndex] : undefined;

  // Arrow Up - move to previous visible node
  if (event.key === ZR_KEY_UP) {
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    if (nextIndex === currentIndex && currentIndex >= 0) {
      return Object.freeze({ consumed: true });
    }

    const nextNode = flatNodes[nextIndex];
    if (nextNode) {
      return Object.freeze({
        nextFocusedKey: nextNode.key,
        nodeToSelect: nextNode.key,
        consumed: true,
      });
    }
    return Object.freeze({ consumed: true });
  }

  // Arrow Down - move to next visible node
  if (event.key === ZR_KEY_DOWN) {
    const nextIndex = currentIndex < nodeCount - 1 ? currentIndex + 1 : nodeCount - 1;
    if (nextIndex === currentIndex) {
      return Object.freeze({ consumed: true });
    }

    const nextNode = flatNodes[nextIndex];
    if (nextNode) {
      return Object.freeze({
        nextFocusedKey: nextNode.key,
        nodeToSelect: nextNode.key,
        consumed: true,
      });
    }
    return Object.freeze({ consumed: true });
  }

  // Arrow Right - expand or move to first child
  if (event.key === ZR_KEY_RIGHT) {
    if (!currentNode) return Object.freeze({ consumed: true });

    const isExpanded = expanded.includes(currentNode.key);

    if (currentNode.hasChildren) {
      if (!isExpanded) {
        // Expand the node
        const { expanded: newExpanded } = toggleExpanded(expanded, currentNode.key);

        // Check if we need to load children
        const firstChildIndex = findFirstChildIndex(flatNodes, currentIndex);
        if (firstChildIndex === -1) {
          // No children loaded yet - trigger load
          return Object.freeze({
            nextExpanded: newExpanded,
            nodeToLoad: currentNode.key,
            consumed: true,
          });
        }

        return Object.freeze({
          nextExpanded: newExpanded,
          consumed: true,
        });
      }

      // Already expanded - move to first child
      const firstChildIndex = findFirstChildIndex(flatNodes, currentIndex);
      if (firstChildIndex >= 0) {
        const childNode = flatNodes[firstChildIndex];
        if (childNode) {
          return Object.freeze({
            nextFocusedKey: childNode.key,
            nodeToSelect: childNode.key,
            consumed: true,
          });
        }
      }
    }
    return Object.freeze({ consumed: true });
  }

  // Arrow Left - collapse or move to parent
  if (event.key === ZR_KEY_LEFT) {
    if (!currentNode) return Object.freeze({ consumed: true });

    const isExpanded = expanded.includes(currentNode.key);

    if (isExpanded && currentNode.hasChildren) {
      // Collapse the node
      const { expanded: newExpanded } = toggleExpanded(expanded, currentNode.key);
      return Object.freeze({
        nextExpanded: newExpanded,
        consumed: true,
      });
    }

    // Move to parent
    const parentIndex = findParentIndex(flatNodes, currentIndex);
    if (parentIndex >= 0) {
      const parentNode = flatNodes[parentIndex];
      if (parentNode) {
        return Object.freeze({
          nextFocusedKey: parentNode.key,
          nodeToSelect: parentNode.key,
          consumed: true,
        });
      }
    }
    return Object.freeze({ consumed: true });
  }

  // Home - jump to first node
  if (event.key === ZR_KEY_HOME) {
    const firstNode = flatNodes[0];
    if (firstNode && focusedKey !== firstNode.key) {
      return Object.freeze({
        nextFocusedKey: firstNode.key,
        nodeToSelect: firstNode.key,
        nextScrollTop: 0,
        consumed: true,
      });
    }
    return Object.freeze({ consumed: true });
  }

  // End - jump to last node
  if (event.key === ZR_KEY_END) {
    const lastNode = flatNodes[nodeCount - 1];
    if (lastNode && focusedKey !== lastNode.key) {
      return Object.freeze({
        nextFocusedKey: lastNode.key,
        nodeToSelect: lastNode.key,
        consumed: true,
      });
    }
    return Object.freeze({ consumed: true });
  }

  // Enter - activate node
  if (event.key === ZR_KEY_ENTER) {
    if (currentNode) {
      return Object.freeze({
        nodeToActivate: currentNode.key,
        consumed: true,
      });
    }
    return Object.freeze({ consumed: true });
  }

  // Space - toggle expand/collapse
  if (event.key === ZR_KEY_SPACE) {
    if (currentNode?.hasChildren) {
      const { expanded: newExpanded, isExpanded } = toggleExpanded(expanded, currentNode.key);

      // Check if we need to load children when expanding
      if (isExpanded) {
        const firstChildIndex = findFirstChildIndex(flatNodes, currentIndex);
        if (firstChildIndex === -1) {
          // No children visible - trigger load
          return Object.freeze({
            nextExpanded: newExpanded,
            nodeToLoad: currentNode.key,
            consumed: true,
          });
        }
      }

      return Object.freeze({
        nextExpanded: newExpanded,
        consumed: true,
      });
    }
    return Object.freeze({ consumed: true });
  }

  // Asterisk (*) - expand all siblings
  if (event.key === ZR_KEY_ASTERISK) {
    if (currentNode) {
      const newExpanded = expandAllSiblings(flatNodes, currentIndex, expanded);
      if (newExpanded !== expanded) {
        return Object.freeze({
          nextExpanded: newExpanded,
          consumed: true,
        });
      }
    }
    return Object.freeze({ consumed: true });
  }

  return Object.freeze({ consumed: false });
}
