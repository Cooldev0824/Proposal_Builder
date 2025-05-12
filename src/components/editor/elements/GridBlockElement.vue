<template>
  <div
    class="grid-block-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
  >
    <div class="grid-content" :style="gridContentStyle">
      <div
        v-for="(cell, index) in element?.content?.cells || []"
        :key="cell.id"
        class="grid-cell"
        :style="getCellStyle(cell)"
      >
        <div class="cell-content">
          <component
            :is="getElementComponent(element.type)"
            v-for="element in cell?.elements || []"
            :key="element.id"
            :element="element"
            :isSelected="selectedElement?.id === element.id"
            @click.stop="selectElement(element)"
            @update:element="updateCellElement(index, element)"
          />

          <div
            v-if="cell.elements.length === 0"
            class="empty-cell"
            @click="openAddElementDialog(index)"
          >
            <v-icon size="32" color="grey">mdi-plus</v-icon>
            <span>Add Element</span>
          </div>
        </div>

        <div
          v-if="index < element.content.cells.length - 1"
          class="resize-divider"
          @mousedown.stop="startCellResize(index)"
        ></div>
      </div>
    </div>

    <div
      v-if="isSelected"
      class="resize-handle"
      @mousedown.stop="startResize"
    ></div>

    <!-- Add Element Dialog -->
    <v-dialog v-model="addElementDialog" max-width="400">
      <v-card>
        <v-card-title>Add Element</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="type in elementTypes || []"
              :key="type"
              class="element-type-item"
              @click="addElement(type)"
            >
              <template v-slot:prepend>
                <v-icon :icon="getElementIcon(type)"></v-icon>
              </template>
              <v-list-item-title>{{
                formatElementType(type)
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from "vue";
import type { DocumentElement, GridCell } from "../../../types/document";

// Import element components
const TextElement = defineAsyncComponent(() => import("./TextElement.vue"));
const ImageElement = defineAsyncComponent(() => import("./ImageElement.vue"));
const ShapeElement = defineAsyncComponent(() => import("./ShapeElement.vue"));
const TableElement = defineAsyncComponent(
  () => import("./SimpleTableElement.vue"),
);
const SignatureElement = defineAsyncComponent(
  () => import("./SignatureElement.vue"),
);

const props = defineProps<{
  element: DocumentElement;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

// State
const selectedElement = ref<DocumentElement | null>(null);
const addElementDialog = ref(false);
const editingCellIndex = ref(-1);

// Available element types
const elementTypes = ["text", "image", "shape", "table", "signature"];

// Styles
const elementStyle = computed(() => ({
  left: `${props.element.position.x}px`,
  top: `${props.element.position.y}px`,
  width: `${props.element.size.width}px`,
  height: `${props.element.size.height}px`,
  backgroundColor: props.element.style?.backgroundColor || "white",
  borderRadius: "4px",
  border: props.isSelected
    ? "2px solid var(--primary)"
    : "1px solid var(--border)",
  zIndex: props.element.zIndex ?? 0,
}));

const gridContentStyle = computed(() => ({
  gap: `${props.element.style?.gap || 8}px`,
}));

// Drag & resize state
let isDragging = false;
let startX = 0;
let startY = 0;
let startLeft = 0;
let startTop = 0;
let isResizing = false;
let startWidth = 0;
let startHeight = 0;
let isResizingCell = false;
let resizingCellIndex = -1;
let startCellSizes: number[] = [];
let startClientX = 0;

function getElementComponent(type: string) {
  switch (type) {
  case "text":
    return TextElement;
  case "image":
    return ImageElement;
  case "shape":
    return ShapeElement;
  case "table":
    return TableElement;
  case "signature":
    return SignatureElement;
  default:
    return null;
  }
}

function getElementIcon(type: string) {
  switch (type) {
  case "text":
    return "mdi-format-text";
  case "image":
    return "mdi-image";
  case "shape":
    return "mdi-shape";
  case "table":
    return "mdi-table";
  case "signature":
    return "mdi-draw";
  default:
    return "mdi-help";
  }
}

function formatElementType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getCellStyle(cell: GridCell) {
  return {
    flex: cell.size,
    minHeight: "100px",
    position: "relative",
  };
}

function openAddElementDialog(index: number) {
  editingCellIndex.value = index;
  addElementDialog.value = true;
}

function addElement(type: string) {
  if (editingCellIndex.value === -1) return;

  const newElement: DocumentElement = {
    id: `${type}-${Date.now()}`,
    type,
    content: type === "text" ? "New text" : "",
    position: { x: 0, y: 0 },
    size: { width: "100%", height: type === "text" ? 100 : 200 },
  };

  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      cells: [...props.element.content.cells],
    },
  };

  updatedElement.content.cells[editingCellIndex.value].elements.push(
    newElement,
  );
  emit("update:element", updatedElement);

  addElementDialog.value = false;
  editingCellIndex.value = -1;
}

function updateCellElement(cellIndex: number, element: DocumentElement) {
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      cells: [...props.element.content.cells],
    },
  };

  const elementIndex = updatedElement.content.cells[
    cellIndex
  ].elements.findIndex((e) => e.id === element.id);

  if (elementIndex >= 0) {
    updatedElement.content.cells[cellIndex].elements[elementIndex] = element;
    emit("update:element", updatedElement);
  }
}

function selectElement(element: DocumentElement) {
  selectedElement.value = element;
}

// Drag & resize handlers
function startDrag(event: MouseEvent) {
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

  emit("update:element", {
    ...props.element,
    position: {
      x: startLeft + deltaX,
      y: startTop + deltaY,
    },
  });
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

  emit("update:element", {
    ...props.element,
    size: {
      width: Math.max(300, startWidth + deltaX),
      height: Math.max(200, startHeight + deltaY),
    },
  });
}

function stopResize() {
  isResizing = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
}

function startCellResize(index: number) {
  isResizingCell = true;
  resizingCellIndex = index;
  startClientX = event?.clientX || 0;
  startCellSizes = props.element.content.cells.map((cell) => cell.size);

  document.addEventListener("mousemove", onCellResize);
  document.addEventListener("mouseup", stopCellResize);
}

function onCellResize(event: MouseEvent) {
  if (!isResizingCell || resizingCellIndex === -1) return;

  const deltaX = event.clientX - startClientX;
  const containerWidth = props.element.size.width;
  const sizeDelta = (deltaX / containerWidth) * 2;

  const updatedCells = [...props.element.content.cells];
  const currentCell = updatedCells[resizingCellIndex];
  const nextCell = updatedCells[resizingCellIndex + 1];

  currentCell.size = Math.max(
    0.1,
    startCellSizes[resizingCellIndex] + sizeDelta,
  );
  nextCell.size = Math.max(
    0.1,
    startCellSizes[resizingCellIndex + 1] - sizeDelta,
  );

  emit("update:element", {
    ...props.element,
    content: {
      ...props.element.content,
      cells: updatedCells,
    },
  });
}

function stopCellResize() {
  isResizingCell = false;
  resizingCellIndex = -1;
  document.removeEventListener("mousemove", onCellResize);
  document.removeEventListener("mouseup", stopCellResize);
}
</script>

<style scoped lang="scss">
.grid-block-element {
  position: absolute;
  cursor: move;
  overflow: hidden;

  &.selected {
    outline: none;
  }
}

.grid-content {
  display: flex;
  height: 100%;
}

.grid-cell {
  display: flex;
  flex-direction: column;
  position: relative;
  border-right: 1px solid var(--border);

  &:last-child {
    border-right: none;
  }
}

.cell-content {
  flex: 1;
  min-height: 100px;
  position: relative;
}

.empty-cell {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #f5f5f5;
  cursor: pointer;

  &:hover {
    background-color: #eee;
  }
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

.resize-divider {
  position: absolute;
  top: 0;
  right: -3px;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 2;

  &:hover {
    background-color: var(--primary);
  }

  &:active {
    background-color: var(--primary);
  }
}

.element-type-item {
  cursor: pointer;

  &:hover {
    background-color: var(--surface);
  }
}
</style>
