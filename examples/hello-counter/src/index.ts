import { createApp, rgb, ui } from "@rezi-ui/core";
import { createNodeBackend } from "@rezi-ui/node";

type State = { count: number };

const app = createApp<State>({
  backend: createNodeBackend(),
  initialState: { count: 0 },
});

app.view((state) =>
  ui.column({ p: 1, gap: 1 }, [
    ui.text("Title", { fg: rgb(120, 200, 255), bold: true }),
    ui.box({ title: "Panel" }, [
      ui.row({ gap: 2 }, [
        ui.text(`Count: ${state.count}`),
        ui.button({
          id: "inc",
          label: "+1",
          onPress: () => app.update((s) => ({ ...s, count: s.count + 1 })),
        }),
      ]),
    ]),
  ]),
);

await app.start();
