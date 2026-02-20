import type { TerminalCaps } from "./terminalCaps.js";

export type TerminalProfile = Readonly<{
  id: string;
  versionString: string;
  supportsKittyGraphics: boolean;
  supportsSixel: boolean;
  supportsIterm2Images: boolean;
  supportsUnderlineStyles: boolean;
  supportsColoredUnderlines: boolean;
  supportsHyperlinks: boolean;
  cellWidthPx: number;
  cellHeightPx: number;
}>;

export const DEFAULT_TERMINAL_PROFILE: TerminalProfile = Object.freeze({
  id: "unknown",
  versionString: "",
  supportsKittyGraphics: false,
  supportsSixel: false,
  supportsIterm2Images: false,
  supportsUnderlineStyles: false,
  supportsColoredUnderlines: false,
  supportsHyperlinks: false,
  cellWidthPx: 0,
  cellHeightPx: 0,
});

const SGR_UNDERLINE = 1 << 2;

export function terminalProfileFromCaps(caps: TerminalCaps): TerminalProfile {
  const capsRecord = caps as TerminalCaps & Readonly<Record<string, unknown>>;
  const supportsUnderlineBySgr = (caps.sgrAttrsSupported & SGR_UNDERLINE) !== 0;
  const supportsUnderlineStyles =
    caps.supportsUnderlineStyles === true ||
    (typeof capsRecord.supportsUnderlineStyles === "boolean"
      ? capsRecord.supportsUnderlineStyles
      : false) ||
    supportsUnderlineBySgr;
  const supportsColoredUnderlines =
    caps.supportsColoredUnderlines === true ||
    (typeof capsRecord.supportsColoredUnderlines === "boolean"
      ? capsRecord.supportsColoredUnderlines
      : false) ||
    supportsUnderlineStyles;
  const supportsHyperlinks =
    caps.supportsHyperlinks === true ||
    (typeof capsRecord.supportsHyperlinks === "boolean" ? capsRecord.supportsHyperlinks : false);
  return Object.freeze({
    ...DEFAULT_TERMINAL_PROFILE,
    supportsUnderlineStyles,
    supportsColoredUnderlines,
    supportsHyperlinks,
  });
}
