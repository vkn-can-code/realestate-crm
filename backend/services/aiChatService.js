import "dotenv/config";
import { properties, leads, saveToDisk } from "../data/store.js";
import { getVapiSystemPrompt, getInboundTelegramPrompt, getOutboundTelegramPrompt } from "./prompts.js";
import { generateProposalPdf } from "./pdfGenerator.js";
import { client } from "../integrations/telegram.js";
import db from "../data/db.js";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

// Search property helper
function executePropertySearch({ location, bedrooms, maxBudget, listingIntent, propertyType }) {
  return properties.filter((prop) => {
    if (prop.status !== "Available") return false;

    if (listingIntent) {
      if (listingIntent === "rent_in" && prop.listingIntent !== "rent_in") return false;
      if (listingIntent === "buy" && prop.listingIntent !== "buy") return false;
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
    if (propertyType && !prop.type.toLowerCase().includes(propertyType.toLowerCase())) {
      return false;
    }
    return true;
  });
}

// Business Knowledge Base Tool
function getBusinessKnowledgeBase() {
  return {
    agencyName: "RealtyPulse Real Estate Agency",
    headquarters: "Palarivattom / Kakkanad, Ernakulam, Kerala",
    workingHours: "Monday to Saturday: 9:00 AM - 7:00 PM, Sunday: By Appointment",
    services: ["Residential Home Sales", "Rental Properties", "Commercial Spaces", "Property Valuation", "Home Loan Assistance"],
    homeLoanPartners: ["HDFC Bank", "State Bank of India (SBI)", "ICICI Bank", "Federal Bank"],
    buyingPolicy: "Zero hidden fees. Full documentation check & transparent registration support provided.",
    contactEmail: "info.oaklinetechnologies@gmail.com",
    contactPhone: "+91 96335 41720",
  };
}

/**
 * Native AI Chat Engine using Gemini 3.6 Flash
 */
export async function processNativeAiChat({
  conversationId,
  customerId,
  customerName = "Customer",
  message = "",
  leadProfile = {},
  historyMessages = [],
  bookingLink = "http://localhost:5173/book-meeting",
  channel = "chat",
  conversationMode = "INBOUND",
}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const claudeModel = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

  // SYSTEM PROMPT & CONVERSATION RULES
  let systemInstruction;
  if (channel === "voice" || channel === "vapi" || channel === "call") {
    systemInstruction = getVapiSystemPrompt(customerName, bookingLink);
  } else if (conversationMode === "OUTBOUND") {
    systemInstruction = getOutboundTelegramPrompt(customerName, bookingLink, leadProfile);
  } else {
    systemInstruction = getInboundTelegramPrompt(customerName, bookingLink, leadProfile);
  }

  // Construct conversation messages array for Anthropic REST API
  const messages = [];

  // Append recent conversation history (up to last 10 messages)
  const recentHistory = (historyMessages || []).slice(-10);
  for (const m of recentHistory) {
    if (m.text) {
      messages.push({
        role: m.sender === "customer" || m.sender === "user" ? "user" : "assistant",
        content: m.text,
      });
    }
  }

  // Ensure current user message is appended
  if (message) {
    messages.push({
      role: "user",
      content: message,
    });
  }

  const maxOutputTokens = (channel === "voice" || channel === "vapi" || channel === "call") ? 150 : 400;

  if (!apiKey) {
    // Smart Contextual Fallback if API key missing
    return generateSmartFallback(customerName, leadProfile, message);
  }

  const endpoint = `https://api.anthropic.com/v1/messages`;

  // Tools definition for Anthropic API
  const tools = [
    {
      name: "search_properties",
      description: "Search live Ernakulam real estate property database by location, bedrooms, maxBudget, listingIntent, or propertyType.",
      input_schema: {
        type: "object",
        properties: {
          location: { type: "string", description: "Location in Ernakulam (e.g. Kakkanad, Aluva, Edappally, Maradu, Marine Drive)" },
          bedrooms: { type: "number", description: "Number of bedrooms / BHK (e.g. 1, 2, 3, 4)" },
          maxBudget: { type: "number", description: "Maximum budget in INR (e.g. 8000000 for 80 Lakhs, 20000000 for 2 Cr)" },
          listingIntent: { type: "string", description: "Intent: 'buy' or 'rent_in'" },
          propertyType: { type: "string", description: "Type: 'Apartment', 'Villa', 'Commercial', 'Plot'" },
        },
      },
    },
    {
      name: "get_business_kb",
      description: "Retrieve agency knowledge base, office hours, home loan partners, and policies.",
      input_schema: { type: "object", properties: {} },
    },
    {
      name: "update_lead_requirements",
      description: "Update the database when the lead states their requirements (e.g. location, budget, bedrooms, propertyType, intent). Call this as soon as they provide new requirements to trigger a customized proposal.",
      input_schema: {
        type: "object",
        properties: {
          location: { type: "string" },
          bedrooms: { type: "number" },
          maxBudget: { type: "number" },
          listingIntent: { type: "string", description: "'buy' or 'rent_in' or 'sell' or 'rent_out'" },
          propertyType: { type: "string" },
          email: { type: "string", description: "If the lead provides an email address to send the proposal to." }
        },
      },
    },
  ];

  try {
    // 1st Round Trip to Claude
    let res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: claudeModel,
        max_tokens: maxOutputTokens,
        system: systemInstruction,
        messages,
        tools,
      }),
    });

    let data = await res.json();
    if (!res.ok) {
      console.warn(`[Native AI Claude Error] ${data.error?.message || res.statusText}`);
      return generateSmartFallback(customerName, leadProfile, message);
    }

    let assistantContent = data.content;
    let toolUseBlock = assistantContent?.find((b) => b.type === "tool_use");

    // Handle Tool Execution if Claude requests function call
    if (toolUseBlock) {
      const { id, name, input: args } = toolUseBlock;
      console.log(`⚡ [Native AI Tool Execution] Running tool "${name}" with args:`, JSON.stringify(args));

      let toolResult = {};
      if (name === "search_properties") {
        const matched = executePropertySearch(args || {});
        toolResult = { count: matched.length, properties: matched.slice(0, 3) };
      } else if (name === "get_business_kb") {
        toolResult = getBusinessKnowledgeBase();
      } else if (name === "update_lead_requirements") {
        console.log(`[AI Profiling] Updating requirements for lead ${customerId}`);
        let targetLead = leads.find(l => l.id === customerId || l.telegramDetails?.senderId === customerId);
        
        if (targetLead) {
          if (args.location) targetLead.location = args.location;
          if (args.bedrooms) targetLead.bedrooms = args.bedrooms;
          if (args.maxBudget) {
            targetLead.budget = `₹${args.maxBudget}`;
            targetLead.maxBudget = args.maxBudget;
          }
          if (args.listingIntent) targetLead.listingIntent = args.listingIntent;
          if (args.propertyType) targetLead.propertyType = args.propertyType;
          if (args.email) targetLead.email = args.email;

          // Build a readable requirement string
          targetLead.requirement = `${args.bedrooms ? args.bedrooms + 'BHK ' : ''}${args.propertyType || 'property'} in ${args.location || 'Kochi'} under ₹${args.maxBudget || ''}`.trim();

          saveToDisk();

          // Match properties for the PDF
          const matchedProps = executePropertySearch({
            location: targetLead.location,
            bedrooms: targetLead.bedrooms,
            maxBudget: targetLead.maxBudget,
            listingIntent: targetLead.listingIntent,
            propertyType: targetLead.propertyType
          });

          // Generate PDF asynchronously
          generateProposalPdf({
            proposalId: `PROP-${Date.now().toString().slice(-6)}`,
            customerName: targetLead.name || customerName,
            phone: targetLead.phone || customerId,
            requirement: {
              location: targetLead.location,
              budget: targetLead.maxBudget,
              bedrooms: targetLead.bedrooms,
              listingIntent: targetLead.listingIntent
            },
            properties: matchedProps.slice(0, 5) // max 5 properties
          }).then(async (pdfResult) => {
            const publicBase = process.env.PUBLIC_BASE_URL || "http://localhost:5001";
            const fullPdfUrl = `${publicBase}${pdfResult.pdfUrl}`;
            
            // Send PDF directly if Telegram channel
            if (channel === "telegram" && client && client.connected) {
              console.log(`[Telegram] Sending PDF proposal to ${customerId}`);
              const msg = `Here is a custom property proposal based on your requirements:\n${fullPdfUrl}`;
              try {
                if (pdfResult.filePath) {
                  // Send actual document if teleproto supports it
                  await client.sendMessage(customerId, { message: "Here is your custom property proposal based on your requirements!", file: pdfResult.filePath });
                } else {
                  await client.sendMessage(customerId, { message: msg });
                }
              } catch (e) { console.error("[Telegram] failed to send PDF", e); }
            }

            // Send via Email if Email is provided
            if (targetLead.email) {
              try {
                // Dynamically import to avoid top-level circular dependency if any
                const { sendProposalEmail } = await import("./emailService.js");
                await sendProposalEmail({
                  toEmail: targetLead.email,
                  customerName: targetLead.name || customerName,
                  proposalId: pdfResult.proposalId,
                  pdfUrl: fullPdfUrl
                });
                console.log(`[Email] Dispatched proposal PDF to ${targetLead.email}`);
              } catch (e) { console.error("[Email] failed to send PDF", e); }
            }
          }).catch(e => console.error("[PDF Gen Error]", e));
          
          toolResult = { status: "success", message: "Requirements updated and proposal PDF is being generated and sent to the user." };
        } else {
          toolResult = { status: "error", message: "Lead not found in database." };
        }
      }

      // Append assistant's response (including the tool_use) and the user's tool_result
      messages.push({
        role: "assistant",
        content: assistantContent, // The exact array returned by Claude
      });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: id,
            content: JSON.stringify(toolResult),
          },
        ],
      });

      // 2nd Round Trip to get final spoken message
      res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: maxOutputTokens,
          system: systemInstruction,
          messages,
          tools,
        }),
      });

      data = await res.json();
      if (!res.ok) {
        console.warn(`[Native AI Claude Error Round 2] ${data.error?.message || res.statusText}`);
        return generateSmartFallback(customerName, leadProfile, message);
      }
      assistantContent = data.content;
    }

    // Claude can return text and tool_use in the same block array, or just text
    const textBlock = assistantContent?.find((b) => b.type === "text");
    const replyText = textBlock?.text;
    if (replyText) {
      return replyText.trim();
    }

    return generateSmartFallback(customerName, leadProfile, message);
  } catch (err) {
    console.error("[Native AI Exception]", err);
    return generateSmartFallback(customerName, leadProfile, message);
  }
}

// Offline Smart Fallback Generator
function generateSmartFallback(customerName, profile, message) {
  const msgLower = (message || "").toLowerCase();
  if (profile?.serviceType === "buy" || /\b(buy|buying|purchase)\b/i.test(msgLower)) {
    if (profile?.location) {
      return `Great choice! We have top properties available for purchase in ${profile.location}. What BHK configuration or budget range do you have in mind?`;
    }
    return `Understood! 👍 We have prime apartments & villas for sale across Kakkanad, Edappally, Aluva, and central Ernakulam. Which area are you looking to buy in?`;
  }
  if (profile?.serviceType === "rent_in" || /\b(rent in|want to rent|need rent)\b/i.test(msgLower)) {
    if (profile?.location) {
      return `Got it! 👍 We have furnished apartments & houses for rent in ${profile.location}. Are you looking for a 1BHK, 2BHK, or 3BHK?`;
    }
    return `Sure thing! We have prime rental properties across Kakkanad (Infopark), Edappally, and MG Road. Which area or neighbourhood do you prefer?`;
  }
  if (profile?.serviceType === "sell" || profile?.serviceType === "rent_out" || /\b(sell|rent out)\b/i.test(msgLower)) {
    return `We can definitely assist you in listing your property for ${profile.serviceType === "sell" ? "sale" : "rent"}! Could you share the property location and expected price?`;
  }
  return `Hi ${customerName}! I'm Aira from RealtyPulse. How can we help you with your property needs in Ernakulam today?`;
}
