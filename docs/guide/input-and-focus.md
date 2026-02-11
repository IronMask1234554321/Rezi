# Input & Focus

Rezi routes input deterministically through a focus system that manages keyboard and mouse navigation and event delivery. See also the dedicated [Mouse Support](mouse-support.md) guide.

## Identity: `id` vs `key`

Two identity systems serve different purposes:

| Prop | Purpose | Example |
|------|---------|---------|
| `id` | Focus management and event routing | `ui.button({ id: "save", label: "Save" })` |
| `key` | Reconciliation stability in lists | `ui.text(item.name, { key: item.id })` |

These must not be conflated:

- `id` must be unique across the committed widget tree
- `key` only needs to be unique among siblings
- Non-interactive widgets may omit `id`
- Dynamic lists should always provide `key`

## Focus Navigation

Focusable widgets (buttons, inputs, selects) participate in Tab and mouse navigation:

- **Tab** - Move focus forward
- **Shift+Tab** - Move focus backward
- **Enter/Space** - Activate focused widget
- **Arrow keys** - Navigate within widgets (lists, tables)
- **Mouse click** - Focus and activate the clicked widget

### Focus Order

Focus order follows document order (depth-first tree traversal):

```typescript
ui.column({}, [
  ui.button({ id: "first", label: "1" }),   // Tab stop 1
  ui.row({}, [
    ui.button({ id: "second", label: "2" }), // Tab stop 2
    ui.button({ id: "third", label: "3" }),  // Tab stop 3
  ]),
  ui.button({ id: "fourth", label: "4" }),  // Tab stop 4
])
```

### Focus Zones

Group related widgets with focus zones for organized Tab navigation:

```typescript
ui.column({}, [
  ui.focusZone({ id: "toolbar" }, [
    ui.button({ id: "new", label: "New" }),
    ui.button({ id: "open", label: "Open" }),
  ]),
  ui.focusZone({ id: "form" }, [
    ui.input({ id: "name", value: state.name }),
    ui.button({ id: "submit", label: "Submit" }),
  ]),
])
```

Tab moves between zones; arrow keys navigate within zones.

### Focus Traps

Constrain focus within modals and overlays:

```typescript
ui.focusTrap({ id: "modal", active: state.showModal }, [
  ui.text("Confirm action?"),
  ui.button({ id: "ok", label: "OK" }),
  ui.button({ id: "cancel", label: "Cancel" }),
])
```

## Keybindings

### Basic Keybindings

Register global keyboard shortcuts with `app.keys()`:

```typescript
app.keys({
  "ctrl+s": () => save(),
  "ctrl+q": () => app.stop(),
  "escape": () => closeModal(),
  "f1": () => showHelp(),
});
```

### Modifier Keys

Supported modifiers: `ctrl`, `alt`, `shift`, `meta`

```typescript
app.keys({
  "ctrl+s": () => save(),
  "ctrl+shift+s": () => saveAs(),
  "alt+f": () => openFileMenu(),
  "meta+q": () => quit(),  // Cmd on macOS
});
```

### Chord Sequences

Chords are key sequences pressed in succession (like Vim's `gg` or Emacs's `C-x C-s`):

```typescript
app.keys({
  "g g": () => scrollToTop(),     // Press g twice
  "g e": () => scrollToEnd(),     // Press g then e
  "ctrl+x ctrl+s": () => save(),  // Emacs-style
  "d d": () => deleteLine(),      // Vim-style
});
```

Chord timeout is 1000ms by default.

### Key Context

Key handlers receive a context object with state access:

```typescript
app.keys({
  "j": (ctx) => ctx.update((s) => ({ ...s, cursor: s.cursor + 1 })),
  "k": (ctx) => ctx.update((s) => ({ ...s, cursor: s.cursor - 1 })),
});
```

### Modal Keybinding Modes

For Vim-style modal editing, use `app.modes()`:

```typescript
app.modes({
  normal: {
    "i": () => app.setMode("insert"),
    "v": () => app.setMode("visual"),
    "j": (ctx) => ctx.update(moveCursorDown),
    "k": (ctx) => ctx.update(moveCursorUp),
    "d d": (ctx) => ctx.update(deleteLine),
    ":": () => openCommandLine(),
  },
  insert: {
    "escape": () => app.setMode("normal"),
  },
  visual: {
    "escape": () => app.setMode("normal"),
    "y": (ctx) => { yank(); app.setMode("normal"); },
    "d": (ctx) => { deleteSelection(); app.setMode("normal"); },
  },
});

// Start in normal mode
app.setMode("normal");
```

Query current mode with `app.getMode()`.

## Mouse Input

Rezi supports mouse interaction when the terminal supports mouse tracking. Mouse events are routed through the same focus system as keyboard input:

- **Click** any focusable widget to focus it. Clicking a button also activates its `onPress` callback.
- **Scroll wheel** scrolls focused or hovered scrollable widgets (VirtualList, CodeEditor, LogsConsole, DiffViewer).
- **Drag** split pane dividers to resize panels.
- **Click** a modal backdrop to close the modal (when `closeOnBackdrop` is enabled).

Mouse and keyboard input can be freely mixed. Clicking a widget updates the same focus state that Tab navigation uses.

For the complete mouse support reference, see the [Mouse Support](mouse-support.md) guide.

## Event Handling

### Widget Events

Interactive widgets receive events through callback props:

```typescript
ui.button({
  id: "submit",
  label: "Submit",
  onPress: () => handleSubmit(),
})

ui.input({
  id: "name",
  value: state.name,
  onInput: (value) => app.update((s) => ({ ...s, name: value })),
  onBlur: () => validateName(),
})

ui.select({
  id: "country",
  value: state.country,
  options: countries,
  onChange: (value) => app.update((s) => ({ ...s, country: value })),
})
```

### Global Event Handler

For centralized event handling, use `app.onEvent()`:

```typescript
const unsubscribe = app.onEvent((ev) => {
  if (ev.kind === "action") {
    console.log(`Action: ${ev.id} / ${ev.action}`);
  }
});

// Later: unsubscribe();
```

### Event Types

Rezi exposes two event layers:

**Engine Events** - Low-level events decoded from the ZREV protocol:

- Key events with modifiers and key codes
- Mouse events with position and button state
- Resize events
- Tick events for animations

**Routed UI Events** - High-level actions:

- `{ kind: "action", id: "btn", action: "press" }` - Button activation
- `{ kind: "action", id: "input", action: "input", value, cursor }` - Text input
- `{ kind: "action", id: "select", action: "change", value }` - Selection change

## Determinism

Rezi's focus and event routing is deterministic:

- Same widget tree produces the same focus order
- Same input sequence produces the same routed events
- No timing-dependent behavior in the core

This enables:

- Reproducible testing with event sequences
- Predictable user experience
- Debuggable event flows

## Next Steps

- [Mouse Support](mouse-support.md) - Click, scroll, and drag interactions
- [Styling](styling.md) - Colors, themes, and visual customization
- [Focus Zone](../widgets/focus-zone.md) - Focus zone widget reference
- [Focus Trap](../widgets/focus-trap.md) - Focus trap widget reference
