import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { StatCard, Pill, SourceTag } from "../components/UI.jsx";
import {
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Mail,
  MessageSquare,
  Send,
  KanbanSquare,
  Award,
  BookOpen,
  Plus,
  Trash2,
  Play,
  Edit,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Filter,
  RefreshCw,
  Info,
  Check,
} from "lucide-react";

export default function AgentRecruitment() {
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard, campaigns, apollo, review, pipeline, drafts, conversations, kb

  const [analytics, setAnalytics] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [messages, setMessages] = useState([]);
  const [kb, setKb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  // Apollo Search State
  const [apolloQuery, setApolloQuery] = useState({
    campaignId: "all",
    title: "Real Estate Agent / Property Consultant / Realtor",
    location: "Kochi, Ernakulam, Kerala, India",
    keywords: "Residential & Commercial",
    targetCompanies: "Skyline Builders, Asset Homes, Puravankara",
    searchMode: "include_other_matching",
    searchLimit: 20,
  });
  const [apolloResults, setApolloResults] = useState([]);
  const [apolloStats, setApolloStats] = useState(null);
  const [apolloError, setApolloError] = useState(null);
  const [selectedApolloIds, setSelectedApolloIds] = useState([]);
  const [searchingApollo, setSearchingApollo] = useState(false);

  // Filters
  const [selectedCampaignId, setSelectedCampaignId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Real Progress Run Campaign Modal State
  const [runningCampaign, setRunningCampaign] = useState(null); // active campaign object
  const [runStep, setRunStep] = useState(0); // 0: Started, 1: Building Search, 2: Searching Apollo, 3: Normalizing, 4: Deduplicating, 5: Saving, 6: Completed
  const [runSummary, setRunSummary] = useState(null);

  // Campaign Modal State
  const [showAddCampaign, setShowAddCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "Kerala Real Estate Agent Recruitment – Kochi",
    targetRole: "Real Estate Agent / Property Consultant / Realtor",
    location: "Kochi, Ernakulam, Kerala, India",
    minExperienceYears: 3,
    specialization: "Residential & Commercial Real Estate",
    keywords: "Property Sales, Luxury, Residential",
    targetCompanies: "Skyline Builders, Asset Homes",
    searchMode: "include_other_matching",
    description: "Targeting experienced agents and property consultants in Kochi metropolitan area",
    preferredChannel: "email",
  });

  // Active Chat Simulator State
  const [chatProspectId, setChatProspectId] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);

  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/recruitment/analytics").then((r) => r.json()),
      fetch("/api/recruitment/campaigns").then((r) => r.json()),
      fetch("/api/recruitment/prospects").then((r) => r.json()),
      fetch("/api/recruitment/messages").then((r) => r.json()),
      fetch("/api/recruitment/kb").then((r) => r.json()),
    ])
      .then(([analyticsData, campData, prospectData, msgData, kbData]) => {
        setAnalytics(analyticsData);
        setCampaigns(campData || []);
        setProspects(prospectData || []);
        setMessages(msgData || []);
        setKb(kbData);
        if (prospectData?.length > 0 && !chatProspectId) {
          setChatProspectId(prospectData[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Recruitment Load Error]", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatProspectId) {
      fetch(`/api/recruitment/conversations/${chatProspectId}`)
        .then((r) => r.json())
        .then((data) => setChatMessages(data || []))
        .catch(() => {});
    }
  }, [chatProspectId]);

  // STEP 2 & 13: EXECUTE RUN CAMPAIGN WITH REAL PROGRESS FEEDBACK
  async function handleRunCampaign(campaign) {
    setRunningCampaign(campaign);
    setRunStep(1); // Building Search
    setRunSummary(null);

    await new Promise((r) => setTimeout(r, 600));
    setRunStep(2); // Searching Apollo

    await new Promise((r) => setTimeout(r, 800));
    setRunStep(3); // Processing & Normalizing

    try {
      const res = await fetch(`/api/recruitment/campaigns/${campaign.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchMode: campaign.search_mode || "include_other_matching",
          searchLimit: 20,
        }),
      });

      setRunStep(4); // Removing Duplicates
      await new Promise((r) => setTimeout(r, 500));

      setRunStep(5); // Saving Prospects
      await new Promise((r) => setTimeout(r, 400));

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Campaign execution failed");

      setRunSummary(data);
      setRunStep(6); // Completed
      loadAllData();
    } catch (err) {
      alert(`Execution Error: ${err.message}`);
      setRunningCampaign(null);
    }
  }

  // STEP 5: FUNCTIONAL APOLLO SEARCH
  async function handleApolloSearch(e) {
    if (e) e.preventDefault();
    setSearchingApollo(true);
    setApolloStats(null);
    setApolloError(null);
    try {
      const res = await fetch("/api/recruitment/apollo/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawTitles: apolloQuery.title,
          rawLocations: apolloQuery.location,
          qKeywords: apolloQuery.keywords,
          targetCompanies: (apolloQuery.targetCompanies || "").split(",").map((c) => c.trim()).filter(Boolean),
          searchMode: apolloQuery.searchMode,
          perPage: apolloQuery.searchLimit,
        }),
      });
      const data = await res.json();
      if (data.error && (!data.people || data.people.length === 0)) {
        setApolloError(data.error);
      }
      setApolloResults(data.people || []);
      setApolloStats({
        found: data.people?.length || 0,
        isSimulated: data.isSimulated,
        criteria: data.searchCriteriaUsed,
        error: data.error || null,
      });
    } catch (err) {
      setApolloError(`Search failed: ${err.message}`);
    } finally {
      setSearchingApollo(false);
    }
  }

  function handleResetFilters() {
    setApolloQuery({
      campaignId: "all",
      title: "Real Estate Agent / Property Consultant",
      location: "Kochi, Kerala, India",
      keywords: "Residential",
      targetCompanies: "",
      searchMode: "broad_talent_search",
      searchLimit: 20,
    });
    setApolloResults([]);
    setApolloStats(null);
  }

  async function handleImportApolloCandidates() {
    if (selectedApolloIds.length === 0) return alert("Select at least one candidate to import.");
    const targetCampId = apolloQuery.campaignId !== "all" ? apolloQuery.campaignId : campaigns[0]?.id;
    if (!targetCampId) return alert("Please create or select a Recruitment Campaign first.");

    const candidatesToImport = apolloResults.filter((p) => selectedApolloIds.includes(p.apolloId));

    try {
      const res = await fetch("/api/recruitment/apollo/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: targetCampId,
          selectedCandidates: candidatesToImport,
        }),
      });
      const data = await res.json();
      setActionMsg(`✅ ${data.message}`);
      setSelectedApolloIds([]);
      loadAllData();
    } catch (err) {
      alert(`Import Error: ${err.message}`);
    }
  }

  async function handleReviewProspect(prospectId, action, notes = "") {
    try {
      const res = await fetch(`/api/recruitment/prospects/${prospectId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      if (!res.ok) throw new Error("Review action failed");
      setActionMsg(`Updated prospect status to '${action.toUpperCase()}'`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleEnrichContact(prospectId) {
    setActionMsg("Executing controlled contact enrichment via Apollo...");
    try {
      const res = await fetch(`/api/recruitment/prospects/${prospectId}/enrich`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enrichment failed");
      setActionMsg(`✅ Enriched Contact: ${data.contact.email} (${data.contact.phone})`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAnalyzeMatch(prospectId) {
    setActionMsg("Evaluating AI candidate match score and recruitment angle...");
    try {
      const res = await fetch(`/api/recruitment/prospects/${prospectId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setActionMsg(`✨ AI Match Score: ${data.analysis.match_score}%`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleGenerateDraft(prospectId, channel = "email") {
    setActionMsg(`Generating personalized AI ${channel.toUpperCase()} outreach draft...`);
    try {
      const res = await fetch(`/api/recruitment/prospects/${prospectId}/draft-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft generation failed");
      setActionMsg(`📝 AI Draft Created for ${channel.toUpperCase()}`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApproveDraft(messageId) {
    try {
      const res = await fetch(`/api/recruitment/messages/${messageId}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Approve draft failed");
      setActionMsg("✅ Message Approved by Admin -> Status: READY_TO_SEND");
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSendMessage(messageId) {
    setActionMsg("Executing outreach message dispatch...");
    try {
      const res = await fetch(`/api/recruitment/messages/${messageId}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setActionMsg(`🚀 Outreach sent successfully to ${data.sentTo}`);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSendCandidateChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || !chatProspectId) return;

    const userText = chatInput;
    setChatInput("");

    try {
      const res = await fetch("/api/recruitment/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: chatProspectId,
          messageText: userText,
          channel: "email",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Chat failed");

      fetch(`/api/recruitment/conversations/${chatProspectId}`)
        .then((r) => r.json())
        .then((data) => setChatMessages(data || []));
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCreateCampaign(e) {
    e.preventDefault();
    try {
      const res = await fetch("/api/recruitment/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCampaign),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      setShowAddCampaign(false);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  }

  const pendingReviewCount = prospects.filter((p) => p.status === "DISCOVERED" || p.status === "PENDING_REVIEW").length;

  const filteredProspects = prospects.filter((p) => {
    const matchCamp = selectedCampaignId === "all" || p.campaign_id === selectedCampaignId;
    const matchStat = selectedStatus === "all" || p.status === selectedStatus;
    return matchCamp && matchStat;
  });

  const pipelineStages = [
    "DISCOVERED", "PENDING_REVIEW", "SHORTLISTED", "APPROVED", "CONTACT_READY",
    "MESSAGE_DRAFTED", "MESSAGE_APPROVED", "CONTACTED", "REPLIED", "INTERESTED",
    "INTERVIEW", "OFFER", "HIRED", "REJECTED", "DO_NOT_CONTACT"
  ];

  return (
    <>
      <Topbar
        title="Agent Recruitment AI"
        subtitle="Apollo Discovery Engine · Admin Approval Workflows · Gemini Match Analysis & Multi-Channel Outreach"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cylinder-action-btn active" onClick={() => setShowAddCampaign(true)}>
              <Plus size={15} /> New Campaign
            </button>
            <button className="cylinder-action-btn" onClick={() => { setActiveTab("apollo"); handleApolloSearch(); }}>
              <Search size={15} /> Search Apollo
            </button>
          </div>
        }
      />

      {actionMsg && (
        <div className="glass-card" style={{ marginBottom: 16, fontSize: 13, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          {actionMsg}
        </div>
      )}

      {/* Module Sub-tabs Bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "dashboard", label: "Dashboard & Funnel", icon: TrendingUp },
          { id: "campaigns", label: `Campaigns (${campaigns.length})`, icon: Users },
          { id: "apollo", label: "Apollo Search", icon: Search },
          { id: "review", label: `Prospect Review (${pendingReviewCount})`, icon: CheckCircle2, badge: pendingReviewCount },
          { id: "pipeline", label: "Pipeline Kanban", icon: KanbanSquare },
          { id: "drafts", label: `Outreach Drafts (${messages.length})`, icon: Mail },
          { id: "conversations", label: "Candidate AI Chat & Q&A", icon: MessageSquare },
          { id: "kb", label: "Recruitment KB", icon: BookOpen },
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
                background: isActive ? "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)" : "#FFFFFF",
              }}
            >
              <IconComp size={14} /> {tab.label}
              {tab.badge > 0 && (
                <span style={{ background: "#EF4444", color: "#FFF", fontSize: 10, padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: DASHBOARD & FUNNEL */}
      {activeTab === "dashboard" && (
        <>
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
            <StatCard label="Active Campaigns" value={analytics?.summaryCards?.activeCampaigns || campaigns.length} subtext="Active recruitment drives" trend="Live Drive" icon={Users} />
            <StatCard label="Profiles Found" value={analytics?.summaryCards?.profilesFound || prospects.length} subtext="Apollo & web discoveries" trend="Total Discovered" icon={Search} />
            <StatCard label="Approved Candidates" value={analytics?.summaryCards?.approved || 0} subtext="Passed admin review" trend="Admin Approved" icon={CheckCircle2} />
            <StatCard label="Hired Agents" value={analytics?.summaryCards?.hired || 0} subtext="Successfully onboarded" trend="Conversion Goal" icon={Award} />
          </div>

          <div className="glass-card" style={{ marginBottom: 20, padding: 20, background: "linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(79, 70, 229, 0.06) 100%)", border: "1px solid #BFDBFE" }}>
            <h3 style={{ fontSize: 16, color: "#1E3A8A", margin: 0, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={18} /> Candidate Recruitment Conversion Funnel
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, textAlign: "center" }}>
              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Discovered → Approved</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB", marginTop: 4 }}>
                  {analytics?.conversionFunnel?.discoveredToApproved || 0}%
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Admin Approval Rate</div>
              </div>

              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Approved → Contacted</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#4F46E5", marginTop: 4 }}>
                  {analytics?.conversionFunnel?.approvedToContacted || 0}%
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Enriched & Sent</div>
              </div>

              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Contacted → Replied</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706", marginTop: 4 }}>
                  {analytics?.conversionFunnel?.contactedToReplied || 0}%
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Response Engagement</div>
              </div>

              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Replied → Interview</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#7C3AED", marginTop: 4 }}>
                  {analytics?.conversionFunnel?.repliedToInterview || 0}%
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Interview Rate</div>
              </div>

              <div style={{ background: "#FFFFFF", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>Interview → Hired</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginTop: 4 }}>
                  {analytics?.conversionFunnel?.interviewToHired || 0}%
                </div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Close / Hired Rate</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECTION 2: RECRUITMENT CAMPAIGNS (STEP 2 & 10 IMPLEMENTATION) */}
      {activeTab === "campaigns" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3>Recruitment Campaigns & Execution Pipeline</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Configure campaigns, define target roles, and run automated Apollo discovery.
              </div>
            </div>
            <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={() => setShowAddCampaign(true)}>
              <Plus size={14} /> Create Campaign
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {campaigns.map((c) => (
              <div key={c.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{c.name}</span>
                    <span className="pill pill-success" style={{ marginLeft: 10, textTransform: "capitalize", fontSize: 11 }}>{c.status}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ borderRadius: 999, fontSize: 12, background: "linear-gradient(135deg, #059669 0%, #10B981 100%)" }} onClick={() => handleRunCampaign(c)}>
                      <Play size={13} /> Run Campaign
                    </button>
                    <button className="btn btn-secondary" style={{ borderRadius: 999, fontSize: 12 }} onClick={() => { setActiveTab("review"); setSelectedCampaignId(c.id); }}>
                      View Prospects
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12, marginBottom: 12, fontSize: 12.5, color: "#334155" }}>
                  <div><strong>Target Role:</strong> {c.target_role}</div>
                  <div><strong>Location:</strong> 📍 {c.location}</div>
                  <div><strong>Min Experience:</strong> {c.min_experience_years}+ Years</div>
                </div>

                {/* Execution Metrics (STEP 10) */}
                <div style={{ background: "#FFFFFF", padding: 12, borderRadius: 10, border: "1px solid #E2E8F0", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, fontSize: 12 }}>
                  <div>
                    <div className="field-label">Last Run</div>
                    <div style={{ fontWeight: 700, color: "#0F172A" }}>{c.last_run_at ? new Date(c.last_run_at).toLocaleString() : "Never"}</div>
                  </div>
                  <div>
                    <div className="field-label">Prospects Found</div>
                    <div style={{ fontWeight: 800, color: "#2563EB" }}>{c.prospects_found_count || 0}</div>
                  </div>
                  <div>
                    <div className="field-label">Imported</div>
                    <div style={{ fontWeight: 800, color: "#059669" }}>{c.prospects_imported_count || 0}</div>
                  </div>
                  <div>
                    <div className="field-label">Duplicates Skipped</div>
                    <div style={{ fontWeight: 800, color: "#D97706" }}>{c.duplicates_skipped_count || 0}</div>
                  </div>
                  <div>
                    <div className="field-label">Search Mode</div>
                    <div style={{ fontWeight: 700, color: "#4F46E5", textTransform: "capitalize" }}>{(c.search_mode || 'include_other_matching').replace(/_/g, ' ')}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: FUNCTIONAL APOLLO SEARCH PAGE (STEP 5 IMPLEMENTATION) */}
      {activeTab === "apollo" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h3>Apollo Candidate Search Engine</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Functional search interface with smart title expansion, location normalization, and search mode flexibility.
              </div>
            </div>
            <button className="btn btn-secondary" style={{ borderRadius: 999, fontSize: 12 }} onClick={handleResetFilters}>
              <RefreshCw size={13} /> Reset Filters
            </button>
          </div>

          <form onSubmit={handleApolloSearch} style={{ background: "#F8FAFC", padding: 16, borderRadius: 14, border: "1px solid #E2E8F0", marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="field-label">Campaign Link</label>
                <select value={apolloQuery.campaignId} onChange={(e) => setApolloQuery({ ...apolloQuery, campaignId: e.target.value })} style={{ width: "100%", padding: "6px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}>
                  <option value="all">Independent Search</option>
                  {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="field-label">Job Titles (Smart Variations Supported)</label>
                <input style={{ width: "100%" }} value={apolloQuery.title} onChange={(e) => setApolloQuery({ ...apolloQuery, title: e.target.value })} />
              </div>

              <div>
                <label className="field-label">Location (City, State, Country)</label>
                <input style={{ width: "100%" }} value={apolloQuery.location} onChange={(e) => setApolloQuery({ ...apolloQuery, location: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label className="field-label">Keywords</label>
                <input style={{ width: "100%" }} value={apolloQuery.keywords} onChange={(e) => setApolloQuery({ ...apolloQuery, keywords: e.target.value })} />
              </div>

              <div>
                <label className="field-label">Target Companies (Optional)</label>
                <input style={{ width: "100%" }} placeholder="Skyline Builders, Asset Homes" value={apolloQuery.targetCompanies} onChange={(e) => setApolloQuery({ ...apolloQuery, targetCompanies: e.target.value })} />
              </div>

              <div>
                <label className="field-label">Search Mode (STEP 4)</label>
                <select value={apolloQuery.searchMode} onChange={(e) => setApolloQuery({ ...apolloQuery, searchMode: e.target.value })} style={{ width: "100%", padding: "6px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}>
                  <option value="include_other_matching">Include Other Matching Companies</option>
                  <option value="broad_talent_search">Broad Talent Search (Highest Yield)</option>
                  <option value="target_brokerages_only">Target Brokerages Only</option>
                </select>
              </div>

              <div>
                <label className="field-label">Search Limit</label>
                <input type="number" style={{ width: "100%" }} value={apolloQuery.searchLimit} onChange={(e) => setApolloQuery({ ...apolloQuery, searchLimit: parseInt(e.target.value, 10) })} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 999, padding: "8px 20px" }}>
                {searchingApollo ? "Searching Apollo..." : "Search Apollo Candidates"}
              </button>
            </div>
          </form>

          {apolloError && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
              ⚠️ <strong>Search Note:</strong> {apolloError}. Showing simulated candidates for preview.
            </div>
          )}

          {apolloStats && (
            <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: "#1E40AF", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>Search Status:</strong> Found <strong>{apolloStats.found}</strong> candidate profiles in {apolloQuery.location}.
                {apolloStats.isSimulated && <span style={{ marginLeft: 8, background: "#FEF3C7", color: "#92400E", padding: "1px 8px", borderRadius: 999, fontSize: 11 }}>🔁 Simulated Preview</span>}
                {!apolloStats.isSimulated && <span style={{ marginLeft: 8, background: "#D1FAE5", color: "#065F46", padding: "1px 8px", borderRadius: 999, fontSize: 11 }}>✅ Live Results</span>}
              </div>
              <span className="pill pill-violet" style={{ fontSize: 11 }}>Mode: {apolloQuery.searchMode.replace(/_/g, ' ')}</span>
            </div>
          )}

          {apolloResults.length === 0 && apolloStats && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: 12, padding: 18, color: "#92400E", marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={16} /> No candidate profiles matched the current search filters.
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
                <strong>Suggestions to increase results:</strong>
                <ul style={{ paddingLeft: 20, margin: "4px 0 0 0" }}>
                  <li>Switch Search Mode to <strong>Broad Talent Search</strong> to remove company restrictions.</li>
                  <li>Expand location input (e.g. use state/country name like <em>"Kerala, India"</em>).</li>
                  <li>Add broader job title variations (e.g. <em>"Property Consultant / Realtor"</em>).</li>
                </ul>
              </div>
            </div>
          )}

          {apolloResults.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                  Discovered {apolloResults.length} Candidate Profiles
                </div>
                <button className="btn btn-primary" style={{ borderRadius: 999, fontSize: 12 }} onClick={handleImportApolloCandidates}>
                  Import Selected to DISCOVERED ({selectedApolloIds.length})
                </button>
              </div>

              <div className="table-responsive">
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "rgba(241,245,249,0.7)", textAlign: "left" }}>
                      <th style={{ padding: "10px", width: 40 }}>
                        <input
                          type="checkbox"
                          checked={selectedApolloIds.length === apolloResults.length && apolloResults.length > 0}
                          onChange={(e) => setSelectedApolloIds(e.target.checked ? apolloResults.map((p) => p.apolloId) : [])}
                        />
                      </th>
                      <th style={{ padding: "10px" }}>Candidate Name</th>
                      <th style={{ padding: "10px" }}>Job Title</th>
                      <th style={{ padding: "10px" }}>Company Brokerage</th>
                      <th style={{ padding: "10px" }}>Location</th>
                      <th style={{ padding: "10px" }}>Experience</th>
                      <th style={{ padding: "10px" }}>LinkedIn Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apolloResults.map((p) => (
                      <tr key={p.apolloId} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "10px" }}>
                          <input
                            type="checkbox"
                            checked={selectedApolloIds.includes(p.apolloId)}
                            onChange={(e) => setSelectedApolloIds(e.target.checked ? [...selectedApolloIds, p.apolloId] : selectedApolloIds.filter((id) => id !== p.apolloId))}
                          />
                        </td>
                        <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>{p.fullName}</td>
                        <td style={{ padding: "10px" }}>{p.jobTitle}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{p.companyName}</td>
                        <td style={{ padding: "10px" }}>{p.location}</td>
                        <td style={{ padding: "10px" }}>{p.experienceYears} Years</td>
                        <td style={{ padding: "10px" }}>
                          <a href={p.linkedinUrl} target="_blank" rel="noreferrer" style={{ color: "#2563EB", display: "inline-flex", alignItems: "center", gap: 4 }}>
                            Profile <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: PROSPECT REVIEW DASHBOARD (STEP 9 IMPLEMENTATION) */}
      {activeTab === "review" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3>Prospect Review ({pendingReviewCount})</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Admin review gate. Contact enrichment and outreach generation require explicit approval.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <select value={selectedCampaignId} onChange={(e) => setSelectedCampaignId(e.target.value)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #CBD5E1" }}>
                <option value="all">All Campaigns</option>
                {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: "6px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #CBD5E1" }}>
                <option value="all">All Statuses</option>
                <option value="DISCOVERED">DISCOVERED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="SHORTLISTED">SHORTLISTED</option>
                <option value="CONTACT_READY">CONTACT_READY</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {filteredProspects.map((p) => (
              <div key={p.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>{p.full_name}</div>
                  <span className={`pill pill-${p.status === 'APPROVED' ? 'success' : p.status === 'REJECTED' ? 'danger' : 'violet'}`} style={{ fontSize: 11 }}>
                    {p.status}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>
                  {p.job_title} at <strong>{p.company_name}</strong>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginBottom: 10 }}>
                  📍 {p.location} · 💼 {p.experience_years} Years Experience
                </div>

                {/* AI Match Analysis Result */}
                <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 10, border: "1px solid #E2E8F0", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4F46E5", display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Sparkles size={13} /> Gemini AI Match Score
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: p.match_score >= 80 ? "#059669" : "#D97706" }}>
                      {p.match_score || "--"}%
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "#475569" }}>
                    {p.potential_fit || "Click 'AI Match Analysis' to evaluate fit against campaign criteria."}
                  </div>
                </div>

                {/* Contact Enrichment Status */}
                <div style={{ fontSize: 11.5, marginBottom: 12, color: p.email ? "#059669" : "#64748B" }}>
                  {p.email ? (
                    <div>📧 {p.email} | 📞 {p.phone}</div>
                  ) : (
                    <div>🔒 Contact info hidden until admin approval & enrichment.</div>
                  )}
                </div>

                {/* Admin Actions */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleReviewProspect(p.id, "approve")}>
                    <CheckCircle2 size={12} /> Approve
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleReviewProspect(p.id, "shortlist")}>
                    Shortlist
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleEnrichContact(p.id)}>
                    Enrich Contact
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleAnalyzeMatch(p.id)}>
                    AI Match Analysis
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleGenerateDraft(p.id, "email")}>
                    Draft Email
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11, color: "#DC2626" }} onClick={() => handleReviewProspect(p.id, "reject")}>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: PIPELINE KANBAN */}
      {activeTab === "pipeline" && (
        <div className="glass-card">
          <h3>14-Stage Recruitment Pipeline Kanban</h3>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            Track candidates across the entire lifecycle from DISCOVERED to HIRED.
          </div>

          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16 }}>
            {pipelineStages.map((stage) => {
              const stageProspects = prospects.filter((p) => p.status === stage);
              return (
                <div key={stage} style={{ minWidth: 200, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, borderBottom: "2px solid #CBD5E1", pb: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#334155" }}>{stage}</span>
                    <span className="pill pill-violet" style={{ fontSize: 10 }}>{stageProspects.length}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {stageProspects.map((p) => (
                      <div key={p.id} style={{ background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 12 }}>
                        <div style={{ fontWeight: 700, color: "#0F172A" }}>{p.full_name}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{p.company_name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 6: OUTREACH DRAFTS & MESSAGING */}
      {activeTab === "drafts" && (
        <div className="glass-card">
          <h3>Personalized AI Outreach Drafts & Admin Approval</h3>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            All drafts require explicit admin approval before dispatch.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((m) => (
              <div key={m.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>
                    Candidate: {m.full_name} ({m.company_name})
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span className="pill pill-violet" style={{ fontSize: 10.5 }}>{m.channel.toUpperCase()}</span>
                    <span className={`pill pill-${m.status === 'SENT' ? 'success' : m.status === 'ADMIN_APPROVED' ? 'warning' : 'secondary'}`} style={{ fontSize: 10.5 }}>
                      {m.status}
                    </span>
                  </div>
                </div>

                {m.subject && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Subject: {m.subject}
                  </div>
                )}

                <div style={{ fontSize: 12.5, color: "#475569", whiteSpace: "pre-wrap", background: "#F8FAFC", padding: 12, borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 12 }}>
                  {m.body}
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  {m.status === "DRAFT" && (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 999 }} onClick={() => handleApproveDraft(m.id)}>
                      <CheckCircle2 size={13} /> Approve Draft
                    </button>
                  )}
                  {["ADMIN_APPROVED", "READY_TO_SEND"].includes(m.status) && (
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, background: "#059669" }} onClick={() => handleSendMessage(m.id)}>
                      <Send size={13} /> Send {m.channel.toUpperCase()} Outreach
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 7: CONVERSATIONS & AI AGENT CHAT */}
      {activeTab === "conversations" && (
        <div className="two-col" style={{ gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
          <div className="glass-card">
            <h3>Recruitment Candidates</h3>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 12 }}>Select candidate to view chat & test AI Agent replies.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {prospects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setChatProspectId(p.id)}
                  className={`btn ${chatProspectId === p.id ? "btn-primary" : "btn-secondary"}`}
                  style={{ textAlign: "left", justifyContent: "space-between", fontSize: 12 }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.full_name}</div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>{p.company_name}</div>
                  </div>
                  <span className="pill pill-violet" style={{ fontSize: 10 }}>{p.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3>AI Recruitment Q&A Agent Chat Simulator</h3>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 14 }}>
              Simulates candidate inquiries. AI answers using brokerage knowledge base or escalates to human recruiter.
            </div>

            <div style={{ height: 280, overflowY: "auto", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, marginBottom: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {chatMessages.map((msg) => (
                <div key={msg.id} style={{ alignSelf: msg.sender === "candidate" ? "flex-start" : "flex-end", maxWidth: "80%" }}>
                  <div style={{ fontSize: 10, color: "#64748B", marginBottom: 2 }}>{msg.sender === "candidate" ? "Candidate" : "Recruitment AI Bot"}</div>
                  <div style={{ background: msg.sender === "candidate" ? "#FFFFFF" : "#4F46E5", color: msg.sender === "candidate" ? "#0F172A" : "#FFFFFF", padding: "8px 12px", borderRadius: 10, fontSize: 12.5, border: "1px solid #E2E8F0" }}>
                    {msg.message_text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendCandidateChat} style={{ display: "flex", gap: 8 }}>
              <input style={{ flex: 1 }} placeholder="Type candidate inquiry (e.g. 'What is your commission split?')..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 999 }}>Send Inquiry</button>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 8: RECRUITMENT KNOWLEDGE BASE */}
      {activeTab === "kb" && (
        <div className="glass-card">
          <h3>Recruitment AI Knowledge Base</h3>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            Brokerage value proposition, commission splits, lead distribution rules, and FAQs consumed by Gemini AI.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <h4 style={{ fontSize: 14, color: "#0F172A", marginBottom: 8 }}>Commission & Fees</h4>
              <div style={{ fontSize: 13, color: "#334155" }}>
                <div><strong>Split:</strong> {kb?.commissionSplit}</div>
                <div><strong>Fees:</strong> {kb?.deskFees}</div>
              </div>
            </div>

            <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <h4 style={{ fontSize: 14, color: "#0F172A", marginBottom: 8 }}>Lead Support & Tech</h4>
              <div style={{ fontSize: 13, color: "#334155" }}>
                <div><strong>Leads:</strong> {kb?.leadSupport}</div>
                <div><strong>Tech:</strong> {kb?.technology}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REAL PROGRESS RUN CAMPAIGN MODAL (STEP 13 IMPLEMENTATION) */}
      {runningCampaign && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.5)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="glass-card" style={{ width: 500, background: "#FFFFFF", padding: 24 }}>
            <h3 style={{ fontSize: 18, marginBottom: 4 }}>Campaign Discovery Execution</h3>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 18 }}>
              Running: <strong>{runningCampaign.name}</strong>
            </div>

            {/* Step Progress Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {[
                { step: 1, label: "Building Search Criteria & Title Variations" },
                { step: 2, label: "Executing Apollo Search API Query" },
                { step: 3, label: "Processing & Normalizing Candidate Profiles" },
                { step: 4, label: "Checking & Filtering Duplicates" },
                { step: 5, label: "Saving Prospects to CRM Database" },
              ].map((s) => {
                const isDone = runStep > s.step;
                const isCurrent = runStep === s.step;
                return (
                  <div key={s.step} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                    {isDone ? (
                      <div style={{ width: 22, height: 22, borderRadius: 999, background: "#059669", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={13} />
                      </div>
                    ) : isCurrent ? (
                      <div style={{ width: 22, height: 22, borderRadius: 999, background: "#2563EB", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <RefreshCw size={12} className="spin" />
                      </div>
                    ) : (
                      <div style={{ width: 22, height: 22, borderRadius: 999, background: "#E2E8F0", color: "#94A3B8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
                        {s.step}
                      </div>
                    )}
                    <span style={{ color: isDone ? "#0F172A" : isCurrent ? "#2563EB" : "#94A3B8", fontWeight: isCurrent ? 700 : 500 }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {runStep === 6 && runSummary && (
              <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: 16, marginBottom: 18, color: "#065F46" }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>
                  🎉 Campaign Completed Successfully!
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  • <strong>{runSummary.profilesFound}</strong> prospects found.<br />
                  • <strong>{runSummary.profilesImported}</strong> new profiles saved to CRM.<br />
                  • <strong>{runSummary.duplicatesSkipped}</strong> duplicates skipped.
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              {runStep === 6 ? (
                <>
                  <button className="btn btn-secondary" style={{ borderRadius: 999 }} onClick={() => { setRunningCampaign(null); setActiveTab("review"); }}>
                    Go to Prospect Review
                  </button>
                  <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={() => setRunningCampaign(null)}>
                    Done
                  </button>
                </>
              ) : (
                <div style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={13} className="spin" /> Processing campaign discovery...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Recruitment Campaign */}
      {showAddCampaign && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form className="glass-card" style={{ width: 480, background: "#FFFFFF" }} onSubmit={handleCreateCampaign}>
            <h3 style={{ fontSize: 17, marginBottom: 14 }}>Create Recruitment Campaign</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
              <div>
                <label className="field-label">Campaign Name *</label>
                <input required style={{ width: "100%" }} value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Target Role *</label>
                  <input required style={{ width: "100%" }} value={newCampaign.targetRole} onChange={(e) => setNewCampaign({ ...newCampaign, targetRole: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Location *</label>
                  <input required style={{ width: "100%" }} value={newCampaign.location} onChange={(e) => setNewCampaign({ ...newCampaign, location: e.target.value })} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label className="field-label">Min Experience (Years)</label>
                  <input type="number" style={{ width: "100%" }} value={newCampaign.minExperienceYears} onChange={(e) => setNewCampaign({ ...newCampaign, minExperienceYears: parseInt(e.target.value, 10) })} />
                </div>
                <div>
                  <label className="field-label">Search Mode (STEP 4)</label>
                  <select value={newCampaign.searchMode} onChange={(e) => setNewCampaign({ ...newCampaign, searchMode: e.target.value })} style={{ width: "100%", padding: "6px 12px", borderRadius: 8, border: "1px solid #CBD5E1" }}>
                    <option value="include_other_matching">Include Other Matching Companies</option>
                    <option value="broad_talent_search">Broad Talent Search (Highest Yield)</option>
                    <option value="target_brokerages_only">Target Brokerages Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Target Brokerages (Optional)</label>
                <input style={{ width: "100%" }} value={newCampaign.targetCompanies} onChange={(e) => setNewCampaign({ ...newCampaign, targetCompanies: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowAddCampaign(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Campaign</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
