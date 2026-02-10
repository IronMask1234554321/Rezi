# Divider

Renders a horizontal or vertical divider line, optionally with a centered label.

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.column({ gap: 1 }, [
  ui.text("Section A"),
  ui.divider(),
  ui.text("Section B"),
]);
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | - | Reconciliation key |
| `direction` | `"horizontal" \| "vertical"` | `"horizontal"` | Divider orientation |
| `char` | `string` | - | Override the divider glyph (first char is used) |
| `label` | `string` | - | Optional centered label (horizontal only) |
| `color` | `string` | - | Theme color key/path for divider foreground |

## Examples

### 1) Labeled divider

```typescript
import { ui } from "@rezi-ui/core";

ui.column({ gap: 1 }, [
  ui.text("Sign in"),
  ui.divider({ label: "OR" }),
  ui.text("Create account"),
]);
```

### 2) Vertical divider in a row

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 1 }, [
  ui.text("Left"),
  ui.divider({ direction: "vertical" }),
  ui.text("Right"),
]);
```

## Related

- [Box](box.md) - Borders and titled sections
- [Layout](../guide/layout.md) - Cell-based layout and clipping
