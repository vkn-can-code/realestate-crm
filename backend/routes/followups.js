import { Router } from "express";
import db, { newUuid } from "../data/db.js";
import { team } from "../data/store.js";

const router = Router();

export const STAGE_MAP = {
  new: "New",
  outreach_sent: "Outreach Sent",
  contacted: "Contacted",
  qualified: "Qualified",
  site_visit_scheduled: "Site Visit Scheduled",
  site_visit_done: "Site Visit Done",
  negotiation: "Negotiation",
  booking_token: "Booking / Token Received",
  won: "Won",
  not_interested: "Not Interested / Lost",
  cold_no_response: "Cold / No Response",
  dnd: "DND",
};

/** GET /api/followups -> Returns SQLite leads grouped by kanban_stage */
router.get("/", (req, res) => {
  const userRole = req.headers["x-user-role"] || req.query.userRole || "sales";
  const userId = req.headers["x-user-id"] || req.query.userId || null;
  const assignedToFilter = req.query.assignedTo || (userRole === "sales" ? userId : "all");

  try {
    let sqliteLeads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();

    // RULE: Sales rep sees ONLY leads assigned to them. Unassigned leads hidden from sales reps!
    if (userRole === "sales" && userId) {
      sqliteLeads = sqliteLeads.filter((l) => l.assigned_to === userId);
    } else if (assignedToFilter && assignedToFilter !== "all") {
      if (assignedToFilter === "unassigned") {
        sqliteLeads = sqliteLeads.filter((l) => !l.assigned_to);
      } else {
        sqliteLeads = sqliteLeads.filter((l) => l.assigned_to === assignedToFilter);
      }
    }

    const grouped = {
      new: [],
      outreach_sent: [],
      contacted: [],
      qualified: [],
      site_visit_scheduled: [],
      site_visit_done: [],
      negotiation: [],
      booking_token: [],
      won: [],
      not_interested: [],
      cold_no_response: [],
      dnd: [],
    };

    sqliteLeads.forEach((l) => {
      const stageKey = grouped[l.kanban_stage] ? l.kanban_stage : "new";
      const assignedMember = team.find((t) => t.id === l.assigned_to);

      // Check if lead has an answered call in outreach_log (triggers visual "Contacted (needs review)" badge)
      const answeredCall = db.prepare(`
        SELECT id FROM outreach_log 
        WHERE lead_id = ? AND channel = 'call' AND status = 'answered'
      `).get(l.id);

      // Get last follow-up note summary
      const lastNote = db.prepare(`
        SELECT * FROM stage_history WHERE lead_id = ? ORDER BY timestamp DESC LIMIT 1
      `).get(l.id);

      grouped[stageKey].push({
        id: l.id,
        leadId: l.id,
        leadName: l.name,
        leadPhone: l.phone,
        email: l.email,
        budget: l.property_interest || "Not specified",
        leadRequirement: l.property_interest,
        source: l.source,
        kanbanStage: l.kanban_stage,
        assignedTo: l.assigned_to,
        assignedToName: assignedMember ? assignedMember.name : "Unassigned",
        dnd: l.dnd,
        needsCallReview: Boolean(answeredCall && l.kanban_stage === "outreach_sent"),
        lastNote: lastNote ? lastNote.changed_by_name || "Note added" : null,
        lastActivityTime: lastNote ? lastNote.timestamp : l.created_at,
        createdAt: l.created_at,
      });
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/followups/:id/column -> Moves card to new stage with RBAC & Audit Trail */
router.patch("/:id/column", (req, res) => {
  const { id } = req.params;
  const { column, updatedByName } = req.body;

  const userId = req.headers["x-user-id"] || req.body?.userId || null;
  const userRole = req.headers["x-user-role"] || req.body?.userRole || "sales";

  // Resolve target stage key
  let targetStage = Object.keys(STAGE_MAP).find((k) => k === column || STAGE_MAP[k] === column) || "contacted";

  // LOCKDOWN RULE: Manual stages (qualified, site_visit_*, negotiation, won, etc.) REQUIRE an authenticated userId
  const manualStages = ["qualified", "site_visit_scheduled", "site_visit_done", "negotiation", "booking_token", "won", "not_interested"];
  if (manualStages.includes(targetStage) && !userId && !req.headers["x-user-id"]) {
    return res.status(400).json({
      error: `Automated stage transition to '${targetStage}' is blocked. Transitioning to manual sales pipeline stages requires an authenticated user ID.`,
    });
  }

  try {
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // RBAC RULE: Sales Rep can ONLY modify leads assigned to them. Admin can modify any lead.
    if (userRole === "sales" && userId && lead.assigned_to !== userId) {
      return res.status(403).json({
        error: "Permission denied: Sales representatives can only modify leads assigned to them.",
        leadId: id,
        assignedTo: lead.assigned_to,
      });
    }

    const fromStage = lead.kanban_stage || "new";

    // Update SQLite lead stage
    db.prepare("UPDATE leads SET kanban_stage = ?, status = ? WHERE id = ?").run(targetStage, targetStage === "dnd" ? "dnd" : "contacted", id);
    if (targetStage === "dnd") {
      db.prepare("UPDATE leads SET dnd = 1 WHERE id = ?").run(id);
    }

    // AUDIT TRAIL: Log every manual stage change into stage_history table
    const historyId = `HIS-${newUuid().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO stage_history (id, lead_id, from_stage, to_stage, changed_by, changed_by_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(historyId, id, fromStage, targetStage, userId || "system", updatedByName || "Sales User");

    console.log(`📌 [Stage Change Logged] Lead ${id} stage moved from '${fromStage}' ➔ '${targetStage}' by User ${userId || "system"} (${updatedByName || "User"})`);

    res.json({
      ok: true,
      id,
      fromStage,
      toStage: targetStage,
      stageName: STAGE_MAP[targetStage],
      changedBy: userId || "system",
      changedByName: updatedByName || "User",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/followups/whatsapp-reply-webhook -> Automatic stage transition on WhatsApp Reply ONLY */
router.post("/whatsapp-reply-webhook", (req, res) => {
  const { from, phone, message } = req.body;
  const rawPhone = phone || from;

  if (!rawPhone) return res.status(400).json({ error: "Missing phone parameter" });

  const cleanPhone = rawPhone.replace(/[^0-9+]/g, "");
  const lead = db.prepare("SELECT * FROM leads WHERE phone = ? OR phone LIKE ?").get(cleanPhone, `%${cleanPhone.slice(-10)}%`);

  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const textLower = (message || "").toLowerCase();

  // DND Keyword Check (Opt-out)
  const dndKeywords = ["stop", "unsubscribe", "remove me", "don't call", "dnd", "cancel", "opt out"];
  const isDndRequest = dndKeywords.some((k) => textLower.includes(k));

  if (isDndRequest) {
    db.prepare("UPDATE leads SET dnd = 1, status = 'dnd', kanban_stage = 'dnd' WHERE id = ?").run(lead.id);
    console.log(`⛔ [WhatsApp Opt-Out] Lead ${lead.id} (${cleanPhone}) sent opt-out keyword: "${message}". Marked DND!`);
    return res.json({ ok: true, leadId: lead.id, action: "marked_dnd" });
  }

  // Automatic Rule: Outreach Sent ➔ Contacted on incoming WhatsApp reply ONLY!
  if (lead.kanban_stage === "outreach_sent" || lead.kanban_stage === "new") {
    const fromStage = lead.kanban_stage;
    db.prepare("UPDATE leads SET kanban_stage = 'contacted', status = 'contacted' WHERE id = ?").run(lead.id);

    // Audit trail log for auto-transition
    db.prepare(`
      INSERT INTO stage_history (id, lead_id, from_stage, to_stage, changed_by, changed_by_name, timestamp)
      VALUES (?, ?, ?, 'contacted', 'system_whatsapp_webhook', 'WhatsApp Reply Webhook', CURRENT_TIMESTAMP)
    `).run(`HIS-${newUuid().slice(0, 8)}`, lead.id, fromStage);

    console.log(`💬 [WhatsApp Reply Auto-Move] Lead ${lead.id} (${cleanPhone}) replied: "${message}". Stage moved: ${fromStage} ➔ Contacted!`);
    return res.json({ ok: true, leadId: lead.id, stage: "contacted", action: "stage_moved" });
  }

  res.json({ ok: true, leadId: lead.id, stage: lead.kanban_stage });
});

/** GET /api/followups/:id/history -> Audit log timeline of all stage changes for a lead */
router.get("/:id/history", (req, res) => {
  try {
    const history = db.prepare("SELECT * FROM stage_history WHERE lead_id = ? ORDER BY timestamp DESC").all(req.params.id);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
