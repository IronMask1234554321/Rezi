import { assert, describe, test } from "@rezi-ui/testkit";
import { createDrawlistBuilderV1, createDrawlistBuilderV2 } from "../../index.js";

function u32(bytes: Uint8Array, off: number): number {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return dv.getUint32(off, true);
}

function textRunAttrs(bytes: Uint8Array, segmentIndex: number): number {
  const blobsBytesOffset = u32(bytes, 52);
  return u32(bytes, blobsBytesOffset + 4 + segmentIndex * 28 + 8);
}

function firstCommandOffset(bytes: Uint8Array): number {
  return u32(bytes, 16);
}

function drawTextAttrs(bytes: Uint8Array): number {
  return u32(bytes, firstCommandOffset(bytes) + 36);
}

describe("drawlist style attrs encode text decorations", () => {
  test("v1 drawText encodes strikethrough as bit 5", () => {
    const b = createDrawlistBuilderV1();
    b.drawText(0, 0, "strike", { strikethrough: true });
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(drawTextAttrs(res.bytes), 1 << 5);
  });

  test("v2 drawText encodes strikethrough as bit 5", () => {
    const b = createDrawlistBuilderV2();
    b.drawText(0, 0, "strike", { strikethrough: true });
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(drawTextAttrs(res.bytes), 1 << 5);
  });

  test("v1 drawText encodes overline as bit 6", () => {
    const b = createDrawlistBuilderV1();
    b.drawText(0, 0, "over", { overline: true });
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(drawTextAttrs(res.bytes), 1 << 6);
  });

  test("v2 drawText encodes overline as bit 6", () => {
    const b = createDrawlistBuilderV2();
    b.drawText(0, 0, "over", { overline: true });
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(drawTextAttrs(res.bytes), 1 << 6);
  });

  test("v1 drawText encodes blink as bit 7", () => {
    const b = createDrawlistBuilderV1();
    b.drawText(0, 0, "blink", { blink: true });
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(drawTextAttrs(res.bytes), 1 << 7);
  });

  test("v2 drawText encodes blink as bit 7", () => {
    const b = createDrawlistBuilderV2();
    b.drawText(0, 0, "blink", { blink: true });
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(drawTextAttrs(res.bytes), 1 << 7);
  });

  test("v1 text-run attrs keep existing bits and add strikethrough at bit 5", () => {
    const b = createDrawlistBuilderV1();
    const blobIndex = b.addTextRunBlob([
      { text: "strike", style: { strikethrough: true } },
      { text: "base", style: { bold: true, italic: true, underline: true, inverse: true, dim: true } },
    ]);
    assert.equal(blobIndex, 0);
    if (blobIndex === null) return;

    b.drawTextRun(0, 0, blobIndex);
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(textRunAttrs(res.bytes, 0), 1 << 5);
    assert.equal(textRunAttrs(res.bytes, 1), (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4));
  });

  test("v2 text-run attrs keep existing bits and add strikethrough at bit 5", () => {
    const b = createDrawlistBuilderV2();
    const blobIndex = b.addTextRunBlob([
      { text: "strike", style: { strikethrough: true } },
      { text: "base", style: { bold: true, italic: true, underline: true, inverse: true, dim: true } },
    ]);
    assert.equal(blobIndex, 0);
    if (blobIndex === null) return;

    b.drawTextRun(0, 0, blobIndex);
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(textRunAttrs(res.bytes, 0), 1 << 5);
    assert.equal(textRunAttrs(res.bytes, 1), (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4));
  });

  test("v1 text-run attrs keep existing bits and add overline at bit 6", () => {
    const b = createDrawlistBuilderV1();
    const blobIndex = b.addTextRunBlob([
      { text: "over", style: { overline: true } },
      { text: "base", style: { bold: true, italic: true, underline: true, inverse: true, dim: true } },
    ]);
    assert.equal(blobIndex, 0);
    if (blobIndex === null) return;

    b.drawTextRun(0, 0, blobIndex);
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(textRunAttrs(res.bytes, 0), 1 << 6);
    assert.equal(textRunAttrs(res.bytes, 1), (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4));
  });

  test("v2 text-run attrs keep existing bits and add overline at bit 6", () => {
    const b = createDrawlistBuilderV2();
    const blobIndex = b.addTextRunBlob([
      { text: "over", style: { overline: true } },
      { text: "base", style: { bold: true, italic: true, underline: true, inverse: true, dim: true } },
    ]);
    assert.equal(blobIndex, 0);
    if (blobIndex === null) return;

    b.drawTextRun(0, 0, blobIndex);
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(textRunAttrs(res.bytes, 0), 1 << 6);
    assert.equal(textRunAttrs(res.bytes, 1), (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4));
  });

  test("v1 text-run attrs keep existing bits and add blink at bit 7", () => {
    const b = createDrawlistBuilderV1();
    const blobIndex = b.addTextRunBlob([
      { text: "blink", style: { blink: true } },
      {
        text: "base",
        style: {
          bold: true,
          italic: true,
          underline: true,
          inverse: true,
          dim: true,
          strikethrough: true,
          overline: true,
        },
      },
    ]);
    assert.equal(blobIndex, 0);
    if (blobIndex === null) return;

    b.drawTextRun(0, 0, blobIndex);
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(textRunAttrs(res.bytes, 0), 1 << 7);
    assert.equal(
      textRunAttrs(res.bytes, 1),
      (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6),
    );
  });

  test("v2 text-run attrs keep existing bits and add blink at bit 7", () => {
    const b = createDrawlistBuilderV2();
    const blobIndex = b.addTextRunBlob([
      { text: "blink", style: { blink: true } },
      {
        text: "base",
        style: {
          bold: true,
          italic: true,
          underline: true,
          inverse: true,
          dim: true,
          strikethrough: true,
          overline: true,
        },
      },
    ]);
    assert.equal(blobIndex, 0);
    if (blobIndex === null) return;

    b.drawTextRun(0, 0, blobIndex);
    const res = b.build();
    assert.equal(res.ok, true);
    if (!res.ok) return;

    assert.equal(textRunAttrs(res.bytes, 0), 1 << 7);
    assert.equal(
      textRunAttrs(res.bytes, 1),
      (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3) | (1 << 4) | (1 << 5) | (1 << 6),
    );
  });
});
