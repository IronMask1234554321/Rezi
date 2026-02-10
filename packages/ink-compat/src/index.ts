// Public surface (drop-in replacement for "ink").

// Components
export { default as Box } from "./components/Box.js";
export { default as Text } from "./components/Text.js";
export { default as Spacer } from "./components/Spacer.js";
export { default as Newline } from "./components/Newline.js";
export { default as Transform } from "./components/Transform.js";
export { default as Static } from "./components/Static.js";

// Hooks
export { default as useInput } from "./hooks/useInput.js";
export { default as useApp } from "./hooks/useApp.js";
export { default as useStdin } from "./hooks/useStdin.js";
export { default as useStdout } from "./hooks/useStdout.js";
export { default as useStderr } from "./hooks/useStderr.js";
export { default as useFocus } from "./hooks/useFocus.js";
export { default as useFocusManager } from "./hooks/useFocusManager.js";

// Render
export { render } from "./render.js";
export type { Instance, RenderOptions } from "./types.js";

// Types
export type { Key, BoxProps, TextProps } from "./types.js";
