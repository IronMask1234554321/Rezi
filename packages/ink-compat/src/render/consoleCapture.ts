import { format } from "node:util";

type ConsoleState = Readonly<{ consoleLines: readonly string[] }>;

type AppUpdater<S> = Readonly<{
  update: (updater: (prev: S) => S) => void;
}>;

export type ConsoleCapture<S extends ConsoleState> = Readonly<{
  appendConsole: (raw: string) => void;
  patchConsole: () => () => void;
  clearConsoleBuffer: () => void;
}>;

function sanitizeConsoleLines(raw: string): string[] {
  // Normalize CRLF/CR into LF.
  const text = raw.replace(/\r\n?/g, "\n");

  const lines: string[] = [];
  let current = "";

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) continue;

    if (ch === "\n") {
      lines.push(current);
      current = "";
      continue;
    }

    if (ch === "\t") {
      current += "  ";
      continue;
    }

    const code = ch.charCodeAt(0);
    // Drop other ASCII control chars.
    if (code < 0x20 || code === 0x7f) continue;
    current += ch;
  }

  // Preserve trailing empty line if the message ended with '\n'.
  if (current.length > 0 || text.endsWith("\n")) lines.push(current);

  return lines;
}

export function createConsoleCapture<S extends ConsoleState>(
  app: AppUpdater<S>,
  isExited: () => boolean,
  maxLines = 200,
): ConsoleCapture<S> {
  const consoleQueue: string[] = [];
  let consoleFlushScheduled = false;

  const scheduleConsoleFlush = () => {
    if (consoleFlushScheduled) return;
    consoleFlushScheduled = true;
    queueMicrotask(() => {
      consoleFlushScheduled = false;
      if (isExited()) return;
      if (consoleQueue.length === 0) return;
      const pending = consoleQueue.splice(0, consoleQueue.length);
      app.update((prev) => {
        const merged = [...prev.consoleLines, ...pending];
        const next = merged.length > maxLines ? merged.slice(merged.length - maxLines) : merged;
        return { ...prev, consoleLines: next };
      });
    });
  };

  const appendConsole = (raw: string) => {
    const lines = sanitizeConsoleLines(raw);
    if (lines.length === 0) return;
    consoleQueue.push(...lines);
    scheduleConsoleFlush();
  };

  const patchConsole = (): (() => void) => {
    const methods = ["log", "info", "warn", "error", "debug"] as const;
    const original: Partial<Record<(typeof methods)[number], (...args: unknown[]) => void>> = {};

    for (const name of methods) {
      const fn = console[name];
      if (typeof fn !== "function") continue;
      // eslint-disable-next-line no-console
      original[name] = fn.bind(console);
      // eslint-disable-next-line no-console
      console[name] = (...args: unknown[]) => {
        appendConsole(format(...args));
      };
    }

    return () => {
      for (const name of methods) {
        const prev = original[name];
        if (!prev) continue;
        // eslint-disable-next-line no-console
        console[name] = prev;
      }
    };
  };

  const clearConsoleBuffer = () => {
    consoleQueue.length = 0;
    consoleFlushScheduled = false;
  };

  return Object.freeze({ appendConsole, patchConsole, clearConsoleBuffer });
}
