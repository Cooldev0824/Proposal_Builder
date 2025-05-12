export interface Document {
  id: string;
  title: string;
  sections: Section[];
  createdAt?: string;
  updatedAt?: string;
  paperSize?: string;
  orientation?: "portrait" | "landscape";
}

export interface Section {
  id: string;
  title: string;
  elements: DocumentElement[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ElementContent {
  [key: string]: unknown;
  columns?: Array<{ field: string; headerName: string }>;
  rows?: Array<Record<string, unknown>>;
  text?: string;
  html?: string;
  src?: string;
  url?: string;
  cells?: GridCell[];
  headers?: string[];
}

export interface ElementStyle {
  [key: string]: string | number | boolean | undefined;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string | number;
  fontWeight?: string | number;
  textAlign?: "left" | "center" | "right" | "justify";
  lineHeight?: string | number;
  border?: string;
  borderRadius?: string | number;
  borderWidth?: number;
  borderColor?: string;
  padding?: string | number;
  margin?: string | number;
  opacity?: string | number;
  transform?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export type DocumentElement = {
  id: string;
  type: string;
  content: ElementContent | string;
  position: Position;
  size: Size;
  style?: ElementStyle;
  zIndex?: number;
  children?: DocumentElement[];
  formType?: string;
  value?: string;
  checked?: boolean;
};

export interface TextElement extends DocumentElement {
  type: "text";
  content: string;
  style: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    textAlign?: "left" | "center" | "right" | "justify";
    textIndent?: number;
    lineHeight?: number;
    paragraphIndent?: number;
    listType?: "none" | "bullet" | "number";
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    blockBackground?: boolean;
    blockBackgroundColor?: string;
    align?: "left" | "center" | "right" | "justify";
  };
}

export interface ImageElement extends DocumentElement {
  type: "image";
  content: string; // URL
  style: {
    borderRadius: number;
    borderWidth: number;
    borderColor: string;
    opacity: number;
  };
}

export interface ShapeElement extends DocumentElement {
  type: "shape";
  content: "rectangle" | "circle" | "triangle" | "arrow";
  style: {
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
  };
}

export interface TableElement extends DocumentElement {
  type: "table";
  content: {
    headers: string[];
    rows: string[][];
  };
  style: {
    headerBackgroundColor: string;
    headerTextColor: string;
    cellBackgroundColor: string;
    cellTextColor: string;
    borderColor: string;
  };
}

export interface SignatureElement extends DocumentElement {
  type: "signature";
  content: string; // SVG data or empty
  style: {
    borderBottom: string;
    label: string;
  };
}

export interface GridElement extends DocumentElement {
  type: "grid";
  content: {
    cells: GridCell[];
  };
  style: {
    backgroundColor: string;
    borderColor: string;
    gap: number;
  };
}

export interface GridCell {
  id: string;
  elements: DocumentElement[];
  size: number;
}
