import type { DocumentElement } from "../types/document";

/**
 * Element Utilities
 * Common functions for working with document elements
 */

/**
 * Generate a unique ID for a new element
 * @param type Element type
 * @returns Unique ID string
 */
export function generateElementId(type: string): string {
  return `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Get the appropriate icon for an element type
 * @param type The element type
 * @returns The icon name for the element type
 */
export function getElementIcon(type: string): string {
  switch (type) {
    case "text":
      return "mdi-format-text";
    case "image":
      return "mdi-image";
    case "shape":
      return "mdi-shape";
    case "table":
      return "mdi-table";
    case "signature":
      return "mdi-draw";
    case "form":
      return "mdi-form-select";
    case "grid":
      return "mdi-grid";
    case "group":
      return "mdi-folder-outline";
    default:
      return "mdi-shape-outline";
  }
}

/**
 * Creates a user-friendly name for the element based on its type and content
 * @param element The document element
 * @returns A user-friendly name for the element
 */
export function getElementName(element: DocumentElement): string {
  // Create a user-friendly name based on element type and content
  const prefix = element.type.charAt(0).toUpperCase() + element.type.slice(1);

  switch (element.type) {
    case "text":
      return "Text";

    case "shape":
      return "Shape";

    case "image":
      return "Image";
    case "group":
      return "Group";
    default:
      return `${prefix}`;
  }
}

/**
 * Create a new text element
 * @param x X position
 * @param y Y position
 * @param width Width
 * @param height Height
 * @param content Initial content
 * @returns New text element
 */
export function createTextElement(
  x: number,
  y: number,
  width: number = 200,
  height: number = 100,
  content: string = "New text block"
): DocumentElement {
  return {
    id: generateElementId("text"),
    type: "text",
    content,
    position: { x, y },
    size: { width, height },
    style: {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "normal",
      color: "#000000",
      backgroundColor: "transparent",
    },
    zIndex: 1,
  };
}

/**
 * Create a new image element
 * @param x X position
 * @param y Y position
 * @param width Width
 * @param height Height
 * @param imageUrl Image URL
 * @returns New image element
 */
export function createImageElement(
  x: number,
  y: number,
  width: number = 200,
  height: number = 200,
  imageUrl: string = ""
): DocumentElement {
  return {
    id: generateElementId("image"),
    type: "image",
    content: imageUrl,
    position: { x, y },
    size: { width, height },
    style: {
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "#000000",
      opacity: 1,
    },
    zIndex: 1,
  };
}

/**
 * Create a new shape element
 * @param x X position
 * @param y Y position
 * @param width Width
 * @param height Height
 * @param shapeType Shape type
 * @returns New shape element
 */
export function createShapeElement(
  x: number,
  y: number,
  width: number = 100,
  height: number = 100,
  shapeType: "rectangle" | "circle" | "triangle" | "arrow" = "rectangle"
): DocumentElement {
  return {
    id: generateElementId("shape"),
    type: "shape",
    content: shapeType,
    position: { x, y },
    size: { width, height },
    style: {
      fill: "#e0e0e0",
      stroke: "#000000",
      strokeWidth: 1,
      opacity: 1,
    },
    zIndex: 1,
  };
}

/**
 * Create a new group element
 * @param x X position
 * @param y Y position
 * @param width Width
 * @param height Height
 * @param children Child elements
 * @returns New group element
 */
export function createGroupElement(
  x: number,
  y: number,
  width: number,
  height: number,
  children: DocumentElement[] = []
): DocumentElement {
  return {
    id: generateElementId("group"),
    type: "group",
    content: "Group",
    position: { x, y },
    size: { width, height },
    style: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: "#666",
      backgroundColor: "transparent",
      opacity: 1,
    },
    zIndex: 1,
    children,
  };
}

/**
 * Duplicate an element
 * @param element Element to duplicate
 * @param offsetX X offset for the duplicate
 * @param offsetY Y offset for the duplicate
 * @returns Duplicated element
 */
export function duplicateElement(
  element: DocumentElement,
  offsetX: number = 20,
  offsetY: number = 20
): DocumentElement {
  // Create a deep copy of the element
  const duplicate = JSON.parse(JSON.stringify(element));

  // Generate a new ID
  duplicate.id = generateElementId(element.type);

  // Offset the position
  duplicate.position = {
    x: element.position.x + offsetX,
    y: element.position.y + offsetY,
  };

  // If it's a group, recursively duplicate children
  if (element.children && element.children.length > 0) {
    duplicate.children = element.children.map(
      (child) => duplicateElement(child, 0, 0) // No offset for children
    );
  }

  return duplicate;
}
