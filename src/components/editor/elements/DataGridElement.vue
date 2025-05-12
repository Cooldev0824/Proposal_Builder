<template>
  <div
    class="data-grid-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
  >
    <div class="grid-container">
      <AgGridVue
        class="ag-theme-alpine"
        :columnDefs="columnDefs"
        :rowData="rowData"
        :defaultColDef="defaultColDef"
        :style="gridStyle"
        @grid-ready="onGridReady"
        @cell-value-changed="onCellValueChanged"
      />
    </div>
    <div v-if="isSelected" class="resize-handle" @mousedown.stop="startResize"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { DocumentElement, ElementContent } from "../../../types/document";
import type { GridApi, ColumnApi } from "ag-grid-community";

const props = defineProps<{
  element: DocumentElement
  isSelected: boolean
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void
}>();

// Grid state
const gridApi = ref<GridApi | null>(null);
const columnApi = ref<ColumnApi | null>(null);

// Drag & drop functionality
let isDragging = false;
let startX = 0;
let startY = 0;
let startLeft = 0;
let startTop = 0;

// Resize functionality
let isResizing = false;
let startWidth = 0;
let startHeight = 0;

const elementStyle = computed(() => {
  return {
    left: `${props.element.position.x}px`,
    top: `${props.element.position.y}px`,
    width: `${props.element.size.width}px`,
    height: `${props.element.size.height}px`,
    backgroundColor: "white",
    borderRadius: "4px",
    border: props.isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
    zIndex: props.element.zIndex ?? 0,
  };
});

const gridStyle = computed(() => {
  return {
    width: "100%",
    height: "100%",
  };
});

const defaultColDef = {
  flex: 1,
  minWidth: 100,
  editable: true,
  resizable: true,
  sortable: true,
  filter: true,
};

interface ColumnDefinition {
  field: string;
  headerName: string;
}

const columnDefs = computed(() => {
  return (props.element.content as ElementContent).columns.map((col: ColumnDefinition) => ({
    field: col.field,
    headerName: col.headerName,
  }));
});

const rowData = computed(() => (props.element.content as ElementContent).rows);

interface GridReadyEvent {
  api: GridApi;
  columnApi: ColumnApi;
}

interface CellValueChangedEvent {
  data: Record<string, unknown>;
  rowIndex: number;
  column: {
    colId: string;
  };
  newValue: unknown;
}

function onGridReady(params: GridReadyEvent) {
  gridApi.value = params.api;
  columnApi.value = params.columnApi;
  params.api.sizeColumnsToFit();
}

function onCellValueChanged(_params: CellValueChangedEvent) {
  // Instead of using deprecated getModel().getRowData()
  // Get all row data directly from the API
  if (gridApi.value) {
    const updatedRows: Record<string, unknown>[] = [];
    gridApi.value.forEachNode((node) => {
      if (node.data) {
        updatedRows.push(node.data);
      }
    });

    const updatedElement = {
      ...props.element,
      content: {
        ...(props.element.content as ElementContent),
        rows: updatedRows,
      },
    };
    emit("update:element", updatedElement);
  }
}

function startDrag(event: MouseEvent) {
  if (event.target instanceof HTMLElement &&
      (event.target.classList.contains("ag-cell") ||
       event.target.classList.contains("ag-header-cell"))) {
    return;
  }

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

function startResize(event: MouseEvent) {
  isResizing = true;
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
    width: Math.max(400, startWidth + deltaX),
    height: Math.max(200, startHeight + deltaY),
  };

  const updatedElement = {
    ...props.element,
    size: newSize,
  };

  emit("update:element", updatedElement);

  if (gridApi.value) {
    setTimeout(() => {
      gridApi.value?.sizeColumnsToFit();
    }, 0);
  }
}

function stopResize() {
  isResizing = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
}

onMounted(() => {
  if (gridApi.value) {
    gridApi.value.sizeColumnsToFit();
  }
});
</script>

<style scoped lang="scss">
.data-grid-element {
  position: absolute;
  cursor: move;
  overflow: hidden;

  &.selected {
    outline: none;
  }
}

.grid-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--primary);
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
  z-index: 1;
  border-radius: 2px;
}

:deep(.ag-theme-alpine) {
  --ag-header-height: 40px;
  --ag-header-foreground-color: var(--text-primary);
  --ag-header-background-color: var(--surface);
  --ag-header-cell-hover-background-color: var(--surface);
  --ag-header-cell-moving-background-color: var(--surface);

  .ag-header-cell {
    font-weight: 500;
  }

  .ag-cell {
    font-size: 14px;
  }
}
</style>