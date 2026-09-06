import db, { newUuid } from "../data/db.js";
import whatsapp from "../integrations/whatsapp.js";
import { triggerOutboundExotelCall } from "../integrations/exotel.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Claim-Then-Act Pattern for Single Lead Outreach (WhatsApp or Call)
 * Strictly checks DND status and DB-level UNIQUE(lead_id, channel, type) constraint.
 */
export async function claimAndPerformOutreach({ leadId, channel, type = "initial_outreach", triggeredBy = "auto", customMessage = null }) {
  // Retrieve lead record & check DND Protection
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
  if (!lead) {
    return { claimed: false, ok: false, error: "Lead record not found" };
  }

  // ABSOLUTE RULE: Check DND flag before ANY automatic outreach attempt
  if (triggeredBy === "auto" && (lead.dnd === 1 || lead.status === "dnd" || lead.kanban_stage === "dnd")) {
    console.log(`🛡️ [DND Refusal] Auto-outreach blocked for Lead ${leadId} (${lead.phone}) because DND flag is active!`);
    return { claimed: false, ok: false, reason: "Lead is marked DND" };
  }

  const logId = `OUT-${newUuid().slice(0, 8)}`;

  // 1. CLAIM: Hard DB Insert with 'pending' status
  try {
    const claimStmt = db.prepare(`
      INSERT INTO outreach_log (id, lead_id, channel, type, status, triggered_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    claimStmt.run(logId, leadId, channel, type, triggeredBy);
    console.log(`🔒 [Claim Succeeded] Lead ${leadId} claimed for channel='${channel}', type='${type}' (LogId: ${logId})`);
  } catch (err) {
    if (err.message.includes("UNIQUE constraint failed") || err.message.includes("unique")) {
      console.log(`⛔ [Claim Skipped - Already Executed] Lead ${leadId} has already been claimed for ${channel} ${type}. Idempotency enforced!`);
      return { claimed: false, reason: "Already contacted or outreach in progress" };
    }
    console.error(`[Claim Error] Unexpected DB error claiming lead ${leadId}:`, err);
    throw err;
  }

  // 2. ACT: Perform Channel-Specific Action
  if (channel === "whatsapp") {
    try {
      const messageText = customMessage || `Hello ${lead.name}! 👋 Welcome to RealtyPulse Real Estate Agency in Kochi. We noticed your interest in ${lead.property_interest || "our premium properties"}. Would you like to view available options or schedule a 1-on-1 consultation slot?`;
      
      await whatsapp.sendTextMessage({ toNumber: lead.phone, message: messageText });
      
      // Update outreach_log status to 'sent'
      db.prepare("UPDATE outreach_log SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(logId);
      
      // Update lead kanban_stage to 'outreach_sent' and status to 'contacted'
      db.prepare("UPDATE leads SET kanban_stage = 'outreach_sent', status = 'contacted' WHERE id = ? AND kanban_stage = 'new'").run(leadId);

      console.log(`✅ [WhatsApp Outreach Sent] Sent message to ${lead.phone} for lead ${leadId}`);
      return { claimed: true, ok: true, logId, channel: "whatsapp" };
    } catch (err) {
      console.error(`❌ [WhatsApp Outreach Failed] ${err.message} for lead ${leadId}`);
      db.prepare("UPDATE outreach_log SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(logId);
      return { claimed: true, ok: false, logId, channel: "whatsapp", error: err.message };
    }
  }

  if (channel === "call") {
    try {
      const vapiApiKey = process.env.VAPI_PRIVATE_API_KEY;
      const vapiAssistantId = process.env.VAPI_ASSISTANT_ID;

      let callResultOk = false;

      if (vapiApiKey && vapiAssistantId) {
        // Trigger Vapi Outbound Phone Call
        try {
          const fetch = (await import("node-fetch")).default || globalThis.fetch;
          const vapiRes = await fetch("https://api.vapi.ai/call", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${vapiApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              assistantId: vapiAssistantId,
              customer: {
                number: lead.phone,
                name: lead.name,
              },
            }),
          });
          const vapiData = await vapiRes.json();
          callResultOk = vapiRes.ok;
          console.log(`⚡ [Vapi Outbound Call Triggered] Lead ${leadId} (${lead.phone}) -> Call ID: ${vapiData.id || "N/A"}`);
        } catch (vErr) {
          console.warn(`[Vapi Outbound Call Warning] ${vErr.message}`);
        }
      }

      // Fallback trigger Exotel
      if (!callResultOk) {
        const result = await triggerOutboundExotelCall({
          toNumber: lead.phone,
          leadId: lead.id,
          reason: `${type === "re_engagement" ? "Manual Re-engagement" : "Initial Auto-Outreach"} Call via AIRA AI Voice Agent`,
        });
        callResultOk = result.ok;
      }

      const finalStatus = callResultOk ? "answered" : "failed";
      db.prepare("UPDATE outreach_log SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(finalStatus, logId);

      if (callResultOk) {
        db.prepare("UPDATE leads SET kanban_stage = 'outreach_sent', status = 'contacted' WHERE id = ? AND kanban_stage = 'new'").run(leadId);
      }

      console.log(`📞 [Vapi / AIRA Voice Call Triggered] Call to ${lead.phone} outcome: ${finalStatus}`);
      return { claimed: true, ok: callResultOk, logId, channel: "call", status: finalStatus };
    } catch (err) {
      console.error(`❌ [AIRA Voice Call Failed] ${err.message} for lead ${leadId}`);
      db.prepare("UPDATE outreach_log SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(logId);
      return { claimed: true, ok: false, logId, channel: "call", error: err.message };
    }
  }

  if (channel === "telegram") {
    try {
      const { sendTelegramMessageByPhone } = await import("../integrations/telegram.js");
      const messageText = customMessage || `Hello ${lead.name}! 👋 Welcome to RealtyPulse Real Estate Agency in Kochi. We noticed your interest in ${lead.property_interest || "our premium properties"}. Would you like to view available options or schedule a consultation?`;

      const tgResult = await sendTelegramMessageByPhone({
        phone: lead.phone,
        name: lead.name,
        message: messageText,
      });

      db.prepare("UPDATE outreach_log SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(logId);
      db.prepare("UPDATE leads SET kanban_stage = 'outreach_sent', status = 'contacted' WHERE id = ? AND kanban_stage = 'new'").run(leadId);

      console.log(`✅ [Telegram Outreach Sent] Sent to ${lead.phone} (TG User ID: ${tgResult.telegramUserId})`);
      return { claimed: true, ok: true, logId, channel: "telegram", telegramUserId: tgResult.telegramUserId };
    } catch (err) {
      console.error(`❌ [Telegram Outreach Failed] ${err.message} for lead ${leadId}`);
      db.prepare("UPDATE outreach_log SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(logId);
      return { claimed: true, ok: false, logId, channel: "telegram", error: err.message };
    }
  }

  return { claimed: true, ok: false, error: "Unsupported channel" };
}

/** Bulk Auto-Outreach Processor */
export async function triggerBulkAutoOutreach(leadIds = [], { rateLimitPerSec = 2 } = {}) {
  if (!leadIds || leadIds.length === 0) return { total: 0, processed: 0 };

  const delayMs = Math.floor(1000 / rateLimitPerSec);
  let whatsappSent = 0;
  let whatsappSkipped = 0;
  let callsTriggered = 0;
  let callsSkipped = 0;
  let telegramSent = 0;
  let telegramSkipped = 0;

  for (const leadId of leadIds) {
    const tgResult = await claimAndPerformOutreach({ leadId, channel: "telegram", type: "initial_outreach", triggeredBy: "auto" });
    if (tgResult.claimed) telegramSent++;
    else telegramSkipped++;

    await sleep(delayMs);

    const waResult = await claimAndPerformOutreach({ leadId, channel: "whatsapp", type: "initial_outreach", triggeredBy: "auto" });
    if (waResult.claimed) whatsappSent++;
    else whatsappSkipped++;

    await sleep(delayMs);

    const callResult = await claimAndPerformOutreach({ leadId, channel: "call", type: "initial_outreach", triggeredBy: "auto" });
    if (callResult.claimed) callsTriggered++;
    else callsSkipped++;

    await sleep(delayMs);
  }

  return { totalLeads: leadIds.length, whatsappSent, whatsappSkipped, callsTriggered, callsSkipped, telegramSent, telegramSkipped };
}

export default { claimAndPerformOutreach, triggerBulkAutoOutreach };
