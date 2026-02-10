/**
 * packages/core/src/widgets/debugPanel.ts — Debug overlay widget.
 *
 * Why: Provides an optional in-app debug overlay for displaying real-time
 * debug information such as FPS, frame time, error counts, and event stats.
 * Designed to be positioned in a corner of the terminal for quick reference.
 *
 * Usage:
 *   ```ts
 *   app.view((state) => ui.layers([
 *     MainContent(state),
 *     state.showDebug && debugPanel({
 *       stats: state.debugStats,
 *       frameTime: state.lastFrameTimeMs,
 *     }),
 *   ]));
 *   ```
 */

import type { DebugStats } from "../debug/types.js";
import { type TextStyle, rgb } from "./style.js";
import type { VNode } from "./types.js";
import { ui } from "./ui.js";

/**
 * Debug panel position in the terminal.
 */
export type DebugPanelPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

/**
 * Debug panel props.
 */
export type DebugPanelProps = Readonly<{
  /** Debug statistics from the controller */
  stats?: DebugStats | null;
  /** Last frame render time in milliseconds */
  frameTimeMs?: number;
  /** Current FPS (frames per second) */
  fps?: number;
  /** Number of recent errors */
  errorCount?: number;
  /** Number of recent warnings */
  warnCount?: number;
  /** Number of events processed in last frame */
  eventCount?: number;
  /** Position of the panel (default: "top-right") */
  position?: DebugPanelPosition;
  /** Whether to show the FPS counter */
  showFps?: boolean;
  /** Whether to show the frame time */
  showFrameTime?: boolean;
  /** Whether to show the error count */
  showErrors?: boolean;
  /** Whether to show the warning count */
  showWarnings?: boolean;
  /** Whether to show the event count */
  showEventCount?: boolean;
  /** Whether to show ring buffer usage */
  showRingUsage?: boolean;
  /** Custom title for the panel */
  title?: string;
}>;

/* --- Styles --- */

const LABEL_STYLE: TextStyle = {
  fg: rgb(150, 150, 150),
};

const VALUE_STYLE: TextStyle = {
  fg: rgb(255, 255, 255),
  bold: true,
};

const ERROR_STYLE: TextStyle = {
  fg: rgb(255, 100, 100),
  bold: true,
};

const WARN_STYLE: TextStyle = {
  fg: rgb(255, 200, 100),
  bold: true,
};

const GOOD_STYLE: TextStyle = {
  fg: rgb(100, 255, 100),
  bold: true,
};

const TITLE_STYLE: TextStyle = {
  fg: rgb(100, 200, 255),
  bold: true,
};

const BORDER_STYLE: TextStyle = {
  fg: rgb(80, 80, 80),
};

/**
 * Format a number with fixed decimal places.
 */
function formatNumber(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

/**
 * Get color style based on FPS value.
 */
function getFpsStyle(fps: number): TextStyle {
  if (fps >= 55) return GOOD_STYLE;
  if (fps >= 30) return WARN_STYLE;
  return ERROR_STYLE;
}

/**
 * Get color style based on frame time.
 */
function getFrameTimeStyle(ms: number): TextStyle {
  if (ms <= 18) return GOOD_STYLE;
  if (ms <= 33) return WARN_STYLE;
  return ERROR_STYLE;
}

/**
 * Create a labeled value row.
 */
function labeledValue(label: string, value: string, valueStyle: TextStyle = VALUE_STYLE): VNode {
  return ui.row({ gap: 1 }, [
    ui.text(`${label}:`, { style: LABEL_STYLE }),
    ui.text(value, { style: valueStyle }),
  ]);
}

/**
 * Create a debug panel widget.
 *
 * The panel displays real-time debug information in a compact format.
 * Position it in a corner using the `position` prop.
 *
 * @param props - Debug panel props
 * @returns A VNode representing the debug panel
 *
 * @example
 * ```ts
 * // In your view function
 * app.view((state) => {
 *   return ui.layers([
 *     MainContent(state),
 *     debugPanel({
 *       stats: state.debugStats,
 *       fps: state.fps,
 *       frameTimeMs: state.frameTimeMs,
 *       showFps: true,
 *       showFrameTime: true,
 *       showErrors: true,
 *     }),
 *   ]);
 * });
 * ```
 */
export function debugPanel(props: DebugPanelProps): VNode {
  const {
    stats,
    frameTimeMs,
    fps,
    errorCount,
    warnCount,
    eventCount,
    position = "top-right",
    showFps = true,
    showFrameTime = true,
    showErrors = true,
    showWarnings = true,
    showEventCount = false,
    showRingUsage = false,
    title = "Debug",
  } = props;

  const rows: VNode[] = [];

  // Title row
  rows.push(ui.text(`[ ${title} ]`, { style: TITLE_STYLE }));

  // FPS
  if (showFps && fps !== undefined) {
    rows.push(labeledValue("FPS", formatNumber(fps, 0), getFpsStyle(fps)));
  }

  // Frame time
  if (showFrameTime && frameTimeMs !== undefined) {
    rows.push(
      labeledValue("Frame", `${formatNumber(frameTimeMs, 1)}ms`, getFrameTimeStyle(frameTimeMs)),
    );
  }

  // Error count
  if (showErrors) {
    const errors = errorCount ?? stats?.errorCount ?? 0;
    const style = errors > 0 ? ERROR_STYLE : GOOD_STYLE;
    rows.push(labeledValue("Errors", String(errors), style));
  }

  // Warning count
  if (showWarnings) {
    const warns = warnCount ?? stats?.warnCount ?? 0;
    const style = warns > 0 ? WARN_STYLE : GOOD_STYLE;
    rows.push(labeledValue("Warns", String(warns), style));
  }

  // Event count
  if (showEventCount && eventCount !== undefined) {
    rows.push(labeledValue("Events", String(eventCount)));
  }

  // Ring buffer usage
  if (showRingUsage && stats) {
    const usage = stats.currentRingUsage;
    const capacity = stats.ringCapacity;
    const percent = capacity > 0 ? Math.round((usage / capacity) * 100) : 0;
    const style = percent > 90 ? ERROR_STYLE : percent > 70 ? WARN_STYLE : GOOD_STYLE;
    rows.push(labeledValue("Ring", `${usage}/${capacity} (${percent}%)`, style));
  }

  // Calculate alignment based on position
  const alignX = position.includes("right") ? "end" : "start";
  const alignY = position.includes("bottom") ? "end" : "start";

  return ui.box(
    {
      border: "single",
      style: BORDER_STYLE,
      p: 1,
    },
    [ui.column({ gap: 0 }, rows)],
  );
}

/**
 * Create a minimal FPS counter widget.
 * A simpler alternative to the full debug panel.
 */
export function fpsCounter(fps: number): VNode {
  return ui.text(`FPS: ${formatNumber(fps, 0)}`, { style: getFpsStyle(fps) });
}

/**
 * Create a minimal error badge widget.
 * Shows a red badge when there are errors.
 */
export function errorBadge(errorCount: number): VNode | null {
  if (errorCount === 0) return null;
  return ui.text(`! ${errorCount} error${errorCount > 1 ? "s" : ""}`, { style: ERROR_STYLE });
}
