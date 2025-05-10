<template>
  <v-dialog v-model="dialog" max-width="800">
    <v-card>
      <v-card-title class="dialog-title">
        <v-icon class="mr-2">mdi-file-document-outline</v-icon>
        Document Size
      </v-card-title>

      <v-card-text>
        <div class="document-size-container">
          <!-- Left side: Paper size selection -->
          <div class="paper-size-column">
            <div class="section-title">Paper Size</div>
            <v-list density="compact" class="paper-size-list">
              <v-list-item
                v-for="size in paperSizes"
                :key="size.name"
                :value="size.name"
                :active="selectedPaperSize.name === size.name"
                @click="selectPaperSize(size)"
                class="paper-size-list-item"
              >
                <template v-slot:prepend>
                  <div class="paper-size-icon" :style="getIconStyle(size)"></div>
                </template>
                <v-list-item-title>{{ size.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ size.description }}</v-list-item-subtitle>
                <template v-slot:append>
                  <v-icon v-if="selectedPaperSize.name === size.name" color="primary">
                    mdi-check
                  </v-icon>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Right side: Preview and orientation -->
          <div class="preview-column">
            <div class="section-title">Preview</div>
            <div class="paper-preview-container">
              <div
                class="paper-preview-large"
                :style="getLargePreviewStyle(selectedPaperSize, selectedOrientation)"
              >
                <div class="preview-content">
                  <div class="preview-text-line"></div>
                  <div class="preview-text-line" style="width: 80%"></div>
                  <div class="preview-text-line" style="width: 90%"></div>
                  <div class="preview-text-line" style="width: 70%"></div>
                </div>
                <div class="paper-dimensions">
                  {{ getDimensionsText(selectedPaperSize, selectedOrientation) }}
                </div>
              </div>
            </div>

            <div class="orientation-selector">
              <div class="section-title mt-4">Orientation</div>
              <v-btn-toggle
                v-model="selectedOrientation"
                mandatory
                class="mt-2 orientation-toggle"
              >
                <v-btn value="portrait" class="orientation-btn">
                  <v-icon>mdi-page-layout-header</v-icon>
                  <span class="ml-2">Portrait</span>
                </v-btn>
                <v-btn value="landscape" class="orientation-btn">
                  <v-icon>mdi-page-layout-sidebar-right</v-icon>
                  <span class="ml-2">Landscape</span>
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">Cancel</v-btn>
        <v-btn color="primary" @click="apply">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { PAPER_SIZES, PaperSize } from '../../utils/paperSizes';

// Import styles
import '../../assets/styles/components/documentSizeDialog.scss';

const props = defineProps<{
  modelValue: boolean;
  paperSize?: string;
  orientation?: 'portrait' | 'landscape';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'update:paperSize', value: string): void;
  (e: 'update:orientation', value: 'portrait' | 'landscape'): void;
  (e: 'apply', paperSize: string, orientation: 'portrait' | 'landscape'): void;
}>();

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const paperSizes = PAPER_SIZES;

// Initialize with current paper size or default to A4
const selectedPaperSize = ref(
  paperSizes.find(size => size.name === props.paperSize) ||
  paperSizes.find(size => size.name === 'A4') ||
  paperSizes[0]
);

const selectedOrientation = ref(props.orientation || 'portrait');

// Watch for changes in props
watch(() => props.paperSize, (newValue) => {
  if (newValue) {
    const paperSize = paperSizes.find(size => size.name === newValue);
    if (paperSize) {
      selectedPaperSize.value = paperSize;
    }
  }
}, { immediate: true });

watch(() => props.orientation, (newValue) => {
  if (newValue) {
    selectedOrientation.value = newValue;
  }
}, { immediate: true });

// Functions
function selectPaperSize(size: PaperSize) {
  selectedPaperSize.value = size;
}

function cancel() {
  dialog.value = false;
}

function apply() {
  emit('update:paperSize', selectedPaperSize.value.name);
  emit('update:orientation', selectedOrientation.value);
  emit('apply', selectedPaperSize.value.name, selectedOrientation.value);
  dialog.value = false;
}

// Function to get the style for the paper size icon
function getIconStyle(size: PaperSize) {
  const aspectRatio = size.width / size.height;
  const maxWidth = 24; // Maximum width in pixels
  const maxHeight = 32; // Maximum height in pixels

  let width, height;

  if (aspectRatio > 1) {
    // Landscape or wider paper
    width = maxWidth;
    height = width / aspectRatio;
  } else {
    // Portrait or taller paper
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: `${width}px`,
    height: `${height}px`,
    border: '1px solid var(--v-border-color)',
    backgroundColor: 'white',
  };
}

// Function to get the style for the large paper preview
function getLargePreviewStyle(size: PaperSize, orientation: 'portrait' | 'landscape') {
  const aspectRatio = size.width / size.height;
  const maxWidth = 250; // Maximum width in pixels
  const maxHeight = 350; // Maximum height in pixels

  let width, height;

  if (orientation === 'landscape') {
    // Swap width and height for landscape
    if (1/aspectRatio > 1) {
      // Wider paper in landscape
      width = maxWidth;
      height = width * (1/aspectRatio);
    } else {
      // Taller paper in landscape
      height = maxHeight;
      width = height / (1/aspectRatio);
    }
  } else {
    // Portrait
    if (aspectRatio > 1) {
      // Wider paper
      width = maxWidth;
      height = width / aspectRatio;
    } else {
      // Taller paper
      height = maxHeight;
      width = height * aspectRatio;
    }
  }

  return {
    width: `${width}px`,
    height: `${height}px`,
    border: '1px solid var(--v-border-color)',
    backgroundColor: 'white',
  };
}

// Function to get the dimensions text
function getDimensionsText(size: PaperSize, orientation: 'portrait' | 'landscape') {
  if (orientation === 'landscape') {
    return `${size.height}px × ${size.width}px`;
  } else {
    return `${size.width}px × ${size.height}px`;
  }
}
</script>


