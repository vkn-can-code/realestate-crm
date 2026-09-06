import db from "../data/db.js";
import { v4 as uuidv4 } from "uuid";
import { matchClientIdentity } from "./clientMatchingService.js";

const DEFAULT_COMPANY_EMAIL = "info.oaklinetechnologies@gmail.com";

/**
 * Email Ingestion Service
 * 
 * Monitors & processes incoming emails to configured company mailbox (info.oaklinetechnologies@gmail.com).
 * Extracts sender name, email, subject, body, timestamp, attachments.
 * Calls clientMatchingService to link communication to unified Client ID (CLIENT-XXXXXX).
 * Saves communication & records activity timeline entry.
 */
export async function processIncomingEmail({
  senderEmail,
  senderName,
  recipient = DEFAULT_COMPANY_EMAIL,
  subject,
  body,
  attachments = [],
  metadata = {},
  isTestMode = false,
}) {
  console.log(`[Email Ingestion] Processing ${isTestMode ? "TEST MODE" : "LIVE"} email from: ${senderEmail} (${senderName || "Unknown"})`);

  if (!senderEmail) {
    throw new Error("Sender email is required for email ingestion.");
  }

  // 1. Execute Identity Matching Engine
  const matchResult = matchClientIdentity({
    email: senderEmail,
    name: senderName,
  });

  const { client, clientId, confidenceScore, matchMethod, status } = matchResult;

  // 2. Find or associate lead record
  let lead = db.prepare("SELECT * FROM leads WHERE client_id = ?").get(clientId);
  if (!lead) {
    // Check by email or phone
    lead = db.prepare("SELECT * FROM leads WHERE LOWER(email) = ?").get(senderEmail.trim().toLowerCase());
    if (lead) {
      db.prepare("UPDATE leads SET client_id = ? WHERE id = ?").run(clientId, lead.id);
    } else {
      // Create new lead connected to client
      const leadId = `LEAD-${uuidv4().slice(0, 8)}`;
      const cleanPhone = metadata.phone || `+9190000${Math.floor(10000 + Math.random() * 90000)}`;
      db.prepare(`
        INSERT INTO leads (id, client_id, name, phone, email, source, status, property_interest, kanban_stage)
        VALUES (?, ?, ?, ?, ?, 'email', 'new', ?, 'New')
      `).run(
        leadId,
        clientId,
        senderName || senderEmail.split("@")[0],
        cleanPhone,
        senderEmail,
        subject || "Email Inquiry"
      );
      lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
    }
  }

  // 3. Save Raw Communication Record
  const commId = `COMM-${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO communications (id, client_id, lead_id, channel, direction, sender, sender_name, recipient, subject, body, attachments_json, metadata_json)
    VALUES (?, ?, ?, 'email', 'inbound', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    commId,
    clientId,
    lead?.id || null,
    senderEmail,
    senderName || senderEmail.split("@")[0],
    recipient,
    subject || "No Subject",
    body || "",
    JSON.stringify(attachments),
    JSON.stringify({ matchConfidence: confidenceScore, matchMethod, isTestMode, ...metadata })
  );

  // 4. Log Activity Timeline Entry
  const actId = `ACT-${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, performed_by_name, metadata_json)
    VALUES (?, ?, 'email', ?, ?, 'email_ingestion', ?, ?)
  `).run(
    actId,
    lead?.id,
    `Incoming Email: ${subject || "No Subject"}`,
    `Received email from ${senderName ? `${senderName} (${senderEmail})` : senderEmail}: "${(body || "").slice(0, 100)}..."`,
    senderName || "Client Email System",
    JSON.stringify({ commId, clientId, matchMethod, confidenceScore })
  );

  // 5. Update last_interaction_at on lead
  db.prepare("UPDATE leads SET last_interaction_at = CURRENT_TIMESTAMP WHERE id = ?").run(lead?.id);

  console.log(`✅ [Email Ingestion Success] Linked to Client ID: ${clientId} (${client.primary_name}), Match Method: ${matchMethod} (${(confidenceScore * 100).toFixed(0)}% Conf)`);

  return {
    ok: true,
    commId,
    clientId,
    leadId: lead?.id,
    matchedClient: client,
    confidenceScore,
    matchMethod,
    matchStatus: status,
    isTestMode,
  };
}
