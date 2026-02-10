# Badge

Small status label with semantic variants (`success`, `warning`, `error`, `info`).

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.badge("New");
ui.badge("Error", { variant: "error" });
ui.badge("3", { variant: "info" });
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | **required** | Badge text |
| `variant` | `"default" \| "success" \| "warning" \| "error" \| "info"` | `"default"` | Semantic variant |
| `style` | `TextStyle` | - | Optional style override |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) Inline metadata

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 1 }, [
  ui.text("Build"),
  ui.badge("passing", { variant: "success" }),
]);
```

### 2) Numeric count

```typescript
import { ui } from "@rezi-ui/core";

ui.badge(String(state.unread), { variant: state.unread > 0 ? "info" : "default" });
```

## Related

- [Tag](tag.md) - Chip-like labels
- [Status](status.md) - Online/offline indicator
