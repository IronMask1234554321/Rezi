/**
 * packages/core/src/app/stateMachine.ts — App lifecycle state machine.
 *
 * Why: Enforces valid state transitions for the app runtime, preventing illegal
 * operations (e.g., start when already running, stop when disposed). The state
 * machine provides a single source of truth for app lifecycle status.
 *
 * State transitions:
 *   Created  --start()--> Running
 *   Running  --stop()---> Stopped
 *   Running  --fatal()--> Faulted
 *   Stopped  --start()--> Running
 *   Any      --dispose()-> Disposed
 *
 * @see docs/guide/lifecycle-and-updates.md
 */

import { ZrUiError } from "../abi.js";

/**
 * Valid app lifecycle states.
 *   - Created: Initial state, before first start()
 *   - Running: Actively processing events and rendering
 *   - Stopped: Gracefully stopped, can be restarted
 *   - Faulted: Unrecoverable error occurred, backend disposed
 *   - Disposed: Terminal state, all resources released
 */
export type AppRuntimeState = "Created" | "Running" | "Stopped" | "Disposed" | "Faulted";

function invalidState(detail: string): never {
  throw new ZrUiError("ZRUI_INVALID_STATE", detail);
}

/**
 * Enforces valid state transitions for app lifecycle.
 * Throws ZRUI_INVALID_STATE on illegal transition attempts.
 */
export class AppStateMachine {
  private state0: AppRuntimeState = "Created";

  get state(): AppRuntimeState {
    return this.state0;
  }

  /** Assert current state is one of allowed states; throw with detail on violation. */
  assertOneOf(allowed: readonly AppRuntimeState[], detail: string): void {
    for (const s of allowed) {
      if (this.state0 === s) return;
    }
    invalidState(detail);
  }

  /** Transition to Running; valid from Created or Stopped. */
  toRunning(): void {
    if (this.state0 === "Created" || this.state0 === "Stopped") {
      this.state0 = "Running";
      return;
    }
    invalidState(`cannot transition ${this.state0} -> Running`);
  }

  /** Transition to Stopped; valid only from Running. */
  toStopped(): void {
    if (this.state0 === "Running") {
      this.state0 = "Stopped";
      return;
    }
    invalidState(`cannot transition ${this.state0} -> Stopped`);
  }

  /** Transition to Faulted; valid only from Running. */
  toFaulted(): void {
    if (this.state0 === "Running") {
      this.state0 = "Faulted";
      return;
    }
    invalidState(`cannot transition ${this.state0} -> Faulted`);
  }

  /** Transition to Disposed; valid from any state. Idempotent if already Disposed. */
  dispose(): void {
    if (this.state0 === "Disposed") return;
    if (
      this.state0 === "Faulted" ||
      this.state0 === "Created" ||
      this.state0 === "Running" ||
      this.state0 === "Stopped"
    ) {
      this.state0 = "Disposed";
      return;
    }
    invalidState(`cannot transition ${this.state0} -> Disposed`);
  }
}
