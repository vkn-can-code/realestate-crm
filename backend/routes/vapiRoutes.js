import { Router } from "express";
import { leads, conversations, newId, saveToDisk } from "../data/store.js";
import { processNativeAiChat } from "../services/aiChatService.js";

const router = Router();

// Fallback reply if AI engine returns empty response
const DEFAULT_FALLBACK_REPLY = "Sorry, I missed that. Could you please repeat what you are looking for?";

/**
 * 1. OPENAI-COMPATIBLE LLM ENDPOINT FOR VAPI (POST /api/vapi/llm)
 * Vapi calls this endpoint when Assistant provider is configured as "custom-llm".
 */
router.post(["/llm", "/llm/chat/completions"], async (req, res) => {
  try {
    const { messages = [], call = {}, stream = false } = req.body || {};

    console.log("\n=======================================================");
    console.log("⚡ [Vapi Custom LLM Request Received]");
    console.log("=======================================================");
    console.log("Messages count:", messages.length);
    console.log("Call ID:", call.id || "N/A");
    console.log("Customer number:", call.customer?.number || "N/A");

    // Extract the latest user message from the messages array
    const userMessages = messages.filter((m) => m.role === "user");
    const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";
    const customerPhone = call.customer?.number || "VoiceCaller";
    const cleanPhone = customerPhone.replace(/[^0-9+]/g, "");

    // Pass the entire conversation history (excluding the current turn) to the AI engine
    const historyMessages = messages
      .filter((m) => m.content && m.content !== lastUserMsg) // Exclude the current message to avoid duplication
      .map((m) => ({
        sender: m.role, // "user" or "assistant"
        text: m.content,
      }));

    const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5001";
    const bookingLink = `${baseUrl}/book-meeting?leadId=LEAD-VAPI`;

    let aiReplyText = null;

    if (lastUserMsg) {
      // Query 100% Native Express AI Engine (Gemini 3.6 Flash)
      aiReplyText = await processNativeAiChat({
        conversationId: `vapi:${cleanPhone}`,
        customerId: cleanPhone,
        message: lastUserMsg,
        historyMessages,
        bookingLink,
        channel: "vapi",
      });
    }

    if (!aiReplyText) {
      console.warn("⚠️ [Vapi LLM Fallback] Native AI engine returned no output. Using fallback speech.");
      aiReplyText = DEFAULT_FALLBACK_REPLY;
    }

    console.log(`✅ [Vapi LLM Spoken Response] "${aiReplyText}"`);

    // Format response into OpenAI Chat Completion format
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const chunk = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "custom-llm",
        choices: [{ index: 0, delta: { content: aiReplyText }, finish_reason: null }],
      };
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);

      const endChunk = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: "custom-llm",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      };
      res.write(`data: ${JSON.stringify(endChunk)}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    } else {
      const responsePayload = {
        id: `chatcmpl-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "custom-llm",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: aiReplyText,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 50,
          total_tokens: 100,
        },
      };
      return res.status(200).json(responsePayload);
    }
  } catch (err) {
    console.error("❌ [Vapi LLM Exception]", err);

    // Always return HTTP 200 with valid OpenAI JSON fallback so Vapi calls never die silently
    return res.status(200).json({
      id: `chatcmpl-err-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: "custom-llm-n8n",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: DEFAULT_FALLBACK_REPLY,
          },
          finish_reason: "stop",
        },
      ],
    });
  }
});

/**
 * 2. END-OF-CALL & STATUS WEBHOOK RECEIVER (POST /api/vapi/webhook)
 * Vapi posts server events (end-of-call-report, status-update, function-call).
 */
router.post("/webhook", (req, res) => {
  try {
    // Secret Verification if VAPI_WEBHOOK_SECRET is configured
    const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (expectedSecret) {
      const incomingSecret = req.headers["x-vapi-secret"];
      if (incomingSecret !== expectedSecret) {
        console.warn("⚠️ [Vapi Webhook Warning] Invalid x-vapi-secret received.");
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const payload = req.body || {};
    const message = payload.message || payload;
    const type = message.type || payload.type;

    console.log("\n=======================================================");
    console.log(`📞 [Vapi Server Webhook Event] Type: "${type}"`);
    console.log("=======================================================\n");

    if (type === "end-of-call-report") {
      const call = message.call || {};
      const customerNumber = call.customer?.number || "Unknown";
      const duration = message.durationSeconds || call.duration || 0;
      const transcript = message.artifact?.transcript || message.transcript || "";
      const analysis = message.analysis || {};
      const summary = analysis.summary || "Vapi Voice Call completed";
      const structuredData = analysis.structuredData || message.structuredData || {};
      const endedReason = (message.endedReason || call.endedReason || "").toLowerCase();
      const isUnanswered = duration < 5 || endedReason.includes("no-answer") || endedReason.includes("did-not-answer") || endedReason.includes("busy") || endedReason.includes("unanswered");

      console.log(`[Vapi End-Of-Call] Caller: ${customerNumber}, Duration: ${duration}s, EndedReason: "${endedReason}", IsUnanswered: ${isUnanswered}`);
      console.log(`[Vapi Transcript] "${transcript.slice(0, 100)}..."`);
      console.log(`[Vapi Summary] "${summary}"`);
      console.log(`[Vapi Structured Requirement]`, JSON.stringify(structuredData));

      const cleanPhone = customerNumber.replace(/[^0-9+]/g, "");
      const isAdwayth = cleanPhone.includes("9633541720") || cleanPhone.includes("8547783493") || (structuredData.telegramUsername && structuredData.telegramUsername.includes("adwayth"));

      // Determine call direction (inbound, outbound, webCall)
      const callDirection = (call.type || call.direction || "inbound").toLowerCase();
      const isInboundOrWeb = callDirection.includes("inbound") || callDirection.includes("web");

      let reqSummary = "";
      let actionTrail = "";
      let callStatus = "New";

      if (isUnanswered) {
        if (isInboundOrWeb) {
          reqSummary = "Inbound call attempted — Disconnected before collecting details";
          actionTrail = `Inbound Vapi call abandoned (${duration}s)`;
          callStatus = "Missed Call (Inbound)";
        } else {
          reqSummary = "Outbound call unanswered — Automated fallback inquiry sent";
          actionTrail = "Vapi Call Unanswered — Fallback Outreach Dispatched";
          callStatus = "Call Unanswered";
        }
      } else {
        // Only include fields that actually exist to avoid hallucinated defaults for short calls
        const loc = structuredData.location ? `Location: ${structuredData.location}` : "Location: Not specified";
        const bhk = structuredData.bedrooms ? `, ${structuredData.bedrooms}BHK` : "";
        const bdgt = structuredData.budget ? `, Budget: ${structuredData.budget}` : "";
        reqSummary = `${loc}${bhk}${bdgt}`;
        if (!structuredData.location && !structuredData.bedrooms && !structuredData.budget) {
          reqSummary = "Call completed — Insufficient requirements gathered";
        }
        
        actionTrail = `${isInboundOrWeb ? 'Inbound' : 'Outbound'} Vapi Call completed (${duration}s)`;
        callStatus = "New";
      }

      // 1. Save or update lead in CRM Store
      let crmLead = leads.find((l) => {
        if (!cleanPhone) return false;
        return l.phone.includes(cleanPhone) || (isAdwayth && (l.phone.includes("9633541720") || l.phone.includes("8547783493")));
      });

      if (!crmLead) {
        crmLead = {
          id: newId("LEAD"),
          source: "voice-vapi",
          name: isAdwayth ? "Adwayth VS (@adwayth2007)" : `Vapi Voice Lead (${cleanPhone.slice(-4)})`,
          phone: cleanPhone ? (cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`) : "+919633541720",
          email: null,
          requirement: reqSummary,
          budget: structuredData.budget || "Under review",
          status: callStatus,
          assignedTo: null,
          createdAt: new Date().toISOString(),
          lastAction: {
            action: actionTrail,
            performedBy: "Vapi AI Voice Agent",
            actorType: "ai",
            timestamp: new Date().toISOString(),
          },
        };
        leads.unshift(crmLead);
      } else {
        crmLead.requirement = reqSummary !== "Call completed — Insufficient requirements gathered" ? reqSummary : crmLead.requirement;
        crmLead.status = callStatus;
        crmLead.lastAction = {
          action: actionTrail,
          performedBy: "Vapi AI Voice Agent",
          actorType: "ai",
          timestamp: new Date().toISOString(),
        };
      }

      // 2. Record conversation history in Store
      let conversation = conversations.find((c) => c.conversationId === cleanPhone || c.customerId === cleanPhone);
      if (!conversation) {
        conversation = {
          conversationId: cleanPhone || "09633541720",
          customerId: cleanPhone || "09633541720",
          channel: "call",
          customerName: crmLead.name,
          messages: [],
          leadProfile: structuredData,
          status: isUnanswered ? "UNANSWERED" : "COMPLETED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        conversations.unshift(conversation);
      }

      if (transcript) {
        conversation.messages.push({
          sender: "system",
          name: "Vapi Transcript",
          text: transcript,
          timestamp: new Date().toISOString(),
        });
      }

      saveToDisk();
      console.log(`✅ [Vapi Webhook] Lead & Conversation saved to database successfully. Status: "${crmLead.status}"`);

      // 3. Trigger Outreach based on Call Answer Status
      setTimeout(async () => {
        try {
          const { generateProposalPdf } = await import("../services/pdfGenerator.js");
          const { client: telegramClient } = await import("../integrations/telegram.js");
          const whatsapp = (await import("../integrations/whatsapp.js")).default;

          if (isUnanswered) {
            // UNANSWERED CALL FALLBACK OUTREACH
            const fallbackMessage = `Hi! 👋 We tried calling you regarding your real estate inquiry with RealtyPulse Agency.\n\nAre you looking to *BUY, RENT, SELL, or RENT OUT* a property?\n\nReply directly here and our AI Assistant will match the best options for you immediately!`;

            if (telegramClient && telegramClient.connected) {
              try {
                const dialogs = await telegramClient.getDialogs({});
                const targetDialog = dialogs.find((d) => d.entity?.username === "Adwayth2007" || (d.title || d.name || "").includes("Adwayth")) || dialogs[0];
                if (targetDialog) {
                  await telegramClient.sendMessage(targetDialog.inputEntity || targetDialog.id, { message: fallbackMessage });
                  console.log(`✅ [Unanswered Call Fallback] Sent Telegram fallback message to "${targetDialog.title || targetDialog.name}"`);
                }
              } catch (tErr) {
                console.warn(`[Telegram Fallback Note] ${tErr.message}`);
              }
            }

            try {
              await whatsapp.sendTextMessage({ toNumber: crmLead.phone, message: fallbackMessage });
              console.log(`✅ [Unanswered Call Fallback] Sent WhatsApp fallback message to ${crmLead.phone}`);
            } catch (waErr) {
              console.warn(`[WhatsApp Fallback Note] ${waErr.message}`);
            }
          } else {
            // ANSWERED CALL: GENERATE PDF PROPOSAL & DISPATCH (TELEGRAM, WHATSAPP, EMAIL)
            const { sendProposalEmail } = await import("../services/emailService.js");
            const { properties } = await import("../data/store.js");

            // Extract email from structuredData
            const clientEmail = structuredData.email || structuredData.emailId || structuredData.customerEmail || crmLead.email;
            if (clientEmail && !crmLead.email) {
              crmLead.email = clientEmail;
              saveToDisk();
            }

            // Match properties from database
            let matchedProps = properties.filter((p) => p.status === "Available").slice(0, 5);

            const propId = `PROP-${Date.now().toString().slice(-6)}`;
            const pdfResult = await generateProposalPdf({
              proposalId: propId,
              customerName: crmLead.name,
              phone: crmLead.phone,
              requirement: structuredData,
              properties: matchedProps,
            });

            const publicBase = process.env.PUBLIC_BASE_URL || "http://localhost:5001";
            const fullPdfUrl = `${publicBase}${pdfResult.pdfUrl}`;

            const proposalMessage = `🏠 *RealtyPulse Property Proposal Catalog*\n\nThank you for speaking with our Voice Assistant, ${crmLead.name}!\nHere is your custom property proposal catalog:\n\n📄 *Download Your PDF Proposal Catalog:* ${fullPdfUrl}\n\nContact us on WhatsApp or reply here on Telegram to book a site visit!`;

            if (telegramClient && telegramClient.connected) {
              try {
                const dialogs = await telegramClient.getDialogs({});
                const targetDialog = dialogs.find((d) => d.entity?.username === "Adwayth2007" || (d.title || d.name || "").includes("Adwayth")) || dialogs[0];
                if (targetDialog) {
                  await telegramClient.sendMessage(targetDialog.inputEntity || targetDialog.id, { message: proposalMessage });
                  console.log(`✅ [Telegram Dispatch Success] Proposal sent to Telegram client "${targetDialog.title || targetDialog.name}" (@Adwayth2007) cleanly!`);
                }
              } catch (tErr) {
                console.warn(`[Telegram Dispatch Note] ${tErr.message}`);
              }
            }

            try {
              await whatsapp.sendTextMessage({ toNumber: crmLead.phone, message: proposalMessage });
              console.log(`✅ [WhatsApp Dispatch Success] Proposal sent to ${crmLead.phone}`);
            } catch (waErr) {
              console.warn(`[WhatsApp Dispatch Note] ${waErr.message}`);
            }

            // AUTO-DISPATCH PROPOSAL EMAIL IF EMAIL COLLECTED
            if (clientEmail) {
              await sendProposalEmail({
                toEmail: clientEmail,
                customerName: crmLead.name,
                proposalId: propId,
                pdfUrl: fullPdfUrl,
                properties: matchedProps,
              });
            }
          }
        } catch (dispatchErr) {
          console.error(`❌ [Vapi Auto Dispatch Error]`, dispatchErr);
        }
      }, 300);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ [Vapi Webhook Exception]", err);
    return res.status(200).json({ ok: true });
  }
});

// POST /api/vapi/outreach -> Trigger Vapi AI Call Bot for a single lead
router.post("/outreach", async (req, res) => {
  const { leadId, phone } = req.body;
  if (!leadId) return res.status(400).json({ error: "leadId is required" });

  try {
    const { claimAndPerformOutreach } = await import("../services/outreachService.js");
    
    // Use the existing outreach service function to trigger the call.
    // Ensure that it's executed even if it was previously claimed or something, 
    // but claimAndPerformOutreach expects it to be pending.
    // Instead, let's just trigger it directly or reset its status if needed, 
    // but the quickest is to queue it for manual trigger.
    
    // For immediate triggering, we can insert a pending log if not exists.
    const { default: db, newUuid } = await import("../data/db.js");
    try {
      db.prepare(`
        INSERT OR IGNORE INTO outreach_log (id, lead_id, channel, type, status, triggered_by, created_at, updated_at)
        VALUES (?, ?, 'call', 'initial_outreach', 'pending', 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(`OUT-${newUuid().slice(0, 8)}`, leadId);
    } catch (e) {}

    // Perform the outreach
    await claimAndPerformOutreach(leadId, "call", "initial_outreach");
    
    res.json({ ok: true, message: "Vapi Call Bot triggered" });
  } catch (err) {
    console.error("[Vapi Manual Outreach Error]", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
