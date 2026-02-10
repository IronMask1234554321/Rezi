import React from "react";

export type FocusContextValue = Readonly<{
  activeId: string | undefined;
  add: (id: string, options: Readonly<{ autoFocus: boolean }>) => void;
  remove: (id: string) => void;
  activate: (id: string) => void;
  deactivate: (id: string) => void;
  enableFocus: () => void;
  disableFocus: () => void;
  focusNext: () => void;
  focusPrevious: () => void;
  focus: (id: string) => void;
}>;

// eslint-disable-next-line @typescript-eslint/naming-convention
const FocusContext = React.createContext<FocusContextValue>({
  activeId: undefined,
  add: () => {},
  remove: () => {},
  activate: () => {},
  deactivate: () => {},
  enableFocus: () => {},
  disableFocus: () => {},
  focusNext: () => {},
  focusPrevious: () => {},
  focus: () => {},
});

export default FocusContext;
