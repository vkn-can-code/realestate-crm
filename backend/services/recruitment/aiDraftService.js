import { newUuid } from "../../data/db.js";

async function callGeminiFlash(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
  } catch (err) {
    console.warn("[Gemini API Note]", err.message);
  }
  return null;
}

export async function generateOutreachDraft(db, prospectId, channel = "email") {
  const prospect = db.prepare(`
    SELECT p.*, c.name as campaign_name, c.target_role, c.location as campaign_location, c.specialization
    FROM recruitment_prospects p
    JOIN recruitment_campaigns c ON p.campaign_id = c.id
    WHERE p.id = ?
  `).get(prospectId);

  if (!prospect) throw new Error("Prospect not found.");

  const analysis = db.prepare("SELECT * FROM prospect_ai_analysis WHERE prospect_id = ?").get(prospectId);

  const prompt = `
You are an executive talent recruiter for RealtyPulse Real Estate Agency. Draft a warm, highly professional, non-pushy recruitment message for an experienced agent.

CANDIDATE:
- Name: ${prospect.full_name}
- Current Brokerage: ${prospect.company_name}
- Location: ${prospect.location}
- Specialization: ${prospect.specialization || "Luxury Residential"}
- Recruitment Angle: ${analysis?.recruitment_angle || "Highlight top commission splits and AI CRM platform"}

BROKERAGE VALUE PROPOSITION:
- 85/15 Commission Split with $15,000 annual cap
- Proprietary AI Lead Generation & Voice Bot Suite
- Zero Desk Fees or Franchise Royalty Fees
- In-house Marketing & Media Production Team

CHANNEL: ${channel.toUpperCase()}

FORMAT REQUIREMENTS:
If channel is EMAIL, output JSON with "subject" and "body".
If channel is WHATSAPP, output JSON with "body" (concise, conversational).

JSON Output Example:
{
  "subject": "Confidential Partnership Inquiry — RealtyPulse Executive Team",
  "body": "Hi ${prospect.first_name || 'Agent'},\n\nI've been following your successful transactions in ${prospect.location || 'the area'} with ${prospect.company_name || 'your brokerage'}..."
}
`;

  let subject = null;
  let body = null;
  const rawText = await callGeminiFlash(prompt);

  if (rawText) {
    try {
      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      subject = parsed.subject || null;
      body = parsed.body || null;
    } catch (e) {
      console.warn("[Draft Parse Note]", e.message);
    }
  }

  if (!body) {
    // Fallback Structured Message Generator
    if (channel === "email") {
      subject = `Confidential Growth Opportunity — ${prospect.full_name || 'Real Estate Partner'}`;
      body = `Hi ${prospect.first_name || 'there'},\n\n` +
        `I’ve been following your impressive track record at ${prospect.company_name || 'your current brokerage'} in ${prospect.location || 'Miami'}.\n\n` +
        `At RealtyPulse, we are expanding our ${prospect.specialization || 'Luxury Residential'} team and wanted to reach out confidentially. ` +
        `We provide our advisors with an **85/15 commission split**, zero desk fees, and an in-house AI Lead Generation & CRM suite that automates buyer follow-ups.\n\n` +
        `Would you be open to a brief, 10-minute confidential coffee conversation this week?\n\n` +
        `Best regards,\n` +
        `Principal Broker & Talent Team\nRealtyPulse Agency`;
    } else {
      subject = "WhatsApp Outreach";
      body = `Hi ${prospect.first_name || 'there'}! 👋 I noticed your active listings in ${prospect.location || 'Miami'} with ${prospect.company_name || 'your brokerage'}. ` +
        `RealtyPulse is expanding our local team with 85/15 commission splits and automated AI lead tools. Would love to share quick details if you're open to a brief chat!`;
    }
  }

  const msgId = `MSG-${newUuid().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO outreach_messages (id, prospect_id, channel, subject, body, whatsapp_template_name, status)
    VALUES (?, ?, ?, ?, ?, ?, 'DRAFT')
  `).run(
    msgId,
    prospectId,
    channel,
    subject,
    body,
    channel === "whatsapp" ? "recruitment_outreach_v1" : null
  );

  // Update prospect status to MESSAGE_DRAFTED
  db.prepare("UPDATE recruitment_prospects SET status = 'MESSAGE_DRAFTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(prospectId);

  return db.prepare("SELECT * FROM outreach_messages WHERE id = ?").get(msgId);
}
