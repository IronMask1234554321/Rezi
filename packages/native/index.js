import native from "./loader.cjs";

export const {
  engineCreate,
  engineDestroy,
  engineSubmitDrawlist,
  enginePresent,
  enginePollEvents,
  enginePostUserEvent,
  engineGetMetrics,
  engineSetConfig,
  engineGetCaps,
  // Debug trace API
  engineDebugEnable,
  engineDebugDisable,
  engineDebugQuery,
  engineDebugGetPayload,
  engineDebugGetStats,
  engineDebugExport,
  engineDebugReset,
} = native;
