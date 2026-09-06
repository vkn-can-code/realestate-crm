import { Router } from "express";
import db, { newUuid } from "../data/db.js";
import { normalizePhone } from "./importLeads.js";

const router = Router();

/**
 * POST /api/webhooks/inbound-call — Receives Webhook when a customer calls in
 * Matches phone number, creates lightweight lead if unlisted, and records outreach_log.
 */
async function handleInboundCallWebhook(req, res) {
  const params = { ...req.query, ...req.body };
  const rawCallerPhone = params.From || params.Caller || params.caller_number || params.phone || "Unknown";
  const callSid = params.CallSid || params.call_id || `CALL-${newUuid().slice(0, 8)}`;
  const speechResult = params.SpeechResult || params.speech || params.transcript || "";

  console.log(`[Inbound Call Webhook] Received call from ${rawCallerPhone} (CallSid: ${callSid})`);

  const cleanPhone = normalizePhone(rawCallerPhone) || rawCallerPhone.replace(/[^0-9+]/g, "");

  // 1. Find existing lead or auto-create lightweight unlisted lead
  let lead = db.prepare("SELECT * FROM leads WHERE phone = ? OR phone LIKE ?").get(cleanPhone, `%${cleanPhone.slice(-10)}%`);

  if (!lead) {
    const leadId = `LEAD-${newUuid().slice(0, 8)}`;
    const name = `Unknown Caller ${cleanPhone.slice(-4)}`;
    db.prepare(`
      INSERT INTO leads (id, name, phone, email, property_interest, source, status, created_at)
      VALUES (?, ?, ?, null, ?, 'inbound_call', 'new', CURRENT_TIMESTAMP)
    `).run(leadId, name, cleanPhone, speechResult ? `Inbound Call: "${speechResult}"` : "Inbound phone call inquiry");

    lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
    console.log(`✨ [Inbound Call Webhook] Auto-created new lightweight lead ${leadId} for unlisted caller ${cleanPhone}`);
  }

  // 2. Log Inbound Call in outreach_log (No uniqueness constraint needed — all inbound calls are legitimate)
  const logId = `OUT-${newUuid().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO outreach_log (id, lead_id, channel, type, status, triggered_by, created_at, updated_at)
    VALUES (?, ?, 'call', 'inbound_call', 'answered', 'auto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(logId, lead.id);

  console.log(`✅ [Inbound Call Logged] LogId ${logId} recorded for lead ${lead.id} (${cleanPhone})`);

  res.json({
    ok: true,
    logId,
    leadId: lead.id,
    leadName: lead.name,
    message: "Inbound call logged successfully",
  });
}

// Support both GET & POST webhooks
router.get("/inbound-call", handleInboundCallWebhook);
router.post("/inbound-call", handleInboundCallWebhook);

export default router;
