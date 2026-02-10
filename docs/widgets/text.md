# Text

Renders a single line of text with optional styling and overflow handling.

## Usage

```typescript
import { ui, rgb } from "@rezi-ui/core";

ui.text("Hello");
ui.text("Title", { fg: rgb(120, 200, 255), bold: true }); // pass a TextStyle
ui.text("Caption", { variant: "caption", textOverflow: "ellipsis" }); // pass TextProps
```

## Props

`ui.text(content, styleOrProps?)` accepts either a `TextStyle` or `TextProps`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `id` | `string` | - | Optional identity (not focusable) |
| `key` | `string` | - | Reconciliation key for lists |
| `style` | `TextStyle` | - | Style applied to this text |
| `variant` | `"body" \| "heading" \| "caption" \| "code" \| "label"` | `"body"` | Predefined styling intent |
| `textOverflow` | `"clip" \| "ellipsis"` | `"clip"` | How to handle overflow |
| `maxWidth` | `number` | - | Maximum width (cells) for overflow handling |

## Examples

### 1) Heading + caption

```typescript
import { ui, rgb } from "@rezi-ui/core";

ui.column({ gap: 1 }, [
  ui.text("Rezi", { variant: "heading", style: { fg: rgb(120, 200, 255), bold: true } }),
  ui.text("Deterministic terminal UI", { variant: "caption", style: { dim: true } }),
]);
```

### 2) Ellipsis truncation

```typescript
import { ui } from "@rezi-ui/core";

ui.box({ width: 20, border: "single", p: 1 }, [
  ui.text("This will truncate with ellipsis", { textOverflow: "ellipsis" }),
]);
```

## Notes

- Text is not focusable and does not emit events.
- Measurement and truncation are cell-based and deterministic.

## Related

- [Box](box.md) - Container with borders/padding
- [Layout](../guide/layout.md) - Cell coordinates, overflow, constraints
