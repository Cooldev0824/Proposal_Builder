<template>
  <div class="element-toolbar" :style="toolbarStyle">
    <div class="toolbar-section element-info">
      <div class="element-type">
        <v-icon
          size="small"
          :icon="getElementIcon(element.type)"
          class="mr-1"
        ></v-icon>
        <span>{{ getElementName(element) }}</span>
      </div>
      <div class="layer-number">Layer {{ layerIndex + 1 }}</div>
    </div>

    <div class="toolbar-divider"></div>

    <div class="toolbar-section layer-controls">
      <v-tooltip location="bottom" content-class="toolbar-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="toolbar-btn"
            :class="{ disabled: isBottomLayer }"
            :disabled="isBottomLayer"
            @click.stop="$emit('move-to-bottom', element)"
            aria-label="Send to Back"
          >
            <v-icon>mdi-arrow-collapse-down</v-icon>
          </button>
        </template>
        <span>Send to Back</span>
      </v-tooltip>

      <v-tooltip location="bottom" content-class="toolbar-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="toolbar-btn"
            :class="{ disabled: isBottomLayer }"
            :disabled="isBottomLayer"
            @click.stop="$emit('move-down', element)"
            aria-label="Move Down"
          >
            <v-icon>mdi-arrow-down</v-icon>
          </button>
        </template>
        <span>Move Down</span>
      </v-tooltip>

      <v-tooltip location="bottom" content-class="toolbar-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="toolbar-btn"
            :class="{ disabled: isTopLayer }"
            :disabled="isTopLayer"
            @click.stop="$emit('move-up', element)"
            aria-label="Move Up"
          >
            <v-icon>mdi-arrow-up</v-icon>
          </button>
        </template>
        <span>Move Up</span>
      </v-tooltip>

      <v-tooltip location="bottom" content-class="toolbar-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="toolbar-btn"
            :class="{ disabled: isTopLayer }"
            :disabled="isTopLayer"
            @click.stop="$emit('move-to-top', element)"
            aria-label="Bring to Front"
          >
            <v-icon>mdi-arrow-collapse-up</v-icon>
          </button>
        </template>
        <span>Bring to Front</span>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { computed, ref, onMounted, onUnmounted } from "vue";
import type { DocumentElement } from "../../types/document";
import type { CSSProperties } from "vue";
import { getElementIcon, getElementName } from "../../utils/elementUtils";

// Import styles
import "../../assets/styles/components/elementToolbar.scss";

// 2. Types
/**
 * Element position information for toolbar positioning
 */
interface ElementPosition {
  top: number;
  left: number;
  width: number;
}

// 3. Props and Emits
const props = defineProps<{
  /** The currently selected element */
  element: DocumentElement;
  /** All elements in the current section */
  elements: DocumentElement[];
  /** The index of the element in the z-order stack */
  layerIndex: number;
  /** The total number of elements/layers */
  totalLayers: number;
  /** Position information for the selected element */
  elementPosition?: ElementPosition;
}>();

defineEmits<{
  /** Move the element up one layer */
  (e: "move-up", element: DocumentElement): void;
  /** Move the element down one layer */
  (e: "move-down", element: DocumentElement): void;
  /** Move the element to the top of all layers */
  (e: "move-to-top", element: DocumentElement): void;
  /** Move the element to the bottom of all layers */
  (e: "move-to-bottom", element: DocumentElement): void;
}>();

// 4. Computed Properties
/**
 * Determines if the element is at the top of the layer stack
 */
const isTopLayer = computed(
  (): boolean => props.layerIndex === props.totalLayers - 1
);

/**
 * Determines if the element is at the bottom of the layer stack
 */
const isBottomLayer = computed((): boolean => props.layerIndex === 0);

/**
 * Calculates the toolbar position based on the element position
 */
const toolbarStyle = computed((): CSSProperties => {
  if (!props.elementPosition) return {};

  // Calculate width with min/max constraints - smaller width
  const width = Math.min(Math.max(props.elementPosition.width, 220), 320);

  // Calculate left position to center the toolbar
  const left = Math.max(
    0,
    props.elementPosition.left + (props.elementPosition.width - width) / 2
  );

  // Calculate top position, ensuring it's not negative
  const top = Math.max(10, props.elementPosition.top - 50);

  // Check if we're on a mobile device using reactive windowWidth
  const isMobile = windowWidth.value <= 480;

  // For mobile, we might want to position differently
  if (isMobile) {
    return {
      left: `${Math.max(5, left)}px`,
      top: `${top}px`,
      width: `${Math.min(width, windowWidth.value - 20)}px`, // Ensure it fits on screen
      maxWidth: "calc(100vw - 20px)", // Prevent overflow
    };
  }

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`, // Min width 220px, max 320px
  };
});

// 5. Reactive Window Width
// Track window width for responsive adjustments
const windowWidth = ref(window.innerWidth);

// Update window width on resize
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

// Add and remove event listeners
onMounted(() => {
  window.addEventListener("resize", updateWindowWidth);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWindowWidth);
});

// 6. Methods
// Element icon and name functions are now imported from elementUtils.ts
</script>
