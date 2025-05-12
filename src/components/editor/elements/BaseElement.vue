<template>
  <div
    class="base-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
    @click="handleClick"
  >
    <slot></slot>

    <!-- Resize handles -->
    <ResizeHandles
      v-if="isSelected && !isPreview"
      :elementSize="element.size"
      :elementPosition="element.position"
      :minWidth="minWidth"
      :minHeight="minHeight"
      :gridSize="10"
      :aspectRatio="aspectRatio"
      @resize="handleResize"
    />

    <!-- Rotation handle -->
    <div
      v-if="isSelected && !isPreview && showRotateHandle"
      class="rotate-handle"
      @mousedown.stop="startRotate"
    ></div>
  </div>
</template>

<script setup lang="ts">

import type { DocumentElement, Size, Position } from "../../../types/document";
import ResizeHandles from "../ResizeHandles.vue";
import { useElement } from "../../../composables/useElement";

// Import styles
import "../../../assets/styles/components/elements.scss";

const props = defineProps({
  element: {
    type: Object as () => DocumentElement,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  isPreview: {
    type: Boolean,
    default: false,
  },
  minWidth: {
    type: Number,
    default: 20,
  },
  minHeight: {
    type: Number,
    default: 20,
  },
  aspectRatio: {
    type: Number,
    default: undefined,
  },
  showRotateHandle: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
  (e: "click", element: DocumentElement): void;
}>();

// Use the element composable for common functionality
const {
  elementStyle,
  contentElement,
  handleClick,
  startDrag,
  handleResize: baseHandleResize,
  startRotate,
} = useElement(props, emit);

// Custom resize handler that checks if the component has its own resize handler
function handleResize(newSize: Size, newPosition: Position) {
  // If the component has its own resize handler, use that
  if (typeof (props as any).onResize === "function") {
    (props as any).onResize(newSize, newPosition);
  } else {
    // Otherwise use the base handler
    baseHandleResize(newSize, newPosition);
  }
}

// Expose to child components
defineExpose({
  contentElement,
});
</script>
