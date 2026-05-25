import { documentHandler, type StoredDocument } from "./document-handler";

export function registerDocumentRoutes(app: any) {
  // Upload documents
  app.post("/api/loan-applications/:id/upload-documents", async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const files = req.files as any;

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const uploadedDocs: StoredDocument[] = [];
      const applicationId = parseInt(id);

      // Handle multiple file uploads
      for (const fieldName in files) {
        const file = files[fieldName];
        const fileArray = Array.isArray(file) ? file : [file];

        for (const f of fileArray) {
          // Accept PDFs and images
          if (!["application/pdf", "image/jpeg", "image/png"].includes(f.mimetype)) {
            continue;
          }

          // Store file directly (no conversion)
          const storedDoc = documentHandler.storeDocument(
            f.data,
            f.name,
            f.mimetype,
            applicationId
          );

          uploadedDocs.push(storedDoc);
        }
      }

      // Find application and attach document metadata
      const application = applications.find((a: any) => a.id === applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      if (!application.documents) {
        application.documents = [];
      }

      // Store metadata only (not full file)
      application.documents.push(
        ...uploadedDocs.map((doc) => ({
          id: doc.id,
          filename: doc.filename,
          mimeType: doc.mimeType,
          size: doc.size,
          uploadedAt: doc.uploadedAt,
        }))
      );

      application.fileUploaded = true;

      res.json({
        success: true,
        message: `${uploadedDocs.length} documents uploaded`,
        documents: uploadedDocs.map((d) => ({
          id: d.id,
          filename: d.filename,
          size: d.size,
        })),
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Download document
  app.get("/api/loan-applications/:id/documents/:docId", async (req: any, res: any) => {
    try {
      const { id, docId } = req.params;
      const application = applications.find((a: any) => a.id === parseInt(id));

      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const docMeta = application.documents?.find((d: any) => d.id === docId);
      if (!docMeta) {
        return res.status(404).json({ error: "Document not found" });
      }

      const fileBuffer = documentHandler.getFileBuffer(docId, docMeta.filename);
      if (!fileBuffer) {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader("Content-Type", docMeta.mimeType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${docMeta.filename}"`
      );
      res.send(fileBuffer);
    } catch (error) {
      console.error("Document download error:", error);
      res.status(500).json({ error: "Download failed" });
    }
  });
}
