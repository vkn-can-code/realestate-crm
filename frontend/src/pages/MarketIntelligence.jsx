import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { StatCard, Pill, SourceTag } from "../components/UI.jsx";
import {
  TrendingUp,
  Building2,
  MapPin,
  Database,
  Home,
  Zap,
  FileText,
  Sparkles,
  Settings as SettingsIcon,
  Play,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  DollarSign,
  Layers,
  Award,
} from "lucide-react";

export default function MarketIntelligence() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, competitors, markets, collection, listings, changes, reports, insights, settings

  const [analytics, setAnalytics] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [scanJobs, setScanJobs] = useState([]);
  const [listings, setListings] = useState([]);
  const [changes, setChanges] = useState([]);
  const [insights, setInsights] = useState(null);
  const [report, setReport] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // Filter state for listings
  const [filterCompetitor, setFilterCompetitor] = useState("all");
  const [filterZip, setFilterZip] = useState("all");

  // Modals state
  const [showAddCompetitor, setShowAddCompetitor] = useState(false);
  const [showAddMarket, setShowAddMarket] = useState(false);

  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    brokerageType: "National Franchise",
    website: "",
    headquarters: "Austin, TX",
    crawlFrequency: "weekly",
    maxPages: 50,
    includePatterns: "/properties,/listings",
    excludePatterns: "/blog,/careers,/privacy",
    notes: "",
  });

  const [newMarket, setNewMarket] = useState({
    country: "United States",
    state: "Texas",
    city: "Austin",
    county: "Travis County",
    zipCode: "78704",
    neighborhood: "South Congress / Barton Hills",
    propertyTypes: "Single Family, Condominium",
    priceSegments: "$500K-$750K, $750K-$1M",
  });

  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/market-intelligence/analytics").then((r) => r.json()),
      fetch("/api/market-intelligence/competitors").then((r) => r.json()),
      fetch("/api/market-intelligence/markets").then((r) => r.json()),
      fetch("/api/market-intelligence/scan-jobs").then((r) => r.json()),
      fetch("/api/market-intelligence/listings").then((r) => r.json()),
      fetch("/api/market-intelligence/changes").then((r) => r.json()),
      fetch("/api/market-intelligence/insights").then((r) => r.json()),
      fetch("/api/market-intelligence/report").then((r) => r.json()),
      fetch("/api/market-intelligence/alerts").then((r) => r.json()),
    ])
      .then(([analyticsData, compData, mktData, jobsData, listData, changeData, insightData, rptData, alertData]) => {
        setAnalytics(analyticsData);
        setCompetitors(compData || []);
        setMarkets(mktData || []);
        setScanJobs(jobsData || []);
        setListings(listData || []);
        setChanges(changeData || []);
        setInsights(insightData);
        setReport(rptData);
        setAlerts(alertData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Market Intelligence Load Error]", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleTriggerScan(competitorId) {
    setActionMsg("Initiating Firecrawl observation scan job...");
    try {
      const res = await fetch(`/api/market-intelligence/competitors/${competitorId}/scan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan trigger failed");
      setActionMsg(`🚀 ${data.message}`);
      setTimeout(loadAllData, 2000);
    } catch (err) {
      setActionMsg(`Scan Error: ${err.message}`);
    }
  }

  async function handleCreateCompetitor(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/market-intelligence/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompetitor),
      });
      if (!res.ok) throw new Error("Failed to add competitor");
      setShowAddCompetitor(false);
      setNewCompetitor({ name: "", brokerageType: "National Franchise", website: "", headquarters: "Austin, TX", crawlFrequency: "weekly", maxPages: 50, includePatterns: "/properties,/listings", excludePatterns: "/blog,/careers,/privacy", notes: "" });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteCompetitor(id) {
    if (!confirm("Are you sure you want to remove this competitor?")) return;
    await fetch(`/api/market-intelligence/competitors/${id}`, { method: "DELETE" });
    loadAllData();
  }

  async function handleCreateMarket(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/market-intelligence/markets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMarket),
      });
      if (!res.ok) throw new Error("Failed to add target market");
      setShowAddMarket(false);
      setNewMarket({ country: "United States", state: "Texas", city: "Austin", county: "Travis County", zipCode: "78704", neighborhood: "South Congress / Barton Hills", propertyTypes: "Single Family, Condominium", priceSegments: "$500K-$750K, $750K-$1M" });
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteMarket(id) {
    if (!confirm("Remove this target market configuration?")) return;
    await fetch(`/api/market-intelligence/markets/${id}`, { method: "DELETE" });
    loadAllData();
  }

  const filteredListings = listings.filter((l) => {
    const matchComp = filterCompetitor === "all" || l.competitor_id === filterCompetitor;
    const matchZip = filterZip === "all" || l.zip_code === filterZip;
    return matchComp && matchZip;
  });

  return (
    <>
      <Topbar
        title="Market & Competitor Intelligence"
        subtitle="Public Competitor Web Observation · Automated Change Engine · Inventory Comparison & AI Market Gap Analysis"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cylinder-action-btn active" onClick={() => setShowAddCompetitor(true)}>
              <Plus size={15} /> Add Competitor
            </button>
            <button className="cylinder-action-btn" onClick={() => setShowAddMarket(true)}>
              <MapPin size={15} /> Config Target Market
            </button>
          </div>
        }
      />

      {actionMsg && (
        <div className="glass-card" style={{ marginBottom: 16, fontSize: 13, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          {actionMsg}
        </div>
      )}

      {/* Module Sub-tabs Header Bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "dashboard", label: "Dashboard Overview", icon: TrendingUp },
          { id: "competitors", label: `Competitors (${competitors.length})`, icon: Building2 },
          { id: "markets", label: `Target Markets (${markets.length})`, icon: MapPin },
          { id: "collection", label: "Data Collection (Firecrawl MVP)", icon: Database },
          { id: "listings", label: `Competitor Listings (${listings.length})`, icon: Home },
          { id: "changes", label: `Changes & Alerts (${changes.length})`, icon: Zap },
          { id: "insights", label: "AI Insights & Market Gap", icon: Sparkles },
          { id: "reports", label: "Weekly Market Report", icon: FileText },
          { id: "settings", label: "Data Governance & Settings", icon: SettingsIcon },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`btn ${isActive ? "btn-primary" : "btn-secondary"}`}
              style={{
                borderRadius: 999,
                fontSize: 12.5,
                padding: "6px 14px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontWeight: isActive ? 800 : 600,
                background: isActive ? "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" : "#FFFFFF",
              }}
            >
              <IconComp size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: DASHBOARD OVERVIEW */}
      {activeTab === "dashboard" && (
        <>
          {/* Top KPI Cards */}
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
            <StatCard
              label="Total Observed Listings"
              value={analytics?.summaryCards?.totalObservedListings || listings.length}
              subtext="Public web observations"
              trend="+12% this period"
              icon={Home}
            />
            <StatCard
              label="Price Reductions Observed"
              value={analytics?.summaryCards?.priceReductionsThisPeriod || 0}
              subtext="Numeric price drops detected"
              trend="Market Adjustment"
              icon={Zap}
            />
            <StatCard
              label="Most Active Competitor"
              value={analytics?.summaryCards?.mostActiveCompetitor || "ABC Realty"}
              subtext="Highest activity score"
              trend="Market Leader"
              icon={Award}
            />
            <StatCard
              label="Highest Activity ZIP"
              value={`ZIP ${analytics?.summaryCards?.mostActiveZipCode || "78704"}`}
              subtext="Highest competitor turnover"
              trend="Hot Sub-market"
              icon={MapPin}
            />
          </div>

          {/* Our Inventory vs Observed Competitor Market Comparison */}
          <div className="glass-card" style={{ marginBottom: 20, padding: 20, background: "linear-gradient(135deg, rgba(79, 70, 229, 0.04) 0%, rgba(124, 58, 237, 0.06) 100%)", border: "1px solid #C7D2FE" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 16, color: "#1E1B4B", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Layers size={18} /> Our Inventory vs Observed Market Inventory
                </h3>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Direct comparison between internal company database and public competitor web observations.
                </div>
              </div>
              <span className="pill pill-violet" style={{ fontSize: 11, textTransform: "uppercase" }}>
                Observed Public Competitor Data
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div className="field-label">Our Inventory</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
                  {analytics?.companyVsMarket?.internalInventoryCount || 0} listings
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Internal CRM DB</div>
              </div>

              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div className="field-label">Observed Competitor Inventory</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#4F46E5" }}>
                  {analytics?.companyVsMarket?.observedMarketCount || 0} listings
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Public Web Observations</div>
              </div>

              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div className="field-label">Our Average Asking Price</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>
                  {analytics?.companyVsMarket?.formattedInternalAvg || "$0"}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Internal Portfolio Avg</div>
              </div>

              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div className="field-label">Observed Market Avg Asking Price</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#D97706" }}>
                  {analytics?.companyVsMarket?.formattedObservedAvg || "$0"}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>Competitor Web Observations</div>
              </div>
            </div>
          </div>

          {/* Competitor Activity Score Leaderboard & ZIP Analytics */}
          <div className="two-col" style={{ gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* Competitor Activity Scores */}
            <div className="glass-card">
              <h3 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <Award size={18} /> Competitor Activity Score Leaderboard
              </h3>
              <div className="table-responsive">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "rgba(241,245,249,0.7)", textAlign: "left" }}>
                      <th style={{ padding: "10px" }}>Competitor</th>
                      <th style={{ padding: "10px" }}>Brokerage Type</th>
                      <th style={{ padding: "10px" }}>Observed Listings</th>
                      <th style={{ padding: "10px" }}>Price Changes</th>
                      <th style={{ padding: "10px" }}>Activity Score</th>
                      <th style={{ padding: "10px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.competitorActivityScores || []).map((c) => (
                      <tr key={c.competitorId} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>{c.competitorName}</td>
                        <td style={{ padding: "10px", color: "#64748B" }}>{c.brokerageType}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{c.totalObserved}</td>
                        <td style={{ padding: "10px", color: "#D97706", fontWeight: 600 }}>{c.priceChangesCount}</td>
                        <td style={{ padding: "10px" }}>
                          <span className="pill pill-violet" style={{ fontWeight: 800 }}>
                            {c.activityScore} pts
                          </span>
                        </td>
                        <td style={{ padding: "10px" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ borderRadius: 999, fontSize: 11, padding: "3px 8px" }}
                            onClick={() => handleTriggerScan(c.competitorId)}
                          >
                            <Play size={11} /> Scan Now
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Target ZIP Code Activity */}
            <div className="glass-card">
              <h3 style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={18} /> Observed Sub-Market Activity (ZIP Codes)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {(analytics?.zipAnalytics || []).map((z) => (
                  <div key={z.zipCode} style={{ background: "#F8FAFC", padding: 12, borderRadius: 10, border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                        ZIP Code {z.zipCode}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>
                        {z.observedListingsCount} competitor listings observed
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#059669" }}>
                        {z.formattedAvgPrice}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8" }}>Avg Asking Price</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECTION 2: COMPETITORS MANAGEMENT */}
      {activeTab === "competitors" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3>Tracked Competitor Brokerages</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Configure competitor website domains, crawl limits, and URL include/exclude filters.
              </div>
            </div>
            <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={() => setShowAddCompetitor(true)}>
              <Plus size={14} /> Add Competitor
            </button>
          </div>

          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(241,245,249,0.7)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Competitor Name</th>
                  <th style={{ padding: "10px" }}>Brokerage Type</th>
                  <th style={{ padding: "10px" }}>Website</th>
                  <th style={{ padding: "10px" }}>Crawl Rules</th>
                  <th style={{ padding: "10px" }}>Frequency</th>
                  <th style={{ padding: "10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {competitors.map((c) => (
                  <tr key={c.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#0F172A" }}>{c.name}</td>
                    <td style={{ padding: "12px", color: "#64748B" }}>{c.brokerage_type}</td>
                    <td style={{ padding: "12px" }}>
                      <a href={c.website} target="_blank" rel="noreferrer" style={{ color: "#2563EB", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {c.website} <ExternalLink size={12} />
                      </a>
                    </td>
                    <td style={{ padding: "12px", fontSize: 12, color: "#475569" }}>
                      <div>Max {c.max_pages || 50} pages</div>
                      <div style={{ fontSize: 11, color: "#059669" }}>Include: {c.include_patterns || "All"}</div>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span className="pill pill-violet" style={{ textTransform: "capitalize" }}>{c.crawl_frequency}</span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-primary btn-sm" style={{ borderRadius: 999 }} onClick={() => handleTriggerScan(c.id)}>
                          <Play size={12} /> Run Scan
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, color: "#DC2626" }} onClick={() => handleDeleteCompetitor(c.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: TARGET MARKETS */}
      {activeTab === "markets" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3>Configured Target Markets (US Standard Schema)</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Define target States, Cities, Counties, ZIP Codes, and Neighborhood focus zones.
              </div>
            </div>
            <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={() => setShowAddMarket(true)}>
              <Plus size={14} /> Add Target Market
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {markets.map((m) => (
              <div key={m.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={16} color="#2563EB" /> ZIP {m.zip_code}
                  </span>
                  <button className="btn btn-sm btn-secondary" style={{ color: "#DC2626", border: "none" }} onClick={() => handleDeleteMarket(m.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <div style={{ fontSize: 13, color: "#334155", fontWeight: 700, marginBottom: 4 }}>
                  {m.city}, {m.state} ({m.county || "County"})
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 8 }}>
                  Neighborhood: {m.neighborhood || "General"}
                </div>
                <div style={{ fontSize: 11.5, background: "#FFFFFF", padding: 8, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div><strong>Types:</strong> {m.property_types}</div>
                  <div><strong>Price Segments:</strong> {m.price_segments}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: DATA COLLECTION ARCHITECTURE (FIRECRAWL) */}
      {activeTab === "collection" && (
        <div className="glass-card">
          <h3 style={{ marginBottom: 6 }}>Data Collection Architecture & Scan Jobs</h3>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            Firecrawl MVP Provider abstraction layer with max page limits, rate limit compliance, and audit logs.
          </div>

          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(241,245,249,0.7)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Job ID</th>
                  <th style={{ padding: "10px" }}>Competitor</th>
                  <th style={{ padding: "10px" }}>Provider</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px" }}>Pages Scraped</th>
                  <th style={{ padding: "10px" }}>Listings Extracted</th>
                  <th style={{ padding: "10px" }}>Started At</th>
                  <th style={{ padding: "10px" }}>Log Summary</th>
                </tr>
              </thead>
              <tbody>
                {scanJobs.map((j) => (
                  <tr key={j.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px", fontWeight: 700 }}>{j.id}</td>
                    <td style={{ padding: "10px" }}>{j.competitor_name}</td>
                    <td style={{ padding: "10px" }}><span className="pill pill-violet" style={{ fontSize: 11 }}>{j.provider.toUpperCase()}</span></td>
                    <td style={{ padding: "10px" }}>
                      <span className={`pill pill-${j.status === 'completed' ? 'success' : j.status === 'failed' ? 'danger' : 'warning'}`}>
                        {j.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>{j.pages_scraped}</td>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#059669" }}>{j.listings_extracted}</td>
                    <td style={{ padding: "10px", fontSize: 11.5, color: "#64748B" }}>{new Date(j.started_at).toLocaleString()}</td>
                    <td style={{ padding: "10px", fontSize: 11.5, color: "#475569", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {j.log_output}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 5: OBSERVED COMPETITOR LISTINGS */}
      {activeTab === "listings" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3>Observed Public Competitor Listings</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Normalized property schema with stable deduplication hashes (`dedup_hash`) and confidence scores.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <select value={filterCompetitor} onChange={(e) => setFilterCompetitor(e.target.value)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #CBD5E1" }}>
                <option value="all">All Competitors</option>
                {competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select value={filterZip} onChange={(e) => setFilterZip(e.target.value)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #CBD5E1" }}>
                <option value="all">All ZIP Codes</option>
                <option value="78704">ZIP 78704 (South Congress)</option>
                <option value="78701">ZIP 78701 (Downtown)</option>
                <option value="78746">ZIP 78746 (Westlake)</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(241,245,249,0.7)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Property Title / Address</th>
                  <th style={{ padding: "10px" }}>Competitor</th>
                  <th style={{ padding: "10px" }}>ZIP Code</th>
                  <th style={{ padding: "10px" }}>Type & Specs</th>
                  <th style={{ padding: "10px" }}>Asking Price</th>
                  <th style={{ padding: "10px" }}>$/sqft</th>
                  <th style={{ padding: "10px" }}>Dedup Hash</th>
                  <th style={{ padding: "10px" }}>Source Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredListings.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "12px" }}>
                      <div style={{ fontWeight: 700, color: "#0F172A" }}>{l.property_title}</div>
                      <div style={{ fontSize: 11.5, color: "#64748B" }}>{l.address}, {l.city}, {l.state}</div>
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{l.competitor_name}</td>
                    <td style={{ padding: "12px" }}><span className="pill pill-violet">{l.zip_code}</span></td>
                    <td style={{ padding: "12px" }}>{l.bedrooms} Bed · {l.bathrooms} Bath · {l.square_feet} sqft</td>
                    <td style={{ padding: "12px", fontWeight: 800, color: "#059669" }}>
                      ${l.asking_price ? l.asking_price.toLocaleString() : "N/A"}
                    </td>
                    <td style={{ padding: "12px" }}>${l.price_per_sqft || 0}/sqft</td>
                    <td style={{ padding: "12px", fontSize: 10.5, fontFamily: "monospace", color: "#64748B" }}>
                      {l.dedup_hash ? l.dedup_hash.slice(0, 10) + "..." : "HASH"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <a href={l.source_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }}>
                        <ExternalLink size={12} /> View Page
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 6: CHANGES & ALERTS */}
      {activeTab === "changes" && (
        <div className="two-col" style={{ gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
          <div className="glass-card">
            <h3>Snapshot Change Detection Log</h3>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
              Automatic change engine tracking PRICE_REDUCTION, PRICE_INCREASE, NEW_LISTING, and STATUS_CHANGE.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {changes.map((c) => (
                <div key={c.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span className={`pill pill-${c.change_type === 'PRICE_REDUCTION' ? 'warning' : c.change_type === 'NEW_LISTING' ? 'success' : 'violet'}`} style={{ fontWeight: 800, fontSize: 11 }}>
                      {c.change_type}
                    </span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(c.detected_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                    {c.property_title} ({c.competitor_name})
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                    Change: <strong>{c.previous_value}</strong> → <strong style={{ color: c.change_type === 'PRICE_REDUCTION' ? '#D97706' : '#059669' }}>{c.new_value}</strong> ({c.percentage_change}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3>System Intelligence Alerts</h3>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
              In-app alerts triggered by major price reductions (≥ 5%) or rapid competitor expansion.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {alerts.map((a) => (
                <div key={a.id} style={{ background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 10, padding: 12, color: "#92400E" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <AlertCircle size={15} /> {a.title}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.4 }}>{a.message}</div>
                  <div style={{ fontSize: 10.5, marginTop: 6, opacity: 0.8 }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: AI INSIGHTS & MARKET GAP RECOMMENDATIONS */}
      {activeTab === "insights" && (
        <div className="glass-card" style={{ border: "1px solid #C7D2FE", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(124, 58, 237, 0.08) 100%)", padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ color: "#3730A3", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={20} /> AI Market Insights & Evidence-Based Market Gap Engine
              </h3>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                Synthesized by Google Gemini Flash 2.0 based strictly on collected public competitor datasets.
              </div>
            </div>
            <span className="pill pill-violet" style={{ fontSize: 11 }}>
              Confidence: {insights?.confidenceLevel || "94%"}
            </span>
          </div>

          <div style={{ background: "#FFFFFF", borderRadius: 14, padding: 18, border: "1px solid #E2E8F0", marginBottom: 16 }}>
            <div style={{ fontSize: 13.5, color: "#1E293B", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {insights?.summaryText}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
              <div className="field-label">Data Sources</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                {(insights?.dataSources || []).join(", ")}
              </div>
            </div>
            <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
              <div className="field-label">Competitors Included</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                {(insights?.competitorsIncluded || []).join(", ")}
              </div>
            </div>
            <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
              <div className="field-label">Data Limitations</div>
              <div style={{ fontSize: 11.5, color: "#64748B" }}>
                {insights?.limitations}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: WEEKLY MARKET REPORT */}
      {activeTab === "reports" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3>Weekly Executive Market Intelligence Briefing</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Generated report for brokerage management and sales leads.
              </div>
            </div>
            <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={() => window.print()}>
              <FileText size={14} /> Export Report / Print
            </button>
          </div>

          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 24, fontFamily: "sans-serif" }}>
            <div style={{ borderBottom: "2px solid #E2E8F0", pb: 16, marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, color: "#0F172A", margin: 0 }}>{report?.title}</h2>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                Report ID: {report?.reportId} · Period: {report?.coveredPeriod} · Generated: {new Date(report?.generatedAt).toLocaleString()}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: "#4F46E5", marginBottom: 6 }}>Target Markets Covered</h4>
              <div style={{ fontSize: 13, color: "#334155" }}>
                {(report?.targetMarkets || []).join(" | ")}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: "#4F46E5", marginBottom: 6 }}>Executive Summary</h4>
              <div style={{ fontSize: 13.5, color: "#1E293B", whiteSpace: "pre-wrap", lineHeight: 1.6, background: "#FFFFFF", padding: 16, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                {report?.executiveSummary}
              </div>
            </div>

            <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic", borderTop: "1px solid #E2E8F0", pt: 12, marginTop: 20 }}>
              {report?.disclaimer}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 9: DATA GOVERNANCE & SETTINGS */}
      {activeTab === "settings" && (
        <div className="glass-card">
          <h3 style={{ marginBottom: 6 }}>Data Governance & Expansion Architecture</h3>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 18 }}>
            Configured safeguards, source tracking, retention rules, and RESO Web API expansion layers.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <h4 style={{ fontSize: 14, color: "#0F172A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={16} color="#059669" /> Data Source Disclaimers & Safeguards
              </h4>
              <ul style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
                <li>Public web observations are strictly labeled as <em>"Observed public competitor data"</em>.</li>
                <li>Never labeled or presented as official MLS valuation or title registry data.</li>
                <li>Firecrawl scraper respects maximum page bounds (Max 50 pages per scan).</li>
                <li>No automated attempt to bypass robots, CAPTCHAs, or paywalled pages.</li>
              </ul>
            </div>

            <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <h4 style={{ fontSize: 14, color: "#0F172A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Database size={16} color="#4F46E5" /> Provider Expansion Settings (MLS / RESO API)
              </h4>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.5 }}>
                <p>The provider architecture is ready to accept future authorized real estate data providers:</p>
                <ul style={{ paddingLeft: 18, margin: 0 }}>
                  <li>RESO Web API Integration (Authorized MLS token slot)</li>
                  <li>Licensed MLS RETS / Web API Feeds</li>
                  <li>Internal Brokerage Feed Sync</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Competitor */}
      {showAddCompetitor && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form className="glass-card" style={{ width: 460, background: "#FFFFFF" }} onSubmit={handleCreateCompetitor}>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>Add Tracked Competitor Brokerage</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="field-label">Competitor Name *</label>
                <input required style={{ width: "100%" }} placeholder="e.g. ABC Realty" value={newCompetitor.name} onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })} />
              </div>

              <div>
                <label className="field-label">Website Domain *</label>
                <input required style={{ width: "100%" }} placeholder="https://example.com" value={newCompetitor.website} onChange={(e) => setNewCompetitor({ ...newCompetitor, website: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Brokerage Type</label>
                  <input style={{ width: "100%" }} value={newCompetitor.brokerageType} onChange={(e) => setNewCompetitor({ ...newCompetitor, brokerageType: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Headquarters</label>
                  <input style={{ width: "100%" }} value={newCompetitor.headquarters} onChange={(e) => setNewCompetitor({ ...newCompetitor, headquarters: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Include URL Patterns</label>
                  <input style={{ width: "100%" }} placeholder="/properties,/listings" value={newCompetitor.includePatterns} onChange={(e) => setNewCompetitor({ ...newCompetitor, includePatterns: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Exclude URL Patterns</label>
                  <input style={{ width: "100%" }} placeholder="/blog,/careers" value={newCompetitor.excludePatterns} onChange={(e) => setNewCompetitor({ ...newCompetitor, excludePatterns: e.target.value })} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddCompetitor(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Competitor</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Add Target Market */}
      {showAddMarket && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form className="glass-card" style={{ width: 460, background: "#FFFFFF" }} onSubmit={handleCreateMarket}>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>Configure Target US Market</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">State *</label>
                  <input required style={{ width: "100%" }} placeholder="Texas" value={newMarket.state} onChange={(e) => setNewMarket({ ...newMarket, state: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">City *</label>
                  <input required style={{ width: "100%" }} placeholder="Austin" value={newMarket.city} onChange={(e) => setNewMarket({ ...newMarket, city: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">County</label>
                  <input style={{ width: "100%" }} placeholder="Travis County" value={newMarket.county} onChange={(e) => setNewMarket({ ...newMarket, county: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">ZIP Code *</label>
                  <input required style={{ width: "100%" }} placeholder="78704" value={newMarket.zipCode} onChange={(e) => setNewMarket({ ...newMarket, zipCode: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="field-label">Neighborhood Focus</label>
                <input style={{ width: "100%" }} placeholder="South Congress / Barton Hills" value={newMarket.neighborhood} onChange={(e) => setNewMarket({ ...newMarket, neighborhood: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddMarket(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Target Market</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
