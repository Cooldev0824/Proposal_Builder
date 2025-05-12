import axios from "axios";
import type { Document } from "../types/document";

// API base URL - change this to match your server
const API_URL = "http://localhost:3000/api";

/**
 * Document Service
 * Handles all API interactions for documents
 */
export const documentService = {
  /**
   * Get all documents (metadata only)
   * @returns Promise with array of document metadata
   */
  async getAllDocuments(): Promise<Document[]> {
    try {
      const response = await axios.get(`${API_URL}/documents`);
      return response.data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  /**
   * Get a document by ID
   * @param id Document ID
   * @returns Promise with the document
   */
  async getDocumentById(id: string): Promise<Document> {
    try {
      const response = await axios.get(`${API_URL}/documents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching document ${id}:`, error);
      throw error;
    }
  },

  /**
   * Save a document
   * @param document Document to save
   * @returns Promise with the saved document
   */
  async saveDocument(document: Document): Promise<Document> {
    try {
      const response = await axios.post(`${API_URL}/documents`, document);
      return response.data;
    } catch (error) {
      console.error("Error saving document:", error);
      throw error;
    }
  },

  /**
   * Delete a document
   * @param id Document ID
   * @returns Promise with success status
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API_URL}/documents/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new document with default values
   * @param title Document title
   * @returns New document object
   */
  createNewDocument(title: string = "Untitled Document"): Document {
    return {
      id: `new-doc-${Date.now()}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paperSize: "Letter",
      orientation: "portrait",
      sections: [
        {
          id: "cover",
          title: "Cover",
          elements: [],
        },
      ],
    };
  },

  /**
   * Clean up orphaned images
   * @returns Promise with cleanup results
   */
  async cleanupOrphanedImages(): Promise<any> {
    try {
      const response = await axios.delete(`${API_URL}/cleanup/images`);
      return response.data;
    } catch (error) {
      console.error("Error cleaning up orphaned images:", error);
      throw error;
    }
  },
};

export default documentService;
