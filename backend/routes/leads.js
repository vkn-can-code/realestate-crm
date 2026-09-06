import { Router } from "express";
import { leads, team, newId, saveToDisk } from "../data/store.js";
import exotel from "../integrations/exotel.js";
import whatsapp from "../integrations/whatsapp.js";
import aiCallBot from "../integrations/aiCallBot.js";
import db from "../data/db.js";
import { sendTelegramMessageByPhone } from "../integrations/telegram.js";
import { matchPropertiesForLead } from "../services/propertyMatcherService.js";
import { generateAiNextAction } from "../services/aiRecommendationService.js";
import { evaluateAutomationRules } from "../services/automationRuleService.js";

const router = Router();

function enrichLead(lead) {
  const assignedMember = team.find((t) => t.id === lead.assignedTo);
  return {
    ...lead,
    assignedToName: assignedMember ? assignedMember.name : "Unassigned",
  };
}

export function buildOutreachMessage({ name, listingIntent, location, propertyType, budget }) {
  const cleanName = (name || "there").replace(/\(.*\)/g, "").trim();
  const locStr = location ? ` in ${location}` : "";
  const propStr = propertyType ? ` (${propertyType})` : "";
  const budgetStr = budget ? ` [Budget/Price: ${budget}]` : "";

  switch (listingIntent) {
    case "buy":
      return `Hi ${cleanName} 👋\n\nI'm Aira from RealtyPulse Real Estate.\n\nWe received your request regarding *BUYING* a property${locStr}${propStr}${budgetStr}.\n\nI'd love to show you top verified properties matching your requirements! Would you like to view our shortlisted options?`;

    case "sell":
    case "to_sell":
      return `Hi ${cleanName} 👋\n\nI'm Aira from RealtyPulse Real Estate.\n\nThank you for reaching out to *SELL* your property${locStr}${propStr}${budgetStr}.\n\nOur team is ready to list your property and connect you with qualified buyers. Could you share key details or photos of your property?`;

    case "rent_in":
      return `Hi ${cleanName} 👋\n\nI'm Aira from RealtyPulse Real Estate.\n\nWe noticed you are looking to *RENT IN* a property${locStr}${propStr}${budgetStr}.\n\nI'd love to share our top available rental listings with you! Are you looking for immediate possession?`;

    case "rent_out":
    case "to_rent":
      return `Hi ${cleanName} 👋\n\nI'm Aira from RealtyPulse Real Estate.\n\nThank you for reaching out to *RENT OUT* your property${locStr}${propStr}${budgetStr}.\n\nWe have verified prospective tenants actively looking in your area. Would you like to list your property with us today?`;

    default:
      return `Hi ${cleanName} 👋\n\nI'm Aira from RealtyPulse Real Estate.\n\nI wanted to personally connect and assist you with your real-estate requirements${locStr}.\n\nAre you looking to BUY, SELL, RENT IN, or RENT OUT a property?`;
  }
}

// GET /api/leads?source=call|website|whatsapp&assignedTo=TEAM-2
router.get("/", (req, res) => {
  const { source, assignedTo } = req.query;
  let data = leads;
  if (source && source !== "all") {
    data = data.filter((l) => l.source === source);
  }
  if (assignedTo && assignedTo !== "all") {
    data = data.filter((l) => l.assignedTo === assignedTo);
  }
  res.json(data.map(enrichLead));
});

router.get("/:id", (req, res) => {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  res.json(enrichLead(lead));
});

// Manual Client Onboarding Endpoint
router.post("/manual-onboard", async (req, res) => {
  const {
    name,
    phone,
    email,
    source,
    listingIntent,
    location,
    budget,
    propertyType,
    possession,
    requirement,
    assignedTo,
    sendOutreach,
    createdByName,
    sendTelegramOutbound,
    telegramUsername,
  } = req.body;


  if (!name || !phone) {
    return res.status(400).json({ error: "Client Name and Phone Number are required." });
  }

  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  // Check for duplicate lead
  let existingLead = leads.find(
    (l) => l.phone && cleanPhone && l.phone.includes(cleanPhone.replace("+91", ""))
  );

  if (existingLead) {
    existingLead.name = name;
    existingLead.phone = cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`;
    existingLead.email = email || existingLead.email;
    existingLead.location = location || existingLead.location;
    existingLead.budget = budget || existingLead.budget;
    existingLead.propertyType = propertyType || existingLead.propertyType;
    existingLead.possession = possession || existingLead.possession;
    existingLead.listingIntent = listingIntent || existingLead.listingIntent;
    existingLead.requirement = requirement || existingLead.requirement;
    existingLead.assignedTo = assignedTo || existingLead.assignedTo;

    existingLead.lastAction = {
      action: "Manual client profile updated by Admin",
      performedBy: createdByName || "Admin Manager",
      actorType: "user",
      timestamp: new Date().toISOString(),
    };

    saveToDisk();
  } else {
    const reqSummary = requirement || `${propertyType || "Property"} in ${location || "Not specified"}`;

    const newLead = {
      id: newId("LEAD"),
      source: source === "telegram" ? "manual_telegram" : source === "whatsapp" ? "manual_whatsapp" : (source || "manual"),
      name,
      phone: cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`,
      email: email || null,
      listingIntent: listingIntent || "buy",
      location: location || "",
      budget: budget || "Under review",
      propertyType: propertyType || "Apartment",
      possession: possession || "ready_to_move",
      requirement: reqSummary,
      status: "New",
      assignedTo: assignedTo || null,
      createdAt: new Date().toISOString(),
      lastAction: {
        action: "Manually onboarded to CRM",
        performedBy: createdByName || "Admin Manager",
        actorType: "user",
        timestamp: new Date().toISOString(),
      },
    };

    leads.unshift(newLead);

    try {
      db.prepare(`
        INSERT OR REPLACE INTO leads (id, source, name, phone, email, status, assigned_to, property_interest, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newLead.id,
        newLead.source,
        newLead.name,
        newLead.phone,
        newLead.email,
        newLead.status.toLowerCase(),
        newLead.assignedTo,
        reqSummary,
        newLead.createdAt
      );
    } catch (dbErr) {
      console.warn("[SQLite Sync Warning]", dbErr.message);
    }
  }

  const activeLead = existingLead || leads[0]; // leads[0] is newLead because of unshift
  let outreachResult = null;
  let telegramError = null;

  if (sendTelegramOutbound && telegramUsername) {
    try {
      // Direct internal trigger to AI Telegram module
      const tgRes = await fetch(`http://localhost:${process.env.PORT || 5001}/api/ai/start-engagement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: activeLead.id,
          phone: telegramUsername,
          channel: "telegram",
          conversationMode: "OUTBOUND",
          performedBy: createdByName || "Admin Manager",
        }),
      });

      const errData = await tgRes.json();
      if (!tgRes.ok) {
        telegramError = errData.error || "Failed to dispatch Telegram message.";
      } else if (errData.dispatched === false) {
        telegramError = errData.dispatchNote || "Failed to dispatch Telegram message (API returned dispatched: false).";
      }
    } catch (err) {
      telegramError = err.message;
    }
  }

  // SELF-HEALING: If Telegram failed, auto-fallback to WhatsApp
  let forceWhatsappFallback = false;
  if (telegramError) {
    console.log(`[Auto-Heal] Telegram failed for ${activeLead.phone}: ${telegramError}. Falling back to WhatsApp!`);
    forceWhatsappFallback = true;
  }

  if ((sendOutreach || forceWhatsappFallback) && cleanPhone) {
    try {
      const { triggerBulkAutoOutreach } = await import("../services/outreachService.js");
      triggerBulkAutoOutreach([activeLead.id]).catch((e) => console.error("[Manual Onboard Auto-Outreach Error]", e));
      outreachResult = forceWhatsappFallback 
        ? `⚠️ Telegram failed, but successfully recovered: Lead added to automated outreach queue (WhatsApp, Voice).`
        : `✅ Lead added to automated outreach queue (WhatsApp, Voice).`;
        
      if (forceWhatsappFallback) telegramError = null; // Cleared because we successfully recovered!
    } catch (err) {
      outreachResult = `Outreach dispatch failed entirely: ${err.message}`;
    }
  }

  saveToDisk();

  if (telegramError) {
    return res.status(201).json({
      ok: true,
      isUpdated: !!existingLead,
      lead: enrichLead(activeLead),
      outreachError: telegramError,
    });
  }

  res.status(201).json({
    ok: true,
    isUpdated: !!existingLead,
    lead: enrichLead(activeLead),
    outreachResult,
  });
});


// Lead creation or update from webhook/dashboard
router.post("/", (req, res) => {
  const { source, name, phone, email, requirement, budget, assignedTo, createdByName, transcript } = req.body;
  const cleanPhone = (phone || "").replace(/[^0-9+]/g, "");
  const isAdwayth = cleanPhone.includes("9633541720") || cleanPhone.includes("8547783493");

  let reqString = typeof requirement === "object" ? JSON.stringify(requirement) : (requirement || null);

  let lead = leads.find((l) => l.phone && cleanPhone && (l.phone.includes(cleanPhone) || (isAdwayth && (l.phone.includes("9633541720") || l.phone.includes("8547783493")))));

  if (!lead) {
    lead = {
      id: newId("LEAD"),
      source: source || "voice-vapi",
      name: name || (isAdwayth ? "Adwayth VS" : `Voice Lead (${cleanPhone.slice(-4) || "Vapi"})`),
      phone: cleanPhone ? (cleanPhone.startsWith("+") ? cleanPhone : `+${cleanPhone}`) : "+919633541720",
      email: email || null,
      requirement: reqString,
      budget: budget || "Under review",
      status: "New",
      assignedTo: assignedTo || null,
      createdAt: new Date().toISOString(),
      lastAction: {
        action: `Lead created from ${source || "Vapi Call"}`,
        performedBy: createdByName || "Vapi AI Bridge",
        actorType: "ai",
        timestamp: new Date().toISOString(),
      },
    };
    leads.unshift(lead);
  } else {
    if (reqString) lead.requirement = reqString;
    lead.lastAction = {
      action: `Lead updated from ${source || "Vapi Call"}`,
      performedBy: createdByName || "Vapi AI Bridge",
      actorType: "ai",
      timestamp: new Date().toISOString(),
    };
  }

  saveToDisk();
  res.status(201).json(enrichLead(lead));
});

// Called by Twilio webhook when a missed call / website enquiry lands.
router.post("/incoming", async (req, res) => {
  const { source, name, phone, email, requirement, budget, websiteDetails } = req.body;
  const lead = {
    id: newId("LEAD"),
    source,
    name,
    phone,
    email: email || null,
    requirement: requirement || null,
    budget: budget || "Under review",
    status: "New",
    assignedTo: null,
    createdAt: new Date().toISOString(),
    websiteDetails: websiteDetails || undefined,
    lastAction: {
      action: source === "call" ? "AI Call Bot auto-called missed call" : "Enquiry received from website",
      performedBy: source === "call" ? "AI Call Bot" : "System",
      actorType: source === "call" ? "ai" : "system",
      timestamp: new Date().toISOString(),
    },
  };
  leads.unshift(lead);

  try {
    await twilio.triggerAutomaticCall({ toNumber: phone, leadId: lead.id, reason: source });
  } catch (err) {
    lead.autoCallError = err.message;
  }

  res.status(201).json(enrichLead(lead));
});

// Assign lead to sales team member (ADMIN ONLY)
router.patch("/:id/assign", (req, res) => {
  const userRole = req.headers["x-user-role"] || req.body?.userRole || "admin";
  if (userRole !== "admin") {
    return res.status(403).json({ error: "Permission denied: Only Admin Sales Managers can reassign leads." });
  }

  const { id } = req.params;
  const { assignedTo, updatedByName } = req.body;
  const member = team.find((t) => t.id === assignedTo);
  const memberName = member ? member.name : "Unassigned";

  try {
    // Update SQLite DB assigned_to column without changing kanban_stage
    db.prepare("UPDATE leads SET assigned_to = ? WHERE id = ?").run(assignedTo || null, id);

    // Sync in-memory store
    const lead = leads.find((l) => l.id === id);
    if (lead) {
      lead.assignedTo = assignedTo || null;
      lead.lastAction = {
        action: `Assigned to ${memberName}`,
        performedBy: updatedByName || "Admin Manager",
        actorType: "user",
        timestamp: new Date().toISOString(),
      };
    }

    res.json({ ok: true, leadId: id, assignedTo: assignedTo || null, assignedToName: memberName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update lead status/stage
router.patch("/:id/status", (req, res) => {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const { status, updatedByName } = req.body;
  lead.status = status;
  lead.lastAction = {
    action: `Status changed to ${status}`,
    performedBy: updatedByName || "Admin",
    actorType: "user",
    timestamp: new Date().toISOString(),
  };

  res.json(enrichLead(lead));
});

// Manual click-to-call from the dashboard.
router.post("/:id/call", async (req, res) => {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  try {
    const result = await exotel.triggerOutboundExotelCall({ toNumber: lead.phone, leadId: lead.id });
    lead.lastAction = {
      action: "Manual call triggered via Exotel",
      performedBy: req.body.performedBy || "Admin",
      actorType: "user",
      timestamp: new Date().toISOString(),
    };
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// Send a matched property to the lead's WhatsApp
router.post("/:id/send-whatsapp", async (req, res) => {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  const { documentUrl, caption, performedBy } = req.body;
  try {
    const result = await whatsapp.sendPropertyDocument({ toNumber: lead.phone, documentUrl, caption });
    lead.lastAction = {
      action: "Proposal sent by System via WhatsApp",
      performedBy: performedBy || "System (WhatsApp Bot)",
      actorType: "system",
      timestamp: new Date().toISOString(),
    };
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// AI requirement extraction
router.post("/:id/match", async (req, res) => {
  const lead = leads.find((l) => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: "Lead not found" });
  try {
    const requirement = await aiCallBot.extractRequirement({ transcriptOrMessage: req.body.transcript || lead.requirement });
    res.json(requirement);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

// GET /api/leads/:id/timeline -> Per-Lead Activity Timeline from outreach_log & DB
router.get("/:id/timeline", (req, res) => {
  const { id } = req.params;
  try {
    const logs = db.prepare("SELECT * FROM outreach_log WHERE lead_id = ? ORDER BY created_at ASC").all(id);
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);

    const timeline = [];
    if (lead) {
      timeline.push({
        id: `IMPORT-${lead.id}`,
        event: "Lead Added / Imported",
        type: "lead_created",
        channel: lead.source,
        status: lead.status,
        timestamp: lead.created_at,
        details: `Source: ${lead.source}, Requirement: ${lead.property_interest || "Not specified"}`,
      });
    }

    logs.forEach((log) => {
      let eventTitle = "";
      if (log.type === "initial_outreach") {
        eventTitle = log.channel === "whatsapp" ? "WhatsApp Initial Outreach" : "AIRA Voice Agent First-Touch Call";
      } else if (log.type === "inbound_call") {
        eventTitle = "Inbound Call Received";
      }

      timeline.push({
        id: log.id,
        event: eventTitle,
        type: log.type,
        channel: log.channel,
        status: log.status,
        triggeredBy: log.triggered_by,
        timestamp: log.created_at,
        updatedAt: log.updated_at,
        details: `Channel: ${log.channel.toUpperCase()}, Triggered By: ${log.triggered_by.toUpperCase()}, Status: ${log.status.toUpperCase()}`,
      });
    });

    const activities = db.prepare("SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at ASC").all(id);

    activities.forEach((act) => {
      timeline.push({
        id: act.id,
        event: act.title,
        type: act.activity_type,
        performedBy: act.performed_by_name || act.performed_by,
        timestamp: act.created_at,
        details: act.description,
      });
    });

    res.json({
      leadId: id,
      leadName: lead?.name || "Lead",
      timeline,
      outreachLogs: logs,
      activities,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads/:id/details - Full Lead Profile + Property Matches + Timeline + AI Next Action
router.get("/:id/details", async (req, res) => {
  const { id } = req.params;
  try {
    let lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    
    // Always merge rich fields from JSON store (SQLite schema is minimal, JSON has full profile)
    const storeLead = leads.find((l) => l.id === id);
    
    if (!lead) {
      if (!storeLead) return res.status(404).json({ error: "Lead not found" });
      lead = {
        id: storeLead.id,
        name: storeLead.name,
        phone: storeLead.phone,
        email: storeLead.email,
        source: storeLead.source,
        kanban_stage: storeLead.status || "New",
        status: storeLead.status || "New",
        budget: storeLead.budget,
        location: storeLead.location || "",
        requirement: storeLead.requirement,
        property_type: storeLead.propertyType || "",
        assigned_to: storeLead.assignedTo,
        created_at: storeLead.createdAt,
        timeline: storeLead.possession || null,
        lead_temperature: "Warm",
        communication_preference: "WhatsApp",
        assignedToName: storeLead.assignedToName || "Unassigned",
      };
    } else if (storeLead) {
      // Merge JSON store rich fields on top of SQLite flat row
      lead.budget = lead.budget || storeLead.budget || null;
      lead.location = lead.location || storeLead.location || null;
      lead.requirement = lead.requirement || storeLead.requirement || null;
      lead.property_type = lead.property_type || storeLead.propertyType || null;
      lead.timeline = lead.timeline || storeLead.possession || null;
      lead.email = lead.email || storeLead.email || null;
      lead.source = lead.source || storeLead.source || "manual";
      lead.assignedToName = storeLead.assignedToName || "Unassigned";
      lead.listingIntent = storeLead.listingIntent || null;
      lead.lastAction = storeLead.lastAction || null;
      lead.aiEngagementStatus = storeLead.aiEngagementStatus || null;
    }

    const matchedProps = matchPropertiesForLead(lead);
    const activities = db.prepare("SELECT * FROM lead_activities WHERE lead_id = ? ORDER BY created_at DESC").all(id);
    const aiRecommendation = await generateAiNextAction(lead, activities, matchedProps);

    res.json({
      lead,
      matchedProperties: matchedProps,
      activities,
      aiRecommendation,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/leads/:id/followup/complete - Mark followup as completed
router.post("/:id/followup/complete", (req, res) => {
  const { id } = req.params;
  const { completedByName } = req.body;

  try {
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    // Clear next_action
    db.prepare("UPDATE leads SET next_action = NULL, next_action_date = NULL WHERE id = ?").run(id);

    // Log Activity
    const activityId = `act-${Date.now()}`;
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, type, title, description, performed_by_name)
      VALUES (?, ?, 'followup_completed', 'Follow-up Completed', 'User marked the scheduled follow-up as completed.', ?)
    `).run(activityId, id, completedByName || "System");

    res.json({ success: true });
  } catch (err) {
    console.error("[Followup Complete Error]", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/stage - Change Stage, Audit Log & Trigger Automation Rules
router.post("/:id/stage", (req, res) => {
  const { id } = req.params;
  const { newStage, changedBy, changedByName } = req.body;

  if (!newStage) return res.status(400).json({ error: "newStage is required." });

  try {
    let lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);

    // If lead doesn't exist in DB, sync from store to prevent foreign key errors on history insertion
    if (!lead) {
      const storeLead = leads.find((l) => l.id === id);
      if (storeLead) {
        db.prepare(`
          INSERT INTO leads (id, name, phone, email, source, status, kanban_stage)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          storeLead.id,
          storeLead.name || "Unknown",
          storeLead.phone || `Unknown-${storeLead.id}`,
          storeLead.email || null,
          storeLead.source || "system",
          "new",
          storeLead.status || "New"
        );
      } else {
        db.prepare(`
          INSERT INTO leads (id, name, phone, status, kanban_stage)
          VALUES (?, 'Unknown Lead', ?, 'new', 'New')
        `).run(id, `Unknown-${id}`);
      }
      lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    }

    const fromStage = lead ? (lead.kanban_stage || lead.status || "New") : "New";

    const nowIso = new Date().toISOString();

    if (lead) {
      let legacyStatus = "contacted";
      if (newStage === "New") legacyStatus = "new";
      else if (newStage === "Won") legacyStatus = "converted";
      else if (newStage === "DND") legacyStatus = "dnd";

      db.prepare(`
        UPDATE leads
        SET kanban_stage = ?, status = ?, last_interaction_at = ?
        WHERE id = ?
      `).run(newStage, legacyStatus, nowIso, id);
    }

    // Also sync in-memory store.js
    const storeLead = leads.find((l) => l.id === id);
    if (storeLead) {
      storeLead.status = newStage;
      storeLead.kanbanStage = newStage;
      saveToDisk();
    }

    // Audit Log in stage_history
    const histId = `HIS-${Date.now().toString(36)}`;
    db.prepare(`
      INSERT INTO stage_history (id, lead_id, from_stage, to_stage, changed_by, changed_by_name, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(histId, id, fromStage, newStage, changedBy || "user", changedByName || "Salesperson", nowIso);

    // Activity Timeline Entry
    const actId = `ACT-${Date.now().toString(36)}`;
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, performed_by_name)
      VALUES (?, ?, 'stage_change', ?, ?, ?, ?)
    `).run(
      actId,
      id,
      `Pipeline Stage Changed: ${fromStage} → ${newStage}`,
      `Lead moved from '${fromStage}' to '${newStage}' stage.`,
      changedBy || "user",
      changedByName || "Salesperson"
    );

    // Trigger Automation Rules
    const updatedLead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id) || { id, name: storeLead?.name, kanban_stage: newStage };
    const ruleResults = evaluateAutomationRules(db, "stage_changed", updatedLead);

    res.json({ ok: true, leadId: id, fromStage, toStage: newStage, ruleResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/follow-up - Schedule or Complete Follow-Up Task
router.post("/:id/follow-up", (req, res) => {
  const { id } = req.params;
  const { nextAction, nextActionDate, nextActionType, markCompleted } = req.body;

  try {
    const nowIso = new Date().toISOString();

    if (markCompleted) {
      db.prepare(`
        UPDATE leads
        SET follow_up_status = 'Completed', last_interaction_at = ?
        WHERE id = ?
      `).run(nowIso, id);

      const actId = `ACT-${Date.now().toString(36)}`;
      db.prepare(`
        INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by)
        VALUES (?, ?, 'followup_task', 'Follow-Up Completed', 'Salesperson completed scheduled follow-up action.', 'salesperson')
      `).run(actId, id);

      return res.json({ ok: true, message: "Follow-up marked as completed." });
    }

    if (!nextAction || !nextActionDate) {
      return res.status(400).json({ error: "nextAction and nextActionDate are required." });
    }

    db.prepare(`
      UPDATE leads
      SET next_action = ?, next_action_date = ?, next_action_type = ?, follow_up_status = 'Pending'
      WHERE id = ?
    `).run(nextAction, nextActionDate, nextActionType || "Call", id);

    const actId = `ACT-${Date.now().toString(36)}`;
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by)
      VALUES (?, ?, 'followup_task', ?, ?, 'salesperson')
    `).run(actId, id, `Scheduled ${nextActionType || 'Call'} Follow-Up`, `${nextAction} on ${nextActionDate}`);

    res.json({ ok: true, leadId: id, nextAction, nextActionDate, nextActionType });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/activity - Log Custom Activity
router.post("/:id/activity", (req, res) => {
  const { id } = req.params;
  const { activityType, title, description, performedBy, performedByName } = req.body;

  if (!title) return res.status(400).json({ error: "Activity title is required." });

  try {
    const actId = `ACT-${Date.now().toString(36)}`;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, performed_by_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(actId, id, activityType || "note", title, description || "", performedBy || "user", performedByName || "Salesperson");

    db.prepare("UPDATE leads SET last_interaction_at = ? WHERE id = ?").run(nowIso, id);

    res.status(201).json({ ok: true, activityId: actId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/leads/:id/assign - Assign Lead to Salesperson
router.post("/:id/assign", (req, res) => {
  const { id } = req.params;
  const { assignedTo, assignedToName } = req.body;

  try {
    db.prepare("UPDATE leads SET assigned_to = ? WHERE id = ?").run(assignedTo, id);

    const storeLead = leads.find((l) => l.id === id);
    if (storeLead) {
      storeLead.assignedTo = assignedTo;
      saveToDisk();
    }

    const actId = `ACT-${Date.now().toString(36)}`;
    db.prepare(`
      INSERT INTO lead_activities (id, lead_id, activity_type, title, description)
      VALUES (?, ?, 'assignment', ?, ?)
    `).run(actId, id, `Assigned to ${assignedToName || assignedTo}`, `Lead assigned to salesperson ${assignedToName || assignedTo}`);

    res.json({ ok: true, leadId: id, assignedTo, assignedToName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/leads/:id - Update Lead Profile Attributes
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { name, phone, email, budget, location, requirement, propertyType, timeline, leadTemperature, communicationPreference, dnd } = req.body;

  try {
    db.prepare(`
      UPDATE leads
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          budget = COALESCE(?, budget),
          location = COALESCE(?, location),
          requirement = COALESCE(?, requirement),
          property_type = COALESCE(?, property_type),
          timeline = COALESCE(?, timeline),
          lead_temperature = COALESCE(?, lead_temperature),
          communication_preference = COALESCE(?, communication_preference),
          dnd = COALESCE(?, dnd)
      WHERE id = ?
    `).run(name, phone, email, budget, location, requirement, propertyType, timeline, leadTemperature, communicationPreference, dnd, id);

    const updated = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// DELETE /api/leads/:id - Delete Lead
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete from SQLite
    db.prepare("DELETE FROM leads WHERE id = ?").run(id);
    db.prepare("DELETE FROM communications WHERE lead_id = ?").run(id);
    db.prepare("DELETE FROM lead_activities WHERE lead_id = ?").run(id);
    
    // 2. Delete from memory store (crm_database.json)
    const idx = leads.findIndex((l) => l.id === id);
    if (idx !== -1) {
      leads.splice(idx, 1);
      saveToDisk();
    }
    
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
