import { Router } from "express";
import db, { newUuid } from "../data/db.js";
import { MARKETING_TEMPLATES, RATIOS, analyzePropertyImages, generateSocialCopy, generateCreativeConcepts, aiRestyleDesign, getTemplateLayout, getAllRatioLayouts, generateAIDesignLayout } from "../services/socialService.js";
import nanoBanana from "../integrations/nanoBanana.js";
import { brandProfile, saveToDisk } from "../data/store.js";

const router = Router();

// GET /api/social/templates -> List 30 templates grouped by category
router.get("/templates", (req, res) => {
  res.json({
    count: MARKETING_TEMPLATES.length,
    categories: [...new Set(MARKETING_TEMPLATES.map((t) => t.category))],
    templates: MARKETING_TEMPLATES,
  });
});

// GET /api/social/ratios -> List supported social ratios/specs
router.get("/ratios", (req, res) => {
  res.json({ ratios: Object.values(RATIOS) });
});

// POST /api/social/template-layout -> Fetch Bespoke Layer Stack for any template
router.post("/template-layout", (req, res) => {
  try {
    const { templateId, propertyData, brandKit, ratio, opts } = req.body || {};
    const layout = getTemplateLayout(templateId, propertyData, brandKit, ratio || "instagram_post", opts || {});
    res.json(layout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/template-layout/all-ratios -> Same template rendered in every supported ratio
router.post("/template-layout/all-ratios", (req, res) => {
  try {
    const { templateId, propertyData, brandKit } = req.body || {};
    const layouts = getAllRatioLayouts(templateId, propertyData, brandKit);
    res.json({ templateId, layouts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/analyze-property-images -> Vision AI Photo Analysis
router.post("/analyze-property-images", async (req, res) => {
  try {
    const { propertyTitle, images } = req.body || {};
    const result = await analyzePropertyImages({ propertyTitle, images });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/generate-copy -> Gemini Structured Marketing Copy Generator
router.post("/generate-copy", async (req, res) => {
  try {
    const { propertyData, templateId, platform, brandKit } = req.body || {};
    const result = await generateSocialCopy({ propertyData, templateId, platform, brandKit });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/ai-generate-design -> Gemini 2.0 AI Vision & Design Director Generator
router.post("/ai-generate-design", async (req, res) => {
  try {
    const { templateId, propertyData, brandKit, ratio, styleTheme } = req.body || {};
    const layout = await generateAIDesignLayout({ templateId, propertyData, brandKit, ratio, styleTheme });
    res.json(layout);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/ai-creative-director -> Generate 4 Distinct Creative Concepts
router.post("/ai-creative-director", async (req, res) => {
  try {
    const { prompt, propertyData, brandKit, campaignCategory } = req.body || {};
    const concepts = await generateCreativeConcepts({ prompt, propertyData, brandKit, campaignCategory });
    res.json(concepts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/ai-restyle -> 1-Click AI Restyle System
router.post("/ai-restyle", async (req, res) => {
  try {
    const { currentDesign, restyleAction, propertyData, brandKit } = req.body || {};
    const restyled = await aiRestyleDesign({ currentDesign, restyleAction, propertyData, brandKit });
    res.json(restyled);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/canva/export-package -> Prepare Canva Integration Package
router.post("/canva/export-package", async (req, res) => {
  try {
    const { designConfig, brandKit, propertyData } = req.body || {};
    const { createCanvaExportPackage } = await import("../services/canvaService.js");
    const result = await createCanvaExportPackage({ designConfig, brandKit, propertyData });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/canva/import-asset -> Import Canva Design Asset
router.post("/canva/import-asset", async (req, res) => {
  try {
    const { canvaPayload } = req.body || {};
    const { importCanvaDesignAsset } = await import("../services/canvaService.js");
    const result = await importCanvaDesignAsset({ canvaPayload });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/brand-kits -> List all Brokerage Brand Kits
router.get("/brand-kits", (req, res) => {
  try {
    const kits = db.prepare("SELECT * FROM brand_kits ORDER BY is_default DESC, created_at DESC").all();
    res.json(kits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/brand-kits -> Create or Update Brand Kit
router.post("/brand-kits", (req, res) => {
  try {
    const {
      id,
      name,
      brokerage_name,
      logo_url,
      primary_color,
      secondary_color,
      accent_color,
      agent_name,
      agent_phone,
      agent_email,
      website,
      social_handles,
      is_default,
    } = req.body || {};

    const kitId = id || `brand-${newUuid().slice(0, 8)}`;

    if (is_default) {
      db.prepare("UPDATE brand_kits SET is_default = 0").run();
    }

    db.prepare(`
      INSERT INTO brand_kits (id, name, brokerage_name, logo_url, primary_color, secondary_color, accent_color, agent_name, agent_phone, agent_email, website, social_handles, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        brokerage_name=excluded.brokerage_name,
        logo_url=excluded.logo_url,
        primary_color=excluded.primary_color,
        secondary_color=excluded.secondary_color,
        accent_color=excluded.accent_color,
        agent_name=excluded.agent_name,
        agent_phone=excluded.agent_phone,
        agent_email=excluded.agent_email,
        website=excluded.website,
        social_handles=excluded.social_handles,
        is_default=excluded.is_default
    `).run(
      kitId,
      name || "Brokerage Brand Kit",
      brokerage_name || "RealtyPulse Brokerage",
      logo_url || "",
      primary_color || "#2563EB",
      secondary_color || "#0F172A",
      accent_color || "#D97706",
      agent_name || "Adwayth VS",
      agent_phone || "+1 (800) 555-REAL",
      agent_email || "agent@realtypulse.com",
      website || "www.realtypulse.com",
      social_handles || "@RealtyPulse",
      is_default ? 1 : 0
    );

    const saved = db.prepare("SELECT * FROM brand_kits WHERE id = ?").get(kitId);
    res.json({ ok: true, brandKit: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/social/posts -> Fetch Saved Social Post History
router.get("/posts", (req, res) => {
  try {
    const posts = db.prepare("SELECT * FROM social_posts ORDER BY created_at DESC").all();
    const enriched = posts.map((p) => {
      let imageConfig = {};
      try { imageConfig = JSON.parse(p.image_config); } catch (e) {}
      return { ...p, imageConfig };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/posts -> Save Draft or Published Social Post
router.post("/posts", (req, res) => {
  try {
    const {
      property_id,
      template_id,
      platform,
      headline,
      subheadline,
      caption,
      hashtags,
      image_config,
      brand_kit_id,
      status,
      created_by,
    } = req.body || {};

    const postId = `post-${newUuid().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO social_posts (id, property_id, template_id, platform, headline, subheadline, caption, hashtags, image_config, brand_kit_id, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      postId,
      property_id || null,
      template_id || "new_listing_showcase",
      platform || "instagram_post",
      headline || "",
      subheadline || "",
      caption || "",
      hashtags || "",
      typeof image_config === "object" ? JSON.stringify(image_config) : image_config || "{}",
      brand_kit_id || null,
      status || "DRAFT",
      created_by || "Admin Manager"
    );

    const saved = db.prepare("SELECT * FROM social_posts WHERE id = ?").get(postId);
    res.json({ ok: true, post: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/social/posts/:id -> Update Status or Content of Social Post
router.put("/posts/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { status, headline, caption, hashtags } = req.body || {};

    db.prepare(`
      UPDATE social_posts
      SET status = COALESCE(?, status),
          headline = COALESCE(?, headline),
          caption = COALESCE(?, caption),
          hashtags = COALESCE(?, hashtags)
      WHERE id = ?
    `).run(status, headline, caption, hashtags, id);

    const updated = db.prepare("SELECT * FROM social_posts WHERE id = ?").get(id);
    res.json({ ok: true, post: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/social/render -> Render High-DPI Poster Canvas Output
router.post("/render", async (req, res) => {
  try {
    const {
      templateId,
      title,
      price,
      bhk,
      area,
      location,
      type,
      bgImageUrl,
      brandKit,
      customBadgeText,
      platform,
    } = req.body || {};

    const result = await nanoBanana.generatePoster({
      templateId: templateId || "new_listing_showcase",
      title: title || "Luxury Real Estate Listing",
      price: price || "₹78.00 Lakhs",
      bhk: bhk || "3 BHK",
      area: area || "1450 sqft",
      location: location || "",
      type: type || "Apartment",
      agentName: brandKit?.agent_name || brandProfile.agentName,
      agentPhone: brandKit?.agent_phone || brandProfile.agentPhone,
      agencyName: brandKit?.brokerage_name || brandProfile.companyName,
      bgImageUrl,
      brandProfile: brandKit || brandProfile,
      customBadgeText,
      platform,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// BACKWARD COMPATIBILITY ENDPOINTS
router.get("/brand-profile", (req, res) => {
  res.json(brandProfile);
});

router.post("/brand-profile", (req, res) => {
  const { companyName, agentName, agentPhone, logoUrl, primaryColor, fontFamily } = req.body || {};
  if (companyName) brandProfile.companyName = companyName;
  if (agentName) brandProfile.agentName = agentName;
  if (agentPhone) brandProfile.agentPhone = agentPhone;
  if (logoUrl !== undefined) brandProfile.logoUrl = logoUrl;
  if (primaryColor) brandProfile.primaryColor = primaryColor;
  if (fontFamily) brandProfile.fontFamily = fontFamily;
  saveToDisk();
  res.json({ ok: true, brandProfile });
});

router.post("/generate", async (req, res) => {
  try {
    const result = await nanoBanana.generatePoster(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
