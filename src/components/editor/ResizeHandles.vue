<template>
  <div class="resize-handles">
    <!-- Corner handles -->
    <div
      class="resize-handle corner top-left"
      @mousedown.stop="startResize('top-left', $event)"
    ></div>
    <div
      class="resize-handle corner top-right"
      @mousedown.stop="startResize('top-right', $event)"
    ></div>
    <div
      class="resize-handle corner bottom-left"
      @mousedown.stop="startResize('bottom-left', $event)"
    ></div>
    <div
      class="resize-handle corner bottom-right"
      @mousedown.stop="startResize('bottom-right', $event)"
    ></div>

    <!-- Edge handles -->
    <div
      class="resize-handle edge top"
      @mousedown.stop="startResize('top', $event)"
    ></div>
    <div
      class="resize-handle edge right"
      @mousedown.stop="startResize('right', $event)"
    ></div>
    <div
      class="resize-handle edge bottom"
      @mousedown.stop="startResize('bottom', $event)"
    ></div>
    <div
      class="resize-handle edge left"
      @mousedown.stop="startResize('left', $event)"
    ></div>
  </div>
</template>

<script setup lang="ts">

import { Size, Position } from '../../types/document';

// Import styles
import '../../assets/styles/components/elements.scss';

type ResizeDirection = 'top-left' | 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left';

const props = defineProps<{
  elementSize: Size;
  elementPosition: Position;
  aspectRatio?: number; // Optional aspect ratio constraint
  minWidth?: number;
  minHeight?: number;
  gridSize?: number;
}>();

const emit = defineEmits<{
  (e: 'resize', newSize: Size, newPosition: Position): void;
}>();

// Default values
const minWidth = props.minWidth || 20;
const minHeight = props.minHeight || 20;
const gridSize = props.gridSize || 10;

// Resize state
let isResizing = false;
let resizeDirection: ResizeDirection | null = null;
let startX = 0;
let startY = 0;
let startWidth = 0;
let startHeight = 0;
let startLeft = 0;
let startTop = 0;

function startResize(direction: ResizeDirection, event: MouseEvent) {
  isResizing = true;
  resizeDirection = direction;
  startX = event.clientX;
  startY = event.clientY;
  startWidth = props.elementSize.width;
  startHeight = props.elementSize.height;
  startLeft = props.elementPosition.x;
  startTop = props.elementPosition.y;

  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);
}

function onResize(event: MouseEvent) {
  if (!isResizing || !resizeDirection) return;

  const deltaX = event.clientX - startX;
  const deltaY = event.clientY - startY;

  let newWidth = startWidth;
  let newHeight = startHeight;
  let newLeft = startLeft;
  let newTop = startTop;

  // Handle resize based on direction
  switch (resizeDirection) {
    case 'top-left':
      newWidth = Math.max(minWidth, startWidth - deltaX);
      newHeight = Math.max(minHeight, startHeight - deltaY);
      newLeft = startLeft + startWidth - newWidth;
      newTop = startTop + startHeight - newHeight;
      break;
    case 'top':
      newHeight = Math.max(minHeight, startHeight - deltaY);
      newTop = startTop + startHeight - newHeight;
      break;
    case 'top-right':
      newWidth = Math.max(minWidth, startWidth + deltaX);
      newHeight = Math.max(minHeight, startHeight - deltaY);
      newTop = startTop + startHeight - newHeight;
      break;
    case 'right':
      newWidth = Math.max(minWidth, startWidth + deltaX);
      break;
    case 'bottom-right':
      newWidth = Math.max(minWidth, startWidth + deltaX);
      newHeight = Math.max(minHeight, startHeight + deltaY);
      break;
    case 'bottom':
      newHeight = Math.max(minHeight, startHeight + deltaY);
      break;
    case 'bottom-left':
      newWidth = Math.max(minWidth, startWidth - deltaX);
      newHeight = Math.max(minHeight, startHeight + deltaY);
      newLeft = startLeft + startWidth - newWidth;
      break;
    case 'left':
      newWidth = Math.max(minWidth, startWidth - deltaX);
      newLeft = startLeft + startWidth - newWidth;
      break;
  }

  // Apply aspect ratio constraint if needed
  if (props.aspectRatio) {
    const ratio = props.aspectRatio;

    // Determine which dimension to adjust based on resize direction
    if (['left', 'right'].includes(resizeDirection)) {
      // Adjusting width, calculate height based on aspect ratio
      newHeight = newWidth / ratio;
    } else if (['top', 'bottom'].includes(resizeDirection)) {
      // Adjusting height, calculate width based on aspect ratio
      newWidth = newHeight * ratio;
    } else {
      // Corner resize - use the larger dimension change to determine constraint
      const widthChange = Math.abs(newWidth - startWidth);
      const heightChange = Math.abs(newHeight - startHeight);

      if (widthChange >= heightChange) {
        newHeight = newWidth / ratio;
      } else {
        newWidth = newHeight * ratio;
      }

      // Adjust position for top and left edges
      if (['top-left', 'top-right'].includes(resizeDirection)) {
        newTop = startTop + startHeight - newHeight;
      }
      if (['top-left', 'bottom-left'].includes(resizeDirection)) {
        newLeft = startLeft + startWidth - newWidth;
      }
    }
  }

  // Snap to grid
  newWidth = Math.round(newWidth / gridSize) * gridSize;
  newHeight = Math.round(newHeight / gridSize) * gridSize;
  newLeft = Math.round(newLeft / gridSize) * gridSize;
  newTop = Math.round(newTop / gridSize) * gridSize;

  // Emit resize event with new size and position
  emit('resize', { width: newWidth, height: newHeight }, { x: newLeft, y: newTop });
}

function stopResize() {
  isResizing = false;
  resizeDirection = null;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
}
</script>


