/**
 * packages/core/src/keybindings/chordMatcher.ts — Trie-based chord sequence matching.
 *
 * Why: Provides efficient O(k) matching of key chord sequences using a trie
 * data structure. Handles partial matches (pending state) and timeout-based
 * chord reset. All functions are pure and return new state objects.
 *
 * @see docs/guide/input-and-focus.md
 */

import { makeTrieKey } from "./keyCodes.js";
import type { ChordState, KeyBinding, MatchResult, ParsedKey } from "./types.js";

/** Chord timeout in milliseconds. If exceeded, pending chord is reset. */
export const CHORD_TIMEOUT_MS = 1000;

/**
 * Trie node for key sequence matching.
 *
 * Each node represents a position in one or more key sequences.
 * Children are keyed by "keyCode:modsBitmask" strings.
 */
export type TrieNode<C> = Readonly<{
  /** Child nodes keyed by "keyCode:modsBitmask" */
  children: ReadonlyMap<string, TrieNode<C>>;
  /** Binding if a sequence ends at this node (null otherwise) */
  binding: KeyBinding<C> | null;
  /** True if this node has any children (for pending detection) */
  hasDescendants: boolean;
}>;

/**
 * Create an empty trie node.
 */
function emptyNode<C>(): TrieNode<C> {
  return Object.freeze({
    children: new Map<string, TrieNode<C>>(),
    binding: null,
    hasDescendants: false,
  });
}

/**
 * Build a trie from a list of keybindings.
 *
 * Bindings with the same sequence are resolved by priority (higher wins).
 * The trie is frozen to prevent mutation.
 *
 * @param bindings - List of keybindings to index
 * @returns Root node of the constructed trie
 */
export function buildTrie<C>(bindings: readonly KeyBinding<C>[]): TrieNode<C> {
  // Sort by priority descending so higher priority bindings are inserted last
  // (and thus overwrite lower priority at the same sequence)
  const sorted = [...bindings].sort((a, b) => b.priority - a.priority);

  // Build mutable trie first
  type MutableNode = {
    children: Map<string, MutableNode>;
    binding: KeyBinding<C> | null;
  };

  const root: MutableNode = { children: new Map(), binding: null };

  for (const binding of sorted) {
    let node = root;

    for (const key of binding.sequence.keys) {
      const trieKey = makeTrieKey(key.key, key.mods);
      let child = node.children.get(trieKey);
      if (!child) {
        child = { children: new Map(), binding: null };
        node.children.set(trieKey, child);
      }
      node = child;
    }

    // Only set if not already set (higher priority was already inserted)
    if (node.binding === null) {
      node.binding = binding;
    }
  }

  // Convert to frozen structure with hasDescendants
  function freeze(mutable: MutableNode): TrieNode<C> {
    const frozenChildren = new Map<string, TrieNode<C>>();
    for (const [key, child] of mutable.children) {
      frozenChildren.set(key, freeze(child));
    }

    return Object.freeze({
      children: frozenChildren,
      binding: mutable.binding,
      hasDescendants: mutable.children.size > 0,
    });
  }

  return freeze(root);
}

/** Initial chord state with no pending keys. */
export const INITIAL_CHORD_STATE: ChordState = Object.freeze({
  pendingKeys: Object.freeze([]),
  startTimeMs: 0,
});

/**
 * Result of matching a key against the trie.
 */
export type ChordMatchResult<C> = Readonly<{
  /** New chord state after processing the key */
  nextState: ChordState;
  /** Match result: matched (execute binding), pending (wait for more), or none */
  result: MatchResult<C>;
}>;

/**
 * Navigate a trie following a sequence of keys.
 *
 * @param trie - Root trie node
 * @param keys - Sequence of keys to follow
 * @returns Node at the end of the path, or null if path doesn't exist
 */
function navigateTrie<C>(trie: TrieNode<C>, keys: readonly ParsedKey[]): TrieNode<C> | null {
  let node: TrieNode<C> | undefined = trie;

  for (const key of keys) {
    const trieKey = makeTrieKey(key.key, key.mods);
    node = node.children.get(trieKey);
    if (!node) return null;
  }

  return node;
}

/**
 * Match a key event against a trie, updating chord state.
 *
 * This is a pure function that returns the next state and match result.
 * Timeout detection uses the provided timeMs from the event.
 *
 * @param trie - Root trie node built from bindings
 * @param state - Current chord state
 * @param key - The key being pressed
 * @param timeMs - Event timestamp in milliseconds (from ZrevEvent.timeMs)
 * @returns New chord state and match result
 */
export function matchKey<C>(
  trie: TrieNode<C>,
  state: ChordState,
  key: ParsedKey,
  timeMs: number,
): ChordMatchResult<C> {
  // Check for timeout - if chord has been pending too long, reset and try fresh
  const timedOut = state.pendingKeys.length > 0 && timeMs - state.startTimeMs > CHORD_TIMEOUT_MS;

  let currentKeys: readonly ParsedKey[];
  let startTime: number;

  if (timedOut) {
    // Reset chord and start fresh with this key
    currentKeys = [];
    startTime = timeMs;
  } else if (state.pendingKeys.length === 0) {
    // No pending chord, start new one
    currentKeys = [];
    startTime = timeMs;
  } else {
    // Continue existing chord
    currentKeys = state.pendingKeys;
    startTime = state.startTimeMs;
  }

  // Add current key to sequence
  const newKeys = [...currentKeys, key];

  // Navigate trie to find matching node
  const node = navigateTrie(trie, newKeys);

  if (!node) {
    // No match at all - if we had pending keys, try fresh match with just this key
    if (currentKeys.length > 0) {
      const freshNode = navigateTrie(trie, [key]);

      if (freshNode) {
        if (freshNode.binding !== null && !freshNode.hasDescendants) {
          // Complete match with just this key
          return {
            nextState: INITIAL_CHORD_STATE,
            result: Object.freeze({ kind: "matched", binding: freshNode.binding }),
          };
        }

        if (freshNode.hasDescendants) {
          // Start of a new chord
          const nextState: ChordState = Object.freeze({
            pendingKeys: Object.freeze([key]),
            startTimeMs: timeMs,
          });

          if (freshNode.binding !== null) {
            // Both a complete match AND could be prefix of longer sequence
            // Return the match (user can re-press if they meant the longer one)
            return {
              nextState: INITIAL_CHORD_STATE,
              result: Object.freeze({ kind: "matched", binding: freshNode.binding }),
            };
          }

          return {
            nextState,
            result: Object.freeze({ kind: "pending" }),
          };
        }
      }
    }

    // No match
    return {
      nextState: INITIAL_CHORD_STATE,
      result: Object.freeze({ kind: "none" }),
    };
  }

  // We found a node
  if (node.binding !== null && !node.hasDescendants) {
    // Complete match, no possible longer sequences
    return {
      nextState: INITIAL_CHORD_STATE,
      result: Object.freeze({ kind: "matched", binding: node.binding }),
    };
  }

  if (node.hasDescendants) {
    // Could be prefix of a longer sequence
    const nextState: ChordState = Object.freeze({
      pendingKeys: Object.freeze(newKeys),
      startTimeMs: startTime,
    });

    if (node.binding !== null) {
      // Both a complete match AND could be prefix of longer sequence
      // Prefer the match (user must complete chord quickly for longer version)
      return {
        nextState: INITIAL_CHORD_STATE,
        result: Object.freeze({ kind: "matched", binding: node.binding }),
      };
    }

    return {
      nextState,
      result: Object.freeze({ kind: "pending" }),
    };
  }

  // Has binding but no descendants (handled above, but for completeness)
  if (node.binding !== null) {
    return {
      nextState: INITIAL_CHORD_STATE,
      result: Object.freeze({ kind: "matched", binding: node.binding }),
    };
  }

  // Empty node (shouldn't happen in well-formed trie)
  return {
    nextState: INITIAL_CHORD_STATE,
    result: Object.freeze({ kind: "none" }),
  };
}

/**
 * Check if a chord state has timed out.
 *
 * @param state - Current chord state
 * @param currentTimeMs - Current timestamp
 * @returns True if the pending chord has exceeded the timeout
 */
export function isChordTimedOut(state: ChordState, currentTimeMs: number): boolean {
  if (state.pendingKeys.length === 0) return false;
  return currentTimeMs - state.startTimeMs > CHORD_TIMEOUT_MS;
}

/**
 * Reset chord state to initial (no pending keys).
 *
 * @returns Fresh chord state
 */
export function resetChordState(): ChordState {
  return INITIAL_CHORD_STATE;
}
