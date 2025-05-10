<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title class="text-h5">Export to PDF</v-card-title>
      <v-card-text>
        <v-form ref="form">
          <v-text-field
            v-model="filename"
            label="Filename"
            :rules="[(v) => !!v || 'Filename is required']"
            hint="The name of the PDF file"
            persistent-hint
            class="mb-4"
          ></v-text-field>

          <v-select
            v-model="paperSize"
            :items="paperSizes"
            label="Paper Size"
            class="mb-4"
          ></v-select>

          <v-radio-group
            v-model="orientation"
            label="Orientation"
            class="mb-4"
            inline
          >
            <v-radio value="portrait" label="Portrait"></v-radio>
            <v-radio value="landscape" label="Landscape"></v-radio>
          </v-radio-group>

          <v-slider
            v-model="quality"
            :min="1"
            :max="3"
            :step="1"
            label="Quality"
            thumb-label
            class="mb-4"
          >
            <template v-slot:thumb-label>
              {{ qualityLabels[quality - 1] }}
            </template>
          </v-slider>

          <v-switch
            v-model="includeBackground"
            label="Include Background"
            class="mb-4"
          ></v-switch>

          <v-expansion-panels variant="accordion" class="mb-4">
            <v-expansion-panel>
              <v-expansion-panel-title
                >Advanced Options</v-expansion-panel-title
              >
              <v-expansion-panel-text>
                <v-text-field
                  v-model.number="margins.top"
                  label="Top Margin (pt)"
                  type="number"
                  min="0"
                  class="mb-2"
                ></v-text-field>
                <v-text-field
                  v-model.number="margins.right"
                  label="Right Margin (pt)"
                  type="number"
                  min="0"
                  class="mb-2"
                ></v-text-field>
                <v-text-field
                  v-model.number="margins.bottom"
                  label="Bottom Margin (pt)"
                  type="number"
                  min="0"
                  class="mb-2"
                ></v-text-field>
                <v-text-field
                  v-model.number="margins.left"
                  label="Left Margin (pt)"
                  type="number"
                  min="0"
                  class="mb-2"
                ></v-text-field>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="text" @click="closeDialog"
          >Cancel</v-btn
        >
        <v-btn
          color="primary"
          variant="elevated"
          @click="exportPdf"
          :loading="isExporting"
          :disabled="isExporting"
        >
          Export
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Document } from "../../types/document";
import {
  exportToPdf,
  type PdfExportOptions,
} from "../../services/pdfExportService";
import { getPaperSizeByName, getLandscapeSize } from "../../utils/paperSizes";

const props = defineProps<{
  modelValue: boolean;
  document: Document;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

// Dialog state
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

// Form reference
const form = ref<any>(null);

// Export options
const filename = ref(
  props.document.title ? `${props.document.title}.pdf` : "document.pdf"
);
const paperSize = ref(props.document.paperSize || "A4");
const orientation = ref(props.document.orientation || "portrait");
const quality = ref(2);
const includeBackground = ref(true);
const margins = ref({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

// Available paper sizes
const paperSizes = ["A3", "A4", "A5", "Letter", "Legal", "Tabloid"];

// Quality labels
const qualityLabels = ["Draft", "Normal", "High"];

// Export state
const isExporting = ref(false);

// Update filename when document title changes
watch(
  () => props.document.title,
  (newTitle) => {
    if (newTitle) {
      filename.value = `${newTitle}.pdf`;
    }
  }
);

// Close the dialog
function closeDialog() {
  dialog.value = false;
}

// This function is no longer needed as we're using the new PDF export service
// that directly uses the preview content
async function directExport(
  document: Document,
  container: HTMLElement,
  options: PdfExportOptions
): Promise<void> {
  console.log("Using direct export method");
  // This is just a stub - we're not using this function anymore
  throw new Error(
    "Direct export is no longer supported. Use the new PDF export service instead."
  );
}

// Export the document to PDF
async function exportPdf() {
  // Check if form exists before validating
  if (form.value && typeof form.value.validate === "function") {
    try {
      const { valid } = await form.value.validate();
      if (!valid) return;
    } catch (error) {
      console.error("Form validation error:", error);
      // Continue anyway since this isn't critical
    }
  }

  isExporting.value = true;

  try {
    // First, we need to create a preview of the document
    // We'll create a temporary dialog that contains the preview
    const previewDialog = window.document.createElement("div");
    previewDialog.style.position = "fixed";
    previewDialog.style.top = "-9999px";
    previewDialog.style.left = "-9999px";
    previewDialog.style.width = "100%";
    previewDialog.style.height = "100%";
    previewDialog.style.zIndex = "-1";
    previewDialog.style.opacity = "0";
    window.document.body.appendChild(previewDialog);

    // Create the preview content container
    const previewContent = window.document.createElement("div");
    previewContent.className = "preview-pages";
    previewContent.style.display = "flex";
    previewContent.style.flexDirection = "column";
    previewContent.style.alignItems = "center";
    previewContent.style.gap = "24px";
    previewContent.style.padding = "24px";
    previewContent.style.backgroundColor = "var(--surface, #f5f5f5)";
    previewDialog.appendChild(previewContent);

    // Use the selected paper size and orientation
    // These will be passed to the export function via options
    const paperSizeName = paperSize.value;
    const orientationValue = orientation.value;

    // Get the paper size dimensions for preview rendering
    let paperSizeObj = getPaperSizeByName(paperSizeName);
    if (orientationValue === "landscape") {
      paperSizeObj = getLandscapeSize(paperSizeObj);
    }

    // Create a preview page for each section
    for (const section of props.document.sections) {
      // Create the page container
      const pageDiv = window.document.createElement("div");
      pageDiv.className = "preview-page";
      pageDiv.style.width = `${paperSizeObj.width}px`;
      pageDiv.style.minHeight = `${paperSizeObj.height}px`;
      pageDiv.style.backgroundColor = "white";
      pageDiv.style.position = "relative";
      pageDiv.style.boxSizing = "border-box";
      pageDiv.style.margin = "16px auto";
      pageDiv.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";

      // Create the page content container
      const contentDiv = window.document.createElement("div");
      contentDiv.className = "page-content";
      contentDiv.style.position = "relative";
      contentDiv.style.minHeight = "100%";
      contentDiv.style.padding = "24px";
      contentDiv.style.backgroundColor = "white";
      contentDiv.style.boxSizing = "border-box";

      // Create the elements container
      const elementsDiv = window.document.createElement("div");
      elementsDiv.className = "elements-container";
      elementsDiv.style.position = "relative";
      elementsDiv.style.minHeight = "inherit";

      // Sort elements by zIndex
      const sortedElements = [...section.elements].sort((a, b) => {
        const zIndexA = a.zIndex ?? 0;
        const zIndexB = b.zIndex ?? 0;
        return zIndexA - zIndexB;
      });

      // Add each element to the page
      for (const element of sortedElements) {
        // Create a container for the element - adjust positions to remove ruler space
        const elementContainer = window.document.createElement("div");
        elementContainer.style.position = "absolute";

        // Explicitly subtract 30px from both x and y to remove ruler space
        elementContainer.style.left = `${Math.max(
          0,
          element.position.x - 30
        )}px`;
        elementContainer.style.top = `${Math.max(
          0,
          element.position.y - 30
        )}px`;
        elementContainer.style.width = `${element.size.width}px`;
        elementContainer.style.height = `${element.size.height}px`;
        elementContainer.style.zIndex = `${element.zIndex || 0}`;

        // Add content based on element type
        if (element.type === "text") {
          elementContainer.innerHTML = element.content || "";

          // Apply text styles
          if (element.style) {
            Object.entries(element.style).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                switch (key) {
                  case "fontFamily":
                    elementContainer.style.fontFamily = value as string;
                    break;
                  case "fontSize":
                    elementContainer.style.fontSize = `${value}px`;
                    break;
                  case "bold":
                    if (value) elementContainer.style.fontWeight = "bold";
                    break;
                  case "italic":
                    if (value) elementContainer.style.fontStyle = "italic";
                    break;
                  case "underline":
                    if (value)
                      elementContainer.style.textDecoration = "underline";
                    break;
                  case "color":
                    elementContainer.style.color = value as string;
                    break;
                  case "backgroundColor":
                    elementContainer.style.backgroundColor = value as string;
                    break;
                  case "textAlign":
                    elementContainer.style.textAlign = value as string;
                    break;
                  case "lineHeight":
                    elementContainer.style.lineHeight = value as string;
                    break;
                  case "letterSpacing":
                    elementContainer.style.letterSpacing = `${value}px`;
                    break;
                  case "textIndent":
                    elementContainer.style.textIndent = `${value}px`;
                    break;
                  case "paragraphIndent":
                    elementContainer.style.marginLeft = `${value}px`;
                    break;
                  case "listType":
                    if (value === "bullet") {
                      elementContainer.style.listStyleType = "disc";
                      elementContainer.style.listStylePosition = "inside";
                      elementContainer.style.display = "list-item";
                      elementContainer.style.paddingLeft = "20px";
                    } else if (value === "number") {
                      elementContainer.style.listStyleType = "decimal";
                      elementContainer.style.listStylePosition = "inside";
                      elementContainer.style.display = "list-item";
                      elementContainer.style.paddingLeft = "20px";
                    }
                    break;
                }
              }
            });
          }
        } else if (element.type === "image") {
          const img = window.document.createElement("img");
          img.src = element.content || "";
          img.style.width = "100%";
          img.style.height = "100%";
          img.style.objectFit = element.style?.objectFit || "contain";
          img.crossOrigin = "anonymous"; // Add CORS support

          // Apply additional image styles from the element
          if (element.style?.borderRadius) {
            img.style.borderRadius = `${element.style.borderRadius}px`;
          }

          // Create a container for the image to handle background color and borders
          const imgContainer = window.document.createElement("div");
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
          elementContainer.appendChild(imgContainer);
        } else if (element.type === "shape") {
          // Create an SVG element for the shape
          const svg = window.document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
          );
          svg.setAttribute("width", "100%");
          svg.setAttribute("height", "100%");
          svg.setAttribute(
            "viewBox",
            `0 0 ${element.size.width} ${element.size.height}`
          );
          svg.style.display = "block";

          // Get shape properties
          const width = element.size.width;
          const height = element.size.height;
          const fill = element.style?.fill || "#E2E8F0";
          const stroke = element.style?.stroke || "#CBD5E1";
          const strokeWidth = element.style?.strokeWidth || 1;
          const shapeType = element.content || "rectangle";
          const rotation = element.style?.rotation || 0;

          // Create the appropriate shape
          let shapeElement;

          switch (shapeType) {
            case "rectangle":
              shapeElement = window.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
              );
              shapeElement.setAttribute("x", "0");
              shapeElement.setAttribute("y", "0");
              shapeElement.setAttribute("width", width.toString());
              shapeElement.setAttribute("height", height.toString());
              shapeElement.setAttribute(
                "rx",
                (element.style?.borderRadius || 0).toString()
              );
              break;

            case "circle":
              shapeElement = window.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "ellipse"
              );
              shapeElement.setAttribute("cx", (width / 2).toString());
              shapeElement.setAttribute("cy", (height / 2).toString());
              shapeElement.setAttribute("rx", (width / 2).toString());
              shapeElement.setAttribute("ry", (height / 2).toString());
              break;

            case "triangle":
              shapeElement = window.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "polygon"
              );
              const points = `${width / 2},0 ${width},${height} 0,${height}`;
              shapeElement.setAttribute("points", points);
              break;

            case "line":
              shapeElement = window.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
              );
              shapeElement.setAttribute("x1", "0");
              shapeElement.setAttribute("y1", (height / 2).toString());
              shapeElement.setAttribute("x2", width.toString());
              shapeElement.setAttribute("y2", (height / 2).toString());
              break;

            case "arrow":
              shapeElement = window.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
              );
              const arrowPath = `M0,${height / 2} L${width - 10},${
                height / 2
              } L${width - 15},${height / 4} L${width},${height / 2} L${
                width - 15
              },${(3 * height) / 4} L${width - 10},${height / 2}`;
              shapeElement.setAttribute("d", arrowPath);
              break;

            default:
              shapeElement = window.document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
              );
              shapeElement.setAttribute("x", "0");
              shapeElement.setAttribute("y", "0");
              shapeElement.setAttribute("width", width.toString());
              shapeElement.setAttribute("height", height.toString());
              break;
          }

          // Apply styles to the shape
          shapeElement.setAttribute("fill", fill);
          shapeElement.setAttribute("stroke", stroke);
          shapeElement.setAttribute("stroke-width", strokeWidth.toString());

          // Apply line style if applicable
          if (shapeType === "line" && element.style?.lineStyle) {
            switch (element.style.lineStyle) {
              case "dashed":
                shapeElement.setAttribute("stroke-dasharray", "8,4");
                break;
              case "dotted":
                shapeElement.setAttribute("stroke-dasharray", "2,2");
                break;
              default:
                shapeElement.setAttribute("stroke-dasharray", "none");
            }
          }

          // Apply rotation if needed
          if (rotation !== 0) {
            const g = window.document.createElementNS(
              "http://www.w3.org/2000/svg",
              "g"
            );
            g.setAttribute(
              "transform",
              `rotate(${rotation} ${width / 2} ${height / 2})`
            );
            g.appendChild(shapeElement);
            svg.appendChild(g);
          } else {
            svg.appendChild(shapeElement);
          }

          // Add the SVG to the element container
          elementContainer.appendChild(svg);
        } else if (element.type === "table") {
          elementContainer.innerHTML = element.content || "";
        } else if (element.type === "signature") {
          if (element.content) {
            const img = window.document.createElement("img");
            img.src = element.content;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "contain";
            img.crossOrigin = "anonymous"; // Add CORS support

            // Create a container for the signature to handle background color
            const signatureContainer = window.document.createElement("div");
            signatureContainer.style.width = "100%";
            signatureContainer.style.height = "100%";
            signatureContainer.style.overflow = "hidden";

            // Apply background color if specified
            if (element.style?.backgroundColor) {
              signatureContainer.style.backgroundColor =
                element.style.backgroundColor;
            }

            signatureContainer.appendChild(img);
            elementContainer.appendChild(signatureContainer);
          } else {
            elementContainer.style.border = "1px dashed #999";
          }
        } else if (element.type === "form") {
          elementContainer.style.border = "1px solid #ddd";
          elementContainer.style.borderRadius = "4px";
          elementContainer.style.backgroundColor = "#f9f9f9";

          if (element.formType === "textfield") {
            const input = window.document.createElement("input");
            input.type = "text";
            input.style.width = "100%";
            input.style.height = "100%";
            input.style.boxSizing = "border-box";
            input.style.border = "none";
            input.style.backgroundColor = "transparent";
            input.value = element.value || "";
            input.disabled = true;
            elementContainer.appendChild(input);
          } else if (element.formType === "checkbox") {
            const checkbox = window.document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.style.width = "20px";
            checkbox.style.height = "20px";
            checkbox.style.margin = "auto";
            checkbox.style.position = "absolute";
            checkbox.style.top = "50%";
            checkbox.style.left = "50%";
            checkbox.style.transform = "translate(-50%, -50%)";
            checkbox.checked = element.checked || false;
            checkbox.disabled = true;
            elementContainer.appendChild(checkbox);
          }
        }

        // Add the element to the page
        elementsDiv.appendChild(elementContainer);
      }

      // Add the elements container to the page content
      contentDiv.appendChild(elementsDiv);

      // Add the page content to the page
      pageDiv.appendChild(contentDiv);

      // Add the page to the preview content
      previewContent.appendChild(pageDiv);
    }

    // Prepare export options
    const options: PdfExportOptions = {
      filename: filename.value.endsWith(".pdf")
        ? filename.value
        : `${filename.value}.pdf`,
      includeBackground: includeBackground.value,
      quality: quality.value,
      margins: margins.value,
      // Use the already selected paper size and orientation
      paperSize: paperSize.value,
      orientation: orientation.value,
    };

    // Export the document to PDF
    await exportToPdf(props.document, previewContent, options);

    // Clean up the temporary preview dialog
    window.document.body.removeChild(previewDialog);

    // Close the dialog
    closeDialog();
  } catch (error) {
    console.error("Error exporting PDF:", error);

    // Get more detailed error information
    let errorMessage = "Failed to export PDF. ";

    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      errorMessage += error.message;
    }

    // Check for specific error types
    if (error instanceof TypeError) {
      console.error(
        "Type error detected. This might be related to missing properties or methods."
      );
    } else if (error instanceof ReferenceError) {
      console.error(
        "Reference error detected. This might be related to undefined variables."
      );
    }

    // Alert with more specific error message
    alert(errorMessage);
  } finally {
    isExporting.value = false;
  }
}
</script>

<style scoped>
.v-card-text {
  padding-top: 20px;
}
</style>
