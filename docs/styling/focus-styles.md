# Focus Styles

Rezi is keyboard-first. Focus visuals are designed to be:

- deterministic (no timing-based animation required)
- readable in common terminal themes
- non-color-only (so focus is visible in monochrome/high-contrast)

## Focus appearance

For the built-in focusable widgets (e.g. `button`, `input`, `select`, `checkbox`, `radioGroup`), Rezi applies a consistent focus indicator:

- **underline** + **bold** when focused

This is applied by the renderer and merged with any user-provided `style` prop.

## Focus ring

In a terminal, “focus ring” usually means an *outline* or a *high-contrast marker*. In Rezi v1, the default focus indicator is **text underline + bold** on the focused widget’s content.

If you want a more explicit “ring” around a region (for example, around an input group), you can draw it structurally:

```typescript
import { ui } from "@rezi-ui/core";

ui.box({ border: "double", p: 1, title: "Focused Section" }, [
  ui.input({ id: "name", value: "Ada" }),
]);
```

For higher-level, app-specific focus rings, prefer explicit layout and borders over per-frame style mutations.

## Disabled styling

When `disabled: true` is set on interactive widgets, Rezi makes the widget non-focusable and applies a deterministic gray foreground override.

Example:

```typescript
import { ui } from "@rezi-ui/core";

ui.button({ id: "submit", label: "Submit", disabled: true });
ui.input({ id: "email", value: "test@example.com", disabled: true });
```

## Customization

You can customize appearance without breaking focus visibility:

- prefer **fg/bg changes** and keep underline available for focus
- keep focusable widgets’ `id` stable so focus doesn’t jump
- use the app theme for global consistency and inline styles for local emphasis

```typescript
import { ui, rgb } from "@rezi-ui/core";

ui.button({
  id: "danger",
  label: "Delete",
  style: { fg: rgb(255, 110, 110), bold: true },
});
```

## Accessibility

Practical guidelines for terminal UIs:

- Do not rely on color alone; use underline/bold/labels to convey state.
- Provide keyboard shortcuts for primary actions and document them with `ui.kbd(...)`.
- Ensure disabled controls are clearly indicated and not focusable.
- Consider offering a high-contrast theme variant for low-vision users.

## Related

- [Input & Focus](../guide/input-and-focus.md) - Focus model and navigation
- [Icons](icons.md) - Visual cues that work in plain terminals
- [Theme](theme.md) - Global color decisions
