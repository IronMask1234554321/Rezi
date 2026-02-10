import type { VNode } from "@rezi-ui/core";

export function collectText(node: VNode | null): string[] {
  if (!node) return [];

  const out: string[] = [];

  const visit = (n: VNode) => {
    if (n.kind === "text") {
      out.push(n.text);
      return;
    }

    if (n.kind === "richText") {
      const spans = n.props.spans;
      out.push(spans.map((s) => s.text).join(""));
      return;
    }

    if ("children" in n && Array.isArray((n as { children?: unknown }).children)) {
      const children = (n as { children: readonly VNode[] }).children;
      for (const c of children) visit(c);
    }
  };

  visit(node);
  return out;
}

export function findText(node: VNode | null, query: string): boolean {
  return collectText(node).some((t) => t.includes(query));
}
