<template>
  <BaseElement
    class="group-element"
    :element="element"
    :isSelected="isSelected"
    :isPreview="isPreview"
    :minWidth="50"
    :minHeight="50"
    @update:element="handleBaseElementUpdate"
    tabindex="0"
  >
    <!-- Group border and background -->
    <div
      class="group-container"
      :style="groupContainerStyle"
      @click.stop="handleClick"
    >
      <!-- Render child elements -->
      <component
        v-for="childElement in element.children || []"
        :key="childElement.id"
        :is="getElementComponent(childElement.type)"
        :element="childElement"
        :isSelected="false"
        :isPreview="true"
        :style="getChildStyle(childElement)"
        class="group-child-element"
      />
    </div>
  </BaseElement>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { CSSProperties } from "vue";
import type { DocumentElement, Size, Position } from "../../../types/document";
import BaseElement from "./BaseElement.vue";
import { getElementComponent } from "./ElementRegistry";

// Import styles
import '../../../assets/styles/components/elements.scss';

const props = defineProps<{
  element: DocumentElement;
  isSelected: boolean;
  isPreview?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
  (e: "click", element: DocumentElement): void;
}>();

// Compute the style for the group container
const groupContainerStyle = computed<CSSProperties>(() => {
  const style = props.element.style || {};
  return {
    width: "100%",
    height: "100%",
    border: style.borderWidth ? `${style.borderWidth}px ${style.borderStyle || 'dashed'} ${style.borderColor || '#666'}` : "1px dashed #666",
    backgroundColor: style.backgroundColor || "transparent",
    opacity: style.opacity !== undefined ? style.opacity : 1,
    position: "relative" as const,
    overflow: "hidden",
    boxSizing: "border-box" as const,
  };
});

// Calculate the style for child elements (position relative to group)
function getChildStyle(childElement: DocumentElement): CSSProperties {
  return {
    position: "absolute" as const,
    left: `${childElement.position.x}px`,
    top: `${childElement.position.y}px`,
    width: `${childElement.size.width}px`,
    height: `${childElement.size.height}px`,
    zIndex: childElement.zIndex || 0,
  };
}

// Handle updates from the base element
function handleBaseElementUpdate(updatedElement: DocumentElement) {
  emit("update:element", updatedElement);
}

// This function is called by the BaseElement when it's resized
// We need to override it to handle the children elements
// It's exposed to the BaseElement through the defineExpose in BaseElement.vue
function handleResize(newSize: Size, newPosition: Position) {
  // Calculate the scale factors for child elements
  const scaleX = newSize.width / props.element.size.width;
  const scaleY = newSize.height / props.element.size.height;

  // Update children positions and sizes proportionally
  const updatedChildren = props.element.children?.map(child => {
    // Calculate new relative position
    const relativeX = child.position.x - props.element.position.x;
    const relativeY = child.position.y - props.element.position.y;

    // Scale the position
    const newX = newPosition.x + (relativeX * scaleX);
    const newY = newPosition.y + (relativeY * scaleY);

    // Scale the size
    const newWidth = child.size.width * scaleX;
    const newHeight = child.size.height * scaleY;

    return {
      ...child,
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight }
    };
  });

  // Update the group element
  const updatedElement = {
    ...props.element,
    position: newPosition,
    size: newSize,
    children: updatedChildren
  };

  emit("update:element", updatedElement);
}

// Handle click on the group
function handleClick(event: MouseEvent) {
  // Stop propagation to prevent document click from deselecting
  event.stopPropagation();

  // Don't do anything if we're in preview mode
  if (props.isPreview) return;

  // Force focus on this group element
  const groupElement = event.currentTarget as HTMLElement;
  if (groupElement) {
    // Focus the element
    groupElement.focus();

    // Add a visual feedback that the group was clicked
    groupElement.classList.add('click-feedback');

    // Remove it after the animation completes
    setTimeout(() => {
      groupElement.classList.remove('click-feedback');
    }, 300);
  }

  // Emit the click event to select this group
  emit("click", props.element);
}

// Expose the handleResize function to the BaseElement
defineExpose({
  handleResize
});
</script>

<style scoped lang="scss">
.group-element {
  cursor: move;
  user-select: none;

  // Add a click feedback animation
  &.click-feedback {
    animation: click-pulse 0.3s ease-out;
  }

  @keyframes click-pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.02); }
    100% { transform: scale(1); }
  }

  &.selected {
    outline: 3px solid var(--primary, #0c84fe);

    // Show a semi-transparent overlay when selected
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(12, 132, 254, 0.1);
      pointer-events: none;
    }

    // Make the folder icon more visible when selected
    .group-container::before {
      opacity: 1;
    }

    // Make the group container more visible when selected
    .group-container {
      border: 2px solid #0c84fe !important;
      background-color: rgba(12, 132, 254, 0.05);
      box-shadow: 0 0 10px rgba(12, 132, 254, 0.2);
    }
  }

  .group-container {
    border-radius: 2px;
    position: relative;
    width: 100%;
    height: 100%;
    cursor: pointer;

    // Add a more visible border and background to make it easier to select
    border: 2px dashed #666 !important;
    background-color: rgba(240, 240, 240, 0.1);

    // Add a subtle drop shadow to indicate it's a group
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.15);

    // Add a folder icon to indicate it's a group
    &::before {
      content: '';
      position: absolute;
      top: -15px;
      left: 0;
      width: 20px;
      height: 15px;
      background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23666" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>');
      background-repeat: no-repeat;
      background-size: contain;
      opacity: 0.9;
      pointer-events: none;
    }

    // Add a stronger hover effect to make it clear it's selectable
    &:hover {
      box-shadow: 0 0 10px rgba(12, 132, 254, 0.3);
      border-color: #0c84fe !important;
      background-color: rgba(12, 132, 254, 0.05);
    }
  }

  // Make child elements non-interactive
  .group-child-element {
    pointer-events: none !important; // Prevent any mouse events
    user-select: none !important;
    cursor: default !important;

    // Add a slight opacity to indicate they're part of a group
    opacity: 0.95;

    // Disable all interactive elements inside child components
    input, textarea, button, select, a {
      pointer-events: none !important;
      user-select: none !important;
    }
  }

  // Rotation handle
  .rotate-handle {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: var(--primary, #0c84fe);
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
}
</style>
