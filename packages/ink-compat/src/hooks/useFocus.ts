import { useContext, useEffect, useMemo } from "react";
import FocusContext from "../context/FocusContext.js";
import useStdin from "./useStdin.js";

type Input = Readonly<{
  /**
   * Enable or disable this component's focus, while still maintaining its
   * position in the list of focusable components.
   */
  isActive?: boolean;
  /**
   * Auto focus this component, if there's no active (focused) component right now.
   */
  autoFocus?: boolean;
  /**
   * Assign an ID to this component, so it can be programmatically focused with `focus(id)`.
   */
  id?: string;
}>;

type Output = Readonly<{
  isFocused: boolean;
  focus: (id: string) => void;
}>;

/**
 * Ink-compatible `useFocus()`.
 *
 * This is a compat-only focus system used to coordinate `isActive` flags for
 * `useInput` in third-party Ink components. It does not integrate with Rezi's
 * widget-level focus system.
 */
export default function useFocus({
  isActive = true,
  autoFocus = false,
  id: customId,
}: Input = {}): Output {
  const { isRawModeSupported, setRawMode } = useStdin();
  const { activeId, add, remove, activate, deactivate, focus } = useContext(FocusContext);

  const id = useMemo(() => customId ?? Math.random().toString().slice(2, 7), [customId]);

  useEffect(() => {
    add(id, { autoFocus });
    return () => {
      remove(id);
    };
  }, [add, autoFocus, id, remove]);

  useEffect(() => {
    if (isActive) activate(id);
    else deactivate(id);
  }, [activate, deactivate, id, isActive]);

  useEffect(() => {
    if (!isRawModeSupported || !isActive) return;
    setRawMode(true);
    return () => {
      setRawMode(false);
    };
  }, [isActive, isRawModeSupported, setRawMode]);

  return {
    isFocused: Boolean(id) && activeId === id,
    focus,
  };
}
