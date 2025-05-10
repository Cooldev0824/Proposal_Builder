<template>
  <div class="dashboard">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card class="mb-6">
            <v-card-text>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <h1 class="text-h4 mb-4">Your Documents</h1>
                  <p class="text-subtitle-1">
                    Create or edit your proposals and documents
                  </p>
                </div>
                <v-btn
                  icon
                  color="primary"
                  @click="refreshDocuments"
                  :loading="isLoading"
                  :disabled="isLoading"
                  title="Refresh documents"
                >
                  <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" sm="6" md="4" lg="3">
          <v-card
            @click="createNewDocument"
            class="new-document-card"
            height="200"
            hover
          >
            <v-card-text
              class="d-flex flex-column align-center justify-center h-100"
            >
              <v-icon size="48" color="primary">mdi-plus</v-icon>
              <span class="text-h6 mt-2">New Document</span>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col
          v-for="doc in recentDocuments"
          :key="doc.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            @click="openDocument(doc.id)"
            height="200"
            hover
            class="document-card"
          >
            <v-card-text class="pa-0 position-relative h-100">
              <div class="document-preview">
                <img :src="doc.thumbnail" alt="Document preview" />
              </div>
              <div class="document-overlay pa-4">
                <h3 class="text-h6">{{ doc.title }}</h3>
                <p class="text-caption">Last edited: {{ doc.lastEdited }}</p>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn
                icon
                size="small"
                color="primary"
                @click.stop="openDocument(doc.id)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn icon size="small" @click.stop="duplicateDocument(doc.id)">
                <v-icon>mdi-content-duplicate</v-icon>
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                icon
                size="small"
                color="error"
                @click.stop="confirmDelete(doc.id)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Document</v-card-title>
        <v-card-text>
          Are you sure you want to delete this document? This action cannot be
          undone.
          <div v-if="documentToDelete" class="mt-2">
            <strong>Document:</strong> {{ getDocumentTitle(documentToDelete) }}
          </div>
          <div v-if="isDeleting" class="mt-4">
            <v-progress-linear
              indeterminate
              color="primary"
            ></v-progress-linear>
            <div class="text-center mt-2">
              Deleting document and associated resources...
            </div>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text @click="deleteDialog = false" :disabled="isDeleting"
            >Cancel</v-btn
          >
          <v-btn
            color="error"
            @click="deleteDocument"
            :loading="isDeleting"
            :disabled="isDeleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDocumentStore } from "../stores/documentStore";

interface DocumentDisplay {
  id: string;
  title: string;
  lastEdited: string;
  thumbnail: string;
}

const router = useRouter();
const documentStore = useDocumentStore();
const recentDocuments = ref<DocumentDisplay[]>([]);
const isLoading = ref(true);
const isDeleting = ref(false);
const deleteDialog = ref(false);
const documentToDelete = ref<string | null>(null);

// Snackbar for notifications
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

// Function to load and transform documents
async function loadAndTransformDocuments() {
  isLoading.value = true;

  try {
    await documentStore.loadDocuments();

    // Transform documents for display
    recentDocuments.value = documentStore.documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      lastEdited: formatDate(doc.updatedAt),
      thumbnail: getDocumentThumbnail(doc),
    }));
  } catch (error) {
    console.error("Error loading documents:", error);

    // Show error notification
    snackbar.value = {
      show: true,
      text: "Failed to load documents. Please refresh the page.",
      color: "error",
    };
  } finally {
    isLoading.value = false;
  }
}

// Function to get document title by ID
function getDocumentTitle(id: string): string {
  const doc = recentDocuments.value.find((doc) => doc.id === id);
  return doc ? doc.title : "Unknown Document";
}

// Function to refresh documents
async function refreshDocuments() {
  try {
    await loadAndTransformDocuments();

    // Show success notification
    snackbar.value = {
      show: true,
      text: "Documents refreshed successfully",
      color: "success",
    };
  } catch (error) {
    console.error("Error refreshing documents:", error);
  }
}

// Load documents when component mounts
onMounted(loadAndTransformDocuments);

// Format date for display
function formatDate(dateString: string | undefined): string {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if date is today
  if (date.toDateString() === now.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Check if date is yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  // Otherwise return formatted date
  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Get a thumbnail for the document (placeholder for now)
function getDocumentThumbnail(doc: any): string {
  // In a real app, you might generate thumbnails from the document content
  // For now, use placeholder images
  const placeholders = [
    "https://images.pexels.com/photos/3760514/pexels-photo-3760514.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
  ];

  // Check if the document has a thumbnail image in its sections
  if (doc.sections && doc.sections.length > 0) {
    for (const section of doc.sections) {
      if (section.elements && section.elements.length > 0) {
        // Look for the first image element to use as thumbnail
        const imageElement = section.elements.find(
          (el: any) => el.type === "image" && el.content
        );
        if (imageElement && imageElement.content) {
          // If the image path is from our server, prepend the API URL
          if (imageElement.content.startsWith("/images/")) {
            return `http://localhost:3000${imageElement.content}`;
          }
          return imageElement.content;
        }
      }
    }
  }

  // If no image found, use a placeholder based on document ID
  const index = parseInt(doc.id.replace(/\D/g, "")) % placeholders.length;
  return placeholders[index] || placeholders[0];
}

function createNewDocument() {
  router.push("/editor");
}

function openDocument(id: string) {
  router.push(`/editor/${id}`);
}

function duplicateDocument(id: string) {
  // Clone document logic would go here
  console.log("Duplicate document:", id);
}

function confirmDelete(id: string) {
  documentToDelete.value = id;
  deleteDialog.value = true;
}

async function deleteDocument() {
  if (!documentToDelete.value) {
    return;
  }

  isDeleting.value = true;

  try {
    // Get the document title for the notification
    const docTitle = getDocumentTitle(documentToDelete.value);

    // Delete the document
    await documentStore.deleteDocument(documentToDelete.value);

    // Reload documents to ensure the list is up-to-date
    await loadAndTransformDocuments();

    // Show success notification
    snackbar.value = {
      show: true,
      text: `"${docTitle}" has been deleted successfully.`,
      color: "success",
    };

    // Close the dialog
    deleteDialog.value = false;
    documentToDelete.value = null;

    // Navigate to the dashboard (first page)
    // Since we're already on the dashboard, we'll just ensure we're at the root path
    if (router.currentRoute.value.path !== "/") {
      router.push("/");
    }
  } catch (error) {
    console.error("Error deleting document:", error);

    // Show error notification
    snackbar.value = {
      show: true,
      text: "Failed to delete document. Please try again.",
      color: "error",
    };
  } finally {
    isDeleting.value = false;
  }
}
</script>

<style scoped lang="scss">
.dashboard {
  padding: 24px;
  background-color: var(--surface);
  min-height: 100vh;
}

.new-document-card {
  border: 2px dashed var(--border);
  background-color: rgba(12, 132, 254, 0.03);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    background-color: rgba(12, 132, 254, 0.08);
    transform: translateY(-4px);
  }
}

.document-card {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-4px);
  }

  .document-preview {
    height: 140px;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .document-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.7) 0%,
      rgba(0, 0, 0, 0.2) 70%,
      rgba(0, 0, 0, 0) 100%
    );
    color: white;
  }
}
</style>
