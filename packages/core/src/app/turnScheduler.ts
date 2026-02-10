/**
 * packages/core/src/app/turnScheduler.ts — Microtask-based event coalescing scheduler.
 *
 * Why: Batches multiple enqueued items into a single "turn" executed via
 * queueMicrotask. This coalesces rapid state updates and events, reducing
 * unnecessary render cycles while maintaining responsiveness.
 *
 * Invariants:
 *   - Items enqueued during a turn are processed in the next microtask
 *   - Turn callback receives all items batched since last execution
 *   - Re-entrant enqueue during execution schedules a follow-up turn
 *
 * @see docs/guide/lifecycle-and-updates.md
 */

/**
 * Coalescing scheduler that batches items into microtask turns.
 *
 * @typeParam T - Work item type (e.g., events, state updates)
 */
export class TurnScheduler<T> {
  private queue: T[] = [];
  private scheduled = false;
  private executing = false;
  private readonly onTurn: (items: readonly T[]) => void;

  /**
   * @param onTurn - Callback invoked with batched items each turn
   */
  constructor(onTurn: (items: readonly T[]) => void) {
    this.onTurn = onTurn;
  }

  /**
   * Add item to queue, scheduling a turn if not already pending.
   * If called during turn execution, item is processed in next turn.
   */
  enqueue(item: T): void {
    this.queue.push(item);
    if (!this.scheduled && !this.executing) {
      this.scheduled = true;
      queueMicrotask(() => this.runTurn());
    }
  }

  get isExecuting(): boolean {
    return this.executing;
  }

  get isScheduled(): boolean {
    return this.scheduled;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  /**
   * Execute a turn: drain queue and invoke callback.
   * If items enqueued during execution, schedule follow-up turn.
   */
  private runTurn(): void {
    this.scheduled = false;
    this.executing = true;

    const items = this.queue;
    this.queue = [];

    try {
      this.onTurn(items);
    } finally {
      this.executing = false;
      if (this.queue.length > 0 && !this.scheduled) {
        this.scheduled = true;
        queueMicrotask(() => this.runTurn());
      }
    }
  }
}
