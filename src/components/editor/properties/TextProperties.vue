<template>
  <div class="property-group">
    <div class="property-group-title">Text Properties</div>

    <v-select
      v-model="textStyle"
      label="Text Style"
      :items="[
        'Paragraph',
        'Heading 1',
        'Heading 2',
        'Heading 3',
        'Heading 4',
        'Heading 5',
        'Heading 6',
      ]"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @update:model-value="updateTextStyle"
    ></v-select>

    <div class="font-family-section mb-4">
      <v-select
        v-model="fontFamily"
        label="Font Family"
        :items="fontFamilyItems"
        item-title="name"
        item-value="value"
        return-object
        density="compact"
        variant="outlined"
        hide-details
        class="mb-2"
        @blur="updateFontFamily"
        @change="updateFontFamily"
      >
        <template v-slot:selection="{ item }">
          <span :style="{ fontFamily: getFontFamilyValue(item.raw.value) }">
            {{ item.raw.name }}
          </span>
        </template>
        <template v-slot:item="{ item, props }">
          <v-list-item
            v-bind="props"
            :title="item.raw.name"
            :style="{ fontFamily: getFontFamilyValue(item.raw.value) }"
          ></v-list-item>
        </template>
      </v-select>

      <!-- Font preview -->
      <div
        class="font-preview"
        :style="{
          fontFamily: getFontFamilyValue(fontFamily?.value || 'Roboto'),
        }"
      >
        <div class="font-preview-text">
          The quick brown fox jumps over the lazy dog
        </div>
        <div class="font-preview-category">
          {{ fontFamily?.category || "sans-serif" }}
        </div>
      </div>
    </div>

    <v-text-field
      v-model.number="fontSize"
      label="Font Size"
      type="number"
      density="compact"
      variant="outlined"
      hide-details
      class="mb-4"
      @blur="updateFontSize"
      @keydown.enter="updateFontSize"
    ></v-text-field>

    <div class="property-row">
      <v-btn
        :color="bold ? 'primary' : undefined"
        icon
        size="small"
        @click="toggleBoldStyle"
      >
        <v-icon>mdi-format-bold</v-icon>
      </v-btn>

      <v-btn
        :color="italic ? 'primary' : undefined"
        icon
        size="small"
        @click="toggleItalicStyle"
      >
        <v-icon>mdi-format-italic</v-icon>
      </v-btn>

      <v-btn
        :color="underline ? 'primary' : undefined"
        icon
        size="small"
        @click="toggleUnderlineStyle"
      >
        <v-icon>mdi-format-underline</v-icon>
      </v-btn>
    </div>

    <div class="property-row mt-4">
      <v-btn
        :color="textAlign === 'left' ? 'primary' : undefined"
        icon
        size="small"
        @click="setTextAlign('left')"
      >
        <v-icon>mdi-format-align-left</v-icon>
      </v-btn>

      <v-btn
        :color="textAlign === 'center' ? 'primary' : undefined"
        icon
        size="small"
        @click="setTextAlign('center')"
      >
        <v-icon>mdi-format-align-center</v-icon>
      </v-btn>

      <v-btn
        :color="textAlign === 'right' ? 'primary' : undefined"
        icon
        size="small"
        @click="setTextAlign('right')"
      >
        <v-icon>mdi-format-align-right</v-icon>
      </v-btn>

      <v-btn
        :color="textAlign === 'justify' ? 'primary' : undefined"
        icon
        size="small"
        @click="setTextAlign('justify')"
      >
        <v-icon>mdi-format-align-justify</v-icon>
      </v-btn>
    </div>

    <div class="property-row mt-4">
      <v-btn
        :color="listType === 'bullet' ? 'primary' : undefined"
        icon
        size="small"
        @click="toggleBulletList"
        title="Bullet List"
      >
        <v-icon>mdi-format-list-bulleted</v-icon>
      </v-btn>

      <v-btn
        :color="listType === 'number' ? 'primary' : undefined"
        icon
        size="small"
        @click="toggleNumberedList"
        title="Numbered List"
      >
        <v-icon>mdi-format-list-numbered</v-icon>
      </v-btn>

      <v-btn icon size="small" @click="increaseIndent" title="Increase Indent">
        <v-icon>mdi-format-indent-increase</v-icon>
      </v-btn>

      <v-btn icon size="small" @click="decreaseIndent" title="Decrease Indent">
        <v-icon>mdi-format-indent-decrease</v-icon>
      </v-btn>
    </div>

    <div class="property-row mt-4">
      <v-btn
        icon
        size="small"
        @click="transformText('uppercase')"
        title="UPPERCASE"
      >
        <v-icon>mdi-format-letter-case-upper</v-icon>
      </v-btn>

      <v-btn
        icon
        size="small"
        @click="transformText('lowercase')"
        title="lowercase"
      >
        <v-icon>mdi-format-letter-case-lower</v-icon>
      </v-btn>

      <v-btn
        icon
        size="small"
        @click="transformText('capitalize')"
        title="Capitalize"
      >
        <v-icon>mdi-format-letter-case</v-icon>
      </v-btn>

      <v-btn
        icon
        size="small"
        @click="clearFormatting"
        title="Clear Formatting"
      >
        <v-icon>mdi-format-clear</v-icon>
      </v-btn>
    </div>

    <div class="first-line-indent mb-4 mt-4">
      <div class="d-flex align-center justify-space-between">
        <label class="text-body-2 text-medium-emphasis"
          >First Line Indent</label
        >
        <v-chip size="small" color="primary" class="ml-2"
          >{{ textIndent }}px</v-chip
        >
      </div>
      <v-slider
        v-model="textIndent"
        min="0"
        max="100"
        step="5"
        thumb-label
        density="compact"
        hide-details
        @update:model-value="updateTextIndent"
      ></v-slider>
    </div>

    <div class="line-spacing mb-4">
      <div class="d-flex align-center justify-space-between">
        <label class="text-body-2 text-medium-emphasis">Line Spacing</label>
        <v-chip size="small" color="primary" class="ml-2">{{
          lineSpacing
        }}</v-chip>
      </div>
      <v-slider
        v-model="lineSpacing"
        min="1"
        max="3"
        step="0.1"
        thumb-label
        density="compact"
        hide-details
        @update:model-value="updateLineSpacing"
      ></v-slider>
    </div>

    <div class="paragraph-indent mb-4">
      <div class="d-flex align-center justify-space-between">
        <label class="text-body-2 text-medium-emphasis">Paragraph Indent</label>
        <v-chip size="small" color="primary" class="ml-2"
          >{{ paragraphIndent }}px</v-chip
        >
      </div>
      <v-slider
        v-model="paragraphIndent"
        min="0"
        max="100"
        step="5"
        thumb-label
        density="compact"
        hide-details
        @update:model-value="updateParagraphIndent"
      ></v-slider>
    </div>

    <v-divider class="my-4"></v-divider>

    <div class="colors-section">
      <div class="property-group-subtitle mb-2">Colors</div>

      <div class="color-row mb-2">
        <!-- First Layer -->
        <div class="color-layer">
          <div class="color-input-group">
            <label class="color-label">Text Color</label>
            <div class="color-input-wrapper">
              <AdvancedColorPicker
                v-model="textColor"
                @update:model-value="updateTextColor"
              />
            </div>
          </div>
        </div>

        <!-- Second Layer -->
        <div class="color-layer">
          <div class="color-input-group">
            <label class="color-label">Background</label>
            <div class="color-input-wrapper">
              <AdvancedColorPicker
                v-model="backgroundColor"
                @update:model-value="updateBackgroundColor"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="property-row mb-2">
        <v-switch
          v-model="blockBackground"
          label="Block Background"
          density="compact"
          hide-details
          @change="toggleBlockBackground"
        ></v-switch>
      </div>

      <div v-if="blockBackground" class="color-row mb-2">
        <div class="color-input-group">
          <label class="color-label">Block Background Color</label>
          <div class="color-input-wrapper">
            <AdvancedColorPicker
              v-model="blockBackgroundColor"
              @update:model-value="updateBlockBackgroundColor"
            />
          </div>
        </div>
      </div>

      <div v-if="blockBackground" class="color-presets mb-2">
        <div class="property-group-subtitle mb-1">Block Background Presets</div>
        <div class="color-preset-grid">
          <div
            v-for="color in blockColorPresets"
            :key="color"
            class="color-preset"
            :style="{ backgroundColor: color }"
            @click="selectBlockBackgroundColor(color)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { DocumentElement } from "../../../types/document";
import {
  hasSavedSelection,
  applyBold,
  applyItalic,
  applyUnderline,
  applyFontFamily,
  applyFontSize,
  applyTextColor,
  applyBackgroundColor,
  applyTextAlignment,
  applyTextAndBackgroundColor,
  directlyApplyStyle,
} from "../../../utils/selectionManager";
import {
  FONT_FAMILIES,
  FontFamily,
  getFontFamilyValue as getFontFamilyValueUtil,
} from "../../../utils/fontFamilies";
import AdvancedColorPicker from "../AdvancedColorPicker.vue";

const props = defineProps<{
  element: DocumentElement;
}>();

const emit = defineEmits<{
  (e: "update:element", element: DocumentElement): void;
}>();

const textStyle = ref(props.element.style?.textStyle || "Paragraph");

// Get the initial font family object from the element or default to Roboto
const initialFontFamily = props.element.style?.fontFamily || "Roboto";
const fontFamilyObject =
  FONT_FAMILIES.find((f) => f.value === initialFontFamily) || FONT_FAMILIES[0];
const fontFamily = ref(fontFamilyObject);

const fontSize = ref(props.element.style?.fontSize || 16);
const bold = ref(props.element.style?.bold || false);
const italic = ref(props.element.style?.italic || false);
const underline = ref(props.element.style?.underline || false);
const textAlign = ref(props.element.style?.align || "left");
const textIndent = ref(props.element.style?.textIndent || 0);
const lineSpacing = ref(props.element.style?.lineHeight || 1.5);
const paragraphIndent = ref(props.element.style?.paragraphIndent || 0);
const listType = ref(props.element.style?.listType || "none");
const textColor = ref(props.element.style?.color || "#000000");
const backgroundColor = ref(
  props.element.style?.backgroundColor || "transparent"
);
const blockBackground = ref(props.element.style?.blockBackground || false);
const blockBackgroundColor = ref(
  props.element.style?.blockBackgroundColor || "#f5f5f5"
);

// Group font families by category for the dropdown
const fontFamilyItems = computed(() => {
  // Create a copy of the font families array to avoid modifying the original
  const fonts = [...FONT_FAMILIES];

  // Sort fonts by category and then by name
  fonts.sort((a, b) => {
    if (a.category !== b.category) {
      // Order categories: sans-serif, serif, monospace, display, handwriting
      const categoryOrder = {
        "sans-serif": 1,
        serif: 2,
        monospace: 3,
        display: 4,
        handwriting: 5,
      };
      return categoryOrder[a.category] - categoryOrder[b.category];
    }
    return a.name.localeCompare(b.name);
  });

  return fonts;
});

// Function to get the full font family value with fallbacks
function getFontFamilyValue(fontName: string): string {
  return getFontFamilyValueUtil(fontName);
}

// No longer needed with AdvancedColorPicker

const colorPresets = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#808080",
  "#C0C0C0",
];

const blockColorPresets = [
  "#f5f5f5",
  "#e0e0e0",
  "#f0f8ff",
  "#f0fff0",
  "#fff0f0",
  "#fffacd",
  "#e6e6fa",
  "#f0ffff",
  "#f5f5dc",
  "#faebd7",
];

watch(
  () => props.element,
  (newValue) => {
    textStyle.value = newValue.style?.textStyle || "Paragraph";

    // Update font family object when element changes
    const newFontFamilyValue = newValue.style?.fontFamily || "Roboto";
    const newFontFamilyObject =
      FONT_FAMILIES.find((f) => f.value === newFontFamilyValue) ||
      FONT_FAMILIES[0];
    fontFamily.value = newFontFamilyObject;

    fontSize.value = newValue.style?.fontSize || 16;
    bold.value = newValue.style?.bold || false;
    italic.value = newValue.style?.italic || false;
    underline.value = newValue.style?.underline || false;
    textAlign.value = newValue.style?.align || "left";
    textIndent.value = newValue.style?.textIndent || 0;
    lineSpacing.value = newValue.style?.lineHeight || 1.5;
    paragraphIndent.value = newValue.style?.paragraphIndent || 0;
    listType.value = newValue.style?.listType || "none";
    textColor.value = newValue.style?.color || "#000000";
    backgroundColor.value = newValue.style?.backgroundColor || "transparent";
    blockBackground.value = newValue.style?.blockBackground || false;
    blockBackgroundColor.value =
      newValue.style?.blockBackgroundColor || "#f5f5f5";
  },
  { deep: true }
);

function updateElement(updates: Partial<typeof props.element.style>) {
  emit("update:element", {
    ...props.element,
    style: {
      ...props.element.style,
      ...updates,
    },
  });
}

// Use the hasTextSelection prop to determine if text is selected

function updateTextStyle() {
  // Check if we're applying a heading style
  if (textStyle.value.startsWith("Heading ")) {
    // Extract the heading level (1-6)
    const headingLevel = parseInt(textStyle.value.split(" ")[1]);

    if (hasSavedSelection()) {
      // Apply heading to selected text
      directlyApplyStyle("heading", headingLevel.toString());
    } else {
      // Apply heading to the whole element
      // Set appropriate font size based on heading level
      let newFontSize = 16;
      let newBold = false;

      switch (headingLevel) {
        case 1:
          newFontSize = 32;
          newBold = true;
          break;
        case 2:
          newFontSize = 28;
          newBold = true;
          break;
        case 3:
          newFontSize = 24;
          newBold = true;
          break;
        case 4:
          newFontSize = 20;
          newBold = true;
          break;
        case 5:
          newFontSize = 18;
          newBold = true;
          break;
        case 6:
          newFontSize = 16;
          newBold = true;
          break;
      }

      // Update the font size and bold state
      fontSize.value = newFontSize;
      bold.value = newBold;

      // Apply the updates
      const updates = {
        textStyle: textStyle.value,
        fontSize: newFontSize,
        bold: newBold,
        italic: italic.value,
        underline: underline.value,
      };

      updateElement(updates);
    }
  } else {
    // Regular paragraph style
    const updates = {
      textStyle: textStyle.value,
      fontSize: fontSize.value,
      bold: bold.value,
      italic: italic.value,
      underline: underline.value,
    };
    updateElement(updates);
  }
}

function updateFontFamily() {
  if (!fontFamily.value) {
    return;
  }

  if (hasSavedSelection()) {
    // Apply to selection - pass the font family value
    applyFontFamily(fontFamily.value.value);
  } else {
    // Update the whole element - store just the font family value string
    updateElement({ fontFamily: fontFamily.value.value });
  }
}

function updateFontSize() {
  // Force a small delay to ensure any selection is properly saved
  setTimeout(() => {
    // Check if there's a text selection
    const hasSelection = hasSavedSelection();

    if (hasSelection) {
      // Make sure the font size has 'px' units
      const fontSizeWithUnits = fontSize.value.toString().includes("px")
        ? fontSize.value.toString()
        : `${fontSize.value}px`;

      // Apply font size to selected text only using our direct method
      directlyApplyStyle("fontSize", fontSizeWithUnits);

      // The content will be updated by the TextElement component's mutation observer
      // No need to manually update the element here
    } else {
      // Apply font size to the whole element
      updateElement({ fontSize: fontSize.value });
    }
  }, 0);
}

function toggleBoldStyle() {
  bold.value = !bold.value;
  if (hasSavedSelection()) {
    applyBold();
  } else {
    updateElement({ bold: bold.value });
  }
}

function toggleItalicStyle() {
  italic.value = !italic.value;
  if (hasSavedSelection()) {
    applyItalic();
  } else {
    updateElement({ italic: italic.value });
  }
}

function toggleUnderlineStyle() {
  underline.value = !underline.value;
  if (hasSavedSelection()) {
    applyUnderline();
  } else {
    updateElement({ underline: underline.value });
  }
}

function setTextAlign(align: string) {
  textAlign.value = align;
  if (hasSavedSelection()) {
    applyTextAlignment(align as "left" | "center" | "right" | "justify");
  } else {
    updateElement({ align });
  }
}

function updateTextIndent() {
  // Text indent only applies to the whole element, not to selected text
  updateElement({ textIndent: textIndent.value });
}

function updateLineSpacing() {
  // Line spacing only applies to the whole element, not to selected text
  updateElement({ lineHeight: lineSpacing.value });
}

function updateParagraphIndent() {
  // Paragraph indent only applies to the whole element, not to selected text
  updateElement({ paragraphIndent: paragraphIndent.value });
}

function toggleBulletList() {
  if (listType.value === "bullet") {
    // If already a bullet list, turn it off
    listType.value = "none";
    updateElement({ listType: "none" });
  } else {
    // Turn on bullet list
    listType.value = "bullet";
    updateElement({ listType: "bullet" });
  }
}

function toggleNumberedList() {
  if (listType.value === "number") {
    // If already a numbered list, turn it off
    listType.value = "none";
    updateElement({ listType: "none" });
  } else {
    // Turn on numbered list
    listType.value = "number";
    updateElement({ listType: "number" });
  }
}

function increaseIndent() {
  // Increase paragraph indent by 10px
  paragraphIndent.value += 10;
  updateElement({ paragraphIndent: paragraphIndent.value });
}

function decreaseIndent() {
  // Decrease paragraph indent by 10px, but not below 0
  paragraphIndent.value = Math.max(0, paragraphIndent.value - 10);
  updateElement({ paragraphIndent: paragraphIndent.value });
}

function transformText(
  transformType: "uppercase" | "lowercase" | "capitalize"
) {
  // Check if there's a text selection
  if (hasSavedSelection()) {
    // Apply the transformation to the selected text
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      let transformedText = selectedText;
      switch (transformType) {
        case "uppercase":
          transformedText = selectedText.toUpperCase();
          break;
        case "lowercase":
          transformedText = selectedText.toLowerCase();
          break;
        case "capitalize":
          transformedText = selectedText.replace(/\b\w/g, (char) =>
            char.toUpperCase()
          );
          break;
      }

      // Create a document fragment with the transformed text
      const fragment = document.createDocumentFragment();
      const textNode = document.createTextNode(transformedText);
      fragment.appendChild(textNode);

      // Replace the selected text with the transformed text
      range.deleteContents();
      range.insertNode(fragment);

      // Update the selection
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.addRange(newRange);

      // Apply the change to the element
      directlyApplyStyle("style", "");
    }
  } else {
    // If no selection, transform the entire text content
    if (!props.element.content) return;

    let transformedContent = props.element.content;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = transformedContent;

    // Get all text nodes
    const textNodes = [];
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null
    );

    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    // Transform each text node
    textNodes.forEach((node) => {
      if (!node.textContent) return;

      let transformedText = node.textContent;
      switch (transformType) {
        case "uppercase":
          transformedText = node.textContent.toUpperCase();
          break;
        case "lowercase":
          transformedText = node.textContent.toLowerCase();
          break;
        case "capitalize":
          transformedText = node.textContent.replace(/\b\w/g, (char) =>
            char.toUpperCase()
          );
          break;
      }

      node.textContent = transformedText;
    });

    // Update the element with the transformed content
    emit("update:element", {
      ...props.element,
      content: tempDiv.innerHTML,
    });
  }
}

function clearFormatting() {
  // Check if there's a text selection
  if (hasSavedSelection()) {
    // Apply the clear formatting to the selected text
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      // Extract the text content without formatting
      const selectedText = range.toString();

      // Create a document fragment with just the text
      const fragment = document.createDocumentFragment();
      const textNode = document.createTextNode(selectedText);
      fragment.appendChild(textNode);

      // Replace the selected formatted text with plain text
      range.deleteContents();
      range.insertNode(fragment);

      // Update the selection
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.addRange(newRange);

      // Apply the change to the element
      directlyApplyStyle("style", "");
    }
  } else {
    // If no selection, clear formatting for the entire element
    // Keep the text content but remove all formatting
    if (!props.element.content) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = props.element.content;

    // Get the text content without formatting
    const plainText = tempDiv.textContent || "";

    // Update the element with plain text and default styles
    emit("update:element", {
      ...props.element,
      content: plainText,
      style: {
        ...props.element.style,
        fontFamily: "Roboto",
        fontSize: 16,
        bold: false,
        italic: false,
        underline: false,
        textIndent: 0,
        paragraphIndent: 0,
        listType: "none",
        align: "left",
        color: "#000000",
        backgroundColor: "transparent",
        blockBackground: false,
      },
    });
  }
}

function updateTextColor() {
  // Force a small delay to ensure any selection is properly saved
  setTimeout(() => {
    // Check if there's a text selection
    const hasSelection = hasSavedSelection();

    if (hasSelection) {
      // Apply text color to selected text only using our direct method
      directlyApplyStyle("color", textColor.value);

      // The content will be updated by the TextElement component's mutation observer
      // No need to manually update the element here
    } else {
      // Apply text color to the whole element
      updateElement({ color: textColor.value });
    }
  }, 0);
}

function updateBackgroundColor() {
  // Force a small delay to ensure any selection is properly saved
  setTimeout(() => {
    // Check if there's a text selection
    const hasSelection = hasSavedSelection();

    if (hasSelection && !blockBackground.value) {
      // Apply background color to selected text only using our direct method
      directlyApplyStyle("backgroundColor", backgroundColor.value);

      // The content will be updated by the TextElement component's mutation observer
      // No need to manually update the element here
    } else {
      // Apply background color to the whole element
      updateElement({
        backgroundColor: backgroundColor.value,
        // If blockBackground is enabled, make sure it stays enabled
        blockBackground: blockBackground.value,
      });
    }
  }, 0);
}

function selectColor(color: string) {
  textColor.value = color;
  // Force a small delay to ensure any selection is properly saved
  setTimeout(() => {
    updateTextColor();
  }, 0);
}

function toggleBlockBackground() {
  // Update the element with the new blockBackground value
  const updates: Partial<typeof props.element.style> = {
    blockBackground: blockBackground.value,
  };

  // If block background is enabled, make sure to set the blockBackgroundColor
  if (blockBackground.value) {
    updates.blockBackgroundColor = blockBackgroundColor.value;
  }

  // Apply the updates
  updateElement(updates);
}

function updateBlockBackgroundColor() {
  // Make sure block background is enabled and update the element with the new blockBackgroundColor value
  updateElement({
    blockBackground: true,
    blockBackgroundColor: blockBackgroundColor.value,
  });
}

function selectBackgroundColor(color: string) {
  backgroundColor.value = color;
  // Force a small delay to ensure any selection is properly saved
  setTimeout(() => {
    updateBackgroundColor();
  }, 0);
}

function selectBlockBackgroundColor(color: string) {
  blockBackgroundColor.value = color;

  // Make sure block background is enabled and update the element with the new blockBackgroundColor value
  updateElement({
    blockBackground: true,
    blockBackgroundColor: color,
  });
}

function applyAllColors() {
  // Force a small delay to ensure any selection is properly saved
  setTimeout(() => {
    // Check if there's a text selection
    const hasSelection = hasSavedSelection();

    if (hasSelection) {
      // Apply colors to selected text
      applyColorsToSelection();
    } else {
      // Apply colors to the whole element
      applyColorsToElement();
    }
  }, 0);
}

function applyColorsToSelection() {
  // Apply text color to selection
  applyTextColor(textColor.value);

  // Apply text background color to selection
  applyBackgroundColor(backgroundColor.value);

  // If block background is enabled, update the element's block background
  if (blockBackground.value) {
    updateElement({
      blockBackground: true,
      blockBackgroundColor: blockBackgroundColor.value,
    });
  }
}

function applyColorsToElement() {
  // Apply all colors to the whole element
  const updates: Partial<typeof props.element.style> = {
    color: textColor.value,
    backgroundColor: backgroundColor.value,
  };

  if (blockBackground.value) {
    updates.blockBackground = true;
    updates.blockBackgroundColor = blockBackgroundColor.value;
  } else {
    updates.blockBackground = false;
  }

  updateElement(updates);
}
</script>

<style scoped lang="scss">
.property-row {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
}

.property-group-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.color-row {
  display: flex;
  flex-direction: column; /* Stack items vertically */
  gap: 8px; /* Add spacing between layers */
}

.color-layer {
  display: flex;
  flex-direction: column; /* Ensure each layer is vertical */
  align-items: flex-start; /* Align labels and inputs to the left */
}

.color-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.color-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* These classes are no longer needed with AdvancedColorPicker */

.color-presets {
  margin-top: 8px;
}

.color-preset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.color-preset {
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1px solid var(--border);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.apply-all-btn {
  width: 100%;
  margin-top: 4px;
}

.font-family-section {
  display: flex;
  flex-direction: column;
}

.font-preview {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background-color: var(--surface);
}

.font-preview-text {
  font-size: 14px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.font-preview-category {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  text-transform: capitalize;
}

.first-line-indent {
  margin-top: 16px;
}
</style>
