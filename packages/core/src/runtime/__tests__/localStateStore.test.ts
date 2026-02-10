import { assert, test } from "@rezi-ui/testkit";
import { createRuntimeLocalStateStore } from "../localState.js";

test("runtime-local state store set/get/delete keyed by instanceId (#66)", () => {
  const store = createRuntimeLocalStateStore();

  assert.equal(store.get(1), undefined);

  store.set(1, { hover: true });
  assert.deepEqual(store.get(1), {
    layout: null,
    hover: true,
    pressed: false,
    focusable: false,
    tabIndex: null,
  });

  store.set(1, { pressed: true, layout: { x: 1, y: 2, w: 3, h: 4 } });
  assert.deepEqual(store.get(1), {
    layout: { x: 1, y: 2, w: 3, h: 4 },
    hover: true,
    pressed: true,
    focusable: false,
    tabIndex: null,
  });

  store.delete(1);
  assert.equal(store.get(1), undefined);
});
