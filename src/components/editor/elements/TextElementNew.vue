<template>
  <BaseElement
    class="text-element"
    :element="element"
    :isSelected="isSelected"
    :isPreview="isPreview"
    :minWidth="50"
    :minHeight="30"
    @update:element="handleBaseElementUpdate"
  >
    <div
      class="element-content"
      contenteditable="true"
      @input="handleTextChange"
      @keydown="handleKeyDown"
      @focus="handleFocus"
      @blur="handleBlur"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @keyup="handleKeyUp"
      :style="textStyle"
      ref="contentElement"
      :data-element-id="element.id"
    ></div>
  </BaseElement>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import type { CSSProperties } from "vue";
import type { DocumentElement } from "../../../types/document";
import { saveSelection } from "../../../utils/selectionManager";
import BaseElement from "./BaseElement.vue";
import { getFontFamilyValue } from "../../../utils/fontFamilies";

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

const contentElement = ref<HTMLElement | null>(null);
const isEditing = ref(false);
let observer: MutationObserver | null = null;
let isUpdating = false;

// Handle updates from the base element
function handleBaseElementUpdate(updatedElement: DocumentElement) {
  emit("update:element", updatedElement);
}

const textStyle = computed<CSSProperties>(() => {
  const style = props.element.style || {};

  // Base styles
  const baseStyles: CSSProperties = {
    fontFamily: getFontFamilyValue(style.fontFamily || "Roboto"),
    fontSize: `${style.fontSize || 16}px`,
    fontWeight: style.bold ? "bold" : "normal",
    fontStyle: style.italic ? "italic" : "normal",
    textDecoration: style.underline ? "underline" : "none",
    textAlign: style.align || "left",
    color: style.color || "#000000",
    backgroundColor: style.blockBackground
      ? "transparent"
      : style.backgroundColor || "transparent",
    textIndent: style.textIndent ? `${style.textIndent}px` : "0px",
    lineHeight: style.lineHeight ? style.lineHeight : 1.5,
    paddingLeft: style.paragraphIndent ? `${style.paragraphIndent}px` : "0px",
    margin: 0,
    padding: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    outline: "none",
    cursor: "text",
    userSelect: "text" as const,
    width: "100%",
    height: "100%",
  };

  // Add list styles if needed
  if (style.listType === "bullet") {
    return {
      ...baseStyles,
      listStyleType: "disc",
      listStylePosition: "inside",
      display: "list-item",
      paddingLeft: "20px", // Add padding for better visual appearance
      marginLeft: style.paragraphIndent ? `${style.paragraphIndent}px` : "0px",
    } as CSSProperties;
  } else if (style.listType === "number") {
    return {
      ...baseStyles,
      listStyleType: "decimal",
      listStylePosition: "inside",
      display: "list-item",
      paddingLeft: "20px", // Add padding for better visual appearance
      marginLeft: style.paragraphIndent ? `${style.paragraphIndent}px` : "0px",
    } as CSSProperties;
  }

  return baseStyles;
});

// Watch for content changes from outside this component
watch(
  () => props.element.content,
  (newContent) => {
    if (contentElement.value && !isUpdating) {
      // Temporarily disable the observer to prevent loops
      if (observer) {
        observer.disconnect();
      }

      // Update the content
      contentElement.value.innerHTML = newContent || "";

      // Re-enable the observer
      setupMutationObserver();
    }
  }
);

// Setup mutation observer to track content changes
function setupMutationObserver() {
  if (!contentElement.value) return;

  // Create a new observer
  observer = new MutationObserver(() => {
    if (!isUpdating && contentElement.value) {
      // Update the element content
      const updatedElement = {
        ...props.element,
        content: contentElement.value.innerHTML,
      };

      isUpdating = true;
      emit("update:element", updatedElement);
      isUpdating = false;
    }
  });

  // Start observing
  observer.observe(contentElement.value, {
    childList: true,
    characterData: true,
    subtree: true,
  });
}

// Handle text changes
function handleTextChange() {
  if (!contentElement.value || isUpdating) return;

  // Save the current selection
  saveSelection();

  // Update the element content
  const updatedElement = {
    ...props.element,
    content: contentElement.value.innerHTML,
  };

  isUpdating = true;
  emit("update:element", updatedElement);
  isUpdating = false;
}

// Handle focus events
function handleFocus() {
  isEditing.value = true;
}

// Handle blur events
function handleBlur() {
  isEditing.value = false;
}

// Handle mouse down events
function handleMouseDown(event: MouseEvent) {
  // Prevent propagation to allow text selection
  event.stopPropagation();
}

// Handle mouse up events
function handleMouseUp(event: MouseEvent) {
  // Prevent propagation to allow text selection
  event.stopPropagation();
}

// Handle key up events
function handleKeyUp() {
  // Save selection on key up
  saveSelection();
}

// Handle key down events
function handleKeyDown(event: KeyboardEvent) {
  // Handle keyboard shortcuts
  if ((event.ctrlKey || event.metaKey) && isEditing.value) {
    // Handle common keyboard shortcuts
    switch (event.key.toLowerCase()) {
      case "b": // Bold
        event.preventDefault();
        toggleStyle("bold");
        break;
      case "i": // Italic
        event.preventDefault();
        toggleStyle("italic");
        break;
      case "u": // Underline
        event.preventDefault();
        toggleStyle("underline");
        break;
    }
  }
}

// Toggle a style property
function toggleStyle(property: string) {
  const style = props.element.style || {};
  const updatedElement = {
    ...props.element,
    style: {
      ...style,
      [property]: !style[property],
    },
  };

  emit("update:element", updatedElement);
}

// Initialize the component
onMounted(() => {
  if (contentElement.value) {
    // Set initial content
    contentElement.value.innerHTML = props.element.content || "";

    // Setup mutation observer
    setupMutationObserver();
  }
});

// Clean up
onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>


