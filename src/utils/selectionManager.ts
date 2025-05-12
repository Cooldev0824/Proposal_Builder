/**
 * Global selection manager to handle text selection and formatting
 */

// Store the current selection
let savedRange: Range | null = null;
let savedElement: HTMLElement | null = null;

/**
 * Save the current selection
 */
export function saveSelection(): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);
  if (range.collapsed) {
    return false;
  }

  // Find the contenteditable element containing the selection
  let element = range.commonAncestorContainer as HTMLElement;
  if (element.nodeType !== Node.ELEMENT_NODE) {
    element = element.parentElement as HTMLElement;
  }

  // Find the closest contenteditable element
  while (element && !element.hasAttribute("contenteditable")) {
    element = element.parentElement as HTMLElement;
  }

  if (!element) {
    return false;
  }

  // Make sure the selection is within a text element
  const textElement = element.closest(".text-element");
  if (!textElement) {
    return false;
  }

  // Save the selection
  savedRange = range.cloneRange();
  savedElement = element;

  return true;
}

/**
 * Restore the saved selection
 */
export function restoreSelection(): boolean {
  if (!savedRange || !savedElement) return false;

  // Don't interfere with input fields
  if (isInputActive()) {
    return false;
  }

  try {
    // Focus the element first
    savedElement.focus();

    // Restore the selection
    const selection = window.getSelection();
    if (!selection) return false;

    selection.removeAllRanges();
    selection.addRange(savedRange.cloneRange());

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if there is a saved selection
 */
export function hasSavedSelection(): boolean {
  return savedRange !== null && savedElement !== null;
}

/**
 * Clear the saved selection
 */
export function clearSelection(): void {
  savedRange = null;
  savedElement = null;
}

/**
 * Apply a formatting command to the saved selection
 */
export function applyFormatting(
  command: string,
  value: string | boolean | null = null,
): boolean {
  // Don't interfere with input fields
  if (isInputActive()) {
    return false;
  }

  if (!savedRange || !savedElement) {
    return false;
  }

  try {
    // Focus the element first to ensure we're working with the right context
    savedElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection) return false;

    // Clear any existing selection
    selection.removeAllRanges();

    // Add our saved range
    const range = savedRange.cloneRange();
    selection.addRange(range);

    // Make sure we have a valid selection
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      console.error("Invalid selection range");
      return false;
    }

    // Check if the selection spans multiple blocks/paragraphs
    const currentRange = selection.getRangeAt(0);
    const isMultiLine = isMultiLineSelection(currentRange);

    // For multi-line selections with certain commands, use our custom approach
    if (
      isMultiLine &&
      (command === "foreColor" ||
        command === "backColor" ||
        command === "fontSize")
    ) {
      // Using custom approach for multi-line formatting

      // Map command to style property
      let styleProperty: string;
      let styleValue: string;

      switch (command) {
      case "foreColor":
        styleProperty = "color";
        styleValue = value as string;
        break;
      case "backColor":
        styleProperty = "backgroundColor";
        styleValue = value as string;
        break;
      case "fontSize":
        styleProperty = "fontSize";
        styleValue = `${value}px`;
        break;
      default: {
        // For other commands, try the standard execCommand
        document.execCommand("styleWithCSS", false, "true");
        const result = document.execCommand(command, false, value as string);

        // Save the selection again to preserve it for future operations
        saveSelection();

        return result;
      }
      }

      return applyStyleToMultiLineSelection(
        currentRange,
        styleProperty,
        styleValue,
      );
    } else {
      // For single-line selections or other commands, use the standard execCommand
      document.execCommand("styleWithCSS", false, "true");
      const result = document.execCommand(command, false, value as string);

      // Save the selection again to preserve it for future operations
      saveSelection();

      return result;
    }
  } catch (error) {
    // Error applying formatting
    return false;
  }
}

/**
 * Apply bold formatting to the saved selection
 */
export function applyBold(): boolean {
  return applyFormatting("bold");
}

/**
 * Apply italic formatting to the saved selection
 */
export function applyItalic(): boolean {
  return applyFormatting("italic");
}

/**
 * Apply underline formatting to the saved selection
 */
export function applyUnderline(): boolean {
  return applyFormatting("underline");
}

/**
 * Apply font family to the saved selection
 */
export function applyFontFamily(fontFamily: string): boolean {
  return applyFormatting("fontName", fontFamily);
}

/**
 * Apply font size to the saved selection
 */
export function applyFontSize(fontSize: number): boolean {
  if (!savedRange || !savedElement) {
    return false;
  }

  try {
    // Focus the element first to ensure we're working with the right context
    savedElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection) return false;

    // Clear any existing selection
    selection.removeAllRanges();

    // Add our saved range
    const range = savedRange.cloneRange();
    selection.addRange(range);

    // Make sure we have a valid selection
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      return false;
    }

    // Get the current range
    const currentRange = selection.getRangeAt(0);

    // Check if the selection spans multiple blocks/paragraphs
    const isMultiLine = isMultiLineSelection(currentRange);
    // Check if selection spans multiple lines

    // Use our improved multi-line handler for all selections
    // This will try multiple approaches in order of reliability
    const result = applyStyleToMultiLineSelection(
      currentRange,
      "fontSize",
      `${fontSize}px`,
    );

    if (result) {
      // Save the selection again to preserve it for future operations
      saveSelection();
      return true;
    }

    // If all else fails, try the most basic approach
    // Try basic execCommand as last resort
    document.execCommand("styleWithCSS", false, "true");
    const basicResult = document.execCommand("fontSize", false, "7"); // 7 is the largest size

    if (basicResult) {
      // Find all font elements with size 7 and replace with the actual size
      const fontElements = savedElement.querySelectorAll('font[size="7"]');
      fontElements.forEach((font) => {
        const span = document.createElement("span");
        span.style.fontSize = `${fontSize}px`;

        // Move all children from the font element to the span
        while (font.firstChild) {
          span.appendChild(font.firstChild);
        }

        // Replace the font element with the span
        if (font.parentNode) {
          font.parentNode.replaceChild(span, font);
        }
      });

      // Save the selection again to preserve it for future operations
      saveSelection();
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Apply text color to the saved selection
 */
export function applyTextColor(color: string): boolean {
  if (!savedRange || !savedElement) {
    return false;
  }

  try {
    // Focus the element first to ensure we're working with the right context
    savedElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection) return false;

    // Clear any existing selection
    selection.removeAllRanges();

    // Add our saved range
    const range = savedRange.cloneRange();
    selection.addRange(range);

    // Make sure we have a valid selection
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      console.error("Invalid selection range");
      return false;
    }

    // Get the current range
    const currentRange = selection.getRangeAt(0);

    // Check if the selection spans multiple blocks/paragraphs
    const isMultiLine = isMultiLineSelection(currentRange);
    // Check if selection spans multiple lines

    // Use our improved multi-line handler for all selections
    // This will try multiple approaches in order of reliability
    const result = applyStyleToMultiLineSelection(currentRange, "color", color);

    if (result) {
      // Save the selection again to preserve it for future operations
      saveSelection();
      return true;
    }

    // If all else fails, try the most basic approach
    // Try basic execCommand as last resort
    document.execCommand("styleWithCSS", false, "true");
    const basicResult = document.execCommand("foreColor", false, color);

    if (basicResult) {
      // Save the selection again to preserve it for future operations
      saveSelection();
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Apply background color to the saved selection
 */
export function applyBackgroundColor(color: string): boolean {
  if (!savedRange || !savedElement) {
    return false;
  }

  try {
    // Focus the element first to ensure we're working with the right context
    savedElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection) return false;

    // Clear any existing selection
    selection.removeAllRanges();

    // Add our saved range
    const range = savedRange.cloneRange();
    selection.addRange(range);

    // Make sure we have a valid selection
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      return false;
    }

    // Get the current range
    const currentRange = selection.getRangeAt(0);

    // Check if the selection spans multiple blocks/paragraphs
    const isMultiLine = isMultiLineSelection(currentRange);
    // Check if selection spans multiple lines

    // Use our improved multi-line handler for all selections
    // This will try multiple approaches in order of reliability
    const result = applyStyleToMultiLineSelection(
      currentRange,
      "backgroundColor",
      color,
    );

    if (result) {
      // Save the selection again to preserve it for future operations
      saveSelection();
      return true;
    }

    // If all else fails, try the most basic approach
    // Try basic execCommand as last resort
    document.execCommand("styleWithCSS", false, "true");
    const basicResult = document.execCommand("backColor", false, color);

    if (basicResult) {
      // Save the selection again to preserve it for future operations
      saveSelection();
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Apply both text color and background color to the saved selection at once
 */
export function applyTextAndBackgroundColor(
  textColor: string,
  backgroundColor: string,
): boolean {
  if (!savedRange || !savedElement) {
    return false;
  }

  try {
    // Focus the element first to ensure we're working with the right context
    savedElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection) return false;

    // Clear any existing selection
    selection.removeAllRanges();

    // Add our saved range
    const range = savedRange.cloneRange();
    selection.addRange(range);

    // Make sure we have a valid selection
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      return false;
    }

    // Get the current range
    const currentRange = selection.getRangeAt(0);

    // Check if the selection spans multiple blocks/paragraphs
    const isMultiLine = isMultiLineSelection(currentRange);
    // Check if selection spans multiple lines

    // Try to apply both styles at once using a single span
    try {
      // Clone the range to avoid modifying the original
      const clonedRange = currentRange.cloneRange();

      // Create a span with both styles
      const span = document.createElement("span");
      span.style.color = textColor;
      span.style.backgroundColor = backgroundColor;

      try {
        // Try surroundContents first (works for simple selections)
        clonedRange.surroundContents(span);

        // Create a new range that selects just the content we modified
        const newRange = document.createRange();
        newRange.selectNodeContents(span);

        // Update the selection
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Update our saved range
        savedRange = newRange.cloneRange();

        return true;
      } catch (error) {
        // surroundContents failed, trying separate applications

        // If surroundContents fails, apply colors separately
        // First apply text color
        const textColorSuccess = applyTextColor(textColor);

        if (textColorSuccess) {
          // Then apply background color
          const bgColorSuccess = applyBackgroundColor(backgroundColor);
          return bgColorSuccess;
        }

        return false;
      }
    } catch (error) {
      // Error applying combined colors

      // If all else fails, try applying colors separately as fallback

      // First apply text color
      const textColorSuccess = applyTextColor(textColor);

      if (textColorSuccess) {
        // Then apply background color
        const bgColorSuccess = applyBackgroundColor(backgroundColor);
        return bgColorSuccess;
      }

      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Apply text alignment to the saved selection
 */
export function applyTextAlignment(
  alignment: "left" | "center" | "right" | "justify",
): boolean {
  const command = `justify${alignment.charAt(0).toUpperCase()}${alignment.slice(
    1,
  )}`;
  return applyFormatting(command);
}

// Check if the active element is an input or textarea
export function isInputActive(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    activeElement.hasAttribute("contenteditable")
  );
}

/**
 * Check if a selection spans multiple blocks/paragraphs
 */
export function isMultiLineSelection(range: Range): boolean {
  try {
    // Get the common ancestor container of the selection
    const container = range.commonAncestorContainer;

    // If the container is a text node, we need to check its parent
    const parentElement =
      container.nodeType === Node.TEXT_NODE
        ? container.parentElement
        : (container as HTMLElement);

    if (!parentElement) return false;

    // Get the selected text
    const text = range.toString();

    // Check if the selection text contains newlines
    const containsNewlines = text.includes("\n");

    // Check if the selection contains any block-level elements or line breaks
    // First, clone the range contents to avoid modifying the original
    const fragment = range.cloneContents();
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(fragment);

    // Check for block elements and line breaks in the selection
    const containsBlockElements =
      tempDiv.querySelector(
        "div, p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote, table, tr, td, th",
      ) !== null;
    const containsLineBreaks = tempDiv.querySelector("br") !== null;

    // Check if the selection spans multiple nodes
    const spansMultipleNodes = range.startContainer !== range.endContainer;

    // Check if the selection spans multiple paragraphs by looking at the DOM structure
    let spansMultipleParagraphs = false;
    if (spansMultipleNodes) {
      // Get all text nodes in the selection
      const textNodes: Node[] = [];
      const walker = document.createTreeWalker(
        parentElement,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Only accept text nodes that are not empty
            return node.textContent && node.textContent.trim() !== ""
              ? NodeFilter.FILTER_ACCEPT
              : NodeFilter.FILTER_REJECT;
          },
        },
      );

      let node;
      while ((node = walker.nextNode())) {
        textNodes.push(node);
      }

      // Check if the selection spans multiple paragraphs
      if (textNodes.length > 1) {
        const startNodeIndex = textNodes.indexOf(range.startContainer);
        const endNodeIndex = textNodes.indexOf(range.endContainer);

        if (
          startNodeIndex !== -1 &&
          endNodeIndex !== -1 &&
          startNodeIndex !== endNodeIndex
        ) {
          // Check if any nodes between start and end are in different paragraphs
          for (let i = startNodeIndex; i <= endNodeIndex; i++) {
            const node = textNodes[i];
            const parentParagraph = node.parentElement?.closest(
              "p, div, li, td, th, h1, h2, h3, h4, h5, h6",
            );

            if (parentParagraph) {
              for (let j = i + 1; j <= endNodeIndex; j++) {
                const otherNode = textNodes[j];
                const otherParentParagraph = otherNode.parentElement?.closest(
                  "p, div, li, td, th, h1, h2, h3, h4, h5, h6",
                );

                if (
                  otherParentParagraph &&
                  parentParagraph !== otherParentParagraph
                ) {
                  spansMultipleParagraphs = true;
                  break;
                }
              }

              if (spansMultipleParagraphs) break;
            }
          }
        }
      }
    }

    // Selection analysis complete

    return (
      containsNewlines ||
      containsBlockElements ||
      containsLineBreaks ||
      spansMultipleParagraphs
    );
  } catch (error) {
    // If there's an error, assume it's not a multi-line selection
    return false;
  }
}

/**
 * Apply a style to a multi-line selection by processing each line separately
 */
export function applyStyleToMultiLineSelection(
  range: Range,
  styleProperty: string,
  value: string,
): boolean {
  try {
    // First, try using the document.execCommand approach (most reliable)
    if (
      styleProperty === "color" ||
      styleProperty === "backgroundColor" ||
      styleProperty === "fontSize"
    ) {
      // Focus the element first to ensure we're working with the right context
      if (savedElement) {
        savedElement.focus();
      }

      // Map style property to execCommand
      let command: string;
      let commandValue: string = value;

      if (styleProperty === "color") {
        command = "foreColor";
      } else if (styleProperty === "backgroundColor") {
        command = "backColor";
      } else if (styleProperty === "fontSize") {
        command = "fontSize";
        // For fontSize, we need to use a different approach
        // First apply a standard size (7) and then replace with actual size
        commandValue = "7";
      } else {
        command = styleProperty;
      }

      // Enable CSS styling
      document.execCommand("styleWithCSS", false, "true");

      // Apply the command
      const result = document.execCommand(command, false, commandValue);

      // For fontSize, we need to replace the font elements with spans
      if (result && styleProperty === "fontSize" && savedElement) {
        // Find all font elements with size 7 and replace with the actual size
        const fontElements = savedElement.querySelectorAll('font[size="7"]');
        fontElements.forEach((font) => {
          const span = document.createElement("span");
          span.style.fontSize = value;

          // Move all children from the font element to the span
          while (font.firstChild) {
            span.appendChild(font.firstChild);
          }

          // Replace the font element with the span
          if (font.parentNode) {
            font.parentNode.replaceChild(span, font);
          }
        });
      }

      if (result) {
        // Save the selection again to preserve it for future operations
        saveSelection();

        return true;
      }
    }

    // If execCommand fails, try the surroundContents approach
    console.log(
      `execCommand failed, trying surroundContents for ${styleProperty}`,
    );

    try {
      // Create a span with the style
      const span = document.createElement("span");
      span.style[styleProperty as any] = value;

      // Try to use surroundContents (works for simple selections)
      range.surroundContents(span);

      // Create a new range that selects just the content we modified
      const newRange = document.createRange();
      newRange.selectNodeContents(span);

      // Update the selection
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Update our saved range
        savedRange = newRange.cloneRange();
      }

      console.log(
        `Applied ${styleProperty}: ${value} to selection using surroundContents`,
      );
      return true;
    } catch (error) {
      console.error(
        "surroundContents failed, trying iterative approach:",
        error,
      );

      // If surroundContents fails, use a more complex approach for multi-line selections
      // Clone the range to avoid modifying the original
      const clonedRange = range.cloneRange();

      // Get the selected content as HTML
      const fragment = clonedRange.cloneContents();
      const tempDiv = document.createElement("div");
      tempDiv.appendChild(fragment);

      // Store the original content for backup
      const originalContent = tempDiv.innerHTML;

      try {
        // Apply the style to all text nodes in the selection
        const textNodes = getAllTextNodes(tempDiv);

        // If there are no text nodes, apply the style to the container
        if (textNodes.length === 0) {
          tempDiv.style[styleProperty as any] = value;
        } else {
          // Apply the style to each text node
          textNodes.forEach((node) => {
            if (node.textContent && node.textContent.trim() !== "") {
              // Create a span with the style
              const span = document.createElement("span");
              span.style[styleProperty as any] = value;
              span.textContent = node.textContent;

              // Replace the text node with the span
              if (node.parentNode) {
                node.parentNode.replaceChild(span, node);
              }
            }
          });
        }

        // Replace the original content with the styled content
        range.deleteContents();

        // Create a document fragment from the styled content
        const styledFragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          styledFragment.appendChild(tempDiv.firstChild);
        }

        // Insert the styled content
        range.insertNode(styledFragment);

        // Create a new range that encompasses all the modified content
        const newRange = document.createRange();
        newRange.selectNodeContents(range.commonAncestorContainer);

        // Update the selection
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);

          // Update our saved range
          savedRange = newRange.cloneRange();
        }

        console.log(
          `Applied ${styleProperty}: ${value} to multi-line selection using iterative approach`,
        );
        return true;
      } catch (error) {
        console.error("Error applying style to multi-line selection:", error);

        // If all else fails, try a simpler approach as a last resort
        try {
          // Delete the original content
          range.deleteContents();

          // Create a span with the style
          const span = document.createElement("span");
          span.style[styleProperty as any] = value;
          span.innerHTML = originalContent;

          // Insert the span
          range.insertNode(span);

          // Create a new range that selects just the content we modified
          const newRange = document.createRange();
          newRange.selectNodeContents(span);

          // Update the selection
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(newRange);

            // Update our saved range
            savedRange = newRange.cloneRange();
          }

          console.log(
            `Applied ${styleProperty}: ${value} to selection using fallback approach`,
          );
          return true;
        } catch (finalError) {
          console.error("All approaches failed:", finalError);
          return false;
        }
      }
    }
  } catch (error) {
    console.error("Error applying style to multi-line selection:", error);
    return false;
  }
}

/**
 * Get all text nodes in a container
 */
function getAllTextNodes(container: Node): Node[] {
  const textNodes: Node[] = [];
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Only accept text nodes that are not empty
      return node.textContent && node.textContent.trim() !== ""
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  return textNodes;
}

/**
 * Process all nodes in a container to apply a style
 * This is a more careful implementation that preserves the original DOM structure
 */
function processNodesForStyling(
  container: Node,
  styleProperty: string,
  value: string,
): void {
  try {
    // Use a different approach based on the node type
    if (container.nodeType === Node.TEXT_NODE) {
      // For text nodes, wrap them in a span with the style only if they have content
      if (container.textContent && container.textContent.trim() !== "") {
        try {
          // Create a span with the style
          const span = document.createElement("span");
          span.style[styleProperty as any] = value;
          span.textContent = container.textContent;

          // Replace the text node with the span
          if (container.parentNode) {
            container.parentNode.replaceChild(span, container);
          }
        } catch (error) {
          console.error("Error processing text node:", error);
          // If there's an error, leave the node as is
        }
      }
    } else if (container.nodeType === Node.ELEMENT_NODE) {
      // For element nodes
      const element = container as HTMLElement;

      try {
        // Check if this is a span or other inline element that we can apply style to directly
        const isInlineElement =
          getComputedStyle(element).display === "inline" ||
          element.tagName.toLowerCase() === "span";

        if (isInlineElement) {
          // Apply the style directly to inline elements
          element.style[styleProperty as any] = value;
        }

        // Process all child nodes
        // We need to create a copy of childNodes because it's a live collection
        // and will change as we modify the DOM
        const childNodes = Array.from(element.childNodes);

        for (const childNode of childNodes) {
          processNodesForStyling(childNode, styleProperty, value);
        }
      } catch (error) {
        console.error("Error processing element node:", error);

        // If there's an error with the element, try to process its children anyway
        try {
          const childNodes = Array.from(element.childNodes);
          for (const childNode of childNodes) {
            processNodesForStyling(childNode, styleProperty, value);
          }
        } catch (childError) {
          console.error("Error processing element children:", childError);
        }
      }
    } else if (container.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
      // For document fragments, process all child nodes
      const childNodes = Array.from(container.childNodes);
      for (const childNode of childNodes) {
        processNodesForStyling(childNode, styleProperty, value);
      }
    }
  } catch (error) {
    console.error("Error in processNodesForStyling:", error);
  }
}

/**
 * Apply a style directly to the selected text using a simpler approach
 * This is a fallback method when other approaches fail
 */
export function applyStyleDirectly(
  styleProperty: string,
  value: string,
): boolean {
  if (!savedRange || !savedElement) {
    console.error("Cannot apply style: No saved selection");
    return false;
  }

  try {
    // Focus the element first to ensure we're working with the right context
    savedElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection) return false;

    // Clear any existing selection
    selection.removeAllRanges();

    // Add our saved range
    const range = savedRange.cloneRange();
    selection.addRange(range);

    // Make sure we have a valid selection
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      console.error("Invalid selection range");
      return false;
    }

    // Create a simple span with the style
    const span = document.createElement("span");
    span.style[styleProperty as any] = value;

    // Use surroundContents which is more reliable than extractContents/insertNode
    try {
      // This might fail if the selection crosses multiple block elements
      range.surroundContents(span);

      // Create a new range that selects just the content we modified
      const newRange = document.createRange();
      newRange.selectNodeContents(span);

      // Update the selection
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Update our saved range
      savedRange = newRange.cloneRange();

      console.log(
        `Applied ${styleProperty}: ${value} to selection using direct method`,
      );
      return true;
    } catch (error) {
      console.error(
        "Error with surroundContents, falling back to execCommand:",
        error,
      );

      // Try execCommand as a last resort
      if (styleProperty === "color") {
        document.execCommand("foreColor", false, value);
        return true;
      } else if (styleProperty === "backgroundColor") {
        document.execCommand("backColor", false, value);
        return true;
      } else if (styleProperty === "fontSize") {
        // For fontSize, we need to use a different approach
        document.execCommand("fontSize", false, "7");

        // Find all font elements with size 7 and replace with the actual size
        const fontElements = savedElement.querySelectorAll('font[size="7"]');
        fontElements.forEach((font) => {
          font.removeAttribute("size");
          if (font instanceof HTMLElement) {
            font.style.fontSize = value;
          }
        });

        return true;
      }

      return false;
    }
  } catch (error) {
    console.error("Error applying style directly:", error);
    return false;
  }
}

/**
 * Apply a style to a text selection using the most direct and reliable approach
 * This is a simplified version that focuses on stability
 */
export function directlyApplyStyle(
  styleProperty: string,
  value: string,
): boolean {
  if (!savedRange || !savedElement) {
    console.error(`Cannot apply ${styleProperty}: No saved selection`);
    return false;
  }

  try {
    // Focus the element first to ensure we're working with the right context
    savedElement.focus();

    // Get the current selection
    const selection = window.getSelection();
    if (!selection) return false;

    // Clear any existing selection
    selection.removeAllRanges();

    // Add our saved range
    const range = savedRange.cloneRange();
    selection.addRange(range);

    // Make sure we have a valid selection
    if (selection.rangeCount === 0 || selection.getRangeAt(0).collapsed) {
      console.error("Invalid selection range");
      return false;
    }

    // Use the most direct and reliable approach: document.execCommand
    // This is the browser's built-in way to format text and works in most cases
    document.execCommand("styleWithCSS", false, "true");

    // Handle font size differently from other properties
    if (styleProperty === "fontSize") {
      // For font size, we'll use a direct span approach instead of execCommand
      console.log(`Applying fontSize: ${value} using direct span approach`);

      try {
        // Get the current selection
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        // Get the current range
        const range = selection.getRangeAt(0);

        // Check if this is a multi-line selection
        const isMultiLine = isMultiLineSelection(range);
        console.log("Is multi-line selection for font size:", isMultiLine);

        if (isMultiLine) {
          // For multi-line selections, we need a different approach
          return applyFontSizeToMultiLineSelection(range, value);
        }

        // For single-line selections, use the direct span approach
        // Create a document fragment from the selection
        const fragment = range.extractContents();

        // Create a span with the specified font size
        const span = document.createElement("span");
        span.style.fontSize = value;

        // Add the fragment to the span
        span.appendChild(fragment);

        // Insert the span at the current position
        range.insertNode(span);

        // Create a new range that selects the span content
        const newRange = document.createRange();
        newRange.selectNodeContents(span);

        // Update the selection
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Update our saved range
        savedRange = newRange.cloneRange();

        console.log(`Applied fontSize: ${value} using direct span approach`);
        return true;
      } catch (error) {
        console.error(
          "Error applying font size with direct span approach:",
          error,
        );

        // Fall back to execCommand as a last resort
        try {
          document.execCommand("styleWithCSS", false, "true");
          document.execCommand("fontSize", false, "7");

          // Find all font elements with size 7 and replace with the actual size
          const fontElements = savedElement.querySelectorAll('font[size="7"]');
          console.log(`Found ${fontElements.length} font elements to update`);

          fontElements.forEach((font) => {
            // Create a span with the specified font size
            const span = document.createElement("span");
            span.style.fontSize = value;

            // Move all children from the font element to the span
            while (font.firstChild) {
              span.appendChild(font.firstChild);
            }

            // Replace the font element with the span
            if (font.parentNode) {
              font.parentNode.replaceChild(span, font);
            }
          });

          return true;
        } catch (fallbackError) {
          console.error(
            "Error applying font size with fallback approach:",
            fallbackError,
          );
          return false;
        }
      }
    }

    // Handle heading style
    if (styleProperty === "heading") {
      console.log(`Applying heading level ${value} using direct approach`);

      try {
        // Get the current selection
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return false;

        // Get the current range
        const range = selection.getRangeAt(0);

        // Extract the selected content
        const fragment = range.extractContents();

        // Create the appropriate heading element (h1, h2, etc.)
        const headingLevel = parseInt(value);
        if (isNaN(headingLevel) || headingLevel < 1 || headingLevel > 6) {
          console.error("Invalid heading level:", value);
          return false;
        }

        // Create the heading element
        const headingTag = `h${headingLevel}`;
        const headingElement = document.createElement(headingTag);

        // Set appropriate styles based on heading level
        switch (headingLevel) {
        case 1: // H1
          headingElement.style.fontSize = "32px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "16px";
          headingElement.style.color = "#333";
          break;
        case 2: // H2
          headingElement.style.fontSize = "28px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "14px";
          headingElement.style.color = "#444";
          break;
        case 3: // H3
          headingElement.style.fontSize = "24px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "12px";
          headingElement.style.color = "#555";
          break;
        default: // H4-H6
          headingElement.style.fontSize = 28 - headingLevel * 2 + "px";
          headingElement.style.fontWeight = "bold";
          headingElement.style.marginBottom = "10px";
          break;
        }

        // Add the fragment to the heading element
        headingElement.appendChild(fragment);

        // Insert the heading element at the current position
        range.insertNode(headingElement);

        // Create a new range that selects the heading content
        const newRange = document.createRange();
        newRange.selectNodeContents(headingElement);

        // Update the selection
        selection.removeAllRanges();
        selection.addRange(newRange);

        // Update our saved range
        savedRange = newRange.cloneRange();

        console.log(`Applied heading level ${value} using direct approach`);
        return true;
      } catch (error) {
        console.error("Error applying heading with direct approach:", error);
        return false;
      }
    }

    // For other properties, use execCommand
    let command = "";
    const commandValue = value;

    if (styleProperty === "color") {
      command = "foreColor";
    } else if (styleProperty === "backgroundColor") {
      command = "backColor";
    } else {
      // For other properties, try to use the property name directly
      command = styleProperty;
    }

    console.log(
      `Applying ${styleProperty} with value ${value} using execCommand ${command}`,
    );
    const result = document.execCommand(command, false, commandValue);

    // Save the selection again to preserve it for future operations
    saveSelection();

    console.log(`Applied ${styleProperty}: ${value} to selection`);
    return true;
  } catch (error) {
    console.error(`Error applying ${styleProperty}:`, error);
    return false;
  }
}

/**
 * Apply font size to a multi-line selection
 * This function handles the special case of multi-line selections for font size
 */
function applyFontSizeToMultiLineSelection(
  range: Range,
  fontSize: string,
): boolean {
  try {
    console.log("Applying font size to multi-line selection:", fontSize);

    // Clone the range to avoid modifying the original
    const clonedRange = range.cloneRange();

    // Get the selected content as HTML
    const fragment = clonedRange.cloneContents();

    // Create a temporary div to hold the content
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(fragment);

    // Find all text nodes in the selection
    const textNodes = getAllTextNodesInElement(tempDiv);
    console.log(`Found ${textNodes.length} text nodes in multi-line selection`);

    // Apply font size to each text node
    textNodes.forEach((node) => {
      if (node.textContent && node.textContent.trim() !== "") {
        // Create a span with the specified font size
        const span = document.createElement("span");
        span.style.fontSize = fontSize;
        span.textContent = node.textContent;

        // Replace the text node with the span
        if (node.parentNode) {
          node.parentNode.replaceChild(span, node);
        }
      }
    });

    // Replace the original content with the styled content
    range.deleteContents();

    // Insert the styled content
    while (tempDiv.firstChild) {
      range.insertNode(tempDiv.firstChild);
      range.collapse(false); // Move to the end of the inserted node
    }

    // Create a new range that encompasses all the modified content
    const newRange = document.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.endContainer, range.endOffset);

    // Update the selection
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Update our saved range
      savedRange = newRange.cloneRange();
    }

    console.log("Successfully applied font size to multi-line selection");
    return true;
  } catch (error) {
    console.error("Error applying font size to multi-line selection:", error);
    return false;
  }
}

/**
 * Get all text nodes in an element
 */
function getAllTextNodesInElement(element: Node): Node[] {
  const textNodes: Node[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Only accept text nodes that are not empty
      return node.textContent && node.textContent.trim() !== ""
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });

  let node;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  return textNodes;
}

// Set up global event listeners to track selection
export function initSelectionTracking(): void {
  document.addEventListener("selectionchange", () => {
    // Don't interfere with input fields
    if (isInputActive()) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    // Save the selection when it changes
    saveSelection();
  });

  document.addEventListener("mouseup", () => {
    // Don't interfere with input fields
    if (isInputActive()) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    // Save the selection after mouse up (when user finishes selecting)
    saveSelection();
  });

  document.addEventListener("keyup", (event) => {
    // Don't interfere with input fields
    if (isInputActive()) return;

    // Only track selection changes for navigation keys
    if (
      event.key.includes("Arrow") ||
      event.key === "Home" ||
      event.key === "End" ||
      event.key === "PageUp" ||
      event.key === "PageDown" ||
      event.key === "Shift"
    ) {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return;
      }

      // Save the selection after key navigation
      saveSelection();
    }
  });
}
