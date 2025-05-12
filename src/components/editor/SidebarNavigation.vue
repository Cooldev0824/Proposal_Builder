<template>
  <div class="sidebar" :class="{ collapsed: isCollapsed }">
    <div class="sidebar-header">
      <h3 v-if="!isCollapsed" class="sidebar-title">Document Sections</h3>
      <v-btn icon size="small" @click="toggleSidebar">
        <v-icon>{{ isCollapsed ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
      </v-btn>
    </div>
    
    <div class="sidebar-content">
      <transition-group name="list">
        <div 
          v-for="(section, index) in sections" 
          :key="section.id"
          class="section-item"
          :class="{ active: currentSection === index }"
          @click="selectSection(index)"
        >
          <div class="section-icon">
            <v-icon size="small">mdi-file-document-outline</v-icon>
          </div>
          <div v-if="!isCollapsed" class="section-details">
            <div class="section-title">{{ section.title }}</div>
            <div class="section-meta">{{ getSectionElementsCount(section) }} elements</div>
          </div>
          <div v-if="!isCollapsed" class="section-actions">
            <v-btn icon size="x-small" @click.stop="editSection(index)">
              <v-icon size="small">mdi-pencil</v-icon>
            </v-btn>
            <v-btn icon
                   size="x-small"
                   color="error"
                   @click.stop="confirmDeleteSection(index)"
            >
              <v-icon size="small">mdi-delete</v-icon>
            </v-btn>
          </div>
        </div>
      </transition-group>
      
      <div v-if="!isCollapsed" class="add-section">
        <v-btn block @click="addSection">
          <v-icon left>mdi-plus</v-icon>
          Add Section
        </v-btn>
      </div>
      <div v-else class="add-section-icon">
        <v-btn icon size="small" @click="addSection">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
  
  <v-dialog v-model="sectionDialog" max-width="500">
    <v-card>
      <v-card-title>{{ editingSection === null ? 'Add New Section' : 'Edit Section' }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="sectionTitle"
          label="Section Title"
          variant="outlined"
          density="comfortable"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="sectionDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="saveSection">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteDialog" max-width="400">
    <v-card>
      <v-card-title>Delete Section</v-card-title>
      <v-card-text>
        Are you sure you want to delete this section? This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="deleteDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="deleteSection">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { Section } from "../../types/document";

const props = defineProps<{
  sections: Section[]
  currentSection: number
}>();

const emit = defineEmits<{
  (e: "section-selected", index: number): void
  (e: "section-added", section: Section): void
  (e: "section-updated", index: number, section: Section): void
  (e: "section-deleted", index: number): void
}>();

const isCollapsed = ref(false);
const sectionDialog = ref(false);
const deleteDialog = ref(false);
const sectionTitle = ref("");
const editingSection = ref<number | null>(null);
const sectionToDelete = ref<number | null>(null);

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value;
}

function selectSection(index: number) {
  emit("section-selected", index);
}

function getSectionElementsCount(section: Section): number {
  return section.elements?.length || 0;
}

function addSection() {
  editingSection.value = null;
  sectionTitle.value = "New Section";
  sectionDialog.value = true;
}

function editSection(index: number) {
  editingSection.value = index;
  sectionTitle.value = props.sections[index].title;
  sectionDialog.value = true;
}

function confirmDeleteSection(index: number) {
  sectionToDelete.value = index;
  deleteDialog.value = true;
}

function deleteSection() {
  if (sectionToDelete.value !== null) {
    emit("section-deleted", sectionToDelete.value);
    deleteDialog.value = false;
    sectionToDelete.value = null;
  }
}

function saveSection() {
  if (editingSection.value !== null) {
    // Update existing section
    const updatedSection = {
      ...props.sections[editingSection.value],
      title: sectionTitle.value,
    };
    emit("section-updated", editingSection.value, updatedSection);
  } else {
    // Create new section
    const newSection: Section = {
      id: "section-" + Date.now(),
      title: sectionTitle.value,
      elements: [],
    };
    emit("section-added", newSection);
  }
  
  sectionDialog.value = false;
  sectionTitle.value = "";
  editingSection.value = null;
}
</script>

<style scoped lang="scss">
.sidebar {
  background-color: var(--background);
  border-right: 1px solid var(--border);
  width: 250px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, padding 0.3s ease;
  overflow: hidden;
  
  &.collapsed {
    width: 60px;
  }
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.section-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  
  &:hover {
    background-color: rgba(12, 132, 254, 0.05);
  }
  
  &.active {
    background-color: rgba(12, 132, 254, 0.1);
    border-left: 3px solid var(--primary);
  }
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.section-details {
  flex: 1;
  min-width: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.section-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.section-actions {
  opacity: 0;
  transition: opacity 0.15s ease;
  display: flex;
  gap: 4px;
  
  .section-item:hover & {
    opacity: 1;
  }
}

.add-section {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

.add-section-icon {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  margin-top: 8px;
}

// Animation
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-active {
  position: absolute;
}
</style>