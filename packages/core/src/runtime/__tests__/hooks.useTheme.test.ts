import { assert, describe, test } from "@rezi-ui/testkit";
import { extendTheme } from "../../theme/extend.js";
import { getColorTokens } from "../../theme/extract.js";
import { coerceToLegacyTheme } from "../../theme/interop.js";
import { darkTheme } from "../../theme/presets.js";
import type { ColorTokens } from "../../theme/tokens.js";
import { defineWidget } from "../../widgets/composition.js";
import type { VNode } from "../../widgets/types.js";
import { ui } from "../../widgets/ui.js";
import { type CommitOk, type RuntimeInstance, commitVNodeTree } from "../commit.js";
import { createInstanceIdAllocator } from "../instance.js";
import { createCompositeInstanceRegistry } from "../instances.js";

type CompositeHarness<State> = Readonly<{
  commit: (vnode: VNode, appState: State, colorTokens?: ColorTokens | null) => CommitOk;
}>;

function createCompositeHarness<State>(): CompositeHarness<State> {
  const allocator = createInstanceIdAllocator(1);
  const registry = createCompositeInstanceRegistry();
  let prevRoot: RuntimeInstance | null = null;

  return Object.freeze({
    commit: (vnode: VNode, appState: State, colorTokens: ColorTokens | null = null): CommitOk => {
      const res = commitVNodeTree(prevRoot, vnode, {
        allocator,
        composite: {
          registry,
          appState,
          colorTokens,
          viewport: { width: 80, height: 24, breakpoint: "md" },
          onInvalidate: () => {},
        },
      });

      if (!res.ok) {
        throw new Error(`commit failed: ${res.fatal.code}: ${res.fatal.detail}`);
      }

      prevRoot = res.value.root;
      return res.value;
    },
  });
}

function requireColorTokens(tokens: ColorTokens | null): ColorTokens {
  if (!tokens) {
    throw new Error("expected semantic color tokens");
  }
  return tokens;
}

describe("runtime hooks - useTheme", () => {
  test("provides composite color tokens from commit context", () => {
    const tokens = requireColorTokens(getColorTokens(coerceToLegacyTheme(darkTheme)));
    let seenTokens: ColorTokens | null | undefined;

    const Widget = defineWidget<{ key?: string }, Record<string, never>>((_props, ctx) => {
      seenTokens = ctx.useTheme();
      return ui.text("ok");
    });

    const h = createCompositeHarness<Record<string, never>>();
    h.commit(Widget({}), Object.freeze({}), tokens);

    assert.equal(seenTokens, tokens);
  });

  test("returns null when semantic color tokens are unavailable", () => {
    let seenTokens: ColorTokens | null | undefined = undefined;

    const Widget = defineWidget<{ key?: string }, Record<string, never>>((_props, ctx) => {
      seenTokens = ctx.useTheme();
      return ui.text("ok");
    });

    const h = createCompositeHarness<Record<string, never>>();
    h.commit(Widget({}), Object.freeze({}));

    assert.equal(seenTokens, null);
  });

  test("reads latest tokens on rerender", () => {
    const firstTokens = requireColorTokens(getColorTokens(coerceToLegacyTheme(darkTheme)));
    const secondTokens = requireColorTokens(
      getColorTokens(
        coerceToLegacyTheme(
          extendTheme(darkTheme, {
            colors: {
              accent: {
                primary: { r: 250, g: 20, b: 20 },
              },
            },
          }),
        ),
      ),
    );

    const seen: Array<ColorTokens | null | undefined> = [];

    const Widget = defineWidget<{ key?: string }, Readonly<{ count: number }>>((_props, ctx) => {
      ctx.useAppState((state) => state.count);
      seen.push(ctx.useTheme());
      return ui.text("ok");
    });

    const h = createCompositeHarness<Readonly<{ count: number }>>();
    h.commit(Widget({}), Object.freeze({ count: 1 }), firstTokens);
    h.commit(Widget({}), Object.freeze({ count: 2 }), secondTokens);

    assert.equal(seen.length, 2);
    assert.equal(seen[0], firstTokens);
    assert.equal(seen[1], secondTokens);
  });
});
