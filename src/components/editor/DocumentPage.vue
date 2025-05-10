<template>
  <div class="document-page-container">
    <!-- Actual document page -->
    <div class="document-page" :class="{ active: isActive }" :style="pageStyle">
      <div class="page-content" ref="pageContent">
        <!-- Element toolbar positioned at the top of the page content -->
        <ElementToolbar
          v-if="selectedElement && selectedElementPosition"
          :element="selectedElement"
          :elements="section?.elements || []"
          :layer-index="getElementIndex(selectedElement)"
          :total-layers="sortedElements.length"
          :element-position="selectedElementPosition"
          @move-up="moveElementUp"
          @move-down="moveElementDown"
          @move-to-top="moveElementToTop"
          @move-to-bottom="moveElementToBottom"
        />

        <Suspense v-if="section?.elements && Array.isArray(section.elements)">
          <template #default>
            <div class="elements-container">
              <div
                v-for="(element, index) in sortedElements"
                :key="element.id"
                class="element-wrapper"
                :style="{ zIndex: element.zIndex || 0 }"
                @mouseenter="hoveredElement = element"
                @mouseleave="hoveredElement = null"
              >
                <component
                  :is="getElementComponent(element.type)"
                  :element="element"
                  :isSelected="selectedElement?.id === element.id"
                  @click.stop="selectElement(element)"
                  @update:element="updateElement"
                  ref="elementRefs"
                  :data-element-id="element.id"
                  :class="`element-${element.id}`"
                />
              </div>
            </div>
          </template>
          <template #fallback>
            <div class="loading">Loading elements...</div>
          </template>
        </Suspense>

        <div
          v-if="
            !section ||
            !section?.elements ||
            !Array.isArray(section.elements) ||
            !section.elements?.length
          "
          class="empty-page"
        >
          <p>This section is empty. Add elements from the toolbar above.</p>
        </div>

        <!-- Drawing rectangle for creating elements -->
        <div
          v-if="isDrawing"
          class="drawing-rectangle"
          :style="{
            left: drawingRectStyle?.left,
            top: drawingRectStyle?.top,
            width: drawingRectStyle?.width,
            height: drawingRectStyle?.height,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 1. Imports
import {
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
  onErrorCaptured,
  type CSSProperties
} from "vue";
import { Section, DocumentElement } from "../../types/document";
import ElementToolbar from "./ElementToolbar.vue";
import { getPaperSizeByName, getLandscapeSize } from "../../utils/paperSizes";
import { getElementComponent } from "../../utils/elementComponentLoader";

// Import styles
import '../../assets/styles/components/documentPage.scss';

// 2. Types
/**
 * Element position information for toolbar positioning
 */
interface ElementPosition {
  top: number;
  left: number;
  width: number;
}

/**
 * Drawing rectangle style
 */
interface DrawingRectStyle {
  left: string;
  top: string;
  width: string;
  height: string;
}

// 3. Props and Emits
/**
 * Component props
 */
const props = defineProps<{
  /** The section data to display */
  section: Section;
  /** Whether this section is currently active */
  isActive: boolean;
  /** Whether to show the grid */
  showGrid?: boolean;
  /** Whether the user is currently drawing a selection rectangle */
  isDrawing?: boolean;
  /** The paper size for the document */
  paperSize?: string;
  /** The orientation of the document */
  orientation?: "portrait" | "landscape";
  /** Style for the drawing rectangle */
  drawingRectStyle?: DrawingRectStyle;
}>();

const { section, isActive } = props;

/**
 * Component events
 */
const emit = defineEmits<{
  /** Emitted when an element is selected */
  (e: "element-selected", element: DocumentElement | null): void;
  /** Emitted when an element is updated */
  (e: "element-updated", element: DocumentElement): void;
  /** Move the element up one layer */
  (e: "move-element-up", element: DocumentElement): void;
  /** Move the element down one layer */
  (e: "move-element-down", element: DocumentElement): void;
  /** Move the element to the top of all layers */
  (e: "move-element-to-top", element: DocumentElement): void;
  /** Move the element to the bottom of all layers */
  (e: "move-element-to-bottom", element: DocumentElement): void;
}>();

// 4. Reactive State
/** Reference to the page content element */
const pageContent = ref<HTMLElement | null>(null);
/** The currently selected element */
const selectedElement = ref<DocumentElement | null>(null);
/** The element currently being hovered over */
const hoveredElement = ref<DocumentElement | null>(null);
/** References to element components */
const elementRefs = ref<any[]>([]);
/** Whether to show the grid */
const showGrid = ref(true); // Default to true, will be updated when props change
/** Position information for the selected element */
const selectedElementPosition = ref<ElementPosition | null>(null);

// 5. Computed Properties
/**
 * Calculate the page width based on paper size and orientation
 */
const pageWidth = computed((): number => {
  const paperSizeName = props.paperSize || "Letter";
  const orientation = props.orientation || "portrait";

  let paperSize = getPaperSizeByName(paperSizeName);

  // Apply orientation
  if (orientation === "landscape") {
    paperSize = getLandscapeSize(paperSize);
  }

  return paperSize.width;
});

/**
 * Calculate the page height based on paper size and orientation
 */
const pageHeight = computed((): number => {
  const paperSizeName = props.paperSize || "Letter";
  const orientation = props.orientation || "portrait";

  let paperSize = getPaperSizeByName(paperSizeName);

  // Apply orientation
  if (orientation === "landscape") {
    paperSize = getLandscapeSize(paperSize);
  }

  return paperSize.height;
});

/**
 * Calculate the style for the page element
 */
const pageStyle = computed((): CSSProperties => {
  return {
    width: `${pageWidth.value}px`,
    height: `${pageHeight.value}px`,
    position: "relative",
    overflow: "hidden", // Hide content that goes outside the document boundaries
  };
});

/**
 * Sort elements by zIndex for proper layering
 */
const sortedElements = computed((): DocumentElement[] => {
  if (!section?.elements) return [];

  // Make a copy of the elements array to avoid modifying the original
  return [...section.elements].sort((a, b) => {
    // Default zIndex to 0 if not set
    const zIndexA = a.zIndex ?? 0;
    const zIndexB = b.zIndex ?? 0;
    return zIndexA - zIndexB;
  });
});

// 6. Watch Effects
/**
 * Watch for changes to the showGrid prop
 */
watch(
  () => props.showGrid,
  (newValue) => {
    if (newValue !== undefined) {
      showGrid.value = newValue;
    }
  },
  { immediate: true }
);

/**
 * Watch for changes to the selected element to update its position
 */
watch(
  () => selectedElement.value,
  () => {
    // Use nextTick to ensure the DOM has updated
    nextTick(() => {
      calculateSelectedElementPosition();
    });
  }
);

// 7. Methods
/**
 * Handle element selection
 * @param element The element to select
 */
function selectElement(element: DocumentElement): void {
  selectedElement.value = element;

  // Calculate the element position for the toolbar
  calculateSelectedElementPosition();

  emit("element-selected", element);
}

/**
 * Calculate the position of the selected element for the toolbar
 */
function calculateSelectedElementPosition(): void {
  if (!selectedElement.value || !pageContent.value) return;

  // Find the element in the DOM
  const elementId = selectedElement.value.id;

  // Try to find the element by data-element-id attribute first
  let elementDom = pageContent.value.querySelector(
    `[data-element-id="${elementId}"]`
  );

  // If not found, try to find the element wrapper that contains this element
  if (!elementDom) {
    // Find all element wrappers
    const elementWrappers =
      pageContent.value.querySelectorAll(".element-wrapper");

    // Loop through wrappers to find the one with our element
    for (const wrapper of elementWrappers) {
      // Check if this wrapper contains our element
      const component = wrapper.querySelector(".element");
      if (
        component &&
        component.classList.contains(`element-${selectedElement.value.id}`)
      ) {
        elementDom = component;
        break;
      }
    }

    // If still not found, use the element's position directly
    if (!elementDom && selectedElement.value) {
      selectedElementPosition.value = {
        top: selectedElement.value.position.y,
        left: selectedElement.value.position.x,
        width: selectedElement.value.size.width,
      };
      return;
    }
  }

  if (elementDom) {
    const rect = elementDom.getBoundingClientRect();
    const pageRect = pageContent.value.getBoundingClientRect();

    // Calculate position relative to the page content
    selectedElementPosition.value = {
      top: rect.top - pageRect.top,
      left: rect.left - pageRect.left,
      width: rect.width,
    };
  }
}

/**
 * Get the index of an element in the sortedElements array
 * @param element The element to find
 * @returns The index of the element
 */
function getElementIndex(element: DocumentElement): number {
  if (!element || !sortedElements.value) return 0;

  return sortedElements.value.findIndex((el) => el.id === element.id);
}

/**
 * Update an element
 * @param element The updated element
 */
function updateElement(element: DocumentElement): void {
  emit("element-updated", element);
}

/**
 * Move an element up one layer
 * @param element The element to move
 */
function moveElementUp(element: DocumentElement): void {
  emit("move-element-up", element);
}

/**
 * Move an element down one layer
 * @param element The element to move
 */
function moveElementDown(element: DocumentElement): void {
  emit("move-element-down", element);
}

/**
 * Move an element to the top of all layers
 * @param element The element to move
 */
function moveElementToTop(element: DocumentElement): void {
  emit("move-element-to-top", element);
}

/**
 * Move an element to the bottom of all layers
 * @param element The element to move
 */
function moveElementToBottom(element: DocumentElement): void {
  emit("move-element-to-bottom", element);
}

// 8. Lifecycle Hooks
/**
 * Handle window resize
 */
const handleResize = (): void => {
  if (selectedElement.value) {
    calculateSelectedElementPosition();
  }
};

/**
 * Add window resize listener to recalculate element position
 */
onMounted(() => {
  window.addEventListener("resize", handleResize);
});

/**
 * Clean up event listeners
 */
onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

/**
 * Global error handler for async components
 */
onErrorCaptured((error, instance, info) => {
  console.error("Component error:", error, instance, info);
  return false; // prevent error from propagating
});
</script>


