import type { ZrevEvent } from "../../events.js";
import type { LayerRoutingCtx, LayerRoutingResult } from "./types.js";

/* --- Key Codes (locked by engine ABI) --- */
/* MUST match packages/core/src/keybindings/keyCodes.ts */
const ZR_KEY_ESCAPE = 1;

/**
 * Route ESC key to close topmost layer.
 *
 * @param event - The ZREV event
 * @param ctx - Layer routing context
 * @returns Routing result
 */
export function routeLayerEscape(event: ZrevEvent, ctx: LayerRoutingCtx): LayerRoutingResult {
  if (event.kind !== "key") return Object.freeze({ consumed: false });
  if (event.action !== "down") return Object.freeze({ consumed: false });
  if (event.key !== ZR_KEY_ESCAPE) return Object.freeze({ consumed: false });

  const { layerStack, closeOnEscape, onClose } = ctx;

  // Find topmost layer that supports close-on-escape
  for (let i = layerStack.length - 1; i >= 0; i--) {
    const layerId = layerStack[i];
    if (!layerId) continue;

    const canClose = closeOnEscape.get(layerId) ?? true;
    if (canClose) {
      const closeCallback = onClose.get(layerId);
      // A layer without an onClose callback can't actually close, so don't
      // consume ESC and allow lower layers/widgets to handle it.
      if (!closeCallback) continue;

      try {
        closeCallback();
      } catch {
        // Swallow errors from close callbacks
      }

      return Object.freeze({
        closedLayerId: layerId,
        consumed: true,
      });
    }
  }

  return Object.freeze({ consumed: false });
}
