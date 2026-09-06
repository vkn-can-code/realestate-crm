/**
 * AI Next Action Suggestion Service
 * Analyzes lead requirement, budget, location, previous conversations, and property matches to generate intelligent next action using Gemini API.
 */

export async function generateAiNextAction(lead, activities = [], propertyMatches = []) {
  const defaultRec = {
    recommendedNextAction: "Send WhatsApp message with matched property options and schedule follow-up call",
    recommendedChannel: "WhatsApp",
    recommendedFollowUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    suggestedMessage: `Hi ${lead.name || 'there'} 👋 We found property options matching your budget of ${lead.budget || 'your criteria'} in ${lead.location || 'Kakkanad'}. Would you like to schedule a site visit?`,
    reasonForRecommendation: `Lead is in '${lead.kanban_stage || lead.status || 'New'}' stage with active requirement matching ${propertyMatches[0]?.property?.title || 'available inventory'}.`,
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return defaultRec;

  try {
    const prompt = `You are a Senior Real Estate Sales Director AI. Analyze the following lead profile and recommend the exact next action for the salesperson.

LEAD PROFILE:
- Name: ${lead.name}
- Current Stage: ${lead.kanban_stage || lead.status}
- Requirement: ${lead.requirement || 'Not specified'}
- Budget: ${lead.budget || 'Not specified'}
- Location: ${lead.location || 'Not specified'}
- Temperature: ${lead.lead_temperature || 'Warm'}
- Last Interaction: ${lead.last_interaction_at || lead.created_at || 'Recently'}

TOP MATCHED PROPERTIES:
${propertyMatches.map((m) => `- ${m.property.title} (₹${(m.property.price / 100000).toFixed(1)} Lakhs in ${m.property.location})`).join("\n")}

RECENT ACTIVITIES:
${activities.slice(0, 5).map((a) => `- [${a.activity_type}] ${a.title}: ${a.description}`).join("\n")}

Respond ONLY with a valid JSON object matching this schema:
{
  "recommendedNextAction": "string describing specific next step",
  "recommendedChannel": "WhatsApp | Call | Email",
  "recommendedFollowUpDate": "YYYY-MM-DD",
  "suggestedMessage": "personalized outreach message text",
  "reasonForRecommendation": "clear strategic explanation based on lead data"
}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const text = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    }
  } catch (err) {
    console.warn("[AI Next Action Service Note]", err.message);
  }

  return defaultRec;
}
