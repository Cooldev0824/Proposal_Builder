<template>
  <div v-if="visible" class="inline-formatting-toolbar" :style="toolbarStyle">
    <div class="toolbar-buttons">
      <button 
        class="format-button" 
        :class="{ active: isBold }"
        title="Bold"
        @mousedown.prevent="applyBold"
      >
        <v-icon>mdi-format-bold</v-icon>
      </button>
      <button 
        class="format-button" 
        :class="{ active: isItalic }"
        title="Italic"
        @mousedown.prevent="applyItalic"
      >
        <v-icon>mdi-format-italic</v-icon>
      </button>
      <button 
        class="format-button" 
        :class="{ active: isUnderline }"
        title="Underline"
        @mousedown.prevent="applyUnderline"
      >
        <v-icon>mdi-format-underline</v-icon>
      </button>
      <div class="divider"></div>
      <div class="color-picker">
        <input 
          v-model="textColor" 
          type="color" 
          title="Text Color"
          @change="applyTextColor"
        />
        <v-icon small>mdi-format-color-text</v-icon>
      </div>
      <div class="color-picker">
        <input 
          v-model="backgroundColor" 
          type="color" 
          title="Background Color"
          @change="applyBackgroundColor"
        />
        <v-icon small>mdi-format-color-highlight</v-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { 
  toggleBold, 
  toggleItalic, 
  toggleUnderline, 
  setTextColor, 
  setBackgroundColor,
  hasBold,
  hasItalic,
  hasUnderline,
  getTextColor,
  getBackgroundColor,
} from "../../utils/textFormatting";

const visible = ref(false);
const position = ref({ x: 0, y: 0 });
const isBold = ref(false);
const isItalic = ref(false);
const isUnderline = ref(false);
const textColor = ref("#000000");
const backgroundColor = ref("#ffffff");

const toolbarStyle = computed(() => {
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
  };
});

function updateFormattingState() {
  isBold.value = hasBold();
  isItalic.value = hasItalic();
  isUnderline.value = hasUnderline();
  
  const currentTextColor = getTextColor();
  if (currentTextColor && currentTextColor !== "rgb(0, 0, 0)") {
    textColor.value = rgbToHex(currentTextColor);
  }
  
  const currentBgColor = getBackgroundColor();
  if (currentBgColor && currentBgColor !== "rgba(0, 0, 0, 0)") {
    backgroundColor.value = rgbToHex(currentBgColor);
  }
}

function rgbToHex(rgb: string): string {
  // Convert rgb(r, g, b) to #rrggbb
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
    const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
    const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }
  return rgb;
}

function applyBold() {
  toggleBold();
  isBold.value = hasBold();
}

function applyItalic() {
  toggleItalic();
  isItalic.value = hasItalic();
}

function applyUnderline() {
  toggleUnderline();
  isUnderline.value = hasUnderline();
}

function applyTextColor() {
  setTextColor(textColor.value);
}

function applyBackgroundColor() {
  setBackgroundColor(backgroundColor.value);
}

function handleSelectionChange() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    visible.value = false;
    return;
  }
  
  // Only show the toolbar if text is selected
  visible.value = true;
  
  // Update the toolbar position
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  position.value = {
    x: rect.left + window.scrollX + (rect.width / 2) - 100, // Center the toolbar
    y: rect.top + window.scrollY - 50, // Position above the selection
  };
  
  // Update the formatting state
  updateFormattingState();
}

// Set up event listeners
onMounted(() => {
  document.addEventListener("selectionchange", handleSelectionChange);
  document.addEventListener("mouseup", handleSelectionChange);
});

onBeforeUnmount(() => {
  document.removeEventListener("selectionchange", handleSelectionChange);
  document.removeEventListener("mouseup", handleSelectionChange);
});
</script>

<style scoped lang="scss">
.inline-formatting-toolbar {
  position: absolute;
  z-index: 1000;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px;
  display: flex;
  align-items: center;
  
  .toolbar-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .format-button {
    background: none;
    border: none;
    border-radius: 4px;
    padding: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background-color: #f0f0f0;
    }
    
    &.active {
      background-color: #e0e0e0;
      color: #1976d2;
    }
  }
  
  .divider {
    width: 1px;
    height: 24px;
    background-color: #ccc;
    margin: 0 4px;
  }
  
  .color-picker {
    position: relative;
    width: 24px;
    height: 24px;
    
    input[type="color"] {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }
    
    .v-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
  }
}
</style>
