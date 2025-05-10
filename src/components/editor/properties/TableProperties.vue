<template>
  <div class="property-group">
    <div class="property-group-title">Table Properties</div>

    <!-- Border Style -->
    <div class="section-title mt-4">Border Style</div>
    <v-select
      v-model="borderStyle"
      label="Border Style"
      :items="['solid', 'dashed', 'dotted']"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateBorderStyle"
    ></v-select>

    <v-text-field
      v-model.number="borderWidth"
      label="Border Width"
      type="number"
      min="0"
      max="5"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateBorderWidth"
    ></v-text-field>

    <div class="mb-4">
      <label class="color-label">Border Color</label>
      <AdvancedColorPicker
        v-model="borderColor"
        @update:model-value="updateBorderColor"
      />
    </div>

    <!-- Header Style -->
    <div class="section-title mt-4">Header Style</div>
    <div class="mb-4">
      <label class="color-label">Header Background Color</label>
      <AdvancedColorPicker
        v-model="headerBackgroundColor"
        @update:model-value="updateHeaderBackgroundColor"
      />
    </div>

    <div class="mb-4">
      <label class="color-label">Header Text Color</label>
      <AdvancedColorPicker
        v-model="headerTextColor"
        @update:model-value="updateHeaderTextColor"
      />
    </div>

    <!-- Cell Style -->
    <div class="section-title mt-4">Cell Style</div>
    <div class="mb-4">
      <label class="color-label">Cell Background Color</label>
      <AdvancedColorPicker
        v-model="cellBackgroundColor"
        @update:model-value="updateCellBackgroundColor"
      />
    </div>

    <div class="mb-4">
      <label class="color-label">Cell Text Color</label>
      <AdvancedColorPicker
        v-model="cellTextColor"
        @update:model-value="updateCellTextColor"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { DocumentElement } from "../../../types/document";
import AdvancedColorPicker from "../AdvancedColorPicker.vue";

const props = defineProps<{
  element: DocumentElement;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

const borderStyle = ref(props.element.style?.borderStyle || "solid");
const borderWidth = ref(props.element.style?.borderWidth || 1);
const borderColor = ref(props.element.style?.borderColor || "#E2E8F0");
const headerBackgroundColor = ref(
  props.element.style?.headerBackgroundColor || "#F8F9FA"
);
const headerTextColor = ref(props.element.style?.headerTextColor || "#000000");
const cellBackgroundColor = ref(
  props.element.style?.cellBackgroundColor || "#FFFFFF"
);
const cellTextColor = ref(props.element.style?.cellTextColor || "#000000");

watch(
  () => props.element,
  (newValue) => {
    borderStyle.value = newValue.style?.borderStyle || "solid";
    borderWidth.value = newValue.style?.borderWidth || 1;
    borderColor.value = newValue.style?.borderColor || "#E2E8F0";
    headerBackgroundColor.value =
      newValue.style?.headerBackgroundColor || "#F8F9FA";
    headerTextColor.value = newValue.style?.headerTextColor || "#000000";
    cellBackgroundColor.value =
      newValue.style?.cellBackgroundColor || "#FFFFFF";
    cellTextColor.value = newValue.style?.cellTextColor || "#000000";
  },
  { deep: true }
);

function updateElement(updates: Partial<typeof props.element.style>) {
  emit("update:element", {
    ...props.element,
    style: {
      ...props.element.style,
      ...updates,
    },
  });
}

// Function to update all table properties at once
function updateAllProperties() {
  const updates: Partial<typeof props.element.style> = {
    borderStyle: borderStyle.value,
    borderWidth: borderWidth.value,
    borderColor: borderColor.value,
    headerBackgroundColor: headerBackgroundColor.value,
    headerTextColor: headerTextColor.value,
    cellBackgroundColor: cellBackgroundColor.value,
    cellTextColor: cellTextColor.value,
  };

  updateElement(updates);
}

// Use this single function for all property updates
function updateBorderStyle() {
  updateAllProperties();
}

function updateBorderWidth() {
  updateAllProperties();
}

function updateBorderColor() {
  updateAllProperties();
}

function updateHeaderBackgroundColor() {
  updateAllProperties();
}

function updateHeaderTextColor() {
  updateAllProperties();
}

function updateCellBackgroundColor() {
  updateAllProperties();
}

function updateCellTextColor() {
  updateAllProperties();
}
</script>

<style scoped lang="scss">
.section-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.color-label {
  font-size: 12px;
  color: var(--text-secondary, #666);
  margin-bottom: 4px;
}

.property-row {
  margin-bottom: 8px;
}
</style>
