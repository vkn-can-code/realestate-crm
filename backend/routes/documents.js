import { Router } from "express";
import db from "../data/db.js";

const router = Router();

// GET /api/documents/lead/:leadId -> Fetch all documents and extractions for a lead
router.get("/lead/:leadId", (req, res) => {
  const { leadId } = req.params;

  try {
    const documents = db.prepare(`
      SELECT 
        d.id,
        d.filename AS name,
        d.category,
        d.file_type AS type,
        d.created_at AS receivedDate,
        d.source_channel AS channel,
        d.approval_status AS status,
        e.confidence_score AS confidence,
        e.extracted_json,
        e.ai_summary
      FROM documents d
      LEFT JOIN document_extractions e ON d.id = e.document_id
      WHERE d.lead_id = ?
      ORDER BY d.created_at DESC
    `).all(leadId);

    // Parse the extracted JSON for the frontend
    const formattedDocs = documents.map(doc => {
      let extractedData = {};
      if (doc.extracted_json) {
        try {
          extractedData = JSON.parse(doc.extracted_json);
        } catch (err) {
          console.warn(`[Documents API] Failed to parse extracted_json for document ${doc.id}`);
        }
      }
      if (doc.ai_summary) {
        extractedData.aiSummary = doc.ai_summary;
      }

      // Format date
      let formattedDate = doc.receivedDate;
      if (doc.receivedDate) {
        const dateObj = new Date(doc.receivedDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      }

      return {
        id: doc.id,
        name: doc.name,
        category: doc.category || "GENERAL",
        type: doc.type,
        receivedDate: formattedDate,
        channel: doc.channel,
        status: doc.status,
        confidence: doc.confidence ? `${(doc.confidence * 100).toFixed(0)}%` : null,
        extractedData
      };
    });

    res.json(formattedDocs);
  } catch (err) {
    console.error("[Documents API Error]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
