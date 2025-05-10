<script setup lang="ts">
// 1. Imports
import { ref, watch } from "vue";
import { DocumentElement } from "../../types/document";
import TextProperties from "./properties/TextProperties.vue";
import ImageProperties from "./properties/ImageProperties.vue";
import ShapeProperties from "./properties/ShapeProperties.vue";
import TableProperties from "./properties/TableProperties.vue";
import FormProperties from "./properties/FormProperties.vue";

// Import styles
import "../../assets/styles/components/propertiesPanel.scss";

// 2. Functions
function getPropertiesComponent(type: string) {
  switch (type) {
    case "text":
      return TextProperties;
    case "image":
      return ImageProperties;
    case "shape":
      return ShapeProperties;
    case "table":
      return TableProperties;
    case "form":
      return FormProperties;
    default:
      return null;
  }
}

function formatElementType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1) + " Element";
}

// 3. Hooks and Reactive State
const props = defineProps<{
  selectedElement: DocumentElement | null;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
  (e: "delete-element", element: DocumentElement): void;
  (e: "duplicate-element", element: DocumentElement): void;
}>();

const position = ref({ x: 0, y: 0 });
const size = ref({ width: 0, height: 0 });

watch(
  () => props.selectedElement,
  (newValue) => {
    if (newValue) {
      position.value = { ...newValue.position };
      size.value = { ...newValue.size };
    }
  },
  { immediate: true, deep: true }
);

// Simplified update functions
function updatePosition() {
  if (!props.selectedElement) return;
  emit("update:element", {
    ...props.selectedElement,
    position: { ...position.value },
  });
}

function updateSize() {
  if (!props.selectedElement) return;
  emit("update:element", {
    ...props.selectedElement,
    size: { ...size.value },
  });
}

function updateElement(element: DocumentElement) {
  emit("update:element", element);
}

function deleteElement() {
  if (!props.selectedElement) return;
  emit("delete-element", props.selectedElement);
}

function duplicateElement() {
  if (!props.selectedElement) return;
  emit("duplicate-element", props.selectedElement);
}
</script>

<template>
  <div v-if="selectedElement" class="properties-panel">
    <div class="panel-header">
      <h3 class="panel-title">Properties</h3>
    </div>

    <div class="panel-content">
      <div class="element-type">
        {{ formatElementType(selectedElement.type) }}
      </div>

      <v-divider class="my-4"></v-divider>

      <!-- Position and size controls -->
      <div class="property-group">
        <div class="property-group-title">Position & Size</div>
        <div class="property-row">
          <v-text-field
            v-model.number="position.x"
            label="X"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            class="position-input"
            @update:model-value="updatePosition"
          ></v-text-field>
          <v-text-field
            v-model.number="position.y"
            label="Y"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            class="position-input"
            @update:model-value="updatePosition"
          ></v-text-field>
        </div>
        <div class="property-row">
          <v-text-field
            v-model.number="size.width"
            label="Width"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            class="position-input"
            @update:model-value="updateSize"
          ></v-text-field>
          <v-text-field
            v-model.number="size.height"
            label="Height"
            type="number"
            density="compact"
            variant="outlined"
            hide-details
            class="position-input"
            @update:model-value="updateSize"
          ></v-text-field>
        </div>
      </div>

      <v-divider class="my-4"></v-divider>

      <!-- Element-specific properties -->
      <component
        :is="getPropertiesComponent(selectedElement.type)"
        :element="selectedElement"
        @update:element="updateElement"
      />

      <v-divider class="my-4"></v-divider>

      <!-- Actions -->
      <div class="property-group">
        <div class="property-group-title">Actions</div>
        <div class="actions-row">
          <v-btn color="primary" block @click="duplicateElement">
            <v-icon left>mdi-content-duplicate</v-icon>
            Duplicate
          </v-btn>
        </div>
        <div class="actions-row">
          <v-btn color="error" block @click="deleteElement">
            <v-icon left>mdi-delete</v-icon>
            Delete
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>
