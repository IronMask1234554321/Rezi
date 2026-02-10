# Tag

Compact label/chip widget, useful for metadata lists.

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.tag("v0.1.0");
ui.tag("breaking", { variant: "warning" });
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | **required** | Tag text |
| `variant` | `"default" \| "success" \| "warning" \| "error" \| "info"` | `"default"` | Semantic variant |
| `removable` | `boolean` | `false` | Show a remove affordance |
| `style` | `TextStyle` | - | Optional style override |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) Tag list

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 1 }, [ui.tag("cli"), ui.tag("tui"), ui.tag("typescript", { variant: "info" })]);
```

### 2) Removable tags

```typescript
import { ui } from "@rezi-ui/core";

ui.tag("filter:open", { removable: true });
```

## Related

- [Badge](badge.md) - Status labels
- [Kbd](kbd.md) - Keyboard shortcut chips
