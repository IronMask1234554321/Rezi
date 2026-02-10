import { assert, test } from "@rezi-ui/testkit";
import { createApp } from "../createApp.js";
import { flushMicrotasks } from "./helpers.js";
import { StubBackend } from "./stubBackend.js";

test("frame coalescing is single in-flight + latest-wins (#62)", async () => {
  const backend = new StubBackend();
  const app = createApp({ backend, initialState: 0 });

  let shadow = 0;
  const drawn: number[] = [];

  app.draw((g) => {
    drawn.push(shadow);
    g.clear();
  });

  await app.start();
  await flushMicrotasks(3);
  assert.equal(backend.requestedFrames.length, 1);
  assert.deepEqual(drawn, [0]);

  app.update((prev) => {
    shadow = prev + 1;
    return shadow;
  });
  app.update((prev) => {
    shadow = prev + 1;
    return shadow;
  });

  await flushMicrotasks(3);
  assert.equal(backend.requestedFrames.length, 1);

  backend.resolveNextFrame();
  await flushMicrotasks(5);

  assert.equal(backend.requestedFrames.length, 2);
  assert.deepEqual(drawn, [0, 2]);
});
