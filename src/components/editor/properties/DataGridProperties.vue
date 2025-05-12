<template>
  <div class="property-group">
    <div class="property-group-title">Data Grid Properties</div>
    
    <div class="section-title mt-4">Columns</div>
    <draggable 
      v-model="columns"
      item-key="field"
      handle=".drag-handle"
      class="columns-list mb-4"
    >
      <template #item="{ element: column }">
        <div class="column-row">
          <v-icon size="small" class="drag-handle" color="grey">mdi-drag</v-icon>
          <v-text-field
            v-model="column.headerName"
            label="Header"
            density="compact"
            hide-details
            variant="outlined"
            class="column-input"
            @update:model-value="updateColumns"
          ></v-text-field>
          <v-btn icon
                 size="small"
                 color="error"
                 @click="removeColumn(column)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </template>
    </draggable>
    
    <v-btn block class="mb-4" @click="addColumn">
      <v-icon left>mdi-plus</v-icon>
      Add Column
    </v-btn>
    
    <v-divider class="my-4"></v-divider>
    
    <div class="section-title">Data</div>
    <v-btn block class="mb-4" @click="addRow">
      <v-icon left>mdi-plus</v-icon>
      Add Row
    </v-btn>
    
    <v-btn block
           color="error"
           class="mb-4"
           @click="clearData"
    >
      <v-icon left>mdi-delete</v-icon>
      Clear All Data
    </v-btn>
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

const columns = ref(props.element.content.columns);

watch(() => props.element.content.columns, (newColumns) => {
  columns.value = [...newColumns];
}, { deep: true });

function updateColumns() {
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      columns: columns.value,
    },
  };
  emit("update:element", updatedElement);
}

function addColumn() {
  const newField = `col${columns.value.length + 1}`;
  columns.value.push({
    field: newField,
    headerName: `Column ${columns.value.length + 1}`,
  });
  
  // Add empty values for the new column to existing rows
  const updatedRows = props.element.content.rows.map((row: any) => ({
    ...row,
    [newField]: "",
  }));
  
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      columns: columns.value,
      rows: updatedRows,
    },
  };
  emit("update:element", updatedElement);
}

function removeColumn(column: any) {
  columns.value = columns.value.filter((col) => col.field !== column.field);
  
  // Remove column data from rows
  const updatedRows = props.element.content.rows.map((row: any) => {
    const newRow = { ...row };
    delete newRow[column.field];
    return newRow;
  });
  
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      columns: columns.value,
      rows: updatedRows,
    },
  };
  emit("update:element", updatedElement);
}

function addRow() {
  const newRow = columns.value.reduce((acc: any, col) => {
    acc[col.field] = "";
    return acc;
  }, {});
  
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      rows: [...props.element.content.rows, newRow],
    },
  };
  emit("update:element", updatedElement);
}

function clearData() {
  const updatedElement = {
    ...props.element,
    content: {
      ...props.element.content,
      rows: [],
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

.columns-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-row {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .drag-handle {
    cursor: move;
  }
  
  .column-input {
    flex: 1;
  }
}
</style>