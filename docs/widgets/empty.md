# Empty

Empty-state widget for “nothing to show” (optionally with an icon and an action).

## Usage

```typescript
import { ui } from "@rezi-ui/core";

ui.empty("No results", { description: "Try changing your filters." });
```

## Props

`ui.empty(title, props?)` takes a required `title` plus optional props.

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | **required** | Main title text |
| `description` | `string` | - | Optional secondary text |
| `icon` | `string` | - | Optional icon path (e.g. `"ui.search"`) |
| `action` | `VNode` | - | Optional action widget (usually a button) |
| `style` | `TextStyle` | - | Optional style override |
| `key` | `string` | - | Reconciliation key |

## Examples

### 1) Empty results + action

```typescript
import { ui } from "@rezi-ui/core";

ui.empty("No matches", {
  description: "Try a different query.",
  action: ui.button({ id: "clear", label: "Clear filters" }),
});
```

### 2) Error state

```typescript
import { ui } from "@rezi-ui/core";

ui.empty("Error", {
  description: state.errorMessage,
  action: ui.button({ id: "retry", label: "Retry" }),
});
```

## Related

- [Skeleton](skeleton.md) - Loading placeholders
- [Spinner](spinner.md) - Animated loading indicator
