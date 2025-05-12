/**
 * Optimized Image Processor for PDF Export
 *
 * This module handles image processing for PDF export, extracted from pdfExportService.ts
 * to improve maintainability and performance.
 */

// Define NodeListOf type for ESLint
declare interface NodeListOf<TNode extends Node> extends ArrayLike<TNode> {
  forEach(callbackfn: (value: TNode, key: number, parent: NodeListOf<TNode>) => void): void;
  item(index: number): TNode | null;
}

/**
 * Process images in a document to ensure they render correctly in the PDF
 * @param images - The collection of image elements to process
 * @param objectFitDefault - Default object-fit value if not specified
 */
export function processImages(images: NodeListOf<HTMLImageElement>, objectFitDefault: string = "cover"): void {
  images.forEach((img) => {
    // Set cross-origin attribute for external images
    img.crossOrigin = "anonymous";

    // Get the parent container (for positioning)
    const container = img.parentElement;

    // Make sure images are visible
    img.style.display = "block";
    img.style.visibility = "visible";

    // Get computed object-fit style
    const computedStyle = window.getComputedStyle(img);
    const objectFit = computedStyle.objectFit || img.style.objectFit || objectFitDefault;

    // Apply appropriate styling based on object-fit
    applyObjectFitStyles(img, objectFit);

    // Ensure parent container has proper positioning
    if (container && container instanceof HTMLElement) {
      container.style.position = "relative";
      container.style.overflow = "hidden";
      container.style.boxSizing = "border-box";
    }
  });
}

/**
 * Apply appropriate styles based on object-fit value
 * @param img - The image element to style
 * @param objectFit - The object-fit value to apply
 */
function applyObjectFitStyles(img: HTMLImageElement, objectFit: string): void {
  switch (objectFit) {
  case "contain":
    // For contain, maintain aspect ratio while ensuring the image fits within the container
    img.style.objectFit = "contain";
    img.style.height = "100%"; // Always fit the height
    img.style.width = "auto"; // Let width adjust to maintain aspect ratio
    img.style.maxWidth = "none"; // Allow width to exceed container if needed
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "50%";
    img.style.transform = "translateX(-50%)"; // Center horizontally
    break;

  case "cover":
    // For cover, fill the container while maintaining aspect ratio
    img.style.objectFit = "cover";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    break;

  case "fill":
    // For fill, stretch the image to fill the container
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "fill";
    break;

  case "none":
    // For none, show the image at its natural size
    img.style.maxHeight = "100%"; // Limit height to container
    img.style.width = "auto"; // Let width adjust to maintain aspect ratio
    img.style.position = "absolute";
    img.style.top = "50%";
    img.style.left = "50%";
    img.style.transform = "translate(-50%, -50%)";
    break;

  case "scale-down":
    // For scale-down, show the image at its natural size or scaled down if too large
    img.style.maxHeight = "100%"; // Limit height to container
    img.style.width = "auto"; // Let width adjust to maintain aspect ratio
    img.style.maxWidth = "none"; // Allow width to exceed container if needed
    img.style.position = "absolute";
    img.style.top = "50%";
    img.style.left = "50%";
    img.style.transform = "translate(-50%, -50%)";
    break;
  }
}

/**
 * Process SVG elements to ensure they render correctly in the PDF
 * @param svgElements - The collection of SVG elements to process
 */
export function processSvgElements(svgElements: NodeListOf<SVGElement>): void {
  svgElements.forEach((svg) => {
    // Add XML namespace if missing
    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    // Ensure SVG has explicit dimensions
    if (svg.style.width === "") {
      svg.style.width = svg.getAttribute("width") + "px";
    }
    if (svg.style.height === "") {
      svg.style.height = svg.getAttribute("height") + "px";
    }

    // Force SVG to be visible during capture
    svg.style.display = "block";
    svg.style.visibility = "visible";

    // Process polygon elements (triangles)
    const polygons = svg.querySelectorAll("polygon");
    polygons.forEach((polygon) => {
      if (!polygon.getAttribute("fill")) {
        polygon.setAttribute("fill", "#E2E8F0");
      }
      if (!polygon.getAttribute("stroke")) {
        polygon.setAttribute("stroke", "#CBD5E1");
      }
      if (!polygon.getAttribute("stroke-width")) {
        polygon.setAttribute("stroke-width", "1");
      }
    });
  });
}

/**
 * Preload all images to ensure they're properly rendered
 * @param images - The collection of image elements to preload
 * @returns Promise that resolves when all images are loaded
 */
export async function preloadImages(images: NodeListOf<HTMLImageElement>): Promise<void> {
  await Promise.all(
    Array.from(images).map((img) => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }
      });
    }),
  );
}
