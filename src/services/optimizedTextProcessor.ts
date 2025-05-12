/**
 * Optimized Text Processor for PDF Export
 *
 * This module handles text element processing for PDF export, extracted from pdfExportService.ts
 * to improve maintainability and performance.
 */

// Define NodeListOf type for ESLint
declare interface NodeListOf<TNode extends Node> extends ArrayLike<TNode> {
  forEach(callbackfn: (value: TNode, key: number, parent: NodeListOf<TNode>) => void): void;
  item(index: number): TNode | null;
}

/**
 * Process text elements to ensure styles are applied correctly in the PDF
 * @param textElements - The collection of text elements to process
 */
export function processTextElements(textElements: NodeListOf<Element>): void {
  textElements.forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    // Process block background
    processBlockBackground(element);

    // Process content element
    const contentElement = element.querySelector(".element-content");
    if (contentElement instanceof HTMLElement) {
      processContentElement(contentElement, element);
    }
  });
}

/**
 * Process block background for a text element
 * @param element - The text element to process
 */
function processBlockBackground(element: HTMLElement): void {
  // Force background color to be applied to the text element container
  // This is critical for block backgrounds
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.backgroundColor;

  if (
    backgroundColor &&
    backgroundColor !== "rgba(0, 0, 0, 0)" &&
    backgroundColor !== "transparent"
  ) {
    // Apply the background color with !important to ensure it's rendered
    element.style.setProperty(
      "background-color",
      backgroundColor,
      "important",
    );
    // Add padding to ensure the background is visible
    element.style.setProperty("padding", "8px", "important");
  }
}

/**
 * Process content element within a text element
 * @param contentElement - The content element to process
 * @param parentElement - The parent text element
 */
function processContentElement(contentElement: HTMLElement, parentElement: HTMLElement): void {
  // Ensure text color is applied
  if (contentElement.style.color) {
    // Apply color to all child elements
    const textNodes = contentElement.querySelectorAll("*");
    textNodes.forEach((node) => {
      if (node instanceof HTMLElement && !node.style.color) {
        node.style.setProperty(
          "color",
          contentElement.style.color,
          "important",
        );
      }
    });
  }

  // Ensure font styles are applied
  applyFontStyles(contentElement);

  // Make the content element transparent if the parent has a background
  const computedStyle = window.getComputedStyle(parentElement);
  const backgroundColor = computedStyle.backgroundColor;

  if (
    backgroundColor &&
    backgroundColor !== "rgba(0, 0, 0, 0)" &&
    backgroundColor !== "transparent"
  ) {
    contentElement.style.setProperty(
      "background-color",
      "transparent",
      "important",
    );
  }
}

/**
 * Apply font styles to a content element
 * @param contentElement - The content element to apply styles to
 */
function applyFontStyles(contentElement: HTMLElement): void {
  // Apply font family
  if (contentElement.style.fontFamily) {
    contentElement.style.setProperty(
      "font-family",
      contentElement.style.fontFamily,
      "important",
    );
  }

  // Apply font size
  if (contentElement.style.fontSize) {
    contentElement.style.setProperty(
      "font-size",
      contentElement.style.fontSize,
      "important",
    );
  }

  // Apply font weight
  if (contentElement.style.fontWeight) {
    contentElement.style.setProperty(
      "font-weight",
      contentElement.style.fontWeight,
      "important",
    );
  }
}

/**
 * Process shape elements to ensure they render correctly in the PDF
 * @param shapeElements - The collection of shape elements to process
 */
export function processShapeElements(shapeElements: NodeListOf<Element>): void {
  shapeElements.forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    // Check if this is a triangle by looking for polygon elements
    const polygon = element.querySelector("polygon");
    if (polygon) {
      // Make sure the container is transparent
      element.style.backgroundColor = "transparent";
      element.style.border = "none";
    }
  });
}

/**
 * Hide UI controls that shouldn't appear in the PDF
 * @param pageElement - The page element to process
 */
export function hideUiControls(pageElement: HTMLElement): void {
  const uiElements = pageElement.querySelectorAll(
    ".resize-handle, .scroll-control, .v-navigation-drawer, " +
    ".v-overlay, .v-menu, .v-btn--icon, button, " +
    "[role='button'], .control-button, .handle, " +
    ".v-slider, .v-input__control",
  );

  uiElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.opacity = "0";
    }
  });
}
