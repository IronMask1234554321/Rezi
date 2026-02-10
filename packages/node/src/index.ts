import {
  type NodeBackend,
  type NodeBackendConfig,
  createNodeBackendInternal,
} from "./backend/nodeBackend.js";

export type { NodeBackendConfig };
export type { NodeBackend };

export function createNodeBackend(config: NodeBackendConfig = {}): NodeBackend {
  return createNodeBackendInternal({ config });
}
