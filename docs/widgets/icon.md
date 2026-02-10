# Icon

Renders a single glyph from the icon registry.

## Usage

```typescript
import { ui, rgb } from "@rezi-ui/core";

ui.icon("status.check");
ui.icon("arrow.right", { style: { fg: rgb(0, 255, 0) } });
ui.icon("ui.search", { fallback: true });
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `icon` | `string` | **required** | Icon path (e.g. `"status.check"`) |
| `style` | `TextStyle` | - | Optional style override |
| `fallback` | `boolean` | `false` | Use ASCII fallback glyph |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) Inline status

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 1 }, [ui.icon("status.warning", { fallback: true }), ui.text("Needs attention")]);
```

### 2) File icon

```typescript
import { ui } from "@rezi-ui/core";

ui.row({ gap: 1 }, [ui.icon("file.folder", { fallback: true }), ui.text("src/")]);
```

## Notes

- Icons render as text. Use `fallback: true` for portable rendering.
- See [Icons](../styling/icons.md) for the full registry.

## Related

- [Icons](../styling/icons.md) - Registry table and categories
- [Badge](badge.md) - Semantic labels
