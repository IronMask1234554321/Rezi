// This file intentionally contains forbidden patterns for testing
import { readFileSync } from "node:fs";
// biome-ignore lint/style/useNodejsImportProtocol: testing detection of non-node: import
import { Worker } from "worker_threads";

const buf = Buffer.from("test");
const port: MessagePort = null as unknown as MessagePort;

export { buf, port, readFileSync, Worker };
