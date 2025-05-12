<template>
  <div class="advanced-color-picker">
    <div class="color-preview-container">
      <div
        class="color-preview"
        :style="previewStyle"
        @click="showPicker = !showPicker"
      ></div>
      <div class="color-value" @click="showPicker = !showPicker">
        {{ displayValue }}
      </div>
    </div>

    <v-menu
      v-model="showPicker"
      :close-on-content-click="false"
      location="bottom"
      offset="5"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon
          size="small"
          v-bind="props"
          class="color-menu-button"
        >
          <v-icon>mdi-palette</v-icon>
        </v-btn>
      </template>

      <div class="color-picker-panel">
        <div class="panel-header">
          <div class="current-color-preview" :style="previewStyle"></div>
          <div class="color-value-display">{{ displayValue }}</div>
        </div>

        <!-- Color saturation/value picker -->
        <div ref="saturationValuePicker" class="saturation-value-picker" @mousedown="startPickingSaturationValue">
          <div
            class="saturation-value-background"
            :style="{ backgroundColor: `hsl(${hue}, 100%, 50%)` }"
          ></div>
          <div class="white-gradient"></div>
          <div class="black-gradient"></div>
          <div
            class="saturation-value-cursor"
            :style="{
              left: `${saturation}%`,
              top: `${100 - value}%`,
              borderColor: value > 50 ? 'black' : 'white'
            }"
          ></div>
        </div>

        <!-- Hue slider -->
        <div ref="hueSlider" class="hue-slider-container" @mousedown="startPickingHue">
          <div class="hue-slider"></div>
          <div
            class="hue-slider-cursor"
            :style="{ left: `${hue / 360 * 100}%` }"
          ></div>
        </div>

        <!-- Alpha slider -->
        <div ref="alphaSlider" class="alpha-slider-container" @mousedown="startPickingAlpha">
          <div class="alpha-slider-background">
            <div class="alpha-gradient"
                 :style="{
                   backgroundImage: `linear-gradient(to right, transparent, ${rgbColor})`
                 }"
            ></div>
          </div>
          <div
            class="alpha-slider-cursor"
            :style="{ left: `${alpha * 100}%` }"
          ></div>
        </div>

        <!-- RGBA inputs -->
        <div class="color-inputs">
          <div class="input-group">
            <label>R</label>
            <v-text-field
              v-model.number="red"
              type="number"
              min="0"
              max="255"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="updateFromRgb"
            ></v-text-field>
          </div>
          <div class="input-group">
            <label>G</label>
            <v-text-field
              v-model.number="green"
              type="number"
              min="0"
              max="255"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="updateFromRgb"
            ></v-text-field>
          </div>
          <div class="input-group">
            <label>B</label>
            <v-text-field
              v-model.number="blue"
              type="number"
              min="0"
              max="255"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="updateFromRgb"
            ></v-text-field>
          </div>
          <div class="input-group">
            <label>A</label>
            <v-text-field
              v-model.number="alphaPercent"
              type="number"
              min="0"
              max="100"
              density="compact"
              variant="outlined"
              hide-details
              @update:model-value="updateAlphaFromPercent"
            ></v-text-field>
          </div>
        </div>

        <!-- Hex input -->
        <div class="hex-input">
          <label>Hex</label>
          <v-text-field
            v-model="hexValue"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="#RRGGBB"
            @update:model-value="updateFromHex"
          ></v-text-field>
        </div>

        <!-- Color presets -->
        <div class="color-presets">
          <div
            v-for="(preset, index) in colorPresets"
            :key="index"
            class="color-preset"
            :style="{ backgroundColor: preset }"
            @click="selectPreset(preset)"
          ></div>
        </div>

        <!-- Transparent preset -->
        <div class="transparent-preset" @click="selectTransparent">
          <div class="transparent-indicator"></div>
          <span>Transparent</span>
        </div>

        <!-- Buttons -->
        <div class="action-buttons">
          <v-btn text @click="showPicker = false">Cancel</v-btn>
          <v-btn color="primary" @click="applyColor">Apply</v-btn>
        </div>
      </div>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

// UI state
const showPicker = ref(false);

// Color state
const hue = ref(0);
const saturation = ref(100);
const value = ref(100);
const alpha = ref(1);
const red = ref(255);
const green = ref(0);
const blue = ref(0);
const hexValue = ref("#FF0000");
const alphaPercent = ref(100);

// DOM refs
const saturationValuePicker = ref<HTMLElement | null>(null);
const hueSlider = ref<HTMLElement | null>(null);
const alphaSlider = ref<HTMLElement | null>(null);

// Mouse tracking for sliders
let isPickingSaturationValue = false;
let isPickingHue = false;
let isPickingAlpha = false;

// Color presets
const colorPresets = [
  "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF",
  "#FFFF00", "#FF00FF", "#00FFFF", "#808080", "#C0C0C0",
  "#FFA500", "#800080", "#008000", "#800000", "#000080",
  "#FFC0CB", "#A52A2A", "#FFD700", "#ADD8E6", "#90EE90",
];

// Computed values
const rgbColor = computed(() => {
  return `rgb(${red.value}, ${green.value}, ${blue.value})`;
});

const rgbaColor = computed(() => {
  return `rgba(${red.value}, ${green.value}, ${blue.value}, ${alpha.value})`;
});

const displayValue = computed(() => {
  if (alpha.value < 1) {
    return rgbaColor.value;
  } else {
    return hexValue.value.toUpperCase();
  }
});

const previewStyle = computed(() => {
  return {
    backgroundColor: rgbaColor.value,
    backgroundImage: alpha.value < 1 ?
      "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)" :
      "none",
    backgroundSize: "10px 10px",
    backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
  };
});

// Initialize from props
watch(() => props.modelValue, (newValue) => {
  parseColor(newValue);
}, { immediate: true });

// Parse color from string
function parseColor(colorStr: string) {
  if (!colorStr || colorStr === "transparent") {
    // Handle transparent
    red.value = 0;
    green.value = 0;
    blue.value = 0;
    alpha.value = 0;
    alphaPercent.value = 0;
    updateHsvFromRgb();
    updateHexFromRgb();
    return;
  }

  if (colorStr.startsWith("#")) {
    // Handle hex
    hexValue.value = colorStr;
    updateRgbFromHex();
    updateHsvFromRgb();
    alpha.value = 1;
    alphaPercent.value = 100;
    return;
  }

  if (colorStr.startsWith("rgb")) {
    // Handle rgb/rgba
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
    if (match) {
      red.value = parseInt(match[1], 10);
      green.value = parseInt(match[2], 10);
      blue.value = parseInt(match[3], 10);
      alpha.value = match[4] ? parseFloat(match[4]) : 1;
      alphaPercent.value = Math.round(alpha.value * 100);
      updateHsvFromRgb();
      updateHexFromRgb();
    }
    return;
  }
}

// Update functions
function updateHsvFromRgb() {
  const r = red.value / 255;
  const g = green.value / 255;
  const b = blue.value / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  // Calculate value
  value.value = max * 100;

  // Calculate saturation
  saturation.value = max === 0 ? 0 : (delta / max) * 100;

  // Calculate hue
  if (delta === 0) {
    hue.value = 0;
  } else if (max === r) {
    hue.value = 60 * (((g - b) / delta) % 6);
  } else if (max === g) {
    hue.value = 60 * ((b - r) / delta + 2);
  } else {
    hue.value = 60 * ((r - g) / delta + 4);
  }

  if (hue.value < 0) {
    hue.value += 360;
  }
}

function updateRgbFromHsv() {
  const h = hue.value;
  const s = saturation.value / 100;
  const v = value.value / 100;

  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  red.value = Math.round((r + m) * 255);
  green.value = Math.round((g + m) * 255);
  blue.value = Math.round((b + m) * 255);

  updateHexFromRgb();
}

function updateHexFromRgb() {
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  hexValue.value = `#${toHex(red.value)}${toHex(green.value)}${toHex(blue.value)}`;
}

function updateRgbFromHex() {
  const hex = hexValue.value.replace("#", "");

  if (hex.length === 3) {
    // Handle shorthand hex (#RGB)
    red.value = parseInt(hex[0] + hex[0], 16);
    green.value = parseInt(hex[1] + hex[1], 16);
    blue.value = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6) {
    // Handle full hex (#RRGGBB)
    red.value = parseInt(hex.substring(0, 2), 16);
    green.value = parseInt(hex.substring(2, 4), 16);
    blue.value = parseInt(hex.substring(4, 6), 16);
  }
}

function updateFromRgb() {
  // Clamp RGB values
  red.value = Math.max(0, Math.min(255, red.value));
  green.value = Math.max(0, Math.min(255, green.value));
  blue.value = Math.max(0, Math.min(255, blue.value));

  updateHsvFromRgb();
  updateHexFromRgb();
  emitColorChange();
}

function updateFromHex() {
  // Validate hex format
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hexValue.value)) {
    updateRgbFromHex();
    updateHsvFromRgb();
    emitColorChange();
  }
}

function updateAlphaFromPercent() {
  // Clamp alpha percent
  alphaPercent.value = Math.max(0, Math.min(100, alphaPercent.value));
  alpha.value = alphaPercent.value / 100;
  emitColorChange();
}

// Mouse event handlers
function startPickingSaturationValue(event: MouseEvent) {
  isPickingSaturationValue = true;
  document.addEventListener("mousemove", pickSaturationValue);
  document.addEventListener("mouseup", stopPickingSaturationValue);
  pickSaturationValue(event);
}

function pickSaturationValue(event: MouseEvent) {
  if (!isPickingSaturationValue || !saturationValuePicker.value) return;

  const rect = saturationValuePicker.value.getBoundingClientRect();
  let s = ((event.clientX - rect.left) / rect.width) * 100;
  let v = 100 - ((event.clientY - rect.top) / rect.height) * 100;

  // Clamp values
  s = Math.max(0, Math.min(100, s));
  v = Math.max(0, Math.min(100, v));

  saturation.value = s;
  value.value = v;

  updateRgbFromHsv();
  emitColorChange();
}

function stopPickingSaturationValue() {
  isPickingSaturationValue = false;
  document.removeEventListener("mousemove", pickSaturationValue);
  document.removeEventListener("mouseup", stopPickingSaturationValue);
}

function startPickingHue(event: MouseEvent) {
  isPickingHue = true;
  document.addEventListener("mousemove", pickHue);
  document.addEventListener("mouseup", stopPickingHue);
  pickHue(event);
}

function pickHue(event: MouseEvent) {
  if (!isPickingHue || !hueSlider.value) return;

  const rect = hueSlider.value.getBoundingClientRect();
  let h = ((event.clientX - rect.left) / rect.width) * 360;

  // Clamp value
  h = Math.max(0, Math.min(360, h));

  hue.value = h;

  updateRgbFromHsv();
  emitColorChange();
}

function stopPickingHue() {
  isPickingHue = false;
  document.removeEventListener("mousemove", pickHue);
  document.removeEventListener("mouseup", stopPickingHue);
}

function startPickingAlpha(event: MouseEvent) {
  isPickingAlpha = true;
  document.addEventListener("mousemove", pickAlpha);
  document.addEventListener("mouseup", stopPickingAlpha);
  pickAlpha(event);
}

function pickAlpha(event: MouseEvent) {
  if (!isPickingAlpha || !alphaSlider.value) return;

  const rect = alphaSlider.value.getBoundingClientRect();
  let a = (event.clientX - rect.left) / rect.width;

  // Clamp value
  a = Math.max(0, Math.min(1, a));

  alpha.value = a;
  alphaPercent.value = Math.round(a * 100);

  emitColorChange();
}

function stopPickingAlpha() {
  isPickingAlpha = false;
  document.removeEventListener("mousemove", pickAlpha);
  document.removeEventListener("mouseup", stopPickingAlpha);
}

// Preset selection
function selectPreset(color: string) {
  hexValue.value = color;
  updateRgbFromHex();
  updateHsvFromRgb();
  alpha.value = 1;
  alphaPercent.value = 100;
  emitColorChange();
}

function selectTransparent() {
  red.value = 0;
  green.value = 0;
  blue.value = 0;
  alpha.value = 0;
  alphaPercent.value = 0;
  updateHsvFromRgb();
  updateHexFromRgb();
  emitColorChange();
}

// Apply color
function applyColor() {
  emitColorChange();
  showPicker.value = false;
}

// Emit color change
function emitColorChange() {
  if (alpha.value < 1) {
    emit("update:modelValue", rgbaColor.value);
  } else {
    emit("update:modelValue", hexValue.value);
  }
}

// Clean up event listeners
onBeforeUnmount(() => {
  document.removeEventListener("mousemove", pickSaturationValue);
  document.removeEventListener("mouseup", stopPickingSaturationValue);
  document.removeEventListener("mousemove", pickHue);
  document.removeEventListener("mouseup", stopPickingHue);
  document.removeEventListener("mousemove", pickAlpha);
  document.removeEventListener("mouseup", stopPickingAlpha);
});
</script>

<style scoped lang="scss">
.advanced-color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-preview-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid var(--border, #ccc);
}

.color-value {
  font-size: 12px;
  color: var(--text-secondary, #666);
}

.color-menu-button {
  margin-left: 4px;
}

.color-picker-panel {
  width: 280px;
  padding: 16px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.current-color-preview {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--border, #ccc);
}

.color-value-display {
  font-size: 14px;
  font-family: monospace;
}

.saturation-value-picker {
  position: relative;
  width: 100%;
  height: 150px;
  border-radius: 4px;
  margin-bottom: 16px;
  cursor: crosshair;
}

.saturation-value-background,
.white-gradient,
.black-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 4px;
}

.white-gradient {
  background: linear-gradient(to right, white, rgba(255, 255, 255, 0));
}

.black-gradient {
  background: linear-gradient(to bottom, transparent, black);
}

.saturation-value-cursor {
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hue-slider-container,
.alpha-slider-container {
  position: relative;
  width: 100%;
  height: 16px;
  margin-bottom: 16px;
  cursor: pointer;
}

.hue-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000
  );
}

.alpha-slider-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 4px;
  background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                    linear-gradient(-45deg, #ccc 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #ccc 75%),
                    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
}

.alpha-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 4px;
}

.hue-slider-cursor,
.alpha-slider-cursor {
  position: absolute;
  width: 16px;
  height: 16px;
  background-color: white;
  border: 2px solid #333;
  border-radius: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.color-inputs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;

  label {
    font-size: 12px;
    margin-bottom: 4px;
    color: var(--text-secondary, #666);
  }
}

.hex-input {
  margin-bottom: 16px;

  label {
    font-size: 12px;
    margin-bottom: 4px;
    color: var(--text-secondary, #666);
  }
}

.color-presets {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.color-preset {
  aspect-ratio: 1;
  border-radius: 4px;
  border: 1px solid var(--border, #ccc);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
}

.transparent-preset {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border, #ccc);
  cursor: pointer;
  margin-bottom: 16px;

  .transparent-indicator {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
                      linear-gradient(-45deg, #ccc 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #ccc 75%),
                      linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0px;
  }

  span {
    font-size: 14px;
  }
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
