/**
 * packages/core/src/theme/interop.ts — Interop between theme systems.
 *
 * Why: The app runtime and renderer operate on the legacy `Theme` shape
 * (flat color map + spacing array). Public docs and presets use the new
 * semantic token `ThemeDefinition`. This module provides a deterministic
 * conversion to keep the public API ergonomic.
 */

import { defaultTheme } from "./defaultTheme.js";
import type { Theme } from "./theme.js";
import type { ThemeDefinition } from "./tokens.js";

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function isThemeDefinition(v: Theme | ThemeDefinition): v is ThemeDefinition {
  if (!isObject(v)) return false;
  const candidate = v as unknown as { name?: unknown; colors?: unknown };
  if (typeof candidate.name !== "string") return false;
  if (!isObject(candidate.colors)) return false;
  const colors = candidate.colors as { bg?: unknown; fg?: unknown; accent?: unknown };
  return isObject(colors.bg) && isObject(colors.fg) && isObject(colors.accent);
}

export function coerceToLegacyTheme(theme: Theme | ThemeDefinition): Theme {
  if (!isThemeDefinition(theme)) return theme;

  const c = theme.colors;

  const colors: Theme["colors"] = Object.freeze({
    // Legacy keys used by resolveColor(theme, key)
    primary: c.accent.primary,
    secondary: c.accent.secondary,
    success: c.success,
    danger: c.error,
    warning: c.warning,
    info: c.info,
    muted: c.fg.muted,
    bg: c.bg.base,
    fg: c.fg.primary,
    border: c.border.default,

    // Semantic token paths (so widgets can use dot paths like "fg.primary")
    "bg.base": c.bg.base,
    "bg.elevated": c.bg.elevated,
    "bg.overlay": c.bg.overlay,
    "bg.subtle": c.bg.subtle,
    "fg.primary": c.fg.primary,
    "fg.secondary": c.fg.secondary,
    "fg.muted": c.fg.muted,
    "fg.inverse": c.fg.inverse,
    "accent.primary": c.accent.primary,
    "accent.secondary": c.accent.secondary,
    "accent.tertiary": c.accent.tertiary,
    error: c.error,
    "focus.ring": c.focus.ring,
    "focus.bg": c.focus.bg,
    "selected.bg": c.selected.bg,
    "selected.fg": c.selected.fg,
    "disabled.fg": c.disabled.fg,
    "disabled.bg": c.disabled.bg,
    "border.subtle": c.border.subtle,
    "border.default": c.border.default,
    "border.strong": c.border.strong,
  });

  // ThemeDefinition has no spacing scale; reuse the default spacing for determinism.
  return Object.freeze({ colors, spacing: defaultTheme.spacing });
}
