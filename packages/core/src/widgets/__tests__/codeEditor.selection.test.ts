import { assert, describe, test } from "@rezi-ui/testkit";
import {
  deleteRange,
  getSelectedText,
  insertText,
  moveCursor,
  moveCursorByWord,
  normalizeSelection,
} from "../codeEditor.js";
import type { CursorPosition, EditorSelection } from "../types.js";

function pos(line: number, column: number): CursorPosition {
  return { line, column };
}

function selection(anchor: CursorPosition, active: CursorPosition): EditorSelection {
  return { anchor, active };
}

function extendSelectionByCursor(
  lines: readonly string[],
  current: EditorSelection | null,
  cursor: CursorPosition,
  direction: "left" | "right" | "up" | "down",
): EditorSelection {
  const active = moveCursor(lines, cursor, direction);
  return current
    ? { anchor: current.anchor, active }
    : {
        anchor: cursor,
        active,
      };
}

function extendSelectionByWord(
  lines: readonly string[],
  current: EditorSelection | null,
  cursor: CursorPosition,
  direction: "left" | "right",
): EditorSelection {
  const active = moveCursorByWord(lines, cursor, direction);
  return current
    ? { anchor: current.anchor, active }
    : {
        anchor: cursor,
        active,
      };
}

describe("codeEditor.selection - normalize and extraction", () => {
  test("normalizeSelection preserves forward ranges", () => {
    const normalized = normalizeSelection(selection(pos(0, 1), pos(1, 2)));
    assert.deepEqual(normalized, [pos(0, 1), pos(1, 2)]);
  });

  test("normalizeSelection swaps reversed ranges", () => {
    const normalized = normalizeSelection(selection(pos(2, 5), pos(1, 1)));
    assert.deepEqual(normalized, [pos(1, 1), pos(2, 5)]);
  });

  const selectedTextCases = [
    {
      name: "single-line selection",
      lines: ["abcdef"],
      range: selection(pos(0, 1), pos(0, 4)),
      expected: "bcd",
    },
    {
      name: "multi-line selection includes middle lines",
      lines: ["abc", "def", "ghi"],
      range: selection(pos(0, 1), pos(2, 2)),
      expected: "bc\ndef\ngh",
    },
    {
      name: "selection across empty middle line",
      lines: ["ab", "", "cd"],
      range: selection(pos(0, 1), pos(2, 1)),
      expected: "b\n\nc",
    },
    {
      name: "reversed range still extracts same text",
      lines: ["abc", "def"],
      range: selection(pos(1, 2), pos(0, 1)),
      expected: "bc\nde",
    },
  ] as const;

  for (const c of selectedTextCases) {
    test(`getSelectedText ${c.name}`, () => {
      assert.equal(getSelectedText(c.lines, c.range), c.expected);
    });
  }
});

describe("codeEditor.selection - keyboard extension semantics", () => {
  test("Shift+Right starts a selection from cursor", () => {
    const lines = ["abcd"];
    const start = pos(0, 1);
    const s = extendSelectionByCursor(lines, null, start, "right");
    assert.deepEqual(s.anchor, pos(0, 1));
    assert.deepEqual(s.active, pos(0, 2));
  });

  test("Shift+Left extends existing selection to the left", () => {
    const lines = ["abcd"];
    const s0 = selection(pos(0, 3), pos(0, 3));
    const s1 = extendSelectionByCursor(lines, s0, s0.active, "left");
    const s2 = extendSelectionByCursor(lines, s1, s1.active, "left");
    assert.deepEqual(normalizeSelection(s2), [pos(0, 1), pos(0, 3)]);
  });

  test("Shift+Down extends to next line clamping column", () => {
    const lines = ["abcdef", "xy"];
    const s = extendSelectionByCursor(lines, null, pos(0, 5), "down");
    assert.deepEqual(s.active, pos(1, 2));
  });

  test("Shift+Up extends to previous line clamping column", () => {
    const lines = ["x", "abcdef"];
    const s = extendSelectionByCursor(lines, null, pos(1, 5), "up");
    assert.deepEqual(s.active, pos(0, 1));
  });

  test("Ctrl+Shift+Right moves by word boundary", () => {
    const lines = ["foo   bar baz"];
    const s = extendSelectionByWord(lines, null, pos(0, 0), "right");
    assert.deepEqual(s.active, pos(0, 6));
  });

  test("Ctrl+Shift+Left moves by previous word boundary", () => {
    const lines = ["foo   bar baz"];
    const s = extendSelectionByWord(lines, null, pos(0, 10), "left");
    assert.deepEqual(s.active, pos(0, 6));
  });

  test("select-all covers full document", () => {
    const lines = ["ab", "cd", "efg"];
    const all = selection(pos(0, 0), pos(2, 3));
    assert.equal(getSelectedText(lines, all), "ab\ncd\nefg");
  });
});

describe("codeEditor.selection - copy/cut/paste with ranges", () => {
  test("copy returns exact selected text", () => {
    const lines = ["alpha beta gamma"];
    const range = selection(pos(0, 6), pos(0, 10));
    assert.equal(getSelectedText(lines, range), "beta");
  });

  test("cut removes selected text and positions cursor at range start", () => {
    const lines = ["alpha beta gamma"];
    const range = selection(pos(0, 6), pos(0, 10));
    const cut = deleteRange(lines, range);
    assert.deepEqual(cut.lines, ["alpha  gamma"]);
    assert.deepEqual(cut.cursor, pos(0, 6));
  });

  test("paste inserts clipboard text at cursor", () => {
    const lines = ["alpha gamma"];
    const pasted = insertText(lines, pos(0, 6), "beta ");
    assert.deepEqual(pasted.lines, ["alpha beta gamma"]);
  });

  test("paste replaces selected range (delete then insert)", () => {
    const lines = ["alpha beta gamma"];
    const range = selection(pos(0, 6), pos(0, 10));
    const afterDelete = deleteRange(lines, range);
    const afterPaste = insertText(afterDelete.lines, afterDelete.cursor, "DELTA");
    assert.deepEqual(afterPaste.lines, ["alpha DELTA gamma"]);
  });

  test("paste multiline content into middle of selection", () => {
    const lines = ["abXXcd"];
    const range = selection(pos(0, 2), pos(0, 4));
    const afterDelete = deleteRange(lines, range);
    const afterPaste = insertText(afterDelete.lines, afterDelete.cursor, "1\n2");
    assert.deepEqual(afterPaste.lines, ["ab1", "2cd"]);
    assert.deepEqual(afterPaste.cursor, pos(1, 1));
  });

  test("selection operations remain stable with mixed tabs/spaces", () => {
    const lines = ["\tfoo  bar", "  baz"];
    const range = selection(pos(0, 1), pos(1, 2));
    const copied = getSelectedText(lines, range);
    const cut = deleteRange(lines, range);

    assert.equal(copied, "foo  bar\n  ");
    assert.deepEqual(cut.lines, ["\tbaz"]);
  });
});
