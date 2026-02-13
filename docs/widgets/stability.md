# Widget Stability

Rezi uses stability tiers so teams can choose widgets with clear behavior guarantees.

## Tiers

- `stable`: behavior contract and deterministic tests exist; semver guarantees apply to the documented stable surface.
- `beta`: usable and tested for core invariants, but parts of the contract can still evolve.
- `experimental`: no compatibility guarantees; behavior and APIs can change quickly.

## Stable Guarantees

When a widget is marked `stable`, Rezi guarantees:

- deterministic behavior for documented keyboard, pointer, and editing contracts
- deterministic regression tests that pin those contracts in `packages/core/src/**/__tests__`
- no breaking changes to documented stable behavior in minor or patch releases
- any required stable-surface behavior change is treated as semver-major

## Daily Driver Status

These widgets are the EPIC-04 hardening targets and are currently `stable`.

| Widget | Tier | Contract coverage |
|--------|------|-------------------|
| [Input](input.md) | `stable` | Cursor/edit/paste/focus-capture contract tests in `packages/core/src/runtime/__tests__/inputEditor.contract.test.ts` |
| [Table](table.md) | `stable` | Selection/column-width/viewport/row-key tests in `packages/core/src/widgets/__tests__/table.golden.test.ts` and `packages/core/src/app/__tests__/table.renderCache.test.ts` |
| [Virtual List](virtual-list.md) | `stable` | Visible-range/overscan/scroll-clamp/navigation tests in `packages/core/src/widgets/__tests__/virtualList.contract.test.ts` |
| [Command Palette](command-palette.md) | `stable` | Async fetch ordering/stale-cancel/query/nav/escape tests in `packages/core/src/app/__tests__/commandPaletteRouting.test.ts` and `packages/core/src/widgets/__tests__/commandPalette.test.ts` |
| [File Picker](file-picker.md) | `stable` | Expand/collapse/selection/open/toggle contracts in `packages/core/src/app/__tests__/filePickerRouting.contracts.test.ts` |
| [File Tree Explorer](file-tree-explorer.md) | `stable` | Focus/activation/toggle/context-menu contracts in `packages/core/src/app/__tests__/fileTreeExplorer.contextMenu.test.ts` |
