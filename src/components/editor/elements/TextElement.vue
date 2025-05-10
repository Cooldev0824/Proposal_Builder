<template>
  <div
    class="text-element element"
    :class="{ selected: isSelected }"
    :style="elementStyle"
    @mousedown.stop="startDrag"
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
      :data-element-id="props.element.id"
    ></div>
    <ResizeHandles
      v-if="isSelected"
      :elementSize="props.element.size"
      :elementPosition="props.element.position"
      :minWidth="50"
      :minHeight="30"
      :gridSize="10"
      @resize="handleResize"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from "vue";
import { DocumentElement, Size, Position } from "../../../types/document";
import { saveSelection } from "../../../utils/selectionManager";
import ResizeHandles from "../../editor/ResizeHandles.vue";
import { getFontFamilyValue } from "../../../utils/fontFamilies";

const props = defineProps<{
  element: DocumentElement;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

const contentElement = ref<HTMLElement | null>(null);
const isEditing = ref(false);
let observer: MutationObserver | null = null;
let isUpdating = false;

// Cursor position tracking
let cursorPosition = {
  node: null as Node | null,
  offset: 0,
};

// Drag & drop functionality
let isDragging = false;
let startX = 0;
let startY = 0;
let startLeft = 0;
let startTop = 0;

// Resize functionality is now handled by the ResizeHandles component

const elementStyle = computed(() => {
  return {
    left: `${props.element.position.x}px`,
    top: `${props.element.position.y}px`,
    width: `${props.element.size.width}px`,
    minHeight: `${props.element.size.height}px`,
    backgroundColor: props.element.style?.blockBackground
      ? props.element.style?.blockBackgroundColor || "#f5f5f5"
      : "transparent",
    padding: "8px",
    borderRadius: "4px",
    border: props.isSelected
      ? "2px solid var(--primary)"
      : "2px solid transparent",
    cursor: isEditing.value ? "text" : "move",
    zIndex: props.element.zIndex ?? 0,
  };
});

const textStyle = computed(() => {
  const style = props.element.style || {};

  // Base styles
  const baseStyles = {
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
    userSelect: "text",
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
    };
  } else if (style.listType === "number") {
    return {
      ...baseStyles,
      listStyleType: "decimal",
      listStylePosition: "inside",
      display: "list-item",
      paddingLeft: "20px", // Add padding for better visual appearance
      marginLeft: style.paragraphIndent ? `${style.paragraphIndent}px` : "0px",
    };
  }

  return baseStyles;
});

// Watch for style changes
watch(
  () => props.element.style,
  (newStyle) => {
    // Update the text style
    if (contentElement.value) {
      Object.assign(contentElement.value.style, textStyle.value);
    }

    // Force update of the element style for block background
    if (newStyle?.blockBackground) {
      const elementDiv = contentElement.value?.parentElement;
      if (elementDiv) {
        elementDiv.style.backgroundColor =
          newStyle.blockBackgroundColor || "#f5f5f5";
      }
    }
  },
  { deep: true, immediate: true }
);

// Watch for content changes from outside this component
watch(
  () => props.element.content,
  (newContent, oldContent) => {
    if (contentElement.value && !isUpdating) {
      // Skip if the new content is empty or the same as the current content
      if (newContent === "" || contentElement.value.innerHTML === newContent) {
        return;
      }

      // Skip if the content element already has content and the new content is empty
      if (contentElement.value.innerHTML !== "" && !newContent) {
        return;
      }

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

// No longer needed - using direct text selection utility instead

// Save the current cursor position
function saveCursorPosition(): boolean {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount || !contentElement.value)
    return false;

  const range = selection.getRangeAt(0);

  // Make sure the selection is within our content element
  if (!contentElement.value.contains(range.commonAncestorContainer))
    return false;

  cursorPosition = {
    node: range.endContainer,
    offset: range.endOffset,
  };

  return true;
}

// Find a text node at the specified path
function findNodeAtPath(path: number[]): Node | null {
  if (!contentElement.value) return null;

  let currentNode: Node = contentElement.value;

  for (let i = 0; i < path.length; i++) {
    const index = path[i];
    if (currentNode.childNodes && index < currentNode.childNodes.length) {
      currentNode = currentNode.childNodes[index];
    } else {
      return null;
    }
  }

  return currentNode;
}

// Get the path to a node
function getNodePath(node: Node): number[] | null {
  if (!contentElement.value || !contentElement.value.contains(node))
    return null;

  const path: number[] = [];
  let currentNode: Node | null = node;

  while (currentNode && currentNode !== contentElement.value) {
    const parentNode: ParentNode | null = currentNode.parentNode;
    if (!parentNode) return null;

    const index = Array.from(parentNode.childNodes).indexOf(
      currentNode as ChildNode
    );
    if (index === -1) return null;

    path.unshift(index);
    currentNode = parentNode;
  }

  return path;
}

// Handle text changes
function handleTextChange(_event: Event): void {
  if (!contentElement.value || isUpdating) return;

  // Get the current selection
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  // Save the current selection state with more detailed information
  const range = selection.getRangeAt(0);
  const container = range.endContainer;
  const offset = range.endOffset;

  // Save the path to the node for more reliable restoration
  const nodePath = getNodePath(container);

  // Save text before cursor for text-based restoration
  let textBeforeCursor = "";

  try {
    // Create a range from the start of the content to the cursor
    const beforeRange = document.createRange();
    beforeRange.setStart(contentElement.value, 0);
    beforeRange.setEnd(range.endContainer, range.endOffset);
    textBeforeCursor = beforeRange.toString();
  } catch (error) {
    // Error getting text around cursor
  }

  // Get the current content before updating
  const currentContent = contentElement.value.innerHTML;

  // Prevent content from being reset to empty or previous value
  if (currentContent === "") {
    isUpdating = false;
    return;
  }

  // Update the element content
  const updatedElement = {
    ...props.element,
    content: currentContent,
  };

  isUpdating = true;
  emit("update:element", updatedElement);

  // Restore cursor position after Vue updates the DOM
  setTimeout(() => {
    try {
      if (!contentElement.value) {
        isUpdating = false;
        return;
      }

      // Focus the element
      contentElement.value.focus();

      // First try to restore using the original container reference
      if (container && contentElement.value.contains(container)) {
        // Create a new range at the saved position
        const newRange = document.createRange();

        // Ensure the offset is valid for the container
        const maxOffset =
          container.nodeType === Node.TEXT_NODE
            ? container.textContent?.length || 0
            : container.childNodes.length;

        const safeOffset = Math.min(offset, maxOffset);

        newRange.setStart(container, safeOffset);
        newRange.setEnd(container, safeOffset);

        // Apply the selection
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Cursor restored using direct container reference
      }
      // If that fails, try using the node path
      else if (nodePath) {
        const nodeAtPath = findNodeAtPath(nodePath);
        if (nodeAtPath) {
          // Create a new range at the saved position
          const newRange = document.createRange();

          // Ensure the offset is valid for the node
          const maxOffset =
            nodeAtPath.nodeType === Node.TEXT_NODE
              ? nodeAtPath.textContent?.length || 0
              : nodeAtPath.childNodes.length;

          const safeOffset = Math.min(offset, maxOffset);

          newRange.setStart(nodeAtPath, safeOffset);
          newRange.setEnd(nodeAtPath, safeOffset);

          // Apply the selection
          selection.removeAllRanges();
          selection.addRange(newRange);

          // Cursor restored using node path
        }
        // If node path fails, try text-based approach
        else if (textBeforeCursor) {
          // Get all text nodes
          const textNodes: Node[] = [];
          const walker = document.createTreeWalker(
            contentElement.value,
            NodeFilter.SHOW_TEXT,
            null
          );

          let node: Node | null;
          while ((node = walker.nextNode())) {
            textNodes.push(node);
          }

          if (textNodes.length > 0) {
            // Combine all text content
            let fullText = "";

            // Define the node position interface
            interface NodePosition {
              node: Node;
              startPos: number;
              endPos: number;
            }

            const nodePositions: NodePosition[] = [];

            textNodes.forEach((node) => {
              const startPos = fullText.length;
              fullText += node.textContent;
              const endPos = fullText.length;

              nodePositions.push({
                node,
                startPos,
                endPos,
              });
            });

            // Find the position in the full text that matches our cursor position
            const cursorPos = textBeforeCursor.length;

            // Find which node contains the cursor position
            let targetNode: Node | null = null;
            let targetOffset = 0;

            for (const pos of nodePositions) {
              if (cursorPos >= pos.startPos && cursorPos <= pos.endPos) {
                targetNode = pos.node;
                targetOffset = cursorPos - pos.startPos;
                break;
              }
            }

            // If we found a node, set the cursor position
            if (targetNode) {
              const newRange = document.createRange();
              newRange.setStart(targetNode, targetOffset);
              newRange.setEnd(targetNode, targetOffset);
              selection.removeAllRanges();
              selection.addRange(newRange);
              // Cursor restored using text content approach
            }
          }
        }
      }
    } catch (error) {
      // Error restoring selection
    } finally {
      isUpdating = false;
    }
  }, 10);
}

// Handle key down events
function handleKeyDown(event: KeyboardEvent): void {
  // Handle keyboard shortcuts
  if ((event.ctrlKey || event.metaKey) && isEditing.value) {
    // Get the current selection
    const selection = window.getSelection();

    switch (event.key.toLowerCase()) {
      case "b": // Bold
        event.preventDefault();
        // Apply bold to selected text if there's a selection
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          applyStyleToSelectedText("bold", true);
        } else {
          // Otherwise toggle bold for the whole element
          emit("update:element", {
            ...props.element,
            style: {
              ...props.element.style,
              bold: !props.element.style.bold,
            },
          });
        }
        return;
      case "i": // Italic
        event.preventDefault();
        // Apply italic to selected text if there's a selection
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          applyStyleToSelectedText("italic", true);
        } else {
          // Otherwise toggle italic for the whole element
          emit("update:element", {
            ...props.element,
            style: {
              ...props.element.style,
              italic: !props.element.style.italic,
            },
          });
        }
        return;
      case "u": // Underline
        event.preventDefault();
        // Apply underline to selected text if there's a selection
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          applyStyleToSelectedText("underline", true);
        } else {
          // Otherwise toggle underline for the whole element
          emit("update:element", {
            ...props.element,
            style: {
              ...props.element.style,
              underline: !props.element.style.underline,
            },
          });
        }
        return;
    }
  }

  // Handle Tab key for indentation
  if (event.key === "Tab" && isEditing.value) {
    event.preventDefault();

    if (event.shiftKey) {
      // Decrease indent with Shift+Tab
      const currentIndent = props.element.style?.paragraphIndent || 0;
      const newIndent = Math.max(0, currentIndent - 10);

      emit("update:element", {
        ...props.element,
        style: {
          ...props.element.style,
          paragraphIndent: newIndent,
        },
      });
    } else {
      // Increase indent with Tab
      const currentIndent = props.element.style?.paragraphIndent || 0;
      const newIndent = currentIndent + 10;

      emit("update:element", {
        ...props.element,
        style: {
          ...props.element.style,
          paragraphIndent: newIndent,
        },
      });
    }
    return;
  }

  // Handle Enter key press (both with and without Shift)
  // We treat all Enter key presses as Shift+Enter (inserting a line break instead of a paragraph)
  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation(); // Prevent event bubbling

    if (!contentElement.value) return;

    // Get the current selection
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    // Get the current range
    const range = selection.getRangeAt(0);

    // Create a <br> element
    const br = document.createElement("br");

    // Also create a text node with a zero-width space to ensure cursor positioning works
    const textNode = document.createTextNode("\u200B");

    // Insert the <br> element
    range.deleteContents();
    range.insertNode(br);

    // Insert the text node after the <br>
    const newRange = document.createRange();
    newRange.setStartAfter(br);
    newRange.setEndAfter(br);
    newRange.insertNode(textNode);

    // Move the cursor after the text node
    newRange.setStartAfter(textNode);
    newRange.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(newRange);

    // Flag to prevent cursor position from being overwritten
    isUpdating = true;

    // Update the element content
    const updatedElement = {
      ...props.element,
      content: contentElement.value.innerHTML,
    };

    // Emit the update
    emit("update:element", updatedElement);

    // Restore cursor position after Vue updates the DOM
    setTimeout(() => {
      try {
        if (!contentElement.value) {
          isUpdating = false;
          return;
        }

        // Focus the element
        contentElement.value.focus();

        // Find the <br> element we just inserted
        const allBrs = contentElement.value.querySelectorAll("br");
        if (allBrs.length > 0) {
          // Get the last <br> element (the one we just inserted)
          const lastBr = allBrs[allBrs.length - 1];

          // Create a range after this <br>
          const restoreRange = document.createRange();
          restoreRange.setStartAfter(lastBr);
          restoreRange.setEndAfter(lastBr);

          // Apply the selection
          selection.removeAllRanges();
          selection.addRange(restoreRange);

          // Cursor position restored after Enter key press
        } else {
          // Could not find the inserted <br> element
        }
      } catch (error) {
        // Error restoring cursor position after Enter key press
      } finally {
        isUpdating = false;
      }
    }, 10);
  }
}

function handleFocus() {
  isEditing.value = true;
  // Check for selection when focused
  emitSelectionState();
}

function handleBlur() {
  isEditing.value = false;
}

// Selection is now handled by the global selection manager

// Handle mouse up event - selection is now handled by the global selection manager
function handleMouseUp() {
  // Small delay to ensure the selection is properly set
  setTimeout(() => {
    // Emit an event to notify that text might be selected
    emitSelectionState();

    // Save cursor position for better reliability
    saveCursorPosition();
  }, 0);
}

// Handle key up event - selection is now handled by the global selection manager
function handleKeyUp(event: KeyboardEvent) {
  // Check for selection changes on key up
  if (
    event.key === "Shift" ||
    event.key.includes("Arrow") ||
    event.key === "Home" ||
    event.key === "End" ||
    event.key === "PageUp" ||
    event.key === "PageDown" ||
    event.ctrlKey ||
    event.metaKey
  ) {
    // Small delay to ensure the selection is properly set
    setTimeout(() => {
      emitSelectionState();

      // Save cursor position for better reliability
      saveCursorPosition();
    }, 0);
  }
}

// Function to emit selection state
function emitSelectionState() {
  if (!contentElement.value) return;

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return;

  const range = selection.getRangeAt(0);

  // Skip if no text is selected
  if (range.collapsed) return;

  // Check if the selection is within our content element
  if (contentElement.value.contains(range.commonAncestorContainer)) {
    // Text selection detected in TextElement

    // Force focus on the content element to ensure the selection is active
    contentElement.value.focus();

    // Explicitly call saveSelection from the selection manager
    saveSelection();
  }
}

// Handle mouse down event
function handleMouseDown() {
  // Focus the element
  if (contentElement.value) {
    contentElement.value.focus();
  }
}

// Apply style to selected text
function applyStyleToSelectedText(
  styleProperty: string,
  value: string | boolean
): boolean {
  // Applying style to selected text

  if (!contentElement.value) {
    return false;
  }

  // Focus the content element to ensure selection works
  contentElement.value.focus();

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) {
    return false;
  }

  const range = selection.getRangeAt(0);
  // Get selection range

  // If no text is selected, return false (will apply to whole element instead)
  if (range.collapsed) {
    return false;
  }

  // Make sure the selection is within our content element
  if (!contentElement.value.contains(range.commonAncestorContainer)) {
    return false;
  }

  // Selection is valid, applying style

  // Apply the style to the selected text
  let command = "";
  let value2: string | boolean = value;

  switch (styleProperty) {
    case "bold":
      command = "bold";
      break;
    case "italic":
      command = "italic";
      break;
    case "underline":
      command = "underline";
      break;
    case "fontName":
      command = "fontName";
      break;
    case "fontSize":
      // Special handling for font size
      // Create a span with the specified font size
      const fontSizeSpan = document.createElement("span");
      fontSizeSpan.style.fontSize = value + "px";

      // Extract the selected content
      const fontSizeFragment = range.extractContents();
      fontSizeSpan.appendChild(fontSizeFragment);

      // Insert the styled span
      range.insertNode(fontSizeSpan);

      // Update selection to include the new span
      selection.removeAllRanges();
      const fontSizeRange = document.createRange();
      fontSizeRange.selectNodeContents(fontSizeSpan);
      selection.addRange(fontSizeRange);

      // Update the element content
      const fontSizeUpdatedElement = {
        ...props.element,
        content: contentElement.value.innerHTML,
      };

      emit("update:element", fontSizeUpdatedElement);
      return true;
    case "heading":
      // Special handling for headings

      // Create the appropriate heading element
      const headingLevel = parseInt(value as string);
      if (isNaN(headingLevel) || headingLevel < 1 || headingLevel > 6) {
        return false;
      }

      // Create the heading element (h1, h2, etc.)
      const headingTag = `h${headingLevel}`;
      const headingElement = document.createElement(headingTag);

      // Set appropriate styles based on heading level
      switch (headingLevel) {
        case 1: // H1
          headingElement.style.fontSize = "32px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "16px";
          headingElement.style.marginTop = "16px";
          headingElement.style.color = "#333";
          headingElement.style.lineHeight = "1.2";
          break;
        case 2: // H2
          headingElement.style.fontSize = "28px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "14px";
          headingElement.style.marginTop = "14px";
          headingElement.style.color = "#444";
          headingElement.style.lineHeight = "1.2";
          break;
        case 3: // H3
          headingElement.style.fontSize = "24px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "12px";
          headingElement.style.marginTop = "12px";
          headingElement.style.color = "#555";
          headingElement.style.lineHeight = "1.3";
          break;
        case 4: // H4
          headingElement.style.fontSize = "20px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "10px";
          headingElement.style.marginTop = "10px";
          headingElement.style.color = "#666";
          headingElement.style.lineHeight = "1.3";
          break;
        case 5: // H5
          headingElement.style.fontSize = "18px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "8px";
          headingElement.style.marginTop = "8px";
          headingElement.style.color = "#777";
          headingElement.style.lineHeight = "1.4";
          break;
        case 6: // H6
          headingElement.style.fontSize = "16px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "6px";
          headingElement.style.marginTop = "6px";
          headingElement.style.color = "#888";
          headingElement.style.lineHeight = "1.4";
          break;
      }

      // Extract the selected content
      const headingFragment = range.extractContents();
      headingElement.appendChild(headingFragment);

      // Insert the heading element
      range.insertNode(headingElement);

      // Update selection to include the new heading
      selection.removeAllRanges();
      const headingRange = document.createRange();
      headingRange.selectNodeContents(headingElement);
      selection.addRange(headingRange);

      // Update the element content
      const headingUpdatedElement = {
        ...props.element,
        content: contentElement.value.innerHTML,
      };

      emit("update:element", headingUpdatedElement);
      return true;
    case "foreColor":
      command = "foreColor";
      break;
    case "backColor":
      command = "backColor";
      break;
    case "justifyLeft":
    case "justifyCenter":
    case "justifyRight":
    case "justifyFull":
      command = styleProperty;
      value2 = ""; // Use empty string instead of null
      break;
    default:
      // Using custom span for style
      // For unsupported commands, wrap in a span with inline style
      const span = document.createElement("span");
      span.style.setProperty(styleProperty, value as string);

      // Extract the selected content
      const fragment = range.extractContents();
      span.appendChild(fragment);

      // Insert the styled span
      range.insertNode(span);

      // Update selection to include the new span
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.addRange(newRange);

      // Update the element content
      const updatedElement = {
        ...props.element,
        content: contentElement.value.innerHTML,
      };

      emit("update:element", updatedElement);
      return true;
  }

  // For supported commands, use execCommand
  if (command) {
    // Using try-catch to handle deprecated execCommand
    try {
      document.execCommand(command, false, value2 as string);

      // Update the element content
      const updatedElement = {
        ...props.element,
        content: contentElement.value.innerHTML,
      };

      emit("update:element", updatedElement);
      return true;
    } catch (error) {
      console.warn(
        "execCommand is deprecated, consider using a modern alternative"
      );
      return false;
    }
  }

  return false;
}

// No longer needed - using direct text selection utility instead

function startDrag(event: MouseEvent) {
  if (isEditing.value || event.target === contentElement.value) return;

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

  const updatedElement = {
    ...props.element,
    position: {
      x: newX,
      y: newY,
    },
  };

  emit("update:element", updatedElement);
}

function stopDrag() {
  isDragging = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
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

// Resize is now handled by the ResizeHandles component

// Set up mutation observer to track DOM changes
function setupMutationObserver() {
  if (!contentElement.value) return;

  observer = new MutationObserver((mutations) => {
    if (isUpdating) return;

    // If the content changed, update the element
    const contentChanged = mutations.some(
      (mutation) =>
        mutation.type === "childList" || mutation.type === "characterData"
    );

    if (contentChanged) {
      // Get the current content
      const currentContent = contentElement.value?.innerHTML || "";

      // Skip empty content or if it's the same as the current element content
      if (currentContent === "" || currentContent === props.element.content) {
        return;
      }

      // Add a small delay to ensure the DOM has settled
      setTimeout(() => {
        if (contentElement.value && contentElement.value.innerHTML !== "") {
          handleTextChange({
            target: contentElement.value,
          } as unknown as Event);
        }
      }, 10);
    }
  });

  observer.observe(contentElement.value, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });
}

// Initialize the component
onMounted(() => {
  // Apply initial styles
  nextTick(() => {
    // Force update of the element style for block background
    if (props.element.style?.blockBackground) {
      // Apply initial block background color
      const elementDiv = contentElement.value?.parentElement;
      if (elementDiv) {
        elementDiv.style.backgroundColor =
          props.element.style.blockBackgroundColor || "#f5f5f5";
      }
    }
  });
});

// Expose methods to parent components
defineExpose({
  // No special methods needed anymore, selection is handled by the global selection manager
});

onMounted(() => {
  if (contentElement.value) {
    // Set initial content
    contentElement.value.innerHTML = props.element.content || "";

    // Ensure the element has proper attributes for editing
    contentElement.value.setAttribute("contenteditable", "true");
    contentElement.value.setAttribute("spellcheck", "false"); // Disable spell checking to avoid browser interference
    contentElement.value.setAttribute("data-text-element", "true"); // Add a data attribute for easier selection

    // Apply styles directly to ensure they take effect immediately
    Object.assign(contentElement.value.style, textStyle.value);

    // Set up mutation observer
    setupMutationObserver();

    // Add a click handler to ensure focus works correctly
    const element = contentElement.value;
    element.addEventListener("click", (e) => {
      if (e.target === element && element) {
        element.focus();
      }
    });

    // Add a mouseup handler to ensure selection is saved
    contentElement.value.addEventListener("mouseup", () => {
      // Add a small delay to ensure the selection is complete
      setTimeout(() => {
        // Save the selection for text formatting
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          // Selection saved in TextElement mouseup handler
        }
      }, 10);
    });

    // Add a keyup handler to ensure selection is saved after keyboard navigation
    contentElement.value.addEventListener("keyup", (e) => {
      // Only for navigation keys and shift (for selection)
      if (
        e.key.includes("Arrow") ||
        e.key === "Home" ||
        e.key === "End" ||
        e.key === "PageUp" ||
        e.key === "PageDown" ||
        e.key === "Shift"
      ) {
        // Save the selection for text formatting
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          // Selection saved in TextElement keyup handler
        }
      }
    });
  }
});

onBeforeUnmount(() => {
  // Clean up mutation observer
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped lang="scss">
.element {
  position: absolute;
  user-select: none;

  &.selected {
    outline: none;
  }
}

.text-element {
  overflow: hidden;

  .element-content {
    width: 100%;
    height: 100%;
    outline: none !important;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    caret-color: black; /* Ensure the caret is visible with high contrast */

    /* Ensure proper cursor positioning */
    &:focus {
      outline: none !important;
      box-shadow: none !important;
    }

    /* Fix for cursor position after line break */
    br {
      display: block;
      content: "";
      margin-top: 0;
      line-height: inherit;
      min-height: 1.5em; /* Ensure line breaks have consistent height */
      user-select: none; /* Prevent selection of line breaks */
    }

    /* Ensure empty lines are visible */
    &:empty::after {
      content: "\00a0"; /* Non-breaking space */
      display: inline;
    }

    /* Fix for cursor positioning on Enter key press */
    &[contenteditable] {
      -webkit-user-select: text;
      user-select: text;
      position: relative;
      cursor: text;
    }

    /* Improve text selection visibility */
    &::selection {
      background-color: rgba(0, 123, 255, 0.3) !important;
      color: inherit !important;
    }

    *::selection {
      background-color: rgba(0, 123, 255, 0.3) !important;
      color: inherit !important;
    }

    /* Ensure spans created by text formatting are properly styled */
    span {
      display: inline;
      vertical-align: baseline;
      line-height: normal; /* Prevent line height issues with font size changes */
    }

    /* Ensure font size spans are displayed correctly */
    span[style*="font-size"] {
      display: inline;
      vertical-align: baseline;
      line-height: normal;
    }

    /* Ensure proper cursor positioning in empty elements */
    &:empty {
      min-height: 1em;
      display: block;
    }

    /* Ensure proper cursor positioning with different font sizes */
    span,
    p,
    div,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      min-height: 1em;
      caret-color: black;
    }

    /* Style heading elements */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 0;
      padding: 0;
      display: block;
      line-height: 1.2;
      font-family: inherit;
    }

    /* Specific heading styles */
    h1 {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #333;
    }

    h2 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 14px;
      color: #444;
    }

    h3 {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 12px;
      color: #555;
    }

    h4 {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    h5 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    h6 {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    /* Handle zero-width spaces used for cursor positioning */
    &:after br {
      content: "";
      white-space: pre;
    }
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
  border-radius: 2px;
}
</style>
