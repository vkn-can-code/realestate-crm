import { Router } from "express";
import { properties } from "../data/store.js";
import { generateProposalPdf } from "../services/pdfGenerator.js";
import { sendProposalEmail } from "../services/emailService.js";

const router = Router();

function getPublicBaseUrl() {
  const envUrl = process.env.PUBLIC_BASE_URL;
  if (envUrl && !envUrl.includes("192.168.")) {
    return envUrl;
  }
  return "http://localhost:5001";
}

// POST /api/proposals/generate -> Generate Multi-Page 6-Photo PDF Proposal Catalog
router.post("/generate", async (req, res) => {
  try {
    const { propertyIds, leadId, phone, customerName, email, requirement, location, budget, bedrooms, listingIntent, maxCount } = req.body || {};

    const cleanPhone = (phone || "").replace(/[^0-9+]/g, "");
    const limit = parseInt(maxCount, 10) || 5;

    let matched = [];

    // 1. Manual Selection Mode: If specific propertyIds provided from Dashboard UI
    if (Array.isArray(propertyIds) && propertyIds.length > 0) {
      matched = properties.filter((p) => propertyIds.includes(p.id));
    }

    // 2. Dynamic AI Call / Chatbot Matcher Mode
    if (matched.length === 0) {
      matched = properties.filter((p) => p.status === "Available");

      const reqIntent = listingIntent || (typeof requirement === "object" ? requirement.listingIntent || requirement.intent : null);
      if (reqIntent && typeof reqIntent === "string") {
        matched = matched.filter((p) =>
          p.listingIntent === reqIntent ||
          (reqIntent.includes("rent") && p.listingIntent?.includes("rent")) ||
          (reqIntent.includes("sell") && p.listingIntent?.includes("sell"))
        );
      }

      const reqLoc = location || (typeof requirement === "object" ? requirement.location : null);
      if (reqLoc && typeof reqLoc === "string") {
        const locLower = reqLoc.toLowerCase();
        const locMatches = matched.filter((p) => p.location.toLowerCase().includes(locLower) || locLower.includes(p.location.toLowerCase()));
        if (locMatches.length > 0) matched = locMatches;
      }

      const reqBhk = bedrooms || (typeof requirement === "object" ? requirement.bedrooms : null);
      if (reqBhk) {
        const bhkNum = parseInt(reqBhk, 10);
        if (!isNaN(bhkNum)) {
          const bhkMatches = matched.filter((p) => p.bedrooms === bhkNum);
          if (bhkMatches.length > 0) matched = bhkMatches;
        }
      }

      const reqBudget = budget || (typeof requirement === "object" ? requirement.maxBudget || requirement.budget : null);
      if (reqBudget) {
        const budgetNum = parseFloat(reqBudget);
        if (!isNaN(budgetNum)) {
          const budgetMatches = matched.filter((p) => p.price <= budgetNum);
          if (budgetMatches.length > 0) matched = budgetMatches;
        }
      }

      // Fallback if zero match
      if (matched.length === 0) {
        matched = properties.filter((p) => p.status === "Available").slice(0, limit);
      } else {
        matched = matched.slice(0, limit);
      }
    }

    const proposalId = `PROP-${Date.now().toString().slice(-6)}`;

    // 3. Generate PDF Document
    const pdfResult = await generateProposalPdf({
      proposalId,
      customerName: customerName || "Valued Client",
      phone: cleanPhone || phone || "Voice Lead",
      requirement: requirement || { location, budget, bedrooms, listingIntent },
      properties: matched,
    });

    const publicBase = getPublicBaseUrl();
    const fullPdfUrl = `${publicBase}${pdfResult.pdfUrl}`;

    console.log(`✅ [PDF Luxury Proposal Generated] ${proposalId} -> ${fullPdfUrl} (${matched.length} properties)`);

    // Auto-dispatch proposal email if recipient email provided
    const targetEmail = email || (typeof requirement === "object" ? requirement.email : null);
    let emailSent = false;
    if (targetEmail) {
      const eRes = await sendProposalEmail({
        toEmail: targetEmail,
        customerName: customerName || "Valued Client",
        proposalId,
        pdfUrl: fullPdfUrl,
        properties: matched,
      });
      emailSent = eRes.ok;
    }

    res.json({
      ok: true,
      proposalId,
      pdfUrl: `http://localhost:5001${pdfResult.pdfUrl}`,
      publicPdfUrl: fullPdfUrl,
      relativePath: pdfResult.pdfUrl,
      filename: pdfResult.filename,
      propertiesMatchedCount: matched.length,
      propertiesMatched: matched,
      emailSent,
    });
  } catch (err) {
    console.error(`❌ [PDF Generation Error] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

export default router;
