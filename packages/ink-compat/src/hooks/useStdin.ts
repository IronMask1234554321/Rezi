import { useRequiredStdioContext } from "../context/StdioContext.js";

/**
 * Ink-compatible `useStdin()` hook.
 *
 * In Ink, this returns the StdinContext props. We keep the same surface.
 */
export default function useStdin() {
  const ctx = useRequiredStdioContext();
  return {
    stdin: ctx.stdin,
    setRawMode: ctx.setRawMode,
    isRawModeSupported: ctx.isRawModeSupported,
    internal_exitOnCtrlC: ctx.internal_exitOnCtrlC,
    internal_eventEmitter: ctx.internal_eventEmitter,
  };
}
