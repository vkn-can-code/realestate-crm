import { POSTER_TEMPLATES, renderPosterHtml } from "../services/posterTemplates.js";
import { renderPosterPng } from "../services/posterRenderer.js";

function getPublicBaseUrl() {
  const envUrl = process.env.PUBLIC_BASE_URL;
  if (envUrl && !envUrl.includes("192.168.")) {
    return envUrl;
  }
  return "http://localhost:5001";
}

/**
 * Enhances property background mood/prompt using Google Gemini Flash API (process.env.GEMINI_API_KEY)
 */
async function enhanceBackgroundMoodWithGemini(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return promptText;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Refine this background photo description for a luxury real estate social poster into a concise 1-sentence photo art direction prompt: "${promptText}"`
          }]
        }]
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    }
  } catch (err) {
    console.warn("⚠️ [Gemini Background Prompt Warning]", err.message);
  }
  return promptText;
}

/**
 * Hybrid Poster Generator:
 * 1. AI Background mood enhancement (Gemini API)
 * 2. Static HTML/CSS Template Layer (1080x1350)
 * 3. Puppeteer HTML-to-Image high-DPI PNG Renderer
 */
export async function generatePoster({
  templateId = "festive_gradient",
  title = "Skyline Luxury Apartment",
  price = "₹78.00 Lakhs",
  bhk = "3 BHK",
  area = "1450 sqft",
  location = "Kakkanad, Kochi",
  type = "Apartment",
  agentName = "Adwayth VS",
  agentPhone = "+91 9633541720",
  agencyName = "RealtyPulse Real Estate Agency",
  bgImageUrl = "",
  prompt = "",
  brandProfile = {},
  customBadgeText = "",
}) {
  console.log(`🎨 [Hybrid Poster Generation Started] Template: ${templateId} | Title: ${title}`);

  // 1. AI Background Mood Step
  let enhancedPrompt = prompt;
  if (prompt) {
    enhancedPrompt = await enhanceBackgroundMoodWithGemini(prompt);
  }

  const selectedBg = bgImageUrl || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop";

  // 2. HTML Template Generation Step
  const htmlContent = renderPosterHtml({
    templateId,
    title,
    price,
    bhk,
    area,
    location,
    type,
    agentName: brandProfile?.agentName || agentName,
    agentPhone: brandProfile?.agentPhone || agentPhone,
    agencyName: brandProfile?.companyName || agencyName,
    agencyLogo: brandProfile?.logoUrl || "",
    bgImageUrl: selectedBg,
    primaryColor: brandProfile?.primaryColor || "#3B82F6",
    fontFamily: brandProfile?.fontFamily || "'Plus Jakarta Sans', sans-serif",
    customBadgeText,
  });

  // 3. Puppeteer Renderer Step
  const renderResult = await renderPosterPng(htmlContent);

  const publicBase = getPublicBaseUrl();
  const fullImageUrl = `${publicBase}${renderResult.posterUrl}`;
  const localImageUrl = `http://localhost:5001${renderResult.posterUrl}`;

  console.log(`✅ [Hybrid Poster Rendered] ${fullImageUrl}`);

  return {
    ok: true,
    templateId,
    imageUrl: localImageUrl,
    publicImageUrl: fullImageUrl,
    relativePath: renderResult.posterUrl,
    filename: renderResult.filename,
    enhancedPrompt,
  };
}

export default { generatePoster, POSTER_TEMPLATES };
