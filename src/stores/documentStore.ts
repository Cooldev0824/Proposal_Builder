import { defineStore } from "pinia";
import { ref } from "vue";
import { Document } from "../types/document";
import axios from "axios";

// API base URL - change this to match your server
const API_URL = "http://localhost:3000/api";

export const useDocumentStore = defineStore("documents", () => {
  const documents = ref<Document[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Load documents from the server
  async function loadDocuments() {
    isLoading.value = true;
    error.value = null;

    try {
      // Get documents from the server
      const response = await axios.get(`${API_URL}/documents`);
      documents.value = response.data;
      console.log("Loaded documents from server:", documents.value.length);
    } catch (err) {
      error.value = "Failed to load documents from server";
      console.error("Error loading documents:", err);

      // Initialize with empty array if server request fails
      documents.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Get a specific document by ID
  async function getDocument(id: string): Promise<Document | undefined> {
    isLoading.value = true;
    error.value = null;

    try {
      // Get document from the server
      const response = await axios.get(`${API_URL}/documents/${id}`);
      const document = response.data;
      console.log(`Retrieved document ${id} from server`);
      return document;
    } catch (err) {
      error.value = `Failed to get document ${id} from server`;
      console.error(`Error getting document ${id}:`, err);
      return undefined;
    } finally {
      isLoading.value = false;
    }
  }

  // Save a document (create or update)
  async function saveDocument(document: Document) {
    isLoading.value = true;
    error.value = null;

    try {
      // Save document to the server
      const response = await axios.post(`${API_URL}/documents`, document);
      const savedDocument = response.data;

      // Update local cache
      const index = documents.value.findIndex(
        (doc) => doc.id === savedDocument.id
      );
      if (index >= 0) {
        // Update existing document in cache
        documents.value[index] = savedDocument;
      } else {
        // Add new document to cache
        documents.value.push(savedDocument);
      }

      console.log(`Document saved to server: ${savedDocument.id}`);
      return savedDocument;
    } catch (err) {
      error.value = "Failed to save document to server";
      console.error("Error saving document:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Delete a document by ID
  async function deleteDocument(id: string) {
    isLoading.value = true;
    error.value = null;

    try {
      // Delete document from the server
      await axios.delete(`${API_URL}/documents/${id}`);

      // Update local cache
      documents.value = documents.value.filter((doc) => doc.id !== id);

      console.log(`Deleted document ${id} from server`);
      return true;
    } catch (err) {
      error.value = `Failed to delete document ${id} from server`;
      console.error(`Error deleting document ${id}:`, err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // Export all documents (for backup)
  async function exportDocuments(): Promise<string> {
    try {
      // Load all documents first to ensure we have the latest data
      await loadDocuments();
      return JSON.stringify(documents.value);
    } catch (err) {
      console.error("Error exporting documents:", err);
      error.value = "Failed to export documents";
      return "";
    }
  }

  // Import documents from JSON string (for restore)
  async function importDocuments(jsonData: string): Promise<boolean> {
    try {
      const importedDocs = JSON.parse(jsonData) as Document[];

      // Save each document to the server
      for (const doc of importedDocs) {
        await saveDocument(doc);
      }

      console.log(`Imported ${importedDocs.length} documents to server`);
      return true;
    } catch (err) {
      console.error("Error importing documents:", err);
      error.value = "Failed to import documents";
      return false;
    }
  }

  // Clear all documents from storage
  async function clearDocuments(): Promise<boolean> {
    try {
      // Delete each document from the server
      for (const doc of documents.value) {
        await deleteDocument(doc.id);
      }

      // Clear local cache
      documents.value = [];

      console.log("Cleared all documents from server");
      return true;
    } catch (err) {
      console.error("Error clearing documents:", err);
      error.value = "Failed to clear documents";
      return false;
    }
  }

  return {
    documents,
    isLoading,
    error,
    loadDocuments,
    getDocument,
    saveDocument,
    deleteDocument,
    exportDocuments,
    importDocuments,
    clearDocuments,
  };
});
