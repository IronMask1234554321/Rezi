import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = dirname(fileURLToPath(import.meta.url));

const discoveredNodeFiles = readdirSync(rootDir).filter((f) => f.endsWith(".node"));

const candidates = ["index.node", "rezi_ui_native.node", ...discoveredNodeFiles];

let native = null;
let lastErr = null;
for (const file of new Set(candidates)) {
  try {
    native = require(join(rootDir, file));
    break;
  } catch (err) {
    lastErr = err;
  }
}

if (!native) {
  const extra =
    lastErr instanceof Error ? `\n\nLast error:\n${lastErr.stack ?? lastErr.message}` : "";
  throw new Error(
    `Failed to load @rezi-ui/native binary. Tried: ${[...new Set(candidates)].join(", ")}${extra}`,
  );
}

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
