# Mouse Support

Rezi has built-in mouse support. When the terminal supports mouse tracking, Rezi automatically enables it — clicks focus and activate widgets, the scroll wheel navigates lists and editors, and split pane dividers can be dragged to resize.

No configuration is required. Mouse support is detected at startup and works alongside keyboard navigation.

## Terminal Detection

The Zireael engine detects mouse support at startup through `terminalCaps.supportsMouse`. Most modern terminals support mouse tracking:

- **Supported:** iTerm2, Alacritty, kitty, WezTerm, Windows Terminal, GNOME Terminal, Konsole, tmux, VS Code integrated terminal
- **Not supported:** Some legacy terminals and bare `xterm` configurations

If the terminal doesn't support mouse tracking, Rezi falls back to keyboard-only navigation. Your app works either way — no conditional code needed.

## What Works with Mouse

### Clicking to Focus and Activate

Clicking any focusable widget (button, input, select, checkbox, etc.) moves focus to it. Clicking a button also activates it, just like pressing Enter or Space:

```typescript
ui.button({
  id: "save",
  label: "Save",
  onPress: () => save(), // Fires on click or Enter/Space
})
```

The click model uses press-and-release: mouse down captures the target, mouse up on the same target triggers the action. If the user drags away before releasing, no action fires. This matches how buttons work on the web and in native UIs.

### Scroll Wheel

The mouse wheel scrolls any scrollable widget that is focused or under the cursor:

| Widget | Scroll Behavior |
|--------|----------------|
| [VirtualList](../widgets/virtual-list.md) | Scrolls items (3 lines per tick) |
| [CodeEditor](../widgets/code-editor.md) | Scrolls vertically and horizontally |
| [LogsConsole](../widgets/logs-console.md) | Scrolls log entries |
| [DiffViewer](../widgets/diff-viewer.md) | Scrolls diff content |
| [Table](../widgets/table.md) | Scrolls rows (when virtualized) |

Scroll callbacks (`onScroll`) fire for both keyboard navigation and mouse wheel input.

### Dragging Split Pane Dividers

[SplitPane](../widgets/split-pane.md) dividers can be dragged with the mouse to resize panels:

```typescript
ui.splitPane(
  {
    id: "main",
    direction: "horizontal",
    sizes: state.sizes,
    onResize: (sizes) => app.update((s) => ({ ...s, sizes })),
  },
  [Sidebar(), Editor()]
)
```

Mouse down on the divider starts the drag. Moving the mouse updates panel sizes in real-time. Releasing the mouse ends the drag.

### Clicking Modal Backdrops

Modals with `closeOnBackdrop: true` (the default) close when the user clicks the backdrop area:

```typescript
ui.modal({
  id: "confirm",
  title: "Are you sure?",
  content: ui.text("This will delete the item."),
  closeOnBackdrop: true, // Default — click backdrop to close
  onClose: () => app.update((s) => ({ ...s, showModal: false })),
  actions: [
    ui.button({ id: "yes", label: "Yes" }),
    ui.button({ id: "no", label: "No" }),
  ],
})
```

When a modal layer blocks input, mouse events to widgets below the modal are blocked entirely.

### Toast Action Buttons

[Toast](../widgets/toast.md) notifications with action buttons can be clicked:

```typescript
app.update((s) => ({
  ...s,
  toasts: [...s.toasts, {
    id: "saved",
    message: "File saved",
    type: "success",
    action: { label: "Undo", onAction: () => undoSave() }, // Clickable
  }],
}));
```

## How Mouse Routing Works

Mouse events flow through a deterministic pipeline:

```
Terminal mouse input
    |
    v
Zireael engine (detects & encodes mouse events)
    |
    v
ZREV event batch (binary protocol)
    |
    v
Hit testing — which widget is under (x, y)?
    |
    v
Layer check — is a modal blocking input?
    |
    v
Mouse router — focus, press/release, scroll, drag
    |
    v
Widget callbacks (onPress, onScroll, onResize, etc.)
```

### Hit Testing

When a mouse event arrives, Rezi performs a depth-first traversal of the widget tree to find which focusable widget contains the cursor position. If multiple widgets overlap, the last one in document order (topmost) wins.

Disabled widgets are excluded from hit testing — they cannot receive mouse events.

### Press and Release

Mouse routing uses a simple state machine:

1. **Mouse down** on a focusable widget: focus moves to that widget and it becomes the "pressed" target
2. **Mouse up** on the same widget: the press action fires (e.g., `onPress` callback)
3. **Mouse up** on a different widget: the press is cancelled, no action fires

This ensures accidental clicks don't trigger actions when the user drags away from a button.

## Mouse Events in the Event System

Raw mouse events are available through `app.onEvent()`:

```typescript
app.onEvent((ev) => {
  if (ev.kind === "engine" && ev.event.kind === "mouse") {
    const { x, y, mouseKind, wheelY } = ev.event;
    // mouseKind: 1=move, 2=press, 3=release, 4=drag, 5=scroll
  }
});
```

Most applications don't need raw mouse events — widget callbacks (`onPress`, `onScroll`, etc.) handle the common cases. Raw events are useful for custom widgets or debugging.

## Keyboard + Mouse

Mouse support is additive. All keyboard navigation continues to work:

| Action | Keyboard | Mouse |
|--------|----------|-------|
| Focus a widget | Tab / Shift+Tab | Click |
| Activate a button | Enter / Space | Click |
| Scroll a list | Arrow keys / Page Up/Down | Scroll wheel |
| Resize split panes | *(not available)* | Drag divider |
| Close modal | Escape | Click backdrop |
| Navigate options | Arrow keys | Click option |

Users can freely mix keyboard and mouse input. Focus state is shared — clicking a widget updates the same focus ring that Tab navigation uses.

## Next Steps

- [Input & Focus](input-and-focus.md) — Keyboard navigation and focus management
- [Widget Catalog](../widgets/index.md) — Browse all widgets and their mouse interactions
- [Terminal Capabilities](../backend/terminal-caps.md) — How terminal features are detected
