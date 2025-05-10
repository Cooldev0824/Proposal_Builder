<template>
  <div class="layer-control-panel">
    <div class="panel-header">
      <h3>Layers</h3>
    </div>

    <div class="layer-list">
      <div
        v-for="element in sortedElements"
        :key="element.id"
        class="layer-item"
        :class="{ 'selected': selectedElement?.id === element.id }"
        @click="selectElement(element)"
      >
        <div class="layer-icon">
          <v-icon size="small">{{ getElementIcon(element.type) }}</v-icon>
        </div>
        <div class="layer-name">
          {{ getElementName(element) }}
        </div>
        <div class="layer-actions">
          <v-btn icon size="x-small" @click.stop="moveUp(element)">
            <v-icon size="small">mdi-arrow-up</v-icon>
            <v-tooltip activator="parent" location="top">Move Up</v-tooltip>
          </v-btn>
          <v-btn icon size="x-small" @click.stop="moveDown(element)">
            <v-icon size="small">mdi-arrow-down</v-icon>
            <v-tooltip activator="parent" location="top">Move Down</v-tooltip>
          </v-btn>
          <v-btn icon size="x-small" @click.stop="moveToTop(element)">
            <v-icon size="small">mdi-arrow-up-bold</v-icon>
            <v-tooltip activator="parent" location="top">Bring to Front</v-tooltip>
          </v-btn>
          <v-btn icon size="x-small" @click.stop="moveToBottom(element)">
            <v-icon size="small">mdi-arrow-down-bold</v-icon>
            <v-tooltip activator="parent" location="top">Send to Back</v-tooltip>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import { computed } from 'vue';
import type { DocumentElement } from '../../types/document';
import { getElementIcon, getElementName } from '../../utils/elementUtils';

// Import styles
import '../../assets/styles/components/layerControlPanel.scss';

// 2. Props and Emits
/**
 * Component props
 */
const props = defineProps<{
  /** All elements in the current section */
  elements: DocumentElement[];
  /** The currently selected element */
  selectedElement: DocumentElement | null;
}>();

/**
 * Component events
 */
const emit = defineEmits<{
  /** Emitted when an element is selected in the layer panel */
  (e: 'element-selected', element: DocumentElement): void;
  /** Emitted when an element is updated */
  (e: 'update-element', element: DocumentElement): void;
  /** Move the element up one layer */
  (e: 'move-up', element: DocumentElement): void;
  /** Move the element down one layer */
  (e: 'move-down', element: DocumentElement): void;
  /** Move the element to the top of all layers */
  (e: 'move-to-top', element: DocumentElement): void;
  /** Move the element to the bottom of all layers */
  (e: 'move-to-bottom', element: DocumentElement): void;
}>();

// 3. Computed Properties
/**
 * Sort elements by zIndex in reverse order (highest zIndex first)
 * This makes the layer panel show elements in the same visual order as they appear
 * in the document (top elements first)
 */
const sortedElements = computed(() => {
  return [...props.elements].sort((a, b) => {
    const zIndexA = a.zIndex ?? 0;
    const zIndexB = b.zIndex ?? 0;
    return zIndexB - zIndexA; // Reverse order for the layer panel
  });
});

// 4. Methods
/**
 * Handle element selection in the layer panel
 * @param element The element to select
 */
function selectElement(element: DocumentElement): void {
  emit('element-selected', element);
}

/**
 * Move the element up one layer
 * @param element The element to move
 */
function moveUp(element: DocumentElement): void {
  emit('move-up', element);
}

/**
 * Move the element down one layer
 * @param element The element to move
 */
function moveDown(element: DocumentElement): void {
  emit('move-down', element);
}

/**
 * Move the element to the top of all layers
 * @param element The element to move
 */
function moveToTop(element: DocumentElement): void {
  emit('move-to-top', element);
}

/**
 * Move the element to the bottom of all layers
 * @param element The element to move
 */
function moveToBottom(element: DocumentElement): void {
  emit('move-to-bottom', element);
}
</script>


