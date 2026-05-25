import fs from "fs";
import path from "path";

export interface StoredDocument {
  id: string;
  applicationId: number;
  filename: string;
  mimeType: string;
  filePath: string;
  uploadedAt: Date;
  size: number;
}

export class DocumentHandler {
  private uploadDir = path.join(process.cwd(), "uploads");

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Store uploaded file as-is (no conversion)
   */
  storeDocument(
    fileBuffer: Buffer,
    filename: string,
    mimeType: string,
    applicationId: number
  ): StoredDocument {
    const documentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const filepath = path.join(this.uploadDir, `${documentId}-${filename}`);

    // Save file directly without conversion
    fs.writeFileSync(filepath, fileBuffer);

    const document: StoredDocument = {
      id: documentId,
      applicationId,
      filename,
      mimeType,
      filePath: filepath,
      uploadedAt: new Date(),
      size: fileBuffer.length,
    };

    return document;
  }

  /**
   * Get file as buffer (raw PDF)
   */
  getFileBuffer(documentId: string, filename: string): Buffer | null {
    try {
      const filepath = path.join(this.uploadDir, `${documentId}-${filename}`);
      if (fs.existsSync(filepath)) {
        return fs.readFileSync(filepath);
      }
    } catch (error) {
      console.error(`Error reading file ${documentId}:`, error);
    }
    return null;
  }

  /**
   * Get file path (for passing to APIs)
   */
  getFilePath(documentId: string, filename: string): string | null {
    const filepath = path.join(this.uploadDir, `${documentId}-${filename}`);
    if (fs.existsSync(filepath)) {
      return filepath;
    }
    return null;
  }

  /**
   * Get all documents for an application
   */
  getApplicationDocuments(applicationId: number): StoredDocument[] {
    // Return from application object instead
    return [];
  }

  /**
   * Delete document
   */
  deleteDocument(documentId: string, filename: string): boolean {
    try {
      const filepath = path.join(this.uploadDir, `${documentId}-${filename}`);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
      }
    } catch (error) {
      console.error(`Error deleting document ${documentId}:`, error);
    }
    return false;
  }
}

export const documentHandler = new DocumentHandler();
