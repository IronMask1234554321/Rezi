/**
 * packages/core/src/widgets/codeEditor.ts — CodeEditor core algorithms.
 *
 * Why: Implements text editing operations, cursor movement, selection handling,
 * and undo/redo stack for the code editor widget.
 *
 * @see docs/widgets/code-editor.md
 */

import type { CursorPosition, EditorSelection } from "./types.js";

/** Default tab size in spaces. */
export const DEFAULT_TAB_SIZE = 2;

/** Maximum undo stack size. */
export const MAX_UNDO_STACK = 1000;

/** Time window for grouping edits into single undo entry (ms). */
export const UNDO_GROUP_WINDOW = 300;

/** Result of a text editing operation. */
export type EditResult = Readonly<{
  lines: readonly string[];
  cursor: CursorPosition;
  selection: EditorSelection | null;
}>;

/** Undo/redo action record. */
export type EditAction = Readonly<{
  type: "insert" | "delete" | "replace";
  range: EditorSelection;
  text: string;
  timestamp: number;
}>;

/**
 * Insert text at cursor position.
 *
 * @param lines - Current document lines
 * @param cursor - Cursor position
 * @param text - Text to insert
 * @returns Edit result with updated lines and cursor
 */
export function insertText(
  lines: readonly string[],
  cursor: CursorPosition,
  text: string,
): EditResult {
  const newLines = [...lines];
  const { line, column } = cursor;

  // Ensure we have at least one line
  if (newLines.length === 0) {
    newLines.push("");
  }

  // Clamp cursor to valid position
  const safeRow = Math.max(0, Math.min(line, newLines.length - 1));
  const currentLine = newLines[safeRow] ?? "";
  const safeCol = Math.max(0, Math.min(column, currentLine.length));

  // Split text into lines
  const insertLines = text.split("\n");
  const beforeCursor = currentLine.slice(0, safeCol);
  const afterCursor = currentLine.slice(safeCol);

  if (insertLines.length === 1) {
    // Single line insert
    newLines[safeRow] = beforeCursor + insertLines[0] + afterCursor;
    return Object.freeze({
      lines: Object.freeze(newLines),
      cursor: { line: safeRow, column: safeCol + (insertLines[0]?.length ?? 0) },
      selection: null,
    });
  }

  // Multi-line insert
  const firstLine = beforeCursor + (insertLines[0] ?? "");
  const lastInsertLine = insertLines[insertLines.length - 1] ?? "";
  const lastLine = lastInsertLine + afterCursor;

  newLines.splice(safeRow, 1, firstLine, ...insertLines.slice(1, -1), lastLine);

  return Object.freeze({
    lines: Object.freeze(newLines),
    cursor: {
      line: safeRow + insertLines.length - 1,
      column: lastInsertLine.length,
    },
    selection: null,
  });
}

/**
 * Delete text in a selection range.
 *
 * @param lines - Current document lines
 * @param selection - Selection to delete
 * @returns Edit result with updated lines and cursor
 */
export function deleteRange(lines: readonly string[], selection: EditorSelection): EditResult {
  const newLines = [...lines];

  // Normalize selection (anchor before active)
  const [start, end] = normalizeSelection(selection);

  // Clamp to valid positions
  const startRow = Math.max(0, Math.min(start.line, newLines.length - 1));
  const endRow = Math.max(0, Math.min(end.line, newLines.length - 1));

  const startLine = newLines[startRow] ?? "";
  const endLine = newLines[endRow] ?? "";

  const startCol = Math.max(0, Math.min(start.column, startLine.length));
  const endCol = Math.max(0, Math.min(end.column, endLine.length));

  // Same line
  if (startRow === endRow) {
    newLines[startRow] = startLine.slice(0, startCol) + startLine.slice(endCol);
    return Object.freeze({
      lines: Object.freeze(newLines),
      cursor: { line: startRow, column: startCol },
      selection: null,
    });
  }

  // Multi-line delete
  const newLine = startLine.slice(0, startCol) + endLine.slice(endCol);
  newLines.splice(startRow, endRow - startRow + 1, newLine);

  return Object.freeze({
    lines: Object.freeze(newLines),
    cursor: { line: startRow, column: startCol },
    selection: null,
  });
}

/**
 * Delete character before cursor (backspace).
 *
 * @param lines - Current document lines
 * @param cursor - Cursor position
 * @returns Edit result with updated lines and cursor
 */
export function deleteCharBefore(lines: readonly string[], cursor: CursorPosition): EditResult {
  if (cursor.column > 0) {
    // Delete character on same line
    const selection: EditorSelection = {
      anchor: { line: cursor.line, column: cursor.column - 1 },
      active: cursor,
    };
    return deleteRange(lines, selection);
  }

  if (cursor.line > 0) {
    // Join with previous line
    const prevLine = lines[cursor.line - 1] ?? "";
    const selection: EditorSelection = {
      anchor: { line: cursor.line - 1, column: prevLine.length },
      active: cursor,
    };
    return deleteRange(lines, selection);
  }

  // At start of document, nothing to delete
  return Object.freeze({ lines, cursor, selection: null });
}

/**
 * Delete character after cursor (delete key).
 *
 * @param lines - Current document lines
 * @param cursor - Cursor position
 * @returns Edit result with updated lines and cursor
 */
export function deleteCharAfter(lines: readonly string[], cursor: CursorPosition): EditResult {
  const currentLine = lines[cursor.line] ?? "";

  if (cursor.column < currentLine.length) {
    // Delete character on same line
    const selection: EditorSelection = {
      anchor: cursor,
      active: { line: cursor.line, column: cursor.column + 1 },
    };
    return deleteRange(lines, selection);
  }

  if (cursor.line < lines.length - 1) {
    // Join with next line
    const selection: EditorSelection = {
      anchor: cursor,
      active: { line: cursor.line + 1, column: 0 },
    };
    return deleteRange(lines, selection);
  }

  // At end of document, nothing to delete
  return Object.freeze({ lines, cursor, selection: null });
}

/**
 * Compute auto-indent for newline insertion.
 *
 * @param lines - Current document lines
 * @param cursor - Cursor position
 * @param tabSize - Tab size in spaces
 * @returns Indent string to prepend to new line
 */
export function computeAutoIndent(
  lines: readonly string[],
  cursor: CursorPosition,
  tabSize: number = DEFAULT_TAB_SIZE,
): string {
  const currentLine = lines[cursor.line] ?? "";

  // Match leading whitespace of current line
  const match = currentLine.match(/^(\s*)/);
  let indent = match ? (match[1] ?? "") : "";

  // Check if line ends with opening brace/bracket
  const trimmedBeforeCursor = currentLine.slice(0, cursor.column).trimEnd();
  if (
    trimmedBeforeCursor.endsWith("{") ||
    trimmedBeforeCursor.endsWith("[") ||
    trimmedBeforeCursor.endsWith("(") ||
    trimmedBeforeCursor.endsWith(":")
  ) {
    indent += " ".repeat(tabSize);
  }

  return indent;
}

/**
 * Indent lines in a range.
 *
 * @param lines - Current document lines
 * @param lineRange - [start, end] line range (inclusive)
 * @param tabSize - Tab size in spaces
 * @param insertSpaces - Whether to use spaces (true) or tabs (false)
 * @returns Edit result with indented lines
 */
export function indentLines(
  lines: readonly string[],
  lineRange: readonly [number, number],
  tabSize: number = DEFAULT_TAB_SIZE,
  insertSpaces = true,
): readonly string[] {
  const [start, end] = lineRange;
  const indent = insertSpaces ? " ".repeat(tabSize) : "\t";
  const newLines = [...lines];

  for (let i = start; i <= end && i < newLines.length; i++) {
    newLines[i] = indent + (newLines[i] ?? "");
  }

  return Object.freeze(newLines);
}

/**
 * Dedent lines in a range.
 *
 * @param lines - Current document lines
 * @param lineRange - [start, end] line range (inclusive)
 * @param tabSize - Tab size in spaces
 * @returns Edit result with dedented lines
 */
export function dedentLines(
  lines: readonly string[],
  lineRange: readonly [number, number],
  tabSize: number = DEFAULT_TAB_SIZE,
): readonly string[] {
  const [start, end] = lineRange;
  const newLines = [...lines];

  for (let i = start; i <= end && i < newLines.length; i++) {
    const line = newLines[i] ?? "";
    // Remove up to tabSize leading spaces or one tab
    if (line.startsWith("\t")) {
      newLines[i] = line.slice(1);
    } else {
      let spacesToRemove = 0;
      for (let j = 0; j < tabSize && j < line.length; j++) {
        if (line[j] === " ") {
          spacesToRemove++;
        } else {
          break;
        }
      }
      newLines[i] = line.slice(spacesToRemove);
    }
  }

  return Object.freeze(newLines);
}

/**
 * Move cursor in a direction.
 *
 * @param lines - Current document lines
 * @param cursor - Current cursor position
 * @param direction - Movement direction
 * @returns New cursor position
 */
export function moveCursor(
  lines: readonly string[],
  cursor: CursorPosition,
  direction: "up" | "down" | "left" | "right" | "home" | "end" | "docStart" | "docEnd",
): CursorPosition {
  if (lines.length === 0) {
    return { line: 0, column: 0 };
  }

  const safeLine = Math.max(0, Math.min(cursor.line, lines.length - 1));
  const currentLine = lines[safeLine] ?? "";
  const safeColumn = Math.max(0, Math.min(cursor.column, currentLine.length));

  switch (direction) {
    case "up":
      if (safeLine > 0) {
        const prevLine = lines[safeLine - 1] ?? "";
        return { line: safeLine - 1, column: Math.min(safeColumn, prevLine.length) };
      }
      return { line: 0, column: 0 };

    case "down":
      if (safeLine < lines.length - 1) {
        const nextLine = lines[safeLine + 1] ?? "";
        return { line: safeLine + 1, column: Math.min(safeColumn, nextLine.length) };
      }
      return { line: lines.length - 1, column: (lines[lines.length - 1] ?? "").length };

    case "left":
      if (safeColumn > 0) {
        return { line: safeLine, column: safeColumn - 1 };
      }
      if (safeLine > 0) {
        const prevLine = lines[safeLine - 1] ?? "";
        return { line: safeLine - 1, column: prevLine.length };
      }
      return { line: 0, column: 0 };

    case "right":
      if (safeColumn < currentLine.length) {
        return { line: safeLine, column: safeColumn + 1 };
      }
      if (safeLine < lines.length - 1) {
        return { line: safeLine + 1, column: 0 };
      }
      return { line: safeLine, column: currentLine.length };

    case "home":
      return { line: safeLine, column: 0 };

    case "end":
      return { line: safeLine, column: currentLine.length };

    case "docStart":
      return { line: 0, column: 0 };

    case "docEnd": {
      const lastLine = lines.length - 1;
      return { line: lastLine, column: (lines[lastLine] ?? "").length };
    }
  }
}

/**
 * Move cursor by word.
 *
 * @param lines - Current document lines
 * @param cursor - Current cursor position
 * @param direction - Word movement direction
 * @returns New cursor position
 */
export function moveCursorByWord(
  lines: readonly string[],
  cursor: CursorPosition,
  direction: "left" | "right",
): CursorPosition {
  if (lines.length === 0) {
    return { line: 0, column: 0 };
  }

  const safeLine = Math.max(0, Math.min(cursor.line, lines.length - 1));
  const currentLine = lines[safeLine] ?? "";
  const safeColumn = Math.max(0, Math.min(cursor.column, currentLine.length));

  if (direction === "right") {
    // Move to end of current word, then skip whitespace
    let col = safeColumn;
    // Skip current word characters
    while (col < currentLine.length && /\w/.test(currentLine[col] ?? "")) {
      col++;
    }
    // Skip whitespace
    while (col < currentLine.length && /\s/.test(currentLine[col] ?? "")) {
      col++;
    }
    if (col >= currentLine.length && safeLine < lines.length - 1) {
      return { line: safeLine + 1, column: 0 };
    }
    return { line: safeLine, column: col };
  }

  // direction === "left"
  let col = safeColumn;
  // Skip whitespace
  while (col > 0 && /\s/.test(currentLine[col - 1] ?? "")) {
    col--;
  }
  // Skip word characters
  while (col > 0 && /\w/.test(currentLine[col - 1] ?? "")) {
    col--;
  }
  if (col === 0 && safeLine > 0) {
    const prevLine = lines[safeLine - 1] ?? "";
    return { line: safeLine - 1, column: prevLine.length };
  }
  return { line: safeLine, column: col };
}

/**
 * Normalize selection so anchor is before active.
 *
 * @param selection - Selection to normalize
 * @returns [start, end] positions
 */
export function normalizeSelection(
  selection: EditorSelection,
): readonly [CursorPosition, CursorPosition] {
  const { anchor, active } = selection;

  if (
    anchor.line < active.line ||
    (anchor.line === active.line && anchor.column <= active.column)
  ) {
    return Object.freeze([anchor, active]);
  }
  return Object.freeze([active, anchor]);
}

/**
 * Get selected text from lines.
 *
 * @param lines - Document lines
 * @param selection - Selection range
 * @returns Selected text
 */
export function getSelectedText(lines: readonly string[], selection: EditorSelection): string {
  const [start, end] = normalizeSelection(selection);

  if (start.line === end.line) {
    const line = lines[start.line] ?? "";
    return line.slice(start.column, end.column);
  }

  const result: string[] = [];

  // First line
  const firstLine = lines[start.line] ?? "";
  result.push(firstLine.slice(start.column));

  // Middle lines
  for (let i = start.line + 1; i < end.line; i++) {
    result.push(lines[i] ?? "");
  }

  // Last line
  const lastLine = lines[end.line] ?? "";
  result.push(lastLine.slice(0, end.column));

  return result.join("\n");
}

/**
 * Compute scroll position to ensure cursor is visible.
 *
 * @param scrollTop - Current scroll position
 * @param cursor - Cursor position
 * @param viewportHeight - Visible viewport height in lines
 * @returns Adjusted scroll position
 */
export function ensureCursorVisible(
  scrollTop: number,
  cursor: CursorPosition,
  viewportHeight: number,
): number {
  const safeViewportHeight = Math.max(1, viewportHeight);
  const safeScrollTop = Math.max(0, scrollTop);

  // Cursor above viewport
  if (cursor.line < safeScrollTop) {
    return Math.max(0, cursor.line);
  }

  // Cursor below viewport
  if (cursor.line >= safeScrollTop + safeViewportHeight) {
    return cursor.line - safeViewportHeight + 1;
  }

  return safeScrollTop;
}

/** Undo stack manager. */
export class UndoStack {
  private readonly undoStack: EditAction[] = [];
  private readonly redoStack: EditAction[] = [];
  private lastActionTime = 0;

  /** Push an action onto the undo stack. */
  push(action: EditAction): void {
    // Group with previous action if within time window and same type
    const lastAction = this.undoStack[this.undoStack.length - 1];
    if (
      lastAction &&
      action.timestamp - this.lastActionTime < UNDO_GROUP_WINDOW &&
      action.type === lastAction.type
    ) {
      // Merge actions
      this.undoStack[this.undoStack.length - 1] = action;
    } else {
      this.undoStack.push(action);
      if (this.undoStack.length > MAX_UNDO_STACK) {
        this.undoStack.shift();
      }
    }

    this.lastActionTime = action.timestamp;
    this.redoStack.length = 0; // Clear redo stack on new action
  }

  /** Pop and return the last undoable action. */
  undo(): EditAction | null {
    const action = this.undoStack.pop();
    if (action) {
      this.redoStack.push(action);
    }
    return action ?? null;
  }

  /** Pop and return the last redoable action. */
  redo(): EditAction | null {
    const action = this.redoStack.pop();
    if (action) {
      this.undoStack.push(action);
    }
    return action ?? null;
  }

  /** Check if undo is available. */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Check if redo is available. */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Clear both stacks. */
  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
