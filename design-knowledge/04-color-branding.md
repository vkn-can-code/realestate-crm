# 04. Color Systems & Brand Kit Governance

## Curated Color Palettes
- **Luxury Estate**: Deep Slate Navy (`#0F172A`), Warm Amber Gold (`#F59E0B`), Off-White (`#F8FAFC`).
- **Modern Urban**: Midnight Indigo (`#1E1B4B`), Electric Sky Blue (`#38BDF8`), Crimson Accent (`#EF4444`).
- **Architectural Minimal**: Pure Monochrome White (`#FFFFFF`), Charcoal Black (`#0F172A`), Hairline Slate (`#E2E8F0`).
- **Price Drop Alert**: Amber Rust (`#78350F`), Flame Red (`#DC2626`), Canary Yellow (`#FBBF24`).

---

# 05. Image Composition & Photo Intelligence

## Photo Category Assignment
- **Exterior Facade**: Default choice for Hero Image in Property Listings & Just Listed templates.
- **Living Room / Kitchen**: Secondary supporting photos or hero choice for interior showcases.
- **Pool / View / Waterfront**: Featured inset photo for lifestyle & amenity templates.
- **Floor Plan**: Inset diagram graphic for new construction & investment templates.

---

# 06. Social Media Platform Adaptation Rules

- **Instagram Square (1:1 / 1080x1080)**: Centered vertical stack, high aesthetic polish.
- **Instagram Portrait (4:5 / 1080x1350)**: Extended vertical photo area for interior features.
- **Instagram Story (9:16 / 1080x1920)**: Vertical orientation. Place key titles and CTA in middle safe zone (avoiding top IG header & bottom swipe bar).
- **Facebook / LinkedIn (1.91:1 / 1200x630)**: Horizontal orientation. Side-by-side split layout (Left photo, Right specs & CTA).

---

# 07. US Real Estate Creative Direction & Compliance

- **Brokerage Logo & License #**: Always present in footer bar or top brand lock area.
- **MLS Data Integrity**: Never alter or hallucinate prices, square footage, or room counts.
- **Open House / Event Formatting**: Clear event date, time window, and map location pin.

---

# 08. Design Anti-Patterns (Strict Rules)

1. ❌ **No Dashboard UI Bleed**: Never place gray dashboard widgets or data tables inside a marketing creative.
2. ❌ **No Squished Typography**: Never distort font aspect ratios or use raw unformatted text blocks.
3. ❌ **No Repetitive Card Layouts**: Every template family must have a distinct composition grid.
4. ❌ **No Un-Scrimmed Overlays**: Never place light text directly over light photos without a gradient scrim.

---

# 09. Template System & Layer Data Model

Designs are stored as editable structured JSON:
```json
{
  "id": "template_id",
  "name": "Template Name",
  "background": { "type": "color|gradient|image", "value": "#0F172A" },
  "layers": [
    { "id": "layer_1", "type": "image|text|badge|shape", "x": 60, "y": 60, "width": 960, "height": 80, "style": {} }
  ]
}
```
