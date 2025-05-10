<template>
  <v-dialog
    v-model="dialog"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card>
      <v-toolbar dark color="primary">
        <v-btn icon dark @click="closePreview">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>Preview</v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>

      <v-container fluid>
        <div class="preview-pages" ref="previewContent">
          <div
            v-for="(section, index) in document.sections"
            :key="section.id"
            class="preview-page"
            :style="pageStyle"
          >
            <!-- Page content without rulers -->
            <div class="page-content">
              <div class="elements-container">
                <component
                  v-for="element in getSortedElements(section.elements)"
                  :key="element.id"
                  :is="getElementComponent(element.type)"
                  :element="{
                    ...element,
                    position: {
                      x: Math.max(0, element.position.x - 30),
                      y: Math.max(0, element.position.y - 30)
                    }
                  }"
                  :isSelected="false"
                  :isPreview="true"
                  :style="{ zIndex: element.zIndex || 0 }"
                />
              </div>
            </div>
          </div>
        </div>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, watch, computed } from "vue";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Document } from "../../types/document";
import { getPaperSizeByName, getLandscapeSize } from "../../utils/paperSizes";

const props = defineProps<{
  modelValue: boolean;
  document: Document;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const dialog = ref(props.modelValue);
const previewContent = ref<HTMLElement | null>(null);

// Page dimensions based on paper size
const pageWidth = computed(() => {
  const paperSizeName = props.document.paperSize || "Letter";
  const orientation = props.document.orientation || "portrait";

  let paperSize = getPaperSizeByName(paperSizeName);

  // Apply orientation
  if (orientation === "landscape") {
    paperSize = getLandscapeSize(paperSize);
  }

  return paperSize.width; // Return raw pixel value
});

const pageHeight = computed(() => {
  const paperSizeName = props.document.paperSize || "Letter";
  const orientation = props.document.orientation || "portrait";

  let paperSize = getPaperSizeByName(paperSizeName);

  // Apply orientation
  if (orientation === "landscape") {
    paperSize = getLandscapeSize(paperSize);
  }

  return paperSize.height; // Return raw pixel value
});

// Computed style for the page
const pageStyle = computed(() => {
  return {
    width: `${pageWidth.value - 30}px`, // Subtract ruler width
    height: `${pageHeight.value - 30}px`, // Subtract ruler height instead of minHeight
    overflow: "hidden", // Hide content that goes outside the document boundaries
  };
});

watch(
  () => props.modelValue,
  (value) => {
    dialog.value = value;
  }
);

watch(
  () => dialog.value,
  (value) => {
    emit("update:modelValue", value);
  }
);

const TextElement = defineAsyncComponent(
  () => import("./elements/TextElement.vue")
);
const ImageElement = defineAsyncComponent(
  () => import("./elements/ImageElement.vue")
);
const ShapeElement = defineAsyncComponent(
  () => import("./elements/ShapeElement.vue")
);
const TableElement = defineAsyncComponent(
  () => import("./elements/SimpleTableElement.vue")
);
const SignatureElement = defineAsyncComponent(
  () => import("./elements/SignatureElement.vue")
);
const FormElement = defineAsyncComponent(
  () => import("./elements/FormElement.vue")
);

function getElementComponent(type: string) {
  switch (type) {
    case "text":
      return TextElement;
    case "image":
      return ImageElement;
    case "shape":
      return ShapeElement;
    case "table":
      return TableElement;
    case "signature":
      return SignatureElement;
    case "form":
      return FormElement;
    default:
      return null;
  }
}

// Sort elements by zIndex for proper layering
function getSortedElements(elements: any[]) {
  if (!elements || !Array.isArray(elements)) return [];

  // Make a copy of the elements array to avoid modifying the original
  return [...elements].sort((a, b) => {
    // Default zIndex to 0 if not set
    const zIndexA = a.zIndex ?? 0;
    const zIndexB = b.zIndex ?? 0;
    return zIndexA - zIndexB;
  });
}

function closePreview() {
  dialog.value = false;
}
</script>

<style scoped lang="scss">
.preview-pages {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background-color: var(--surface);
}

.preview-page {
  background-color: var(--background);
  box-shadow: var(--shadow-md);
  margin: 16px auto;
  position: relative;
  box-sizing: border-box;
  padding: 0; /* No padding for rulers */
  overflow: hidden; /* Hide content that goes outside the document boundaries */

  .page-content {
    position: relative;
    height: 100%; /* Use fixed height instead of min-height */
    width: 100%;
    padding: 0; /* No padding for rulers */
    margin: 0; /* No margin for rulers */
    background-color: white;
    box-sizing: border-box;
    overflow: hidden; /* Hide content that goes outside the document boundaries */
  }

  .elements-container {
    position: relative;
    height: 100%; /* Use fixed height instead of min-height */
    width: 100%;
    padding: 0; /* No padding for rulers */
    margin: 0; /* No margin for rulers */
    overflow: hidden; /* Hide content that goes outside the document boundaries */
  }
}
</style>
