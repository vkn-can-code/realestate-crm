import { Router } from "express";
import os from "os";
import db, { newUuid } from "../data/db.js";
import { leads, properties, conversations, newId, saveToDisk } from "../data/store.js";
import { processNativeAiChat } from "../services/aiChatService.js";
import { client as telegramClient, sendTelegramMessageByPhone } from "../integrations/telegram.js";
import { buildOutreachMessage } from "./leads.js";

const router = Router();

function getDynamicPublicBaseUrl() {
  const envUrl = process.env.PUBLIC_BASE_URL;
  if (envUrl && !envUrl.includes("192.168.")) {
    return envUrl;
  }
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return `http://${iface.address}:5173`;
      }
    }
  }
  return envUrl || "http://localhost:5173";
}

// Live AI Engine Status Tracker
export const aiEngineStatus = {
  lastAnsweredBy: "n8n_ai", // "n8n_ai" | "gemini_api" | "system_fallback"
  engineLabel: "n8n AI Agent",
  isQuotaExceeded: false,
  lastQuotaErrorAt: null,
  lastResponseTimestamp: new Date().toISOString(),
};

// Business Knowledge Base (RAG context source)
const BUSINESS_KB = {
  company: "RealtyPulse Real Estate Agency",
  officeHours: "Monday to Saturday, 9:00 AM - 7:00 PM IST",
  location: "Kakkanad & MG Road, Kochi, Kerala",
  services: [
    "1. Buy Residential & Commercial Properties",
    "2. Rent In Apartments, Villas & Office Spaces (Tenant Renting)",
    "3. Sell My Property (Client Property Listing for Sale)",
    "4. Rent Out My Property (Client Property Listing for Renting Out)",
  ],
  servicesGuidance: {
    homeLoans: "We provide complete home loan assistance with interest rates starting at 8.4% through HDFC, SBI, and ICICI Bank.",
    legalVerification: "All property documents undergo strict legal title verification by our advocate team before listing.",
    siteVisits: "We arrange free chauffeured site visits 7 days a week between 9 AM and 6 PM.",
    bookingProcess: "Properties can be reserved with a 1% token advance after physical or virtual site inspection.",
    clientListings: "Clients listing properties to sell or rent out will have their submissions auto-saved to our CRM property database for admin review.",
  },
};

// Helper: Time-of-day greeting
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

// Tool: Property Search Engine (for Buy & Rent In)
function executePropertySearch(filters = {}) {
  const { location, bedrooms, maxBudget, minBudget, propertyType, parking, possession, listingIntent } = filters;

  if (!location && !bedrooms && !maxBudget && !minBudget && !propertyType && !listingIntent) {
    return [];
  }

  return properties.filter((prop) => {
    if (prop.status !== "Available" && prop.approvalStatus !== "Approved") return false;

    if (listingIntent && prop.listingIntent !== listingIntent) {
      return false;
    }
    if (location && !prop.location.toLowerCase().includes(location.toLowerCase())) {
      return false;
    }
    if (bedrooms && prop.bedrooms !== Number(bedrooms)) {
      return false;
    }
    if (maxBudget && prop.price > Number(maxBudget)) {
      return false;
    }
    if (minBudget && prop.price < Number(minBudget)) {
      return false;
    }
    if (propertyType && !prop.type.toLowerCase().includes(propertyType.toLowerCase())) {
      return false;
    }
    if (parking !== undefined && parking !== null && prop.parking !== Boolean(parking)) {
      return false;
    }
    if (possession && prop.possession !== possession) {
      return false;
    }
    return true;
  });
}

// NLU Extractor — Extracts intent & lead profile attributes naturally
function extractProfileFromNaturalText(userText, currentProfile = {}) {
  const profile = { ...currentProfile };
  const text = (userText || "").toLowerCase();

  // Explicit Service Selection Detection (BUY vs SELL vs RENT IN vs RENT OUT)
  if (/\b(rent out|give for rent|my property for rent|tenants for my|to rent out)\b/i.test(text)) {
    profile.serviceType = "rent_out";
  } else if (/\b(rent in|want to rent|need for rent|looking for rent|house on rent|apartment on rent)\b/i.test(text)) {
    profile.serviceType = "rent_in";
  } else if (/\b(sell|selling|list my property|want to sell|have a property to sell)\b/i.test(text)) {
    profile.serviceType = "sell";
  } else if (/\b(buy|purchase|looking to buy|want to buy|need a house|need an apartment|need a villa|buy a plot)\b/i.test(text)) {
    profile.serviceType = "buy";
  }

  // Location Detection
  const locationMatch = text.match(/\b(kakkanad|edappally|aluva|vyttila|vytila|mg road|kalamassery|fort kochi|panampilly nagar|trippunithura|maradu|kadavanthra|chittoor)\b/i);
  if (locationMatch) {
    profile.location = locationMatch[1].charAt(0).toUpperCase() + locationMatch[1].slice(1);
  }

  // BHK / Bedrooms Detection
  const bhkMatch = text.match(/(\d+)\s*(bhk|bed|bedroom|bedrooms)/i);
  if (bhkMatch) {
    profile.bedrooms = parseInt(bhkMatch[1], 10);
  }

  // Property Type Detection
  if (text.includes("apartment") || text.includes("flat")) profile.propertyType = "Apartment";
  else if (text.includes("villa") || text.includes("house")) profile.propertyType = "Villa";
  else if (text.includes("commercial") || text.includes("office") || text.includes("shop")) profile.propertyType = "Commercial";
  else if (text.includes("plot") || text.includes("land")) profile.propertyType = "Plot";

  // Budget / Expected Price Detection
  const budgetMatch = text.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|cr|crore|crores|k|thousand)/i);
  if (budgetMatch) {
    const val = parseFloat(budgetMatch[1]);
    const unit = budgetMatch[2].toLowerCase();
    let numeric = val;
    if (unit.startsWith("l") || unit.startsWith("lac")) numeric = val * 100000;
    else if (unit.startsWith("c")) numeric = val * 10000000;
    else if (unit === "k" || unit.startsWith("thou")) numeric = val * 1000;

    profile.maxBudget = numeric;
    profile.budgetText = `₹${val} ${unit.charAt(0).toUpperCase() + unit.slice(1)}`;
  }

  // Email Address Extraction
  const emailMatch = (userText || "").match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    profile.email = emailMatch[1].toLowerCase();
  }

  // Possession Preference Detection
  if (/\b(ready to move|ready|immediate|immediate move|move in)\b/i.test(text)) {
    profile.possession = "ready_to_move";
  } else if (/\b(under construction|upcoming|construction|possession in|future)\b/i.test(text)) {
    profile.possession = "under_construction";
  }

  return profile;
}

// Call Google Gemini API
export async function callGeminiFlashAPI({ prompt, systemInstruction = "", generationConfig = null }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

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
  if (generationConfig) {
    requestBody.generationConfig = generationConfig;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn(`[Gemini API Error] ${data.error?.message || res.statusText}`);
      return null;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return { text, engine: "gemini_api" };
  } catch (err) {
    console.warn(`[Gemini API Exception] ${err.message}`);
    return null;
  }
}

// Clean display name
function getCleanName(rawName) {
  if (!rawName || /^(boss|me|client|customer|unknown)$/i.test(rawName.trim())) {
    return "there";
  }
  return rawName.trim();
}

// Offline Fallback Response Generator with Context Awareness
async function generateHumanSalesResponse(rawCustomerName, profile, matchedProps, userMessage, leadId = "", historyMessages = []) {
  const customerName = getCleanName(rawCustomerName);
  const baseUrl = getDynamicPublicBaseUrl();
  const bookingLink = `${baseUrl}/book-meeting?leadId=${leadId}`;

  const prompt = `You are Aira, senior property advisor at RealtyPulse Real Estate Agency.
Customer Name: ${customerName}
Customer Message: "${userMessage}"
Extracted Profile: ${JSON.stringify(profile)}
Matched Properties Found: ${matchedProps.length}

Generate a short, natural, friendly, 1-2 sentence real estate response.
If they specified an intent (buy / rent in / sell / rent out), acknowledge it and ask a relevant clarifying question (location, BHK, or budget).
If properties matched, mention you have great options available in their area!`;

  const resText = await callGeminiFlashAPI({ prompt, systemInstruction: "Be a warm, highly professional real estate sales consultant." });

  if (resText?.text) {
    return { text: resText.text.trim(), engine: "gemini_api" };
  }

  // Smart Contextual Fallback (if API is unreachable)
  let fallbackReply = `Hello ${customerName}! I'm Aira from RealtyPulse. How can we help you with your property needs today?`;

  const msgLower = (userMessage || "").toLowerCase();
  if (profile?.serviceType === "buy" || /\b(buy|buying|purchase)\b/i.test(msgLower)) {
    if (profile?.location) {
      fallbackReply = `Great choice! We have excellent properties available for purchase in ${profile.location}. What BHK configuration or budget range do you have in mind?`;
    } else {
      fallbackReply = `Understood! 👍 We have top residential & commercial properties for sale across Kakkanad, Edappally, Aluva, and central Ernakulam. Which area are you looking to buy in?`;
    }
  } else if (profile?.serviceType === "rent_in" || /\b(rent in|want to rent|need rent)\b/i.test(msgLower)) {
    if (profile?.location) {
      fallbackReply = `Got it! 👍 We have furnished apartments & houses for rent in ${profile.location}. Are you looking for a 1BHK, 2BHK, or 3BHK?`;
    } else {
      fallbackReply = `Sure thing! We have prime rental properties across Kakkanad (Infopark), Edappally, and MG Road. Which area or neighbourhood do you prefer?`;
    }
  } else if (profile?.serviceType === "sell" || profile?.serviceType === "rent_out" || /\b(sell|rent out)\b/i.test(msgLower)) {
    fallbackReply = `We can definitely assist you in listing your property for ${profile.serviceType === "sell" ? "sale" : "rent"}! Could you share the property location and expected price?`;
  }

  return {
    text: fallbackReply,
    engine: "system_fallback",
  };
}

// GET /api/ai/briefing/:id -> Retrieves Saved Summaries & Live Messages (Zero Automatic API Call)
router.get("/briefing/:id", (req, res) => {
  const { id } = req.params;
  const cleanId = id.replace("telegram:", "").trim();

  const lead = leads.find(
    (l) => l.id === id || l.id === cleanId || (l.phone && l.phone.includes(cleanId))
  );

  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const conversation = conversations.find(
    (c) => c.conversationId === id || c.customerId === cleanId
  );

  let messages = conversation ? conversation.messages : [];
  if (!messages || messages.length === 0) {
    const baseUrl = getDynamicPublicBaseUrl();
    messages = [
      {
        sender: "customer",
        name: lead.name,
        text: `Inquiry via ${lead.source.toUpperCase()}: ${lead.requirement || "Interested in property listing"}`,
        timestamp: lead.createdAt || new Date().toISOString(),
      },
      {
        sender: "ai",
        name: "RealtyPulse AI Bot",
        text: `Hello ${lead.name}! Welcome to RealtyPulse. We received your requirement for ${lead.requirement || "properties"}. Budget recorded: ${lead.budget || "Under review"}.\n\n📅 You can book a consultation slot here: ${baseUrl}/book-meeting?leadId=${lead.id}`,
        timestamp: lead.createdAt || new Date().toISOString(),
      },
    ];
  }

  const summaries = lead.summaries || [];
  const defaultSummaryText = summaries.length > 0
    ? summaries[summaries.length - 1].text
    : `Client ${lead.name} is inquiring about ${lead.requirement || "properties"} with budget ${lead.budget || "under review"}. Currently in ${lead.status} stage.`;

  const suggestedReply = `Hello ${lead.name}, this is ${lead.assignedToName || "our property advisor"} from RealtyPulse! I reviewed your requirement for ${lead.requirement || "properties"}. Would you be free for a quick call today to discuss top options?`;

  res.json({
    leadId: lead.id,
    leadName: lead.name,
    channel: lead.source,
    summary: defaultSummaryText,
    summaries,
    suggestedReply,
    messages,
    leadProfile: conversation?.leadProfile || { budget: lead.budget, requirement: lead.requirement },
  });
});

// POST /api/ai/summarize-lead/:id -> ON-DEMAND INCREMENTAL SUMMARIZATION (Triggered ONLY on user button click)
router.post("/summarize-lead/:id", async (req, res) => {
  const { id } = req.params;
  const cleanId = id.replace("telegram:", "").trim();

  const lead = leads.find(
    (l) => l.id === id || l.id === cleanId || (l.phone && l.phone.includes(cleanId))
  );

  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const conversation = conversations.find(
    (c) => c.conversationId === id || c.customerId === cleanId
  );

  let messages = conversation ? conversation.messages : [];
  if (!messages || messages.length === 0) {
    messages = [
      {
        sender: "customer",
        name: lead.name,
        text: `Inquiry via ${lead.source.toUpperCase()}: ${lead.requirement || "Interested in property listing"}`,
        timestamp: lead.createdAt || new Date().toISOString(),
      },
    ];
  }

  if (!lead.summaries) {
    lead.summaries = [];
  }

  const existingSummaries = lead.summaries;
  const summaryCount = existingSummaries.length;

  let prompt = "";
  let previousSummaryText = "";

  if (summaryCount === 0) {
    // FIRST SUMMARY (Summary 1)
    prompt = `You are a real estate AI assistant summarizing a customer conversation for sales managers.
Customer Name: ${lead.name}
Channel: ${lead.source}
Requirement: ${lead.requirement || "Under inquiry"}
Budget: ${lead.budget || "Not set"}

Full Conversation Transcript:
${messages.map((m) => `${m.name} (${m.sender}): ${m.text}`).join("\n")}

Please provide a concise, structured executive summary (Summary 1) covering:
1. Customer Intent (Buy / Sell / Rent In / Rent Out)
2. Requirements & Preferences (Location, BHK, Property Type, Budget)
3. Current Stage & Next Recommended Action.`;
  } else {
    // INCREMENTAL SUMMARY (Summary 2, Summary 3, etc.)
    const lastSummary = existingSummaries[summaryCount - 1];
    const lastMessageCount = lastSummary.messageCountAtSummary || 0;
    const newMessages = messages.slice(lastMessageCount);

    if (newMessages.length === 0) {
      return res.json({
        ok: true,
        summaries: lead.summaries,
        latestSummary: lastSummary,
        note: "No new messages since last summary. Reused saved summary without extra API cost.",
      });
    }

    previousSummaryText = lastSummary.text;

    prompt = `You are an AI sales assistant creating an updated conversation summary.
You MUST preserve and build upon the previous summary without re-reading old messages.

PREVIOUS SAVED SUMMARY (${lastSummary.title}):
${previousSummaryText}

NEW CHAT MESSAGES RECEIVED SINCE PREVIOUS SUMMARY:
${newMessages.map((m) => `${m.name} (${m.sender}): ${m.text}`).join("\n")}

Combine the previous summary and the new chat messages into an updated, structured executive summary (Summary ${summaryCount + 1}). Focus on new requirements, changes, or progress made.`;
  }

  const systemInstruction = `You are an executive real estate AI assistant creating structured, high-value conversation summaries for sales managers.
CAVEMAN COMPRESSION MODE:
Respond terse like smart caveman. All technical substance stay. Only fluff die. Drop articles, filler, pleasantries, hedging. Fragments OK. Keep performance fast by outputting bare minimum tokens necessary to convey the same meaning.`;

  const rawGeminiRes = await callGeminiFlashAPI({ prompt, systemInstruction });
  const summaryText = rawGeminiRes?.text || `Summary ${summaryCount + 1}: Customer ${lead.name} inquired via ${lead.source.toUpperCase()} for ${lead.requirement || "properties"}. Total messages processed: ${messages.length}.`;

  const newSummary = {
    id: summaryCount + 1,
    title: `Summary ${summaryCount + 1}`,
    text: summaryText,
    messageCountAtSummary: messages.length,
    createdAt: new Date().toISOString(),
  };

  lead.summaries.push(newSummary);
  saveToDisk();

  res.json({
    ok: true,
    summaries: lead.summaries,
    latestSummary: newSummary,
  });
});

// POST /api/ai/incoming -> Core AI Entrypoint
router.post("/incoming", async (req, res) => {
  const { channel, conversationId, customerId, customerName, message, timestamp } = req.body;

  if (!message || !conversationId) {
    return res.status(400).json({ error: "conversationId and message are required" });
  }

  // 1. Retrieve or create persistent conversation memory
  let conversation = conversations.find((c) => c.conversationId === conversationId);
  if (!conversation) {
    conversation = {
      conversationId,
      customerId: customerId || conversationId,
      channel: channel || "telegram",
      customerName: customerName || "Customer",
      messages: [],
      leadProfile: {},
      status: "AI_ACTIVE",
      createdAt: timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations.unshift(conversation);
  }

  // Record incoming customer message
  conversation.messages.push({
    sender: "customer",
    name: customerName || "Customer",
    text: message,
    timestamp: timestamp || new Date().toISOString(),
  });

  if (conversation.status === "HUMAN_HANDOFF") {
    return res.json({
      reply: null,
      status: "HUMAN_HANDOFF",
      note: "Human agent active on this conversation thread.",
    });
  }

  // 2. Extract profile attributes naturally
  const updatedProfile = extractProfileFromNaturalText(message, conversation.leadProfile);
  conversation.leadProfile = updatedProfile;

  // If customer is submitting property details to Sell or Rent Out, auto-ingest into DB
  if ((updatedProfile.serviceType === "sell" || updatedProfile.serviceType === "rent_out") && updatedProfile.location && (updatedProfile.maxBudget || updatedProfile.bedrooms)) {
    const existingSub = properties.find(p => p.clientSubmission && p.clientSubmission.clientPhone === customerId);
    if (!existingSub) {
      const intent = updatedProfile.serviceType;
      properties.unshift({
        id: newId("PROP"),
        title: `${updatedProfile.bedrooms ? updatedProfile.bedrooms + "BHK " : ""}${updatedProfile.propertyType || "Property"} in ${updatedProfile.location} (Client Listing)`,
        location: updatedProfile.location,
        price: updatedProfile.maxBudget || 0,
        type: updatedProfile.propertyType || "Apartment",
        bedrooms: updatedProfile.bedrooms || 2,
        area: "Client Submission",
        description: `Property submitted by ${customerName} for ${intent === "sell" ? "sale" : "renting out"}.`,
        images: [],
        status: "Pending_Approval",
        listingIntent: intent,
        approvalStatus: "Pending",
        clientSubmission: {
          clientName: customerName,
          clientPhone: customerId,
          askingPrice: intent === "sell" ? updatedProfile.budgetText : null,
          expectedRent: intent === "rent_out" ? updatedProfile.budgetText : null,
          channel: channel || "telegram",
          submittedAt: new Date().toISOString(),
        },
      });
      console.log(`[Auto DB Ingestion] Client ${customerName}'s property automatically saved for ${intent}!`);
    }
  }

  // 3. Search Property DB ONLY IF specific search parameters exist
  const matchedProps = (updatedProfile.location || updatedProfile.bedrooms || updatedProfile.maxBudget)
    ? executePropertySearch({
      location: updatedProfile.location,
      bedrooms: updatedProfile.bedrooms,
      maxBudget: updatedProfile.maxBudget,
      listingIntent: updatedProfile.serviceType === "rent_in" ? "rent_in" : "buy",
    })
    : [];

  // 4. Update or create CRM Lead
  let crmLead = leads.find((l) => l.phone.includes(customerId) || (l.telegramDetails && l.telegramDetails.senderId === customerId));
  const reqSummary = [
    updatedProfile.bedrooms ? `${updatedProfile.bedrooms}BHK` : null,
    updatedProfile.propertyType || "Property",
    updatedProfile.location ? `in ${updatedProfile.location}` : null,
    updatedProfile.serviceType ? `(${updatedProfile.serviceType.toUpperCase()})` : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (crmLead) {
    if (customerName && customerName !== "Customer" && crmLead.name === "Telegram User") {
      crmLead.name = customerName;
    }
    if (updatedProfile.email) crmLead.email = updatedProfile.email;
    if (updatedProfile.location) crmLead.location = updatedProfile.location;
    if (updatedProfile.propertyType) crmLead.propertyType = updatedProfile.propertyType;
    if (updatedProfile.bedrooms) crmLead.bedrooms = updatedProfile.bedrooms;
    if (updatedProfile.possession) crmLead.possession = updatedProfile.possession;
    if (reqSummary) crmLead.requirement = reqSummary;
    if (updatedProfile.budgetText) crmLead.budget = updatedProfile.budgetText;
    crmLead.lastAction = {
      action: "Natural AI Conversation updated profile",
      performedBy: "Gemini AI Agent",
      actorType: "ai",
      timestamp: new Date().toISOString(),
    };
    
    // Check if profile is complete enough for a proposal and we haven't sent one recently
    if (crmLead.location && (crmLead.budget || updatedProfile.maxBudget) && !crmLead.proposalAutoGenerated) {
      crmLead.proposalAutoGenerated = true;
      console.log(`[AI Profiling] Profile complete for ${crmLead.name}. Triggering Proposal Generation.`);
      
      // We will generate the PDF asynchronously
      import("../services/pdfGenerator.js").then(({ generateProposalPdf }) => {
        generateProposalPdf({
          proposalId: `PROP-${Date.now().toString().slice(-6)}`,
          customerName: crmLead.name,
          phone: crmLead.phone,
          requirement: {
            location: crmLead.location,
            budget: updatedProfile.maxBudget,
            bedrooms: crmLead.bedrooms,
            listingIntent: updatedProfile.serviceType === "rent_in" ? "rent_in" : "buy"
          },
          properties: matchedProps.slice(0, 5) // Extracted on line 501
        }).then(async (pdfResult) => {
          const publicBase = process.env.PUBLIC_BASE_URL || "http://localhost:5001";
          const fullPdfUrl = `${publicBase}${pdfResult.pdfUrl}`;
          
          if (channel === "telegram") {
            import("../integrations/telegram.js").then(async ({ client }) => {
              if (client && client.connected) {
                console.log(`[Telegram] Sending Auto-Generated PDF proposal to ${customerId}`);
                const msg = `Here is a custom property proposal based on your complete requirements:\n${fullPdfUrl}`;
                try {
                  if (pdfResult.filePath) {
                    await client.sendMessage(customerId, { message: "Here is your custom property proposal based on your requirements!", file: pdfResult.filePath });
                  } else {
                    await client.sendMessage(customerId, { message: msg });
                  }
                } catch(e) { console.error("[Telegram PDF error]", e); }
              }
            });
          }
          
          if (crmLead.email) {
            import("../services/emailService.js").then(async ({ sendProposalEmail }) => {
              try {
                await sendProposalEmail({
                  toEmail: crmLead.email,
                  customerName: crmLead.name,
                  proposalId: pdfResult.proposalId,
                  pdfUrl: fullPdfUrl
                });
                console.log(`[Email] Dispatched proposal PDF to ${crmLead.email}`);
              } catch(e) {}
            });
          }
        }).catch(e => console.error("[Auto PDF Error]", e));
      });
    }
  } else {
    crmLead = {
      id: newId("LEAD"),
      source: channel || "telegram",
      name: customerName || "Telegram User",
      phone: `TG-ID: ${customerId}`,
      email: updatedProfile.email || null,
      location: updatedProfile.location || "",
      propertyType: updatedProfile.propertyType || "Apartment",
      bedrooms: updatedProfile.bedrooms || null,
      possession: updatedProfile.possession || "ready_to_move",
      requirement: reqSummary || "Natural Chat Inquiry",
      budget: updatedProfile.budgetText || "Under review",
      status: "New",
      assignedTo: null,
      createdAt: new Date().toISOString(),
      telegramDetails: { senderId: customerId },
      lastAction: {
        action: "AI Conversation started",
        performedBy: "Gemini AI Agent",
        actorType: "ai",
        timestamp: new Date().toISOString(),
      },
    };
    leads.unshift(crmLead);
  }

  // 5. PRIMARY: Native Express AI Chat Engine (100% Native - No n8n)
  const baseUrl = getDynamicPublicBaseUrl();
  const bookingLink = `${baseUrl}/book-meeting?leadId=${crmLead.id}`;

  let replyText = await processNativeAiChat({
    conversationId: conversation.conversationId,
    customerId: conversation.customerId,
    customerName: crmLead.name || customerName,
    message,
    leadProfile: conversation.leadProfile,
    historyMessages: conversation.messages,
    bookingLink,
    channel: channel || "telegram",
    conversationMode: crmLead.conversationMode || "INBOUND",
  });

  let providerEngine = "native_gemini_3.6";
  aiEngineStatus.lastAnsweredBy = "native_gemini_3.6";
  aiEngineStatus.engineLabel = "Native Gemini 3.6 Flash Engine";
  aiEngineStatus.isQuotaExceeded = false;
  aiEngineStatus.lastResponseTimestamp = new Date().toISOString();

  // Also record incoming customer message in SQLite communications table
  try {
    db.prepare(`
      INSERT INTO communications (id, lead_id, channel, direction, sender, sender_name, recipient, body, created_at)
      VALUES (?, ?, ?, 'inbound', ?, ?, 'RealtyPulse AI Bot', ?, ?)
    `).run(`COMM-${newUuid().slice(0, 8)}`, crmLead.id, channel || "telegram", customerId, customerName || "Customer", message, new Date().toISOString());
  } catch (e) {}

  // Record AI response into conversation history
  conversation.messages.push({
    sender: "ai",
    name: "RealtyPulse AI Bot",
    text: replyText,
    timestamp: new Date().toISOString(),
  });

  // Also record outgoing AI response in SQLite communications table
  try {
    db.prepare(`
      INSERT INTO communications (id, lead_id, channel, direction, sender, sender_name, recipient, body, created_at)
      VALUES (?, ?, ?, 'outbound', 'ai_bot', 'RealtyPulse AI Bot', ?, ?, ?)
    `).run(`COMM-${newUuid().slice(0, 8)}`, crmLead.id, channel || "telegram", customerId, replyText, new Date().toISOString());
  } catch (e) {}

  saveToDisk();

  res.json({
    reply: replyText,
    leadId: crmLead.id,
    leadName: crmLead.name,
    leadProfile: conversation.leadProfile,
    matchedPropertiesCount: matchedProps.length,
    status: conversation.status,
    engine: providerEngine,
  });
});

// Enhanced Property Match & Rank Engine with Match Scores & Reasons
export function matchAndRankProperties(filters = {}) {
  const { location, bedrooms, maxBudget, minBudget, propertyType, parking, possession, listingIntent } = filters;

  const validProps = properties.filter((p) => p.status === "Available" || p.approvalStatus === "Approved");

  const scored = validProps.map((prop) => {
    let score = 50;
    const reasons = [];

    if (listingIntent && prop.listingIntent === listingIntent) {
      score += 15;
      reasons.push(`Correct listing category (${listingIntent === "rent_in" ? "For Rent" : "For Sale"})`);
    }

    if (location && prop.location.toLowerCase().includes(location.toLowerCase())) {
      score += 25;
      reasons.push(`Location matches requirement (${prop.location})`);
    }

    if (bedrooms && prop.bedrooms === Number(bedrooms)) {
      score += 20;
      reasons.push(`Exact ${prop.bedrooms} BHK requirement`);
    }

    if (maxBudget && prop.price <= Number(maxBudget)) {
      score += 20;
      reasons.push(`Within budget limit (₹${Number(prop.price).toLocaleString("en-IN")})`);
    }

    if (propertyType && prop.type.toLowerCase().includes(propertyType.toLowerCase())) {
      score += 15;
      reasons.push(`Property type matches (${prop.type})`);
    }

    if (possession && prop.possession === possession) {
      score += 10;
      reasons.push(`Possession matches (${possession === "ready_to_move" ? "Ready to Move" : "Under Construction"})`);
    }

    if (parking && prop.parking) {
      score += 5;
      reasons.push("Dedicated parking space included");
    }

    return {
      ...prop,
      matchScore: Math.min(score, 98),
      matchReasons: reasons.length > 0 ? reasons : ["General property match"],
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);
  return scored;
}

// POST /api/ai/start-engagement -> Trigger Outbound AI Engagement for a lead
router.post("/start-engagement", async (req, res) => {
  const { leadId, phone, channel, conversationMode = "OUTBOUND", force = false, performedBy } = req.body;
  const targetId = leadId || phone;

  if (!targetId) {
    return res.status(400).json({ error: "leadId or phone is required" });
  }

  // 1. Locate Lead
  let lead = leads.find((l) => l.id === targetId || l.phone?.includes(targetId));
  
  if (!lead && phone) {
    lead = {
      id: `LD-${Date.now()}`,
      name: "Unknown Contact",
      phone: phone,
      source: channel || "telegram",
      status: "New",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dnd: 0
    };
    leads.unshift(lead);
    saveToDisk();
  } else if (!lead) {
    return res.status(404).json({ error: "Lead not found in CRM" });
  }

  // 2. Validate recipient phone or Telegram username/ID
  const isUsername = typeof lead.phone === 'string' && (lead.phone.startsWith('@') || /[a-zA-Z]/.test(lead.phone));
  const cleanPhone = isUsername ? lead.phone : (lead.phone || "").replace(/[^0-9+]/g, "");
  const telegramId = lead.telegramDetails?.senderId;
  const targetRecipient = telegramId || cleanPhone;

  if (!targetRecipient) {
    return res.status(400).json({ error: "Lead does not have a valid phone number or Telegram ID for outreach." });
  }

  // 3. Check DND or Opt-out
  if (lead.dnd === 1 || lead.status === "DND" || lead.status === "Opt-Out") {
    return res.status(400).json({ error: "Customer has opted out of communications (DND active)." });
  }

  // 4. Check active engagement to avoid duplicate spam
  if (!force && (lead.aiEngagementStatus === "OUTREACH_SENT" || lead.aiEngagementStatus === "ACTIVE_CONVERSATION" || lead.aiEngagementStatus === "PROPOSAL_SENT")) {
    return res.status(400).json({
      error: `AI outreach already active for this lead (Status: ${lead.aiEngagementStatus}). Check Force Re-engage to override.`,
    });
  }

  const targetChannel = channel || (telegramId ? "telegram" : lead.source === "whatsapp" ? "whatsapp" : "chat");
  const cleanName = (lead.name || "there").replace(/\(.*\)/g, "").trim();

  // 5. Formulate Personalized Outbound First Message tailored to Intent (BUY, SELL, RENT IN, RENT OUT)
  const firstMessage = buildOutreachMessage({
    name: lead.name,
    listingIntent: lead.listingIntent,
    location: lead.location,
    propertyType: lead.propertyType,
    budget: lead.budget,
  });

  // 6. Update Lead Context Data Structure
  lead.conversationMode = "OUTBOUND";
  lead.aiEngagementStatus = "OUTREACH_SENT";
  lead.conversationStage = "OUTREACH";
  lead.lastChannel = targetChannel;
  lead.requirements = {
    location: lead.location || null,
    propertyType: lead.propertyType || null,
    bhk: lead.bedrooms || null,
    budget: lead.budget || null,
    possession: lead.possession || null,
  };

  // 7. Store / Retrieve Conversation Memory Thread
  const conversationId = telegramId ? `telegram:${telegramId}` : `phone:${cleanPhone}`;
  let conversation = conversations.find((c) => c.conversationId === conversationId || c.customerId === targetRecipient);

  if (!conversation) {
    conversation = {
      conversationId,
      customerId: targetRecipient,
      channel: targetChannel,
      customerName: cleanName,
      messages: [],
      leadProfile: { ...lead.requirements },
      status: "AI_ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    conversations.unshift(conversation);
  }

  // PUSH FIRST OUTBOUND MESSAGE TO MEMORY
  conversation.messages.push({
    sender: "ai",
    name: "RealtyPulse AI Bot (Aira)",
    text: firstMessage,
    timestamp: new Date().toISOString(),
    mode: "OUTBOUND",
  });

  // Log to SQLite for UI display
  try {
    db.prepare(`
      INSERT INTO communications (id, lead_id, channel, direction, sender, sender_name, recipient, body, created_at)
      VALUES (?, ?, ?, 'outbound', 'ai_bot', 'RealtyPulse AI Bot', ?, ?, ?)
    `).run(`COMM-${newUuid().slice(0, 8)}`, lead.id, targetChannel, targetRecipient, firstMessage, new Date().toISOString());
  } catch (e) {
    console.warn("[Communications SQLite Log Error]", e.message);
  }

  // 8. Dispatch Message via target provider
  let dispatched = false;
  let dispatchNote = "";

  if (targetChannel === "telegram") {
    if (telegramId && telegramClient && telegramClient.connected) {
      try {
        await telegramClient.sendMessage(telegramId, { message: firstMessage });
        dispatched = true;
        dispatchNote = "Outbound greeting dispatched via Telegram Client ID";
      } catch (tErr) {
        dispatchNote = `Telegram ID attempt: ${tErr.message}`;
      }
    }

    if (!dispatched && cleanPhone) {
      try {
        const tgRes = await sendTelegramMessageByPhone({ phone: cleanPhone, name: cleanName, message: firstMessage });
        lead.telegramDetails = { senderId: tgRes.telegramUserId };
        dispatched = true;
        dispatchNote = `✅ Searched Telegram for ${cleanPhone} -> Contact found & message sent to Telegram User ID ${tgRes.telegramUserId}`;
      } catch (tgPhoneErr) {
        dispatchNote = `Telegram phone search note: ${tgPhoneErr.message}`;
      }
    }
  }

  if (!dispatched && cleanPhone && targetChannel === "whatsapp") {
    try {
      await whatsapp.sendTextMessage({ toNumber: cleanPhone, message: firstMessage });
      dispatched = true;
      dispatchNote = "Outbound greeting dispatched via WhatsApp Gateway";
    } catch (wErr) {
      dispatchNote = `WhatsApp note: ${wErr.message}`;
    }
  }

  // Dispatch event to n8n AI workflow
  try {
    const baseUrl = getDynamicPublicBaseUrl();
    await sendToN8n({
      channel: targetChannel,
      conversationId,
      customerId: targetRecipient,
      customerName: cleanName,
      message: firstMessage,
      conversationMode: "OUTBOUND",
      isFirstOutreach: true,
      leadProfile: lead.requirements,
      bookingLink: `${baseUrl}/book-meeting?leadId=${lead.id}`,
      timestamp: new Date().toISOString(),
    });
  } catch (n8nErr) {
    console.warn("[n8n Outbound Notification Note]", n8nErr.message);
  }

  // 9. Log Activity Timeline
  lead.lastAction = {
    action: `Outbound AI Engagement Started (${targetChannel.toUpperCase()})`,
    performedBy: performedBy || "Admin Manager",
    actorType: "ai",
    timestamp: new Date().toISOString(),
  };

  saveToDisk();

  res.json({
    ok: true,
    leadId: lead.id,
    conversationMode: "OUTBOUND",
    aiEngagementStatus: lead.aiEngagementStatus,
    conversationStage: lead.conversationStage,
    firstMessage,
    dispatched,
    dispatchNote: dispatchNote || "Outreach initiated successfully",
  });
});

// POST /api/ai/generate-proposal -> Generate personalized property proposal against lead
router.post("/generate-proposal", (req, res) => {
  const { leadId, propertyId, customNotes, performedBy } = req.body;

  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const targetProp = properties.find((p) => p.id === propertyId) || properties[0];

  const proposalObj = {
    proposalId: newId("PROP-DOC"),
    leadId: lead.id,
    customerName: lead.name,
    customerPhone: lead.phone,
    customerEmail: lead.email,
    generatedAt: new Date().toISOString(),
    property: {
      id: targetProp.id,
      title: targetProp.title,
      location: targetProp.location,
      price: targetProp.price,
      bedrooms: targetProp.bedrooms,
      area: targetProp.area,
      type: targetProp.type,
      description: targetProp.description,
    },
    matchReasons: [
      `Prime location in ${targetProp.location}`,
      `Fits budget requirements (${targetProp.price ? "₹" + Number(targetProp.price).toLocaleString("en-IN") : "Flexible"})`,
      `Advocate verified legal title & ready for site inspection`,
    ],
    customNotes: customNotes || "Includes complimentary chauffeured site visit and home loan assistance at 8.4% interest rate.",
    shareableText: `*EXECUTIVE PROPERTY PROPOSAL — REALTYPULSE*\n\nHello ${lead.name}!\nHere is your requested property proposal for *${targetProp.title}* in ${targetProp.location}.\n\n💰 Price: ₹${Number(targetProp.price).toLocaleString("en-IN")}\n📐 Layout: ${targetProp.bedrooms || 3} BHK · ${targetProp.area || "Spacious"}\n✅ Verified Legal Title · Ready for Site Visit\n\nContact your dedicated advisor at RealtyPulse: +91 9633541720`,
  };

  lead.proposalGenerated = true;
  lead.proposalDetails = proposalObj;
  lead.interestedProperty = targetProp;
  lead.conversationStage = "PROPOSAL_GENERATION";
  lead.aiEngagementStatus = "PROPOSAL_SENT";

  lead.lastAction = {
    action: `Personalized Proposal generated for ${targetProp.title}`,
    performedBy: performedBy || "RealtyPulse AI Agent",
    actorType: "ai",
    timestamp: new Date().toISOString(),
  };

  const targetChannel = (lead.source || "whatsapp").toLowerCase();
  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9+]/g, "") : null;
  const telegramId = lead.telegramDetails?.senderId;

  // Log to SQLite for UI display
  try {
    db.prepare(`
      INSERT INTO communications (id, lead_id, channel, direction, sender, sender_name, recipient, body, created_at)
      VALUES (?, ?, ?, 'outbound', 'ai_bot', 'RealtyPulse AI Bot', ?, ?, ?)
    `).run(`COMM-${newUuid().slice(0, 8)}`, lead.id, targetChannel, cleanPhone || telegramId || "Customer", proposalObj.shareableText, new Date().toISOString());
  } catch (e) {
    console.warn("[Communications SQLite Log Error]", e.message);
  }

  // Dispatch via target provider
  if (targetChannel === "telegram") {
    if (telegramId && telegramClient && telegramClient.connected) {
      telegramClient.sendMessage(telegramId, { message: proposalObj.shareableText }).catch(() => {});
    } else if (cleanPhone) {
      sendTelegramMessageByPhone({ phone: cleanPhone, name: lead.name, message: proposalObj.shareableText }).catch(() => {});
    }
  }

  saveToDisk();

  res.json({ ok: true, proposal: proposalObj, lead });
});

// POST /api/ai/handoff -> Toggle Human Handoff for a lead
router.post("/handoff", (req, res) => {
  const { leadId, handoff = true, performedBy } = req.body;
  const lead = leads.find((l) => l.id === leadId);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  lead.aiEngagementStatus = handoff ? "HUMAN_HANDOFF" : "ACTIVE_CONVERSATION";
  lead.conversationStage = handoff ? "HUMAN_HANDOFF" : "REQUIREMENT_DISCOVERY";

  const conversationId = lead.telegramDetails?.senderId ? `telegram:${lead.telegramDetails.senderId}` : `phone:${lead.phone.replace(/[^0-9+]/g, "")}`;
  const conversation = conversations.find((c) => c.conversationId === conversationId || c.customerId === lead.phone);
  if (conversation) {
    conversation.status = handoff ? "HUMAN_HANDOFF" : "AI_ACTIVE";
  }

  lead.lastAction = {
    action: handoff ? "Human Handoff Triggered — Paused AI Agent" : "AI Agent Resumed by Admin",
    performedBy: performedBy || "Admin Manager",
    actorType: "user",
    timestamp: new Date().toISOString(),
  };

  saveToDisk();

  res.json({ ok: true, lead, handoff });
});

// GET /api/ai/status -> Returns live AI Engine health
router.get("/status", (req, res) => {
  res.json(aiEngineStatus);
});

// POST /api/ai/tools/search-properties -> Property Search Tool endpoint for n8n workflows
router.post("/tools/search-properties", (req, res) => {
  const { location, bedrooms, maxBudget, budget, propertyType, type } = req.body || {};
  let matched = properties.filter((p) => p.status === "Available" && p.approvalStatus === "Approved");

  if (location && typeof location === "string") {
    const locLower = location.toLowerCase();
    matched = matched.filter((p) => p.location.toLowerCase().includes(locLower) || locLower.includes(p.location.toLowerCase()));
  }

  if (bedrooms) {
    const bhk = parseInt(bedrooms, 10);
    if (!isNaN(bhk)) {
      matched = matched.filter((p) => p.bedrooms === bhk);
    }
  }

  const numericBudget = maxBudget || budget;
  if (numericBudget) {
    const limit = parseFloat(numericBudget);
    if (!isNaN(limit)) {
      matched = matched.filter((p) => p.price <= limit);
    }
  }

  const targetType = propertyType || type;
  if (targetType && typeof targetType === "string") {
    const typeLower = targetType.toLowerCase();
    matched = matched.filter((p) => p.type.toLowerCase().includes(typeLower));
  }

  res.json({ properties: matched.slice(0, 3) });
});

export default router;
