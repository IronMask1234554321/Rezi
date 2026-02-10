let enabled = false;
const seen = new Set<string>();

export function enableWarnOnce(): void {
  enabled = true;
}

export function warnOnce(message: string): void {
  if (!enabled) return;
  if (seen.has(message)) return;
  seen.add(message);
  // Keep this on stderr (Ink-style warnings) and avoid spamming.
  // This is intentionally behind `options.debug` to avoid corrupting TUI output.
  // eslint-disable-next-line no-console
  console.warn(`[rezi-ui/ink-compat] ${message}`);
}
