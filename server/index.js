const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 3000;

// Create documents directory if it doesn't exist
const DOCUMENTS_DIR = path.join(__dirname, "documents");
if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Helper function to process images in document
function processDocumentImages(document) {
  if (document.sections) {
    document.sections.forEach((section) => {
      if (section.elements) {
        section.elements.forEach((element) => {
          // For image elements, only store the path/URL, not the full image data
          if (element.type === "image" && element.content) {
            // If the content is a data URL, save it as a file and replace with the path
            if (element.content.startsWith("data:image")) {
              const imageId = uuidv4();
              const imageExt = element.content.split(";")[0].split("/")[1];
              const imagePath = `/images/${imageId}.${imageExt}`;

              // Save the image to disk
              const imageData = element.content.split(",")[1];
              const imageBuffer = Buffer.from(imageData, "base64");

              // Create images directory if it doesn't exist
              const imagesDir = path.join(__dirname, "public", "images");
              if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
              }

              fs.writeFileSync(
                path.join(__dirname, "public", imagePath),
                imageBuffer
              );

              // Replace the data URL with the file path
              element.content = imagePath;
            }
          }
        });
      }
    });
  }
  return document;
}

// Routes
// Get all documents (metadata only)
app.get("/api/documents", (req, res) => {
  try {
    const files = fs.readdirSync(DOCUMENTS_DIR);
    const documents = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const content = fs.readFileSync(path.join(DOCUMENTS_DIR, file), "utf8");
        const document = JSON.parse(content);
        // Return only metadata, not the full document
        return {
          id: document.id,
          title: document.title,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        };
      });

    res.json(documents);
  } catch (error) {
    console.error("Error getting documents:", error);
    res.status(500).json({ error: "Failed to get documents" });
  }
});

// Get a specific document by ID
app.get("/api/documents/:id", (req, res) => {
  try {
    const filePath = path.join(DOCUMENTS_DIR, `${req.params.id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    const content = fs.readFileSync(filePath, "utf8");
    const document = JSON.parse(content);

    res.json(document);
  } catch (error) {
    console.error(`Error getting document ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to get document" });
  }
});

// Create or update a document
app.post("/api/documents", (req, res) => {
  try {
    let document = req.body;

    // Ensure document has an ID
    if (!document.id || document.id.startsWith("new-doc-")) {
      document.id = uuidv4();
    }

    // Set timestamps
    document.updatedAt = new Date().toISOString();
    if (!document.createdAt) {
      document.createdAt = document.updatedAt;
    }

    // Process images in the document
    document = processDocumentImages(document);

    // Save document as JSON file
    const filePath = path.join(DOCUMENTS_DIR, `${document.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(document, null, 2));

    res.json(document);
  } catch (error) {
    console.error("Error saving document:", error);
    res.status(500).json({ error: "Failed to save document" });
  }
});

// Helper function to find and delete associated images
function deleteAssociatedImages(documentId) {
  try {
    const filePath = path.join(DOCUMENTS_DIR, `${documentId}.json`);

    if (!fs.existsSync(filePath)) {
      return { deletedCount: 0, errors: ["Document not found"] };
    }

    // Read the document content
    const content = fs.readFileSync(filePath, "utf8");
    const document = JSON.parse(content);

    // Find all image paths in the document
    const imagePaths = [];
    const errors = [];

    if (document.sections) {
      document.sections.forEach((section) => {
        if (section.elements) {
          section.elements.forEach((element) => {
            if (
              element.type === "image" &&
              element.content &&
              element.content.startsWith("/images/")
            ) {
              imagePaths.push(element.content);
            }
          });
        }
      });
    }

    // Delete each image file
    let deletedCount = 0;
    const imagesDir = path.join(__dirname, "public");

    imagePaths.forEach((imagePath) => {
      const fullPath = path.join(imagesDir, imagePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          deletedCount++;
          console.log(`Deleted associated image: ${imagePath}`);
        } catch (err) {
          errors.push(`Failed to delete image ${imagePath}: ${err.message}`);
          console.error(`Error deleting image ${imagePath}:`, err);
        }
      }
    });

    console.log(
      `Deleted ${deletedCount} images associated with document ${documentId}`
    );
    return { deletedCount, errors: errors.length > 0 ? errors : null };
  } catch (error) {
    console.error(
      `Error deleting associated images for document ${documentId}:`,
      error
    );
    return {
      deletedCount: 0,
      errors: [`Failed to process document: ${error.message}`],
    };
  }
}

// Delete a document
app.delete("/api/documents/:id", (req, res) => {
  try {
    const documentId = req.params.id;
    const filePath = path.join(DOCUMENTS_DIR, `${documentId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete associated images first
    const { deletedCount, errors } = deleteAssociatedImages(documentId);

    // Delete the document file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: "Document deleted successfully",
      imagesDeleted: deletedCount,
      imageErrors: errors,
    });
  } catch (error) {
    console.error(`Error deleting document ${req.params.id}:`, error);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Get document image info (for debugging and management)
app.get("/api/documents/:id/images", (req, res) => {
  try {
    const documentId = req.params.id;
    const filePath = path.join(DOCUMENTS_DIR, `${documentId}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Read the document content
    const content = fs.readFileSync(filePath, "utf8");
    const document = JSON.parse(content);

    // Find all image paths in the document
    const images = [];

    if (document.sections) {
      document.sections.forEach((section) => {
        if (section.elements) {
          section.elements.forEach((element) => {
            if (element.type === "image" && element.content) {
              const imagePath = element.content;
              let fileExists = false;
              let fileSize = 0;

              // Check if the image file exists and get its size
              if (imagePath.startsWith("/images/")) {
                const fullPath = path.join(__dirname, "public", imagePath);
                fileExists = fs.existsSync(fullPath);
                if (fileExists) {
                  const stats = fs.statSync(fullPath);
                  fileSize = stats.size;
                }
              }

              images.push({
                path: imagePath,
                exists: fileExists,
                size: fileSize,
                elementId: element.id,
              });
            }
          });
        }
      });
    }

    res.json({
      documentId,
      title: document.title,
      imageCount: images.length,
      images,
    });
  } catch (error) {
    console.error(
      `Error getting image info for document ${req.params.id}:`,
      error
    );
    res.status(500).json({ error: "Failed to get document image info" });
  }
});

// Delete all orphaned images (images not referenced by any document)
app.delete("/api/cleanup/images", (_, res) => {
  try {
    // Get all documents
    const files = fs.readdirSync(DOCUMENTS_DIR);
    const documents = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const content = fs.readFileSync(path.join(DOCUMENTS_DIR, file), "utf8");
        return JSON.parse(content);
      });

    // Collect all image paths referenced in documents
    const referencedImages = new Set();
    documents.forEach((doc) => {
      if (doc.sections) {
        doc.sections.forEach((section) => {
          if (section.elements) {
            section.elements.forEach((element) => {
              if (
                element.type === "image" &&
                element.content &&
                element.content.startsWith("/images/")
              ) {
                referencedImages.add(element.content);
              }
            });
          }
        });
      }
    });

    // Get all image files in the images directory
    const imagesDir = path.join(__dirname, "public", "images");
    if (!fs.existsSync(imagesDir)) {
      return res.json({
        message: "No images directory found",
        deletedCount: 0,
      });
    }

    const imageFiles = fs.readdirSync(imagesDir);
    const orphanedImages = [];

    // Find orphaned images
    imageFiles.forEach((file) => {
      const imagePath = `/images/${file}`;
      if (!referencedImages.has(imagePath)) {
        orphanedImages.push(imagePath);
      }
    });

    // Delete orphaned images
    let deletedCount = 0;
    const errors = [];

    orphanedImages.forEach((imagePath) => {
      const fullPath = path.join(__dirname, "public", imagePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          deletedCount++;
          console.log(`Deleted orphaned image: ${imagePath}`);
        } catch (err) {
          errors.push(`Failed to delete image ${imagePath}: ${err.message}`);
          console.error(`Error deleting image ${imagePath}:`, err);
        }
      }
    });

    res.json({
      success: true,
      message: `Deleted ${deletedCount} orphaned images`,
      deletedCount,
      orphanedImages,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error("Error cleaning up orphaned images:", error);
    res.status(500).json({ error: "Failed to clean up orphaned images" });
  }
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
