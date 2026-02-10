import { formatCost, formatTimestamp, formatTokenCount } from "../../widgets/logsConsole.js";
import type {
  CodeEditorProps,
  DiffViewerProps,
  LogsConsoleProps,
  TableProps,
} from "../../widgets/types.js";

export type TableRenderCache = Readonly<{
  dataRef: readonly unknown[];
  getRowKeyRef: (row: unknown, index: number) => string;
  rowKeys: readonly string[];
  rowKeyToIndex: ReadonlyMap<string, number>;
  selectionRef: readonly string[];
  selectionSet: ReadonlySet<string>;
}>;

type LogsEntryMeta = Readonly<{
  timestamp: string;
  levelLabel: string;
  sourceLabel: string;
  metaSuffix: string;
  lowerMessage: string;
  lowerSource: string;
  lowerDetails: string | null;
}>;

export type LogsConsoleRenderCache = Readonly<{
  entriesRef: LogsConsoleProps["entries"];
  levelFilterRef: readonly string[];
  sourceFilterRef: readonly string[];
  searchQuery: string | null;
  levelSet: ReadonlySet<string>;
  sourceSet: ReadonlySet<string>;
  lowerQuery: string | null;
  filtered: readonly LogsConsoleProps["entries"][number][];
  entryMetaById: ReadonlyMap<string, LogsEntryMeta>;
}>;

export type DiffRenderCache = Readonly<{
  diffRef: DiffViewerProps["diff"];
  numWidth: number;
  blankNum: string;
  headerByHunk: readonly string[];
  collapsedByHunk: readonly string[];
  formattedNums: Map<number, string>;
}>;

export type CodeEditorRenderCache = Readonly<{
  linesRef: readonly string[];
  lineNumWidth: number;
  lineNums: readonly string[];
}>;

export function rebuildRenderCaches(
  opts: Readonly<{
    tableById: ReadonlyMap<string, TableProps<unknown>>;
    logsConsoleById: ReadonlyMap<string, LogsConsoleProps>;
    diffViewerById: ReadonlyMap<string, DiffViewerProps>;
    codeEditorById: ReadonlyMap<string, CodeEditorProps>;
    tableRenderCacheById: Map<string, TableRenderCache>;
    logsConsoleRenderCacheById: Map<string, LogsConsoleRenderCache>;
    diffRenderCacheById: Map<string, DiffRenderCache>;
    codeEditorRenderCacheById: Map<string, CodeEditorRenderCache>;
    emptyStringArray: readonly string[];
  }>,
): void {
  for (const table of opts.tableById.values()) {
    const dataRef = table.data as readonly unknown[];
    const getRowKeyRef = table.getRowKey as (row: unknown, index: number) => string;
    const selectionRef = (table.selection ?? opts.emptyStringArray) as readonly string[];
    const existing = opts.tableRenderCacheById.get(table.id);

    let rowKeys: readonly string[];
    let rowKeyToIndex: ReadonlyMap<string, number>;
    if (existing && existing.dataRef === dataRef && existing.getRowKeyRef === getRowKeyRef) {
      rowKeys = existing.rowKeys;
      rowKeyToIndex = existing.rowKeyToIndex;
    } else {
      const keys = new Array<string>(dataRef.length);
      for (let i = 0; i < dataRef.length; i++) {
        const row = dataRef[i];
        keys[i] = row !== undefined ? getRowKeyRef(row, i) : `__empty_${i}`;
      }
      rowKeys = Object.freeze(keys);
      const index = new Map<string, number>();
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== undefined) index.set(key, i);
      }
      rowKeyToIndex = index;
    }

    const selectionSet =
      existing && existing.selectionRef === selectionRef
        ? existing.selectionSet
        : selectionRef.length > 0
          ? new Set(selectionRef)
          : new Set<string>();

    opts.tableRenderCacheById.set(
      table.id,
      Object.freeze({
        dataRef,
        getRowKeyRef,
        rowKeys,
        rowKeyToIndex,
        selectionRef,
        selectionSet,
      }),
    );
  }

  for (const logs of opts.logsConsoleById.values()) {
    const entriesRef = logs.entries;
    const levelFilterRef = (logs.levelFilter ?? opts.emptyStringArray) as readonly string[];
    const sourceFilterRef = (logs.sourceFilter ?? opts.emptyStringArray) as readonly string[];
    const searchQuery = logs.searchQuery ? logs.searchQuery : null;

    const existing = opts.logsConsoleRenderCacheById.get(logs.id);
    if (
      existing &&
      existing.entriesRef === entriesRef &&
      existing.levelFilterRef === levelFilterRef &&
      existing.sourceFilterRef === sourceFilterRef &&
      existing.searchQuery === searchQuery
    ) {
      continue;
    }

    const levelSet =
      levelFilterRef.length > 0 ? new Set<string>(levelFilterRef) : new Set<string>();
    const sourceSet =
      sourceFilterRef.length > 0 ? new Set<string>(sourceFilterRef) : new Set<string>();
    const lowerQuery = searchQuery ? searchQuery.toLowerCase() : null;
    const prevMetaById = existing?.entryMetaById;
    const entryMetaById = new Map<string, LogsEntryMeta>();
    const filtered: LogsConsoleProps["entries"][number][] = [];

    for (const entry of entriesRef) {
      if (!entry) continue;
      let meta = prevMetaById?.get(entry.id);
      if (!meta) {
        const timestamp = formatTimestamp(entry.timestamp);
        const levelLabel = `[${entry.level.toUpperCase().padEnd(5)}]`;
        const sourceLabel = entry.source.slice(0, 6).padEnd(6);
        let metaSuffix = "";
        if (typeof entry.durationMs === "number") {
          metaSuffix += ` | ${formatTokenCount(entry.durationMs)}ms`;
        }
        if (entry.tokens) {
          metaSuffix += ` | ${formatTokenCount(entry.tokens.total)} tokens`;
        }
        if (typeof entry.costCents === "number") {
          metaSuffix += ` | ${formatCost(entry.costCents)}`;
        }
        meta = {
          timestamp,
          levelLabel,
          sourceLabel,
          metaSuffix,
          lowerMessage: entry.message.toLowerCase(),
          lowerSource: entry.source.toLowerCase(),
          lowerDetails: entry.details ? entry.details.toLowerCase() : null,
        };
      }
      entryMetaById.set(entry.id, meta);

      if (levelSet.size > 0 && !levelSet.has(entry.level)) continue;
      if (sourceSet.size > 0 && !sourceSet.has(entry.source)) continue;
      if (lowerQuery) {
        if (meta.lowerMessage.includes(lowerQuery)) {
          filtered.push(entry);
          continue;
        }
        if (meta.lowerSource.includes(lowerQuery)) {
          filtered.push(entry);
          continue;
        }
        if (meta.lowerDetails?.includes(lowerQuery)) {
          filtered.push(entry);
          continue;
        }
        continue;
      }
      filtered.push(entry);
    }

    opts.logsConsoleRenderCacheById.set(
      logs.id,
      Object.freeze({
        entriesRef,
        levelFilterRef,
        sourceFilterRef,
        searchQuery,
        levelSet,
        sourceSet,
        lowerQuery,
        filtered: Object.freeze(filtered),
        entryMetaById,
      }),
    );
  }

  for (const diff of opts.diffViewerById.values()) {
    const existing = opts.diffRenderCacheById.get(diff.id);
    if (existing && existing.diffRef === diff.diff) continue;

    let maxOld = 0;
    let maxNew = 0;
    const hunks = diff.diff.hunks;
    for (const hunk of hunks) {
      if (!hunk) continue;
      const oldLast = hunk.oldStart + Math.max(0, hunk.oldCount - 1);
      const newLast = hunk.newStart + Math.max(0, hunk.newCount - 1);
      if (oldLast > maxOld) maxOld = oldLast;
      if (newLast > maxNew) maxNew = newLast;
    }
    const numWidth = Math.max(1, String(Math.max(maxOld, maxNew)).length);
    const blankNum = " ".repeat(numWidth);

    const headerByHunk = new Array<string>(hunks.length);
    const collapsedByHunk = new Array<string>(hunks.length);
    for (let i = 0; i < hunks.length; i++) {
      const hunk = hunks[i];
      if (!hunk) {
        headerByHunk[i] = "";
        collapsedByHunk[i] = "";
        continue;
      }
      headerByHunk[i] =
        `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@${
          hunk.header ? ` ${hunk.header}` : ""
        }`;
      collapsedByHunk[i] = `… ${String(hunk.lines.length)} lines …`;
    }

    opts.diffRenderCacheById.set(
      diff.id,
      Object.freeze({
        diffRef: diff.diff,
        numWidth,
        blankNum,
        headerByHunk: Object.freeze(headerByHunk),
        collapsedByHunk: Object.freeze(collapsedByHunk),
        formattedNums: new Map<number, string>(),
      }),
    );
  }

  for (const editor of opts.codeEditorById.values()) {
    const linesRef = editor.lines;
    const lineNumbers = editor.lineNumbers !== false;
    const lineNumWidth = lineNumbers ? String(linesRef.length).length + 1 : 0;
    const existing = opts.codeEditorRenderCacheById.get(editor.id);
    if (existing && existing.linesRef === linesRef && existing.lineNumWidth === lineNumWidth) {
      continue;
    }

    const lineNums: string[] = [];
    if (lineNumbers && lineNumWidth > 0) {
      for (let i = 0; i < linesRef.length; i++) {
        lineNums.push(String(i + 1).padStart(lineNumWidth - 1, " "));
      }
    }

    opts.codeEditorRenderCacheById.set(
      editor.id,
      Object.freeze({
        linesRef,
        lineNumWidth,
        lineNums: Object.freeze(lineNums),
      }),
    );
  }

  for (const id of opts.tableRenderCacheById.keys()) {
    if (!opts.tableById.has(id)) opts.tableRenderCacheById.delete(id);
  }
  for (const id of opts.logsConsoleRenderCacheById.keys()) {
    if (!opts.logsConsoleById.has(id)) opts.logsConsoleRenderCacheById.delete(id);
  }
  for (const id of opts.diffRenderCacheById.keys()) {
    if (!opts.diffViewerById.has(id)) opts.diffRenderCacheById.delete(id);
  }
  for (const id of opts.codeEditorRenderCacheById.keys()) {
    if (!opts.codeEditorById.has(id)) opts.codeEditorRenderCacheById.delete(id);
  }
}
