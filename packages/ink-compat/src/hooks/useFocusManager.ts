import { useContext } from "react";
import FocusContext from "../context/FocusContext.js";

/**
 * Ink-compatible `useFocusManager()`.
 */
export default function useFocusManager() {
  const focusContext = useContext(FocusContext);
  return {
    enableFocus: focusContext.enableFocus,
    disableFocus: focusContext.disableFocus,
    focusNext: focusContext.focusNext,
    focusPrevious: focusContext.focusPrevious,
    focus: focusContext.focus,
  };
}
