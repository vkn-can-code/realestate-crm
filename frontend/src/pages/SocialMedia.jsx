import { useState, useEffect, useMemo, useRef } from "react";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import CanvasEditor from "../components/social/CanvasEditor.jsx";
import LayerInspector from "../components/social/LayerInspector.jsx";
import AICreativeDirectorModal from "../components/social/AICreativeDirectorModal.jsx";

import {
  Sparkles,
  Building,
  Home,
  Download,
  Copy,
  Palette,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  RefreshCw,
  Eye,
  Layers,
  FileText,
  Plus,
  Trash2,
  Bookmark,
  ExternalLink,
  Zap,
  Tag,
  Layout,
  Wand2,
  Undo,
  Redo,
  Share2,
  X,
  Compass,
  Lock,
} from "lucide-react";

// CATEGORIES & PLATFORMS
const CATEGORIES = [
  "ALL",
  "PROPERTY MARKETING",
  "AGENT / BROKERAGE BRANDING",
  "SOCIAL PROOF",
  "EDUCATION",
  "ENGAGEMENT / COMMUNITY",
];

const PLATFORMS = [
  { id: "instagram_post", label: "Instagram Post", ratio: "1:1", width: 540, height: 540, spec: "1080 × 1080" },
  { id: "instagram_portrait", label: "Instagram Portrait", ratio: "4:5", width: 480, height: 600, spec: "1080 × 1350" },
  { id: "instagram_story", label: "Instagram Story", ratio: "9:16", width: 360, height: 640, spec: "1080 × 1920" },
  { id: "facebook_post", label: "Facebook Post", ratio: "1.91:1", width: 580, height: 304, spec: "1200 × 630" },
  { id: "linkedin_post", label: "LinkedIn Post", ratio: "1.91:1", width: 580, height: 304, spec: "1200 × 627" },
];

const DEFAULT_TEMPLATES = [
  // 1. PROPERTY MARKETING (10 Templates)
  { id: "luxury_editorial_listing", name: "Luxury Editorial Listing", category: "PROPERTY MARKETING", badge: "EXCLUSIVE ESTATE", desc: "Vogue-style serif typography, gold keylines & full-bleed portrait photo", layout: "editorial_portrait" },
  { id: "modern_property_showcase", name: "Modern Property Showcase", category: "PROPERTY MARKETING", badge: "FEATURED HOME", desc: "Swiss style white canvas, floating shadow frame & 3-column spec matrix", layout: "swiss_floating_card" },
  { id: "architectural_magazine_cover", name: "Architectural Magazine Cover", category: "PROPERTY MARKETING", badge: "COVER STORY", desc: "Dwell cover style masthead, vertical rotated text & architectural crop", layout: "magazine_masthead" },
  { id: "bold_price_focus", name: "Bold Price Focus", category: "PROPERTY MARKETING", badge: "PRICE DROP", desc: "Typography-first layout with giant 76px price tag & bottom photo strip", layout: "giant_price_focus" },
  { id: "photo_collage_property", name: "Photo Collage Property", category: "PROPERTY MARKETING", badge: "MULTI-ROOM SHOWCASE", desc: "4-photo asymmetric collage grid with centered glass specs pill", layout: "4photo_collage_grid" },
  { id: "minimal_luxury_property", name: "Minimal Luxury Property", category: "PROPERTY MARKETING", badge: "MINIMALIST", desc: "70% negative space with offset vertical text column & clean facade crop", layout: "minimal_offset" },
  { id: "property_features_showcase", name: "Property Features Showcase", category: "PROPERTY MARKETING", badge: "KEY AMENITIES", desc: "50/50 vertical split frame with icon checklist cards", layout: "split_checklist" },
  { id: "new_construction", name: "New Construction Launch", category: "PROPERTY MARKETING", badge: "NEW BUILD 2026", desc: "Architectural blueprint style with floor plan schematic card", layout: "blueprint_schematic" },
  { id: "waterfront_scenic_property", name: "Waterfront / Scenic Property", category: "PROPERTY MARKETING", badge: "WATERFRONT", desc: "Ultrawide 16:9 panoramic hero crop with ocean blue glass card", layout: "panoramic_waterfront" },
  { id: "investment_property", name: "Investment Property ROI", category: "PROPERTY MARKETING", badge: "HIGH YIELD", desc: "Financial dashboard layout highlighting Cap Rate & cash flow matrix", layout: "financial_matrix" },

  // 2. SALES LIFECYCLE (6 Templates)
  { id: "coming_soon", name: "Coming Soon VIP Teaser", category: "SALES LIFECYCLE", badge: "OFF-MARKET VIP", desc: "Dimmed vignette photo with purple keyline badge & registration CTA", layout: "vignette_teaser" },
  { id: "just_listed", name: "Just Listed Showcase", category: "SALES LIFECYCLE", badge: "JUST LISTED", desc: "Full-bleed hero photo with asymmetric diagonal badge & bottom glass bar", layout: "just_listed_glass" },
  { id: "open_house", name: "Open House Event Banner", category: "SALES LIFECYCLE", badge: "OPEN HOUSE", desc: "Stacked 3-part layout featuring green date/time ribbon & map pin card", layout: "event_stacked_banner" },
  { id: "price_improvement", name: "Price Improvement Alert", category: "SALES LIFECYCLE", badge: "PRICE REDUCED", desc: "Dark rust background with strikethrough original price & neon price", layout: "strikethrough_price_drop" },
  { id: "under_contract", name: "Under Contract Pending", category: "SALES LIFECYCLE", badge: "UNDER CONTRACT", desc: "Diagonal rubber stamp overlay set at -15 degree angle over listing photo", layout: "diagonal_stamp" },
  { id: "just_sold", name: "Just Sold Celebration", category: "SALES LIFECYCLE", badge: "JUST SOLD", desc: "Deep emerald green backdrop with 3 circular sales performance metric callouts", layout: "emerald_sold_stats" },

  // 3. AGENT AND BROKERAGE (5 Templates)
  { id: "meet_the_agent", name: "Meet Your Realtor Spotlight", category: "AGENT AND BROKERAGE", badge: "EXECUTIVE REALTOR", desc: "Circular portrait avatar with gold border ring & 2-column executive bio", layout: "agent_executive_profile" },
  { id: "agent_achievement", name: "Agent Career Achievement", category: "AGENT AND BROKERAGE", badge: "MILESTONE", desc: "Golden award crest with giant $50M+ sales volume stat display", layout: "award_crest_stats" },
  { id: "top_producer", name: "Top Producer Award", category: "AGENT AND BROKERAGE", badge: "TOP 1% PRODUCER", desc: "Forbes-style double-ring gold crest frame surrounding agent portrait", layout: "top_producer_rank" },
  { id: "meet_the_team", name: "Brokerage Team Spotlight", category: "AGENT AND BROKERAGE", badge: "TEAM SHOWCASE", desc: "4-avatar horizontal portrait row with team motto banner", layout: "team_avatar_row" },
  { id: "brokerage_milestone", name: "Brokerage Expansion", category: "AGENT AND BROKERAGE", badge: "ANNOUNCEMENT", desc: "City skyline background silhouette paired with corporate headline", layout: "skyline_press_release" },

  // 4. SOCIAL PROOF (3 Templates)
  { id: "client_testimonial", name: "5-Star Client Review", category: "SOCIAL PROOF", badge: "5-STAR REVIEW", desc: "Large graphic quote mark, 5 gold stars & italic editorial review text", layout: "quote_editorial_card" },
  { id: "buyer_success_story", name: "Buyer Key-Handover Story", category: "SOCIAL PROOF", badge: "SUCCESS STORY", desc: "Lifestyle photo of buyers holding home keys with story summary card", layout: "key_handover_story" },
  { id: "seller_success_story", name: "Sold Over Asking Story", category: "SOCIAL PROOF", badge: "SELLER SUCCESS", desc: "50/50 split comparing list price vs final sold price metrics", layout: "list_vs_sold_matrix" },

  // 5. EDUCATION (6 Templates)
  { id: "market_report", name: "Local Market Update Infographic", category: "EDUCATION", badge: "MARKET REPORT", desc: "4-quadrant statistical matrix displaying median prices & inventory", layout: "4quadrant_infographic" },
  { id: "buyer_education", name: "3-Step Home Buyer Preparation", category: "EDUCATION", badge: "BUYER ADVICE", desc: "Vertical stack of 3 numbered step cards with icon highlights", layout: "3step_buyer_guide" },
  { id: "seller_education", name: "Home Staging Tips for Sellers", category: "EDUCATION", badge: "SELLER ADVICE", desc: "Top staged room photo paired with a 4-point staging checklist", layout: "staging_checklist_grid" },
  { id: "mortgage_financing", name: "Mortgage Rate Comparison", category: "EDUCATION", badge: "FINANCING INSIGHT", desc: "Dual side-by-side financial comparison cards comparing interest rates", layout: "dual_rate_comparison" },
  { id: "neighborhood_guide", name: "Neighborhood Community Guide", category: "EDUCATION", badge: "AREA GUIDE", desc: "Top streetscape photo + bottom community scorecards (School & Walk Score)", layout: "community_scorecard" },
  { id: "investment_insight", name: "Rental Yield ROI Analysis", category: "EDUCATION", badge: "INVESTMENT DEALS", desc: "Wall Street style investment table with prominent Gross Rental Yield %", layout: "rental_yield_proforma" },
];

export default function SocialMedia() {
  const [studioMode, setStudioMode] = useState("canvas"); // "canvas" | "history" | "brand_kits"
  const [activeSidebarTab, setActiveSidebarTab] = useState("templates"); // "templates" | "ai_director" | "photos" | "elements" | "brand" | "restyle"

  // Filter & Format States
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState("instagram_post");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState("just_listed_showcase");

  // Property Data & Photo Gallery
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [activeProperty, setActiveProperty] = useState(null);

  // Brand Kits
  const [brandKits, setBrandKits] = useState([]);
  const [activeBrandKit, setActiveBrandKit] = useState({
    id: "brand-default-1",
    brokerage_name: "RealtyPulse Premier Brokerage",
    logo_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&auto=format&fit=crop",
    primary_color: "#2563EB",
    secondary_color: "#0F172A",
    accent_color: "#D97706",
    agent_name: "Adwayth VS",
    agent_phone: "+1 (800) 555-REAL",
    agent_email: "agent@realtypulse.com",
    website: "www.realtypulse.com",
    social_handles: "@RealtyPulseUSA",
  });

  // INITIAL DESIGN LAYOUT DATA STRUCTURE (Canva-like Vector Layer Model)
  const [designConfig, setDesignConfig] = useState({
    id: "design-001",
    name: "Luxury Editorial Concept",
    background: { type: "color", value: "#0F172A" },
    layers: [
      {
        id: "hero-img-1",
        type: "image",
        name: "Main Hero Image",
        content: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80",
        x: 0,
        y: 0,
        width: 1080,
        height: 720,
        zIndex: 1,
        style: { borderRadius: 0 },
      },
      {
        id: "gradient-overlay-1",
        type: "shape",
        name: "Bottom Gradient Overlay",
        content: "gradient",
        x: 0,
        y: 480,
        width: 1080,
        height: 600,
        zIndex: 2,
        style: { background: "linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.95))" },
      },
      {
        id: "badge-top-1",
        type: "badge",
        name: "Status Badge",
        content: "JUST LISTED · EXCLUSIVE",
        x: 60,
        y: 60,
        width: 220,
        height: 40,
        zIndex: 3,
        style: { backgroundColor: "rgba(255, 255, 255, 0.9)", color: "#0F172A", fontWeight: "800", borderRadius: 999, fontSize: 13, padding: "8px 18px" },
      },
      {
        id: "title-text-1",
        type: "text",
        name: "Listing Title",
        content: "Skyline Luxury Villa",
        x: 60,
        y: 740,
        width: 960,
        height: 80,
        zIndex: 3,
        style: { fontSize: 44, fontFamily: "Playfair Display, Georgia, serif", fontWeight: "800", color: "#FFFFFF" },
      },
      {
        id: "price-text-1",
        type: "text",
        name: "Price Tag",
        content: "₹78.00 Lakhs",
        x: 60,
        y: 830,
        width: 400,
        height: 60,
        zIndex: 3,
        style: { fontSize: 36, fontFamily: "Inter, sans-serif", fontWeight: "800", color: "#F59E0B" },
      },
      {
        id: "specs-card-1",
        type: "badge",
        name: "Glass Specs Bar",
        content: "3 Beds  ·  2 Baths  ·  1,450 Sqft",
        x: 60,
        y: 910,
        width: 960,
        height: 56,
        zIndex: 3,
        style: { backgroundColor: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(20px)", color: "#FFFFFF", borderRadius: 16, fontSize: 16, fontWeight: "700", border: "1px solid rgba(255, 255, 255, 0.2)", padding: "14px 24px" },
      },
      {
        id: "brand-footer-1",
        type: "text",
        name: "Brokerage & Agent Info",
        content: "RealtyPulse Premier  |  Adwayth VS (+1 800-REALTY)",
        x: 60,
        y: 990,
        width: 960,
        height: 40,
        zIndex: 3,
        style: { fontSize: 13, color: "#94A3B8", fontWeight: "600" },
      },
    ],
  });

  // Undo / Redo Stack
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Active Selected Layer ID
  const [selectedLayerId, setSelectedLayerId] = useState("title-text-1");

  // AI & Modal States
  const [showAIDirectorModal, setShowAIDirectorModal] = useState(false);
  const [visionAnalysis, setVisionAnalysis] = useState(null);
  const [analyzingPhotos, setAnalyzingPhotos] = useState(false);
  const [aiCopy, setAiCopy] = useState(null);
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [enhancingAI, setEnhancingAI] = useState(false);

  // Saved Posts History & Status
  const [postHistory, setPostHistory] = useState([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [canvaModalData, setCanvaModalData] = useState(null);

  // Load Initial Studio Data
  useEffect(() => {
    loadStudioData();
  }, []);

  const loadStudioData = async () => {
    try {
      // Templates
      const resT = await fetch("/api/social/templates");
      if (resT.ok) {
        const dataT = await resT.json();
        setTemplates(dataT.templates || []);
        if (dataT.templates && dataT.templates.length > 0) {
          handleApplyTemplate(dataT.templates[0].id);
        }
      }

      // Properties
      const resP = await fetch("/api/properties");
      if (resP.ok) {
        const dataP = await resP.json();
        const props = Array.isArray(dataP) ? dataP : (dataP.properties || []);
        setProperties(props);
        if (props.length > 0) {
          setSelectedPropertyId(props[0].id);
          setActiveProperty(props[0]);
        }
      }

      // Brand Kits
      const resB = await fetch("/api/social/brand-kits");
      if (resB.ok) {
        const dataB = await resB.json();
        setBrandKits(dataB || []);
        if (dataB && dataB.length > 0) {
          setActiveBrandKit(dataB[0]);
        }
      }

      // Saved Posts
      const resPosts = await fetch("/api/social/posts");
      if (resPosts.ok) {
        const dataPosts = await resPosts.json();
        setPostHistory(dataPosts || []);
      }
    } catch (err) {
      console.error("[Studio Load Error]", err);
    }
  };

  // Push State to History Stack
  const pushState = (newConfig) => {
    setHistoryStack((prev) => [...prev, designConfig]);
    setRedoStack([]);
    setDesignConfig(newConfig);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setRedoStack((prev) => [...prev, designConfig]);
    setHistoryStack((prev) => prev.slice(0, -1));
    setDesignConfig(previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistoryStack((prev) => [...prev, designConfig]);
    setRedoStack((prev) => prev.slice(0, -1));
    setDesignConfig(next);
  };

  // Apply Selected Template Layout (From 30 Template Families)
  const handleApplyTemplate = async (templateId) => {
    setSelectedTemplateId(templateId);
    setStatusMsg(`🎨 Loading bespoke layout for template...`);
    try {
      const res = await fetch("/api/social/template-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          propertyData: activeProperty || {},
          brandKit: activeBrandKit,
        }),
      });

      if (res.ok) {
        const layout = await res.json();
        pushState(layout);
        setStatusMsg(`✅ Applied template layout: ${layout.name}!`);
      }
    } catch (err) {
      alert(`Template layout error: ${err.message}`);
    }
  };

  // Select Property & Auto-Fill Layers
  const handleSelectProperty = (propId) => {
    setSelectedPropertyId(propId);
    const prop = properties.find((p) => p.id === propId);
    if (!prop) return;

    setActiveProperty(prop);

    // Update Layer Contents with verified CRM Data
    const updatedLayers = designConfig.layers.map((l) => {
      if (l.name === "Listing Title" || l.name === "Property Title" || l.name === "Title Text") {
        return { ...l, content: prop.title };
      }
      if (l.name === "Price Tag" || l.name === "Price Display" || l.name === "Price Badge") {
        return { ...l, content: `₹${(prop.price / 100000).toFixed(2)} Lakhs` };
      }
      if (l.name === "Glass Specs Bar" || l.name === "Pill Specs") {
        return { ...l, content: `${prop.bedrooms || 3} Beds · ${prop.bathrooms || 2} Baths · ${prop.area || 1450} Sqft` };
      }
      if (l.name === "Main Hero Image" || l.name === "Hero Photo" || l.name === "Exterior Photo") {
        return { ...l, content: prop.images?.[0] || l.content };
      }
      return l;
    });

    pushState({ ...designConfig, layers: updatedLayers });
    setStatusMsg(`✅ Auto-filled specs from property: ${prop.title}`);
  };

  // Layer Modification Handler
  const handleUpdateLayer = (layerId, updates) => {
    const updatedLayers = designConfig.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l));
    pushState({ ...designConfig, layers: updatedLayers });
  };

  const handleDuplicateLayer = (layerId) => {
    const target = designConfig.layers.find((l) => l.id === layerId);
    if (!target) return;

    const dup = {
      ...target,
      id: `layer-${Date.now()}`,
      name: `${target.name} (Copy)`,
      x: target.x + 40,
      y: target.y + 40,
      zIndex: (target.zIndex || 1) + 1,
    };

    pushState({ ...designConfig, layers: [...designConfig.layers, dup] });
    setSelectedLayerId(dup.id);
  };

  const handleDeleteLayer = (layerId) => {
    const updatedLayers = designConfig.layers.filter((l) => l.id !== layerId);
    pushState({ ...designConfig, layers: updatedLayers });
    setSelectedLayerId(null);
  };

  // AI Restyle Action
  const handleAIRestyle = async (restyleAction) => {
    setStatusMsg(`✨ AI Restyling layout for "${restyleAction}"...`);
    try {
      const res = await fetch("/api/social/ai-restyle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentDesign: designConfig,
          restyleAction,
          propertyData: activeProperty || {},
          brandKit: activeBrandKit,
        }),
      });

      if (res.ok) {
        const restyled = await res.json();
        pushState(restyled);
        setStatusMsg(`✅ AI Restyle applied: ${restyleAction}!`);
      }
    } catch (err) {
      alert(`Restyle Error: ${err.message}`);
    }
  };

  // Vision AI Photo Analysis
  const handleAnalyzePhotos = async () => {
    if (!activeProperty) return;
    setAnalyzingPhotos(true);
    try {
      const res = await fetch("/api/social/analyze-property-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyTitle: activeProperty.title,
          images: activeProperty.images || [designConfig.layers[0]?.content],
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setVisionAnalysis(result);
        setStatusMsg("📸 Vision AI completed image analysis!");
      }
    } catch (err) {
      alert(`Vision AI Error: ${err.message}`);
    } finally {
      setAnalyzingPhotos(false);
    }
  };

  // Gemini Structured Marketing Copy Generator
  const handleGenerateCopy = async () => {
    setGeneratingCopy(true);
    try {
      const res = await fetch("/api/social/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyData: activeProperty || {},
          templateId: selectedTemplateId,
          platform: selectedPlatform,
          brandKit: activeBrandKit,
        }),
      });

      if (res.ok) {
        const copyResult = await res.json();
        setAiCopy(copyResult);
        setStatusMsg("✨ AI generated platform-specific captions & copy!");
      }
    } catch (err) {
      alert(`AI Copy Error: ${err.message}`);
    } finally {
      setGeneratingCopy(false);
    }
  };

  // Gemini 2.0 AI Vision & Design Director Generator
  const handleAIEnhanceDesign = async () => {
    setEnhancingAI(true);
    setStatusMsg("✨ Gemini 2.0 AI Art Director curating design & matching photo palette...");
    try {
      const res = await fetch("/api/social/ai-generate-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          propertyData: activeProperty || {},
          brandKit: activeBrandKit,
          ratio: selectedPlatform,
          styleTheme: "vogue_luxury",
        }),
      });

      if (res.ok) {
        const layout = await res.json();
        pushState(layout);
        setStatusMsg("✨ Applied Gemini AI Curated Design & Palette!");
      }
    } catch (err) {
      alert(`AI Enhance Error: ${err.message}`);
    } finally {
      setEnhancingAI(false);
    }
  };

  // Canva Export Package Flow
  const handleCanvaExport = async () => {
    try {
      const res = await fetch("/api/social/canva/export-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designConfig,
          brandKit: activeBrandKit,
          propertyData: activeProperty || {},
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCanvaModalData(data);
      }
    } catch (err) {
      alert(`Canva Export Error: ${err.message}`);
    }
  };

  // Save Draft to SQLite Database
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: selectedPropertyId,
          template_id: selectedTemplateId,
          platform: selectedPlatform,
          headline: designConfig.name,
          subheadline: activeProperty?.title || "",
          caption: aiCopy?.caption || "",
          hashtags: aiCopy?.hashtags || "",
          image_config: JSON.stringify(designConfig),
          brand_kit_id: activeBrandKit.id,
          status: "DRAFT",
        }),
      });

      if (res.ok) {
        setStatusMsg("✅ Saved creative draft to database!");
        loadStudioData();
      }
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSavingDraft(false);
    }
  };

  const selectedLayer = useMemo(
    () => designConfig.layers.find((l) => l.id === selectedLayerId),
    [designConfig, selectedLayerId]
  );

  const selectedPlatformObj = PLATFORMS.find((p) => p.id === selectedPlatform) || PLATFORMS[0];

  return (
    <>
      <Topbar
        title="RealtyPulse AI Creative Studio"
        subtitle="Canva-like interactive layer canvas editor with natural language AI Creative Director & photo intelligence."
      />

      {statusMsg && (
        <div className="glass-card" style={{ marginBottom: 14, padding: "10px 16px", fontSize: 13, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1E40AF" }}>
          {statusMsg}
        </div>
      )}

      {/* TOP CONTROL STUDIO HEADER BAR */}
      <div className="glass-card" style={{ marginBottom: 16, padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        {/* Left: Property Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 280 }}>
          <Home size={18} color="#2563EB" />
          <select
            value={selectedPropertyId}
            onChange={(e) => handleSelectProperty(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, border: "1px solid #CBD5E1" }}
          >
            <option value="">-- Select Property from CRM --</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.title} · {p.location}</option>
            ))}
          </select>
        </div>

        {/* Center: Multi-Format Platform Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Format:</span>
          {PLATFORMS.map((pf) => (
            <button
              key={pf.id}
              onClick={() => setSelectedPlatform(pf.id)}
              className={`btn ${selectedPlatform === pf.id ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: 999, fontSize: 11.5, padding: "5px 12px" }}
            >
              {pf.label} ({pf.ratio})
            </button>
          ))}
        </div>

        {/* Right: Studio Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleUndo} disabled={historyStack.length === 0} className="btn btn-secondary btn-sm" title="Undo Action">
            <Undo size={14} />
          </button>
          <button onClick={handleRedo} disabled={redoStack.length === 0} className="btn btn-secondary btn-sm" title="Redo Action">
            <Redo size={14} />
          </button>

          <button onClick={handleAIEnhanceDesign} disabled={enhancingAI} className="btn btn-primary btn-sm" style={{ borderRadius: 999, fontSize: 12, background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)", border: "none" }}>
            <Sparkles size={14} /> {enhancingAI ? "Curating AI..." : "✨ Gemini AI Enhance"}
          </button>

          <button onClick={() => setShowAIDirectorModal(true)} className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 12 }}>
            <Wand2 size={14} /> AI Director
          </button>

          <button onClick={handleSaveDraft} disabled={savingDraft} className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 12 }}>
            <Bookmark size={14} /> Save Draft
          </button>

          <button onClick={handleCanvaExport} className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 12 }}>
            <ExternalLink size={14} /> Canva Integration
          </button>
        </div>
      </div>

      {/* STUDIO 3-COLUMN LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 340px", gap: 16, alignItems: "start" }}>

        {/* COLUMN 1: LEFT SIDEBAR TABS */}
        <div className="glass-card" style={{ padding: 16 }}>
          {/* Sidebar Navigation Tabs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginBottom: 16 }}>
            <button
              onClick={() => setActiveSidebarTab("ai_director")}
              className={`btn ${activeSidebarTab === "ai_director" ? "btn-primary" : "btn-secondary"} btn-sm`}
              style={{ borderRadius: 8, fontSize: 10.5 }}
            >
              <Wand2 size={12} /> AI Concepts
            </button>
            <button
              onClick={() => setActiveSidebarTab("templates")}
              className={`btn ${activeSidebarTab === "templates" ? "btn-primary" : "btn-secondary"} btn-sm`}
              style={{ borderRadius: 8, fontSize: 10.5 }}
            >
              <Layout size={12} /> Templates
            </button>
            <button
              onClick={() => setActiveSidebarTab("photos")}
              className={`btn ${activeSidebarTab === "photos" ? "btn-primary" : "btn-secondary"} btn-sm`}
              style={{ borderRadius: 8, fontSize: 10.5 }}
            >
              <ImageIcon size={12} /> Photos
            </button>
            <button
              onClick={() => setActiveSidebarTab("elements")}
              className={`btn ${activeSidebarTab === "elements" ? "btn-primary" : "btn-secondary"} btn-sm`}
              style={{ borderRadius: 8, fontSize: 10.5 }}
            >
              <Layers size={12} /> Elements
            </button>
            <button
              onClick={() => setActiveSidebarTab("brand")}
              className={`btn ${activeSidebarTab === "brand" ? "btn-primary" : "btn-secondary"} btn-sm`}
              style={{ borderRadius: 8, fontSize: 10.5 }}
            >
              <Palette size={12} /> Brand Kit
            </button>
            <button
              onClick={() => setActiveSidebarTab("restyle")}
              className={`btn ${activeSidebarTab === "restyle" ? "btn-primary" : "btn-secondary"} btn-sm`}
              style={{ borderRadius: 8, fontSize: 10.5 }}
            >
              <Sparkles size={12} /> AI Restyle
            </button>
          </div>

          {/* TAB 1: AI CONCEPTS */}
          {activeSidebarTab === "ai_director" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A", marginBottom: 6 }}>AI Creative Director</div>
              <p style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12 }}>
                Enter a natural language prompt to generate 4 visually distinct concepts.
              </p>
              <button
                onClick={() => setShowAIDirectorModal(true)}
                className="btn btn-primary btn-sm"
                style={{ width: "100%", borderRadius: 10, fontSize: 12, justifyContent: "center" }}
              >
                <Wand2 size={14} /> Open AI Director Prompt Interface
              </button>
            </div>
          )}

          {/* TAB 2: TEMPLATES LIBRARY (30 DISTINCT TEMPLATE FAMILIES) */}
          {activeSidebarTab === "templates" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A", marginBottom: 4 }}>
                30 Template Families ({templates.filter((t) => activeCategory === "ALL" || t.category === activeCategory).length} Available)
              </div>
              <p style={{ fontSize: 11, color: "#64748B", marginBottom: 10 }}>Select any template family to apply its unique visual layout composition.</p>

              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`btn ${activeCategory === cat ? "btn-primary" : "btn-secondary"} btn-sm`}
                    style={{ fontSize: 9.5, padding: "3px 8px", borderRadius: 999 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto" }}>
                {templates
                  .filter((t) => activeCategory === "ALL" || t.category === activeCategory)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleApplyTemplate(t.id)}
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        border: selectedTemplateId === t.id ? "2px solid #2563EB" : "1px solid #E2E8F0",
                        background: selectedTemplateId === t.id ? "#EFF6FF" : "#FFFFFF",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: "800", color: "#0F172A" }}>{t.name}</div>
                          <span style={{ fontSize: 9.5, fontWeight: "800", color: "#2563EB", background: "#DBEAFE", padding: "2px 6px", borderRadius: 999 }}>
                            {t.badge || t.category}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.3 }}>{t.desc}</div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyTemplate(t.id);
                        }}
                        className={`btn ${selectedTemplateId === t.id ? "btn-primary" : "btn-secondary"} btn-sm`}
                        style={{ width: "100%", borderRadius: 8, fontSize: 11, fontWeight: "700", justifyContent: "center" }}
                      >
                        <Wand2 size={12} /> {selectedTemplateId === t.id ? "Applied Layout" : `Apply ${t.name}`}
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: PHOTOS & VISION AI */}
          {activeSidebarTab === "photos" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A", marginBottom: 8 }}>Property Photo Intelligence</div>
              <button
                onClick={handleAnalyzePhotos}
                disabled={analyzingPhotos}
                className="btn btn-secondary btn-sm"
                style={{ width: "100%", borderRadius: 10, fontSize: 12, marginBottom: 12, justifyContent: "center" }}
              >
                <Eye size={14} /> {analyzingPhotos ? "Analyzing..." : "Run Vision AI Photo Analysis"}
              </button>

              {visionAnalysis && (
                <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", padding: 10, borderRadius: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: "800", color: "#047857" }}>✨ Vision AI Recommendation:</div>
                  <div style={{ fontSize: 11, color: "#065F46", marginTop: 2 }}>{visionAnalysis.reason}</div>
                </div>
              )}

              <div style={{ fontSize: 11, fontWeight: "700", color: "#475569", marginBottom: 6 }}>Gallery Photos:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(activeProperty?.images || [designConfig.layers[0]?.content]).map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt={`Photo ${i}`}
                    onClick={() => {
                      const heroLayer = designConfig.layers.find((l) => l.type === "image");
                      if (heroLayer) handleUpdateLayer(heroLayer.id, { content: imgUrl });
                    }}
                    style={{ width: "100%", height: 75, objectFit: "cover", borderRadius: 8, cursor: "pointer", border: "1px solid #CBD5E1" }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ELEMENTS & TEXT */}
          {activeSidebarTab === "elements" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A", marginBottom: 8 }}>Add Elements</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  onClick={() => {
                    const newLayer = {
                      id: `text-${Date.now()}`,
                      type: "text",
                      name: "Custom Heading",
                      content: "NEW HEADING TEXT",
                      x: 100,
                      y: 500,
                      width: 800,
                      height: 50,
                      zIndex: 10,
                      style: { fontSize: 32, fontWeight: "800", color: "#FFFFFF", fontFamily: "Inter, sans-serif" },
                    };
                    pushState({ ...designConfig, layers: [...designConfig.layers, newLayer] });
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", borderRadius: 8 }}
                >
                  <Plus size={14} /> Add Heading Text
                </button>

                <button
                  onClick={() => {
                    const newBadge = {
                      id: `badge-${Date.now()}`,
                      type: "badge",
                      name: "Custom Tag Badge",
                      content: "✨ SPECIAL OFFER",
                      x: 100,
                      y: 400,
                      width: 200,
                      height: 40,
                      zIndex: 10,
                      style: { backgroundColor: "#2563EB", color: "#FFFFFF", fontWeight: "800", borderRadius: 999, fontSize: 12 },
                    };
                    pushState({ ...designConfig, layers: [...designConfig.layers, newBadge] });
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: "flex-start", borderRadius: 8 }}
                >
                  <Plus size={14} /> Add Tag Badge
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: BRAND KIT */}
          {activeSidebarTab === "brand" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A", marginBottom: 8 }}>Brokerage Brand Kit</div>
              <div style={{ background: "#F8FAFC", padding: 12, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 12, fontWeight: "800", color: "#0F172A" }}>{activeBrandKit.brokerage_name}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Rep: {activeBrandKit.agent_name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Phone: {activeBrandKit.agent_phone}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: activeBrandKit.primary_color }} title="Primary" />
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: activeBrandKit.secondary_color }} title="Secondary" />
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: activeBrandKit.accent_color }} title="Accent" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AI RESTYLE */}
          {activeSidebarTab === "restyle" && (
            <div>
              <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A", marginBottom: 8 }}>1-Click AI Restyle</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => handleAIRestyle("luxury")} className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", borderRadius: 8 }}>
                  ✨ Make More Luxury
                </button>
                <button onClick={() => handleAIRestyle("modern")} className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", borderRadius: 8 }}>
                  ✨ Make Modern
                </button>
                <button onClick={() => handleAIRestyle("minimal")} className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", borderRadius: 8 }}>
                  ✨ Make Minimal
                </button>
                <button onClick={() => handleAIRestyle("cinematic")} className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", borderRadius: 8 }}>
                  ✨ Make Cinematic
                </button>
                <button onClick={() => handleAIRestyle("improve_cta")} className="btn btn-secondary btn-sm" style={{ justifyContent: "flex-start", borderRadius: 8 }}>
                  ✨ Improve CTA Readability
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 2: CENTER INTERACTIVE CANVAS */}
        <div>
          <CanvasEditor
            designConfig={designConfig}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
            onUpdateLayer={handleUpdateLayer}
            platformRatio={selectedPlatformObj.ratio}
          />
        </div>

        {/* COLUMN 3: RIGHT LAYER INSPECTOR & AI COPY PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Layer Properties Inspector */}
          <LayerInspector
            selectedLayer={selectedLayer}
            onUpdateLayer={handleUpdateLayer}
            onDuplicateLayer={handleDuplicateLayer}
            onDeleteLayer={handleDeleteLayer}
          />

          {/* AI Copy Panel */}
          <div className="glass-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: "800", color: "#0F172A" }}>AI Social Copy Panel</div>
              <button onClick={handleGenerateCopy} disabled={generatingCopy} className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }}>
                <Sparkles size={12} /> {generatingCopy ? "Writing..." : "Generate AI Copy"}
              </button>
            </div>

            {aiCopy ? (
              <div style={{ fontSize: 12, color: "#334155" }}>
                <div style={{ fontWeight: "700", marginBottom: 4 }}>Headline:</div>
                <div style={{ background: "#F8FAFC", padding: 8, borderRadius: 6, marginBottom: 8, border: "1px solid #E2E8F0" }}>{aiCopy.headline}</div>

                <div style={{ fontWeight: "700", marginBottom: 4 }}>Caption:</div>
                <textarea rows={4} readOnly value={aiCopy.caption} style={{ width: "100%", padding: 8, borderRadius: 6, fontSize: 11.5, border: "1px solid #CBD5E1", boxSizing: "border-box" }} />
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: 20 }}>
                Click "Generate AI Copy" to create multi-platform post captions & hashtags.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* AI CREATIVE DIRECTOR MODAL */}
      <AICreativeDirectorModal
        isOpen={showAIDirectorModal}
        onClose={() => setShowAIDirectorModal(false)}
        onApplyConcept={(concept) => {
          pushState({ ...designConfig, background: concept.background, layers: concept.layers, name: concept.name });
          setStatusMsg(`✨ Applied concept: ${concept.name}!`);
        }}
        propertyData={activeProperty || {}}
        brandKit={activeBrandKit}
      />

      {/* CANVA INTEGRATION MODAL */}
      {canvaModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="glass-card" style={{ background: "#FFF", borderRadius: 20, padding: 24, maxWidth: 500, width: "100%" }}>
            <div style={{ fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 8 }}>Canva Integration Package</div>
            <p style={{ fontSize: 12.5, color: "#64748B" }}>{canvaModalData.instructions}</p>

            <div style={{ background: "#F1F5F9", padding: 12, borderRadius: 8, fontSize: 12, margin: "12px 0" }}>
              <div>Title: {canvaModalData.designTitle}</div>
              <div>Assets Exported: {canvaModalData.assets.length} items</div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setCanvaModalData(null)} className="btn btn-secondary btn-sm" style={{ borderRadius: 8 }}>Close</button>
              <a href={canvaModalData.canvaEditorUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ borderRadius: 8, textDecoration: "none" }}>
                Continue in Canva <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
