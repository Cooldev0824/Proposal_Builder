# Document Editor Server

This is the backend server for the Document Editor application. It provides APIs for saving, retrieving, and managing documents in JSON format.

## Features

- Save documents as JSON files
- Extract and save images separately, storing only the image paths in the document
- Assign unique IDs to documents
- Retrieve document metadata or full document content
- Delete documents

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Get all documents (metadata only)
```
GET /api/documents
```

### Get a specific document by ID
```
GET /api/documents/:id
```

### Create or update a document
```
POST /api/documents
```

### Delete a document
```
DELETE /api/documents/:id
```

## File Structure

- `documents/` - Directory where document JSON files are stored
- `public/images/` - Directory where extracted images are stored
