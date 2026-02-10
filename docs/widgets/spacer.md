# Spacer

Adds empty space in a `row`/`column` layout.

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 1 }, [
  ui.text("Left"),
  ui.spacer({ flex: 1 }),
  ui.text("Right"),
]);
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | - | Reconciliation key |
| `size` | `number` | - | Fixed size in cells along the stack axis |
| `flex` | `number` | - | Expand to fill remaining space (main axis) |

## Examples

### 1) Fixed spacing

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 0 }, [ui.text("A"), ui.spacer({ size: 4 }), ui.text("B")]);
```

### 2) Center an item

```typescript
import { ui } from "@rezi-ui/core";

ui.row({}, [
  ui.spacer({ flex: 1 }),
  ui.text("Centered"),
  ui.spacer({ flex: 1 }),
]);
```

## Related

- [Row / Column](stack.md) - Stack layouts
- [Layout](../guide/layout.md) - Flex and size constraints
