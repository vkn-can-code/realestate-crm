# 📖 REALTYPULSE DESIGN BIBLE
## Architectural & Graphic Design Standard for US Real Estate Marketing Creatives

---

## 1. VISUAL HIERARCHY RULES
- **Rule of the Focal Hero**: Every visual creative must possess **exactly one primary visual hero**. In listing templates, the hero is either the architectural facade photo or a dramatic price point. Secondary elements (badges, specs, location tags) must never compete in visual size, contrast, or weight with the primary hero.
- **Layer Stacking & Vertical Rhythm**:
  - Minimum vertical padding between text blocks: `18px`.
  - Never allow badges or pill tags to overlap text baselines.
  - Text bounding boxes must calculate actual text height to prevent line collisions.
- **Visual Weight Balancing**: Dark background elements carry high visual weight; pair them with generous white space or clean keyline borders to prevent claustrophobic layout density.

---

## 2. LUXURY REAL ESTATE DESIGN PRINCIPLES
- **Editorial Elegance over Commercial Flash**: High-net-worth buyers respond to editorial restraint rather than aggressive bright banners.
- **Typography Pairing**:
  - Display Title: `Playfair Display` (Serif, High Contrast, Custom Tracking).
  - Subheadings & Metadata: `Inter` or `Montserrat` (Clean Geometric Sans-Serif).
- **Subtle Gold & Slate Accent Rules**: Use gold (`#D97706` / `#F59E0B`) sparingly for thin keylines (`2px` height) or small category stamps (`letter-spacing: 3px`). Avoid solid bright gold block fills.
- **Full-Bleed Imagery with Vignette Scrims**: Extend luxury exterior photos to canvas edges, protected by a dark subtle gradient scrim (`linear-gradient(to bottom, transparent 40%, rgba(2, 6, 23, 0.95) 100%)`).

---

## 3. MODERN REAL ESTATE SOCIAL MEDIA PRINCIPLES
- **Canva-Quality Aesthetic Standard**: Creatives must look like bespoke designs published by top US brokerages (Compass, The Agency, Sotheby's International Realty).
- **Zero "Dashboard UI Bleed"**: Never use gray web widgets, form inputs, table gridlines, or browser control boxes inside a marketing post.
- **Asymmetrical Balance**: Use 60/40 asymmetrical split layouts, diagonal photo crops, or offset vertical text columns to create dynamic visual energy.

---

## 4. IMAGE CROPPING & FOCAL POINT RULES
- **Exterior Facades**: 1:1 or 4:5 portrait crop centered on the architectural entrance or roofline.
- **Kitchens & Living Rooms**: 16:9 landscape or 4:5 vertical crop focusing on natural light, island countertops, or ceiling height.
- **Pools & Views**: Ultrawide 16:9 panoramic crop or full-bleed background overlay.
- **Automatic Safe Crop**: Ensure key architectural elements are not clipped by canvas boundaries or overlapping badges.

---

## 5. TYPOGRAPHY SCALE SYSTEM (BASE CANVAS 1080x1080)
| Element Type | Font Family | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|---|
| **Category Stamp** | `Playfair Display` / `Inter` | 12px – 14px | 700 / 800 | 1.2 | `3px – 4px` (Uppercase) |
| **Headline / Title** | `Playfair Display` / `Inter` | 44px – 56px | 800 / 900 | 1.15 | `-0.5px` |
| **Price Display** | `Inter` / `Playfair` | 36px – 48px | 800 / 900 | 1.1 | `0px` |
| **Subheadline / Location** | `Inter` | 16px – 20px | 500 / 600 | 1.3 | `0px` |
| **Spec Pill Text** | `Inter` | 14px – 15px | 700 | 1.0 | `0.5px` |
| **Footer / Agent License** | `Inter` | 12px – 13px | 500 / 600 | 1.2 | `0.5px` |

---

## 6. BRAND ADAPTATION RULES & PERSONALITIES
Each brokerage brand kit maps to one of 6 distinct Brand Personalities:
1. **LUXURY**: Slate Black (`#020617`), Gold (`#D97706`), `Playfair Display` headlines, thin keylines.
2. **MODERN**: Pure White (`#FFFFFF`), Royal Blue (`#2563EB`), `Inter` ExtraBold, floating shadow cards.
3. **CORPORATE**: Midnight Navy (`#0F172A`), Steel Blue (`#3B82F6`), `Roboto` / `Inter` Bold, crisp gridlines.
4. **FRIENDLY**: Warm Ivory (`#FAFAF9`), Emerald (`#059669`), Soft Rounded Badges, warm light typography.
5. **MINIMAL**: Monochrome Charcoal (`#18181B`), Hairline Borders (`#E4E4E7`), 70% negative white space.
6. **BOLD**: High-Contrast Black & Yellow (`#FACC15`), Crimson (`#DC2626`), Ultra-thick 900 weight typography.

---

## 7. SAFE TEXT AREAS & BOUNDARIES
- **1080x1080 Square (1:1)**: Safe margins = `60px` top/bottom/left/right.
- **1080x1350 Portrait (4:5)**: Safe margins = `60px` left/right, `80px` top/bottom.
- **1080x1920 Story (9:16)**: Safe margins = `60px` left/right, **`160px` top** (avoid Instagram profile header) and **`180px` bottom** (avoid swipe-up/reply bar).
- **1200x630 Feed (1.91:1)**: Safe margins = `60px` top/bottom/left/right.

---

## 8. MOBILE-FIRST DESIGN RULES
- **Thumb-Stoppers**: Contrast ratio must exceed WCAG 4.5:1 so text is readable on mobile screens under direct sunlight.
- **Text Brevity**: Headlines must not exceed 3 lines. Specs should be formatted as clean inline badges (`3 Beds · 2 Baths · 1,850 Sqft`).

---

## 9. INSTAGRAM DESIGN RULES (1:1 & 4:5)
- High aesthetic density, vibrant color contrast, subtle glassmorphism (`backdrop-filter: blur(20px)`).

---

## 10. LINKEDIN PROFESSIONAL DESIGN RULES (1.91:1)
- Editorial 2-column or 50/50 split layout, corporate color palette, focus on ROI stats, market analytics, and agent credentials.

---

## 11. FACEBOOK POST RULES (1.91:1)
- Clear event banners, bold price callouts, prominent CTA buttons ("SCHEDULE SHOWING", "RSVP FOR OPEN HOUSE").

---

## 12. CAROUSEL DESIGN RULES
- Consistent branding header across slides, slide numbers ("01 / 05"), seamless continuous background flow.

---

## 13. PROPERTY PHOTOGRAPHY COMPOSITION RULES
- Hero exterior photos should never be squeezed or stretched.
- Always preserve original aspect ratio (`object-fit: cover`).
- Position primary subjects within the upper two-thirds of the photo frame.

---

## 14. CTA PLACEMENT RULES
- Primary CTA buttons should reside in the lower third of the canvas.
- Maintain a minimum of `20px` spacing above and below CTA elements to ensure touch target clearance.
