/**
 * packages/core/src/app/updateQueue.ts — State update accumulator.
 *
 * Why: Collects state updates between render cycles, allowing batched
 * application of multiple updates. Updates can be direct values or
 * functional updaters that receive the previous state.
 *
 * @see docs/guide/lifecycle-and-updates.md
 */

/**
 * State update: either a new state value or a function that computes
 * the next state from the previous state.
 */
export type StateUpdater<S> = S | ((prev: Readonly<S>) => S);

/**
 * Accumulates state updates for batch processing.
 *
 * @typeParam S - Application state type
 */
export class UpdateQueue<S> {
  private pending: StateUpdater<S>[] = [];

  /** Add an updater to the pending queue. */
  enqueue(updater: StateUpdater<S>): void {
    this.pending.push(updater);
  }

  /**
   * Remove and return all pending updaters.
   * Returns empty array if no updates pending.
   */
  drain(): readonly StateUpdater<S>[] {
    if (this.pending.length === 0) return [];
    const out = this.pending;
    this.pending = [];
    return out;
  }

  /** Number of pending updates. */
  get size(): number {
    return this.pending.length;
  }
}
