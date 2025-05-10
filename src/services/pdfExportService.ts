import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Document } from "../types/document";
import { getPaperSizeByName, getLandscapeSize } from "../utils/paperSizes";

export interface PdfExportOptions {
  filename?: string;
  includeBackground?: boolean;
  quality?: number; // 1-3, where 3 is highest quality
  margins?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  paperSize?: string;
  orientation?: "portrait" | "landscape";
}

const defaultOptions: PdfExportOptions = {
  filename: "document.pdf",
  includeBackground: true,
  quality: 2,
  margins: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
};

/**
 * Export a document to PDF
 * @param docData The document data to export
 * @param container The HTML container element that contains the document content
 * @param options PDF export options
 * @returns Promise that resolves when the PDF has been generated and downloaded
 */
export async function exportToPdf(
  docData: Document,
  container: HTMLElement,
  options: PdfExportOptions = {}
): Promise<void> {
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  mergedOptions.margins = { ...defaultOptions.margins, ...options.margins };

  // Get paper size and orientation from document data
  const paperSizeName = docData.paperSize || "A4";
  const orientation = docData.orientation || "portrait";

  // Get the paper size dimensions
  let paperSize = getPaperSizeByName(paperSizeName);
  if (orientation === "landscape") {
    paperSize = getLandscapeSize(paperSize);
  }

  // Create PDF with the correct paper size and orientation
  const pdfOrientation = orientation === "landscape" ? "l" : "p";
  const pdf = new jsPDF({
    orientation: pdfOrientation,
    unit: "pt",
    format: paperSizeName.toLowerCase(),
    hotfixes: ["px_scaling"],
  });

  // Get all pages from the container
  const pages = container.querySelectorAll(".preview-page");
  if (pages.length === 0) {
    console.warn("No .preview-page elements found, trying to find any content");
    // If no specific page elements are found, try to use the container itself
    return exportSinglePage(docData, container, pdf, mergedOptions);
  }

  // Process each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i] as HTMLElement;

    // Clone the page to avoid modifying the original
    const pageClone = page.cloneNode(true) as HTMLElement;

    // Process the clone to ensure proper rendering
    processPageForExport(pageClone, mergedOptions);

    // Create a temporary container for the cloned page
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "-9999px";
    tempContainer.appendChild(pageClone);
    document.body.appendChild(tempContainer);

    try {
      // Process SVG elements to ensure they render correctly
      const svgElements = pageClone.querySelectorAll("svg");
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

        // Ensure all SVG child elements have proper attributes
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

      // Render the page to canvas with settings that match the preview
      const canvas = await html2canvas(pageClone, {
        scale: mergedOptions.quality || 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: mergedOptions.includeBackground ? "white" : null,
        imageTimeout: 0, // No timeout for images
        width: paperSize.width,
        height: paperSize.height,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        windowWidth: paperSize.width + 50,
        windowHeight: paperSize.height + 50,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          // Process SVG elements in the cloned document
          const clonedSvgs = clonedDoc.querySelectorAll("svg");
          clonedSvgs.forEach((svg) => {
            // Ensure SVG has proper namespace
            if (!svg.getAttribute("xmlns")) {
              svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
            }

            // Make sure SVG is visible
            svg.style.display = "block";
            svg.style.visibility = "visible";

            // Process polygon elements (triangles)
            const polygons = svg.querySelectorAll("polygon");
            polygons.forEach((polygon) => {
              // Ensure polygon has proper attributes
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

          // Make sure all elements are visible
          const elements = clonedDoc.querySelectorAll(".elements-container *");
          elements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.visibility = "visible";
              el.style.display = "block";
            }
          });

          // Process images to ensure they render correctly
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            img.crossOrigin = "anonymous";

            // Make sure images are visible
            img.style.display = "block";
            img.style.visibility = "visible";
          });

          // Process text elements to ensure styles are applied correctly
          const textElements = clonedDoc.querySelectorAll(".text-element");
          textElements.forEach((element) => {
            if (element instanceof HTMLElement) {
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
                  "important"
                );
                // Add padding to ensure the background is visible
                element.style.setProperty("padding", "8px", "important");
              }

              // Find the content element
              const contentElement = element.querySelector(".element-content");
              if (contentElement instanceof HTMLElement) {
                // Ensure text color is applied
                if (contentElement.style.color) {
                  // Apply color to all child elements
                  const textNodes = contentElement.querySelectorAll("*");
                  textNodes.forEach((node) => {
                    if (node instanceof HTMLElement && !node.style.color) {
                      node.style.setProperty(
                        "color",
                        contentElement.style.color,
                        "important"
                      );
                    }
                  });
                }

                // Ensure font styles are applied
                if (contentElement.style.fontFamily) {
                  contentElement.style.setProperty(
                    "font-family",
                    contentElement.style.fontFamily,
                    "important"
                  );
                }
                if (contentElement.style.fontSize) {
                  contentElement.style.setProperty(
                    "font-size",
                    contentElement.style.fontSize,
                    "important"
                  );
                }
                if (contentElement.style.fontWeight) {
                  contentElement.style.setProperty(
                    "font-weight",
                    contentElement.style.fontWeight,
                    "important"
                  );
                }

                // Make the content element transparent if the parent has a background
                if (
                  backgroundColor &&
                  backgroundColor !== "rgba(0, 0, 0, 0)" &&
                  backgroundColor !== "transparent"
                ) {
                  contentElement.style.setProperty(
                    "background-color",
                    "transparent",
                    "important"
                  );
                }
              }
            }
          });

          // Find shape elements that are triangles and ensure they're properly rendered
          const shapeElements = clonedDoc.querySelectorAll(".shape-element");
          shapeElements.forEach((element) => {
            if (element instanceof HTMLElement) {
              // Check if this is a triangle by looking for polygon elements
              const polygon = element.querySelector("polygon");
              if (polygon) {
                // Make sure the container is transparent
                element.style.backgroundColor = "transparent";
                element.style.border = "none";
              }
            }
          });
        },
        ignoreElements: (element) => {
          // Ignore UI controls
          return (
            element.tagName === "BUTTON" ||
            element.classList.contains("resize-handle") ||
            element.classList.contains("scroll-control") ||
            element.classList.contains("v-btn--icon") ||
            element.classList.contains("handle") ||
            element.getAttribute("role") === "button"
          );
        },
      });

      // Add a new page for each page after the first
      if (i > 0) {
        pdf.addPage();
      }

      // Get the PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate margins
      const margins = mergedOptions.margins || {};
      const marginTop = margins.top || 0;
      const marginRight = margins.right || 0;
      const marginBottom = margins.bottom || 0;
      const marginLeft = margins.left || 0;

      // Calculate available space after margins
      const availableWidth = pdfWidth - marginLeft - marginRight;
      const availableHeight = pdfHeight - marginTop - marginBottom;

      // Calculate the scaling factor to fit the canvas to the available space
      const canvasAspectRatio = canvas.width / canvas.height;
      const availableAspectRatio = availableWidth / availableHeight;

      let scaledWidth, scaledHeight, offsetX, offsetY;

      if (canvasAspectRatio > availableAspectRatio) {
        // Canvas is wider than available space
        scaledWidth = availableWidth;
        scaledHeight = availableWidth / canvasAspectRatio;
        offsetX = marginLeft;
        offsetY = marginTop + (availableHeight - scaledHeight) / 2;
      } else {
        // Canvas is taller than available space
        scaledHeight = availableHeight;
        scaledWidth = availableHeight * canvasAspectRatio;
        offsetX = marginLeft + (availableWidth - scaledWidth) / 2;
        offsetY = marginTop;
      }

      // Add the image to the PDF
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        offsetX,
        offsetY,
        scaledWidth,
        scaledHeight
      );
    } finally {
      // Clean up the temporary container
      document.body.removeChild(tempContainer);
    }
  }

  // Save the PDF
  pdf.save(mergedOptions.filename || "document.pdf");
}

/**
 * Export a single page to PDF when no specific page elements are found
 * @param docData The document data to export
 * @param container The HTML container element
 * @param pdf The jsPDF instance
 * @param options PDF export options
 * @returns Promise that resolves when the PDF has been generated and saved
 */
async function exportSinglePage(
  _docData: Document,
  container: HTMLElement,
  pdf: jsPDF,
  options: PdfExportOptions
): Promise<void> {
  console.log("Attempting to export single page from container:", container);

  // Clone the container to avoid modifying the original
  const containerClone = container.cloneNode(true) as HTMLElement;

  // Process the clone to ensure proper rendering
  processPageForExport(containerClone, options);

  // Create a temporary container for the cloned content
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "-9999px";
  tempContainer.appendChild(containerClone);
  document.body.appendChild(tempContainer);

  try {
    // Get the PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Set container dimensions to match PDF size
    containerClone.style.width = `${pdfWidth}pt`;
    containerClone.style.minHeight = `${pdfHeight}pt`;
    containerClone.style.backgroundColor = "white";
    containerClone.style.position = "relative";
    containerClone.style.overflow = "hidden";

    // Render the container to canvas
    const canvas = await html2canvas(containerClone, {
      scale: options.quality || 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: options.includeBackground ? "white" : null,
      width: pdfWidth,
      height: pdfHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: pdfWidth + 50,
      windowHeight: pdfHeight + 50,
      foreignObjectRendering: false,
      imageTimeout: 0, // No timeout for images
      onclone: (clonedDoc) => {
        // Process images to ensure they render correctly
        const images = clonedDoc.querySelectorAll("img");
        images.forEach((img) => {
          img.crossOrigin = "anonymous";

          // Make sure images are visible
          img.style.display = "block";
          img.style.visibility = "visible";
        });
      },
      ignoreElements: (element) => {
        // Ignore UI controls
        return (
          element.tagName === "BUTTON" ||
          element.classList.contains("resize-handle") ||
          element.classList.contains("scroll-control") ||
          element.classList.contains("v-btn--icon") ||
          element.classList.contains("handle") ||
          element.getAttribute("role") === "button"
        );
      },
    });

    // Calculate margins
    const margins = options.margins || {};
    const marginTop = margins.top || 0;
    const marginRight = margins.right || 0;
    const marginBottom = margins.bottom || 0;
    const marginLeft = margins.left || 0;

    // Calculate available space after margins
    const availableWidth = pdfWidth - marginLeft - marginRight;
    const availableHeight = pdfHeight - marginTop - marginBottom;

    // Add the image to the PDF
    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      marginLeft,
      marginTop,
      availableWidth,
      availableHeight
    );

    // Save the PDF
    pdf.save(options.filename || "document.pdf");
  } finally {
    // Clean up the temporary container
    document.body.removeChild(tempContainer);
  }
}

/**
 * Process a page element for export
 * @param pageElement The page element to process
 * @param options PDF export options
 */
function processPageForExport(
  pageElement: HTMLElement,
  _options: PdfExportOptions
): void {
  // Hide UI controls that shouldn't appear in the PDF
  const uiElements = pageElement.querySelectorAll(
    ".resize-handle, .scroll-control, .v-navigation-drawer, " +
      ".v-overlay, .v-menu, .v-btn--icon, button, " +
      "[role='button'], .control-button, .handle, " +
      ".v-slider, .v-input__control"
  );

  uiElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      el.style.display = "none";
      el.style.visibility = "hidden";
      el.style.opacity = "0";
    }
  });

  // Make sure all other elements are visible
  const allElements = pageElement.querySelectorAll("*");
  allElements.forEach((el) => {
    if (
      el instanceof HTMLElement &&
      !el.classList.contains("resize-handle") &&
      !el.classList.contains("scroll-control") &&
      !el.classList.contains("control-button") &&
      !el.classList.contains("handle") &&
      el.tagName !== "BUTTON" &&
      el.getAttribute("role") !== "button"
    ) {
      el.style.visibility = "visible";
      el.style.opacity = "1";

      // Ensure proper positioning for absolute elements
      if (el.style.position === "absolute") {
        const left = parseFloat(el.style.left || "0");
        const top = parseFloat(el.style.top || "0");
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      }
    }
  });

  // Process text elements to ensure styles are applied correctly
  const textElements = pageElement.querySelectorAll(".text-element");
  textElements.forEach((element) => {
    if (element instanceof HTMLElement) {
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
          "important"
        );
        // Add padding to ensure the background is visible
        element.style.setProperty("padding", "8px", "important");
      }

      // Find the content element
      const contentElement = element.querySelector(".element-content");
      if (contentElement instanceof HTMLElement) {
        // Ensure text color is applied
        if (contentElement.style.color) {
          // Apply color to all child elements
          const textNodes = contentElement.querySelectorAll("*");
          textNodes.forEach((node) => {
            if (node instanceof HTMLElement && !node.style.color) {
              node.style.setProperty(
                "color",
                contentElement.style.color,
                "important"
              );
            }
          });
        }

        // Ensure font styles are applied
        if (contentElement.style.fontFamily) {
          contentElement.style.setProperty(
            "font-family",
            contentElement.style.fontFamily,
            "important"
          );
        }
        if (contentElement.style.fontSize) {
          contentElement.style.setProperty(
            "font-size",
            contentElement.style.fontSize,
            "important"
          );
        }
        if (contentElement.style.fontWeight) {
          contentElement.style.setProperty(
            "font-weight",
            contentElement.style.fontWeight,
            "important"
          );
        }

        // Make the content element transparent if the parent has a background
        if (
          backgroundColor &&
          backgroundColor !== "rgba(0, 0, 0, 0)" &&
          backgroundColor !== "transparent"
        ) {
          contentElement.style.setProperty(
            "background-color",
            "transparent",
            "important"
          );
        }
      }
    }
  });

  // Process SVG elements
  const svgElements = pageElement.querySelectorAll("svg");
  svgElements.forEach((svg) => {
    // Ensure SVG has proper namespace
    if (!svg.getAttribute("xmlns")) {
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    // Make sure SVG is visible
    svg.style.display = "block";
    svg.style.visibility = "visible";

    // Process polygon elements (triangles)
    const polygons = svg.querySelectorAll("polygon");
    polygons.forEach((polygon) => {
      // Ensure polygon has proper attributes
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

  // Find shape elements that are triangles and ensure they're properly rendered
  const shapeElements = pageElement.querySelectorAll(".shape-element");
  shapeElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      // Check if this is a triangle by looking for polygon elements
      const polygon = element.querySelector("polygon");
      if (polygon) {
        // Make sure the container is transparent
        element.style.backgroundColor = "transparent";
        element.style.border = "none";
      }
    }
  });
}

/**
 * Export a document to PDF directly without requiring a DOM container
 * This is useful for server-side or headless PDF generation
 * @param docData The document data to export
 * @param options PDF export options
 * @returns Promise that resolves when the PDF has been generated and downloaded
 */
export async function directExportToPdf(
  docData: Document,
  options: PdfExportOptions = {}
): Promise<void> {
  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };
  mergedOptions.margins = { ...defaultOptions.margins, ...options.margins };

  // Get paper size and orientation from document data
  const paperSizeName = docData.paperSize || "A4";
  const orientation = docData.orientation || "portrait";

  // Get the paper size dimensions
  let paperSize = getPaperSizeByName(paperSizeName);
  if (orientation === "landscape") {
    paperSize = getLandscapeSize(paperSize);
  }

  // Create PDF with the correct paper size and orientation
  const pdfOrientation = orientation === "landscape" ? "l" : "p";
  const pdf = new jsPDF({
    orientation: pdfOrientation,
    unit: "pt",
    format: paperSizeName.toLowerCase(),
    hotfixes: ["px_scaling"],
  });

  // Create a temporary container to render the document
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "-9999px";
  tempContainer.style.width = `${paperSize.width}px`;
  tempContainer.style.height = `${paperSize.height}px`;
  tempContainer.style.backgroundColor = "white";
  document.body.appendChild(tempContainer);

  try {
    // Create a document preview
    for (let i = 0; i < docData.sections.length; i++) {
      const section = docData.sections[i];

      // Create a page container
      const pageContainer = document.createElement("div");
      pageContainer.className = "preview-page";
      pageContainer.style.width = `${paperSize.width}px`;
      pageContainer.style.height = `${paperSize.height}px`;
      pageContainer.style.position = "relative";
      pageContainer.style.backgroundColor = "white";
      pageContainer.style.overflow = "hidden";

      // Create elements container
      const elementsContainer = document.createElement("div");
      elementsContainer.className = "elements-container";
      elementsContainer.style.position = "relative";
      elementsContainer.style.width = "100%";
      elementsContainer.style.height = "100%";
      pageContainer.appendChild(elementsContainer);

      // Render each element in the section
      section.elements.forEach((element) => {
        const elementDiv = document.createElement("div");
        elementDiv.style.position = "absolute";
        elementDiv.style.left = `${element.position.x}px`;
        elementDiv.style.top = `${element.position.y}px`;
        elementDiv.style.width = `${element.size.width}px`;
        elementDiv.style.height = `${element.size.height}px`;
        elementDiv.style.zIndex = `${element.zIndex || 0}`;

        // Add content based on element type
        if (element.type === "text") {
          elementDiv.innerHTML = element.content;
          elementDiv.className = "text-element";

          // Create a content element to match the structure in the editor
          const contentElement = document.createElement("div");
          contentElement.className = "element-content";
          contentElement.innerHTML = element.content;
          elementDiv.innerHTML = ""; // Clear the div
          elementDiv.appendChild(contentElement);

          if (element.style) {
            // Apply styles to the content element
            contentElement.style.fontFamily =
              element.style.fontFamily || "Arial";
            contentElement.style.fontSize = `${element.style.fontSize || 16}px`;
            contentElement.style.fontWeight =
              element.style.fontWeight || "normal";
            contentElement.style.color = element.style.color || "#000000";

            // Handle block background
            if (element.style.blockBackground) {
              elementDiv.style.backgroundColor =
                element.style.blockBackgroundColor || "#f5f5f5";
              elementDiv.style.padding = "8px";
              contentElement.style.backgroundColor = "transparent";
            } else {
              contentElement.style.backgroundColor =
                element.style.backgroundColor || "transparent";
            }
          }
        } else if (element.type === "image") {
          const img = document.createElement("img");
          img.src = element.content;
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = element.style?.objectFit || "contain";
          img.crossOrigin = "anonymous"; // Add CORS support

          // Apply additional image styles from the element
          if (element.style?.borderRadius) {
            img.style.borderRadius = `${element.style.borderRadius}px`;
          }

          // Create a container for the image to handle background color and borders
          const imgContainer = document.createElement("div");
          imgContainer.style.width = "100%";
          imgContainer.style.height = "100%";
          imgContainer.style.overflow = "hidden";

          // Apply background color if specified
          if (element.style?.backgroundColor) {
            imgContainer.style.backgroundColor = element.style.backgroundColor;
          }

          // Apply border if specified
          if (element.style?.borderWidth) {
            imgContainer.style.border = `${element.style.borderWidth}px solid ${
              element.style.borderColor || "#000000"
            }`;
            imgContainer.style.boxSizing = "border-box";
          }

          // Apply border radius if specified
          if (element.style?.borderRadius) {
            imgContainer.style.borderRadius = `${element.style.borderRadius}px`;
          }

          imgContainer.appendChild(img);
          elementDiv.appendChild(imgContainer);
        } else if (element.type === "shape") {
          // Handle different shape types
          if (element.content === "circle") {
            // For circles, use border-radius
            elementDiv.style.backgroundColor = element.style?.fill || "#E2E8F0";
            elementDiv.style.border = `${
              element.style?.strokeWidth || 1
            }px solid ${element.style?.stroke || "#CBD5E1"}`;
            elementDiv.style.borderRadius = "50%";
          } else if (element.content === "triangle") {
            // For triangles, use SVG
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg"
            );
            svg.setAttribute("width", "100%");
            svg.setAttribute("height", "100%");
            svg.style.position = "absolute";
            svg.style.top = "0";
            svg.style.left = "0";

            const polygon = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "polygon"
            );
            const width = element.size.width;
            const height = element.size.height;

            // Define triangle points (centered triangle pointing down)
            const points = `${width / 2},0 ${width},${height} 0,${height}`;
            polygon.setAttribute("points", points);
            polygon.setAttribute("fill", element.style?.fill || "#E2E8F0");
            polygon.setAttribute("stroke", element.style?.stroke || "#CBD5E1");
            polygon.setAttribute(
              "stroke-width",
              `${element.style?.strokeWidth || 1}`
            );

            svg.appendChild(polygon);
            elementDiv.appendChild(svg);

            // Clear background so only the SVG shows
            elementDiv.style.backgroundColor = "transparent";
            elementDiv.style.border = "none";
          } else {
            // Default rectangle handling
            elementDiv.style.backgroundColor = element.style?.fill || "#E2E8F0";
            elementDiv.style.border = `${
              element.style?.strokeWidth || 1
            }px solid ${element.style?.stroke || "#CBD5E1"}`;
          }
        } else if (element.type === "signature") {
          if (element.content) {
            const img = document.createElement("img");
            img.src = element.content;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "contain";
            img.crossOrigin = "anonymous"; // Add CORS support

            // Create a container for the signature to handle background color
            const signatureContainer = document.createElement("div");
            signatureContainer.style.width = "100%";
            signatureContainer.style.height = "100%";
            signatureContainer.style.overflow = "hidden";

            // Apply background color if specified
            if (element.style?.backgroundColor) {
              signatureContainer.style.backgroundColor =
                element.style.backgroundColor;
            }

            signatureContainer.appendChild(img);
            elementDiv.appendChild(signatureContainer);
          } else {
            elementDiv.style.border = "1px dashed #999";
          }
        }

        elementsContainer.appendChild(elementDiv);
      });

      tempContainer.appendChild(pageContainer);

      // Add a new page for each section after the first
      if (i > 0) {
        pdf.addPage();
      }

      // Render the page to canvas
      const canvas = await html2canvas(pageContainer, {
        scale: mergedOptions.quality || 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: mergedOptions.includeBackground ? "white" : null,
        width: paperSize.width,
        height: paperSize.height,
        imageTimeout: 0, // No timeout for images
        onclone: (clonedDoc) => {
          // Process images to ensure they render correctly
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            img.crossOrigin = "anonymous";

            // Make sure images are visible
            img.style.display = "block";
            img.style.visibility = "visible";
          });
        },
      });

      // Get the PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate margins
      const margins = mergedOptions.margins || {};
      const marginTop = margins.top || 0;
      const marginRight = margins.right || 0;
      const marginBottom = margins.bottom || 0;
      const marginLeft = margins.left || 0;

      // Calculate available space after margins
      const availableWidth = pdfWidth - marginLeft - marginRight;
      const availableHeight = pdfHeight - marginTop - marginBottom;

      // Add the image to the PDF
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        marginLeft,
        marginTop,
        availableWidth,
        availableHeight
      );

      // Remove the page container after processing
      tempContainer.removeChild(pageContainer);
    }

    // Save the PDF
    pdf.save(mergedOptions.filename || "document.pdf");
  } finally {
    // Clean up the temporary container
    document.body.removeChild(tempContainer);
  }
}
