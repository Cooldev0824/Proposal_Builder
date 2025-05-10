<template>
  <div class="document-editor">
    <EditorToolbar
      :activeTools="activeTools"
      @tool-clicked="handleToolClick"
      @save="saveDocument"
    />

    <div class="editor-container">
      <SidebarNavigation
        :sections="document.sections"
        :currentSection="currentSection"
        @section-selected="selectSection"
        @section-added="addSection"
        @section-updated="updateSection"
      />

      <div class="main-editor" ref="editorContainer">
        <div class="editor-content" :style="editorContentStyle">
          <template v-if="showGrid">
            <GridLayout ref="gridLayout" />
          </template>
          <template v-else>
            <DocumentPage
              v-for="(section, index) in document.sections"
              :key="section.id"
              :section="section"
              :isActive="currentSection === index"
              @element-selected="selectElement"
              @element-updated="updateElement"
            />
          </template>
        </div>
      </div>

      <PropertiesPanel
        v-if="selectedElement"
        :selectedElement="selectedElement"
        @update:element="updateElement"
        @delete-element="deleteElement"
        @duplicate-element="duplicateElement"
        @close="$emit('element-selected', null)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import EditorToolbar from "./EditorToolbar.vue";
import SidebarNavigation from "./SidebarNavigation.vue";
import DocumentPage from "./DocumentPage.vue";
import PropertiesPanel from "./PropertiesPanel.vue";
import GridLayout from "./GridLayout.vue";
import { Document, DocumentElement } from "../../types/document";

// Define props and emits
const props = defineProps<{
  document: Document;
  currentSection: number;
  selectedElement: DocumentElement | null;
  activeTools: string[];
  showGrid: boolean;
  zoom: number;
}>();

const emit = defineEmits<{
  (e: "tool-clicked", tool: string, value?: any): void;
  (e: "save"): void;
  (e: "section-selected", index: number): void;
  (e: "section-added", section: any): void;
  (e: "section-updated", index: number, section: any): void;
  (e: "element-selected", element: DocumentElement | null): void;
  (e: "element-updated", element: DocumentElement): void;
  (e: "element-deleted", element: DocumentElement): void;
  (e: "element-duplicated", element: DocumentElement): void;
}>();

// Computed style for the editor content
const editorContentStyle = computed(() => ({
  transform: `scale(${props.zoom})`,
  transformOrigin: "0 0",
}));

// Event handlers
function handleToolClick(tool: string, value?: any) {
  emit("tool-clicked", tool, value);
}

function saveDocument() {
  emit("save");
}

function selectSection(index: number) {
  emit("section-selected", index);
}

function addSection(section: any) {
  emit("section-added", section);
}

function updateSection(index: number, section: any) {
  emit("section-updated", index, section);
}

function selectElement(element: DocumentElement | null) {
  emit("element-selected", element);
}

function updateElement(element: DocumentElement) {
  emit("element-updated", element);
}

function deleteElement(element: DocumentElement) {
  emit("element-deleted", element);
}

function duplicateElement(element: DocumentElement) {
  emit("element-duplicated", element);
}
</script>

<style scoped lang="scss">
// ... existing styles remain unchanged ...
</style>
