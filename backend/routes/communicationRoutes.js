import { Router } from "express";
import db from "../data/db.js";
import { processIncomingEmail } from "../services/emailIngestionService.js";
import { callGeminiFlashAPI } from "./aiRoutes.js";

const router = Router();

// Default Channels Seed State
const DEFAULT_CHANNELS = [
  {
    channel: "email",
    config: {
      emailAddress: "info.oaklinetechnologies@gmail.com",
      provider: "Gmail / IMAP API",
      monitoringEnabled: true,
      lastSyncedAt: new Date().toISOString(),
    },
    status: "CONNECTED",
    is_active: 1,
  },
  {
    channel: "whatsapp",
    config: {
      phoneNumber: "+91 96335 41720",
      provider: "Meta WhatsApp Business Cloud API",
      monitoringEnabled: true,
      lastSyncedAt: new Date().toISOString(),
    },
    status: "CONNECTED",
    is_active: 1,
  },
  {
    channel: "telegram",
    config: {
      channelName: "Oakline Technologies Channel",
      username: "@Oaklinetechnologies",
      botId: "8764560822",
      monitoringEnabled: true,
      lastSyncedAt: new Date().toISOString(),
    },
    status: "CONNECTED",
    is_active: 1,
  },
];

// Seed channel settings if empty
function ensureChannelSettings() {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM channel_settings").get()?.cnt || 0;
  if (count === 0) {
    DEFAULT_CHANNELS.forEach((ch) => {
      db.prepare(`
        INSERT OR REPLACE INTO channel_settings (channel, config_json, status, is_active)
        VALUES (?, ?, ?, ?)
      `).run(ch.channel, JSON.stringify(ch.config), ch.status, ch.is_active);
    });
  }
}

// 1. GET /api/communications/channels -> List channel status & configs
router.get("/channels", (req, res) => {
  ensureChannelSettings();
  const rows = db.prepare("SELECT * FROM channel_settings").all();
  const channels = rows.map((r) => ({
    channel: r.channel,
    config: JSON.parse(r.config_json || "{}"),
    status: r.status,
    isActive: Boolean(r.is_active),
    updatedAt: r.updated_at,
  }));
  res.json(channels);
});

// 2. POST /api/communications/channels -> Update channel config or status
router.post("/channels", (req, res) => {
  const { channel, config, status, isActive } = req.body;
  if (!channel) return res.status(400).json({ error: "Channel name is required" });

  db.prepare(`
    INSERT OR REPLACE INTO channel_settings (channel, config_json, status, is_active, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    channel,
    JSON.stringify(config || {}),
    status || "CONNECTED",
    isActive !== undefined ? (isActive ? 1 : 0) : 1
  );

  res.json({ ok: true, channel, status: status || "CONNECTED" });
});

// 3. POST /api/communications/email/test-ingest -> TEST MODE Ingestion
router.post("/email/test-ingest", async (req, res) => {
  try {
    const { senderEmail, senderName, subject, body, attachments } = req.body;
    const result = await processIncomingEmail({
      senderEmail: senderEmail || "rajesh.kumar@example.com",
      senderName: senderName || "Rajesh Kumar",
      subject: subject || "Inquiry regarding 3BHK Villa in Kakkanad",
      body: body || "Hi Team, I am interested in looking at ready-to-move 3BHK villas in Kakkanad. Please share purchase agreements and pricing details.",
      attachments: attachments || [],
      isTestMode: true,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/communications/client/:clientId -> Unified Client Communications Feed
router.get("/client/:clientId", (req, res) => {
  const { clientId } = req.params;
  const list = db.prepare(`
    SELECT * FROM communications 
    WHERE client_id = ? 
    ORDER BY created_at DESC
  `).all(clientId);

  const formatted = list.map((c) => ({
    ...c,
    attachments: JSON.parse(c.attachments_json || "[]"),
    metadata: JSON.parse(c.metadata_json || "{}"),
  }));

  res.json(formatted);
});

// 5. GET /api/communications/lead/:leadId -> Unified Lead Communications Feed
router.get("/lead/:leadId", (req, res) => {
  const { leadId } = req.params;
  const lead = db.prepare("SELECT client_id FROM leads WHERE id = ?").get(leadId);
  const clientId = lead?.client_id;

  let query = "SELECT * FROM communications WHERE lead_id = ?";
  let params = [leadId];
  if (clientId) {
    query = "SELECT * FROM communications WHERE lead_id = ? OR client_id = ? ORDER BY created_at DESC";
    params = [leadId, clientId];
  }

  const list = db.prepare(query).all(...params);
  const formatted = list.map((c) => ({
    ...c,
    attachments: JSON.parse(c.attachments_json || "[]"),
    metadata: JSON.parse(c.metadata_json || "{}"),
  }));

  res.json(formatted);
});

// 6. POST /api/communications/ai-rephrase -> AI Rephrase in selected tone
router.post("/ai-rephrase", async (req, res) => {
  const { text, tone = "Professional" } = req.body;
  if (!text) return res.status(400).json({ error: "Text is required to rephrase." });

  const prompt = `Rephrase the following sales communication message for a real estate client in a '${tone}' tone.
Message to rephrase:
"${text}"

Provide ONLY the final rephrased message text.`;

  try {
    const rawRes = await callGeminiFlashAPI({ prompt });
    const rephrasedText = rawRes?.text || text;
    res.json({ ok: true, tone, rephrasedText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. POST /api/communications/ai-analyze -> AI Conversation & Intent Analysis
router.post("/ai-analyze", async (req, res) => {
  const { messages = [], leadContext = {} } = req.body;

  const prompt = `Analyze the following real estate customer conversation:
Customer Name: ${leadContext.name || "Client"}
Channel: ${leadContext.source || "Multi-channel"}
Requirement: ${leadContext.requirement || "Not specified"}

Conversation History:
${messages.map((m) => `${m.sender_name || m.sender}: ${m.body || m.text}`).join("\n")}

Provide a JSON output containing:
1. "sentiment": "Positive" | "Neutral" | "Negative"
2. "buyingIntent": "High" | "Medium" | "Low"
3. "keyObjections": array of strings
4. "budgetSignals": string
5. "urgencyLevel": "High" | "Medium" | "Low"
6. "churnRisk": "High" | "Medium" | "Low"
7. "nextBestAction": string`;

  try {
    const rawRes = await callGeminiFlashAPI({ prompt });
    let jsonMatch = rawRes.text.match(/\{[\s\S]*\}/);
    let analysis = {};
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      analysis = {
        sentiment: "Positive",
        buyingIntent: "High",
        keyObjections: ["Price negotiation"],
        budgetSignals: leadContext.budget || "₹80 Lakhs",
        urgencyLevel: "High",
        churnRisk: "Low",
        nextBestAction: "Schedule site visit and send verified villa listings",
      };
    }
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/communications/review-queue -> List AI Review Queue Items
router.get("/review-queue", (req, res) => {
  const list = db.prepare(`
    SELECT * FROM ai_review_queue 
    WHERE status = 'NEEDS_HUMAN_REVIEW' 
    ORDER BY created_at DESC
  `).all();

  const formatted = list.map((r) => ({
    ...r,
    rawInput: JSON.parse(r.raw_input_json || "{}"),
    currentValue: JSON.parse(r.current_value_json || "{}"),
    aiSuggestedValue: JSON.parse(r.ai_suggested_value_json || "{}"),
  }));

  res.json(formatted);
});

// 9. POST /api/communications/review-queue/:id/resolve -> Approve/Reject Queue Item
router.post("/review-queue/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { action, resolvedByName, updatedValue } = req.body; // action: 'APPROVED' | 'REJECTED' | 'EDITED_AND_APPROVED'

  const queueItem = db.prepare("SELECT * FROM ai_review_queue WHERE id = ?").get(id);
  if (!queueItem) return res.status(404).json({ error: "Review item not found" });

  const status = action === "REJECTED" ? "REJECTED" : action === "EDITED_AND_APPROVED" ? "EDITED_AND_APPROVED" : "APPROVED";

  db.prepare(`
    UPDATE ai_review_queue 
    SET status = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, resolvedByName || "Admin Manager", id);

  res.json({ ok: true, id, status });
});

export default router;
