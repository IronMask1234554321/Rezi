import type { UiEvent, ZrevEvent } from "@rezi-ui/core";
import {
  ZR_KEY_BACKSPACE,
  ZR_KEY_DELETE,
  ZR_KEY_DOWN,
  ZR_KEY_ENTER,
  ZR_KEY_ESCAPE,
  ZR_KEY_LEFT,
  ZR_KEY_PAGE_DOWN,
  ZR_KEY_PAGE_UP,
  ZR_KEY_RIGHT,
  ZR_KEY_TAB,
  ZR_KEY_UP,
  ZR_MOD_ALT,
  ZR_MOD_CTRL,
  ZR_MOD_META,
  ZR_MOD_SHIFT,
} from "@rezi-ui/core/keybindings";
import { useEffect } from "react";
import reconciler from "../reconciler.js";
import type { Key } from "../types.js";
import useStdin from "./useStdin.js";

type Handler = (input: string, key: Key) => void;
type Options = Readonly<{ isActive?: boolean }>;
const TEXT_DECODER = new TextDecoder();

function buildKey(mods: number, ev: ZrevEvent | null): Key {
  const ctrl = (mods & ZR_MOD_CTRL) !== 0;
  const shift = (mods & ZR_MOD_SHIFT) !== 0;
  const meta = (mods & (ZR_MOD_ALT | ZR_MOD_META)) !== 0;

  const keyCode = ev?.kind === "key" ? ev.key : null;

  return {
    upArrow: keyCode === ZR_KEY_UP,
    downArrow: keyCode === ZR_KEY_DOWN,
    leftArrow: keyCode === ZR_KEY_LEFT,
    rightArrow: keyCode === ZR_KEY_RIGHT,
    pageDown: keyCode === ZR_KEY_PAGE_DOWN,
    pageUp: keyCode === ZR_KEY_PAGE_UP,
    return: keyCode === ZR_KEY_ENTER,
    escape: keyCode === ZR_KEY_ESCAPE,
    ctrl,
    shift,
    tab: keyCode === ZR_KEY_TAB,
    backspace: keyCode === ZR_KEY_BACKSPACE,
    delete: keyCode === ZR_KEY_DELETE,
    // Ink sets meta=true for Escape for backward compatibility.
    meta: meta || keyCode === ZR_KEY_ESCAPE,
  };
}

function isNonTextKey(keyCode: number): boolean {
  return (
    keyCode === ZR_KEY_UP ||
    keyCode === ZR_KEY_DOWN ||
    keyCode === ZR_KEY_LEFT ||
    keyCode === ZR_KEY_RIGHT ||
    keyCode === ZR_KEY_PAGE_UP ||
    keyCode === ZR_KEY_PAGE_DOWN ||
    keyCode === ZR_KEY_ENTER ||
    keyCode === ZR_KEY_ESCAPE ||
    keyCode === ZR_KEY_TAB ||
    keyCode === ZR_KEY_BACKSPACE ||
    keyCode === ZR_KEY_DELETE
  );
}

function keyCodeToChar(keyCode: number, shift: boolean): string | null {
  // Only handle printable ASCII here; unicode text input comes from ZREV TEXT/PASTE.
  if (keyCode < 32 || keyCode > 126) return null;
  const ch = String.fromCharCode(keyCode);
  // Engine key codes for letters are commonly normalized to uppercase; treat shift=false as lowercase.
  if (!shift && ch >= "A" && ch <= "Z") return ch.toLowerCase();
  return ch;
}

function mapEngineEventToInput(
  ev: ZrevEvent,
  lastMods: number,
): Readonly<{ input: string; key: Key } | null> {
  if (ev.kind === "key") {
    if (ev.action === "up") return null;

    const mods = ev.mods;
    const key = buildKey(mods, ev);

    // Always surface non-text keys.
    if (isNonTextKey(ev.key)) {
      return { input: "", key };
    }

    // Avoid double-calling for normal typing: prefer TEXT events when no ctrl/meta.
    if ((mods & (ZR_MOD_CTRL | ZR_MOD_ALT | ZR_MOD_META)) === 0) return null;

    const input = keyCodeToChar(ev.key, key.shift) ?? "";
    return { input, key };
  }

  if (ev.kind === "text") {
    let input = "";
    try {
      input = String.fromCodePoint(ev.codepoint);
    } catch {
      return null;
    }
    const key = buildKey(lastMods, null);
    return { input, key };
  }

  if (ev.kind === "paste") {
    const input = TEXT_DECODER.decode(ev.bytes);
    const key = buildKey(lastMods, null);
    return { input, key };
  }

  return null;
}

/**
 * Ink-compatible `useInput()` implemented on top of Rezi engine events.
 */
const useInput = (inputHandler: Handler, options: Options = {}): void => {
  const { internal_eventEmitter, internal_exitOnCtrlC } = useStdin();

  useEffect(() => {
    if (options.isActive === false) return;

    let lastMods = 0;

    const handle = (uiEv: UiEvent) => {
      if (uiEv.kind !== "engine") return;

      // Track modifier state from engine KEY events so TEXT/PASTE can inherit it best-effort.
      if (uiEv.event.kind === "key") lastMods = uiEv.event.mods;

      const mapped = mapEngineEventToInput(uiEv.event, lastMods);
      if (!mapped) return;

      const { input, key } = mapped;

      // Mirror Ink: don't forward Ctrl+C when exitOnCtrlC is enabled.
      if (input.toLowerCase() === "c" && key.ctrl && internal_exitOnCtrlC) return;

      // If input is uppercase ASCII, mark shift=true (Ink compatibility quirk).
      const keyMut = { ...key };
      if (input.length === 1 && /^[A-Z]$/.test(input)) keyMut.shift = true;

      // @ts-expect-error `batchedUpdates` is typed as requiring an argument.
      reconciler.batchedUpdates(() => {
        inputHandler(input, keyMut);
      });
    };

    internal_eventEmitter.on("input", handle);
    return () => {
      internal_eventEmitter.removeListener("input", handle);
    };
  }, [internal_eventEmitter, internal_exitOnCtrlC, inputHandler, options.isActive]);
};

export default useInput;
