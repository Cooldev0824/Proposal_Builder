<template>
  <div
    class="grid-overlay"
    :style="gridStyle"
    :class="{ 'show-grid': visible }"
    :data-grid-visible="visible.toString()"
  >
    <!-- Horizontal ruler -->
    <div class="ruler horizontal-ruler">
      <div class="ruler-numbers">
        <div
          v-for="i in Math.ceil(width / (gridSize * 10))"
          :key="`h-${i}`"
          class="ruler-number"
          :style="{ left: `${i * gridSize * 10}px` }"
        >
          {{ i * 10 }}
        </div>
      </div>
      <div class="ruler-ticks">
        <div
          v-for="i in Math.ceil(width / gridSize)"
          :key="`ht-${i}`"
          class="ruler-tick"
          :class="{ 'major-tick': i % 10 === 0 }"
          :style="{ left: `${i * gridSize}px` }"
        ></div>
      </div>
    </div>

    <!-- Vertical ruler -->
    <div class="ruler vertical-ruler">
      <div class="ruler-numbers">
        <div
          v-for="i in Math.ceil(height / (gridSize * 10))"
          :key="`v-${i}`"
          class="ruler-number"
          :style="{ top: `${i * gridSize * 10}px` }"
        >
          {{ i * 10 }}
        </div>
      </div>
      <div class="ruler-ticks">
        <div
          v-for="i in Math.ceil(height / gridSize)"
          :key="`vt-${i}`"
          class="ruler-tick"
          :class="{ 'major-tick': i % 10 === 0 }"
          :style="{ top: `${i * gridSize}px` }"
        ></div>
      </div>
    </div>

    <!-- Grid corner -->
    <div class="grid-corner">
      <v-icon
        icon="mdi-grid"
        size="small"
        class="grid-toggle-icon"
        @click="$emit('toggle-grid')"
      ></v-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

const props = defineProps<{
  visible: boolean;
  width: number;
  height: number;
  gridSize: number;
}>();

defineEmits<{
  (e: "toggle-grid"): void;
}>();

// Log when visibility changes
watch(() => props.visible, (newValue) => {
  console.log("Grid overlay visibility changed:", newValue);
}, { immediate: true });

const gridStyle = computed(() => {
  console.log("Computing grid style, visible:", props.visible);
  return {
    // Width and height are now handled by CSS with !important
    // to ensure they include the rulers
    backgroundSize: `${props.gridSize}px ${props.gridSize}px`,
    backgroundImage: props.visible ?
      `linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
       linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
       linear-gradient(to right, rgba(0, 0, 0, 0.1) ${props.gridSize * 10}px, transparent ${props.gridSize * 10}px),
       linear-gradient(to bottom, rgba(0, 0, 0, 0.1) ${props.gridSize * 10}px, transparent ${props.gridSize * 10}px)`
      : "none",
  };
});
</script>

<style scoped lang="scss">
.grid-overlay {
  position: absolute;
  top: -30px; /* Move up to place rulers outside the page */
  left: -30px; /* Move left to place rulers outside the page */
  pointer-events: none;
  z-index: 0;
  background-color: transparent;
  width: calc(100% + 30px) !important; /* Extend width to include ruler */
  height: calc(100% + 30px) !important; /* Extend height to include ruler */
}

/* Grid lines - only visible when show-grid class is present */
.grid-overlay.show-grid::before {
  content: '';
  position: absolute;
  top: 30px; /* Start at the top of the actual page content */
  left: 30px; /* Start at the left of the actual page content */
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.15) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.15) 1px, transparent 1px);
  background-size: 10px 10px;
  pointer-events: none;
  z-index: 1;
}

/* Major grid lines - only visible when show-grid class is present */
.grid-overlay.show-grid::after {
  content: '';
  position: absolute;
  top: 30px; /* Start at the top of the actual page content */
  left: 30px; /* Start at the left of the actual page content */
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(to right, rgba(0, 0, 0, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 1px, transparent 1px);
  background-size: 100px 100px;
  pointer-events: none;
  z-index: 2;
}

.ruler {
  position: absolute;
  background-color: #f5f5f5;
  z-index: 100;
  pointer-events: all;
}

.horizontal-ruler {
  top: 0;
  left: 30px; /* Width of vertical ruler */
  height: 30px;
  width: calc(100% - 30px);
  border-bottom: 1px solid #ccc;
}

.vertical-ruler {
  top: 30px; /* Height of horizontal ruler */
  left: 0;
  width: 30px;
  height: calc(100% - 30px);
  border-right: 1px solid #ccc;
}

.grid-corner {
  position: absolute;
  top: 0;
  left: 0;
  width: 30px;
  height: 30px;
  background-color: #f5f5f5;
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 101;
  pointer-events: all;
  cursor: pointer;

  &:hover {
    background-color: #e0e0e0;
  }
}

.grid-toggle-icon {
  color: #666;
}

.ruler-numbers {
  position: relative;
  width: 100%;
  height: 100%;
}

.ruler-number {
  position: absolute;
  font-size: 10px;
  color: #666;
  transform: translateX(-50%);

  .vertical-ruler & {
    transform: translateY(-50%);
    left: 50%;
  }
}

.ruler-ticks {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.ruler-tick {
  position: absolute;
  background-color: #999;

  .horizontal-ruler & {
    width: 1px;
    height: 5px;
    bottom: 0;
  }

  .vertical-ruler & {
    height: 1px;
    width: 5px;
    right: 0;
  }

  &.major-tick {
    .horizontal-ruler & {
      height: 10px;
    }

    .vertical-ruler & {
      width: 10px;
    }
  }
}
</style>
