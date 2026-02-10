# Status

Status indicator (online/offline/away/busy/unknown) with optional label.

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.status("online");
ui.status("busy", { label: "In a meeting" });
ui.status("away", { showLabel: true });
```

## Props

`ui.status(status, props?)` takes a required status plus optional props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `status` | `"online" \| "offline" \| "away" \| "busy" \| "unknown"` | **required** | Status type |
| `label` | `string` | - | Optional label text |
| `showLabel` | `boolean` | - | Force label visibility (defaults to true if `label` provided) |
| `style` | `TextStyle` | - | Optional style override |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) Presence list

```typescript
import { ui } from "@rezi-ui/core";

ui.column({ gap: 1 }, [
  ui.status("online", { label: "Ada" }),
  ui.status("away", { label: "Linus" }),
  ui.status("offline", { label: "Grace" }),
]);
```

### 2) Compact indicator

```typescript
import { ui } from "@rezi-ui/core";

ui.status(state.connected ? "online" : "offline");
```

## Related

- [Badge](badge.md) - Semantic status labels
- [Icons](../styling/icons.md) - Visual cues and fallbacks
