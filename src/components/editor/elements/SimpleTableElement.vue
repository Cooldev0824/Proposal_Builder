<template>
  <div
    class="table-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
  >
    <!-- Table toolbar (visible when table is selected) -->
    <div v-if="isSelected" class="table-toolbar">
      <div class="toolbar-section">
        <v-btn-group variant="outlined" density="compact">
          <v-btn icon
                 size="small"
                 title="Add row"
                 @click="addRow"
          >
            <v-icon>mdi-table-row-plus-after</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            title="Delete row"
            :disabled="element.content.rows.length <= 1"
            @click="showDeleteRowDialog = true"
          >
            <v-icon>mdi-table-row-remove</v-icon>
          </v-btn>
        </v-btn-group>
      </div>

      <div class="toolbar-section">
        <v-btn-group variant="outlined" density="compact">
          <v-btn icon
                 size="small"
                 title="Add column"
                 @click="addColumn"
          >
            <v-icon>mdi-table-column-plus-after</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            title="Delete column"
            :disabled="element.content.headers.length <= 1"
            @click="showDeleteColumnDialog = true"
          >
            <v-icon>mdi-table-column-remove</v-icon>
          </v-btn>
        </v-btn-group>
      </div>
    </div>

    <!-- Table content -->
    <div class="table-container">
      <table class="editor-table" :style="tableStyle">
        <thead>
          <tr>
            <th
              v-for="(header, index) in element.content.headers"
              :key="index"
              :style="headerStyle"
              @dblclick="editCell('header', index)"
            >
              {{ header }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in element.content.rows" :key="rowIndex">
            <td
              v-for="(cell, cellIndex) in row"
              :key="cellIndex"
              :style="cellStyle"
              @dblclick="editCell('cell', rowIndex, cellIndex)"
            >
              {{ cell }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Resize handle -->
    <div
      v-if="isSelected"
      class="resize-handle"
      @mousedown.stop="startResize"
    ></div>

    <!-- Cell edit dialog -->
    <v-dialog v-model="editDialog" max-width="500">
      <v-card>
        <v-card-title>Edit
          {{ editingCellType === "header" ? "Header" : "Cell" }}</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="editingCellValue"
            variant="outlined"
            auto-focus
            rows="3"
            hide-details
            class="mt-2"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveCellEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Row Dialog -->
    <v-dialog v-model="showDeleteRowDialog" max-width="500">
      <v-card>
        <v-card-title>Delete Row</v-card-title>
        <v-card-text>
          <p>Select the row to delete:</p>
          <v-select
            v-model="rowToDelete"
            :items="rowOptions"
            item-title="text"
            item-value="value"
            variant="outlined"
            density="compact"
            return-object
            class="mt-2"
          ></v-select>

          <!-- Row preview -->
          <div v-if="rowToDelete" class="row-preview mt-4">
            <div class="preview-label">Preview of row to delete:</div>
            <div class="preview-content">
              <div
                v-for="(cell, index) in element.content.rows[rowToDelete.value]"
                :key="index"
                class="preview-cell"
              >
                {{ cell || "(empty)" }}
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteRowDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :disabled="!rowToDelete"
            @click="deleteSelectedRow"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Column Dialog -->
    <v-dialog v-model="showDeleteColumnDialog" max-width="500">
      <v-card>
        <v-card-title>Delete Column</v-card-title>
        <v-card-text>
          <p>Select the column to delete:</p>
          <v-select
            v-model="columnToDelete"
            :items="columnOptions"
            item-title="text"
            item-value="value"
            variant="outlined"
            density="compact"
            return-object
            class="mt-2"
          ></v-select>

          <!-- Column preview -->
          <div v-if="columnToDelete" class="column-preview mt-4">
            <div class="preview-label">Preview of column to delete:</div>
            <div class="preview-content">
              <div class="preview-header">
                {{ element.content.headers[columnToDelete.value] || "(empty)" }}
              </div>
              <div
                v-for="(row, rowIndex) in element.content.rows"
                :key="rowIndex"
                class="preview-cell"
              >
                {{ row[columnToDelete.value] || "(empty)" }}
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showDeleteColumnDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :disabled="!columnToDelete"
            @click="deleteSelectedColumn"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { DocumentElement } from "../../../types/document";

const props = defineProps<{
  element: DocumentElement;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

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

// Cell editing
const editDialog = ref(false);
const editingCellValue = ref("");
const editingCellType = ref<"header" | "cell">("cell");
const editingRowIndex = ref(-1);
const editingCellIndex = ref(-1);

// Row deletion
const showDeleteRowDialog = ref(false);
const rowToDelete = ref<{ text: string; value: number } | null>(null);
const rowOptions = computed(() => {
  return props.element.content.rows.map((row, index) => ({
    text: `Row ${index + 1}`,
    value: index,
  }));
});

// Column deletion
const showDeleteColumnDialog = ref(false);
const columnToDelete = ref<{ text: string; value: number } | null>(null);
const columnOptions = computed(() => {
  return props.element.content.headers.map((header, index) => ({
    text: `Column ${index + 1}: ${header}`,
    value: index,
  }));
});

const elementStyle = computed(() => {
  return {
    left: `${props.element.position.x}px`,
    top: `${props.element.position.y}px`,
    width: `${props.element.size.width}px`,
    minHeight: `${props.element.size.height}px`,
    zIndex: props.element.zIndex ?? 0,
  };
});

const tableStyle = computed(() => {
  const style = props.element.style || {};
  return {
    borderCollapse: "collapse",
    width: "100%",
    borderColor: style.borderColor || "#E2E8F0",
    borderStyle: style.borderStyle || "solid",
    borderWidth: `${style.borderWidth || 1}px`,
  };
});

const headerStyle = computed(() => {
  const style = props.element.style || {};
  return {
    backgroundColor: style.headerBackgroundColor || "#F8F9FA",
    color: style.headerTextColor || "#000000",
    padding: "8px 12px",
    textAlign: "left",
    fontWeight: 500,
    borderColor: style.borderColor || "#E2E8F0",
    borderStyle: style.borderStyle || "solid",
    borderWidth: `${style.borderWidth || 1}px`,
  };
});

const cellStyle = computed(() => {
  const style = props.element.style || {};
  return {
    backgroundColor: style.cellBackgroundColor || "#FFFFFF",
    color: style.cellTextColor || "#000000",
    padding: "8px 12px",
    borderColor: style.borderColor || "#E2E8F0",
    borderStyle: style.borderStyle || "solid",
    borderWidth: `${style.borderWidth || 1}px`,
  };
});

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
    width: Math.max(300, startWidth + deltaX),
    height: Math.max(100, startHeight + deltaY),
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

function editCell(
  type: "header" | "cell",
  rowIndex: number,
  cellIndex?: number,
) {
  editingCellType.value = type;
  editingRowIndex.value = rowIndex;

  if (type === "header") {
    editingCellValue.value = props.element.content.headers[rowIndex];
    editingCellIndex.value = -1;
  } else {
    if (cellIndex !== undefined) {
      editingCellValue.value = props.element.content.rows[rowIndex][cellIndex];
      editingCellIndex.value = cellIndex;
    }
  }

  editDialog.value = true;
}

function saveCellEdit() {
  const updatedElement = { ...props.element };

  if (editingCellType.value === "header") {
    updatedElement.content = {
      ...updatedElement.content,
      headers: [...updatedElement.content.headers],
    };
    updatedElement.content.headers[editingRowIndex.value] =
      editingCellValue.value;
  } else {
    updatedElement.content = {
      ...updatedElement.content,
      rows: [...updatedElement.content.rows],
    };

    updatedElement.content.rows[editingRowIndex.value] = [
      ...updatedElement.content.rows[editingRowIndex.value],
    ];
    updatedElement.content.rows[editingRowIndex.value][editingCellIndex.value] =
      editingCellValue.value;
  }

  emit("update:element", updatedElement);
  editDialog.value = false;
}

// Table structure operations
function addRow() {
  // Create new row with empty cells
  const newRow = new Array(props.element.content.headers.length).fill("");

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    rows: [...updatedElement.content.rows, newRow],
  };

  // Update element
  emit("update:element", updatedElement);
}

function deleteRow() {
  if (props.element.content.rows.length <= 1) return;

  // Show the delete row dialog
  showDeleteRowDialog.value = true;
}

function deleteSelectedRow() {
  if (!rowToDelete.value || props.element.content.rows.length <= 1) return;

  const rowIndex = rowToDelete.value.value;

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    rows: [...updatedElement.content.rows],
  };

  // Remove the selected row
  updatedElement.content.rows.splice(rowIndex, 1);

  // Update element
  emit("update:element", updatedElement);

  // Close dialog and reset selection
  showDeleteRowDialog.value = false;
  rowToDelete.value = null;
}

function addColumn() {
  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    headers: [...updatedElement.content.headers, "New Column"],
    rows: updatedElement.content.rows.map((row) => [...row, ""]),
  };

  // Update element
  emit("update:element", updatedElement);
}

function deleteColumn() {
  if (props.element.content.headers.length <= 1) return;

  // Show the delete column dialog
  showDeleteColumnDialog.value = true;
}

function deleteSelectedColumn() {
  if (!columnToDelete.value || props.element.content.headers.length <= 1)
    return;

  const columnIndex = columnToDelete.value.value;

  // Create updated element
  const updatedElement = { ...props.element };
  updatedElement.content = {
    ...updatedElement.content,
    headers: [...updatedElement.content.headers],
    rows: updatedElement.content.rows.map((row) => [...row]),
  };

  // Remove the selected header
  updatedElement.content.headers.splice(columnIndex, 1);

  // Remove the selected cell from each row
  updatedElement.content.rows.forEach((row) => {
    row.splice(columnIndex, 1);
  });

  // Update element
  emit("update:element", updatedElement);

  // Close dialog and reset selection
  showDeleteColumnDialog.value = false;
  columnToDelete.value = null;
}
</script>

<style scoped lang="scss">
.element {
  position: absolute;
  cursor: move;

  &.selected {
    outline: 2px solid var(--primary);
  }
}

.table-element {
  overflow: visible;
  background-color: white;
}

.table-container {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.editor-table {
  width: 100%;
  border-collapse: collapse;
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
}

// Toolbar
.table-toolbar {
  position: absolute;
  top: -40px;
  left: 0;
  right: 0;
  height: 40px;
  background-color: var(--surface);
  border: 1px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.toolbar-section {
  margin-right: 16px;

  &:last-child {
    margin-right: 0;
    margin-left: auto;
  }
}

// Preview styles for dialogs
.preview-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.preview-content {
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.preview-header {
  background-color: var(--surface-variant);
  padding: 8px 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--border);
}

.preview-cell {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);

  &:last-child {
    border-bottom: none;
  }
}

.row-preview .preview-content {
  display: flex;
  flex-wrap: wrap;

  .preview-cell {
    flex: 1;
    min-width: 100px;
    border-right: 1px solid var(--border);

    &:last-child {
      border-right: none;
    }
  }
}

.column-preview .preview-content {
  max-height: 200px;
  overflow-y: auto;
}
</style>
