import { Router } from "express";
import db from "../data/db.js";
import { claimAndPerformOutreach } from "../services/outreachService.js";

const router = Router();

/** GET /api/review-centre/count — Badge counter for pending review items */
router.get("/count", (req, res) => {
  try {
    const result = db.prepare("SELECT COUNT(*) as pendingCount FROM review_queue WHERE status = 'pending'").get();
    res.json({ pendingCount: result?.pendingCount || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/review-centre — List all pending review queue entries */
router.get("/", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM review_queue WHERE status = 'pending' ORDER BY created_at DESC").all();
    
    const enriched = rows.map((item) => {
      const existingLead = db.prepare("SELECT * FROM leads WHERE id = ?").get(item.lead_id);
      const outreachLogs = db.prepare("SELECT * FROM outreach_log WHERE lead_id = ? ORDER BY created_at ASC").all(item.lead_id);
      let parsedNewRow = {};
      try {
        parsedNewRow = JSON.parse(item.new_row_data);
      } catch (e) {
        parsedNewRow = { raw: item.new_row_data };
      }

      return {
        id: item.id,
        lead_id: item.lead_id,
        import_batch_id: item.import_batch_id,
        status: item.status,
        created_at: item.created_at,
        existingLead,
        newRowData: parsedNewRow,
        outreachLogs,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/review-centre/:id/skip — Skip re-imported lead */
router.post("/:id/skip", (req, res) => {
  const { id } = req.params;
  const resolvedBy = req.body.resolvedBy || req.body.userName || "Admin Manager";

  try {
    db.prepare(`
      UPDATE review_queue 
      SET status = 'skipped', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(resolvedBy, id);

    console.log(`[Review Centre] Review #${id} marked as SKIPPED by ${resolvedBy}`);
    res.json({ ok: true, status: "skipped", id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/review-centre/:id/reengage — Re-engage lead manually (type='re_engagement') */
router.post("/:id/reengage", async (req, res) => {
  const { id } = req.params;
  const resolvedBy = req.body.resolvedBy || req.body.userName || "Admin Manager";

  try {
    const reviewItem = db.prepare("SELECT * FROM review_queue WHERE id = ?").get(id);
    if (!reviewItem) return res.status(404).json({ error: "Review item not found" });

    // Mark review item as reengaged
    db.prepare(`
      UPDATE review_queue 
      SET status = 'reengaged', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(resolvedBy, id);

    // Trigger fresh manual WhatsApp & Call via outreachService with type='re_engagement'
    const waResult = await claimAndPerformOutreach({
      leadId: reviewItem.lead_id,
      channel: "whatsapp",
      type: "re_engagement",
      triggeredBy: "manual",
    });

    const callResult = await claimAndPerformOutreach({
      leadId: reviewItem.lead_id,
      channel: "call",
      type: "re_engagement",
      triggeredBy: "manual",
    });

    // Update kanban stage to 'outreach_sent'
    db.prepare("UPDATE leads SET kanban_stage = 'outreach_sent', status = 'contacted' WHERE id = ?").run(reviewItem.lead_id);

    console.log(`[Review Centre] Review #${id} RE-ENGAGED by ${resolvedBy} for Lead ${reviewItem.lead_id}`);
    res.json({
      ok: true,
      status: "reengaged",
      id,
      waResult,
      callResult,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/review-centre/:id/dnd — Mark Lead as DND permanently */
router.post("/:id/dnd", (req, res) => {
  const { id } = req.params;
  const resolvedBy = req.body.resolvedBy || req.body.userName || "Admin Manager";

  try {
    const reviewItem = db.prepare("SELECT * FROM review_queue WHERE id = ?").get(id);
    if (!reviewItem) return res.status(404).json({ error: "Review item not found" });

    // Mark review item as marked_dnd
    db.prepare(`
      UPDATE review_queue 
      SET status = 'marked_dnd', resolved_by = ?, resolved_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(resolvedBy, id);

    // Update lead dnd flag to 1 and kanban_stage to 'dnd'
    db.prepare("UPDATE leads SET dnd = 1, status = 'dnd', kanban_stage = 'dnd' WHERE id = ?").run(reviewItem.lead_id);

    console.log(`[Review Centre] Lead ${reviewItem.lead_id} MARKED DND by ${resolvedBy}`);
    res.json({ ok: true, status: "marked_dnd", id, leadId: reviewItem.lead_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
