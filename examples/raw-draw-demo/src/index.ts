import { createApp } from "@rezi-ui/core";
import { createNodeBackend } from "@rezi-ui/node";

const app = createApp({
  backend: createNodeBackend(),
  initialState: null as null,
});

app.draw((g) => {
  g.clear();
  g.fillRect(0, 0, 40, 10);
  g.drawText(2, 2, "Hello from raw draw!");
});

await app.start();
