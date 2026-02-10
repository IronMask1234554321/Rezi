/**
 * packages/core/src/icons/registry.ts — Icon definitions and registry.
 *
 * Why: Provides a consistent set of icons for terminal UI with fallbacks
 * for terminals that don't support Nerd Fonts or Unicode symbols.
 *
 * Icon categories:
 *   - File & folder icons
 *   - Status icons (check, cross, warning, etc.)
 *   - Arrow/chevron icons
 *   - Git status icons
 *   - UI icons (menu, close, search, etc.)
 *
 * @see docs/styling/icons.md
 */

/**
 * Icon definition with display character and fallback.
 */
export type IconDefinition = Readonly<{
  /** Primary display character (may require Nerd Font) */
  char: string;
  /** ASCII fallback for basic terminals */
  fallback: string;
  /** Display width in terminal cells */
  width: number;
}>;

/**
 * Create a frozen icon definition.
 */
function icon(char: string, fallback: string, width = 1): IconDefinition {
  return Object.freeze({ char, fallback, width });
}

// =============================================================================
// File & Folder Icons
// =============================================================================

export const FILE_ICONS = Object.freeze({
  file: icon("", "[]", 1),
  fileCode: icon("", "<>", 1),
  fileText: icon("", "==", 1),
  fileConfig: icon("", "@@", 1),
  fileBinary: icon("", "##", 1),
  folder: icon("", "[+]", 1),
  folderOpen: icon("", "[-]", 1),
  folderGit: icon("", "[g]", 1),
} as const);

// =============================================================================
// Status Icons
// =============================================================================

export const STATUS_ICONS = Object.freeze({
  check: icon("✓", "[x]", 1),
  cross: icon("✗", "[X]", 1),
  warning: icon("⚠", "[!]", 1),
  info: icon("ℹ", "[i]", 1),
  error: icon("✖", "[E]", 1),
  question: icon("?", "[?]", 1),
  pending: icon("○", "[ ]", 1),
  success: icon("●", "[*]", 1),
  dot: icon("•", "*", 1),
  circle: icon("○", "o", 1),
  circleFilled: icon("●", "*", 1),
  square: icon("□", "[ ]", 1),
  squareFilled: icon("■", "[x]", 1),
} as const);

// =============================================================================
// Arrow Icons
// =============================================================================

export const ARROW_ICONS = Object.freeze({
  up: icon("↑", "^", 1),
  down: icon("↓", "v", 1),
  left: icon("←", "<", 1),
  right: icon("→", ">", 1),
  upDown: icon("↕", "|", 1),
  leftRight: icon("↔", "-", 1),
  chevronUp: icon("▲", "^", 1),
  chevronDown: icon("▼", "v", 1),
  chevronLeft: icon("◀", "<", 1),
  chevronRight: icon("▶", ">", 1),
  triangleUp: icon("△", "^", 1),
  triangleDown: icon("▽", "v", 1),
  triangleLeft: icon("◁", "<", 1),
  triangleRight: icon("▷", ">", 1),
  arrowReturn: icon("↵", "<-", 1),
  arrowTab: icon("⇥", "->", 1),
} as const);

// =============================================================================
// Git Icons
// =============================================================================

export const GIT_ICONS = Object.freeze({
  modified: icon("●", "M", 1),
  added: icon("+", "+", 1),
  deleted: icon("−", "-", 1),
  renamed: icon("➜", "R", 1),
  copied: icon("⧉", "C", 1),
  untracked: icon("?", "?", 1),
  ignored: icon("◌", "I", 1),
  conflict: icon("!", "!", 1),
  staged: icon("✓", "S", 1),
  branch: icon("", "*", 1),
  commit: icon("", "o", 1),
  merge: icon("", "Y", 1),
  stash: icon("", "$", 1),
} as const);

// =============================================================================
// UI Icons
// =============================================================================

export const UI_ICONS = Object.freeze({
  menu: icon("☰", "=", 1),
  close: icon("×", "x", 1),
  search: icon("", "/", 1),
  settings: icon("", "*", 1),
  edit: icon("✎", "e", 1),
  copy: icon("⧉", "c", 1),
  paste: icon("", "p", 1),
  cut: icon("", "x", 1),
  save: icon("", "S", 1),
  undo: icon("↶", "u", 1),
  redo: icon("↷", "r", 1),
  refresh: icon("↻", "R", 1),
  sync: icon("", "~", 1),
  lock: icon("", "#", 1),
  unlock: icon("", "-", 1),
  visible: icon("", "o", 1),
  hidden: icon("", "-", 1),
  expand: icon("+", "+", 1),
  collapse: icon("−", "-", 1),
  filter: icon("", "Y", 1),
  sort: icon("", "^v", 1),
  pin: icon("", "P", 1),
  bookmark: icon("", "B", 1),
  star: icon("★", "*", 1),
  starEmpty: icon("☆", "o", 1),
  heart: icon("♥", "<3", 1),
  heartEmpty: icon("♡", "<>", 1),
  home: icon("", "~", 1),
  terminal: icon("", ">_", 1),
  debug: icon("", "D", 1),
  play: icon("▶", ">", 1),
  pause: icon("⏸", "||", 1),
  stop: icon("⏹", "[]", 1),
  record: icon("⏺", "()", 1),
} as const);

// =============================================================================
// Spinner Frames (for animated spinners)
// =============================================================================

export const SPINNER_FRAMES = Object.freeze({
  dots: Object.freeze(["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]),
  line: Object.freeze(["-", "\\", "|", "/"]),
  circle: Object.freeze(["◐", "◓", "◑", "◒"]),
  bounce: Object.freeze(["⠁", "⠂", "⠄", "⠂"]),
  pulse: Object.freeze(["█", "▓", "▒", "░", "▒", "▓"]),
  arrows: Object.freeze(["←", "↖", "↑", "↗", "→", "↘", "↓", "↙"]),
  dots2: Object.freeze(["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"]),
} as const);

export type SpinnerVariant = keyof typeof SPINNER_FRAMES;

// =============================================================================
// Combined Icon Registry
// =============================================================================

/**
 * All icons organized by category.
 */
export const icons = Object.freeze({
  file: FILE_ICONS,
  status: STATUS_ICONS,
  arrow: ARROW_ICONS,
  git: GIT_ICONS,
  ui: UI_ICONS,
} as const);

/**
 * Icon category names.
 */
export type IconCategory = keyof typeof icons;

/**
 * Icon names within each category.
 */
export type FileIconName = keyof typeof FILE_ICONS;
export type StatusIconName = keyof typeof STATUS_ICONS;
export type ArrowIconName = keyof typeof ARROW_ICONS;
export type GitIconName = keyof typeof GIT_ICONS;
export type UiIconName = keyof typeof UI_ICONS;

/**
 * Full icon path (e.g., "file.folder", "status.check", "arrow.right").
 */
export type IconPath =
  | `file.${FileIconName}`
  | `status.${StatusIconName}`
  | `arrow.${ArrowIconName}`
  | `git.${GitIconName}`
  | `ui.${UiIconName}`;

/**
 * Resolve an icon path to its definition.
 *
 * @param path - Icon path (e.g., "status.check", "arrow.right")
 * @returns Icon definition, or null if not found
 *
 * @example
 * ```typescript
 * const check = resolveIcon("status.check");
 * // { char: "✓", fallback: "[x]", width: 1 }
 * ```
 */
export function resolveIcon(path: IconPath): IconDefinition;
export function resolveIcon(path: string): IconDefinition | null;
export function resolveIcon(path: string): IconDefinition | null {
  const [category, name] = path.split(".") as [string, string];
  if (!category || !name) return null;

  const categoryIcons = icons[category as IconCategory];
  if (!categoryIcons) return null;

  const icon = (categoryIcons as Readonly<Record<string, IconDefinition>>)[name];
  return icon ?? null;
}

/**
 * Get the display character for an icon, using fallback if requested.
 *
 * @param path - Icon path
 * @param useFallback - Whether to use ASCII fallback
 * @returns Display character, or empty string if not found
 */
export function getIconChar(path: string, useFallback = false): string {
  const icon = resolveIcon(path);
  if (!icon) return "";
  return useFallback ? icon.fallback : icon.char;
}

/**
 * Get spinner frame for animation.
 *
 * @param variant - Spinner variant name
 * @param tick - Animation tick (frame number)
 * @returns Spinner character for this frame
 */
export function getSpinnerFrame(variant: SpinnerVariant, tick: number): string {
  const frames = SPINNER_FRAMES[variant];
  const index = tick % frames.length;
  // All spinner frame arrays are non-empty, so index access is safe
  return frames[index] as string;
}
