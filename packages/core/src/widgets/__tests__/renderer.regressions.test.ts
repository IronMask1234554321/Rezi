import { assert, describe, test } from "@rezi-ui/testkit";
import { type VNode, createDrawlistBuilderV1 } from "../../index.js";
import { layout } from "../../layout/layout.js";
import { renderToDrawlist } from "../../renderer/renderToDrawlist.js";
import { commitVNodeTree } from "../../runtime/commit.js";
import { createInstanceIdAllocator } from "../../runtime/instance.js";
import { ui } from "../ui.js";

function u16(bytes: Uint8Array, off: number): number {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dv.getUint16(off, true);
}

function u32(bytes: Uint8Array, off: number): number {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dv.getUint32(off, true);
}

function parseOpcodes(bytes: Uint8Array): readonly number[] {
  const cmdOffset = u32(bytes, 16);
  const cmdBytes = u32(bytes, 20);
  const end = cmdOffset + cmdBytes;

  const out: number[] = [];
  let off = cmdOffset;
  while (off < end) {
    const opcode = u16(bytes, off);
    const size = u32(bytes, off + 4);
    out.push(opcode);
    off += size;
  }
  return Object.freeze(out);
}

function parseInternedStrings(bytes: Uint8Array): readonly string[] {
  const spanOffset = u32(bytes, 28);
  const count = u32(bytes, 32);
  const bytesOffset = u32(bytes, 36);
  const bytesLen = u32(bytes, 40);

  if (count === 0) return Object.freeze([]);

  const tableEnd = bytesOffset + bytesLen;
  assert.ok(tableEnd <= bytes.byteLength, "string table in bounds");

  const decoder = new TextDecoder();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const span = spanOffset + i * 8;
    const strOff = u32(bytes, span);
    const strLen = u32(bytes, span + 4);
    const start = bytesOffset + strOff;
    const end = start + strLen;
    assert.ok(end <= tableEnd, "string span in bounds");
    out.push(decoder.decode(bytes.subarray(start, end)));
  }
  return Object.freeze(out);
}

function renderBytes(
  vnode: VNode,
  viewport: Readonly<{ cols: number; rows: number }> = { cols: 64, rows: 20 },
): Uint8Array {
  const allocator = createInstanceIdAllocator(1);
  const committed = commitVNodeTree(null, vnode, { allocator });
  assert.equal(committed.ok, true, "commit should succeed");
  if (!committed.ok) return new Uint8Array();

  const layoutRes = layout(
    committed.value.root.vnode,
    0,
    0,
    viewport.cols,
    viewport.rows,
    "column",
  );
  assert.equal(layoutRes.ok, true, "layout should succeed");
  if (!layoutRes.ok) return new Uint8Array();

  const builder = createDrawlistBuilderV1();
  renderToDrawlist({
    tree: committed.value.root,
    layout: layoutRes.value,
    viewport,
    focusState: Object.freeze({ focusedId: null }),
    builder,
  });
  const built = builder.build();
  assert.equal(built.ok, true, "drawlist should build");
  if (!built.ok) return new Uint8Array();
  return built.bytes;
}

describe("renderer regressions", () => {
  test("box shadow renders shade glyphs when enabled", () => {
    const withShadow = parseInternedStrings(
      renderBytes(
        ui.box({ width: 12, height: 4, border: "single", shadow: true }, [ui.text("x")]),
        { cols: 40, rows: 12 },
      ),
    );
    const withoutShadow = parseInternedStrings(
      renderBytes(ui.box({ width: 12, height: 4, border: "single" }, [ui.text("x")]), {
        cols: 40,
        rows: 12,
      }),
    );

    assert.equal(
      withShadow.some((s) => s.includes("▒")),
      true,
    );
    assert.equal(
      withoutShadow.some((s) => s.includes("▒")),
      false,
    );
  });

  test("table header renders sort indicator and right-aligned cells", () => {
    const bytes = renderBytes(
      ui.table({
        id: "tbl-sort",
        columns: [{ key: "size", header: "Size", width: 8, sortable: true, align: "right" }],
        data: [{ size: 7 }],
        getRowKey: (_row, index) => `row-${String(index)}`,
        sortColumn: "size",
        sortDirection: "asc",
        border: "none",
      }),
      { cols: 40, rows: 8 },
    );
    const strings = parseInternedStrings(bytes);

    assert.equal(
      strings.some((s) => s.includes("▲")),
      true,
    );
    assert.equal(strings.includes("       7"), true);
  });

  test("table stripedRows emits row background fills", () => {
    const tableProps = {
      id: "tbl-striped",
      columns: [{ key: "name", header: "Name", width: 10 }],
      data: [{ name: "A" }, { name: "B" }, { name: "C" }],
      getRowKey: (row: { name: string }) => row.name,
      border: "none",
      selectionMode: "none",
    } as const;

    const withStripedOpcodes = parseOpcodes(
      renderBytes(ui.table({ ...tableProps, stripedRows: true }), { cols: 40, rows: 8 }),
    );
    const withoutStripedOpcodes = parseOpcodes(
      renderBytes(ui.table({ ...tableProps, stripedRows: false }), { cols: 40, rows: 8 }),
    );

    const withFillCount = withStripedOpcodes.filter((op) => op === 2).length;
    const withoutFillCount = withoutStripedOpcodes.filter((op) => op === 2).length;
    assert.equal(withFillCount > withoutFillCount, true);
  });

  test("dropdown renders shortcut text", () => {
    const bytes = renderBytes(
      ui.column({}, [
        ui.button("file-trigger", "File"),
        ui.dropdown({
          id: "file-menu",
          anchorId: "file-trigger",
          items: [
            { id: "new", label: "New File", shortcut: "Ctrl+N" },
            { id: "open", label: "Open", shortcut: "Ctrl+O" },
          ],
        }),
      ]),
      { cols: 60, rows: 20 },
    );
    const strings = parseInternedStrings(bytes);
    assert.equal(strings.includes("Ctrl+N"), true);
    assert.equal(strings.includes("Ctrl+O"), true);
  });
});
