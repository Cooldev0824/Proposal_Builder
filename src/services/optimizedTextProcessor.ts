/**
 * Optimized Text Processor for PDF Export
 */

declare interface NodeListOf<TNode extends Node> extends ArrayLike<TNode> {
  forEach(callbackfn: (value: TNode, key: number, parent: NodeListOf<TNode>) => void): void;
  item(index: number): TNode | null;
}

/**
 * Process text elements to ensure styles are applied correctly in the PDF
 */
export function processTextElements(textElements: NodeListOf<Element>): void {
  textElements.forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    processBlockBackground(element);

    const contentElement = element.querySelector(".element-content");
    if (contentElement instanceof HTMLElement) {
      processContentElement(contentElement, element);
    }
  });
}

/**
 * Process block background for a text element
 */
function processBlockBackground(element: HTMLElement): void {
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.backgroundColor;

  if (
    backgroundColor &&
    backgroundColor !== "rgba(0, 0, 0, 0)" &&
    backgroundColor !== "transparent"
  ) {
    element.style.setProperty(
      "background-color",
      backgroundColor,
      "important",
    );
    element.style.setProperty("padding", "8px", "important");
  }
}

/**
 * Process content element within a text element
 */
function processContentElement(contentElement: HTMLElement, parentElement: HTMLElement): void {
  if (contentElement.style.color) {
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

  applyFontStyles(contentElement);

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
 */
function applyFontStyles(contentElement: HTMLElement): void {
  if (contentElement.style.fontFamily) {
    contentElement.style.setProperty(
      "font-family",
      contentElement.style.fontFamily,
      "important",
    );
  }

  if (contentElement.style.fontSize) {
    contentElement.style.setProperty(
      "font-size",
      contentElement.style.fontSize,
      "important",
    );
  }

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
 */
export function processShapeElements(shapeElements: NodeListOf<Element>): void {
  shapeElements.forEach((element) => {
    if (!(element instanceof HTMLElement)) return;

    const polygon = element.querySelector("polygon");
    if (polygon) {
      element.style.backgroundColor = "transparent";
      element.style.border = "none";
    }
  });
}

/**
 * Hide UI controls that shouldn't appear in the PDF
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
