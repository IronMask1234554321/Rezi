import React from "react";
import { InkCompatError } from "../errors.js";

export type AppContextValue = Readonly<{
  exit: (error?: Error) => void;
}>;

function missing(): never {
  throw new InkCompatError(
    "INK_COMPAT_INTERNAL",
    "useApp() was called outside of a render() root (AppContext missing)",
  );
}

const AppContext = React.createContext<AppContextValue>({ exit: missing });

export default AppContext;
