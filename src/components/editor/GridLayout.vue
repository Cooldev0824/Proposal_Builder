<script setup lang="ts">
// 1. Imports
import { ref, onMounted, onUnmounted, watch } from "vue";
import { GridStack } from "gridstack";
import "gridstack/dist/gridstack.min.css";
import DOMPurify from "dompurify";

// Import styles
import "../../assets/styles/components/gridLayout.scss";

// Type definitions
interface GridItem {
  x: number
  y: number
  w: number
  h: number
  title: string
  content: string
}

// 2. Functions
function updateItemsPositions(gridItems: unknown[]): void {
  gridItems.forEach((gridItem: any) => {
    const index = parseInt(gridItem.el.getAttribute("gs-id"), 10);
    if (!isNaN(index) && items.value[index]) {
      items.value[index] = {
        ...items.value[index],
        x: gridItem.x,
        y: gridItem.y,
        w: gridItem.w,
        h: gridItem.h,
      };
    }
  });
}

function addItem() {
  editingIndex.value = null;
  editingItem.value = {
    title: "",
    content: "",
  };
  showAddDialog.value = true;
}

function editItem(index: number) {
  editingIndex.value = index;
  editingItem.value = { ...items.value[index] };
  showAddDialog.value = true;
}

function saveItem() {
  if (!grid) return;

  const newItem: GridItem = {
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    title: editingItem.value.title || "Untitled Block",
    content: editingItem.value.content || "",
  };

  if (editingIndex.value !== null) {
    // Update existing item
    items.value[editingIndex.value] = {
      ...items.value[editingIndex.value],
      ...newItem,
    };
    grid.update(grid.getGridItems()[editingIndex.value], newItem);
  } else {
    // Add new item
    items.value.push(newItem);
    grid.addWidget(newItem);
  }

  showAddDialog.value = false;
  editingIndex.value = null;
  editingItem.value = {
    title: "",
    content: "",
  };
}

function removeItem(index: number) {
  if (grid) {
    const gridItems = grid.getGridItems();
    if (gridItems[index]) {
      grid.removeWidget(gridItems[index]);
      items.value.splice(index, 1);
    }
  }
}

// Function to check if content is HTML
function isHtmlContent(content: string): boolean {
  // Simple check for HTML tags
  return /<[a-z][\s\S]*>/i.test(content);
}

// Function to safely render HTML content
function renderSafeHtml(content: string, element: HTMLElement): void {
  if (!element) return;

  // Sanitize HTML content using DOMPurify
  const sanitizedHtml = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ["p", "br", "b", "i", "em", "strong", "a", "ul", "ol", "li", "span", "div", "h1", "h2", "h3", "h4", "h5", "h6"],
    ALLOWED_ATTR: ["href", "target", "class", "style"],
  });

  // Set the sanitized HTML
  element.innerHTML = sanitizedHtml;
}

// 3. Hooks and Reactive State
const gridContainer = ref<HTMLElement | null>(null);
const contentContainers = ref<HTMLElement[]>([]);
const items = ref<GridItem[]>([]);
let grid: GridStack | null = null;

const showAddDialog = ref(false);
const editingIndex = ref<number | null>(null);
const editingItem = ref<Partial<GridItem>>({
  title: "",
  content: "",
});

// Watch for changes in items to update HTML content
watch(items, () => {
  // Use nextTick to ensure DOM is updated
  setTimeout(() => {
    const htmlContainers = document.querySelectorAll(".html-content");
    htmlContainers.forEach((container, index) => {
      if (items.value[index] && isHtmlContent(items.value[index].content)) {
        renderSafeHtml(items.value[index].content, container as HTMLElement);
      }
    });
  }, 0);
}, { deep: true });

onMounted(() => {
  if (gridContainer.value) {
    grid = GridStack.init({
      column: 12,
      cellHeight: 60,
      animate: true,
      float: true,
      resizable: {
        handles: "all",
      },
      draggable: {
        handle: ".item-header",
      },
    }, gridContainer.value.querySelector(".grid-stack") as HTMLElement);

    grid.on("change", (_event: unknown, changedItems: unknown[]) => {
      updateItemsPositions(changedItems);
    });

    // Initial render of HTML content
    setTimeout(() => {
      const htmlContainers = document.querySelectorAll(".html-content");
      htmlContainers.forEach((container, index) => {
        if (items.value[index] && isHtmlContent(items.value[index].content)) {
          renderSafeHtml(items.value[index].content, container as HTMLElement);
        }
      });
    }, 0);
  }
});

onUnmounted(() => {
  if (grid) {
    grid.destroy();
  }
});

// Expose public methods
defineExpose({
  addItem,
  removeItem,
  grid,
});
</script>

<template>
  <div ref="gridContainer" class="grid-layout">
    <div class="grid-stack">
      <div v-for="(item, index) in items"
           :key="index"
           class="grid-stack-item"
           :gs-x="item.x"
           :gs-y="item.y"
           :gs-w="item.w"
           :gs-h="item.h"
      >
        <div class="grid-stack-item-content">
          <div class="item-header">
            <span class="item-title">{{ item.title }}</span>
            <div class="item-actions">
              <v-btn icon size="small" @click="editItem(index)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon
                     size="small"
                     color="error"
                     @click="removeItem(index)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </div>
          </div>
          <div class="item-content">
            <!-- Use v-if/v-else to conditionally render HTML content safely -->
            <div v-if="isHtmlContent(item.content)" ref="contentContainer" class="html-content"></div>
            <div v-else>{{ item.content }}</div>
          </div>
        </div>
      </div>
    </div>

    <v-btn
      color="primary"
      class="add-block-btn"
      @click="showAddDialog = true"
    >
      <v-icon left>mdi-plus</v-icon>
      Add Block
    </v-btn>

    <!-- Add/Edit Block Dialog -->
    <v-dialog v-model="showAddDialog" max-width="600">
      <v-card>
        <v-card-title>{{ editingIndex === null ? 'Add Block' : 'Edit Block' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="editingItem.title"
            label="Block Title"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          ></v-text-field>

          <v-textarea
            v-model="editingItem.content"
            label="Block Content"
            variant="outlined"
            density="comfortable"
            rows="5"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="showAddDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveItem">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

