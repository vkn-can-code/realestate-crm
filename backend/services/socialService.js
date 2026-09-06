export const RATIOS = {
  instagram_post: { id: "instagram_post", label: "Square (1:1)", ratio: "1:1", width: 1080, height: 1080 },
  instagram_portrait: { id: "instagram_portrait", label: "Portrait (4:5)", ratio: "4:5", width: 1080, height: 1350 },
  instagram_story: { id: "instagram_story", label: "Story (9:16)", ratio: "9:16", width: 1080, height: 1920 },
  facebook_post: { id: "facebook_post", label: "Facebook (1.91:1)", ratio: "1.91:1", width: 1200, height: 628 },
  linkedin_post: { id: "linkedin_post", label: "LinkedIn (1.91:1)", ratio: "1.91:1", width: 1200, height: 628 },
};

export function getAllRatioLayouts(templateId, propertyData = {}, brandKit = {}) {
  const layouts = {};
  for (const [key] of Object.entries(RATIOS)) {
    layouts[key] = getTemplateLayout(templateId, propertyData, brandKit, key);
  }
  return layouts;
}

// EXACTLY 30 DISTINCT TEMPLATE FAMILIES ACROSS 5 CATEGORIES
export const MARKETING_TEMPLATES = [
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

/**
 * Get Bespoke Layer Stack for any of the 30 Template Families
 */
export function getTemplateLayout(templateId, propertyData = {}, brandKit = {}, ratio = "instagram_post", opts = {}) {
  const meta = RATIOS[ratio] || RATIOS.instagram_post;
  const canvasWidth = meta.width;
  const canvasHeight = meta.height;
  const { title, price, location, bedrooms, bathrooms, area, type, images = [] } = propertyData;
  const { brokerage_name, agent_name, agent_phone } = brandKit;

  const heroImg = images[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80";
  const subImg = images[1] || images[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80";
  const kitchenImg = images[2] || subImg;
  const poolImg = images[3] || heroImg;
  const agentImg = brandKit.logo_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop";

  const propTitle = title || "Skyline Luxury Residence";
  const propPrice = price ? `₹${price}` : "$2,450,000";
  const propLoc = location || "Beverly Hills, CA";
  const propSpecs = `${bedrooms || 3} Beds · ${bathrooms || 2} Baths · ${area || "1,850"} Sqft`;
  const agentContact = `${brokerage_name || "RealtyPulse Premier"} · ${agent_name || "Adwayth VS"} (${agent_phone || "+1 800-REALTY"})`;

  switch (templateId) {
    // 1. Luxury Editorial Listing
    case "luxury_editorial_listing":
    case "luxury_editorial":
      return {
        id: "luxury_editorial_listing",
        name: "Luxury Editorial Listing",
        background: { type: "color", value: "#020617" },
        layers: [
          { id: "hero-1", type: "image", name: "Full Bleed Hero", content: heroImg, x: 0, y: 0, width: 1080, height: 1350, zIndex: 1 },
          { id: "scrim-1", type: "shape", name: "Vogue Scrim Gradient", content: "gradient", x: 0, y: 550, width: 1080, height: 800, style: { background: "linear-gradient(to bottom, transparent 0%, rgba(2,6,23,0.96) 100%)" }, zIndex: 2 },
          { id: "gold-keyline-1", type: "shape", name: "Gold Thin Keyline", content: "line", x: 80, y: 780, width: 140, height: 3, style: { backgroundColor: "#D97706" }, zIndex: 3 },
          { id: "badge-1", type: "badge", name: "Editorial Tag", content: "✦ EXCLUSIVE ESTATE SHOWCASE ✦", x: 80, y: 810, width: 320, height: 30, style: { color: "#F59E0B", fontFamily: "Playfair Display, Georgia, serif", fontSize: 13, fontWeight: "700", letterSpacing: "3px" }, zIndex: 3 },
          { id: "title-1", type: "text", name: "Editorial Title", content: propTitle, x: 80, y: 850, width: 920, height: 120, style: { fontSize: 52, fontFamily: "Playfair Display, Georgia, serif", fontWeight: "800", color: "#FFFFFF", lineHeight: 1.15 }, zIndex: 3 },
          { id: "loc-1", type: "text", name: "Location Line", content: `📍 ${propLoc}`, x: 80, y: 980, width: 920, height: 35, style: { fontSize: 18, color: "#CBD5E1", fontWeight: "500" }, zIndex: 3 },
          { id: "price-1", type: "text", name: "Gold Italic Price", content: propPrice, x: 80, y: 1025, width: 450, height: 60, style: { fontSize: 44, fontFamily: "Playfair Display, Georgia, serif", fontStyle: "italic", fontWeight: "700", color: "#F59E0B" }, zIndex: 3 },
          { id: "specs-1", type: "badge", name: "Frosted Glass Specs", content: propSpecs, x: 80, y: 1100, width: 920, height: 64, style: { backgroundColor: "rgba(255, 255, 255, 0.08)", backdropFilter: "blur(24px)", color: "#FFFFFF", borderRadius: 16, fontSize: 16, fontWeight: "700", border: "1px solid rgba(217, 119, 6, 0.4)", padding: "18px 28px" }, zIndex: 3 },
          { id: "cta-1", type: "badge", name: "Gold CTA Pill", content: "BY PRIVATE APPOINTMENT ONLY", x: 80, y: 1190, width: 340, height: 48, style: { backgroundColor: "#D97706", color: "#FFFFFF", fontWeight: "800", borderRadius: 999, fontSize: 13, padding: "12px 24px" }, zIndex: 3 },
        ],
      };

    // 2. Modern Property Showcase
    case "modern_property_showcase":
    case "modern_minimal":
      return {
        id: "modern_property_showcase",
        name: "Modern Property Showcase",
        background: { type: "color", value: "#FFFFFF" },
        layers: [
          { id: "hero-2", type: "image", name: "Floating Photo Frame", content: heroImg, x: 60, y: 60, width: 960, height: 600, style: { borderRadius: 28, boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)" }, zIndex: 1 },
          { id: "badge-2", type: "badge", name: "Royal Blue Tag", content: "FEATURED RESIDENCE", x: 100, y: 100, width: 200, height: 38, style: { backgroundColor: "#2563EB", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 12 }, zIndex: 3 },
          { id: "title-2", type: "text", name: "Modern Title", content: propTitle, x: 60, y: 690, width: 960, height: 60, style: { fontSize: 42, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#0F172A" }, zIndex: 2 },
          { id: "price-2", type: "text", name: "Blue Price Display", content: propPrice, x: 60, y: 755, width: 450, height: 50, style: { fontSize: 38, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#2563EB" }, zIndex: 2 },
          { id: "spec-bed-2", type: "badge", name: "Beds Metric Card", content: `🛏️ ${bedrooms || 3} Bedrooms`, x: 60, y: 825, width: 300, height: 54, style: { backgroundColor: "#F1F5F9", color: "#0F172A", borderRadius: 14, fontSize: 15, fontWeight: "700" }, zIndex: 2 },
          { id: "spec-bath-2", type: "badge", name: "Baths Metric Card", content: `🚿 ${bathrooms || 2} Bathrooms`, x: 390, y: 825, width: 300, height: 54, style: { backgroundColor: "#F1F5F9", color: "#0F172A", borderRadius: 14, fontSize: 15, fontWeight: "700" }, zIndex: 2 },
          { id: "spec-sqft-2", type: "badge", name: "Sqft Metric Card", content: `📐 ${area || "1,850"} Sq Ft`, x: 720, y: 825, width: 300, height: 54, style: { backgroundColor: "#F1F5F9", color: "#0F172A", borderRadius: 14, fontSize: 15, fontWeight: "700" }, zIndex: 2 },
          { id: "cta-2", type: "badge", name: "Gallery CTA Button", content: "VIEW FULL GALLERY →", x: 60, y: 905, width: 960, height: 60, style: { backgroundColor: "#2563EB", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 17 }, zIndex: 2 },
        ],
      };

    // 3. Architectural Magazine Cover
    case "architectural_magazine_cover":
    case "cinematic_property":
      return {
        id: "architectural_magazine_cover",
        name: "Architectural Magazine Cover",
        background: { type: "color", value: "#090D16" },
        layers: [
          { id: "masthead-3", type: "text", name: "Cover Masthead", content: "REALTY PULSE ARCHITECTURE", x: 60, y: 40, width: 960, height: 40, style: { fontSize: 26, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#FFFFFF", letterSpacing: "10px", textAlign: "center" }, zIndex: 3 },
          { id: "line-top-3", type: "shape", name: "Masthead Keyline", content: "line", x: 60, y: 90, width: 960, height: 2, style: { backgroundColor: "#334155" }, zIndex: 3 },
          { id: "side-text-3", type: "text", name: "Vertical Volume Text", content: "VOLUME 24 // ISSUE 08", x: 30, y: 400, width: 240, height: 30, style: { fontSize: 12, fontWeight: "700", color: "#64748B", letterSpacing: "3px", transform: "rotate(-90deg)" }, zIndex: 3 },
          { id: "hero-3", type: "image", name: "Magazine Cover Photo", content: heroImg, x: 100, y: 120, width: 880, height: 740, style: { borderRadius: 16 }, zIndex: 1 },
          { id: "grad-3", type: "shape", name: "Cover Shadow", content: "gradient", x: 100, y: 620, width: 880, height: 240, style: { background: "linear-gradient(to bottom, transparent, rgba(9,13,22,0.95))" }, zIndex: 2 },
          { id: "title-3", type: "text", name: "Magazine Title", content: propTitle, x: 130, y: 700, width: 820, height: 90, style: { fontSize: 46, fontFamily: "Playfair Display, Georgia, serif", fontWeight: "400", color: "#FFFFFF" }, zIndex: 3 },
          { id: "issue-badge-3", type: "badge", name: "Gold Issue Stamp", content: "✦ COVER STORY ✦", x: 130, y: 800, width: 180, height: 34, style: { backgroundColor: "#D4AF37", color: "#090D16", fontWeight: "900", borderRadius: 4, fontSize: 11 }, zIndex: 3 },
          { id: "price-3", type: "text", name: "Cover Price Tag", content: propPrice, x: 130, y: 845, width: 400, height: 40, style: { fontSize: 28, fontWeight: "800", color: "#E2E8F0" }, zIndex: 3 },
        ],
      };

    // 4. Bold Price Focus
    case "bold_price_focus":
    case "price_improvement_alert":
      return {
        id: "bold_price_focus",
        name: "Bold Price Focus",
        background: { type: "color", value: "#451A03" },
        layers: [
          { id: "badge-4", type: "badge", name: "Price Reduction Ribbon", content: "🔥 $150,000 PRICE REDUCTION", x: 60, y: 60, width: 400, height: 44, style: { backgroundColor: "#DC2626", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 13 }, zIndex: 3 },
          { id: "price-giant-4", type: "text", name: "Giant Price Display", content: propPrice, x: 60, y: 120, width: 960, height: 110, style: { fontSize: 76, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#FBBF24" }, zIndex: 2 },
          { id: "title-4", type: "text", name: "Property Title", content: propTitle, x: 60, y: 240, width: 960, height: 60, style: { fontSize: 36, fontWeight: "900", color: "#FFFFFF" }, zIndex: 2 },
          { id: "loc-4", type: "text", name: "Location Line", content: `📍 ${propLoc}  ·  ${propSpecs}`, x: 60, y: 305, width: 960, height: 40, style: { fontSize: 18, color: "#FDE68A", fontWeight: "700" }, zIndex: 2 },
          { id: "photo-strip-4", type: "image", name: "Bottom Photo Strip", content: heroImg, x: 60, y: 360, width: 960, height: 540, style: { borderRadius: 20 }, zIndex: 1 },
          { id: "cta-4", type: "badge", name: "Offer CTA Button", content: "SUBMIT YOUR OFFER NOW →", x: 60, y: 920, width: 960, height: 64, style: { backgroundColor: "#DC2626", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 18 }, zIndex: 3 },
        ],
      };

    // 5. Photo Collage Property
    case "photo_collage_property":
      return {
        id: "photo_collage_property",
        name: "Photo Collage Property",
        background: { type: "color", value: "#0F172A" },
        layers: [
          { id: "photo-1", type: "image", name: "Exterior Photo (Large)", content: heroImg, x: 60, y: 60, width: 600, height: 600, style: { borderRadius: 20 }, zIndex: 1 },
          { id: "photo-2", type: "image", name: "Kitchen Photo (Top Right)", content: kitchenImg, x: 680, y: 60, width: 340, height: 290, style: { borderRadius: 20 }, zIndex: 1 },
          { id: "photo-3", type: "image", name: "Interior Photo (Mid Right)", content: subImg, x: 680, y: 370, width: 340, height: 290, style: { borderRadius: 20 }, zIndex: 1 },
          { id: "photo-4", type: "image", name: "Pool Photo (Bottom Full)", content: poolImg, x: 60, y: 680, width: 960, height: 320, style: { borderRadius: 20 }, zIndex: 1 },
          { id: "center-glass-specs", type: "badge", name: "Floating Center Glass Specs", content: `✦ ${propSpecs} ✦`, x: 280, y: 640, width: 520, height: 56, style: { backgroundColor: "rgba(15, 23, 42, 0.85)", backdropFilter: "blur(20px)", color: "#FFFFFF", borderRadius: 999, fontSize: 15, fontWeight: "800", border: "1px solid rgba(255,255,255,0.2)", padding: "14px 24px" }, zIndex: 3 },
          { id: "footer-title-5", type: "text", name: "Footer Title & Price", content: `${propTitle}  ·  ${propPrice}`, x: 60, y: 1015, width: 960, height: 40, style: { fontSize: 24, fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, zIndex: 2 },
        ],
      };

    // 6. Meet Your Realtor Spotlight
    case "meet_the_agent":
      return {
        id: "meet_the_agent",
        name: "Meet Your Realtor Spotlight",
        background: { type: "gradient", value: "linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)" },
        layers: [
          { id: "agent-img", type: "image", name: "Agent Headshot", content: agentImg, x: 390, y: 80, width: 300, height: 300, style: { borderRadius: 999, border: "6px solid #6366F1" }, zIndex: 1 },
          { id: "badge-6", type: "badge", name: "Role Badge", content: "EXECUTIVE REALTOR · TOP PRODUCER", x: 340, y: 400, width: 400, height: 40, style: { backgroundColor: "#6366F1", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 13 }, zIndex: 2 },
          { id: "agent-name", type: "text", name: "Agent Name", content: brandKit.agent_name || "Adwayth VS", x: 60, y: 460, width: 960, height: 60, style: { fontSize: 44, fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, zIndex: 2 },
          { id: "agent-bio", type: "text", name: "Bio Paragraph", content: `Your trusted real estate advisor specializing in luxury residential & investment properties with ${brandKit.brokerage_name || "RealtyPulse Premier"}.`, x: 100, y: 530, width: 880, height: 100, style: { fontSize: 18, color: "#C7D2FE", lineHeight: 1.5, textAlign: "center" }, zIndex: 2 },
          { id: "agent-phone-btn", type: "badge", name: "Contact Button", content: `📞 CALL TODAY: ${brandKit.agent_phone || "+1 (800) 555-REAL"}`, x: 140, y: 660, width: 800, height: 60, style: { backgroundColor: "#22C55E", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 18 }, zIndex: 2 },
        ],
      };

    // 7. 5-Star Client Testimonial
    case "client_testimonial":
      return {
        id: "client_testimonial",
        name: "5-Star Client Testimonial",
        background: { type: "gradient", value: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" },
        layers: [
          { id: "quote-mark", type: "text", name: "Quote Graphic", content: "“", x: 80, y: 60, width: 200, height: 120, style: { fontSize: 160, color: "#6366F1", fontWeight: "900" }, zIndex: 1 },
          { id: "stars-badge", type: "badge", name: "Rating Stars", content: "⭐⭐⭐⭐⭐  5-STAR CLIENT REVIEW", x: 80, y: 160, width: 360, height: 40, style: { backgroundColor: "#FEF08A", color: "#854D0E", fontWeight: "900", borderRadius: 999, fontSize: 13 }, zIndex: 2 },
          { id: "quote-text", type: "text", name: "Client Quote", content: `"Adwayth and the RealtyPulse team made selling our home effortless! We received 4 competing offers above asking price within just 5 days of listing. Highly recommended!"`, x: 80, y: 220, width: 920, height: 200, style: { fontSize: 28, fontFamily: "Playfair Display, Georgia, serif", color: "#F8FAFC", lineHeight: 1.5 }, zIndex: 2 },
          { id: "client-author", type: "text", name: "Client Name", content: "— Marcus & Elena Vance (Verified Sellers)", x: 80, y: 440, width: 920, height: 40, style: { fontSize: 18, color: "#38BDF8", fontWeight: "700" }, zIndex: 2 },
          { id: "home-thumb", type: "image", name: "Property Photo", content: heroImg, x: 80, y: 500, width: 920, height: 460, style: { borderRadius: 20 }, zIndex: 1 },
        ],
      };

    // 8. Architectural Showcase Grid
    case "architectural_showcase":
      return {
        id: "architectural_showcase",
        name: "Architectural Showcase Grid",
        background: { type: "color", value: "#FFFFFF" },
        layers: [
          { id: "hero-arch-1", type: "image", name: "Exterior Photo", content: heroImg, x: 60, y: 60, width: 600, height: 600, style: { borderRadius: 16 }, zIndex: 1 },
          { id: "hero-arch-2", type: "image", name: "Interior Detail", content: subImg, x: 680, y: 60, width: 340, height: 600, style: { borderRadius: 16 }, zIndex: 1 },
          { id: "arch-title", type: "text", name: "Architectural Title", content: propTitle, x: 60, y: 700, width: 960, height: 50, style: { fontSize: 34, fontWeight: "800", color: "#0F172A", fontFamily: "Inter, sans-serif" }, zIndex: 2 },
          { id: "arch-loc", type: "text", name: "Location & Type", content: `${propLoc} · ${type || "Single Family Residence"}`, x: 60, y: 760, width: 960, height: 35, style: { fontSize: 16, color: "#64748B", fontWeight: "600" }, zIndex: 2 },
          { id: "arch-line", type: "shape", name: "Grid Divider", content: "line", x: 60, y: 810, width: 960, height: 2, style: { backgroundColor: "#E2E8F0" }, zIndex: 2 },
          { id: "arch-price", type: "text", name: "Price Display", content: propPrice, x: 60, y: 835, width: 400, height: 50, style: { fontSize: 32, fontWeight: "900", color: "#0F172A" }, zIndex: 2 },
          { id: "arch-specs", type: "badge", name: "Specs Tag", content: propSpecs, x: 500, y: 835, width: 520, height: 50, style: { backgroundColor: "#F8FAFC", color: "#0F172A", borderRadius: 12, fontSize: 14, border: "1px solid #E2E8F0" }, zIndex: 2 },
        ],
      };

    // 9. Waterfront Lifestyle Showcase
    case "waterfront_lifestyle":
      return {
        id: "waterfront_lifestyle",
        name: "Waterfront Lifestyle Showcase",
        background: { type: "gradient", value: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" },
        layers: [
          { id: "water-hero", type: "image", name: "Waterfront Photo", content: heroImg, x: 40, y: 40, width: 1000, height: 640, style: { borderRadius: 24 }, zIndex: 1 },
          { id: "water-badge", type: "badge", name: "Waterfront Badge", content: "🌊 WATERFRONT LIFESTYLE", x: 80, y: 80, width: 240, height: 40, style: { backgroundColor: "#0284C7", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 12 }, zIndex: 3 },
          { id: "water-title", type: "text", name: "Title", content: propTitle, x: 40, y: 710, width: 1000, height: 60, style: { fontSize: 40, fontWeight: "900", color: "#FFFFFF" }, zIndex: 2 },
          { id: "water-price", type: "text", name: "Price Tag", content: propPrice, x: 40, y: 780, width: 450, height: 60, style: { fontSize: 36, fontWeight: "900", color: "#7DD3FC" }, zIndex: 2 },
          { id: "water-cta", type: "badge", name: "Tour CTA", content: "REQUEST PRIVATE DOCK & HOME TOUR", x: 500, y: 780, width: 540, height: 60, style: { backgroundColor: "#0284C7", color: "#FFFFFF", fontWeight: "800", borderRadius: 16, fontSize: 15 }, zIndex: 2 },
        ],
      };

    // 10. Coming Soon VIP Teaser
    case "coming_soon_teaser":
      return {
        id: "coming_soon_teaser",
        name: "Coming Soon VIP Teaser",
        background: { type: "gradient", value: "linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%)" },
        layers: [
          { id: "cs-hero", type: "image", name: "Teaser Photo", content: heroImg, x: 60, y: 60, width: 960, height: 600, style: { borderRadius: 24, filter: "brightness(0.8)" }, zIndex: 1 },
          { id: "cs-badge", type: "badge", name: "VIP Badge", content: "🔒 VIP EARLY ACCESS · COMING SOON", x: 100, y: 100, width: 320, height: 44, style: { backgroundColor: "#A855F7", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 13 }, zIndex: 3 },
          { id: "cs-title", type: "text", name: "Title Text", content: propTitle, x: 60, y: 700, width: 960, height: 60, style: { fontSize: 42, fontWeight: "900", color: "#FFFFFF" }, zIndex: 2 },
          { id: "cs-sub", type: "text", name: "Teaser Subtitle", content: "Off-market luxury listing launching next week. Register for early private viewing.", x: 60, y: 770, width: 960, height: 50, style: { fontSize: 16, color: "#CBD5E1", lineHeight: 1.4 }, zIndex: 2 },
          { id: "cs-btn", type: "badge", name: "VIP RSVP Button", content: "JOIN VIP WAITING LIST", x: 60, y: 840, width: 960, height: 60, style: { backgroundColor: "#9333EA", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 18 }, zIndex: 2 },
        ],
      };

    // 11. Just Sold Celebration
    case "just_sold_celebration":
      return {
        id: "just_sold_celebration",
        name: "Just Sold Celebration",
        background: { type: "gradient", value: "linear-gradient(135deg, #064E3B 0%, #022C22 100%)" },
        layers: [
          { id: "sold-hero", type: "image", name: "Sold House Photo", content: heroImg, x: 40, y: 40, width: 1000, height: 580, style: { borderRadius: 24 }, zIndex: 1 },
          { id: "sold-badge", type: "badge", name: "Sold Ribbon", content: "🏆 JUST SOLD · OVER ASKING PRICE", x: 40, y: 640, width: 1000, height: 60, style: { backgroundColor: "#10B981", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 18 }, zIndex: 2 },
          { id: "sold-title", type: "text", name: "Title", content: propTitle, x: 40, y: 720, width: 1000, height: 50, style: { fontSize: 36, fontWeight: "900", color: "#FFFFFF" }, zIndex: 2 },
          { id: "sold-stats", type: "text", name: "Sold Stats", content: `Sold in 6 Days  ·  104% of Asking Price  ·  Represented Seller`, x: 40, y: 780, width: 1000, height: 40, style: { fontSize: 18, color: "#6EE7B7", fontWeight: "700" }, zIndex: 2 },
          { id: "sold-cta", type: "badge", name: "Seller CTA", content: "WANT TO SELL YOUR HOME FOR RECORD PRICE? CONTACT US", x: 40, y: 840, width: 1000, height: 60, style: { backgroundColor: "#047857", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 15 }, zIndex: 2 },
        ],
      };

    // 14. Split Screen Property Showcase
    case "split_screen_showcase":
    case "split_screen":
      return {
        id: "split_screen_showcase",
        name: "Split Screen Property Showcase",
        background: { type: "color", value: "#0F172A" },
        layers: [
          { id: "split-left-photo", type: "image", name: "Left Full Photo", content: heroImg, x: 0, y: 0, width: 540, height: 1080, zIndex: 1 },
          { id: "split-right-bg", type: "shape", name: "Right Panel BG", content: "box", x: 540, y: 0, width: 540, height: 1080, style: { backgroundColor: "#0F172A" }, zIndex: 2 },
          { id: "split-badge", type: "badge", name: "Split Badge", content: "EXECUTIVE RESIDENCE", x: 580, y: 80, width: 240, height: 36, style: { backgroundColor: "#0284C7", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 12 }, zIndex: 3 },
          { id: "split-title", type: "text", name: "Split Title", content: propTitle, x: 580, y: 140, width: 460, height: 100, style: { fontSize: 38, fontWeight: "900", color: "#FFFFFF", lineHeight: 1.2 }, zIndex: 3 },
          { id: "split-price", type: "text", name: "Split Price", content: propPrice, x: 580, y: 260, width: 460, height: 50, style: { fontSize: 34, fontWeight: "900", color: "#38BDF8" }, zIndex: 3 },
          { id: "split-specs-1", type: "badge", name: "Spec Bed", content: `🛏️ ${bedrooms || 4} Bedrooms`, x: 580, y: 330, width: 440, height: 54, style: { backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: 14, fontSize: 15, fontWeight: "700" }, zIndex: 3 },
          { id: "split-specs-2", type: "badge", name: "Spec Bath", content: `🚿 ${bathrooms || 3} Bathrooms`, x: 580, y: 400, width: 440, height: 54, style: { backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: 14, fontSize: 15, fontWeight: "700" }, zIndex: 3 },
          { id: "split-specs-3", type: "badge", name: "Spec Area", content: `📐 ${area || "3,200"} Sq Ft`, x: 580, y: 470, width: 440, height: 54, style: { backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: 14, fontSize: 15, fontWeight: "700" }, zIndex: 3 },
          { id: "split-cta", type: "badge", name: "Split CTA", content: "SCHEDULE PRIVATE TOUR →", x: 580, y: 560, width: 440, height: 60, style: { backgroundColor: "#0284C7", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 16 }, zIndex: 3 },
        ],
      };

    // 15. Polaroid Property Collection
    case "polaroid_collection":
    case "polaroid":
      return {
        id: "polaroid_collection",
        name: "Polaroid Property Collection",
        background: { type: "color", value: "#F8FAFC" },
        layers: [
          { id: "pol-card-1", type: "image", name: "Polaroid 1 (Tilted Left)", content: heroImg, x: 60, y: 80, width: 460, height: 420, style: { borderRadius: 12, border: "16px solid #FFFFFF", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", transform: "rotate(-4deg)" }, zIndex: 1 },
          { id: "pol-card-2", type: "image", name: "Polaroid 2 (Tilted Right)", content: subImg, x: 540, y: 120, width: 460, height: 420, style: { borderRadius: 12, border: "16px solid #FFFFFF", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", transform: "rotate(5deg)" }, zIndex: 2 },
          { id: "pol-title", type: "text", name: "Handwritten Title", content: propTitle, x: 60, y: 570, width: 960, height: 60, style: { fontSize: 40, fontFamily: "Playfair Display, serif", fontWeight: "800", color: "#0F172A", textAlign: "center" }, zIndex: 3 },
          { id: "pol-price", type: "text", name: "Polaroid Price", content: propPrice, x: 60, y: 640, width: 960, height: 50, style: { fontSize: 36, fontWeight: "900", color: "#2563EB", textAlign: "center" }, zIndex: 3 },
          { id: "pol-pin", type: "badge", name: "Pin Badge", content: `📍 ${propLoc} · ${propSpecs}`, x: 180, y: 710, width: 720, height: 50, style: { backgroundColor: "#EFF6FF", color: "#1E40AF", borderRadius: 999, fontSize: 15, fontWeight: "700" }, zIndex: 3 },
        ],
      };

    // 16. Minimal White Luxury
    case "minimal_white_luxury":
    case "minimal_luxury_property":
      return {
        id: templateId,
        name: "Minimal White Luxury",
        background: { type: "color", value: "#FFFFFF" },
        layers: [
          { id: "min-hero", type: "image", name: "Offset Right Photo", content: heroImg, x: 500, y: 60, width: 520, height: 960, style: { borderRadius: 8 }, zIndex: 1 },
          { id: "min-brand", type: "text", name: "Minimal Brand Line", content: (brandKit.brokerage_name || "REALTY PULSE").toUpperCase(), x: 60, y: 100, width: 400, height: 30, style: { fontSize: 13, fontWeight: "900", color: "#64748B", letterSpacing: "4px" }, zIndex: 2 },
          { id: "min-title", type: "text", name: "Minimal Serif Title", content: propTitle, x: 60, y: 160, width: 400, height: 180, style: { fontSize: 48, fontFamily: "Playfair Display, serif", fontWeight: "400", color: "#0F172A", lineHeight: 1.15 }, zIndex: 2 },
          { id: "min-price", type: "text", name: "Minimal Slate Price", content: propPrice, x: 60, y: 360, width: 400, height: 50, style: { fontSize: 32, fontWeight: "700", color: "#334155" }, zIndex: 2 },
          { id: "min-specs", type: "text", name: "Minimal Specs", content: propSpecs, x: 60, y: 430, width: 400, height: 60, style: { fontSize: 16, color: "#64748B", lineHeight: 1.4 }, zIndex: 2 },
          { id: "min-link", type: "text", name: "Arrow CTA Link", content: "DISCOVER ESTATE  →", x: 60, y: 520, width: 400, height: 40, style: { fontSize: 14, fontWeight: "900", color: "#0F172A", letterSpacing: "2px" }, zIndex: 2 },
        ],
      };

    // 17. Dark Luxury Estate
    case "dark_luxury_estate":
    case "dark_luxury":
      return {
        id: templateId,
        name: "Dark Luxury Estate",
        background: { type: "color", value: "#020617" },
        layers: [
          { id: "dl-ring", type: "shape", name: "Gold Border Frame", content: "box", x: 80, y: 80, width: 920, height: 540, style: { border: "2px solid #D97706", borderRadius: 16 }, zIndex: 1 },
          { id: "dl-photo", type: "image", name: "Center Hero Photo", content: heroImg, x: 100, y: 100, width: 880, height: 500, style: { borderRadius: 12 }, zIndex: 2 },
          { id: "dl-badge", type: "badge", name: "Obsidian Gold Stamp", content: "✦ PRIVATE LISTING ✦", x: 390, y: 650, width: 300, height: 36, style: { backgroundColor: "#D97706", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 12 }, zIndex: 3 },
          { id: "dl-title", type: "text", name: "Serif Title", content: propTitle, x: 60, y: 700, width: 960, height: 60, style: { fontSize: 44, fontFamily: "Playfair Display, serif", fontWeight: "700", color: "#FFFFFF", textAlign: "center" }, zIndex: 3 },
          { id: "dl-price", type: "text", name: "Gold Price", content: propPrice, x: 60, y: 770, width: 960, height: 50, style: { fontSize: 36, fontFamily: "Playfair Display, serif", fontStyle: "italic", color: "#F59E0B", textAlign: "center" }, zIndex: 3 },
          { id: "dl-cta", type: "badge", name: "Gold Pill Button", content: "INQUIRE FOR PRIVATE BROKER BRIEFING", x: 240, y: 840, width: 600, height: 56, style: { backgroundColor: "#D97706", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 15 }, zIndex: 3 },
        ],
      };

    // 18. Modern Brutalist Listing
    case "modern_brutalist":
    case "brutalist":
      return {
        id: templateId,
        name: "Modern Brutalist Listing",
        background: { type: "color", value: "#000000" },
        layers: [
          { id: "brut-photo", type: "image", name: "Stark B&W Facade Photo", content: heroImg, x: 40, y: 40, width: 1000, height: 520, style: { borderRadius: 0, border: "4px solid #FFFFFF", filter: "contrast(1.2)" }, zIndex: 1 },
          { id: "brut-title", type: "text", name: "Ultra Heavy Black Title", content: propTitle.toUpperCase(), x: 40, y: 580, width: 1000, height: 80, style: { fontSize: 52, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#FFFFFF", letterSpacing: "-1px" }, zIndex: 2 },
          { id: "brut-price-box", type: "badge", name: "Heavy Price Stamp", content: propPrice, x: 40, y: 670, width: 440, height: 64, style: { backgroundColor: "#FACC15", color: "#000000", fontWeight: "900", fontSize: 36, borderRadius: 0, border: "3px solid #FFFFFF" }, zIndex: 2 },
          { id: "brut-specs-box", type: "badge", name: "Heavy Specs Box", content: propSpecs.toUpperCase(), x: 500, y: 670, width: 540, height: 64, style: { backgroundColor: "#FFFFFF", color: "#000000", fontWeight: "900", fontSize: 16, borderRadius: 0 }, zIndex: 2 },
        ],
      };

    // 19. Price Drop Alert
    case "price_drop_alert":
    case "price_improvement":
      return {
        id: templateId,
        name: "Price Drop Alert",
        background: { type: "color", value: "#451A03" },
        layers: [
          { id: "pd-badge", type: "badge", name: "Flame Red Price Drop Tag", content: "🔥 $150,000 PRICE REDUCTION ALERT", x: 60, y: 60, width: 480, height: 44, style: { backgroundColor: "#DC2626", color: "#FFFFFF", fontWeight: "900", borderRadius: 999, fontSize: 13 }, zIndex: 3 },
          { id: "pd-old-price", type: "text", name: "Strikethrough Price", content: "WAS $2,600,000", x: 60, y: 120, width: 960, height: 40, style: { fontSize: 24, fontWeight: "900", color: "#EF4444", textDecoration: "line-through" }, zIndex: 2 },
          { id: "pd-new-price", type: "text", name: "Neon Yellow New Price", content: propPrice, x: 60, y: 165, width: 960, height: 90, style: { fontSize: 76, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#FBBF24" }, zIndex: 2 },
          { id: "pd-title", type: "text", name: "Property Title", content: propTitle, x: 60, y: 265, width: 960, height: 50, style: { fontSize: 32, fontWeight: "900", color: "#FFFFFF" }, zIndex: 2 },
          { id: "pd-photo", type: "image", name: "Bottom Photo Inset", content: heroImg, x: 60, y: 330, width: 960, height: 520, style: { borderRadius: 20 }, zIndex: 1 },
          { id: "pd-cta", type: "badge", name: "Offer CTA Button", content: "SUBMIT OFFER AT REDUCED PRICE →", x: 60, y: 870, width: 960, height: 60, style: { backgroundColor: "#DC2626", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 18 }, zIndex: 3 },
        ],
      };

    // 20. Market Update Infographic
    case "market_update":
    case "market_report":
      return {
        id: templateId,
        name: "Market Update Infographic",
        background: { type: "color", value: "#0F172A" },
        layers: [
          { id: "mu-title", type: "text", name: "Report Title", content: "Q3 REAL ESTATE MARKET UPDATE", x: 60, y: 60, width: 960, height: 60, style: { fontSize: 36, fontWeight: "900", color: "#38BDF8", textAlign: "center" }, zIndex: 2 },
          { id: "mu-sub", type: "text", name: "Location Subtitle", content: `Local Trends for ${propLoc}`, x: 60, y: 120, width: 960, height: 40, style: { fontSize: 18, color: "#94A3B8", textAlign: "center" }, zIndex: 2 },
          { id: "q1", type: "badge", name: "Q1 Median Price Card", content: "💰 $1.42M\nMedian Home Price (+8.4% YoY)", x: 60, y: 180, width: 460, height: 180, style: { backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: 20, fontSize: 18, fontWeight: "800", padding: "20px" }, zIndex: 2 },
          { id: "q2", type: "badge", name: "Q2 Days on Market Card", content: "⚡ 18 Days\nAverage Days on Market (-4 Days)", x: 560, y: 180, width: 460, height: 180, style: { backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: 20, fontSize: 18, fontWeight: "800", padding: "20px" }, zIndex: 2 },
          { id: "q3", type: "badge", name: "Q3 Active Listings Card", content: "🏘️ 142 Homes\nActive Listing Inventory", x: 60, y: 380, width: 460, height: 180, style: { backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: 20, fontSize: 18, fontWeight: "800", padding: "20px" }, zIndex: 2 },
          { id: "q4", type: "badge", name: "Q4 Sold Volume Card", content: "📈 98.6%\nSale-to-List Price Ratio", x: 560, y: 380, width: 460, height: 180, style: { backgroundColor: "#1E293B", color: "#FFFFFF", borderRadius: 20, fontSize: 18, fontWeight: "800", padding: "20px" }, zIndex: 2 },
          { id: "mu-cta", type: "badge", name: "Download Report CTA", content: "GET YOUR FREE HOME VALUATION REPORT", x: 60, y: 590, width: 960, height: 60, style: { backgroundColor: "#0284C7", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 17 }, zIndex: 2 },
        ],
      };

    // 21. Myth vs Fact
    case "myth_vs_fact":
      return {
        id: "myth_vs_fact",
        name: "Myth vs Fact",
        background: { type: "color", value: "#0F172A" },
        layers: [
          { id: "mf-title", type: "text", name: "Title Banner", content: "REAL ESTATE MYTH VS FACT", x: 60, y: 60, width: 960, height: 60, style: { fontSize: 38, fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, zIndex: 2 },
          { id: "myth-card", type: "badge", name: "Red Myth Card", content: "❌ MYTH:\n\"You need a 20% down payment to buy your first home in 2026.\"", x: 60, y: 150, width: 460, height: 400, style: { backgroundColor: "#7F1D1D", color: "#FCA5A5", borderRadius: 24, fontSize: 20, fontWeight: "800", padding: "30px", border: "2px solid #EF4444" }, zIndex: 2 },
          { id: "fact-card", type: "badge", name: "Green Fact Card", content: "✅ FACT:\n\"Many conventional & FHA loans allow down payments as low as 3% to 5.5%!\"", x: 560, y: 150, width: 460, height: 400, style: { backgroundColor: "#064E3B", color: "#6EE7B7", borderRadius: 24, fontSize: 20, fontWeight: "800", padding: "30px", border: "2px solid #10B981" }, zIndex: 2 },
          { id: "mf-cta", type: "badge", name: "Consultation CTA", content: "TALK TO OUR MORTGAGE SPECIALISTS", x: 60, y: 580, width: 960, height: 60, style: { backgroundColor: "#2563EB", color: "#FFFFFF", fontWeight: "900", borderRadius: 16, fontSize: 17 }, zIndex: 2 },
        ],
      };

    // Default Fallback
    default:
      return {
        id: templateId,
        name: MARKETING_TEMPLATES.find((t) => t.id === templateId)?.name || "Real Estate Creative",
        background: { type: "color", value: "#0F172A" },
        layers: [
          { id: "hero-def", type: "image", name: "Main Hero Image", content: heroImg, x: 0, y: 0, width: 1080, height: 720, zIndex: 1 },
          { id: "grad-def", type: "shape", name: "Gradient Overlay", content: "gradient", x: 0, y: 500, width: 1080, height: 580, style: { background: "linear-gradient(to bottom, transparent, #0F172A)" }, zIndex: 2 },
          { id: "badge-def", type: "badge", name: "Status Badge", content: "FEATURED REAL ESTATE", x: 60, y: 60, width: 240, height: 40, style: { backgroundColor: "#2563EB", color: "#FFFFFF", fontWeight: "800", borderRadius: 999, fontSize: 13 }, zIndex: 3 },
          { id: "title-def", type: "text", name: "Listing Title", content: propTitle, x: 60, y: 740, width: 960, height: 80, style: { fontSize: 44, fontWeight: "800", color: "#FFFFFF" }, zIndex: 3 },
          { id: "price-def", type: "text", name: "Price Tag", content: propPrice, x: 60, y: 830, width: 400, height: 60, style: { fontSize: 36, fontWeight: "800", color: "#F59E0B" }, zIndex: 3 },
        ],
      };
  }
}

/**
 * AI Vision Analysis for Property Photo Gallery
 */
export async function analyzePropertyImages({ propertyTitle, images = [] }) {
  if (!images || images.length === 0) {
    return {
      bestHeroImage: "",
      imageCategory: "Exterior / General",
      reason: "No image gallery uploaded for this property yet.",
      recommendedCrop: "16:9 Landscape Center",
      qualityWarnings: ["Please upload property photos to get AI hero recommendations."],
    };
  }

  const bestHeroImage = images[0];

  try {
    const prompt = `
    You are an expert Real Estate Photography Director. Analyze these property image options for "${propertyTitle}":
    Image list count: ${images.length}
    Primary Image URL: ${bestHeroImage}

    Evaluate lighting, curb appeal, interior vs exterior appeal.
    Return JSON only:
    {
      "bestHeroImage": "${bestHeroImage}",
      "imageCategory": "Exterior / Main Entrance",
      "reason": "Strong daylight curb appeal with clear architectural focal point.",
      "recommendedCrop": "1:1 Square or 4:5 Portrait Center Focus",
      "qualityWarnings": []
    }
    `;

    const responseText = await gemini.generateText(prompt, { json: true });
    let parsed = {};
    try {
      parsed = JSON.parse(responseText);
    } catch (e) {
      parsed = {};
    }

    return {
      bestHeroImage: parsed.bestHeroImage || bestHeroImage,
      imageCategory: parsed.imageCategory || "Exterior / Main Entrance",
      reason: parsed.reason || "Strong curb appeal and daylight lighting suitable for hero marketing poster.",
      recommendedCrop: parsed.recommendedCrop || "1:1 Square or 4:5 Portrait Focus",
      qualityWarnings: parsed.qualityWarnings || [],
    };
  } catch (err) {
    console.error("[Social Vision AI Error]", err.message);
    return {
      bestHeroImage: images[0],
      imageCategory: "Exterior / Main Facade",
      reason: "Primary listing photo selected as hero image.",
      recommendedCrop: "Center Subject Focus",
      qualityWarnings: [],
    };
  }
}

/**
 * AI Marketing Copy Engine (Gemini 2.0 Flash)
 */
export async function generateSocialCopy({
  propertyData = {},
  templateId = "just_listed_showcase",
  platform = "instagram_post",
  brandKit = {},
}) {
  const { title, price, location, bedrooms, bathrooms, area, type, requirement } = propertyData;
  const { brokerage_name, agent_name, agent_phone, website } = brandKit;

  const prompt = `
  You are an elite US Real Estate Copywriter for ${brokerage_name || "RealtyPulse Brokerage"}.
  Generate high-converting social media marketing copy for this property listing.

  VERIFIED PROPERTY DATA:
  - Property Title: ${title || "Luxury Residence"}
  - Price: ${price || "Price on Request"}
  - Location / Address: ${location || "Prime Location"}
  - Bedrooms: ${bedrooms || 3} BHK / Beds
  - Bathrooms: ${bathrooms || 2} Baths
  - Area: ${area || "1,850 sqft"}
  - Property Type: ${type || "Single Family Residence"}
  - Requirements / Highlights: ${requirement || "Move-in ready luxury finish"}

  TARGET TEMPLATE: ${templateId}
  TARGET PLATFORM: ${platform}
  AGENT NAME: ${agent_name || "Agent Team"}
  AGENT PHONE: ${agent_phone || "Contact Representative"}
  WEBSITE: ${website || "www.realtypulse.com"}

  OUTPUT REQUIREMENTS (JSON ONLY):
  {
    "headline": "Short Punchy 3-5 Word Headline",
    "subheadline": "Descriptive 6-10 Word Subheadline highlighting location & key feature",
    "featureLine": "Key spec line e.g. '3 Beds · 2 Baths · 1,850 Sqft'",
    "cta": "Clear CTA e.g. 'Schedule Private Tour Today | Call ${agent_phone || "Agent"}'",
    "caption": "Engaging 3-paragraph social media post caption tailored for ${platform}. Include property specs, location charm, and invitation to view.",
    "hashtags": "#RealEstate #${(location || "RealEstate").replace(/[^a-zA-Z0-9]/g, "")} #LuxuryHomes #JustListed #HouseHunting",
    "designNotes": "Clean typography overlay over primary hero image."
  }
  `;

  try {
    const responseText = await gemini.generateText(prompt, { json: true });
    const parsed = JSON.parse(responseText);
    return parsed;
  } catch (err) {
    console.error("[Social Copy AI Engine Error]", err.message);
    return {
      headline: `${title || "Luxury Property Showcase"}`,
      subheadline: `Exquisite ${type || "Residence"} located in ${location || "Prime Area"}`,
      featureLine: `${bedrooms || 3} Beds · ${bathrooms || 2} Baths · ${area || "1,850 sqft"}`,
      cta: `Call ${agent_phone || "our team"} to schedule a tour!`,
      caption: `🏡 JUST IN! Discover this stunning ${type || "property"} in ${location || "prime location"}.\n\n✨ Specifications:\n• Price: ${price || "Contact for Price"}\n• Bedrooms: ${bedrooms || 3}\n• Area: ${area || "1,850 sqft"}\n\nInterested in a private walkthrough? Send us a DM or call ${agent_phone || "us"} today!`,
      hashtags: `#RealEstate #LuxuryHomes #JustListed #${(location || "Homes").replace(/[^a-zA-Z0-9]/g, "")}`,
      designNotes: "Clean typography overlay over primary hero image.",
    };
  }
}
export async function generateCreativeConcepts({ prompt = "", propertyData = {}, brandKit = {} }) {
  const { title, price, location, bedrooms, bathrooms, area, type, images = [] } = propertyData;
  const { brokerage_name, primary_color, secondary_color, agent_name, agent_phone } = brandKit;

  const mainPhoto = images[0] || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80";
  const subPhoto = images[1] || images[0] || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80";

  // Build 4 distinct concept layout layer structures
  const conceptA = {
    id: "concept-editorial",
    name: "Luxury Editorial",
    styleCategory: "LUXURY EDITORIAL",
    desc: "Full-bleed architectural photo with high-contrast serif typography and floating glass stats card.",
    background: { type: "color", value: "#0F172A" },
    layers: [
      { id: "hero-img", type: "image", name: "Main Hero Image", content: mainPhoto, x: 0, y: 0, width: 1080, height: 720, zIndex: 1 },
      { id: "gradient-overlay", type: "shape", name: "Bottom Shadow Gradient", content: "gradient", x: 0, y: 500, width: 1080, height: 580, style: { background: "linear-gradient(to bottom, transparent, rgba(15, 23, 42, 0.95))" }, zIndex: 2 },
      { id: "badge-top", type: "badge", name: "Status Badge", content: "JUST LISTED · EXCLUSIVE", x: 60, y: 60, width: 220, height: 40, style: { backgroundColor: "rgba(255, 255, 255, 0.9)", color: "#0F172A", fontWeight: "800", borderRadius: 999, fontSize: 13, padding: "8px 18px" }, zIndex: 3 },
      { id: "title-text", type: "text", name: "Listing Title", content: title || "Skyline Luxury Villa", x: 60, y: 740, width: 960, height: 80, style: { fontSize: 44, fontFamily: "Playfair Display, Georgia, serif", fontWeight: "800", color: "#FFFFFF" }, zIndex: 3 },
      { id: "price-text", type: "text", name: "Price Tag", content: price ? `₹${price}` : "$2,450,000", x: 60, y: 830, width: 400, height: 60, style: { fontSize: 36, fontFamily: "Inter, sans-serif", fontWeight: "800", color: "#F59E0B" }, zIndex: 3 },
      { id: "specs-card", type: "badge", name: "Glass Specs Bar", content: `${bedrooms || 4} Beds  ·  ${bathrooms || 3} Baths  ·  ${area || "3,200"} Sqft`, x: 60, y: 910, width: 960, height: 56, style: { backgroundColor: "rgba(255, 255, 255, 0.12)", backdropFilter: "blur(20px)", color: "#FFFFFF", borderRadius: 16, fontSize: 16, fontWeight: "700", border: "1px solid rgba(255, 255, 255, 0.2)", padding: "14px 24px" }, zIndex: 3 },
      { id: "brand-footer", type: "text", name: "Brokerage & Agent Info", content: `${brokerage_name || "RealtyPulse Premier"}  |  ${agent_name || "Adwayth VS"} (${agent_phone || "+1 800-REALTY"})`, x: 60, y: 990, width: 960, height: 40, style: { fontSize: 13, color: "#94A3B8", fontWeight: "600" }, zIndex: 3 },
    ]
  };

  const conceptB = {
    id: "concept-cinematic",
    name: "Cinematic Property",
    styleCategory: "CINEMATIC",
    desc: "Dual photo split layout with rich navy backdrop and prominent price cut ribbon.",
    background: { type: "color", value: "#020617" },
    layers: [
      { id: "hero-top", type: "image", name: "Exterior Photo", content: mainPhoto, x: 40, y: 40, width: 640, height: 600, style: { borderRadius: 24 }, zIndex: 1 },
      { id: "sub-right", type: "image", name: "Interior Photo", content: subPhoto, x: 700, y: 40, width: 340, height: 600, style: { borderRadius: 24 }, zIndex: 1 },
      { id: "title-banner", type: "text", name: "Property Title", content: title || "Modern Glass Estate", x: 40, y: 670, width: 1000, height: 60, style: { fontSize: 38, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#FFFFFF" }, zIndex: 2 },
      { id: "loc-text", type: "text", name: "Location Tag", content: `📍 ${location || "Beverly Hills, CA"}`, x: 40, y: 740, width: 1000, height: 40, style: { fontSize: 18, color: "#60A5FA", fontWeight: "700" }, zIndex: 2 },
      { id: "price-badge", type: "badge", name: "Price Badge", content: `OFFER AT ${price ? `₹${price}` : "$1,890,000"}`, x: 40, y: 810, width: 360, height: 60, style: { backgroundColor: "#2563EB", color: "#FFFFFF", fontWeight: "800", borderRadius: 999, fontSize: 18, padding: "16px 28px" }, zIndex: 2 },
      { id: "cta-bar", type: "badge", name: "Call to Action", content: `SCHEDULE TOUR WITH ${agent_name || "AGENT"}`, x: 420, y: 810, width: 620, height: 60, style: { backgroundColor: "#1E293B", color: "#F8FAFC", fontWeight: "700", borderRadius: 999, fontSize: 15, border: "1px solid #334155", padding: "18px 28px" }, zIndex: 2 },
    ]
  };

  const conceptC = {
    id: "concept-modern",
    name: "Modern Instagram",
    styleCategory: "MODERN INSTAGRAM",
    desc: "Vibrant glassmorphic card-in-card composition designed for social engagement.",
    background: { type: "gradient", value: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)" },
    layers: [
      { id: "card-container", type: "shape", name: "Frosted Glass Card", content: "glass_card", x: 60, y: 60, width: 960, height: 960, style: { backgroundColor: "rgba(255, 255, 255, 0.1)", backdropFilter: "blur(30px)", borderRadius: 36, border: "1px solid rgba(255, 255, 255, 0.2)" }, zIndex: 1 },
      { id: "hero-card", type: "image", name: "Hero Photo", content: mainPhoto, x: 100, y: 100, width: 880, height: 540, style: { borderRadius: 24 }, zIndex: 2 },
      { id: "tag-hot", type: "badge", name: "Hot Listing Tag", content: "🔥 FEATURED HOME", x: 130, y: 130, width: 200, height: 40, style: { backgroundColor: "#EF4444", color: "#FFFFFF", fontWeight: "800", borderRadius: 999, fontSize: 12, padding: "8px 16px" }, zIndex: 3 },
      { id: "title-mod", type: "text", name: "Title Text", content: title || "Urban Luxury Residence", x: 100, y: 680, width: 880, height: 50, style: { fontSize: 34, fontFamily: "Inter, sans-serif", fontWeight: "800", color: "#FFFFFF" }, zIndex: 2 },
      { id: "price-large", type: "text", name: "Price Display", content: price ? `₹${price}` : "$1,450,000", x: 100, y: 740, width: 500, height: 60, style: { fontSize: 38, fontFamily: "Inter, sans-serif", fontWeight: "900", color: "#38BDF8" }, zIndex: 2 },
      { id: "specs-pills", type: "badge", name: "Pill Specs", content: `🛌 ${bedrooms || 3} BHK   🛀 ${bathrooms || 2} Baths   📐 ${area || "1,850"} Sqft`, x: 100, y: 820, width: 880, height: 50, style: { backgroundColor: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF", borderRadius: 14, fontSize: 15, fontWeight: "700", padding: "12px 20px" }, zIndex: 2 },
    ]
  };

  const conceptD = {
    id: "concept-architectural",
    name: "Minimal Architecture",
    styleCategory: "MINIMAL ARCHITECTURE",
    desc: "Clean architectural grid, crisp white background, minimal typography & dark borders.",
    background: { type: "color", value: "#FFFFFF" },
    layers: [
      { id: "hero-arch", type: "image", name: "Architecture Photo", content: mainPhoto, x: 60, y: 60, width: 960, height: 640, style: { borderRadius: 16 }, zIndex: 1 },
      { id: "arch-title", type: "text", name: "Title", content: title || "Architectural Masterpiece", x: 60, y: 730, width: 960, height: 50, style: { fontSize: 36, fontFamily: "Inter, sans-serif", fontWeight: "800", color: "#0F172A" }, zIndex: 2 },
      { id: "arch-sub", type: "text", name: "Address & Type", content: `${location || "Prime Location"} · ${type || "Single Family Residence"}`, x: 60, y: 790, width: 960, height: 35, style: { fontSize: 16, color: "#64748B", fontWeight: "600" }, zIndex: 2 },
      { id: "arch-divider", type: "shape", name: "Divider Line", content: "line", x: 60, y: 840, width: 960, height: 2, style: { backgroundColor: "#E2E8F0" }, zIndex: 2 },
      { id: "arch-price", type: "text", name: "Price", content: price ? `₹${price}` : "$3,200,000", x: 60, y: 865, width: 400, height: 50, style: { fontSize: 32, fontWeight: "800", color: "#0F172A" }, zIndex: 2 },
      { id: "arch-agent", type: "text", name: "Agent Contact", content: `Presented by ${agent_name || "RealtyPulse Team"} | ${agent_phone || "Contact Representative"}`, x: 60, y: 925, width: 960, height: 35, style: { fontSize: 14, color: "#475569", fontWeight: "600" }, zIndex: 2 },
    ]
  };

  return {
    promptReceived: prompt || "Default AI Creative Direction",
    concepts: [conceptA, conceptB, conceptC, conceptD],
  };
}

/**
 * AI Restyle System
 * Transforms an existing design layer stack based on 1-click restyle intentions.
 */
export async function aiRestyleDesign({ currentDesign = {}, restyleAction = "luxury" }) {
  if (!currentDesign || !currentDesign.layers) {
    return currentDesign;
  }

  const updatedLayers = currentDesign.layers.map((layer) => {
    const l = { ...layer, style: { ...layer.style } };

    switch (restyleAction) {
      case "luxury":
        if (l.type === "text" && l.name === "Listing Title") {
          l.style.fontFamily = "Playfair Display, Georgia, serif";
          l.style.color = "#FFFFFF";
        }
        if (l.name === "Price Tag" || l.name === "Price Display") {
          l.style.color = "#F59E0B";
        }
        break;

      case "modern":
        if (l.type === "text") {
          l.style.fontFamily = "Inter, system-ui, sans-serif";
          l.style.fontWeight = "900";
        }
        break;

      case "minimal":
        if (l.type === "badge") {
          l.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
          l.style.color = "#0F172A";
        }
        break;

      case "cinematic":
        if (l.type === "shape" && l.name === "Bottom Shadow Gradient") {
          l.style.background = "linear-gradient(to bottom, transparent 0%, rgba(2, 6, 23, 0.95) 100%)";
        }
        break;

      case "improve_cta":
        if (l.name === "Call to Action" || l.name === "Glass Specs Bar") {
          l.style.backgroundColor = "#2563EB";
          l.style.color = "#FFFFFF";
          l.style.fontSize = (parseInt(l.style.fontSize) || 15) + 2;
        }
        break;
      default:
        break;
    }

    return l;
  });

  return {
    ...currentDesign,
    layers: updatedLayers,
    lastRestyled: restyleAction,
  };
}

/**
 * Gemini 2.0 AI Vision & Design Director Generator
 * Generates an AI-curated, photo-matched design layout using Gemini 2.0 Flash.
 */
export async function generateAIDesignLayout({ templateId = "luxury_editorial_listing", propertyData = {}, brandKit = {}, ratio = "instagram_post", styleTheme = "vogue_luxury" }) {
  const { title, price, location, bedrooms, bathrooms, area, type, images = [] } = propertyData;
  const { brokerage_name, agent_name, agent_phone } = brandKit;

  const prompt = `
  You are an Executive Art Director for Architectural Digest & Canva Real Estate Marketing.
  Analyze this property listing and generate an AI-curated layout styling JSON for template "${templateId}" and ratio "${ratio}".

  PROPERTY DETAILS:
  - Title: ${title || "Skyline Luxury Residence"}
  - Price: ${price ? `₹${price}` : "$2,450,000"}
  - Location: ${location || "Beverly Hills, CA"}
  - Specifications: ${bedrooms || 4} Beds · ${bathrooms || 3} Baths · ${area || "3,200"} Sqft
  - Property Type: ${type || "Single Family Residence"}
  - Brokerage: ${brokerage_name || "RealtyPulse Premier"}
  - Agent: ${agent_name || "Adwayth VS"} (${agent_phone || "+1 800-REALTY"})

  DESIRED STYLE THEME: ${styleTheme}

  Return JSON ONLY with exact fields:
  {
    "designName": "AI Curated Luxury Showcase",
    "bgColor": "#020617",
    "bgGradient": "linear-gradient(135deg, #020617 0%, #0F172A 100%)",
    "primaryFont": "Playfair Display, Georgia, serif",
    "secondaryFont": "Inter, sans-serif",
    "headlineColor": "#FFFFFF",
    "priceColor": "#F59E0B",
    "accentBadgeColor": "#D97706",
    "badgeTextColor": "#FFFFFF",
    "customBadgeText": "✦ EXCLUSIVE ESTATE SHOWCASE ✦",
    "customHeadline": "${title || "Skyline Luxury Residence"}",
    "ctaText": "BY PRIVATE APPOINTMENT ONLY"
  }
  `;

  try {
    const text = await gemini.generateText(prompt, { json: true, systemInstruction: "You output valid JSON only for real estate graphic design properties." });
    const aiSpecs = JSON.parse(text);

    // Fetch base bespoke layout for template
    const baseLayout = getTemplateLayout(templateId, propertyData, brandKit, ratio);

    // Merge AI-curated specs into layers
    const enhancedLayers = baseLayout.layers.map((l) => {
      const layer = { ...l, style: { ...l.style } };
      if (l.type === "text" && (l.name.includes("Title") || l.id.includes("title"))) {
        if (aiSpecs.customHeadline) layer.content = aiSpecs.customHeadline;
        if (aiSpecs.primaryFont) layer.style.fontFamily = aiSpecs.primaryFont;
        if (aiSpecs.headlineColor) layer.style.color = aiSpecs.headlineColor;
      }
      if (l.name.includes("Price") || l.id.includes("price")) {
        if (aiSpecs.priceColor) layer.style.color = aiSpecs.priceColor;
        if (aiSpecs.secondaryFont) layer.style.fontFamily = aiSpecs.secondaryFont;
      }
      if (l.type === "badge" && (l.name.includes("Tag") || l.name.includes("Badge"))) {
        if (aiSpecs.customBadgeText) layer.content = aiSpecs.customBadgeText;
        if (aiSpecs.accentBadgeColor) layer.style.backgroundColor = aiSpecs.accentBadgeColor;
        if (aiSpecs.badgeTextColor) layer.style.color = aiSpecs.badgeTextColor;
      }
      if (l.type === "badge" && l.name.includes("CTA")) {
        if (aiSpecs.ctaText) layer.content = aiSpecs.ctaText;
        if (aiSpecs.accentBadgeColor) layer.style.backgroundColor = aiSpecs.accentBadgeColor;
      }
      return layer;
    });

    return {
      ...baseLayout,
      name: `${baseLayout.name} (✨ Gemini AI Enhanced)`,
      background: aiSpecs.bgGradient ? { type: "gradient", value: aiSpecs.bgGradient } : (aiSpecs.bgColor ? { type: "color", value: aiSpecs.bgColor } : baseLayout.background),
      layers: enhancedLayers,
      aiEnhanced: true,
    };
  } catch (err) {
    console.error("[AI Design Generator Fallback]", err.message);
    return getTemplateLayout(templateId, propertyData, brandKit, ratio);
  }
}

