<template>
  <div
    class="form-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
  >
    <div class="form-content" :style="contentStyle">
      <template v-if="element.content.type === 'checkbox'">
        <div
          v-for="(option, index) in element.content.options"
          :key="index"
          class="checkbox-option"
        >
          <v-checkbox
            v-model="selectedOptions"
            :label="option"
            :value="option"
            density="compact"
            hide-details
          ></v-checkbox>
        </div>
      </template>

      <template v-else-if="element.content.type === 'radio'">
        <v-radio-group
          v-model="selectedOption"
          :inline="element.content.inline"
          density="compact"
          hide-details
        >
          <v-radio
            v-for="(option, index) in element.content.options"
            :key="index"
            :label="option"
            :value="option"
          ></v-radio>
        </v-radio-group>
      </template>

      <template v-else-if="element.content.type === 'select'">
        <v-select
          v-model="selectedOption"
          :items="element.content.options"
          :label="element.content.label"
          density="compact"
          variant="outlined"
          hide-details
        ></v-select>
      </template>

      <template v-else-if="element.content.type === 'textfield'">
        <v-text-field
          v-model="textValue"
          :label="element.content.label"
          :type="element.content.inputType || 'text'"
          density="compact"
          variant="outlined"
          hide-details
        ></v-text-field>
      </template>

      <template v-else-if="element.content.type === 'textarea'">
        <v-textarea
          v-model="textValue"
          :label="element.content.label"
          density="compact"
          variant="outlined"
          hide-details
          auto-grow
        ></v-textarea>
      </template>
    </div>

    <div v-if="isSelected" class="resize-handle" @mousedown.stop="startResize"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { DocumentElement } from "../../../types/document";

const props = defineProps<{
  element: DocumentElement
  isSelected: boolean
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void
}>();

// Form state
const selectedOptions = ref<string[]>([]);
const selectedOption = ref<string>("");
const textValue = ref("");

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
    minHeight: `${props.element.size.height}px`,
    backgroundColor: props.element.style?.backgroundColor || "white",
    borderRadius: "4px",
    border: props.isSelected ? "2px solid var(--primary)" : "1px solid var(--border)",
    zIndex: props.element.zIndex ?? 0,
  };
});

const contentStyle = computed(() => {
  return {
    padding: "16px",
    height: "100%",
  };
});

watch(() => props.element.content, (newContent) => {
  if (newContent.type === "checkbox") {
    selectedOptions.value = [];
  } else if (newContent.type === "radio" || newContent.type === "select") {
    selectedOption.value = newContent.options[0] || "";
  } else {
    textValue.value = "";
  }
}, { deep: true });

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
    width: Math.max(200, startWidth + deltaX),
    height: Math.max(50, startHeight + deltaY),
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
</script>

<style scoped lang="scss">
.form-element {
  position: absolute;
  cursor: move;

  &.selected {
    outline: none;
  }
}

.form-content {
  height: 100%;

  .checkbox-option {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
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
</style>