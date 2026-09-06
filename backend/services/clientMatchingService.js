import db from "../data/db.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Client Matching Engine
 * 
 * Identity Matching Priorities:
 * Priority 1: Email address (99% confidence)
 * Priority 2: Phone number (95% confidence)
 * Priority 3: Existing WhatsApp number (90% confidence)
 * Priority 4: Telegram identifier (85% confidence)
 * Priority 5: Name + location similarity (70% confidence)
 * 
 * Low Confidence Threshold: < 80% confidence
 * If confidence < 80%: Status = NEEDS HUMAN REVIEW (adds to ai_review_queue, does NOT auto-merge).
 */
export function matchClientIdentity(identityInput) {
  const { email, phone, whatsapp, telegramId, name, location } = identityInput;

  let cleanEmail = email ? email.trim().toLowerCase() : null;
  let cleanPhone = phone ? phone.replace(/[^0-9+]/g, "") : null;
  let cleanWhatsapp = whatsapp ? whatsapp.replace(/[^0-9+]/g, "") : null;
  let cleanTelegram = telegramId ? String(telegramId).trim() : null;

  // 1. Check Priority 1: Email Address Match
  if (cleanEmail) {
    const existingByEmail = db.prepare("SELECT * FROM clients WHERE LOWER(email) = ?").get(cleanEmail);
    if (existingByEmail) {
      return {
        client: existingByEmail,
        clientId: existingByEmail.id,
        confidenceScore: 0.99,
        matchMethod: "EMAIL",
        status: "MATCHED",
      };
    }

    // Check leads table for email match
    const leadByEmail = db.prepare("SELECT * FROM leads WHERE LOWER(email) = ?").get(cleanEmail);
    if (leadByEmail) {
      const client = getOrCreateClientForLead(leadByEmail);
      return {
        client,
        clientId: client.id,
        confidenceScore: 0.99,
        matchMethod: "EMAIL",
        status: "MATCHED",
      };
    }
  }

  // 2. Check Priority 2: Phone Number Match
  if (cleanPhone) {
    const phoneCore = cleanPhone.replace("+91", "").slice(-10);
    const existingByPhone = db.prepare("SELECT * FROM clients WHERE phone LIKE ?").get(`%${phoneCore}`);
    if (existingByPhone) {
      return {
        client: existingByPhone,
        clientId: existingByPhone.id,
        confidenceScore: 0.95,
        matchMethod: "PHONE",
        status: "MATCHED",
      };
    }

    const leadByPhone = db.prepare("SELECT * FROM leads WHERE phone LIKE ?").get(`%${phoneCore}`);
    if (leadByPhone) {
      const client = getOrCreateClientForLead(leadByPhone);
      return {
        client,
        clientId: client.id,
        confidenceScore: 0.95,
        matchMethod: "PHONE",
        status: "MATCHED",
      };
    }
  }

  // 3. Check Priority 3: WhatsApp Number Match
  if (cleanWhatsapp) {
    const waCore = cleanWhatsapp.replace("+91", "").slice(-10);
    const existingByWa = db.prepare("SELECT * FROM clients WHERE whatsapp LIKE ?").get(`%${waCore}`);
    if (existingByWa) {
      return {
        client: existingByWa,
        clientId: existingByWa.id,
        confidenceScore: 0.90,
        matchMethod: "WHATSAPP",
        status: "MATCHED",
      };
    }
  }

  // 4. Check Priority 4: Telegram Identifier Match
  if (cleanTelegram) {
    const existingByTg = db.prepare("SELECT * FROM clients WHERE telegram_id = ?").get(cleanTelegram);
    if (existingByTg) {
      return {
        client: existingByTg,
        clientId: existingByTg.id,
        confidenceScore: 0.85,
        matchMethod: "TELEGRAM",
        status: "MATCHED",
      };
    }
  }

  // 5. Check Priority 5: Name Similarity Match (Low Confidence)
  if (name && name.trim().length >= 3) {
    const cleanName = name.trim().toLowerCase();
    const existingByName = db.prepare("SELECT * FROM clients WHERE LOWER(primary_name) = ?").get(cleanName);
    if (existingByName) {
      // Low Confidence Match (70%) -> Queue for Human Review
      const reviewQueueId = `REV-${uuidv4().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO ai_review_queue (id, client_id, type, title, source_channel, raw_input_json, ai_suggested_value_json, confidence_score, status)
        VALUES (?, ?, 'UNMATCHED_IDENTITY', ?, 'matching_engine', ?, ?, 0.70, 'NEEDS_HUMAN_REVIEW')
      `).run(
        reviewQueueId,
        existingByName.id,
        `Identity Match Review Required for ${name}`,
        JSON.stringify(identityInput),
        JSON.stringify({ suggestedClientId: existingByName.id, clientName: existingByName.primary_name })
      );

      return {
        client: existingByName,
        clientId: existingByName.id,
        confidenceScore: 0.70,
        matchMethod: "NAME_SIMILARITY",
        status: "NEEDS_HUMAN_REVIEW",
        reviewQueueId,
      };
    }
  }

  // No match found -> Create new unified Client ID
  const newClient = createNewClient(identityInput);
  return {
    client: newClient,
    clientId: newClient.id,
    confidenceScore: 1.0,
    matchMethod: "NEW_CLIENT_CREATED",
    status: "MATCHED",
  };
}

function getOrCreateClientForLead(lead) {
  if (lead.client_id) {
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(lead.client_id);
    if (client) return client;
  }

  const numIndex = (db.prepare("SELECT COUNT(*) as cnt FROM clients").get()?.cnt || 0) + 1001;
  const clientId = `CLIENT-${String(numIndex).padStart(6, "0")}`;

  db.prepare(`
    INSERT INTO clients (id, primary_name, email, phone, whatsapp, telegram_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    clientId,
    lead.name,
    lead.email || null,
    lead.phone,
    lead.phone,
    null
  );

  db.prepare("UPDATE leads SET client_id = ? WHERE id = ?").run(clientId, lead.id);

  return db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId);
}

function createNewClient(identityInput) {
  const numIndex = (db.prepare("SELECT COUNT(*) as cnt FROM clients").get()?.cnt || 0) + 1001;
  const clientId = `CLIENT-${String(numIndex).padStart(6, "0")}`;

  db.prepare(`
    INSERT INTO clients (id, primary_name, email, phone, whatsapp, telegram_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    clientId,
    identityInput.name || `Client (${(identityInput.phone || identityInput.email || "New").slice(-6)})`,
    identityInput.email || null,
    identityInput.phone || null,
    identityInput.whatsapp || identityInput.phone || null,
    identityInput.telegramId || null
  );

  return db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId);
}
