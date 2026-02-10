# Release Demo

Two polished showcase scenes for release assets.

## Scenarios

1. `scenario1-screenshot.ts`
- Static hero shot for README / social preview images
- Large, high-contrast REZI logo
- Premium code-card layout + feature metrics

2. `scenario2-gif.ts`
- Animated release pipeline scene (GIF-ready)
- Persistent REZI logo with subtle shimmer
- Live telemetry, status grid, charts, and progress flow

## Run

From repo root:

```bash
npm run demo:screenshot
npm run demo:gif
```

Or directly via workspace:

```bash
npm -w release-demo run screenshot
npm -w release-demo run gif
```

## Capture Settings (GitHub)

For best visual quality in screenshots and GIFs:

- Terminal size: `140x42` (or close)
- Font size: `15-17`
- Theme: dark background with high contrast
- Keep margins tight around the app frame

### Screenshot

Use your terminal's native screenshot tool after running:

```bash
npm run demo:screenshot
```

### GIF

If you have `asciinema` and `agg` installed:

```bash
asciinema rec -c "npm run demo:gif" rezi-demo.cast
agg rezi-demo.cast rezi-demo.gif
```

Tip: trim the first second and the final second so the loop starts/ends on stable frames.
