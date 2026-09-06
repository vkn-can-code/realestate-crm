import { newUuid } from "../../data/db.js";

const RECRUITMENT_KB = {
  brokerageName: "RealtyPulse Real Estate Agency",
  commissionSplit: "85/15 split with $15,000 annual cap (100% payout after cap)",
  deskFees: "$0 desk fees, $0 franchise royalty fees, $0 tech fees",
  leadSupport: "In-house AI lead routing + 15–20 buyer/seller inquiries monthly per active advisor",
  technology: "Proprietary AI CRM, automated voice bots, marketing suite, and digital offer generator",
  training: "Weekly executive mastermind, 1-on-1 sales coaching, and luxury property marketing certification",
  territories: "Miami, Fort Lauderdale, West Palm Beach, Austin, and major US metropolitan markets",
  onboardingProcess: "Fast-track 48-hour onboarding, license transfer assistance, and immediate CRM access",
};

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

export async function handleCandidateQuery(db, prospectId, candidateMsgText, channel = "email") {
  const prospect = db.prepare("SELECT * FROM recruitment_prospects WHERE id = ?").get(prospectId);
  if (!prospect) throw new Error("Prospect not found.");

  const nowStr = new Date().toISOString();

  // 1. Record Candidate Message
  db.prepare(`
    INSERT INTO recruitment_conversations (id, prospect_id, sender, channel, message_text, created_at)
    VALUES (?, ?, 'candidate', ?, ?, ?)
  `).run(`CONV-${newUuid().slice(0, 8)}`, prospectId, channel, candidateMsgText, nowStr);

  // Update prospect status to REPLIED
  db.prepare("UPDATE recruitment_prospects SET status = 'REPLIED', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(prospectId);

  // Check for Human Escalation Keywords
  const lowerMsg = candidateMsgText.toLowerCase();
  const escalationKeywords = ["human", "recruiter", "manager", "broker", "negotiate", "legal", "lawsuit", "contract", "salary override"];
  const requiresHuman = escalationKeywords.some((k) => lowerMsg.includes(k));

  if (requiresHuman) {
    // Record AI Escalation Message
    const escText = `Thank you for asking! I'm transferring your message directly to our Managing Broker & Talent Team. A recruiter will contact you directly within 2 hours.`;

    db.prepare(`
      INSERT INTO recruitment_conversations (id, prospect_id, sender, channel, message_text, intent_detected, ai_confidence, escalated_to_human, created_at)
      VALUES (?, ?, 'ai_agent', ?, ?, 'HUMAN_ESCALATION_REQUESTED', 0.50, 1, ?)
    `).run(`CONV-${newUuid().slice(0, 8)}`, prospectId, channel, escText, nowStr);

    db.prepare(`
      INSERT INTO recruitment_events (id, prospect_id, event_type, performed_by, performed_by_name, details_json)
      VALUES (?, ?, 'HUMAN_ESCALATION', 'system', 'Recruitment AI Bot', ?)
    `).run(`EVT-${newUuid().slice(0, 8)}`, prospectId, JSON.stringify({ reason: "Candidate requested human/broker interaction", candidateMsg: candidateMsgText }));

    return {
      replyText: escText,
      escalatedToHuman: true,
      reason: "Candidate requested human recruiter / compensation negotiation",
    };
  }

  // 2. Generate AI Agent Reply using Knowledge Base
  const prompt = `
You are the AI Recruitment Assistant for RealtyPulse Real Estate Agency. Respond politely, helpfully, and concisely to the candidate's question using our official brokerage knowledge base below.

BROKERAGE KNOWLEDGE BASE:
- Name: ${RECRUITMENT_KB.brokerageName}
- Commission Split: ${RECRUITMENT_KB.commissionSplit}
- Fees: ${RECRUITMENT_KB.deskFees}
- Lead Distribution: ${RECRUITMENT_KB.leadSupport}
- Tech Suite: ${RECRUITMENT_KB.technology}
- Coaching: ${RECRUITMENT_KB.training}
- Onboarding: ${RECRUITMENT_KB.onboardingProcess}

CANDIDATE QUESTION: "${candidateMsgText}"

INSTRUCTIONS:
Provide a 2-3 sentence answer directly addressing their question, and invite them to schedule a brief interview.
`;

  let aiReplyText = await callGeminiFlash(prompt);

  if (!aiReplyText) {
    // Fallback Knowledge Base Answer Generator
    if (lowerMsg.includes("commission") || lowerMsg.includes("split") || lowerMsg.includes("cap")) {
      aiReplyText = `We offer an industry-leading 85/15 commission split with a $15,000 annual cap—after capping, you keep 100% of your commission! There are zero desk or monthly fees. Would you like to schedule a quick 10-minute intro call with our managing broker?`;
    } else if (lowerMsg.includes("lead") || lowerMsg.includes("support")) {
      aiReplyText = `We provide active agents with 15–20 pre-qualified buyer and seller leads monthly through our proprietary AI lead distribution system! Would you be open to an intro call to view a live demo?`;
    } else {
      aiReplyText = `At RealtyPulse, we offer 85/15 splits, zero desk fees, and full AI tech suite support. We'd love to discuss how our platform fits your growth goals! What time works best for a confidential 10-minute chat?`;
    }
  }

  db.prepare(`
    INSERT INTO recruitment_conversations (id, prospect_id, sender, channel, message_text, intent_detected, ai_confidence, escalated_to_human, created_at)
    VALUES (?, ?, 'ai_agent', ?, ?, 'GENERAL_INQUIRY', 0.95, 0, ?)
  `).run(`CONV-${newUuid().slice(0, 8)}`, prospectId, channel, aiReplyText, nowStr);

  return {
    replyText: aiReplyText,
    escalatedToHuman: false,
    kbUsed: true,
  };
}

export function getRecruitmentKnowledgeBase() {
  return RECRUITMENT_KB;
}
