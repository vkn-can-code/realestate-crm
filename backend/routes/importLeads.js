import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import db, { newUuid } from "../data/db.js";
import { triggerBulkAutoOutreach } from "../services/outreachService.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/** Flexible Phone Normalization & Validation Helper */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/[^0-9]/g, "");
  
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  return null;
}

/** Flexible Column Header Extractor */
function extractRowFields(row) {
  const keys = Object.keys(row);
  const findVal = (regex) => {
    const key = keys.find((k) => regex.test(k.trim()));
    return key ? row[key] : null;
  };

  const name = findVal(/^(name|client_name|full_name|customer_name|lead_name)$/i) || findVal(/name/i) || "Valued Lead";
  const phone = findVal(/^(phone|mobile|contact|phone_number|mobile_number|contact_number|tel)$/i) || findVal(/phone|mobile|contact/i);
  const email = findVal(/^(email|email_address|mail)$/i) || findVal(/email/i);
  const propertyInterest = findVal(/^(property_interest|requirement|interest|property|preference|budget)$/i) || findVal(/interest|requirement/i);
  const source = findVal(/^(source|lead_source|channel)$/i) || findVal(/source/i) || "excel_import";

  return { name: String(name).trim(), rawPhone: phone, email: email ? String(email).trim() : null, propertyInterest: propertyInterest ? String(propertyInterest).trim() : null, source: String(source).trim() };
}

/** POST /api/leads/import-process/import — Bulk Upload & Review Queue Creation */
router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No Excel or CSV file uploaded." });
  }

  const filename = req.file.originalname || "leads_import.xlsx";
  const uploadedBy = req.body.uploadedBy || req.body.userName || "Admin Manager";

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: "The uploaded file contains no data rows." });
    }

    const batchId = `BATCH-${newUuid().slice(0, 8)}`;
    let rowCount = 0;
    let newLeadsCount = 0;
    let duplicateCount = 0;
    let flaggedForReviewCount = 0;
    let errorCount = 0;
    const errors = [];
    const createdLeadIds = [];
    const reviewQueueIds = [];

    // Prepared DB statements
    const checkPhoneStmt = db.prepare("SELECT * FROM leads WHERE phone = ?");
    const insertLeadStmt = db.prepare(`
      INSERT INTO leads (id, name, phone, email, property_interest, source, status, kanban_stage, dnd, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'new', 'new', 0, CURRENT_TIMESTAMP)
    `);
    const insertReviewStmt = db.prepare(`
      INSERT INTO review_queue (id, lead_id, import_batch_id, new_row_data, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `);
    const insertBatchStmt = db.prepare(`
      INSERT INTO import_batches (id, filename, uploaded_by, row_count, new_leads_count, duplicate_count, flagged_for_review_count, error_count, created_at)
      VALUES (?, ?, ?, 0, 0, 0, 0, 0, CURRENT_TIMESTAMP)
    `);
    const updateBatchStmt = db.prepare(`
      UPDATE import_batches 
      SET row_count = ?, new_leads_count = ?, duplicate_count = ?, flagged_for_review_count = ?, error_count = ?
      WHERE id = ?
    `);

    // Transaction for atomic batch import
    const importTransaction = db.transaction(() => {
      // 1. Insert parent batch record first so foreign keys succeed
      insertBatchStmt.run(batchId, filename, uploadedBy);

      for (let i = 0; i < rawRows.length; i++) {
        rowCount++;
        const row = rawRows[i];
        const rowNum = i + 2;
        const { name, rawPhone, email, propertyInterest, source } = extractRowFields(row);

        const cleanPhone = normalizePhone(rawPhone);

        // Validation Rule: Phone number missing or malformed
        if (!cleanPhone) {
          errorCount++;
          errors.push({
            rowNumber: rowNum,
            name,
            phone: rawPhone || "Missing",
            reason: "Invalid or missing phone number (must be a valid 10-digit phone number)",
          });
          continue;
        }

        // Deduplication Check ➔ PHASE 2 CHANGE: Insert into review_queue for human review!
        const existing = checkPhoneStmt.get(cleanPhone);
        if (existing) {
          duplicateCount++;
          flaggedForReviewCount++;

          const reviewId = `REV-${newUuid().slice(0, 8)}`;
          const newRowData = JSON.stringify({
            name,
            phone: cleanPhone,
            email,
            propertyInterest,
            source,
            rowNumber: rowNum,
          });

          insertReviewStmt.run(reviewId, existing.id, batchId, newRowData);
          reviewQueueIds.push(reviewId);
          continue; // Do NOT touch lead stage or trigger auto-outreach!
        }

        // Create New Lead
        const leadId = `LEAD-${newUuid().slice(0, 8)}`;
        insertLeadStmt.run(leadId, name, cleanPhone, email, propertyInterest, source);
        newLeadsCount++;
        createdLeadIds.push(leadId);
      }

      // Update Import Batch Summary Counts
      updateBatchStmt.run(rowCount, newLeadsCount, duplicateCount, flaggedForReviewCount, errorCount, batchId);
    });

    importTransaction();

    console.log(`[Excel Import] Batch ${batchId} completed: ${rowCount} rows, ${newLeadsCount} new, ${duplicateCount} duplicates (${flaggedForReviewCount} flagged for review), ${errorCount} errors.`);

    // Trigger Idempotent Background Outreach ONLY for newly created leads
    if (createdLeadIds.length > 0) {
      triggerBulkAutoOutreach(createdLeadIds).catch((e) => console.error("[Auto-Outreach Queue Error]", e));
    }

    res.json({
      ok: true,
      batchId,
      filename,
      uploadedBy,
      summary: {
        rowCount,
        newLeadsCount,
        duplicateCount,
        flaggedForReviewCount,
        errorCount,
      },
      errors,
      createdLeadIds,
      reviewQueueIds,
    });
  } catch (err) {
    console.error("[Excel Import Error]", err);
    res.status(500).json({ error: `Failed to process import file: ${err.message}` });
  }
});

/** GET /api/leads/import-process/batches — Retrieves Past Import History */
router.get("/batches", (req, res) => {
  try {
    const batches = db.prepare("SELECT * FROM import_batches ORDER BY created_at DESC").all();
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
