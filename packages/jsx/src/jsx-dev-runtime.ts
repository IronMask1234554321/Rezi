import type { VNode } from "@rezi-ui/core";
import { Fragment } from "./components.js";
import { createElement } from "./createElement.js";
import type {
  JsxElement,
  JsxElementType,
  ReziElementChildrenAttribute,
  ReziIntrinsicAttributes,
  ReziIntrinsicElements,
} from "./types.js";

export function jsxDEV(
  type: JsxElementType,
  props: Readonly<Record<string, unknown>> | null,
  key: string | undefined,
  _isStaticChildren: boolean,
  _source: unknown,
  _self: unknown,
): VNode {
  return createElement(type, props, key);
}

export { Fragment };

export namespace JSX {
  export type Element = JsxElement;
  export type ElementType = JsxElementType;
  export interface ElementChildrenAttribute extends ReziElementChildrenAttribute {}
  export interface IntrinsicAttributes extends ReziIntrinsicAttributes {}
  export interface IntrinsicElements extends ReziIntrinsicElements {}
}
