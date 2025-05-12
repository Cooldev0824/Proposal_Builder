<template>
  <div class="property-group">
    <div class="property-group-title">Grid Properties</div>
    
    <div class="section-title mt-4">Cells</div>
    <draggable 
      v-model="cells"
      item-key="id"
      handle=".drag-handle"
      class="cells-list mb-4"
    >
      <template #item="{ element: cell, index }">
        <div class="cell-row">
          <v-icon size="small" class="drag-handle" color="grey">mdi-drag</v-icon>
          <v-select
            v-model="cell.type"
            :items="['text', 'image']"
            density="compact"
            hide-details
            variant="outlined"
            class="cell-type"
            @update:model-value="updateCells"
          ></v-select>
          <v-text-field
            v-model.number="cell.size"
            type="number"
            min="1"
            max="12"
            density="compact"
            hide-details
            variant="outlined"
            class="cell-size"
            @update:model-value="updateCells"
          ></v-text-field>
          <v-btn icon
                 size="small"
                 color="error"
                 @click="removeCell(index)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </template>
    </draggable>
    
    <v-btn block class="mb-4" @click="addCell">
      <v-icon left>mdi-plus</v-icon>
      Add Cell
    </v-btn>
    
    <v-divider class="my-4"></v-divider>
    
    <div class="section-title">Style</div>
    <v-text-field
      v-model="borderColor"
      label="Border Color"
      type="color"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateStyle"
    ></v-text-field>
    
    <v-text-field
      v-model="backgroundColor"
      label="Background Color"
      type="color"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateStyle"
    ></v-text-field>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import draggable from "vuedraggable";
import type { DocumentElement } from "../../../types/document";

const props = defineProps<{
  element: DocumentElement
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void
}>();

const cells = ref(props.element.content.cells.map((cell) => ({
  ...cell,
  id: crypto.randomUUID(),
})));
const borderColor = ref(props.element.style?.borderColor || "#E2E8F0");
const backgroundColor = ref(props.element.style?.backgroundColor || "white");

watch(() => props.element, (newValue) => {
  cells.value = newValue.content.cells.map((cell) => ({
    ...cell,
    id: crypto.randomUUID(),
  }));
  borderColor.value = newValue.style?.borderColor || "#E2E8F0";
  backgroundColor.value = newValue.style?.backgroundColor || "white";
}, { deep: true });

function updateCells() {
  const updatedElement = {
    ...props.element,
    content: {
      cells: cells.value.map(({ id, ...cell }) => cell),
    },
  };
  emit("update:element", updatedElement);
}

function addCell() {
  cells.value.push({
    id: crypto.randomUUID(),
    type: "text",
    content: "",
    size: 1,
  });
  updateCells();
}

function removeCell(index: number) {
  cells.value.splice(index, 1);
  updateCells();
}

function updateStyle() {
  const updatedElement = {
    ...props.element,
    style: {
      ...props.element.style,
      borderColor: borderColor.value,
      backgroundColor: backgroundColor.value,
    },
  };
  emit("update:element", updatedElement);
}
</script>

<style scoped lang="scss">
.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.cells-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cell-row {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .drag-handle {
    cursor: move;
  }
  
  .cell-type {
    flex: 2;
  }
  
  .cell-size {
    width: 80px;
  }
}
</style>