<template>
  <div
    class="image-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
  >
    <img
      :src="element.content"
      alt="Image"
      class="element-image"
      :style="imageStyle"
      @error="handleImageError"
    />
    <div v-if="!element.content || imageError" class="image-placeholder">
      <v-icon size="32" color="grey">mdi-image</v-icon>
      <span>No image selected</span>
    </div>
    <div
      v-if="isSelected"
      class="resize-handle"
      @mousedown.stop="startResize"
    ></div>
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

const imageError = ref(false);

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
    borderRadius: `${props.element.style?.borderRadius || 0}px`,
    border: props.element.style?.borderWidth
      ? `${props.element.style.borderWidth}px solid ${props.element.style.borderColor}`
      : "none",
    opacity: props.element.style?.opacity || 1,
    backgroundColor: props.element.style?.backgroundColor || "#f5f5f5",
    zIndex: props.element.zIndex ?? 0,
  };
});

const imageStyle = computed(() => {
  return {
    objectFit: props.element.style?.objectFit || "cover",
    display: imageError.value ? "none" : "block",
  };
});

function handleImageError() {
  imageError.value = true;
}

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

  // Calculate new position
  let newX = startLeft + deltaX;
  let newY = startTop + deltaY;

  // Snap to grid (10px grid)
  const gridSize = 10;
  newX = Math.round(newX / gridSize) * gridSize;
  newY = Math.round(newY / gridSize) * gridSize;

  const newPosition = {
    x: newX,
    y: newY,
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

  // Maintain aspect ratio by default
  const aspectRatio = startWidth / startHeight;
  let newWidth = Math.max(50, startWidth + deltaX);
  let newHeight = Math.max(50, newWidth / aspectRatio);

  // Snap to grid (10px grid)
  const gridSize = 10;
  newWidth = Math.round(newWidth / gridSize) * gridSize;
  newHeight = Math.round(newHeight / gridSize) * gridSize;

  const newSize = {
    width: newWidth,
    height: newHeight,
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
.element {
  position: absolute;
  cursor: move;

  &.selected {
    outline: 2px solid var(--primary);
  }
}

.image-element {
  overflow: hidden;

  .element-image {
    width: 100%;
    height: 100%;
  }

  .image-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #666;
    font-size: 14px;
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
}
</style>
