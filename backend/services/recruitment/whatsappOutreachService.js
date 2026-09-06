import { newUuid } from "../../data/db.js";

export async function sendWhatsAppOutreach(db, messageId, adminName = "Admin Recruiter") {
  const message = db.prepare("SELECT * FROM outreach_messages WHERE id = ?").get(messageId);
  if (!message) throw new Error("Message not found.");

  if (!["ADMIN_APPROVED", "READY_TO_SEND"].includes(message.status)) {
    throw new Error(`WhatsApp message must be ADMIN_APPROVED before sending (current: ${message.status}).`);
  }

  const prospect = db.prepare("SELECT * FROM recruitment_prospects WHERE id = ?").get(message.prospect_id);
  if (!prospect) throw new Error("Prospect not found.");

  if (prospect.status === "DO_NOT_CONTACT" || prospect.status === "REJECTED") {
    throw new Error(`Cannot send WhatsApp: Prospect status is '${prospect.status}'.`);
  }

  const contact = db.prepare("SELECT * FROM prospect_contacts WHERE prospect_id = ?").get(message.prospect_id);
  if (!contact || !contact.phone) {
    throw new Error("No enriched phone number found for candidate. Run contact enrichment first.");
  }

  if (contact.whatsapp_optin !== 1) {
    throw new Error("WhatsApp Compliance Violation: Opt-in permission is not recorded for this contact.");
  }

  const nowStr = new Date().toISOString();

  // Record sent state
  db.prepare(`
    UPDATE outreach_messages
    SET status = 'SENT', sent_at = ?
    WHERE id = ?
  `).run(nowStr, messageId);

  // Update prospect status to CONTACTED
  db.prepare(`
    UPDATE recruitment_prospects
    SET status = 'CONTACTED', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(message.prospect_id);

  // Record audit log event
  db.prepare(`
    INSERT INTO recruitment_events (id, prospect_id, event_type, performed_by, performed_by_name, details_json)
    VALUES (?, ?, 'WHATSAPP_SENT', 'admin', ?, ?)
  `).run(
    `EVT-${newUuid().slice(0, 8)}`,
    message.prospect_id,
    adminName,
    JSON.stringify({ messageId, toPhone: contact.phone, templateUsed: message.whatsapp_template_name || "recruitment_outreach_v1" })
  );

  return { ok: true, messageId, sentTo: contact.phone, sentAt: nowStr };
}
