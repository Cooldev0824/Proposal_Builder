<template>
  <div
    class="table-element element"
    :class="{ selected: isSelected, 'editing-active': isEditingActive }"
    :style="elementStyle"
    @mousedown.stop="handleElementMouseDown"
    @click.stop="handleElementClick"
  >
    <!-- Table toolbar (visible when table is selected) -->
    <div v-if="isSelected && !isEditingActive" class="table-toolbar">
      <div class="toolbar-section">
        <v-btn-group variant="outlined" density="compact">
          <v-btn icon
                 size="small"
                 title="Add row above"
                 @click="addRowAbove"
          >
            <v-icon>mdi-table-row-plus-before</v-icon>
          </v-btn>
          <v-btn icon
                 size="small"
                 title="Add row below"
                 @click="addRowBelow"
          >
            <v-icon>mdi-table-row-plus-after</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            title="Delete row"
            :disabled="element.content.rows.length <= 1"
            @click="deleteRow"
          >
            <v-icon>mdi-table-row-remove</v-icon>
          </v-btn>
        </v-btn-group>
      </div>

      <div class="toolbar-section">
        <v-btn-group variant="outlined" density="compact">
          <v-btn
            icon
            size="small"
            title="Add column left"
            @click="addColumnLeft"
          >
            <v-icon>mdi-table-column-plus-before</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            title="Add column right"
            @click="addColumnRight"
          >
            <v-icon>mdi-table-column-plus-after</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            title="Delete column"
            :disabled="element.content.headers.length <= 1"
            @click="deleteColumn"
          >
            <v-icon>mdi-table-column-remove</v-icon>
          </v-btn>
        </v-btn-group>
      </div>

      <div class="toolbar-section">
        <v-btn-group variant="outlined" density="compact">
          <v-btn icon
                 size="small"
                 title="Edit table"
                 @click="startEditing"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </v-btn-group>
      </div>
    </div>

    <!-- Cell editing toolbar (visible when editing is active) -->
    <div v-if="isEditingActive" class="cell-editing-toolbar">
      <div class="toolbar-section">
        <v-btn-group variant="outlined" density="compact">
          <v-btn
            icon
            size="small"
            :class="{ active: activeCellFormatting.bold }"
            @click="applyFormatting('bold')"
          >
            <v-icon>mdi-format-bold</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            :class="{ active: activeCellFormatting.italic }"
            @click="applyFormatting('italic')"
          >
            <v-icon>mdi-format-italic</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            :class="{ active: activeCellFormatting.underline }"
            @click="applyFormatting('underline')"
          >
            <v-icon>mdi-format-underline</v-icon>
          </v-btn>
        </v-btn-group>
      </div>

      <div class="toolbar-section">
        <v-btn-group variant="outlined" density="compact">
          <v-btn
            icon
            size="small"
            :class="{ active: activeCellFormatting.align === 'left' }"
            @click="applyAlignment('left')"
          >
            <v-icon>mdi-format-align-left</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            :class="{ active: activeCellFormatting.align === 'center' }"
            @click="applyAlignment('center')"
          >
            <v-icon>mdi-format-align-center</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            :class="{ active: activeCellFormatting.align === 'right' }"
            @click="applyAlignment('right')"
          >
            <v-icon>mdi-format-align-right</v-icon>
          </v-btn>
        </v-btn-group>
      </div>

      <div class="toolbar-section">
        <v-btn
          icon
          size="small"
          color="primary"
          title="Finish editing"
          @click="finishEditing"
        >
          <v-icon>mdi-check</v-icon>
        </v-btn>
      </div>
    </div>

    <!-- Editable table -->
    <div class="table-container">
      <table class="editor-table" :style="tableStyle">
        <thead>
          <tr>
            <th
              v-for="(header, index) in element.content.headers"
              :key="index"
              :style="getHeaderStyle(index)"
              :class="{
                'selected-cell': isHeaderSelected(index),
                'active-cell': isHeaderActive(index),
              }"
              @click.stop="selectCell('header', -1, index)"
              @dblclick.stop="activateCell('header', -1, index)"
            >
              <div v-if="!isHeaderActive(index)" class="cell-content">
                <SafeHtml
                  :html="formatCellContent(header, getHeaderFormatting(index))"
                />
              </div>
              <div v-else class="cell-editor">
                <div
                  ref="activeHeaderEditor"
                  contenteditable="true"
                  class="editable-content"
                  @blur="updateCellContent"
                  @keydown="handleCellKeyDown"
                  v-text="header"
                ></div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in element.content.rows" :key="rowIndex">
            <td
              v-for="(cell, cellIndex) in row"
              :key="cellIndex"
              :style="getCellStyle(rowIndex, cellIndex)"
              :class="{
                'selected-cell': isCellSelected(rowIndex, cellIndex),
                'active-cell': isCellActive(rowIndex, cellIndex),
              }"
              @click.stop="selectCell('cell', rowIndex, cellIndex)"
              @dblclick.stop="activateCell('cell', rowIndex, cellIndex)"
            >
              <div
                v-if="!isCellActive(rowIndex, cellIndex)"
                class="cell-content"
              >
                <SafeHtml
                  :html="formatCellContent(
                    cell,
                    getCellFormatting(rowIndex, cellIndex)
                  )"
                />
              </div>
              <div v-else class="cell-editor">
                <div
                  ref="activeCellEditor"
                  contenteditable="true"
                  class="editable-content"
                  @blur="updateCellContent"
                  @keydown="handleCellKeyDown"
                  v-text="cell"
                ></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Resize handles -->
    <div
      v-if="isSelected"
      class="resize-handle bottom-right"
      @mousedown.stop="(e: MouseEvent) => startResize('both', e)"
    ></div>
    <div
      v-if="isSelected"
      class="resize-handle bottom"
      @mousedown.stop="(e: MouseEvent) => startResize('height', e)"
    ></div>
    <div
      v-if="isSelected"
      class="resize-handle right"
      @mousedown.stop="(e: MouseEvent) => startResize('width', e)"
    ></div>

    <!-- Column resize handles (visible when editing is active) -->
    <div v-if="isEditingActive" class="column-resize-handles">
      <div
        v-for="(_, index) in element.content.headers.slice(0, -1)"
        :key="index"
        class="column-resize-handle"
        :style="{ left: getColumnPosition(index) + 'px' }"
        @mousedown.stop="(e: MouseEvent) => startColumnResize(index, e)"
      ></div>
    </div>

    <!-- Row resize handles (visible when editing is active) -->
    <div v-if="isEditingActive" class="row-resize-handles">
      <div
        v-for="(_, index) in element.content.rows.slice(0, -1)"
        :key="index"
        class="row-resize-handle"
        :style="{ top: getRowPosition(index) + 'px' }"
        @mousedown.stop="(e: MouseEvent) => startRowResize(index, e)"
      ></div>
    </div>

    <!-- Context menu -->
    <v-menu
      v-model="showContextMenu"
      :position-x="contextMenuX"
      :position-y="contextMenuY"
      absolute
      offset-y
    >
      <v-list dense>
        <v-list-item
          :disabled="!canMergeCells"
          @click="contextMenuAction('merge')"
        >
          <v-list-item-title>Merge cells</v-list-item-title>
        </v-list-item>
        <v-list-item
          :disabled="!canSplitCell"
          @click="contextMenuAction('split')"
        >
          <v-list-item-title>Split cell</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item @click="contextMenuAction('insertRowAbove')">
          <v-list-item-title>Insert row above</v-list-item-title>
        </v-list-item>
        <v-list-item @click="contextMenuAction('insertRowBelow')">
          <v-list-item-title>Insert row below</v-list-item-title>
        </v-list-item>
        <v-list-item @click="contextMenuAction('insertColumnLeft')">
          <v-list-item-title>Insert column left</v-list-item-title>
        </v-list-item>
        <v-list-item @click="contextMenuAction('insertColumnRight')">
          <v-list-item-title>Insert column right</v-list-item-title>
        </v-list-item>
        <v-divider></v-divider>
        <v-list-item
          :disabled="element.content.rows.length <= 1"
          @click="contextMenuAction('deleteRow')"
        >
          <v-list-item-title>Delete row</v-list-item-title>
        </v-list-item>
        <v-list-item
          :disabled="element.content.headers.length <= 1"
          @click="contextMenuAction('deleteColumn')"
        >
          <v-list-item-title>Delete column</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { DocumentElement } from "../../../types/document";
import type { CSSProperties } from "vue";
import SafeHtml from "../../common/SafeHtml.vue";

// Import styles
import "../../../assets/styles/components/tableElement.scss";

interface CellFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right";
  backgroundColor?: string;
  color?: string;
}

interface CellPosition {
  type: "header" | "cell";
  rowIndex: number;
  cellIndex: number;
}

interface MergedCell {
  rowspan: number;
  colspan: number;
}

interface TableData {
  headers: string[];
  rows: string[][];
  headerFormatting?: CellFormatting[];
  cellFormatting?: CellFormatting[][];
  mergedCells?: Record<string, MergedCell>;
  columnWidths?: number[];
  rowHeights?: number[];
}

const props = defineProps<{
  element: DocumentElement;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
  (e: "select", element: DocumentElement): void;
}>();

// Editing mode state
const isEditingActive = ref(false);

// Drag & drop functionality
let isDragging = false;
let startX = 0;
let startY = 0;
let startLeft = 0;
let startTop = 0;

// Resize functionality
let isResizing = false;
let resizeType = "both";
let startWidth = 0;
let startHeight = 0;

// Column/row resize functionality
let isColumnResizing = false;
let isRowResizing = false;
let resizingColumnIndex = -1;
let resizingRowIndex = -1;
let startColumnWidth = 0;
let startRowHeight = 0;

// Cell selection and editing
const selectedCells = ref<CellPosition[]>([]);
const activeCellPosition = ref<CellPosition | null>(null);
const activeCellEditor = ref<HTMLElement | null>(null);
const activeHeaderEditor = ref<HTMLElement | null>(null);

// Context menu
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

// Cell formatting
const activeCellFormatting = ref<CellFormatting>({
  bold: false,
  italic: false,
  underline: false,
  align: "left",
});

// Computed properties
const elementStyle = computed<CSSProperties>(() => {
  return {
    left: `${props.element.position.x}px`,
    top: `${props.element.position.y}px`,
    width: `${props.element.size.width}px`,
    minHeight: `${props.element.size.height}px`,
    zIndex: props.element.zIndex ?? 0,
    position: "absolute" as const,
  };
});

const tableStyle = computed<CSSProperties>(() => {
  const style = props.element.style || {};
  return {
    borderCollapse: "collapse" as const,
    width: "100%",
    borderColor: style.borderColor || "#E2E8F0",
    borderStyle: style.borderStyle || "solid",
    borderWidth: `${style.borderWidth || 1}px`,
  };
});

// Helper function to get table data with proper defaults
const tableData = computed<TableData>(() => {
  const content = props.element.content;
  return {
    headers: content.headers || [],
    rows: content.rows || [],
    headerFormatting: content.headerFormatting || [],
    cellFormatting: content.cellFormatting || [],
    mergedCells: content.mergedCells || {},
    columnWidths: content.columnWidths || [],
    rowHeights: content.rowHeights || [],
  };
});

// Computed property to check if we can merge cells
const canMergeCells = computed(() => {
  return selectedCells.value.length > 1;
});

// Computed property to check if we can split a cell
const canSplitCell = computed(() => {
  if (selectedCells.value.length !== 1) return false;

  const cell = selectedCells.value[0];
  const cellKey = `${cell.rowIndex}-${cell.cellIndex}`;

  return (
    tableData.value.mergedCells &&
    tableData.value.mergedCells[cellKey] !== undefined
  );
});

// Get header style for a specific header
function getHeaderStyle(index: number): CSSProperties {
  const style = props.element.style || {};
  const headerFormatting = tableData.value.headerFormatting?.[index] || {};

  return {
    backgroundColor: style.headerBackgroundColor || "#F8F9FA",
    color: style.headerTextColor || "#000000",
    padding: "8px 12px",
    textAlign: headerFormatting.align || "left",
    fontWeight: headerFormatting.bold ? "bold" : 500,
    fontStyle: headerFormatting.italic ? "italic" : "normal",
    textDecoration: headerFormatting.underline ? "underline" : "none",
    borderColor: style.borderColor || "#E2E8F0",
    borderStyle: style.borderStyle || "solid",
    borderWidth: `${style.borderWidth || 1}px`,
    position: "relative" as const,
    width: tableData.value.columnWidths?.[index]
      ? `${tableData.value.columnWidths[index]}px`
      : "auto",
  };
}

// Get cell style for a specific cell
function getCellStyle(rowIndex: number, cellIndex: number): CSSProperties {
  const style = props.element.style || {};
  const cellFormatting =
    tableData.value.cellFormatting?.[rowIndex]?.[cellIndex] || {};
  const cellKey = `${rowIndex}-${cellIndex}`;
  const mergedCell = tableData.value.mergedCells?.[cellKey];

  const cellStyle: CSSProperties = {
    backgroundColor:
      cellFormatting.backgroundColor || style.cellBackgroundColor || "#FFFFFF",
    color: cellFormatting.color || style.cellTextColor || "#000000",
    padding: "8px 12px",
    textAlign: cellFormatting.align || "left",
    fontWeight: cellFormatting.bold ? "bold" : "normal",
    fontStyle: cellFormatting.italic ? "italic" : "normal",
    textDecoration: cellFormatting.underline ? "underline" : "none",
    borderColor: style.borderColor || "#E2E8F0",
    borderStyle: style.borderStyle || "solid",
    borderWidth: `${style.borderWidth || 1}px`,
    position: "relative" as const,
    height: tableData.value.rowHeights?.[rowIndex]
      ? `${tableData.value.rowHeights[rowIndex]}px`
      : "auto",
  };

  // Add rowspan and colspan if this is a merged cell
  // Note: We're using any here because rowSpan and colSpan are HTML attributes, not CSS properties
  if (mergedCell) {
    if (mergedCell.rowspan > 1) {
      (cellStyle as any).rowSpan = mergedCell.rowspan;
    }
    if (mergedCell.colspan > 1) {
      (cellStyle as any).colSpan = mergedCell.colspan;
    }
  }

  return cellStyle;
}

// Get header formatting for a specific header
function getHeaderFormatting(index: number): CellFormatting {
  return tableData.value.headerFormatting?.[index] || {};
}

// Get cell formatting for a specific cell
function getCellFormatting(
  rowIndex: number,
  cellIndex: number,
): CellFormatting {
  return tableData.value.cellFormatting?.[rowIndex]?.[cellIndex] || {};
}

// Format cell content with HTML based on formatting
function formatCellContent(
  content: string,
  formatting: CellFormatting,
): string {
  let formattedContent = content;

  // Apply formatting if needed
  if (formatting.bold) {
    formattedContent = `<strong>${formattedContent}</strong>`;
  }

  if (formatting.italic) {
    formattedContent = `<em>${formattedContent}</em>`;
  }

  if (formatting.underline) {
    formattedContent = `<u>${formattedContent}</u>`;
  }

  return formattedContent;
}

// Element event handlers
function handleElementMouseDown(event: MouseEvent) {
  // Prevent default to avoid text selection
  event.preventDefault();

  // Select the element if it's not already selected
  if (!props.isSelected) {
    emit("select", props.element);
  }

  // If we're in editing mode, don't start dragging
  if (isEditingActive.value) {
    return;
  }

  // Start dragging
  startDrag(event);
}

function handleElementClick(event: MouseEvent) {
  // Prevent default to avoid text selection
  event.preventDefault();

  // Select the element if it's not already selected
  if (!props.isSelected) {
    emit("select", props.element);
  }

  // If right-click, show context menu
  if (event.button === 2) {
    showContextMenu.value = true;
    contextMenuX.value = event.clientX;
    contextMenuY.value = event.clientY;
    event.preventDefault();
    return;
  }

  // If we're in editing mode and clicked outside any cell, deselect all cells
  if (isEditingActive.value) {
    selectedCells.value = [];
    activeCellPosition.value = null;
  }
}

// Drag & drop functionality
function startDrag(event: MouseEvent) {
  if (isEditingActive.value) return;

  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  startLeft = props.element.position.x;
  startTop = props.element.position.y;

  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
}

function onDrag(event: MouseEvent) {
  if (!isDragging) return;

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  const newPosition = {
    x: startLeft + deltaX,
    y: startTop + deltaY,
  };

  const updatedElement = {
    ...props.element,
    position: newPosition,
  };

  emit("update:element", updatedElement);
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
}

// Resize functionality
function startResize(type: "width" | "height" | "both", event: MouseEvent) {
  if (isEditingActive.value) return;

  isResizing = true;
  resizeType = type;
  startX = event.clientX;
  startY = event.clientY;
  startWidth = props.element.size.width;
  startHeight = props.element.size.height;

  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
}

function onResize(event: MouseEvent) {
  if (!isResizing) return;

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  const newSize = {
    width:
      resizeType === "both" || resizeType === "width"
        ? Math.max(300, startWidth + deltaX)
        : props.element.size.width,
    height:
      resizeType === "both" || resizeType === "height"
        ? Math.max(100, startHeight + deltaY)
        : props.element.size.height,
  };

  const updatedElement = {
    ...props.element,
    size: newSize,
  };

  emit("update:element", updatedElement);
}

function stopResize() {
  isResizing = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
}

// Column resize functionality
function startColumnResize(columnIndex: number, event: MouseEvent) {
  isColumnResizing = true;
  resizingColumnIndex = columnIndex;
  startX = event.clientX;

  // Get current column width or default
  const columnWidths = [...(tableData.value.columnWidths || [])];
  while (columnWidths.length <= columnIndex) {
    columnWidths.push(100); // Default column width
  }
  startColumnWidth = columnWidths[columnIndex];

  document.addEventListener("mousemove", onColumnResize);
  document.addEventListener("mouseup", stopColumnResize);
}

function onColumnResize(event: MouseEvent) {
  if (!isColumnResizing) return;

  const deltaX = event.clientX - startX;
  const newWidth = Math.max(50, startColumnWidth + deltaX); // Minimum width of 50px

  // Update column width
  const columnWidths = [...(tableData.value.columnWidths || [])];
  while (columnWidths.length <= resizingColumnIndex) {
    columnWidths.push(100); // Default column width
  }
  columnWidths[resizingColumnIndex] = newWidth;

  // Update element
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      columnWidths,
    },
  };

  emit("update:element", updatedElement);
}

function stopColumnResize() {
  isColumnResizing = false;
  document.removeEventListener("mousemove", onColumnResize);
  document.removeEventListener("mouseup", stopColumnResize);
}

// Row resize functionality
function startRowResize(rowIndex: number, event: MouseEvent) {
  isRowResizing = true;
  resizingRowIndex = rowIndex;
  startY = event.clientY;

  // Get current row height or default
  const rowHeights = [...(tableData.value.rowHeights || [])];
  while (rowHeights.length <= rowIndex) {
    rowHeights.push(40); // Default row height
  }
  startRowHeight = rowHeights[rowIndex];

  document.addEventListener("mousemove", onRowResize);
  document.addEventListener("mouseup", stopRowResize);
}

function onRowResize(event: MouseEvent) {
  if (!isRowResizing) return;

  const deltaY = event.clientY - startY;
  const newHeight = Math.max(30, startRowHeight + deltaY); // Minimum height of 30px

  // Update row height
  const rowHeights = [...(tableData.value.rowHeights || [])];
  while (rowHeights.length <= resizingRowIndex) {
    rowHeights.push(40); // Default row height
  }
  rowHeights[resizingRowIndex] = newHeight;

  // Update element
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      rowHeights,
    },
  };

  emit("update:element", updatedElement);
}

function stopRowResize() {
  isRowResizing = false;
  document.removeEventListener("mousemove", onRowResize);
  document.removeEventListener("mouseup", stopRowResize);
}

// Get column position for resize handle
function getColumnPosition(index: number): number {
  // Calculate position based on column widths
  let position = 0;
  const columnWidths = tableData.value.columnWidths || [];

  for (let i = 0; i <= index; i++) {
    position += columnWidths[i] || 100; // Default width if not specified
  }

  return position;
}

// Get row position for resize handle
function getRowPosition(index: number): number {
  // Calculate position based on row heights
  let position = 40; // Account for header row
  const rowHeights = tableData.value.rowHeights || [];

  for (let i = 0; i <= index; i++) {
    position += rowHeights[i] || 40; // Default height if not specified
  }

  return position;
}

// Cell selection and editing
function isHeaderSelected(index: number): boolean {
  return selectedCells.value.some(
    (cell) => cell.type === "header" && cell.cellIndex === index,
  );
}

function isHeaderActive(index: number): boolean {
  return (
    activeCellPosition.value !== null &&
    activeCellPosition.value.type === "header" &&
    activeCellPosition.value.cellIndex === index
  );
}

function isCellSelected(rowIndex: number, cellIndex: number): boolean {
  return selectedCells.value.some(
    (cell) =>
      cell.type === "cell" &&
      cell.rowIndex === rowIndex &&
      cell.cellIndex === cellIndex,
  );
}

function isCellActive(rowIndex: number, cellIndex: number): boolean {
  return (
    activeCellPosition.value !== null &&
    activeCellPosition.value.type === "cell" &&
    activeCellPosition.value.rowIndex === rowIndex &&
    activeCellPosition.value.cellIndex === cellIndex
  );
}

function selectCell(
  type: "header" | "cell",
  rowIndex: number,
  cellIndex: number,
) {
  if (!isEditingActive.value) return;

  // Create cell position object
  const cellPosition: CellPosition = { type, rowIndex, cellIndex };

  // If shift key is pressed, add to selection
  if (event && (event as MouseEvent).shiftKey) {
    // Check if already selected
    const isAlreadySelected = selectedCells.value.some(
      (cell) =>
        cell.type === type &&
        cell.rowIndex === rowIndex &&
        cell.cellIndex === cellIndex,
    );

    // If not already selected, add to selection
    if (!isAlreadySelected) {
      selectedCells.value.push(cellPosition);
    } else {
      // If already selected, remove from selection
      selectedCells.value = selectedCells.value.filter(
        (cell) =>
          !(
            cell.type === type &&
            cell.rowIndex === rowIndex &&
            cell.cellIndex === cellIndex
          ),
      );
    }
  } else {
    // Otherwise, replace selection
    selectedCells.value = [cellPosition];
  }

  // Update active cell formatting
  updateActiveCellFormatting();
}

function activateCell(
  type: "header" | "cell",
  rowIndex: number,
  cellIndex: number,
) {
  if (!isEditingActive.value) return;

  // Set active cell
  activeCellPosition.value = { type, rowIndex, cellIndex };

  // Clear selection
  selectedCells.value = [{ type, rowIndex, cellIndex }];

  // Update active cell formatting
  updateActiveCellFormatting();

  // Focus the editor on next tick
  nextTick(() => {
    if (type === "header") {
      if (activeHeaderEditor.value) {
        activeHeaderEditor.value.focus();
      }
    } else {
      if (activeCellEditor.value) {
        activeCellEditor.value.focus();
      }
    }
  });
}

function updateCellContent() {
  if (!activeCellPosition.value) return;

  const { type, rowIndex, cellIndex } = activeCellPosition.value;
  let content = "";

  // Get content from editor
  if (type === "header") {
    if (activeHeaderEditor.value) {
      content = activeHeaderEditor.value.innerHTML;
    }
  } else {
    if (activeCellEditor.value) {
      content = activeCellEditor.value.innerHTML;
    }
  }

  // Update element
  const updatedElement = { ...props.element };

  if (type === "header") {
    updatedElement.content = {
      ...updatedElement.content,
      headers: [...updatedElement.content.headers],
    };
    updatedElement.content.headers[cellIndex] = content;
  } else {
    updatedElement.content = {
      ...updatedElement.content,
      rows: updatedElement.content.rows.map((row: any[]) => [...row]),
    };
    updatedElement.content.rows[rowIndex][cellIndex] = content;
  }

  emit("update:element", updatedElement);
}

function handleCellKeyDown(event: KeyboardEvent) {
  // Handle tab key to navigate between cells
  if (event.key === "Tab") {
    event.preventDefault();
    navigateToNextCell(event.shiftKey);
  }

  // Handle enter key to navigate to cell below
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    navigateToCellBelow();
  }

  // Handle escape key to cancel editing
  if (event.key === "Escape") {
    event.preventDefault();
    activeCellPosition.value = null;
  }
}

function navigateToNextCell(reverse = false) {
  if (!activeCellPosition.value) return;

  const { type, rowIndex, cellIndex } = activeCellPosition.value;

  // Save current cell content
  updateCellContent();

  // Navigate to next cell
  if (type === "header") {
    if (reverse) {
      // If first header and going backward, stay there
      if (cellIndex === 0) return;

      // Otherwise go to previous header
      activateCell("header", -1, cellIndex - 1);
    } else {
      // If last header and going forward, go to first cell in first row
      if (cellIndex === tableData.value.headers.length - 1) {
        if (tableData.value.rows.length > 0) {
          activateCell("cell", 0, 0);
        }
      } else {
        // Otherwise go to next header
        activateCell("header", -1, cellIndex + 1);
      }
    }
  } else {
    if (reverse) {
      // If first cell in row and going backward
      if (cellIndex === 0) {
        // If first row, go to last header
        if (rowIndex === 0) {
          activateCell("header", -1, tableData.value.headers.length - 1);
        } else {
          // Otherwise go to last cell in previous row
          activateCell(
            "cell",
            rowIndex - 1,
            tableData.value.rows[rowIndex - 1].length - 1,
          );
        }
      } else {
        // Otherwise go to previous cell in same row
        activateCell("cell", rowIndex, cellIndex - 1);
      }
    } else {
      // If last cell in row and going forward
      if (cellIndex === tableData.value.rows[rowIndex].length - 1) {
        // If last row, stay there
        if (rowIndex === tableData.value.rows.length - 1) return;

        // Otherwise go to first cell in next row
        activateCell("cell", rowIndex + 1, 0);
      } else {
        // Otherwise go to next cell in same row
        activateCell("cell", rowIndex, cellIndex + 1);
      }
    }
  }
}

function navigateToCellBelow() {
  if (!activeCellPosition.value) return;

  const { type, rowIndex, cellIndex } = activeCellPosition.value;

  // Save current cell content
  updateCellContent();

  // Navigate to cell below
  if (type === "header") {
    // If in header, go to same column in first row
    if (tableData.value.rows.length > 0) {
      activateCell("cell", 0, cellIndex);
    }
  } else {
    // If not last row, go to same column in next row
    if (rowIndex < tableData.value.rows.length - 1) {
      activateCell("cell", rowIndex + 1, cellIndex);
    }
  }
}

// Table editing mode
function startEditing() {
  isEditingActive.value = true;
}

function finishEditing() {
  // Save any active cell content
  if (activeCellPosition.value) {
    updateCellContent();
  }

  // Clear selection and active cell
  selectedCells.value = [];
  activeCellPosition.value = null;

  // Exit editing mode
  isEditingActive.value = false;
}

// Cell formatting
function updateActiveCellFormatting() {
  // Reset formatting
  activeCellFormatting.value = {
    bold: false,
    italic: false,
    underline: false,
    align: "left",
  };

  // If no cells selected, return
  if (selectedCells.value.length === 0) return;

  // Get formatting of first selected cell
  const firstCell = selectedCells.value[0];
  let formatting: CellFormatting;

  if (firstCell.type === "header") {
    formatting = getHeaderFormatting(firstCell.cellIndex);
  } else {
    formatting = getCellFormatting(firstCell.rowIndex, firstCell.cellIndex);
  }

  // Update active formatting
  activeCellFormatting.value = {
    bold: formatting.bold || false,
    italic: formatting.italic || false,
    underline: formatting.underline || false,
    align: formatting.align || "left",
  };
}

function applyFormatting(property: "bold" | "italic" | "underline") {
  // Toggle the formatting property
  activeCellFormatting.value[property] = !activeCellFormatting.value[property];

  // Apply to all selected cells
  applyFormattingToSelectedCells();
}

function applyAlignment(alignment: "left" | "center" | "right") {
  // Set the alignment
  activeCellFormatting.value.align = alignment;

  // Apply to all selected cells
  applyFormattingToSelectedCells();
}

function applyFormattingToSelectedCells() {
  // If no cells selected, return
  if (selectedCells.value.length === 0) return;

  // Create updated element
  const updatedElement = { ...props.element };

  // Ensure formatting arrays exist
  if (!updatedElement.content.headerFormatting) {
    updatedElement.content.headerFormatting = [];
  }

  if (!updatedElement.content.cellFormatting) {
    updatedElement.content.cellFormatting = [];
  }

  // Apply formatting to each selected cell
  for (const cell of selectedCells.value) {
    if (cell.type === "header") {
      // Ensure header formatting array is long enough
      while (updatedElement.content.headerFormatting.length <= cell.cellIndex) {
        updatedElement.content.headerFormatting.push({});
      }

      // Apply formatting
      updatedElement.content.headerFormatting[cell.cellIndex] = {
        ...updatedElement.content.headerFormatting[cell.cellIndex],
        ...activeCellFormatting.value,
      };
    } else {
      // Ensure cell formatting array for this row exists
      while (updatedElement.content.cellFormatting.length <= cell.rowIndex) {
        updatedElement.content.cellFormatting.push([]);
      }

      // Ensure cell formatting array for this cell exists
      while (
        updatedElement.content.cellFormatting[cell.rowIndex].length <=
        cell.cellIndex
      ) {
        updatedElement.content.cellFormatting[cell.rowIndex].push({});
      }

      // Apply formatting
      updatedElement.content.cellFormatting[cell.rowIndex][cell.cellIndex] = {
        ...updatedElement.content.cellFormatting[cell.rowIndex][cell.cellIndex],
        ...activeCellFormatting.value,
      };
    }
  }

  // Update element
  emit("update:element", updatedElement);
}

// Table structure operations
function addRowAbove() {
  // Get index of first selected row or 0
  const rowIndex =
    selectedCells.value.length > 0 && selectedCells.value[0].type === "cell"
      ? selectedCells.value[0].rowIndex
      : 0;

  // Create new row with empty cells
  const newRow = new Array(tableData.value.headers.length).fill("");

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    rows: [...updatedElement.content.rows],
  };

  // Insert new row
  updatedElement.content.rows.splice(rowIndex, 0, newRow);

  // Update element
  emit("update:element", updatedElement);
}

function addRowBelow() {
  // Get index of last selected row or last row
  const rowIndex =
    selectedCells.value.length > 0 && selectedCells.value[0].type === "cell"
      ? selectedCells.value[0].rowIndex
      : tableData.value.rows.length - 1;

  // Create new row with empty cells
  const newRow = new Array(tableData.value.headers.length).fill("");

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    rows: [...updatedElement.content.rows],
  };

  // Insert new row
  updatedElement.content.rows.splice(rowIndex + 1, 0, newRow);

  // Update element
  emit("update:element", updatedElement);
}

function deleteRow() {
  // Get index of selected row or last row
  const rowIndex =
    selectedCells.value.length > 0 && selectedCells.value[0].type === "cell"
      ? selectedCells.value[0].rowIndex
      : tableData.value.rows.length - 1;

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    rows: [...updatedElement.content.rows],
  };

  // Remove row
  updatedElement.content.rows.splice(rowIndex, 1);

  // Update element
  emit("update:element", updatedElement);

  // Clear selection if it contained the deleted row
  selectedCells.value = selectedCells.value.filter(
    (cell) => cell.type !== "cell" || cell.rowIndex !== rowIndex,
  );

  // Clear active cell if it was in the deleted row
  if (
    activeCellPosition.value &&
    activeCellPosition.value.type === "cell" &&
    activeCellPosition.value.rowIndex === rowIndex
  ) {
    activeCellPosition.value = null;
  }
}

function addColumnLeft() {
  // Get index of first selected column or 0
  const columnIndex =
    selectedCells.value.length > 0 ? selectedCells.value[0].cellIndex : 0;

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    headers: [...updatedElement.content.headers],
    rows: updatedElement.content.rows.map((row: any[]) => [...row]),
  };

  // Insert new header
  updatedElement.content.headers.splice(columnIndex, 0, "New Column");

  // Insert empty cell in each row
  updatedElement.content.rows.forEach((row: any[]) => {
    row.splice(columnIndex, 0, "");
  });

  // Update element
  emit("update:element", updatedElement);
}

function addColumnRight() {
  // Get index of last selected column or last column
  const columnIndex =
    selectedCells.value.length > 0
      ? selectedCells.value[0].cellIndex
      : tableData.value.headers.length - 1;

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    headers: [...updatedElement.content.headers],
    rows: updatedElement.content.rows.map((row: any[]) => [...row]),
  };

  // Insert new header
  updatedElement.content.headers.splice(columnIndex + 1, 0, "New Column");

  // Insert empty cell in each row
  updatedElement.content.rows.forEach((row: any[]) => {
    row.splice(columnIndex + 1, 0, "");
  });

  // Update element
  emit("update:element", updatedElement);
}

function deleteColumn() {
  // Get index of selected column or last column
  const columnIndex =
    selectedCells.value.length > 0
      ? selectedCells.value[0].cellIndex
      : tableData.value.headers.length - 1;

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    headers: [...updatedElement.content.headers],
    rows: updatedElement.content.rows.map((row: any[]) => [...row]),
  };

  // Remove header
  updatedElement.content.headers.splice(columnIndex, 1);

  // Remove cell from each row
  updatedElement.content.rows.forEach((row: any[]) => {
    row.splice(columnIndex, 1);
  });

  // Update element
  emit("update:element", updatedElement);

  // Clear selection if it contained the deleted column
  selectedCells.value = selectedCells.value.filter(
    (cell) => cell.cellIndex !== columnIndex,
  );

  // Clear active cell if it was in the deleted column
  if (
    activeCellPosition.value &&
    activeCellPosition.value.cellIndex === columnIndex
  ) {
    activeCellPosition.value = null;
  }
}

// Context menu actions
function contextMenuAction(action: string) {
  showContextMenu.value = false;

  switch (action) {
  case "merge":
    mergeCells();
    break;
  case "split":
    splitCell();
    break;
  case "insertRowAbove":
    addRowAbove();
    break;
  case "insertRowBelow":
    addRowBelow();
    break;
  case "insertColumnLeft":
    addColumnLeft();
    break;
  case "insertColumnRight":
    addColumnRight();
    break;
  case "deleteRow":
    deleteRow();
    break;
  case "deleteColumn":
    deleteColumn();
    break;
  }
}

function mergeCells() {
  // Not implemented yet - would require more complex table structure
  console.log("Merge cells not implemented yet");
}

function splitCell() {
  // Not implemented yet - would require more complex table structure
  console.log("Split cell not implemented yet");
}

// Event listeners for context menu
onMounted(() => {
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("contextmenu", handleContextMenu);
  document.removeEventListener("click", handleDocumentClick);
});

function handleContextMenu(event: MouseEvent) {
  // Prevent default context menu if target is part of this component
  if (
    event.target &&
    (event.target as HTMLElement).closest(".table-element") ===
      event.currentTarget
  ) {
    event.preventDefault();
  }
}

function handleDocumentClick() {
  // Hide context menu when clicking elsewhere
  showContextMenu.value = false;
}
</script>

