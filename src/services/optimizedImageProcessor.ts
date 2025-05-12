/**
 * Optimized Image Processor for PDF Export
 */

declare interface NodeListOf<TNode extends Node> extends ArrayLike<TNode> {
  forEach(callbackfn: (value: TNode, key: number, parent: NodeListOf<TNode>) => void): void;
  item(index: number): TNode | null;
}

/**
 * Process images in a document to ensure they render correctly in the PDF
 */
export function processImages(images: NodeListOf<HTMLImageElement>, objectFitDefault: string = "cover"): void {
  images.forEach((img) => {
    img.crossOrigin = "anonymous";

    const container = img.parentElement;

    img.style.display = "block";
    img.style.visibility = "visible";

    const computedStyle = window.getComputedStyle(img);
    const objectFit = computedStyle.objectFit || img.style.objectFit || objectFitDefault;

    applyObjectFitStyles(img, objectFit);

    if (container && container instanceof HTMLElement) {
      container.style.position = "relative";
      container.style.overflow = "hidden";
      container.style.boxSizing = "border-box";
    }
  });
}

/**
 * Apply appropriate styles based on object-fit value
 */
function applyObjectFitStyles(img: HTMLImageElement, objectFit: string): void {
  switch (objectFit) {
  case "contain":
    img.style.objectFit = "contain";
    img.style.height = "100%";
    img.style.width = "auto";
    img.style.maxWidth = "none";
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "50%";
    img.style.transform = "translateX(-50%)";
    break;

  case "cover":
    img.style.objectFit = "cover";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.position = "absolute";
    img.style.top = "0";
    img.style.left = "0";
    break;

  case "fill":
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "fill";
    break;

  case "none":
    img.style.maxHeight = "100%";
    img.style.width = "auto";
    img.style.position = "absolute";
    img.style.top = "50%";
    img.style.left = "50%";
    img.style.transform = "translate(-50%, -50%)";
    break;

  case "scale-down":
    img.style.maxHeight = "100%";
    img.style.width = "auto";
    img.style.maxWidth = "none";
    img.style.position = "absolute";
    img.style.top = "50%";
    img.style.left = "50%";
    img.style.transform = "translate(-50%, -50%)";
    break;
  }
}

/**
 * Process SVG elements to ensure they render correctly in the PDF
 */
export function processSvgElements(svgElements: NodeListOf<SVGElement>): void {
  svgElements.forEach((svg) => {
    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    if (svg.style.width === "") {
      svg.style.width = svg.getAttribute("width") + "px";
    }
    if (svg.style.height === "") {
      svg.style.height = svg.getAttribute("height") + "px";
    }

    svg.style.display = "block";
    svg.style.visibility = "visible";

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
