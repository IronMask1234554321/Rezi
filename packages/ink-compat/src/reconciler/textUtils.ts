import { type RichTextSpan, type TextStyle, type VNode, ui } from "@rezi-ui/core";
import { InkCompatError } from "../errors.js";
import { mapTextProps } from "../props.js";
import type { TextProps } from "../types.js";
import type { HostElement, HostNode } from "./types.js";

function mergeStyle(a: TextStyle | undefined, b: TextStyle | undefined): TextStyle | undefined {
  if (!a) return b;
  if (!b) return a;
  return { ...a, ...b };
}

function sameStyle(a: TextStyle | undefined, b: TextStyle | undefined): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.bold === b.bold &&
    a.dim === b.dim &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.inverse === b.inverse &&
    (a.fg?.r ?? null) === (b.fg?.r ?? null) &&
    (a.fg?.g ?? null) === (b.fg?.g ?? null) &&
    (a.fg?.b ?? null) === (b.fg?.b ?? null) &&
    (a.bg?.r ?? null) === (b.bg?.r ?? null) &&
    (a.bg?.g ?? null) === (b.bg?.g ?? null) &&
    (a.bg?.b ?? null) === (b.bg?.b ?? null)
  );
}

function pushSpan(out: RichTextSpan[], span: RichTextSpan): void {
  const prev = out[out.length - 1];
  if (prev && sameStyle(prev.style, span.style)) {
    out[out.length - 1] = {
      text: prev.text + span.text,
      ...(prev.style ? { style: prev.style } : {}),
    };
    return;
  }
  out.push(span);
}

type InternalTransform = (children: string, index: number) => string;

function getInternalTransform(props: Record<string, unknown>): InternalTransform | null {
  const t = (props as { internal_transform?: unknown }).internal_transform;
  return typeof t === "function" ? (t as InternalTransform) : null;
}

function applyTransformPerLine(text: string, transform: InternalTransform): string {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    lines[i] = transform(line ?? "", i);
  }
  return lines.join("\n");
}

export function sanitizeTextForTerminal(raw: string): string {
  // Normalize CRLF/CR into LF.
  const text = raw.replace(/\r\n?/g, "\n");

  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === undefined) continue;
    if (ch === "\n") {
      out += "\n";
      continue;
    }
    if (ch === "\t") {
      // Tabs are control chars; expand to spaces to avoid cursor movement.
      out += "  ";
      continue;
    }

    const code = ch.charCodeAt(0);
    // Drop other ASCII control chars.
    if (code < 0x20 || code === 0x7f) continue;

    out += ch;
  }

  return out;
}

function collectTextSpans(
  nodes: readonly HostNode[],
  inherited: TextStyle | undefined,
  out: RichTextSpan[],
): void {
  for (const n of nodes) {
    if (n.kind === "text") {
      const text = sanitizeTextForTerminal(n.text);
      if (text.length === 0) continue;
      pushSpan(out, { text, ...(inherited ? { style: inherited } : {}) });
      continue;
    }

    if (n.type === "ink-text" || n.type === "ink-virtual-text") {
      const { style } = mapTextProps(n.props as unknown as TextProps);
      const merged = mergeStyle(inherited, style);
      const transform = getInternalTransform(n.props);
      if (transform) {
        const inner: RichTextSpan[] = [];
        collectTextSpans(n.children, merged, inner);
        const text = inner.map((s) => s.text).join("");
        const transformed = applyTransformPerLine(text, transform);
        if (transformed.length === 0) continue;
        pushSpan(out, { text: transformed, ...(merged ? { style: merged } : {}) });
      } else {
        collectTextSpans(n.children, merged, out);
      }
      continue;
    }

    throw new InkCompatError(
      "INK_COMPAT_INVALID_PROPS",
      `<${String(n.type)}> cannot be nested inside <Text>`,
    );
  }
}

export function splitSpansByNewline(spans: readonly RichTextSpan[]): RichTextSpan[][] {
  const lines: RichTextSpan[][] = [[]];

  for (const s of spans) {
    const parts = s.text.split("\n");
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] ?? "";
      if (part.length > 0) {
        const line = lines[lines.length - 1];
        if (!line) continue;
        pushSpan(line, { text: part, ...(s.style ? { style: s.style } : {}) });
      }
      // Every newline starts a new line (including trailing newline -> empty last line).
      if (i < parts.length - 1) lines.push([]);
    }
  }

  return lines;
}

export function convertText(node: HostElement): VNode | null {
  const mapped = mapTextProps(node.props as unknown as TextProps);
  const transform = getInternalTransform(node.props);
  let spans: RichTextSpan[] = [];

  if (transform) {
    const inner: RichTextSpan[] = [];
    collectTextSpans(node.children, mapped.style, inner);
    const text = inner.map((s) => s.text).join("");
    const transformed = applyTransformPerLine(text, transform);
    if (transformed.length > 0) {
      spans = [{ text: transformed, ...(mapped.style ? { style: mapped.style } : {}) }];
    }
  } else {
    spans = [];
    collectTextSpans(node.children, mapped.style, spans);
  }

  if (spans.length === 0) return null;

  const isMultiline = spans.some((s) => s.text.includes("\n"));
  if (isMultiline) {
    const lines = splitSpansByNewline(spans);
    const children: VNode[] = [];
    for (const line of lines) {
      if (line.length === 0) {
        children.push(ui.text(""));
        continue;
      }
      if (line.length === 1) {
        const s = line[0];
        if (!s) continue;
        const props = {
          ...(s.style ? { style: s.style } : {}),
          ...(mapped.textOverflow ? { textOverflow: mapped.textOverflow } : {}),
        };
        children.push(Object.keys(props).length === 0 ? ui.text(s.text) : ui.text(s.text, props));
        continue;
      }
      children.push(ui.richText(line));
    }
    return children.length === 1 ? (children[0] ?? ui.text("")) : ui.column({}, children);
  }

  if (spans.length === 1) {
    const s = spans[0];
    if (!s) return null;
    const props = {
      ...(s.style ? { style: s.style } : {}),
      ...(mapped.textOverflow ? { textOverflow: mapped.textOverflow } : {}),
    };
    // If there are no props, use the simplest `ui.text` overload.
    return Object.keys(props).length === 0 ? ui.text(s.text) : ui.text(s.text, props);
  }

  return ui.richText(spans);
}
