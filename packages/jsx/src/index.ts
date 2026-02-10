/**
 * @rezi-ui/jsx — JSX runtime for Rezi TUI framework.
 *
 * Setup:
 *
 * 1. Add to tsconfig.json:
 *    {
 *      "compilerOptions": {
 *        "jsx": "react-jsx",
 *        "jsxImportSource": "@rezi-ui/jsx"
 *      }
 *    }
 *
 * 2. Or use a per-file pragma:
 *    /** @jsxImportSource @rezi-ui/jsx *\/
 *
 * 3. Write JSX:
 *    import { Column, Text, Button } from "@rezi-ui/jsx";
 *
 *    app.view((state) => (
 *      <Column p={1}>
 *        <Text>Hello {state.name}</Text>
 *        <Button id="ok" label="OK" />
 *      </Column>
 *    ));
 *
 * The JSX output is equivalent to `ui.*()` VNode construction.
 */

export {
  Badge,
  BarChart,
  Box,
  Button,
  Callout,
  Checkbox,
  CodeEditor,
  Column,
  CommandPalette,
  DiffViewer,
  Divider,
  Dropdown,
  Empty,
  ErrorDisplay,
  Field,
  FilePicker,
  FileTreeExplorer,
  FocusTrap,
  FocusZone,
  Fragment,
  Gauge,
  Icon,
  Input,
  Kbd,
  Layer,
  Layers,
  LogsConsole,
  MiniChart,
  Modal,
  PanelGroup,
  Progress,
  RadioGroup,
  ResizablePanel,
  RichText,
  Row,
  Select,
  Skeleton,
  Spacer,
  Sparkline,
  Spinner,
  SplitPane,
  Status,
  Table,
  Tag,
  Text,
  ToastContainer,
  ToolApprovalDialog,
  Tree,
  VirtualList,
} from "./components.js";

export { createElement, h } from "./createElement.js";

export {
  normalizeContainerChildren,
  normalizeTextChildren,
  type JsxChild,
  type JsxChildren,
  type JsxTextChild,
  type JsxTextChildren,
} from "./children.js";

export type {
  BadgeJsxProps,
  BarChartJsxProps,
  BoxJsxProps,
  ButtonJsxProps,
  CalloutJsxProps,
  CheckboxJsxProps,
  CodeEditorJsxProps,
  ColumnJsxProps,
  CommandPaletteJsxProps,
  DiffViewerJsxProps,
  DividerJsxProps,
  DropdownJsxProps,
  EmptyJsxProps,
  ErrorDisplayJsxProps,
  FieldJsxProps,
  FilePickerJsxProps,
  FileTreeExplorerJsxProps,
  FocusTrapJsxProps,
  FocusZoneJsxProps,
  GaugeJsxProps,
  IconJsxProps,
  InputJsxProps,
  KbdJsxProps,
  LayerJsxProps,
  LayersJsxProps,
  LogsConsoleJsxProps,
  MiniChartJsxProps,
  ModalJsxProps,
  PanelGroupJsxProps,
  ProgressJsxProps,
  RadioGroupJsxProps,
  ResizablePanelJsxProps,
  RichTextJsxProps,
  RowJsxProps,
  SelectJsxProps,
  SkeletonJsxProps,
  SpacerJsxProps,
  SparklineJsxProps,
  SpinnerJsxProps,
  SplitPaneJsxProps,
  StatusJsxProps,
  TableJsxProps,
  TagJsxProps,
  TextJsxProps,
  ToastContainerJsxProps,
  ToolApprovalDialogJsxProps,
  TreeJsxProps,
  VirtualListJsxProps,
} from "./types.js";

export { rgb } from "@rezi-ui/core";

export type { Rgb, TextStyle, VNode } from "@rezi-ui/core";
