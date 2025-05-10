/**
 * Utility functions for working with text selection
 */

/**
 * Check if there is text currently selected in the document
 */
export function hasSelectedText(): boolean {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return false;

  const range = selection.getRangeAt(0);
  return !range.collapsed;
}

/**
 * Apply a style to the currently selected text
 * @param styleProperty The style property to apply (e.g., 'bold', 'italic', 'foreColor')
 * @param value The value to apply (e.g., true, '#ff0000')
 * @returns true if the style was applied, false otherwise
 */
export function applyStyleToSelectedText(
  styleProperty: string,
  value: string | boolean
): boolean {
  console.log(`Applying style: ${styleProperty} = ${value} to selected text`);

  // Save the current selection state before applying styles
  const selectionState = saveSelectionState();
  if (!selectionState) {
    console.error("No selection found or could not save selection state");
    return false;
  }

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) {
    console.error("No selection found");
    return false;
  }

  const range = selection.getRangeAt(0);
  console.log("Selection range:", range.toString());

  // If no text is selected, return false
  if (range.collapsed) {
    console.error("Range is collapsed (no text selected)");
    return false;
  }

  // Apply the style to the selected text
  let command = "";
  let commandValue: string | null = null;

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
      commandValue = value as string;
      break;
    case "fontSize":
      command = "fontSize";
      commandValue = value + "px";
      break;
    case "foreColor":
      command = "foreColor";
      commandValue = value as string;
      break;
    case "backColor":
      command = "backColor";
      commandValue = value as string;
      break;
    case "justifyLeft":
    case "justifyCenter":
    case "justifyRight":
    case "justifyFull":
      command = styleProperty;
      break;
    default:
      console.log(`Using custom span for style: ${styleProperty}`);
      try {
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

        console.log("Style applied successfully with span");
        return true;
      } catch (error) {
        console.error("Error applying custom style:", error);
        // Try to restore the original selection
        restoreSelectionState(selectionState);
        return false;
      }
  }

  // For supported commands, use execCommand
  if (command) {
    try {
      console.log(`Using execCommand: ${command} with value: ${commandValue}`);
      document.execCommand(command, false, commandValue || undefined);
      console.log("Style applied successfully with execCommand");
      return true;
    } catch (error) {
      console.error("Error applying style with execCommand:", error);
      // Try to restore the original selection
      restoreSelectionState(selectionState);
      return false;
    }
  }

  console.error("Failed to apply style");
  return false;
}

/**
 * Save the current selection state
 * @returns A selection state object that can be restored later
 */
export function saveSelectionState() {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  const range = selection.getRangeAt(0);

  // Store more information about the selection to help with restoration
  return {
    range: range.cloneRange(),
    text: selection.toString(),
    startContainer: range.startContainer,
    startOffset: range.startOffset,
    endContainer: range.endContainer,
    endOffset: range.endOffset,
  };
}

/**
 * Restore a previously saved selection state
 * @param state The selection state to restore
 * @returns true if the selection was restored, false otherwise
 */
export function restoreSelectionState(
  state: {
    range: Range;
    text: string;
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
  } | null
): boolean {
  if (!state || !state.range) return false;

  try {
    const selection = window.getSelection();
    if (!selection) return false;

    // Try to create a new range based on the saved start and end points
    try {
      const newRange = document.createRange();
      newRange.setStart(state.startContainer, state.startOffset);
      newRange.setEnd(state.endContainer, state.endOffset);

      selection.removeAllRanges();
      selection.addRange(newRange);
      return true;
    } catch (e) {
      console.warn(
        "Failed to restore selection using containers, falling back to range clone",
        e
      );
      // Fall back to the cloned range if the containers are no longer valid
      selection.removeAllRanges();
      selection.addRange(state.range.cloneRange());
      return true;
    }
  } catch (error) {
    console.error("Error restoring selection:", error);
    return false;
  }
}
