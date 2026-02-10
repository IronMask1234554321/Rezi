import { type RuntimeBackend, type UiEvent, type VNode, createApp, ui } from "@rezi-ui/core";
import { createNodeBackend } from "@rezi-ui/node";
import React from "react";
import AppContext from "./context/AppContext.js";
import FocusProvider from "./context/FocusProvider.js";
import StdioContext, { type StdioContextValue } from "./context/StdioContext.js";
import { createInputEventEmitter } from "./internal/emitter.js";
import { enableWarnOnce } from "./internal/warn.js";
import reconciler, { type HostRoot } from "./reconciler.js";
import { createConsoleCapture } from "./render/consoleCapture.js";
import { deferred } from "./render/deferred.js";
import { normalizeRenderOptions } from "./render/options.js";
import type { Instance, RenderOptions } from "./types.js";

type AppState = Readonly<{ vnode: VNode; consoleLines: readonly string[] }>;

export function render(
  tree: React.ReactNode,
  options?: RenderOptions | NodeJS.WriteStream,
): Instance {
  const opts = normalizeRenderOptions(options);

  if (opts.debug === true) enableWarnOnce();

  // We currently can't plumb stdio into the Rezi backend without core/node changes.
  // We still expose the streams for compatibility with Ink hooks.
  const stdin = opts.stdin ?? process.stdin;
  const stdout = opts.stdout ?? process.stdout;
  const stderr = opts.stderr ?? process.stderr;

  const exitOnCtrlC = opts.exitOnCtrlC !== false;
  const maxFps = opts.maxFps ?? 60;

  const eventEmitter = createInputEventEmitter<UiEvent>();

  const backend = ((opts as { internal_backend?: unknown }).internal_backend ??
    createNodeBackend({ fpsCap: maxFps })) as RuntimeBackend;
  const app = createApp<AppState>({
    backend,
    initialState: { vnode: ui.text(""), consoleLines: [] },
    config: { fpsCap: maxFps },
  });
  app.view((s) => {
    if (s.consoleLines.length === 0) return s.vnode;
    const out: VNode[] = [];
    for (const line of s.consoleLines) out.push(ui.text(line));
    out.push(s.vnode);
    return out.length === 1 ? (out[0] ?? ui.text("")) : ui.column({}, out);
  });

  const exitD = deferred<void>();
  let exited = false;
  let exitError: Error | null = null;
  let restoreConsole: (() => void) | null = null;
  let unsubEvents: (() => void) | null = null;

  const cleanupPatchedConsole = () => {
    if (restoreConsole === null) return;
    try {
      restoreConsole();
    } catch {
      // ignore
    }
    restoreConsole = null;
  };

  const cleanupEventSubscription = () => {
    if (unsubEvents === null) return;
    try {
      unsubEvents();
    } catch {
      // ignore
    }
    unsubEvents = null;
  };

  // Console patching: best-effort Ink compatibility.
  // We intentionally disable in debug mode and in Node's test runner.
  const shouldPatchConsole =
    opts.patchConsole !== false &&
    opts.debug !== true &&
    !process.argv.includes("--test") &&
    (stdout as unknown as { isTTY?: unknown }).isTTY === true;

  const { patchConsole, clearConsoleBuffer } = createConsoleCapture(app, () => exited);

  const requestExit = (err?: Error) => {
    if (exited) return;
    if (err) exitError = err;
    exited = true;
    cleanupPatchedConsole();
    cleanupEventSubscription();
    void Promise.resolve()
      .then(() => app.stop())
      .catch(() => {
        // Best-effort; still resolve/reject exit promise.
      })
      .finally(() => {
        cleanupEventSubscription();
        try {
          app.dispose();
        } catch {
          // ignore
        }
        if (exitError) exitD.reject(exitError);
        else exitD.resolve(undefined);
      });
  };

  if (exitOnCtrlC) {
    app.keys({
      "ctrl+c": () => requestExit(),
    });
  }

  unsubEvents = app.onEvent((ev) => {
    eventEmitter.emit("input", ev);
  });

  const stdioValue: StdioContextValue = Object.freeze({
    stdin,
    stdout,
    stderr,
    // Rezi owns terminal mode; Ink-style raw mode toggling is intentionally a no-op.
    setRawMode: () => {},
    isRawModeSupported: false,
    internal_exitOnCtrlC: exitOnCtrlC,
    internal_eventEmitter: eventEmitter,
  });

  const wrap = (node: React.ReactNode) =>
    React.createElement(
      AppContext.Provider,
      { value: { exit: requestExit } },
      React.createElement(
        StdioContext.Provider,
        { value: stdioValue },
        React.createElement(FocusProvider, null, node),
      ),
    );

  const root: HostRoot = {
    kind: "root",
    children: [],
    staticVNodes: [],
    onCommit(vnode) {
      app.update((prev) => ({ ...prev, vnode: vnode ?? ui.text("") }));
    },
  };

  const container = reconciler.createContainer(root, 0, null, false, null, "id", () => {}, null);

  try {
    if (shouldPatchConsole) restoreConsole = patchConsole();
    reconciler.updateContainer(wrap(tree), container, null, () => {});
  } catch (error) {
    cleanupPatchedConsole();
    cleanupEventSubscription();
    try {
      app.dispose();
    } catch {
      // ignore
    }
    throw error;
  }

  void app.start().catch((e: unknown) => {
    requestExit(e instanceof Error ? e : new Error(String(e)));
  });

  return {
    rerender(nextTree: React.ReactNode) {
      reconciler.updateContainer(wrap(nextTree), container, null, () => {});
    },
    unmount() {
      reconciler.updateContainer(null, container, null, () => {});
      requestExit();
    },
    waitUntilExit() {
      return exitD.promise;
    },
    cleanup() {
      reconciler.updateContainer(null, container, null, () => {});
      requestExit();
    },
    clear() {
      clearConsoleBuffer();
      app.update((prev) => ({ ...prev, vnode: ui.text(""), consoleLines: [] }));
    },
  };
}
