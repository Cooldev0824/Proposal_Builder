<template>
  <div
    class="shape-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
  >
    <div class="shape-container">
      <svg
        :width="svgSize.width"
        :height="svgSize.height"
        :style="{
          position: 'absolute',
          left: `-${(svgSize.width - width) / 2}px`,
          top: `-${(svgSize.height - height) / 2}px`,
          overflow: 'visible',
          pointerEvents: 'none',
          display: 'block',
        }"
        :viewBox="`0 0 ${svgSize.width} ${svgSize.height}`"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          :transform="`translate(${svgSize.width / 2} ${
            svgSize.height / 2
          }) rotate(${rotation}) translate(${-width / 2} ${-height / 2})`"
        >
          <component :is="getShapeComponent()" :style="shapeStyle" />
        </g>
      </svg>
    </div>

    <!-- Multi-directional resize handles -->
    <ResizeHandles
      v-if="isSelected"
      :elementSize="props.element.size"
      :elementPosition="props.element.position"
      :minWidth="15"
      :minHeight="15"
      :gridSize="10"
      @resize="handleResize"
    />

    <div
      v-if="isSelected"
      class="rotate-handle"
      @mousedown.stop="startRotate"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, h } from "vue";
import { DocumentElement, Size, Position } from "../../../types/document";
import ResizeHandles from "../../editor/ResizeHandles.vue";

const props = defineProps<{
  element: DocumentElement;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

// Element dimensions
const width = computed(() => props.element.size.width);
const height = computed(() => props.element.size.height);
const rotation = computed(() => props.element.style?.rotation || 0);

// SVG dimensions including padding for rotation
const svgSize = computed(() => {
  const diagonal = Math.sqrt(
    width.value * width.value + height.value * height.value,
  );
  return {
    width: diagonal,
    height: diagonal,
  };
});

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

// Rotate functionality
let isRotating = false;
let startAngle = 0;

const elementStyle = computed(() => {
  return {
    left: `${props.element.position.x}px`,
    top: `${props.element.position.y}px`,
    width: `${props.element.size.width}px`,
    height: `${props.element.size.height}px`,
    zIndex: props.element.zIndex ?? 0,
  };
});

const shapeStyle = computed(() => {
  const style = props.element.style || {};
  let strokeDasharray = "none";

  if (props.element.content === "line" && style.lineStyle) {
    switch (style.lineStyle) {
    case "dashed":
      strokeDasharray = "8,4";
      break;
    case "dotted":
      strokeDasharray = "2,2";
      break;
    default:
      strokeDasharray = "none";
    }
  }

  // Ensure fill is never undefined for PDF export
  const fillColor = style.fill || "none";

  return {
    fill: fillColor,
    stroke: style.stroke || "#000000",
    strokeWidth: `${style.strokeWidth || 1}px`,
    strokeDasharray,
    opacity: style.opacity || 1,
    // Add vector-effect to ensure consistent stroke width
    vectorEffect: "non-scaling-stroke",
  };
});

function getShapeComponent() {
  const shapeType = props.element.content;

  switch (shapeType) {
  case "rectangle":
    return h("rect", {
      x: 0,
      y: 0,
      width: width.value,
      height: height.value,
      rx: props.element.style?.borderRadius || 0,
      ...shapeStyle.value,
    });
  case "circle":
    return h("ellipse", {
      cx: width.value / 2,
      cy: height.value / 2,
      rx: width.value / 2,
      ry: height.value / 2,
      ...shapeStyle.value,
    });
  case "triangle":
    const points = `${width.value / 2},0 ${width.value},${height.value} 0,${
      height.value
    }`;
    return h("polygon", {
      points,
      ...shapeStyle.value,
    });
  case "line":
    return h("line", {
      x1: 0,
      y1: height.value / 2,
      x2: width.value,
      y2: height.value / 2,
      ...shapeStyle.value,
    });
  case "arrow":
    const arrowPath = `M0,${height.value / 2} L${width.value - 10},${
      height.value / 2
    } L${width.value - 15},${height.value / 4} L${width.value},${
      height.value / 2
    } L${width.value - 15},${(3 * height.value) / 4} L${width.value - 10},${
      height.value / 2
    }`;
    return h("path", {
      d: arrowPath,
      ...shapeStyle.value,
    });
  default:
    return h("rect", {
      x: 0,
      y: 0,
      width: width.value,
      height: height.value,
      ...shapeStyle.value,
    });
  }
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

  // Calculate new size
  let newWidth = Math.max(15, startWidth + deltaX);
  let newHeight = Math.max(15, startHeight + deltaY);

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

function startRotate(event: MouseEvent) {
  isRotating = true;
  const rect = (event.target as HTMLElement)
    .closest(".shape-element")
    ?.getBoundingClientRect();
  if (!rect) return;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

  document.addEventListener("mousemove", onRotate);
  document.addEventListener("mouseup", stopRotate);
}

function onRotate(event: MouseEvent) {
  if (!isRotating) return;

  const rect = (event.target as HTMLElement)
    .closest(".shape-element")
    ?.getBoundingClientRect();
  if (!rect) return;

  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

  let newRotation =
    ((angle - startAngle) * (180 / Math.PI) +
      (props.element.style?.rotation || 0)) %
    360;
  if (newRotation < 0) newRotation += 360;

  const updatedElement = {
    ...props.element,
    style: {
      ...props.element.style,
      rotation: newRotation,
    },
  };

  emit("update:element", updatedElement);
}

function stopRotate() {
  isRotating = false;
  document.removeEventListener("mousemove", onRotate);
  document.removeEventListener("mouseup", stopRotate);
}

// Handle resize from ResizeHandles component
function handleResize(newSize: Size, newPosition: Position) {
  const updatedElement = {
    ...props.element,
    size: newSize,
    position: newPosition,
  };

  emit("update:element", updatedElement);
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

.shape-element {
  display: flex;
  justify-content: center;
  align-items: center;
}

.shape-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Old resize handle removed - now using ResizeHandles component */

.rotate-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--primary);
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  cursor: grab;
  z-index: 1;

  &:active {
    cursor: grabbing;
  }
}
</style>
