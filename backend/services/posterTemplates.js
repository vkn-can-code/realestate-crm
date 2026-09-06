export const POSTER_TEMPLATES = [
  {
    id: "festive_gradient",
    name: "Festive & Luxury Gradient",
    description: "Rich violet & gold gradient theme ideal for luxury launches and festive offers.",
    category: "Luxury",
  },
  {
    id: "minimal_luxury",
    name: "Minimalist Executive",
    description: "Ultra-clean dark slate framing with elegant serif typography.",
    category: "Modern",
  },
  {
    id: "sold_banner",
    name: "Just Sold Celebration",
    description: "Bold crimson & gold ribbon banner showcasing closed deals & agency trust.",
    category: "Celebration",
  },
  {
    id: "open_house",
    name: "Open House & Site Visit",
    description: "Navy & emerald event badge highlighting weekend site visit schedules.",
    category: "Event",
  },
  {
    id: "price_drop",
    name: "Special Price Drop",
    description: "High-impact amber banner highlighting price cuts and urgent deals.",
    category: "Offer",
  },
];

export function renderPosterHtml({
  templateId = "festive_gradient",
  title = "Grand Luxury Property",
  price = "₹1.25 Crore",
  bhk = "4 BHK",
  area = "2800 sqft",
  location = "Kakkanad, Kochi",
  type = "Villa",
  agentName = "Adwayth VS",
  agentPhone = "+91 9633541720",
  agencyName = "RealtyPulse Real Estate",
  agencyLogo = "",
  bgImageUrl = "",
  primaryColor = "#3B82F6",
  fontFamily = "'Plus Jakarta Sans', sans-serif",
  customBadgeText = "",
}) {
  const bgImg = bgImageUrl || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop";

  if (templateId === "minimal_luxury") {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Plus+Jakarta+Sans:wght@500;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1350px;
    background: #0F172A;
    font-family: ${fontFamily};
    color: #FFFFFF;
    position: relative;
    overflow: hidden;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 1080px; height: 1350px;
    object-fit: cover;
    opacity: 0.65;
  }
  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.85) 65%, #0F172A 100%);
  }
  .brand-header {
    position: absolute;
    top: 50px; left: 60px; right: 60px;
    display: flex; justify-content: space-between; align-items: center;
    z-index: 10;
  }
  .agency-title { font-family: 'Cinzel', serif; font-size: 32px; font-weight: 800; letter-spacing: 2px; color: #F8FAFC; }
  .badge { background: #D97706; color: #FFF; padding: 10px 24px; border-radius: 30px; font-weight: 800; font-size: 18px; text-transform: uppercase; }
  
  .content-box {
    position: absolute;
    bottom: 60px; left: 60px; right: 60px;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(30px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 32px;
    padding: 48px;
    z-index: 10;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  }
  .prop-type { font-size: 20px; text-transform: uppercase; letter-spacing: 3px; color: #94A3B8; font-weight: 700; }
  .prop-title { font-family: 'Cinzel', serif; font-size: 52px; font-weight: 800; margin: 12px 0 20px; color: #FFFFFF; line-height: 1.15; }
  .specs-row { display: flex; gap: 20px; margin-bottom: 28px; }
  .spec-chip { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 12px 24px; border-radius: 14px; font-size: 22px; font-weight: 700; }
  .price-tag { font-size: 56px; font-weight: 800; color: #F59E0B; margin-bottom: 24px; }
  .footer-bar { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 24px; }
  .agent-info { font-size: 22px; font-weight: 700; }
  .phone-btn { background: #3B82F6; color: #FFF; padding: 14px 32px; border-radius: 16px; font-size: 22px; font-weight: 800; }
</style>
</head>
<body>
  <img class="bg-image" src="${bgImg}" />
  <div class="overlay"></div>
  <div class="brand-header">
    <div className="agency-title">${agencyName}</div>
    <div class="badge">${customBadgeText || "EXCLUSIVE LUXURY"}</div>
  </div>
  <div class="content-box">
    <div class="prop-type">${type} · ${location}</div>
    <div class="prop-title">${title}</div>
    <div class="specs-row">
      <div class="spec-chip">🛏️ ${bhk}</div>
      <div class="spec-chip">📐 ${area}</div>
      <div class="spec-chip">📍 ${location}</div>
    </div>
    <div class="price-tag">${price}</div>
    <div class="footer-bar">
      <div class="agent-info">Agent: ${agentName}</div>
      <div class="phone-btn">📞 ${agentPhone}</div>
    </div>
  </div>
</body>
</html>`;
  }

  if (templateId === "sold_banner") {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1350px;
    background: #020617;
    font-family: ${fontFamily};
    color: #FFFFFF;
    position: relative;
    overflow: hidden;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 1080px; height: 1350px;
    object-fit: cover;
    filter: contrast(1.1) brightness(0.85);
  }
  .sold-ribbon {
    position: absolute;
    top: 80px; right: -80px;
    width: 450px;
    background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
    color: #FFFFFF;
    font-size: 36px;
    font-weight: 900;
    text-align: center;
    padding: 16px 0;
    transform: rotate(45deg);
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    letter-spacing: 4px;
    z-index: 20;
  }
  .header-bar {
    position: absolute;
    top: 50px; left: 60px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(20px);
    padding: 16px 32px;
    border-radius: 20px;
    font-size: 26px;
    font-weight: 800;
    border: 1px solid rgba(255,255,255,0.2);
  }
  .bottom-card {
    position: absolute;
    bottom: 50px; left: 50px; right: 50px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(30px);
    border-radius: 32px;
    padding: 44px;
    border: 2px solid #DC2626;
    box-shadow: 0 20px 60px rgba(220,38,38,0.3);
  }
  .title { font-size: 46px; font-weight: 800; margin-bottom: 12px; }
  .sub { font-size: 24px; color: #94A3B8; margin-bottom: 24px; }
  .price { font-size: 52px; font-weight: 900; color: #34D399; margin-bottom: 20px; }
  .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px; }
</style>
</head>
<body>
  <img class="bg-image" src="${bgImg}" />
  <div class="sold-ribbon">JUST SOLD!</div>
  <div class="header-bar">${agencyName}</div>
  <div class="bottom-card">
    <div class="title">${title}</div>
    <div class="sub">${location} · ${bhk} ${type}</div>
    <div class="price">Closed at ${price}</div>
    <div class="footer">
      <div style="font-size: 22px; font-weight: 700;">Representative: ${agentName}</div>
      <div style="font-size: 24px; font-weight: 800; color: #60A5FA;">📞 ${agentPhone}</div>
    </div>
  </div>
</body>
</html>`;
  }

  if (templateId === "open_house") {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1350px;
    background: #0F172A;
    font-family: ${fontFamily};
    color: #FFFFFF;
    position: relative;
    overflow: hidden;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 1080px; height: 1350px;
    object-fit: cover;
  }
  .top-banner {
    position: absolute;
    top: 40px; left: 40px; right: 40px;
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    padding: 24px;
    border-radius: 24px;
    text-align: center;
    font-size: 32px;
    font-weight: 900;
    letter-spacing: 2px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  .card {
    position: absolute;
    bottom: 50px; left: 40px; right: 40px;
    background: rgba(15, 23, 42, 0.88);
    backdrop-filter: blur(24px);
    border-radius: 32px;
    padding: 44px;
    border: 1px solid rgba(255,255,255,0.2);
  }
  .date-badge { background: #3B82F6; color: #FFF; padding: 8px 20px; border-radius: 12px; font-weight: 800; font-size: 20px; display: inline-block; margin-bottom: 16px; }
  .title { font-size: 48px; font-weight: 800; margin-bottom: 12px; }
  .loc { font-size: 24px; color: #CBD5E1; margin-bottom: 20px; }
  .price { font-size: 44px; font-weight: 900; color: #10B981; margin-bottom: 24px; }
  .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px; }
</style>
</head>
<body>
  <img class="bg-image" src="${bgImg}" />
  <div class="top-banner">🏡 OPEN HOUSE & PRIVATE SITE VISIT</div>
  <div class="card">
    <div class="date-badge">THIS SATURDAY & SUNDAY (10 AM - 5 PM)</div>
    <div class="title">${title}</div>
    <div class="loc">📍 ${location} (${bhk} ${type} · ${area})</div>
    <div class="price">${price}</div>
    <div class="footer">
      <div style="font-size: 22px; font-weight: 700;">Host: ${agentName} (${agencyName})</div>
      <div style="font-size: 24px; font-weight: 800; color: #34D399;">📞 ${agentPhone}</div>
    </div>
  </div>
</body>
</html>`;
  }

  if (templateId === "price_drop") {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1350px;
    background: #020617;
    font-family: ${fontFamily};
    color: #FFFFFF;
    position: relative;
    overflow: hidden;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 1080px; height: 1350px;
    object-fit: cover;
  }
  .deal-tag {
    position: absolute;
    top: 60px; left: 60px;
    background: #D97706;
    color: #FFFFFF;
    font-size: 28px;
    font-weight: 900;
    padding: 16px 36px;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  }
  .card {
    position: absolute;
    bottom: 50px; left: 50px; right: 50px;
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(24px);
    border-radius: 32px;
    padding: 44px;
    border: 2px solid #D97706;
  }
  .title { font-size: 46px; font-weight: 800; margin-bottom: 12px; }
  .price-highlight { font-size: 56px; font-weight: 900; color: #F59E0B; margin: 16px 0; }
  .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px; }
</style>
</head>
<body>
  <img class="bg-image" src="${bgImg}" />
  <div class="deal-tag">🔥 SPECIAL PRICE DROP / URGENT DEAL</div>
  <div class="card">
    <div class="title">${title}</div>
    <div style="font-size: 22px; color: #94A3B8;">📍 ${location} · ${bhk} ${type}</div>
    <div class="price-highlight">Now ${price}</div>
    <div class="footer">
      <div style="font-size: 22px; font-weight: 700;">${agencyName} · Agent ${agentName}</div>
      <div style="font-size: 24px; font-weight: 800; color: #F59E0B;">📞 ${agentPhone}</div>
    </div>
  </div>
</body>
</html>`;
  }

  // DEFAULT TEMPLATE: festive_gradient
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1080px;
    height: 1350px;
    background: #1F1147;
    font-family: ${fontFamily};
    color: #FFFFFF;
    position: relative;
    overflow: hidden;
  }
  .bg-image {
    position: absolute;
    top: 0; left: 0; width: 1080px; height: 1350px;
    object-fit: cover;
    opacity: 0.75;
  }
  .gradient-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(31,17,71,0.3) 0%, rgba(31,17,71,0.8) 60%, #1F1147 100%);
  }
  .gold-border {
    position: absolute;
    inset: 30px;
    border: 2px solid rgba(232, 163, 61, 0.4);
    border-radius: 28px;
    pointer-events: none;
    z-index: 5;
  }
  .top-brand {
    position: absolute;
    top: 60px; left: 70px; right: 70px;
    display: flex; justify-content: space-between; align-items: center;
    z-index: 10;
  }
  .logo-text { font-family: 'Cinzel', serif; font-size: 34px; font-weight: 900; color: #FFF; letter-spacing: 2px; }
  .badge-tag { background: linear-gradient(135deg, #6C4CE0, #4B2FB0); color: #FFF; padding: 10px 24px; border-radius: 20px; font-size: 16px; font-weight: 800; }

  .hero-card {
    position: absolute;
    bottom: 70px; left: 70px; right: 70px;
    background: rgba(31, 17, 71, 0.75);
    backdrop-filter: blur(28px);
    border: 1px solid rgba(198, 184, 250, 0.3);
    border-radius: 32px;
    padding: 46px;
    z-index: 10;
  }
  .prop-subtitle { font-size: 20px; color: #C6B8FA; text-transform: uppercase; font-weight: 700; letter-spacing: 2px; }
  .prop-title { font-family: 'Cinzel', serif; font-size: 54px; font-weight: 900; margin: 12px 0 20px; color: #FFFFFF; line-height: 1.15; }
  .specs-pills { display: flex; gap: 16px; margin-bottom: 24px; }
  .pill-item { background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); padding: 10px 22px; border-radius: 14px; font-size: 20px; font-weight: 700; }
  .price-display { font-size: 56px; font-weight: 900; color: #E8A33D; margin-bottom: 24px; }
  .agent-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 24px; }
  .agent-name { font-size: 22px; font-weight: 700; color: #F6F4FF; }
  .call-btn { background: linear-gradient(135deg, #6C4CE0, #4B2FB0); color: #FFF; padding: 14px 32px; border-radius: 16px; font-size: 22px; font-weight: 800; box-shadow: 0 8px 24px rgba(108,76,224,0.4); }
</style>
</head>
<body>
  <img class="bg-image" src="${bgImg}" />
  <div class="gradient-overlay"></div>
  <div class="gold-border"></div>
  <div class="top-brand">
    <div class="logo-text">${agencyName}</div>
    <div class="badge-tag">EXCLUSIVELY LISTED</div>
  </div>
  <div class="hero-card">
    <div class="prop-subtitle">${type} · ${location}</div>
    <div class="prop-title">${title}</div>
    <div class="specs-pills">
      <div class="pill-item">🛏️ ${bhk}</div>
      <div class="pill-item">📐 ${area}</div>
      <div class="pill-item">📍 ${location}</div>
    </div>
    <div class="price-display">${price}</div>
    <div class="agent-footer">
      <div class="agent-name">Agent: ${agentName}</div>
      <div class="call-btn">📞 Call ${agentPhone}</div>
    </div>
  </div>
</body>
</html>`;
}
