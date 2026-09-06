import { Router } from "express";
import db, { newUuid } from "../data/db.js";
import { ApolloService, isDuplicateProspect } from "../services/recruitment/apolloService.js";
import { enrichProspectContact } from "../services/recruitment/enrichmentService.js";
import { analyzeProspectMatch } from "../services/recruitment/aiMatchService.js";
import { generateOutreachDraft } from "../services/recruitment/aiDraftService.js";
import { sendEmailOutreach } from "../services/recruitment/emailOutreachService.js";
import { sendWhatsAppOutreach } from "../services/recruitment/whatsappOutreachService.js";
import { handleCandidateQuery, getRecruitmentKnowledgeBase } from "../services/recruitment/recruitmentAgentService.js";

import { ApifyService } from "../services/recruitment/apifyService.js";

const router = Router();
const apolloService = new ApolloService();
const apifyService = new ApifyService();

// Seed initial Recruitment Campaign & Prospects if empty
function seedInitialRecruitmentData() {
  try {
    const campCount = db.prepare("SELECT COUNT(*) as count FROM recruitment_campaigns").get();
    if (campCount.count === 0) {
      const campId = "CMP-MIA-001";
      db.prepare(`
        INSERT INTO recruitment_campaigns (id, name, target_role, location, min_experience_years, specialization, keywords, target_companies, description, preferred_channel, status, created_by)
        VALUES (?, 'Miami Luxury Real Estate Agent Recruitment', 'Real Estate Agent', 'Miami, Florida', 3, 'Luxury Residential', 'Luxury, Waterfront, Condos', 'Coldwell Banker, Compass, BHHS EWM', 'Targeting experienced luxury residential agents in South Florida', 'email', 'active', 'Admin Recruiter')
      `).run(campId);

      const mockProspects = [
        { id: "PRP-101", apolloId: "APO-MIA-901", fullName: "Marcus Vance", firstName: "Marcus", lastName: "Vance", title: "Senior Luxury Advisor", company: "Coldwell Banker Realty", location: "Miami, FL", exp: 6, status: "DISCOVERED" },
        { id: "PRP-102", apolloId: "APO-MIA-902", fullName: "Sophia Rodriguez", firstName: "Sophia", lastName: "Rodriguez", title: "Residential Specialist", company: "Compass Real Estate", location: "Miami, FL", exp: 4, status: "APPROVED" },
        { id: "PRP-103", apolloId: "APO-MIA-903", fullName: "David Sterling", firstName: "David", lastName: "Sterling", title: "Commercial & Residential Agent", company: "BHHS EWM Realty", location: "Miami, FL", exp: 7, status: "SHORTLISTED" },
      ];

      for (const p of mockProspects) {
        db.prepare(`
          INSERT INTO recruitment_prospects (id, campaign_id, apollo_id, full_name, first_name, last_name, job_title, company_name, location, experience_years, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(p.id, campId, p.apolloId, p.fullName, p.firstName, p.lastName, p.title, p.company, p.location, p.exp, p.status);
      }

      console.log("[Recruitment Module] Seeded initial Recruitment Campaign & Prospects!");
    }
  } catch (e) {
    console.warn("[Recruitment Seed Note]", e.message);
  }
}

seedInitialRecruitmentData();

// 1. RECRUITMENT CAMPAIGNS API
router.get("/campaigns", (req, res) => {
  try {
    const list = db.prepare("SELECT * FROM recruitment_campaigns ORDER BY created_at DESC").all();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/campaigns", (req, res) => {
  const { name, targetRole, location, minExperienceYears, specialization, keywords, targetCompanies, description, preferredChannel } = req.body;

  if (!name || !targetRole || !location) {
    return res.status(400).json({ error: "Campaign Name, Target Role, and Location are required." });
  }

  const id = `CMP-${newUuid().slice(0, 8)}`;
  try {
    db.prepare(`
      INSERT INTO recruitment_campaigns (id, name, target_role, location, min_experience_years, specialization, keywords, target_companies, description, preferred_channel, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'Admin Recruiter')
    `).run(
      id,
      name,
      targetRole,
      location,
      minExperienceYears || 0,
      specialization || "Luxury Residential",
      keywords || "",
      targetCompanies || "",
      description || "",
      preferredChannel || "email"
    );

    const created = db.prepare("SELECT * FROM recruitment_campaigns WHERE id = ?").get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/campaigns/:id", (req, res) => {
  const { id } = req.params;
  const { name, targetRole, location, minExperienceYears, specialization, keywords, targetCompanies, description, preferredChannel, status } = req.body;

  try {
    db.prepare(`
      UPDATE recruitment_campaigns
      SET name = ?, target_role = ?, location = ?, min_experience_years = ?, specialization = ?, keywords = ?, target_companies = ?, description = ?, preferred_channel = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, targetRole, location, minExperienceYears, specialization, keywords, targetCompanies, description, preferredChannel, status, id);

    const updated = db.prepare("SELECT * FROM recruitment_campaigns WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/campaigns/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM recruitment_campaigns WHERE id = ?").run(id);
    res.json({ ok: true, deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CAMPAIGN RUNNER DISCOVERY ENGINE API
router.post("/campaigns/:id/run", async (req, res) => {
  const { id } = req.params;
  const campaign = db.prepare("SELECT * FROM recruitment_campaigns WHERE id = ?").get(id);

  if (!campaign) {
    return res.status(404).json({ error: "Recruitment Campaign not found." });
  }

  const executionId = `EXEC-${newUuid().slice(0, 8)}`;
  const nowStr = new Date().toISOString();
  const searchMode = req.body.searchMode || campaign.search_mode || "include_other_matching";
  const searchLimit = req.body.searchLimit || 20;

  const targetCompanies = (campaign.target_companies || "").split(",").map((c) => c.trim()).filter(Boolean);

  // 1. Log Execution Run
  db.prepare(`
    INSERT INTO recruitment_executions (id, campaign_id, started_at, status, search_params_json)
    VALUES (?, ?, ?, 'RUNNING', ?)
  `).run(executionId, id, nowStr, JSON.stringify({ rawTitles: campaign.target_role, rawLocations: campaign.location, searchMode, searchLimit }));

  try {
    // 2. Execute Apify Search with Smart Parameter Expansion
    const apolloResults = await apifyService.searchPeople({
      rawTitles: campaign.target_role,
      rawLocations: campaign.location,
      qKeywords: campaign.keywords || campaign.specialization,
      targetCompanies,
      searchMode,
      perPage: searchLimit,
    });

    const candidates = apolloResults.people || [];
    let importedCount = 0;
    let duplicatesCount = 0;
    const newlyImportedIds = [];

    // 3. Process Profiles & Deduplicate
    for (const c of candidates) {
      const { isDuplicate, reason } = isDuplicateProspect(db, c);

      if (isDuplicate) {
        duplicatesCount++;
        console.log(`[Campaign Discovery] Duplicate skipped: ${c.fullName} (${reason})`);
      } else {
        const prospectId = `PRP-${newUuid().slice(0, 8)}`;
        db.prepare(`
          INSERT INTO recruitment_prospects (id, campaign_id, apollo_id, full_name, first_name, last_name, job_title, company_name, location, linkedin_url, experience_years, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DISCOVERED')
        `).run(
          prospectId,
          id,
          c.apolloId,
          c.fullName,
          c.firstName,
          c.lastName,
          c.jobTitle,
          c.companyName,
          c.location,
          c.linkedinUrl,
          c.experienceYears || 4
        );

        importedCount++;
        newlyImportedIds.push(prospectId);
      }
    }

    // 4. Asynchronously Trigger AI Match Analysis for Imported Candidates (Non-blocking)
    (async () => {
      for (const pId of newlyImportedIds) {
        try {
          await analyzeProspectMatch(db, pId);
        } catch (e) {
          console.warn(`[Async AI Analysis Note: ${pId}]`, e.message);
        }
      }
    })();

    const endStr = new Date().toISOString();

    // 5. Update Execution Record
    db.prepare(`
      UPDATE recruitment_executions
      SET completed_at = ?, status = 'COMPLETED', profiles_found = ?, profiles_imported = ?, duplicates_skipped = ?
      WHERE id = ?
    `).run(endStr, candidates.length, importedCount, duplicatesCount, executionId);

    // 6. Update Campaign Metrics
    db.prepare(`
      UPDATE recruitment_campaigns
      SET last_run_at = ?, last_run_status = 'COMPLETED', prospects_found_count = prospects_found_count + ?, prospects_imported_count = prospects_imported_count + ?, duplicates_skipped_count = duplicates_skipped_count + ?, search_mode = ?, last_error = NULL
      WHERE id = ?
    `).run(endStr, candidates.length, importedCount, duplicatesCount, searchMode, id);

    res.json({
      ok: true,
      executionId,
      campaignId: id,
      campaignName: campaign.name,
      profilesFound: candidates.length,
      profilesImported: importedCount,
      duplicatesSkipped: duplicatesCount,
      isSimulated: apolloResults.isSimulated,
      searchCriteriaUsed: apolloResults.searchCriteriaUsed,
      message: `Campaign execution completed. Discovered ${candidates.length} candidate profiles (${importedCount} imported, ${duplicatesCount} duplicates skipped).`,
    });
  } catch (err) {
    console.error(`[Campaign Run Failed: ${id}]`, err.message);
    const endStr = new Date().toISOString();

    db.prepare(`
      UPDATE recruitment_executions
      SET completed_at = ?, status = 'FAILED', error_message = ?
      WHERE id = ?
    `).run(endStr, err.message, executionId);

    db.prepare(`
      UPDATE recruitment_campaigns
      SET last_run_at = ?, last_run_status = 'FAILED', last_error = ?
      WHERE id = ?
    `).run(endStr, err.message, id);

    res.status(500).json({ error: `Campaign execution failed: ${err.message}` });
  }
});

router.get("/campaigns/:id/executions", (req, res) => {
  const { id } = req.params;
  try {
    const list = db.prepare("SELECT * FROM recruitment_executions WHERE campaign_id = ? ORDER BY started_at DESC LIMIT 20").all(id);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. APOLLO/APIFY PROSPECTING API
router.post("/apollo/search", async (req, res) => {
  const { rawTitles, personTitles, rawLocations, personLocations, qKeywords, targetCompanies, page, perPage } = req.body;
  try {
    // The user requested to continue using the Apify API Key
    const results = await apifyService.searchPeople({
      rawTitles: rawTitles || personTitles || "Real Estate Agent / Property Consultant",
      rawLocations: rawLocations || personLocations || "Kochi, Kerala, India",
      qKeywords,
      targetCompanies: Array.isArray(targetCompanies) ? targetCompanies : [],
      searchMode: req.body.searchMode || "broad_talent_search",
      page: page || 1,
      perPage: parseInt(perPage, 10) || 10,
    });
    res.json(results);
  } catch (err) {
    // Never let this reach the frontend as an alert — return structured error
    console.error("[Apollo/Apify Search Route Error]", err.message);
    res.json({
      people: [],
      isSimulated: true,
      error: err.message,
      pagination: { page: 1, perPage: 10, totalPages: 0, totalEntries: 0 },
    });
  }
});

router.post("/apollo/import", (req, res) => {
  const { campaignId, selectedCandidates = [] } = req.body;

  if (!campaignId || selectedCandidates.length === 0) {
    return res.status(400).json({ error: "Campaign ID and selected candidates are required." });
  }

  let importedCount = 0;

  for (const c of selectedCandidates) {
    try {
      const existing = db.prepare("SELECT id FROM recruitment_prospects WHERE apollo_id = ?").get(c.apolloId);
      if (!existing) {
        const pId = `PRP-${newUuid().slice(0, 8)}`;
        
        // Insert Prospect Core Data
        db.prepare(`
          INSERT INTO recruitment_prospects (id, campaign_id, apollo_id, full_name, first_name, last_name, job_title, company_name, location, linkedin_url, experience_years, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DISCOVERED')
        `).run(
          pId,
          campaignId,
          c.apolloId,
          c.fullName,
          c.firstName,
          c.lastName,
          c.jobTitle,
          c.companyName,
          c.location,
          c.linkedinUrl,
          c.experienceYears || 4
        );
        
        // Save Apify Scraped Contact Data instantly
        const contactId = `PRPC-${newUuid().slice(0, 8)}`;
        const emailAddress = c.email?.email || c.email || null;
        db.prepare(`
          INSERT INTO prospect_contacts (id, prospect_id, email, email_status, phone, phone_status)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          contactId,
          pId,
          emailAddress,
          emailAddress ? 'verified' : 'unverified', // Apify data is considered verified
          c.phone || null,
          c.phone ? 'verified' : 'unverified'
        );

        importedCount++;
      }
    } catch (e) {
      console.warn("[Import Note]", e.message);
    }
  }

  res.json({ ok: true, importedCount, message: `Successfully imported ${importedCount} candidate profiles with status = 'DISCOVERED'.` });
});

// 3. PROSPECTS MANAGEMENT & REVIEW API
router.get("/prospects", (req, res) => {
  const { campaignId, status, search } = req.query;

  try {
    let query = `
      SELECT p.*, c.name as campaign_name, cnt.email, cnt.phone, cnt.email_status, cnt.phone_status, cnt.whatsapp_optin, a.match_score, a.potential_fit
      FROM recruitment_prospects p
      JOIN recruitment_campaigns c ON p.campaign_id = c.id
      LEFT JOIN prospect_contacts cnt ON p.id = cnt.prospect_id
      LEFT JOIN prospect_ai_analysis a ON p.id = a.prospect_id
      WHERE 1=1
    `;
    const params = [];

    if (campaignId && campaignId !== "all") {
      query += " AND p.campaign_id = ?";
      params.push(campaignId);
    }
    if (status && status !== "all") {
      query += " AND p.status = ?";
      params.push(status);
    }
    if (search) {
      query += " AND (p.full_name LIKE ? OR p.company_name LIKE ? OR p.job_title LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += " ORDER BY p.created_at DESC";

    const prospects = db.prepare(query).all(params);
    res.json(prospects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/prospects/:id/review", (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body; // approve, reject, shortlist, do_not_contact

  let newStatus = "APPROVED";
  if (action === "reject") newStatus = "REJECTED";
  if (action === "shortlist") newStatus = "SHORTLISTED";
  if (action === "do_not_contact") newStatus = "DO_NOT_CONTACT";
  if (action === "pending_review") newStatus = "PENDING_REVIEW";

  try {
    db.prepare(`
      UPDATE recruitment_prospects
      SET status = ?, review_notes = ?, reviewed_by = 'Admin Recruiter', reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, notes || "", id);

    // Record Event
    db.prepare(`
      INSERT INTO recruitment_events (id, prospect_id, event_type, performed_by, performed_by_name, details_json)
      VALUES (?, ?, ?, 'admin', 'Admin Recruiter', ?)
    `).run(`EVT-${newUuid().slice(0, 8)}`, id, `PROSPECT_${newStatus}`, JSON.stringify({ action, notes }));

    const updated = db.prepare("SELECT * FROM recruitment_prospects WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. CONTACT ENRICHMENT API
router.post("/prospects/:id/enrich", async (req, res) => {
  const { id } = req.params;
  try {
    const contact = await enrichProspectContact(db, id);
    res.json({ ok: true, contact });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 5. AI MATCH ANALYSIS API
router.post("/prospects/:id/analyze", async (req, res) => {
  const { id } = req.params;
  try {
    const analysis = await analyzeProspectMatch(db, id);
    res.json({ ok: true, analysis });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. AI OUTREACH MESSAGE DRAFTING API
router.post("/prospects/:id/draft-message", async (req, res) => {
  const { id } = req.params;
  const { channel } = req.body; // email or whatsapp
  try {
    const message = await generateOutreachDraft(db, id, channel || "email");
    res.json({ ok: true, message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/messages", (req, res) => {
  const { prospectId } = req.query;
  try {
    let query = "SELECT m.*, p.full_name, p.company_name FROM outreach_messages m JOIN recruitment_prospects p ON m.prospect_id = p.id";
    const params = [];
    if (prospectId) {
      query += " WHERE m.prospect_id = ?";
      params.push(prospectId);
    }
    query += " ORDER BY m.created_at DESC";
    const list = db.prepare(query).all(params);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/messages/:id", (req, res) => {
  const { id } = req.params;
  const { subject, body } = req.body;
  try {
    db.prepare("UPDATE outreach_messages SET subject = ?, body = ? WHERE id = ?").run(subject, body, id);
    const updated = db.prepare("SELECT * FROM outreach_messages WHERE id = ?").get(id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/messages/:id/approve", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare(`
      UPDATE outreach_messages
      SET status = 'ADMIN_APPROVED', approved_by = 'Admin Recruiter', approved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    const msg = db.prepare("SELECT * FROM outreach_messages WHERE id = ?").get(id);
    db.prepare("UPDATE recruitment_prospects SET status = 'MESSAGE_APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(msg.prospect_id);

    res.json({ ok: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/messages/:id/send", async (req, res) => {
  const { id } = req.params;
  const message = db.prepare("SELECT * FROM outreach_messages WHERE id = ?").get(id);

  if (!message) return res.status(404).json({ error: "Message not found." });

  try {
    let result;
    if (message.channel === "whatsapp") {
      result = await sendWhatsAppOutreach(db, id, "Admin Recruiter");
    } else if (message.channel === "telegram") {
      // Telegram outreach for recruitment prospects
      const prospect = db.prepare("SELECT * FROM recruitment_prospects WHERE id = ?").get(message.prospect_id);
      const contact = db.prepare("SELECT * FROM prospect_contacts WHERE prospect_id = ?").get(message.prospect_id);
      
      if (!contact || !contact.phone) {
        return res.status(400).json({ error: "No phone number found for candidate. Run contact enrichment first." });
      }

      const { sendTelegramMessageByPhone } = await import("../integrations/telegram.js");
      const tgResult = await sendTelegramMessageByPhone({
        phone: contact.phone,
        name: prospect?.full_name || "Candidate",
        message: message.body,
      });

      const nowStr = new Date().toISOString();
      db.prepare("UPDATE outreach_messages SET status = 'SENT', sent_at = ? WHERE id = ?").run(nowStr, id);
      db.prepare("UPDATE recruitment_prospects SET status = 'CONTACTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(message.prospect_id);
      db.prepare(`
        INSERT INTO recruitment_events (id, prospect_id, event_type, performed_by, performed_by_name, details_json)
        VALUES (?, ?, 'TELEGRAM_SENT', 'admin', 'Admin Recruiter', ?)
      `).run(`EVT-${newUuid().slice(0, 8)}`, message.prospect_id, JSON.stringify({ messageId: id, telegramUserId: tgResult.telegramUserId }));

      result = { ok: true, messageId: id, sentTo: contact.phone, telegramUserId: tgResult.telegramUserId, sentAt: nowStr };
    } else {
      result = await sendEmailOutreach(db, id, "Admin Recruiter");
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 7. CANDIDATE AI CHAT & CONVERSATIONS API
router.post("/chat", async (req, res) => {
  const { prospectId, messageText, channel } = req.body;
  if (!prospectId || !messageText) {
    return res.status(400).json({ error: "Prospect ID and message text are required." });
  }
  try {
    const reply = await handleCandidateQuery(db, prospectId, messageText, channel || "email");
    res.json(reply);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/conversations/:prospectId", (req, res) => {
  const { prospectId } = req.params;
  try {
    const list = db.prepare("SELECT * FROM recruitment_conversations WHERE prospect_id = ? ORDER BY created_at ASC").all(prospectId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. RECRUITMENT ANALYTICS & DASHBOARD API
router.get("/analytics", (req, res) => {
  try {
    const campaigns = db.prepare("SELECT * FROM recruitment_campaigns").all();
    const prospects = db.prepare("SELECT * FROM recruitment_prospects").all();
    const messages = db.prepare("SELECT * FROM outreach_messages").all();

    const totalDiscovered = prospects.length;
    const totalApproved = prospects.filter((p) => ["APPROVED", "SHORTLISTED", "CONTACT_READY", "MESSAGE_DRAFTED", "MESSAGE_APPROVED", "CONTACTED", "REPLIED", "INTERESTED", "INTERVIEW", "OFFER", "HIRED"].includes(p.status)).length;
    const totalContacted = prospects.filter((p) => ["CONTACTED", "REPLIED", "INTERESTED", "INTERVIEW", "OFFER", "HIRED"].includes(p.status)).length;
    const totalReplied = prospects.filter((p) => ["REPLIED", "INTERESTED", "INTERVIEW", "OFFER", "HIRED"].includes(p.status)).length;
    const totalInterview = prospects.filter((p) => ["INTERVIEW", "OFFER", "HIRED"].includes(p.status)).length;
    const totalHired = prospects.filter((p) => p.status === "HIRED").length;

    res.json({
      summaryCards: {
        activeCampaigns: campaigns.filter((c) => c.status === "active").length,
        profilesFound: totalDiscovered,
        pendingReview: prospects.filter((p) => p.status === "DISCOVERED" || p.status === "PENDING_REVIEW").length,
        approved: totalApproved,
        contacted: totalContacted,
        replies: totalReplied,
        interviews: totalInterview,
        hired: totalHired,
      },
      conversionFunnel: {
        discoveredToApproved: totalDiscovered ? Math.round((totalApproved / totalDiscovered) * 100) : 0,
        approvedToContacted: totalApproved ? Math.round((totalContacted / totalApproved) * 100) : 0,
        contactedToReplied: totalContacted ? Math.round((totalReplied / totalContacted) * 100) : 0,
        repliedToInterview: totalReplied ? Math.round((totalInterview / totalReplied) * 100) : 0,
        interviewToHired: totalInterview ? Math.round((totalHired / totalInterview) * 100) : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. RECRUITMENT KNOWLEDGE BASE API
router.get("/kb", (req, res) => {
  res.json(getRecruitmentKnowledgeBase());
});

export default router;
