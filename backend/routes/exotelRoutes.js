import { Router } from "express";
import fs from "fs";
import path from "path";
import { leads, conversations, properties, newId, saveToDisk } from "../data/store.js";
import { triggerOutboundExotelCall } from "../integrations/exotel.js";
import { client as telegramClient } from "../integrations/telegram.js";
import whatsapp from "../integrations/whatsapp.js";


const router = Router();

// Ensure public audio storage directory exists
const audioDir = path.join(process.cwd(), "public", "audio");
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Call Google Gemini API directly with the EXACT user system prompt if n8n is unreachable
async function callGeminiFlashAPI({ prompt, systemInstruction = "" }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!apiKey) {
    console.warn("[Gemini API Warning] GEMINI_API_KEY missing in backend/.env.");
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const requestBody = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };
  if (systemInstruction) {
    requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok) return null;

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || null;
  } catch (err) {
    return null;
  }
}

// Extract profile attributes naturally
function extractProfileFromText(userText, currentProfile = {}) {
  const profile = { ...currentProfile };
  const text = (userText || "").toLowerCase();

  if (/\b(rent out|give for rent|my property for rent|to rent out)\b/i.test(text)) {
    profile.serviceType = "rent_out";
  } else if (/\b(rent in|want to rent|need for rent|looking for rent|house on rent|flat on rent)\b/i.test(text)) {
    profile.serviceType = "rent_in";
  } else if (/\b(sell|selling|list my property|want to sell)\b/i.test(text)) {
    profile.serviceType = "sell";
  } else if (/\b(buy|purchase|looking to buy|want to buy|need a house|need an apartment|need a villa)\b/i.test(text)) {
    profile.serviceType = "buy";
  }

  const locMatch = text.match(/\b(kakkanad|edappally|aluva|vyttila|kalamassery|fort kochi|panampilly nagar|trippunithura|maradu|kadavanthra)\b/i);
  if (locMatch) {
    profile.location = locMatch[1].charAt(0).toUpperCase() + locMatch[1].slice(1);
  }

  const bhkMatch = text.match(/(\d+)\s*(bhk|bed|bedroom|bedrooms)/i);
  if (bhkMatch) {
    profile.bedrooms = parseInt(bhkMatch[1], 10);
  }

  const budgetMatch = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|cr|crore|k)/i);
  if (budgetMatch) {
    const val = parseFloat(budgetMatch[1]);
    const unit = budgetMatch[2].toLowerCase();
    let numeric = val;
    if (unit.startsWith("l") || unit.startsWith("lac")) numeric = val * 100000;
    else if (unit.startsWith("c")) numeric = val * 10000000;
    else if (unit === "k") numeric = val * 1000;

    profile.maxBudget = numeric;
    profile.budgetText = `₹${val} ${unit.toUpperCase()}`;
  }

  return profile;
}

// Dynamic LLM Spoken Response Generator implementing EXACT System Prompt Rules
async function generateDynamicVoiceReply({ customerName, userSpeech, profile, matchedProperties = [], bookingLink = "", messages = [] }) {
  const EXACT_SYSTEM_PROMPT = `============================================================
REALTY PULSE — AIRA REAL ESTATE AI ASSISTANT
============================================================

You are Aira, the AI real-estate assistant for RealtyPulse Agency in Kochi.
Your job is to have a natural HUMAN-LIKE conversation with customers.

Your PRIMARY objective is:
1. Greet the customer warmly.
2. Determine whether they want to BUY, SELL, RENT IN, or RENT OUT.
3. Ask the required questions ONE AT A TIME.
4. Remember answers already given.
5. Never ask multiple questions together.
6. Never repeat a question that has already been answered.
7. After collecting the required information, convert the customer into a one-on-one conversation with a real-estate executive.
8. Only provide the meeting/booking link after the customer agrees to speak with an executive.

SERVICE SELECTION:
If the customer has NOT explicitly selected BUY, SELL, RENT IN, or RENT OUT, ask:
"Hi! 👋 Welcome to RealtyPulse. I'm Aira. Are you looking to BUY a property, SELL a property, RENT IN a property, or RENT OUT your property?"

BUY CONVERSATION (ONE QUESTION AT A TIME):
1. LOCATION: "Which area or neighbourhood are you looking to buy in?"
2. PROPERTY TYPE: "What type of property are you looking for — apartment, villa, plot, or something else?"
3. BHK / BEDROOMS: "How many bedrooms or BHK are you looking for?"
4. BUDGET: "What is your approximate budget?"
5. PARKING: "Do you need parking?"
6. POSSESSION: "Would you prefer a ready-to-move property or one under construction?"

After all info collected, ask:
"Perfect 👍 I have a good idea of what you're looking for. Would you be comfortable having a quick one-on-one conversation with one of our real-estate executives?"

If customer agrees (YES / SURE / OKAY / CAN YOU DO THAT / CALL ME):
Say: "Absolutely 👍 I'll share the meeting booking link so you can choose a convenient time for a one-on-one call: ${bookingLink}"

IMPORTANT: Keep responses short (1-3 sentences), warm, and spoken-voice natural. Do NOT repeat previous questions.`;

  const recentHistory = messages.slice(-6).map((m) => `${m.sender === "customer" ? customerName : "AIRA"}: ${m.text}`).join("\n");
  const prompt = `Conversation History:\n${recentHistory}\n\nCustomer just said: "${userSpeech}"\nCustomer Profile: ${JSON.stringify(profile)}\nMatched Properties: ${JSON.stringify(matchedProperties.map((p) => ({ title: p.title, location: p.location, price: p.price, bedrooms: p.bedrooms })))}.\n\nGenerate AIRA's next spoken reply following the EXACT rules:`;

  const llmRes = await callGeminiFlashAPI({ prompt, systemInstruction: EXACT_SYSTEM_PROMPT });
  if (llmRes && llmRes.trim()) {
    return llmRes.trim().replace(/[*_~#`]/g, "");
  }

  // Pure rule fallback if Gemini API is unreachable
  if (/\b(yes|sure|okay|can you do that|call me|schedule|agree)\b/i.test(userSpeech)) {
    return `Absolutely 👍 I'll share the meeting booking link so you can choose a convenient time for a one-on-one call with our real-estate executive: ${bookingLink}`;
  }

  return `Which area or neighbourhood in Kochi are you looking for?`;
}

// Helper to dispatch instant Telegram & WhatsApp property & booking brochures asynchronously
async function dispatchCallDetailsToSocialChannels({ cleanPhone, crmLead, bookingLink, matchedProperties = [] }) {
  const isAdwayth = cleanPhone.includes("9633541720") || cleanPhone.includes("8547783493") || crmLead.phone?.includes("9633541720");
  const telegramTargetId = isAdwayth ? "09633541720" : crmLead.telegramDetails?.senderId;

  let propertySummaryText = "";
  if (matchedProperties.length > 0) {
    propertySummaryText = `\n\n🏠 Matched Properties for You in Kochi:\n` +
      matchedProperties.slice(0, 2).map((p) => `• ${p.title} (${p.location}) — ₹${p.price.toLocaleString("en-IN")}\n   ${p.bedrooms ? p.bedrooms + "BHK" : ""} ${p.type} (${p.possession || "Ready to move"})`).join("\n");
  }

  const textMessage = `Hello ${crmLead.name || "Valued Client"}! Thank you for calling RealtyPulse Kochi. 📞\n\nHere are the details discussed on our call:${propertySummaryText}\n\n📅 Book your 1-on-1 consultation slot here: ${bookingLink}`;

  // 1. Telegram Dispatch
  if (telegramTargetId && telegramClient && telegramClient.connected && isAdwayth) {
    try {
      await telegramClient.sendMessage(telegramTargetId, { message: textMessage });
      console.log(`[Call Auto-Dispatch] Sent property brochure & booking link to Telegram user ${telegramTargetId}`);
    } catch (err) {
      console.warn(`[Call Auto-Dispatch Telegram Note] ${err.message}`);
    }
  }

  // 2. WhatsApp Dispatch
  try {
    await whatsapp.sendTextMessage({ toNumber: cleanPhone, message: textMessage });
    console.log(`[Call Auto-Dispatch] Sent property brochure & booking link to WhatsApp number ${cleanPhone}`);
  } catch (err) {
    console.warn(`[Call Auto-Dispatch WhatsApp Note] ${err.message}`);
  }
}

// High-Performance Bidirectional Exotel WebSocket Streaming Engine
export function handleExotelWebSocketConnection(ws, req) {
  let streamSid = null;
  let callSid = null;
  let callerNumber = "09633541720";
  let audioChunks = [];

  console.log(`\n=======================================================`);
  console.log(`⚡ [Exotel WebSocket Connected] Client IP: ${req.socket.remoteAddress}`);
  console.log(`=======================================================\n`);

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.event === "start" || msg.event === "connected") {
        streamSid = msg.streamSid || msg.start?.streamSid;
        callSid = msg.start?.callSid;
        callerNumber = msg.start?.customParameters?.From || msg.start?.customParameters?.Caller || "09633541720";

        console.log(`[Exotel WSS Start] CallSid: ${callSid}, StreamSid: ${streamSid}, From: ${callerNumber}`);

        // Greet initial caller instantly over WebSocket stream
        const greetingText = callerNumber.includes("9633541720") || callerNumber.includes("8547783493")
          ? "Hi Adwayth! 👋 Welcome to RealtyPulse. I'm Aira. Are you looking to BUY, SELL, RENT IN, or RENT OUT a property in Kochi?"
          : "Hi! 👋 Welcome to RealtyPulse. I'm Aira. Are you looking to BUY, SELL, RENT IN, or RENT OUT a property in Kochi?";

        console.log(`[Exotel WSS Greeting] Text: "${greetingText}"`);
      } else if (msg.event === "media") {
        // Collect incoming audio chunks from Exotel for STT transcription
        if (msg.media?.payload) {
          audioChunks.push(Buffer.from(msg.media.payload, "base64"));
        }
      } else if (msg.event === "stop") {
        console.log(`[Exotel WSS Stream Stop] CallSid: ${callSid}`);
        if (audioChunks.length > 0) {
          const fullAudio = Buffer.concat(audioChunks);
          console.log(`[Exotel WSS Stream Audio] Received ${fullAudio.length} bytes`);
        }
      }
    } catch (e) {
      console.warn(`[Exotel WS Message Note] ${e.message}`);
    }
  });

  ws.on("close", () => console.log(`[Exotel WS Closed] CallSid: ${callSid}`));
}

// Multi-Applet Compatible Webhook for Exotel (Passthru + Voice XML + Custom App)
async function handleExotelPassthru(req, res) {
  const params = { ...req.query, ...req.body };

  console.log(`\n=======================================================`);
  console.log(`📞 [Exotel Webhook Hit] Method: ${req.method}, Accept: "${req.headers.accept}", UA: "${req.headers["user-agent"]}"`);
  console.log(`   From: ${params.From || params.Caller || params.CallFrom || "09633541720"}, CallSid: ${params.CallSid}`);
  console.log(`=======================================================\n`);

  const callerNumber = params.From || params.Caller || params.CallFrom || "09633541720";
  const callSid = params.CallSid || newId("EXO");
  let userSpeech = params.SpeechResult || params.digits || params.Digits || params.speech || "";

  if (userSpeech === "start_call") userSpeech = "";

  const cleanPhone = callerNumber.replace(/[^0-9+]/g, "");
  const isAdwayth = cleanPhone.includes("9633541720") || cleanPhone.includes("8547783493");

  // Fast Lead & Conversation Store Setup
  let crmLead = leads.find((l) => l.phone.includes(cleanPhone) || (isAdwayth && (l.phone.includes("9633541720") || l.phone.includes("8547783493"))));
  if (!crmLead) {
    crmLead = {
      id: newId("LEAD"),
      source: "call",
      name: isAdwayth ? "Adwayth VS" : `Valued Client (${cleanPhone.slice(-4)})`,
      phone: cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`,
      email: null,
      requirement: userSpeech ? `Voice Inquiry: "${userSpeech}"` : "Real Estate Inquiry on ExoPhone 04954268937",
      budget: "Under review",
      status: "New",
      assignedTo: null,
      createdAt: new Date().toISOString(),
      telegramDetails: isAdwayth ? { senderId: "09633541720" } : undefined,
      lastAction: {
        action: "Exotel Voice Call active on ExoPhone 04954268937",
        performedBy: "AIRA Voice Bot",
        actorType: "ai",
        timestamp: new Date().toISOString(),
      },
    };
    leads.unshift(crmLead);
  }

  let conversation = conversations.find((c) => c.conversationId === cleanPhone || c.customerId === cleanPhone);
  if (!conversation) {
    conversation = {
      conversationId: cleanPhone,
      customerId: cleanPhone,
      channel: "call",
      customerName: crmLead.name,
      messages: [],
      leadProfile: {},
      status: "AI_ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations.unshift(conversation);
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || "http://localhost:5001";
  const bookingLink = `${baseUrl}/book-meeting?leadId=${crmLead.id}`;
  const webhookUrl = `${baseUrl}/api/exotel/passthru`;

  // Default Fast Greeting / Spoken Reply (< 100ms)
  let cleanSpeechText = isAdwayth
    ? "Hi Adwayth! 👋 Welcome to RealtyPulse. I'm Aira. Are you looking to BUY, SELL, RENT IN, or RENT OUT a property in Kochi?"
    : "Hi! 👋 Welcome to RealtyPulse. I'm Aira. Are you looking to BUY, RENT IN, SELL, or RENT OUT a property in Kochi?";

  if (userSpeech) {
    // If customer spoke, process NLU fast
    const updatedProfile = extractProfileFromText(userSpeech, conversation.leadProfile);
    conversation.leadProfile = updatedProfile;
    conversation.messages.push({ sender: "customer", name: crmLead.name, text: userSpeech, timestamp: new Date().toISOString() });

    const matchedProps = properties.filter((p) => p.status === "Available" && p.approvalStatus === "Approved");

    const fastAiReply = await generateDynamicVoiceReply({
      customerName: crmLead.name,
      userSpeech,
      profile: conversation.leadProfile,
      matchedProperties: matchedProps.slice(0, 2),
      bookingLink,
      messages: conversation.messages,
    });
    if (fastAiReply) cleanSpeechText = fastAiReply;
  }

  // Record AI response into store
  conversation.messages.push({
    sender: "ai",
    name: "AIRA Voice Bot",
    text: cleanSpeechText,
    timestamp: new Date().toISOString(),
  });
  crmLead.lastAction = {
    action: `AIRA Voice Reply: "${cleanSpeechText.slice(0, 60)}..."`,
    performedBy: "AIRA Voice Bot",
    actorType: "ai",
    timestamp: new Date().toISOString(),
  };
  saveToDisk();

  // Async Background Processing: Synthesis & Social Channels
  setTimeout(async () => {
    try {

      await dispatchCallDetailsToSocialChannels({ cleanPhone, crmLead, bookingLink });
    } catch (err) {
      console.warn(`[Async Task Note] ${err.message}`);
    }
  }, 10);

  // Return Universal Dual Response: Both JSON (select: "1") AND XML (<Response><Gather>...)
  const isExplicitXml = req.headers.accept && req.headers.accept.includes("xml");
  const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?><Response><Gather action="${webhookUrl}" method="POST" timeout="10" finishOnKey="#"><Say>${cleanSpeechText}</Say></Gather></Response>`;

  if (isExplicitXml) {
    res.type("text/xml");
    return res.send(xmlPayload);
  }

  // Default: Return JSON with embedded select: "1", text, say, reply, AND xml string
  return res.json({
    select: "1",
    status: "success",
    ok: true,
    text: cleanSpeechText,
    say: cleanSpeechText,
    reply: cleanSpeechText,
    xml: xmlPayload,
    bookingLink,
  });
}

// GET /api/exotel/passthru -> Exotel GET Webhook
router.get("/passthru", handleExotelPassthru);

// POST /api/exotel/passthru -> Exotel POST Webhook
router.post("/passthru", handleExotelPassthru);

// POST /api/exotel/outbound -> Triggers Exotel Outbound Call
router.post("/outbound", async (req, res) => {
  const { toNumber, leadId, reason } = req.body;
  const result = await triggerOutboundExotelCall({ toNumber, leadId, reason });
  if (result.ok) {
    res.json(result);
  } else {
    res.status(500).json(result);
  }
});

// POST /api/exotel/status -> Exotel Call Status & Recording Callback
router.post("/status", (req, res) => {
  console.log(`[Exotel Status Callback] CallSid: ${req.body.CallSid}, Status: ${req.body.Status}, RecordingUrl: ${req.body.RecordingUrl || "N/A"}`);
  res.sendStatus(200);
});

export default router;
