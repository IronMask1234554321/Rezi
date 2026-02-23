import type { DrawlistBuilderV1 } from "../../../drawlist/types.js";
import type { LayoutTree } from "../../../layout/layout.js";
import type { Rect } from "../../../layout/types.js";
import type { RuntimeInstance } from "../../../runtime/commit.js";
import type { Theme } from "../../../theme/theme.js";
import type { WidgetSize, WidgetTone, WidgetVariant } from "../../../ui/designTokens.js";
import {
  accordionRecipe,
  breadcrumbRecipe,
  paginationRecipe,
  tabsRecipe,
} from "../../../ui/recipes.js";
import { getAccordionHeadersZoneId } from "../../../widgets/accordion.js";
import { getBreadcrumbZoneId } from "../../../widgets/breadcrumb.js";
import { getPaginationZoneId } from "../../../widgets/pagination.js";
import { getTabsBarZoneId } from "../../../widgets/tabs.js";
import { isVisibleRect } from "../indices.js";
import { mergeTextStyle } from "../textStyle.js";
import type { ResolvedTextStyle } from "../textStyle.js";
import {
  getColorTokens,
  readWidgetSize,
  readWidgetTone,
  readWidgetVariant,
} from "../themeTokens.js";

type ClipRect = Readonly<Rect>;

type NavigationDsProps = Readonly<{
  variant?: WidgetVariant;
  tone?: WidgetTone;
  size?: WidgetSize;
}>;

function readString(raw: unknown): string | undefined {
  return typeof raw === "string" ? raw : undefined;
}

function readNavigationDsProps(raw: unknown): NavigationDsProps {
  if (typeof raw !== "object" || raw === null) return {};
  const props = raw as {
    dsVariant?: unknown;
    dsTone?: unknown;
    dsSize?: unknown;
  };
  const variant = readWidgetVariant(props.dsVariant);
  const tone = readWidgetTone(props.dsTone);
  const size = readWidgetSize(props.dsSize);
  return {
    ...(variant !== undefined ? { variant } : {}),
    ...(tone !== undefined ? { tone } : {}),
    ...(size !== undefined ? { size } : {}),
  };
}

function hasNavigationDsProps(dsProps: NavigationDsProps): boolean {
  return dsProps.variant !== undefined || dsProps.tone !== undefined || dsProps.size !== undefined;
}

function findChildById(
  children: readonly RuntimeInstance[],
  expectedId: string,
): RuntimeInstance | undefined {
  for (const child of children) {
    if (!child) continue;
    const childId = readString((child.vnode.props as { id?: unknown } | undefined)?.id);
    if (childId === expectedId) return child;
  }
  return undefined;
}

function applyDsPropsToButtons(node: RuntimeInstance, dsProps: NavigationDsProps): void {
  if (node.vnode.kind === "button") {
    const props = node.vnode.props as {
      dsVariant?: unknown;
      dsTone?: unknown;
      dsSize?: unknown;
    };
    if (dsProps.variant !== undefined) {
      (props as { dsVariant?: unknown }).dsVariant = dsProps.variant;
    }
    if (dsProps.tone !== undefined) {
      (props as { dsTone?: unknown }).dsTone = dsProps.tone;
    }
    if (dsProps.size !== undefined) {
      (props as { dsSize?: unknown }).dsSize = dsProps.size;
    }
  }
  for (const child of node.children) {
    if (!child) continue;
    applyDsPropsToButtons(child, dsProps);
  }
}

function applyNavigationDsToControlButtons(node: RuntimeInstance): void {
  const dsProps = readNavigationDsProps(node.vnode.props);
  if (!hasNavigationDsProps(dsProps)) return;

  const id = readString((node.vnode.props as { id?: unknown }).id);
  if (id === undefined) return;

  switch (node.vnode.kind) {
    case "tabs": {
      const barZone = findChildById(node.children, getTabsBarZoneId(id));
      if (barZone) applyDsPropsToButtons(barZone, dsProps);
      break;
    }
    case "accordion": {
      const headersZone = findChildById(node.children, getAccordionHeadersZoneId(id));
      if (headersZone) applyDsPropsToButtons(headersZone, dsProps);
      break;
    }
    case "breadcrumb": {
      const breadcrumbZone = findChildById(node.children, getBreadcrumbZoneId(id));
      if (breadcrumbZone) applyDsPropsToButtons(breadcrumbZone, dsProps);
      break;
    }
    case "pagination": {
      const paginationZone = findChildById(node.children, getPaginationZoneId(id));
      if (paginationZone) applyDsPropsToButtons(paginationZone, dsProps);
      break;
    }
    default:
      break;
  }
}

export function renderNavigationWidget(
  builder: DrawlistBuilderV1,
  rect: Rect,
  theme: Theme,
  parentStyle: ResolvedTextStyle,
  node: RuntimeInstance,
  layoutNode: LayoutTree,
  nodeStack: (RuntimeInstance | null)[],
  styleStack: ResolvedTextStyle[],
  layoutStack: LayoutTree[],
  clipStack: (ClipRect | undefined)[],
  currentClip: ClipRect | undefined,
): void {
  if (!isVisibleRect(rect)) return;
  applyNavigationDsToControlButtons(node);
  const dsProps = readNavigationDsProps(node.vnode.props);
  let resolvedParentStyle = parentStyle;
  const colorTokens = getColorTokens(theme);
  if (colorTokens !== null) {
    switch (node.vnode.kind) {
      case "tabs": {
        const styles = tabsRecipe(colorTokens, {
          variant: dsProps.variant ?? "soft",
          tone: dsProps.tone ?? "primary",
          size: dsProps.size ?? "md",
          state: "default",
        });
        if (styles.bg.bg !== undefined) {
          builder.fillRect(rect.x, rect.y, rect.w, rect.h, { bg: styles.bg.bg });
        }
        resolvedParentStyle = mergeTextStyle(resolvedParentStyle, styles.item);
        break;
      }
      case "accordion": {
        const styles = accordionRecipe(colorTokens, {
          variant: dsProps.variant ?? "soft",
          tone: dsProps.tone ?? "default",
          size: dsProps.size ?? "md",
          state: "default",
        });
        if (styles.bg.bg !== undefined) {
          builder.fillRect(rect.x, rect.y, rect.w, rect.h, { bg: styles.bg.bg });
        }
        resolvedParentStyle = mergeTextStyle(resolvedParentStyle, styles.header);
        break;
      }
      case "breadcrumb": {
        const styles = breadcrumbRecipe(colorTokens, {
          variant: dsProps.variant ?? "ghost",
          tone: dsProps.tone ?? "primary",
          size: dsProps.size ?? "md",
          state: "default",
        });
        if (styles.bg.bg !== undefined) {
          builder.fillRect(rect.x, rect.y, rect.w, rect.h, { bg: styles.bg.bg });
        }
        resolvedParentStyle = mergeTextStyle(resolvedParentStyle, styles.item);
        break;
      }
      case "pagination": {
        const styles = paginationRecipe(colorTokens, {
          variant: dsProps.variant ?? "soft",
          tone: dsProps.tone ?? "primary",
          size: dsProps.size ?? "md",
          state: "default",
        });
        if (styles.bg.bg !== undefined) {
          builder.fillRect(rect.x, rect.y, rect.w, rect.h, { bg: styles.bg.bg });
        }
        resolvedParentStyle = mergeTextStyle(resolvedParentStyle, styles.control);
        break;
      }
      default:
        break;
    }
  }

  const childCount = Math.min(node.children.length, layoutNode.children.length);
  for (let i = childCount - 1; i >= 0; i--) {
    const child = node.children[i];
    const childLayout = layoutNode.children[i];
    if (!child || !childLayout) continue;
    nodeStack.push(child);
    styleStack.push(resolvedParentStyle);
    layoutStack.push(childLayout);
    clipStack.push(currentClip);
  }
}
