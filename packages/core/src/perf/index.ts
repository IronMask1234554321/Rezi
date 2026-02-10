/**
 * packages/core/src/perf/index.ts — Public exports for perf instrumentation.
 */

export {
  PERF_ENABLED,
  PERF_PHASES,
  perfMarkEnd,
  perfMarkStart,
  perfRecord,
  perfReset,
  perfSnapshot,
  type InstrumentationPhase,
  type PerfSnapshot,
  type PerfToken,
  type PhaseStats,
} from "./perf.js";
