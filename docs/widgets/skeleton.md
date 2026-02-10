# Skeleton

Placeholder widget for loading states (text/rect/circle variants).

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.skeleton(20);
ui.skeleton(10, { height: 3, variant: "rect" });
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | **required** | Width in cells |
| `height` | `number` | `1` | Height in rows |
| `variant` | `"text" \| "rect" \| "circle"` | `"text"` | Visual variant |
| `style` | `TextStyle` | - | Optional style override |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) List skeleton

```typescript
import { ui } from "@rezi-ui/core";

ui.column({ gap: 1 }, [ui.skeleton(24), ui.skeleton(18), ui.skeleton(20)]);
```

### 2) Card skeleton

```typescript
import { ui } from "@rezi-ui/core";

ui.box({ border: "rounded", p: 1 }, [
  ui.skeleton(18, { variant: "text" }),
  ui.skeleton(18, { height: 3, variant: "rect" }),
]);
```

## Related

- [Spinner](spinner.md) - Animated loading indicator
- [Empty](empty.md) - Empty/error states
