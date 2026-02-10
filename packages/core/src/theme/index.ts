/**
 * packages/core/src/theme/index.ts — Theme public exports.
 *
 * Exports both the legacy theme system (Theme, createTheme) and the new
 * semantic token system (ThemeDefinition, ColorTokens, etc.).
 */

// Legacy theme system (backwards compatible)
export { defaultTheme } from "./defaultTheme.js";
export {
  createTheme,
  resolveColor,
  resolveSpacing,
  type Theme,
  type ThemeColors,
  type ThemeSpacing,
} from "./theme.js";

// New semantic token system
export {
  color,
  createColorTokens,
  createThemeDefinition,
  type AccentTokens,
  type BgTokens,
  type BorderTokens,
  type ColorTokens,
  type DisabledTokens,
  type FgTokens,
  type FocusTokens,
  type SelectedTokens,
  type ThemeDefinition,
} from "./tokens.js";

// Theme presets
export {
  darkTheme,
  lightTheme,
  dimmedTheme,
  highContrastTheme,
  nordTheme,
  draculaTheme,
  themePresets,
  type ThemePresetName,
} from "./presets.js";

// Resolution utilities
export {
  resolveColorToken,
  tryResolveColorToken,
  resolveColorOrRgb,
  isValidColorPath,
  type ColorPath,
  type ResolveColorResult,
} from "./resolve.js";
