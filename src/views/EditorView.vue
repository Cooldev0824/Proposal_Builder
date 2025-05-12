<template>
  <div class="document-editor">
    <EditorToolbar
      :activeTools="activeTools"
      :showGrid="showGrid"
      :isSaving="isSaving"
      :saveSuccess="saveSuccess"
      :saveError="saveError"
      :saveMessage="saveMessage"
      :documentTitle="document.title"
      :documentId="document.id"
      :paperSize="document.paperSize"
      :orientation="document.orientation"
      :isExportingPdf="isExportingPdf"
      @tool-clicked="handleToolClick"
      @save="saveDocument"
      @navigate-to-dashboard="navigateToDashboard"
      @delete-document="showDeleteConfirmation"
    />

    <div class="editor-container">
      <SidebarNavigation
        :sections="document.sections"
        :currentSection="currentSection"
        @section-selected="selectSection"
        @section-added="addSection"
        @section-updated="updateSection"
        @section-deleted="deleteSection"
      />

      <div ref="editorContainer" class="main-editor">
        <div
          class="editor-content"
          :style="editorContentStyle"
          @mousedown="startDrawing"
          @mousemove="updateDrawing"
          @mouseup="finishDrawing"
          @mouseleave="cancelDrawing"
        >
          <DocumentPage
            v-for="(section, index) in document?.sections &&
              document?.sections.length > 0
              ? document.sections
              : []"
            :key="section.id"
            :section="section"
            :isActive="currentSection === index"
            :showGrid="showGrid"
            :isDrawing="isDrawing && currentSection === index"
            ref="documentPageRefs"
            :drawingRectStyle="drawingRectangleStyle"
            :paperSize="document.paperSize"
            :orientation="document.orientation"
            @element-selected="selectElement"
            @element-updated="updateElement"
            @move-element-up="moveElementUp"
            @move-element-down="moveElementDown"
            @move-element-to-top="moveElementToTop"
            @move-element-to-bottom="moveElementToBottom"
            @toggle-grid="toggleGrid"
          />
        </div>
      </div>

      <div v-if="selectedElement || showLayerPanel" class="right-panel">
        <v-tabs v-model="activeTab">
          <v-tab value="properties">Properties</v-tab>
          <v-tab value="layers">Layers</v-tab>
        </v-tabs>

        <div class="tab-content">
          <PropertiesPanel
            v-if="selectedElement && activeTab === 'properties'"
            :selectedElement="selectedElement"
            @update:element="updateElement"
            @delete-element="deleteElement"
            @duplicate-element="duplicateElement"
            @close="selectedElement = null"
          />

          <LayerControlPanel
            v-if="activeTab === 'layers'"
            :elements="currentSectionElements"
            :selectedElement="selectedElement"
            @element-selected="selectElement"
            @move-up="moveElementUp"
            @move-down="moveElementDown"
            @move-to-top="moveElementToTop"
            @move-to-bottom="moveElementToBottom"
          />
        </div>
      </div>
    </div>

    <PreviewDialog v-model="showPreview" :document="document" />

    <!-- Document Size Dialog -->
    <DocumentSizeDialog
      v-model="showDocumentSizeDialog"
      :paperSize="document.paperSize"
      :orientation="document.orientation"
      @update:paperSize="updatePaperSize"
      @update:orientation="updateOrientation"
    />

    <!-- Add title dialog -->
    <v-dialog v-model="showTitleDialog" max-width="400">
      <v-card>
        <v-card-title>Document Title</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="documentTitle"
            label="Enter document title"
            :error-messages="titleError"
            @keyup.enter="confirmSaveWithTitle"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="cancelSave">Cancel</v-btn>
          <v-btn color="primary" @click="confirmSaveWithTitle">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Document</v-card-title>
        <v-card-text>
          Are you sure you want to delete this document? This action cannot be
          undone.
          <div v-if="isDeleting" class="mt-4">
            <v-progress-linear
              indeterminate
              color="primary"
            ></v-progress-linear>
            <div class="text-center mt-2">
              Deleting document and associated resources...
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text
                 :disabled="isDeleting"
                 @click="cancelDelete"
          >Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  onMounted,
  reactive,
  watch,
  onBeforeUnmount,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import EditorToolbar from "../components/editor/EditorToolbar.vue";
import SidebarNavigation from "../components/editor/SidebarNavigation.vue";
import DocumentPage from "../components/editor/DocumentPage.vue";
import PropertiesPanel from "../components/editor/PropertiesPanel.vue";
import LayerControlPanel from "../components/editor/LayerControlPanel.vue";
import PreviewDialog from "../components/editor/PreviewDialog.vue";
import DocumentSizeDialog from "../components/editor/DocumentSizeDialog.vue";
import { directExportToPdf } from "../services/pdfExportService";
import { useDocumentStore } from "../stores/documentStore";
import { useHistoryStore } from "../stores/historyStore";
import { Section, DocumentElement, Document } from "../types/document";

const route = useRoute();
const documentStore = useDocumentStore();
const historyStore = useHistoryStore();
const documentId = route.params.id as string | undefined;
const router = useRouter();

const document = reactive<Document>({
  id: documentId || "new-doc-" + Date.now(),
  title: "Untitled Document",
  sections: [],
  paperSize: "Letter", // Default paper size
  orientation: "portrait", // Default orientation
});

const currentSection = ref(0);
const selectedElement = ref<DocumentElement | null>(null);
const activeTools = ref<string[]>([]);
const editorContainer = ref<HTMLElement | null>(null);
const documentPageRefs = ref<any[]>([]);
const showGrid = ref(true); // Show grid by default
const zoom = ref(1);
const showPreview = ref(false);
const showDocumentSizeDialog = ref(false);
const isExportingPdf = ref(false);
const showLayerPanel = ref(true); // Always show layer panel
const activeTab = ref("properties"); // Default to properties tab
// isLoadingDocument is already defined below

// Delete dialog state
const showDeleteDialog = ref(false);
const isDeleting = ref(false);

// Snackbar for notifications
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

// Drawing state for creating elements by drawing an area
const isDrawing = ref(false);
const drawingTool = ref<string | null>(null);
const drawStartX = ref(0);
const drawStartY = ref(0);
const drawEndX = ref(0);
const drawEndY = ref(0);
const currentShapeType = ref<string>("rectangle");

const editorContentStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
  transformOrigin: "0 0",
}));

// Computed style for the drawing rectangle
const drawingRectangleStyle = computed(() => {
  if (!isDrawing.value) {
    return {
      left: "0px",
      top: "0px",
      width: "0px",
      height: "0px",
    };
  }

  // Calculate the rectangle dimensions
  const left = Math.min(drawStartX.value, drawEndX.value);
  const top = Math.min(drawStartY.value, drawEndY.value);
  const width = Math.abs(drawEndX.value - drawStartX.value);
  const height = Math.abs(drawEndY.value - drawStartY.value);

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  };
});

// Get elements from the current section for the layer panel
const currentSectionElements = computed(() => {
  if (!document.sections || !document.sections[currentSection.value]) {
    return [];
  }
  return document.sections[currentSection.value].elements;
});

watch(
  () => JSON.stringify(document),
  () => {
    historyStore.pushState(document);
  },
  { deep: true },
);

onMounted(async () => {
  isLoadingDocument.value = true;

  if (documentId) {
    const loadedDoc = await documentStore.getDocument(documentId);
    if (loadedDoc) {
      console.log("Loaded document:", {
        id: loadedDoc.id,
        title: loadedDoc.title,
        paperSize: loadedDoc.paperSize,
        orientation: loadedDoc.orientation,
      });

      Object.assign(document, loadedDoc);
      historyStore.pushState(document);

      console.log("Document after loading:", {
        id: document.id,
        title: document.title,
        paperSize: document.paperSize,
        orientation: document.orientation,
      });
    }
  } else {
    document.sections = [
      {
        id: "cover",
        title: "Cover",
        elements: [],
      },
    ];
    historyStore.pushState(document);

    console.log("New document created:", {
      id: document.id,
      title: document.title,
      paperSize: document.paperSize,
      orientation: document.orientation,
    });
  }

  // Reset loading flag
  isLoadingDocument.value = false;
});

function handleUndo() {
  const previousState = historyStore.undo(document);
  if (previousState) {
    Object.assign(document, previousState);
  }
}

function handleRedo() {
  const nextState = historyStore.redo(document);
  if (nextState) {
    Object.assign(document, nextState);
  }
}

function selectSection(index: number) {
  currentSection.value = index;
  selectedElement.value = null;
}

function addSection(section: Section) {
  document.sections.push(section);
  currentSection.value = document.sections.length - 1;
}

function updateSection(index: number, section: Section) {
  document.sections[index] = section;
}

function deleteSection(index: number) {
  if (document.sections.length > 1) {
    document.sections.splice(index, 1);
    if (currentSection.value >= document.sections.length) {
      currentSection.value = document.sections.length - 1;
    }
  }
}

function selectElement(element: DocumentElement | null) {
  selectedElement.value = element;
  if (element) {
    activeTools.value = [element.type];
  } else {
    activeTools.value = [];
  }
}

function updateElement(element: DocumentElement) {
  const sectionIndex = document.sections.findIndex((s) =>
    s.elements.some((e) => e.id === element.id),
  );

  if (sectionIndex >= 0) {
    const elementIndex = document.sections[sectionIndex].elements.findIndex(
      (e) => e.id === element.id,
    );
    if (elementIndex >= 0) {
      document.sections[sectionIndex].elements[elementIndex] = element;
    }
  }
}

function deleteElement(element: DocumentElement) {
  const sectionIndex = document.sections.findIndex((s) =>
    s.elements.some((e) => e.id === element.id),
  );

  if (sectionIndex >= 0) {
    document.sections[sectionIndex].elements = document.sections[
      sectionIndex
    ].elements.filter((e) => e.id !== element.id);
    selectedElement.value = null;
  }
}

// Using the getHighestZIndex function defined below

function duplicateElement(element: DocumentElement) {
  const highestZIndex = getHighestZIndex();

  const newElement = {
    ...element,
    id: `${element.type}-${Date.now()}`,
    position: {
      x: element.position.x + 20,
      y: element.position.y + 20,
    },
    zIndex: highestZIndex + 1, // Place the duplicate on top
  };

  document.sections[currentSection.value].elements.push(newElement);
  selectedElement.value = newElement;
}

// Drawing functions for creating elements
function startDrawing(event: MouseEvent) {
  // Only start drawing if a drawing tool is selected
  if (!drawingTool.value) return;

  // Find the active document page
  const activePage = findActiveDocumentPage(event);
  if (!activePage) return;

  // Get the position relative to the active document page content
  const pageRect = activePage.getBoundingClientRect();
  const x = (event.clientX - pageRect.left) / zoom.value;
  const y = (event.clientY - pageRect.top) / zoom.value;

  // Set the starting position
  drawStartX.value = x;
  drawStartY.value = y;
  drawEndX.value = x;
  drawEndY.value = y;

  // Start drawing
  isDrawing.value = true;
}

function updateDrawing(event: MouseEvent) {
  // Only update if we're drawing
  if (!isDrawing.value) return;

  // Find the active document page
  const activePage = findActiveDocumentPage(event);
  if (!activePage) return;

  // Get the position relative to the active document page content
  const pageRect = activePage.getBoundingClientRect();
  const x = (event.clientX - pageRect.left) / zoom.value;
  const y = (event.clientY - pageRect.top) / zoom.value;

  // Update the end position
  drawEndX.value = x;
  drawEndY.value = y;
}

function finishDrawing(event: MouseEvent) {
  // Only finish if we're drawing
  if (!isDrawing.value) return;

  // Find the active document page
  const activePage = findActiveDocumentPage(event);
  if (!activePage) {
    // Reset drawing state if no active page found
    isDrawing.value = false;
    drawingTool.value = null;
    return;
  }

  // Get the position relative to the active document page content
  const pageRect = activePage.getBoundingClientRect();
  const x = (event.clientX - pageRect.left) / zoom.value;
  const y = (event.clientY - pageRect.top) / zoom.value;

  // Update the end position
  drawEndX.value = x;
  drawEndY.value = y;

  // Calculate the rectangle dimensions
  const left = Math.min(drawStartX.value, drawEndX.value);
  const top = Math.min(drawStartY.value, drawEndY.value);
  const width = Math.abs(drawEndX.value - drawStartX.value);
  const height = Math.abs(drawEndY.value - drawStartY.value);

  // Get the page content element to account for its padding
  const pageContent = activePage.querySelector(".page-content");
  let adjustedLeft = left;
  let adjustedTop = top;

  if (pageContent) {
    // Get the computed style to account for padding
    const style = window.getComputedStyle(pageContent);
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;

    // Adjust the position to account for the page content padding
    adjustedLeft = Math.max(0, left - paddingLeft);
    adjustedTop = Math.max(0, top - paddingTop);
  }

  // Only create an element if the area is large enough
  if (width > 10 && height > 10) {
    // Create the element based on the drawing tool
    switch (drawingTool.value) {
    case "text":
      addTextElement(adjustedLeft, adjustedTop, width, height);
      break;
    case "image":
      addImageElement(adjustedLeft, adjustedTop, width, height);
      break;
    case "shape":
      addShapeElement(adjustedLeft, adjustedTop, width, height);
      break;
    case "line":
      addLineElement(adjustedLeft, adjustedTop, width, height);
      break;
    case "table":
      addTableElement(adjustedLeft, adjustedTop, width, height);
      break;
    case "signature":
      addSignatureElement(adjustedLeft, adjustedTop, width, height);
      break;
    case "form":
      addFormElement(adjustedLeft, adjustedTop, width, height);
      break;
    case "grid-element":
      addGridElement(adjustedLeft, adjustedTop, width, height);
      break;
    }
  }

  // Reset drawing state
  isDrawing.value = false;
  drawingTool.value = null;
}

// Helper function to find the active document page
function findActiveDocumentPage(event: MouseEvent): HTMLElement | null {
  // Try to find the document page that contains the event target
  let element = event.target as HTMLElement;
  while (element && !element.classList.contains("document-page")) {
    element = element.parentElement as HTMLElement;
  }

  // If we found a document page, return it
  if (element && element.classList.contains("document-page")) {
    return element;
  }

  // If we couldn't find a document page from the event target,
  // try to find the active document page from the refs
  if (documentPageRefs.value && documentPageRefs.value.length > 0) {
    const activePageRef = documentPageRefs.value[currentSection.value];
    if (activePageRef && activePageRef.$el) {
      return activePageRef.$el;
    }
  }

  return null;
}

function cancelDrawing() {
  // Reset drawing state
  isDrawing.value = false;
  drawingTool.value = null;
}

// Text selection is now handled by the global selection manager

// Function to export the document to PDF
async function exportToPdf() {
  try {
    isExportingPdf.value = true;

    // Generate a default filename based on the document title
    const filename = `${document.title || "document"}.pdf`;

    // Export options
    const options = {
      filename: filename,
      includeBackground: true,
      quality: 2, // Normal quality
      paperSize: document.paperSize,
      orientation: document.orientation,
    };

    // Export the document to PDF
    await directExportToPdf(document, options);

    // Show success message
    snackbar.value = {
      show: true,
      text: "PDF exported successfully",
      color: "success",
    };
  } catch (error) {
    console.error("Error exporting PDF:", error);

    // Show error message
    snackbar.value = {
      show: true,
      text: "Failed to export PDF. Please try again.",
      color: "error",
    };
  } finally {
    isExportingPdf.value = false;
  }
}

function handleToolClick(tool: string, value?: any) {
  switch (tool) {
  case "undo":
    handleUndo();
    break;

  case "redo":
    handleRedo();
    break;

  case "add-page":
    addSection({
      id: "section-" + Date.now(),
      title: "New Section",
      elements: [],
    });
    break;

  case "grid":
    toggleGrid(value);
    break;

  case "zoom-in":
    zoom.value = Math.min(2, zoom.value + 0.1);
    break;

  case "zoom-out":
    zoom.value = Math.max(0.5, zoom.value - 0.1);
    break;

  case "paper-size":
    // Update the document's paper size
    document.paperSize = value;
    console.log("Document paper size changed to:", value);
    break;

  case "orientation":
    // Update the document's orientation
    document.orientation = value as "portrait" | "landscape";
    console.log("Document orientation changed to:", value);
    break;

  case "document-size":
    // Open the document size dialog
    showDocumentSizeDialog.value = true;
    break;

  case "text":
    // Set the drawing tool to text and wait for user to draw
    drawingTool.value = "text";
    break;

  case "image":
    // Set the drawing tool to image and wait for user to draw
    drawingTool.value = "image";
    break;

  case "shape":
    // Set the drawing tool to shape and wait for user to draw
    drawingTool.value = "shape";
    // Set the current shape type
    currentShapeType.value = value || "rectangle";
    break;

  case "line":
    // Set the drawing tool to line and wait for user to draw
    drawingTool.value = "line";
    break;

  case "table":
    // Set the drawing tool to table and wait for user to draw
    drawingTool.value = "table";
    break;

  case "signature":
    // Set the drawing tool to signature and wait for user to draw
    drawingTool.value = "signature";
    break;

  case "form":
    // Set the drawing tool to form and wait for user to draw
    drawingTool.value = "form";
    break;

  case "grid-element":
    // Set the drawing tool to grid and wait for user to draw
    drawingTool.value = "grid-element";
    break;

  case "preview":
    showPreview.value = true;
    break;

  case "export-pdf":
    exportToPdf();
    break;
  }
}

function addTextElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  // Get highest zIndex in current section to place new element on top
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "text-" + Date.now(),
    type: "text",
    content: "New text block",
    position: { x: x ?? 100, y: y ?? 100 },
    size: { width: width ?? 300, height: height ?? 100 },
    style: {
      fontFamily: "Roboto",
      fontSize: 16,
      fontWeight: "normal",
      color: "#000000",
      backgroundColor: "transparent",
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

// Helper function to get the highest zIndex in the current section
function getHighestZIndex(): number {
  if (!document.sections || !document.sections[currentSection.value]) {
    return 0;
  }

  const elements = document.sections[currentSection.value].elements;
  if (!elements || elements.length === 0) {
    return 0;
  }

  let highestZIndex = 0;
  elements.forEach((element) => {
    const zIndex = element.zIndex ?? 0;
    if (zIndex > highestZIndex) {
      highestZIndex = zIndex;
    }
  });

  return highestZIndex;
}

function addImageElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "image-" + Date.now(),
    type: "image",
    content:
      "https://images.pexels.com/photos/3760514/pexels-photo-3760514.jpeg",
    position: { x: x ?? 100, y: y ?? 100 },
    size: { width: width ?? 300, height: height ?? 200 },
    style: {
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      opacity: 1,
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

function addShapeElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "shape-" + Date.now(),
    type: "shape",
    content: currentShapeType.value, // Use the current shape type
    position: { x: x ?? 100, y: y ?? 100 },
    size: { width: width ?? 200, height: height ?? 100 },
    style: {
      fill: "#E2E8F0",
      stroke: "#CBD5E1",
      strokeWidth: 1,
      opacity: 1,
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

function addLineElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "line-" + Date.now(),
    type: "shape",
    content: "line",
    position: { x: x ?? 100, y: y ?? 100 },
    size: { width: width ?? 200, height: height ?? 2 },
    style: {
      stroke: "#000000",
      strokeWidth: 2,
      opacity: 1,
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

function addTableElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "table-" + Date.now(),
    type: "table",
    content: {
      headers: ["Item", "Description", "Price"],
      rows: [["", "", ""]],
    },
    position: { x: x ?? 50, y: y ?? 100 },
    size: { width: width ?? 600, height: height ?? 200 },
    style: {
      headerBackgroundColor: "#F8F9FA",
      headerTextColor: "#000000",
      cellBackgroundColor: "#FFFFFF",
      cellTextColor: "#000000",
      borderColor: "#E2E8F0",
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

function addSignatureElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "signature-" + Date.now(),
    type: "signature",
    content: "",
    position: { x: x ?? 100, y: y ?? 400 },
    size: { width: width ?? 300, height: height ?? 100 },
    style: {
      borderBottom: "1px solid #000000",
      label: "Signature",
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

function addFormElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "form-" + Date.now(),
    type: "form",
    content: {
      type: "textfield",
      label: "Input Label",
      inputType: "text",
    },
    position: { x: x ?? 100, y: y ?? 100 },
    size: { width: width ?? 300, height: height ?? 80 },
    style: {
      backgroundColor: "white",
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

function addGridElement(
  x?: number,
  y?: number,
  width?: number,
  height?: number,
) {
  const highestZIndex = getHighestZIndex();

  const newElement: DocumentElement = {
    id: "grid-" + Date.now(),
    type: "grid",
    content: {
      cells: [
        { type: "text", content: "Text content", size: 1 },
        { type: "image", content: "", size: 1 },
      ],
    },
    position: { x: x ?? 100, y: y ?? 100 },
    size: { width: width ?? 600, height: height ?? 300 },
    style: {
      backgroundColor: "white",
      borderColor: "#E2E8F0",
    },
    zIndex: highestZIndex + 1, // Place on top
  };
  document.sections[currentSection.value].elements.push(newElement);
  selectElement(newElement);
}

// Layer management functions
function moveElementUp(element: DocumentElement) {
  const sectionIndex = document.sections.findIndex((s) =>
    s.elements.some((e) => e.id === element.id),
  );

  if (sectionIndex >= 0) {
    const elements = document.sections[sectionIndex].elements;
    const elementIndex = elements.findIndex((e) => e.id === element.id);

    if (elementIndex >= 0) {
      // Get current zIndex or default to 0
      const currentZIndex = element.zIndex ?? 0;

      // Find the element with the next higher zIndex
      const higherElements = elements.filter(
        (e) => (e.zIndex ?? 0) > currentZIndex,
      );

      if (higherElements.length > 0) {
        // Sort by zIndex to find the element immediately above
        higherElements.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
        const nextElement = higherElements[0];
        const nextZIndex = nextElement.zIndex ?? 0;

        // Swap zIndex values
        const updatedElement = { ...element, zIndex: nextZIndex };
        const updatedNextElement = { ...nextElement, zIndex: currentZIndex };

        // Update both elements
        updateElement(updatedElement);
        updateElement(updatedNextElement);
      } else {
        // If this is already the top element, increment its zIndex
        const updatedElement = { ...element, zIndex: currentZIndex + 1 };
        updateElement(updatedElement);
      }
    }
  }
}

function moveElementDown(element: DocumentElement) {
  const sectionIndex = document.sections.findIndex((s) =>
    s.elements.some((e) => e.id === element.id),
  );

  if (sectionIndex >= 0) {
    const elements = document.sections[sectionIndex].elements;
    const elementIndex = elements.findIndex((e) => e.id === element.id);

    if (elementIndex >= 0) {
      // Get current zIndex or default to 0
      const currentZIndex = element.zIndex ?? 0;

      // Find the element with the next lower zIndex
      const lowerElements = elements.filter(
        (e) => (e.zIndex ?? 0) < currentZIndex,
      );

      if (lowerElements.length > 0) {
        // Sort by zIndex to find the element immediately below
        lowerElements.sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
        const prevElement = lowerElements[0];
        const prevZIndex = prevElement.zIndex ?? 0;

        // Swap zIndex values
        const updatedElement = { ...element, zIndex: prevZIndex };
        const updatedPrevElement = { ...prevElement, zIndex: currentZIndex };

        // Update both elements
        updateElement(updatedElement);
        updateElement(updatedPrevElement);
      } else {
        // If this is already the bottom element, decrement its zIndex
        const updatedElement = { ...element, zIndex: currentZIndex - 1 };
        updateElement(updatedElement);
      }
    }
  }
}

function moveElementToTop(element: DocumentElement) {
  const sectionIndex = document.sections.findIndex((s) =>
    s.elements.some((e) => e.id === element.id),
  );

  if (sectionIndex >= 0) {
    const elements = document.sections[sectionIndex].elements;

    // Find the highest zIndex
    let highestZIndex = 0;
    elements.forEach((e) => {
      const zIndex = e.zIndex ?? 0;
      if (zIndex > highestZIndex) {
        highestZIndex = zIndex;
      }
    });

    // Set this element's zIndex to be higher than the highest
    const updatedElement = { ...element, zIndex: highestZIndex + 1 };
    updateElement(updatedElement);
  }
}

function moveElementToBottom(element: DocumentElement) {
  const sectionIndex = document.sections.findIndex((s) =>
    s.elements.some((e) => e.id === element.id),
  );

  if (sectionIndex >= 0) {
    const elements = document.sections[sectionIndex].elements;

    // Find the lowest zIndex
    let lowestZIndex = 0;
    elements.forEach((e) => {
      const zIndex = e.zIndex ?? 0;
      if (zIndex < lowestZIndex) {
        lowestZIndex = zIndex;
      }
    });

    // Set this element's zIndex to be lower than the lowest
    const updatedElement = { ...element, zIndex: lowestZIndex - 1 };
    updateElement(updatedElement);
  }
}

// Document size functions
function updatePaperSize(size: string) {
  document.paperSize = size;
  console.log("Document paper size updated to:", size);
}

function updateOrientation(orientation: "portrait" | "landscape") {
  document.orientation = orientation;
  console.log("Document orientation updated to:", orientation);
}

// Grid functions
function toggleGrid(visible?: boolean) {
  // If visible is provided, use it; otherwise toggle the current value
  showGrid.value = visible !== undefined ? visible : !showGrid.value;

  console.log("Grid visibility toggled:", showGrid.value);

  // Update all elements to snap to grid if grid is enabled
  if (showGrid.value) {
    document.sections.forEach((section) => {
      section.elements.forEach((element) => {
        // Snap element position to grid
        const snappedPosition = {
          x: Math.round(element.position.x / 10) * 10,
          y: Math.round(element.position.y / 10) * 10,
        };

        // Only update if position actually changed
        if (
          snappedPosition.x !== element.position.x ||
          snappedPosition.y !== element.position.y
        ) {
          const updatedElement = {
            ...element,
            position: snappedPosition,
          };
          updateElement(updatedElement);
        }
      });
    });
  }
}

// Add these refs for save status
const isSaving = ref(false);
const saveSuccess = ref(false);
const saveError = ref(false);
const saveMessage = ref("");
const hasUnsavedChanges = ref(false);

// Add these refs for the title dialog
const showTitleDialog = ref(false);
const documentTitle = ref("");
const titleError = ref("");
const pendingSave = ref(false);

// Add a flag to track if we're currently loading a document
const isLoadingDocument = ref(false);
const lastEdit = ref(Date.now());

// Track changes to document
watch(
  () => JSON.stringify(document),
  () => {
    // Only mark as unsaved if we're not loading a document
    if (!isLoadingDocument.value) {
      hasUnsavedChanges.value = true;
      lastEdit.value = Date.now();
    }
  },
  { deep: true },
);

// Reset unsaved changes flag
function resetUnsavedChanges() {
  hasUnsavedChanges.value = false;
}

function saveDocument() {
  // Reset any previous errors
  titleError.value = "";

  // Set the initial title value to the current document title
  documentTitle.value = document.title || "";

  // Show the title dialog
  showTitleDialog.value = true;
  pendingSave.value = true;
}

// Add a ref to store the navigation timeout
const navigationTimeout = ref<number | null>(null);

// Function to handle the actual save after title is confirmed
async function performSave() {
  if (isSaving.value) return; // Prevent multiple simultaneous saves

  // Clear any existing navigation timeout
  if (navigationTimeout.value) {
    clearTimeout(navigationTimeout.value);
    navigationTimeout.value = null;
  }

  isSaving.value = true;
  saveSuccess.value = false;
  saveError.value = false;
  saveMessage.value = "Saving document...";

  try {
    // Update the document title with the user input
    document.title = documentTitle.value.trim() || "Untitled Document";

    // Make sure we have at least one section
    if (!document.sections || document.sections.length === 0) {
      document.sections = [
        {
          id: "section-" + Date.now(),
          title: "Section 1",
          elements: [],
        },
      ];
    }

    // Prepare document for saving
    const documentToSave = {
      id: document.id,
      title: document.title,
      createdAt: document.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sections: document.sections,
      paperSize: document.paperSize,
      orientation: document.orientation,
    };

    console.log("Saving document:", {
      id: documentToSave.id,
      title: documentToSave.title,
      paperSize: documentToSave.paperSize,
      orientation: documentToSave.orientation,
    });

    // Save the document
    const savedDocument = await documentStore.saveDocument(documentToSave);

    console.log("Document saved successfully:", {
      id: savedDocument.id,
      title: savedDocument.title,
      paperSize: savedDocument.paperSize,
      orientation: savedDocument.orientation,
    });

    // Update the document with the saved version
    Object.assign(document, savedDocument);

    // Reset unsaved changes flag BEFORE navigation
    resetUnsavedChanges();

    // Show success message
    saveSuccess.value = true;
    saveMessage.value = "Document saved successfully!";

    // Wait a moment to show the success message before redirecting
    navigationTimeout.value = setTimeout(() => {
      // Navigate to the Dashboard page
      console.log("Redirecting to Dashboard after successful save");
      router.push("/");
      navigationTimeout.value = null;
    }, 1000); // Short delay to show the success message

    console.log("Document saved successfully:", savedDocument.id);
    return true;
  } catch (error) {
    console.error("Error saving document:", error);

    // Show error message
    saveError.value = true;
    saveMessage.value = "Failed to save document. Please try again.";

    // Reset error message after 5 seconds
    setTimeout(() => {
      saveError.value = false;
      saveMessage.value = "";
    }, 5000);

    return false;
  } finally {
    isSaving.value = false;
    pendingSave.value = false;
  }
}

// Function to confirm save with the entered title
function confirmSaveWithTitle() {
  // Validate the title
  if (!documentTitle.value.trim()) {
    titleError.value = "Please enter a document title";
    return;
  }

  // Close the dialog
  showTitleDialog.value = false;

  // Perform the save
  performSave();
}

// Function to cancel the save operation
function cancelSave() {
  showTitleDialog.value = false;
  pendingSave.value = false;
}

// Add autosave functionality
// const lastEdit = ref(Date.now());
// Autosave is disabled for now
const autoSaveTimer: number | null = null;

// Watch for document changes and mark for autosave
watch(
  () => JSON.stringify(document),
  () => {
    lastEdit.value = Date.now();
  },
  { deep: true },
);

// Set up autosave timer
onMounted(() => {
  // Other onMounted code...

  // Set up autosave
  // autoSaveTimer = window.setInterval(() => {
  //   const timeSinceLastEdit = Date.now() - lastEdit.value;

  //   // Only autosave if there have been changes and no save is in progress
  //   if (timeSinceLastEdit < autoSaveInterval && !isSaving.value) {
  //     console.log("Auto-saving document...");
  //     saveDocument();
  //   }
  // }, autoSaveInterval);

  // Add keyboard shortcut for save
  window.addEventListener("keydown", handleKeyDown);
});

// Clean up timers and event listeners
onBeforeUnmount(() => {
  if (autoSaveTimer !== null) {
    clearInterval(autoSaveTimer);
  }

  window.removeEventListener("keydown", handleKeyDown);
});

// Handle keyboard shortcuts
function handleKeyDown(event: KeyboardEvent) {
  // Check for Ctrl+S or Cmd+S
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault(); // Prevent browser's save dialog
    saveDocument();
  }
}

// Unsaved changes dialog actions removed

// Navigation guard removed - allow direct navigation without confirmation

// Beforeunload event handler removed - allow closing without confirmation

// Update navigation function to go directly to dashboard
function navigateToDashboard() {
  // Always navigate directly to the dashboard without confirmation
  router.push("/");
}

// Show delete confirmation dialog
function showDeleteConfirmation() {
  showDeleteDialog.value = true;
}

// Cancel delete operation
function cancelDelete() {
  showDeleteDialog.value = false;
}

// Confirm delete operation
async function confirmDelete() {
  if (!document.id || document.id.startsWith("new-doc")) {
    // Don't try to delete new documents that haven't been saved
    showDeleteDialog.value = false;
    return;
  }

  isDeleting.value = true;

  try {
    // Call the document store to delete the document
    await documentStore.deleteDocument(document.id);

    // Show success notification
    snackbar.value = {
      show: true,
      text: `"${document.title}" has been deleted successfully.`,
      color: "success",
    };

    // Close the dialog
    showDeleteDialog.value = false;

    // Navigate to the dashboard
    router.push("/");
  } catch (error) {
    console.error("Error deleting document:", error);

    // Show error notification
    snackbar.value = {
      show: true,
      text: "Failed to delete document. Please try again.",
      color: "error",
    };
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped lang="scss">
.document-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.editor-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-editor {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background-color: var(--surface);
  position: relative;
}

.editor-content {
  min-height: 100%;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background-color: var(--surface);

  .tab-content {
    flex: 1;
    overflow: auto;
  }
}

/* Add styles for the title dialog */
:deep(.v-text-field) {
  margin-top: 16px;
}

:deep(.v-card-title) {
  font-size: 20px;
  font-weight: 500;
}

:deep(.v-card-text) {
  padding-top: 0;
}
</style>
