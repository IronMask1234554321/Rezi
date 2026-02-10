import type { UiEvent } from "@rezi-ui/core";
import React from "react";
import { InkCompatError } from "../errors.js";
import type { InputEventEmitter } from "../internal/emitter.js";

export type StdioContextValue = Readonly<{
  stdin: NodeJS.ReadStream;
  stdout: NodeJS.WriteStream;
  stderr: NodeJS.WriteStream;

  setRawMode: (value: boolean) => void;
  isRawModeSupported: boolean;

  internal_exitOnCtrlC: boolean;
  internal_eventEmitter: InputEventEmitter<UiEvent>;
}>;

function missing(): never {
  throw new InkCompatError(
    "INK_COMPAT_INTERNAL",
    "useStdin/useStdout/useStderr/useInput was called outside of a render() root (StdioContext missing)",
  );
}

// We use a null default so hooks can throw a tailored error message.
const StdioContext = React.createContext<StdioContextValue | null>(null);

export function useRequiredStdioContext(): StdioContextValue {
  const v = React.useContext(StdioContext);
  if (v === null) missing();
  return v;
}

export default StdioContext;
