<template>
  <div class="property-group">
    <div class="property-group-title">Image Properties</div>

    <div class="image-preview mb-4">
      <img
        v-if="element.content"
        :src="element.content"
        alt="Image preview"
        @error="handlePreviewError"
      />
      <div v-if="!element.content || previewError" class="no-image">
        <v-icon size="32" color="grey">mdi-image</v-icon>
        <span>No image selected</span>
      </div>
    </div>

    <v-text-field
      v-model="imageUrl"
      label="Image URL"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateImageUrl"
    ></v-text-field>

    <v-select
      v-model="objectFit"
      label="Object Fit"
      :items="['contain', 'cover', 'fill', 'none']"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateObjectFit"
    ></v-select>

    <v-text-field
      v-model.number="borderRadius"
      label="Border Radius"
      type="number"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateBorderRadius"
    ></v-text-field>

    <v-text-field
      v-model.number="borderWidth"
      label="Border Width"
      type="number"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateBorderWidth"
    ></v-text-field>

    <div class="mb-4">
      <label class="color-label">Border Color</label>
      <AdvancedColorPicker
        v-model="borderColor"
        @update:model-value="updateBorderColor"
      />
    </div>

    <div class="mb-4">
      <label class="color-label">Background Color</label>
      <AdvancedColorPicker
        v-model="backgroundColor"
        @update:model-value="updateBackgroundColor"
      />
    </div>

    <v-slider
      v-model="opacity"
      label="Opacity"
      min="0"
      max="1"
      step="0.1"
      density="compact"
      hide-details
      class="mb-4"
      @update:model-value="updateOpacity"
    ></v-slider>

    <div class="sample-images">
      <h4 class="text-subtitle-2 mb-2">Sample Images</h4>
      <div class="sample-grid">
        <div
          v-for="(image, index) in sampleImages"
          :key="index"
          class="sample-image"
          @click="selectSampleImage(image.url)"
        >
          <img :src="image.url" :alt="image.alt" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { DocumentElement } from "../../../types/document";
import AdvancedColorPicker from "../AdvancedColorPicker.vue";

const props = defineProps<{
  element: DocumentElement;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

const previewError = ref(false);
const imageUrl = ref(props.element.content || "");
const objectFit = ref(props.element.style?.objectFit || "cover");
const borderRadius = ref(props.element.style?.borderRadius || 0);
const borderWidth = ref(props.element.style?.borderWidth || 0);
const borderColor = ref(props.element.style?.borderColor || "#000000");
const backgroundColor = ref(props.element.style?.backgroundColor || "");
const opacity = ref(props.element.style?.opacity || 1);

const sampleImages = [
  {
    url: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg",
    alt: "Business meeting",
  },
  {
    url: "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
    alt: "Team collaboration",
  },
  {
    url: "https://images.pexels.com/photos/3184325/pexels-photo-3184325.jpeg",
    alt: "Office workspace",
  },
  {
    url: "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg",
    alt: "Creative discussion",
  },
  {
    url: "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg",
    alt: "Project planning",
  },
  {
    url: "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg",
    alt: "Design review",
  },
];

watch(
  () => props.element,
  (newValue) => {
    imageUrl.value = newValue.content || "";
    objectFit.value = newValue.style?.objectFit || "cover";
    borderRadius.value = newValue.style?.borderRadius || 0;
    borderWidth.value = newValue.style?.borderWidth || 0;
    borderColor.value = newValue.style?.borderColor || "#000000";
    backgroundColor.value = newValue.style?.backgroundColor || "";
    opacity.value = newValue.style?.opacity || 1;
  },
  { deep: true },
);

function handlePreviewError() {
  previewError.value = true;
}

function updateElement(updates: Partial<typeof props.element.style>) {
  emit("update:element", {
    ...props.element,
    style: {
      ...props.element.style,
      ...updates,
    },
  });
}

// Function to update all image properties at once
function updateAllProperties() {
  const updates: Partial<typeof props.element.style> = {
    objectFit: objectFit.value,
    borderRadius: borderRadius.value,
    borderWidth: borderWidth.value,
    borderColor: borderColor.value,
    backgroundColor: backgroundColor.value,
    opacity: opacity.value,
  };

  updateElement(updates);
}

function updateImageUrl() {
  previewError.value = false;

  // First update the content
  emit("update:element", {
    ...props.element,
    content: imageUrl.value,
    // Also include all style properties to ensure they're not lost
    style: {
      ...props.element.style,
      objectFit: objectFit.value,
      borderRadius: borderRadius.value,
      borderWidth: borderWidth.value,
      borderColor: borderColor.value,
      backgroundColor: backgroundColor.value,
      opacity: opacity.value,
    },
  });
}

// Use this single function for all property updates
function updateObjectFit() {
  updateAllProperties();
}

function updateBorderRadius() {
  updateAllProperties();
}

function updateBorderWidth() {
  updateAllProperties();
}

function updateBorderColor() {
  updateAllProperties();
}

function updateBackgroundColor() {
  updateAllProperties();
}

function updateOpacity() {
  updateAllProperties();
}

function selectSampleImage(url: string) {
  imageUrl.value = url;
  previewError.value = false;
  updateImageUrl();
}
</script>

<style scoped lang="scss">
.color-label {
  font-size: 12px;
  color: var(--text-secondary, #666);
  margin-bottom: 4px;
}

.image-preview {
  width: 100%;
  height: 150px;
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .no-image {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: #f5f5f5;
    color: #666;
  }
}

.sample-images {
  margin-top: 16px;

  .sample-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .sample-image {
    aspect-ratio: 1;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--primary);
      transform: scale(1.05);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}
</style>
