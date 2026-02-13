import net from "node:net";
import type { TerminalCaps } from "@rezi-ui/core";
import { createNodeBackend } from "../../index.js";

type ControlCommand = Readonly<{ id: string; cmd: "pollOnce" | "getCaps" | "stop" }>;

type ReadyMessage = Readonly<{
  type: "ready";
  caps: TerminalCaps;
}>;

type ResponseMessage =
  | Readonly<{
      type: "response";
      id: string;
      ok: true;
      result:
        | Readonly<{
            kind: "pollOnce";
            bytesBase64: string;
            droppedBatches: number;
          }>
        | Readonly<{ kind: "getCaps"; caps: TerminalCaps }>
        | Readonly<{ kind: "stop" }>;
    }>
  | Readonly<{ type: "response"; id: string; ok: false; error: string }>;

type FatalMessage = Readonly<{ type: "fatal"; detail: string }>;

type OutboundMessage = ReadyMessage | ResponseMessage | FatalMessage;
type TargetEnv = NodeJS.ProcessEnv &
  Readonly<{
    REZI_TERMINAL_IO_CTRL_PORT?: string;
    REZI_TERMINAL_IO_NATIVE_CONFIG?: string;
  }>;

const targetEnv = process.env as TargetEnv;

function failAndExit(msg: string): never {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function parsePortFromEnv(): number {
  const raw = targetEnv.REZI_TERMINAL_IO_CTRL_PORT;
  if (raw === undefined)
    failAndExit("terminal-io-contract-target: REZI_TERMINAL_IO_CTRL_PORT is required");
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0 || n > 65535) {
    failAndExit(`terminal-io-contract-target: invalid REZI_TERMINAL_IO_CTRL_PORT=${String(raw)}`);
  }
  return n;
}

function parseNativeConfigFromEnv(): Readonly<Record<string, unknown>> {
  const raw = targetEnv.REZI_TERMINAL_IO_NATIVE_CONFIG;
  if (typeof raw !== "string" || raw.length === 0) return Object.freeze({});
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    failAndExit(
      `terminal-io-contract-target: failed to parse REZI_TERMINAL_IO_NATIVE_CONFIG: ${detail}`,
    );
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    failAndExit(
      "terminal-io-contract-target: REZI_TERMINAL_IO_NATIVE_CONFIG must be a JSON object",
    );
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function asErrorDetail(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

function sendJsonLine(socket: net.Socket, msg: OutboundMessage): void {
  socket.write(`${JSON.stringify(msg)}\n`);
}

const ctrlPort = parsePortFromEnv();
const nativeConfig = parseNativeConfigFromEnv();

const backend = createNodeBackend({
  executionMode: "worker",
  fpsCap: 1000,
  maxEventBytes: 1 << 20,
  nativeConfig,
});

let socket: net.Socket | null = null;
let cachedCaps: TerminalCaps | null = null;
let shuttingDown = false;
let processing = false;
const queue: ControlCommand[] = [];
let lineBuf = "";

async function stopBackendBestEffort(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  try {
    await backend.stop();
  } catch {
    // best-effort cleanup
  }
  try {
    backend.dispose();
  } catch {
    // best-effort cleanup
  }
}

async function handleCommand(cmd: ControlCommand): Promise<ResponseMessage> {
  switch (cmd.cmd) {
    case "pollOnce": {
      const batch = await backend.pollEvents();
      try {
        const bytes = new Uint8Array(batch.bytes.byteLength);
        bytes.set(batch.bytes);
        return {
          type: "response",
          id: cmd.id,
          ok: true,
          result: {
            kind: "pollOnce",
            bytesBase64: Buffer.from(bytes).toString("base64"),
            droppedBatches: batch.droppedBatches,
          },
        };
      } finally {
        batch.release();
      }
    }

    case "getCaps": {
      const caps = cachedCaps ?? (await backend.getCaps());
      cachedCaps = caps;
      return {
        type: "response",
        id: cmd.id,
        ok: true,
        result: {
          kind: "getCaps",
          caps,
        },
      };
    }

    case "stop": {
      await stopBackendBestEffort();
      return {
        type: "response",
        id: cmd.id,
        ok: true,
        result: { kind: "stop" },
      };
    }
  }
}

async function flushQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (queue.length > 0) {
      const next = queue.shift();
      if (next === undefined) continue;
      try {
        const response = await handleCommand(next);
        if (socket !== null) {
          sendJsonLine(socket, response);
        }
      } catch (err) {
        if (socket !== null) {
          sendJsonLine(socket, {
            type: "response",
            id: next.id,
            ok: false,
            error: asErrorDetail(err),
          });
        }
      }

      if (next.cmd === "stop") {
        if (socket !== null) {
          socket.end();
        }
        setImmediate(() => {
          process.exit(0);
        });
        return;
      }
    }
  } finally {
    processing = false;
  }
}

function enqueueLine(line: string): void {
  const trimmed = line.trim();
  if (trimmed.length === 0) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return;
  }
  if (typeof parsed !== "object" || parsed === null) return;
  const rec = parsed as Partial<ControlCommand>;
  if (typeof rec.id !== "string") return;
  if (rec.cmd !== "pollOnce" && rec.cmd !== "getCaps" && rec.cmd !== "stop") return;
  queue.push(Object.freeze({ id: rec.id, cmd: rec.cmd }));
  void flushQueue();
}

async function main(): Promise<void> {
  await backend.start();
  cachedCaps = await backend.getCaps();

  socket = net.createConnection({ host: "127.0.0.1", port: ctrlPort });

  socket.setEncoding("utf8");

  socket.on("connect", () => {
    if (socket === null || cachedCaps === null) return;
    sendJsonLine(socket, {
      type: "ready",
      caps: cachedCaps,
    });
  });

  socket.on("data", (chunk: string) => {
    lineBuf += chunk;
    for (;;) {
      const idx = lineBuf.indexOf("\n");
      if (idx < 0) break;
      const line = lineBuf.slice(0, idx);
      lineBuf = lineBuf.slice(idx + 1);
      enqueueLine(line);
    }
  });

  socket.on("error", async (err) => {
    const detail = asErrorDetail(err);
    if (socket !== null) {
      sendJsonLine(socket, { type: "fatal", detail });
    }
    await stopBackendBestEffort();
    process.exit(1);
  });

  socket.on("close", async () => {
    await stopBackendBestEffort();
    process.exit(0);
  });
}

process.on("uncaughtException", async (err) => {
  if (socket !== null) {
    sendJsonLine(socket, { type: "fatal", detail: asErrorDetail(err) });
  }
  await stopBackendBestEffort();
  process.exit(1);
});

process.on("unhandledRejection", async (err) => {
  if (socket !== null) {
    sendJsonLine(socket, { type: "fatal", detail: asErrorDetail(err) });
  }
  await stopBackendBestEffort();
  process.exit(1);
});

void main().catch(async (err) => {
  if (socket !== null) {
    sendJsonLine(socket, { type: "fatal", detail: asErrorDetail(err) });
  }
  await stopBackendBestEffort();
  process.exit(1);
});
