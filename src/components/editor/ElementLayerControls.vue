<template>
  <div class="element-layer-controls">
    <div class="layer-info">
      <!-- Hidden in this layout -->
    </div>

    <div class="layer-actions">
      <v-tooltip location="left" content-class="layer-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="action-btn"
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

      <v-tooltip location="left" content-class="layer-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="action-btn"
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

      <v-tooltip location="left" content-class="layer-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="action-btn"
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

      <v-tooltip location="left" content-class="layer-tooltip">
        <template v-slot:activator="{ props }">
          <button
            v-bind="props"
            class="action-btn"
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
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { computed } from "vue";
import type { DocumentElement } from "../../types/document";

// Import styles
import '../../assets/styles/components/elementLayerControls.scss';

// 2. Props and Emits
/**
 * Component props
 */
const props = defineProps<{
  /** The currently selected element */
  element: DocumentElement;
  /** All elements in the current section */
  elements: DocumentElement[];
  /** The index of the element in the z-order stack */
  layerIndex: number;
  /** The total number of elements/layers */
  totalLayers: number;
}>();

/**
 * Component events
 */
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

// 3. Computed Properties
/**
 * Determines if the element is at the top of the layer stack
 */
const isTopLayer = computed((): boolean => props.layerIndex === props.totalLayers - 1);

/**
 * Determines if the element is at the bottom of the layer stack
 */
const isBottomLayer = computed((): boolean => props.layerIndex === 0);
</script>
