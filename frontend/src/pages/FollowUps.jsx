import { useState, useEffect, useMemo } from "react";
import Topbar from "../components/Topbar.jsx";
import { StatCard, Pill, SourceTag } from "../components/UI.jsx";
import IPhoneChatModal from "../components/iPhoneChatModal.jsx";
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Sparkles,
  Phone,
  MessageSquare,
  Mail,
  Calendar,
  Building,
  Plus,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Zap,
  Sliders,
  Check,
  X,
  FileText,
  ChevronRight,
  ShieldAlert,
  Smartphone,
} from "lucide-react";

export default function FollowUps() {
  const [activeTab, setActiveTab] = useState("kanban"); // kanban, followups, rules, directory
  const [followupSubTab, setFollowupSubTab] = useState("overdue"); // overdue, today, upcoming, stale, queue, reengagement
  const [nonActiveStage, setNonActiveStage] = useState("all"); // all, Nurture, Dormant, Lost, DND
  const [selectedChatLead, setSelectedChatLead] = useState(null);

  const [leads, setLeads] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [overdueLeads, setOverdueLeads] = useState([]);
  const [todayLeads, setTodayLeads] = useState([]);
  const [upcomingLeads, setUpcomingLeads] = useState([]);
  const [staleLeads, setStaleLeads] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState("");

  // Lead Details Modal State
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [leadDetails, setLeadDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Lead Modal State
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    phone: "",
    email: "",
    source: "website",
    requirement: "",
    budget: "₹80 Lakhs",
    location: "Kakkanad, Kochi",
    propertyType: "Apartment",
    timeline: "1-3 Months",
    leadTemperature: "Warm",
  });

  // Follow-Up Scheduler State
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    nextAction: "Call client to confirm site visit time",
    nextActionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    nextActionType: "Call",
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/leads").then((r) => r.json()),
      fetch("/api/team").then((r) => r.json()),
      fetch("/api/follow-ups/overdue").then((r) => r.json()),
      fetch("/api/follow-ups/today").then((r) => r.json()),
      fetch("/api/follow-ups/upcoming").then((r) => r.json()),
      fetch("/api/follow-ups/stale?days=3").then((r) => r.json()),
      fetch("/api/automation-rules").then((r) => r.json()),
    ])
      .then(([leadsData, teamData, overdueData, todayData, upcomingData, staleData, rulesData]) => {
        setLeads(leadsData || []);
        setTeamMembers(teamData || []);
        setOverdueLeads(overdueData || []);
        setTodayLeads(todayData || []);
        setUpcomingLeads(upcomingData || []);
        setStaleLeads(staleData || []);
        setAutomationRules(rulesData || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[FollowUps Load Error]", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadLeadDetails = async (id) => {
    setSelectedLeadId(id);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/leads/${id}/details`);
      const data = await res.json();
      setLeadDetails(data);
      setLoadingDetails(false);
    } catch (err) {
      console.error("[Lead Details Load Error]", err);
      setLoadingDetails(false);
    }
  };

  async function handleStageChange(leadId, newStage) {
    try {
      const res = await fetch(`/api/leads/${leadId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStage, changedByName: "Sales Manager" }),
      });
      if (!res.ok) throw new Error("Stage change failed");
      setStatusMsg(`✅ Moved lead to '${newStage}' stage.`);
      loadData();
      if (selectedLeadId === leadId) loadLeadDetails(leadId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleSaveFollowUp(e) {
    e.preventDefault();
    if (!selectedLeadId) return;
    try {
      const res = await fetch(`/api/leads/${selectedLeadId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(followUpForm),
      });
      if (!res.ok) throw new Error("Follow-up scheduling failed");
      setShowFollowUpModal(false);
      setStatusMsg("✅ Follow-up action scheduled!");
      loadData();
      loadLeadDetails(selectedLeadId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleMarkFollowUpComplete(leadId) {
    try {
      const res = await fetch(`/api/leads/${leadId}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markCompleted: true }),
      });
      if (!res.ok) throw new Error("Mark complete failed");
      setStatusMsg("✅ Follow-up marked as completed.");
      loadData();
      if (selectedLeadId === leadId) loadLeadDetails(selectedLeadId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleRunRule(ruleId) {
    setStatusMsg("Executing automation rule against eligible leads...");
    try {
      const res = await fetch(`/api/automation-rules/${ruleId}/run`, { method: "POST" });
      const data = await res.json();
      setStatusMsg(`⚡ Rule '${data.ruleName}' executed on ${data.leadsProcessed} leads.`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  }

  // Active 8 Kanban Stages
  const activeStages = [
    "New",
    "Contacted",
    "Qualified",
    "Site Visit Scheduled",
    "Site Visit Done",
    "Negotiation",
    "Booking / Token",
    "Won",
  ];

  const nonActiveStates = ["Nurture", "Dormant", "Lost", "DND"];

  const filteredLeads = leads.filter((l) => {
    const stage = l.kanban_stage || l.status || "New";
    if (nonActiveStage === "all") return !nonActiveStates.includes(stage);
    return stage === nonActiveStage;
  });

  return (
    <>
      <Topbar
        title="Follow-ups & Sales Kanban OS"
        subtitle="Dynamic 8-Stage Pipeline · Follow-Up Center · Automation Rules Engine · AI Next Action Recommender"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 999 }} onClick={loadData}>
              <RefreshCw size={14} /> Sync CRM Pipeline
            </button>
          </div>
        }
      />

      {statusMsg && (
        <div className="glass-card" style={{ marginBottom: 16, fontSize: 13, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          {statusMsg}
        </div>
      )}

      {/* Main View Mode Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "kanban", label: "Pipeline Kanban", icon: Sliders },
            { id: "followups", label: `Follow-Up Center (${overdueLeads.length + todayLeads.length})`, icon: Clock, badge: overdueLeads.length },
            { id: "rules", label: `Automation Rules (${automationRules.length})`, icon: Zap },
            { id: "directory", label: `All Leads Directory (${leads.length})`, icon: Users },
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
                  padding: "7px 16px",
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

        {activeTab === "kanban" && (
          <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "#64748B", fontWeight: 600 }}>Filter Non-Active States:</span>
            <select
              value={nonActiveStage}
              onChange={(e) => setNonActiveStage(e.target.value)}
              style={{ padding: "5px 12px", borderRadius: 999, fontSize: 12, border: "1px solid #CBD5E1", background: "#FFFFFF" }}
            >
              <option value="all">Active Pipeline Only</option>
              <option value="Nurture">Nurture</option>
              <option value="Dormant">Dormant</option>
              <option value="Lost">Lost</option>
              <option value="DND">DND (Do Not Contact)</option>
            </select>
          </div>
        )}
      </div>

      {/* SECTION 1: INTERACTIVE 8-STAGE KANBAN PIPELINE */}
      {activeTab === "kanban" && (
        <div
          className="glass-card"
          style={{
            padding: 16,
            overflowX: "auto",
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            borderRadius: 20,
          }}
        >
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 16, minHeight: "65vh" }}>
            {activeStages.map((stage, index) => {
              const stageLeads = filteredLeads.filter((l) => (l.kanban_stage || l.status || "New") === stage);
              
              // Progressive color generation for column top borders
              const hue = 210 + (index * 15); // Starts blue, shifts towards purple/pink
              const headerColor = `hsl(${hue}, 80%, 50%)`;
              const bgGradient = `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 100%)`;

              return (
                <div
                  key={stage}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = "rgba(241, 245, 249, 0.9)";
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.style.background = bgGradient;
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.background = bgGradient;
                    const leadId = e.dataTransfer.getData("leadId");
                    if (leadId) handleStageChange(leadId, stage);
                  }}
                  style={{
                    minWidth: 280,
                    width: 280,
                    background: bgGradient,
                    border: "1px solid rgba(255,255,255,0.8)",
                    borderTop: `4px solid ${headerColor}`,
                    borderRadius: 16,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
                    backdropFilter: "blur(12px)",
                    transition: "all 0.2s ease"
                  }}
                >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.01em" }}>{stage}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, background: headerColor, color: "white", padding: "2px 8px", borderRadius: 999 }}>
                    {stageLeads.length}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                  {stageLeads.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: "30px 0", border: "2px dashed #E2E8F0", borderRadius: 12, fontWeight: 600 }}>Drop leads here</div>
                  ) : (
                    stageLeads.map((l) => {
                      const isOverdue = overdueLeads.some(ol => ol.id === l.id);
                      const isHot = l.leadTemperature === "Hot" || l.leadTemperature === "Super Hot";
                      
                      return (
                      <div
                        key={l.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("leadId", l.id);
                          e.currentTarget.style.opacity = "0.6";
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                        style={{
                          background: "#FFFFFF",
                          borderRadius: 12,
                          padding: 14,
                          border: isOverdue ? "1px solid #EF4444" : "1px solid #E2E8F0",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.02)",
                          cursor: "grab",
                          position: "relative",
                          transition: "transform 0.1s ease, box-shadow 0.1s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.05)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.02)";
                        }}
                        onClick={() => loadLeadDetails(l.id)}
                      >
                        {/* Dynamic Badges Row */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 13.5, color: "#0F172A", lineHeight: 1.2 }}>{l.name}</span>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "45%" }}>
                            {isOverdue && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "#FEF2F2", color: "#EF4444", fontSize: 9, padding: "2px 6px", borderRadius: 999, fontWeight: 700, border: "1px solid #FCA5A5" }}>
                                <Clock size={10} /> Overdue
                              </span>
                            )}
                            {isHot && (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 2, background: "#FFF7ED", color: "#EA580C", fontSize: 9, padding: "2px 6px", borderRadius: 999, fontWeight: 700, border: "1px solid #FDBA74" }}>
                                <Flame size={10} /> Hot
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ fontSize: 11.5, color: "#475569", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ background: "#F1F5F9", padding: "1px 6px", borderRadius: 4 }}>{l.location || "Kakkanad"}</span>
                          <span style={{ background: "#ECFDF5", color: "#059669", padding: "1px 6px", borderRadius: 4 }}>{l.budget || "₹80 Lakhs"}</span>
                        </div>

                        <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderLeft: "2px solid #E2E8F0", paddingLeft: 6 }}>
                          {l.requirement || l.property_interest || "3BHK Apartment"}
                        </div>

                        {/* Action Bar */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px dashed #E2E8F0" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            style={{ 
                              fontSize: 11, padding: "4px 10px", borderRadius: 8, 
                              background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)", 
                              color: "white", fontWeight: 600, border: "none",
                              display: "inline-flex", alignItems: "center", gap: 4,
                              cursor: "pointer", boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)"
                            }}
                            onClick={() => setSelectedChatLead(l)}
                          >
                            <Smartphone size={12} /> iPhone Chat
                          </button>

                          <select
                            value={l.kanban_stage || stage}
                            onChange={(e) => handleStageChange(l.id, e.target.value)}
                            style={{ fontSize: 10, border: "1px solid #CBD5E1", borderRadius: 6, padding: "2px 4px", background: "#F8FAFC", color: "#64748B", cursor: "pointer", opacity: 0.7 }}
                            title="Move Stage (Or Drag & Drop)"
                          >
                            {activeStages.concat(nonActiveStates).map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )})
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* SECTION 2: FOLLOW-UP CENTER (6 TABS) */}
      {activeTab === "followups" && (
        <div className="glass-card">
          <h3 style={{ margin: "0 0 4px 0", fontSize: 17, color: "#0F172A" }}>Follow-Up Center & Stale Engine</h3>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            Automated tracking of overdue actions, today's schedule, stale leads, and automation queues.
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid #E2E8F0", paddingBottom: 10, flexWrap: "wrap" }}>
            {[
              { id: "overdue", label: `Overdue (${overdueLeads.length})`, count: overdueLeads.length, color: "#EF4444" },
              { id: "today", label: `Today (${todayLeads.length})`, count: todayLeads.length, color: "#2563EB" },
              { id: "upcoming", label: `Upcoming (${upcomingLeads.length})`, count: upcomingLeads.length, color: "#059669" },
              { id: "stale", label: `Stale Leads (${staleLeads.length})`, count: staleLeads.length, color: "#D97706" },
              { id: "queue", label: "Automation Queue", count: 0, color: "#7C3AED" },
              { id: "reengagement", label: "Re-engagement", count: 0, color: "#4F46E5" },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setFollowupSubTab(st.id)}
                className="btn"
                style={{
                  borderRadius: 999,
                  fontSize: 12,
                  padding: "6px 14px",
                  fontWeight: followupSubTab === st.id ? 800 : 500,
                  background: followupSubTab === st.id ? st.color : "#F1F5F9",
                  color: followupSubTab === st.id ? "#FFFFFF" : "#334155",
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(241,245,249,0.7)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Lead Name</th>
                  <th style={{ padding: "10px" }}>Current Stage</th>
                  <th style={{ padding: "10px" }}>Next Scheduled Action</th>
                  <th style={{ padding: "10px" }}>Due Date</th>
                  <th style={{ padding: "10px" }}>Assigned Salesperson</th>
                  <th style={{ padding: "10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(followupSubTab === "overdue" ? overdueLeads : followupSubTab === "today" ? todayLeads : followupSubTab === "upcoming" ? upcomingLeads : staleLeads).map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>
                      {l.name} <div style={{ fontSize: 11, color: "#64748B" }}>{l.phone}</div>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span className="pill pill-violet" style={{ fontSize: 11 }}>{l.kanban_stage || l.status}</span>
                    </td>
                    <td style={{ padding: "10px", fontWeight: 600 }}>{l.next_action || "Routine Follow-up Call"}</td>
                    <td style={{ padding: "10px", color: followupSubTab === "overdue" ? "#DC2626" : "#2563EB", fontWeight: 700 }}>
                      {l.next_action_date ? l.next_action_date.split('T')[0] : "Stale - No Date"}
                    </td>
                    <td style={{ padding: "10px" }}>{l.assigned_to || "Unassigned"}</td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleMarkFollowUpComplete(l.id)}>
                          <Check size={12} /> Mark Complete
                        </button>
                        <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => loadLeadDetails(l.id)}>
                          View & AI Plan
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

      {/* SECTION 3: AUTOMATION RULES ENGINE TAB */}
      {activeTab === "rules" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: 17, color: "#0F172A" }}>Automation Rules Engine</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Configure multi-level triggers: Level 1 (AI Suggestion), Level 2 (Assisted Task Creation), Level 3 (Full Automated Dispatch).
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {automationRules.map((rule) => (
              <div key={rule.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0F172A" }}>{rule.name}</span>
                    <span className={`pill pill-${rule.automation_level === 'level_3_full' ? 'success' : rule.automation_level === 'level_2_assisted' ? 'violet' : 'warning'}`} style={{ marginLeft: 10, fontSize: 11 }}>
                      {rule.automation_level.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleRunRule(rule.id)}>
                    <Zap size={12} /> Execute Rule Now
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, fontSize: 12.5, color: "#334155" }}>
                  <div><strong>Trigger Event:</strong> <code>{rule.trigger_event}</code></div>
                  <div><strong>Delay:</strong> {rule.delay_minutes} Minutes</div>
                  <div><strong>Action Type:</strong> {rule.action_type}</div>
                  <div><strong>Status:</strong> {rule.is_active ? "Active" : "Disabled"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ALL LEADS DIRECTORY */}
      {activeTab === "directory" && (
        <div className="glass-card">
          <h3 style={{ margin: "0 0 12px 0", fontSize: 17, color: "#0F172A" }}>Lead Operating Directory</h3>
          <div className="table-responsive">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(241,245,249,0.7)", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Lead Name</th>
                  <th style={{ padding: "10px" }}>Phone / Contact</th>
                  <th style={{ padding: "10px" }}>Source</th>
                  <th style={{ padding: "10px" }}>Kanban Stage</th>
                  <th style={{ padding: "10px" }}>Assigned To</th>
                  <th style={{ padding: "10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px", fontWeight: 700, color: "#0F172A" }}>{l.name}</td>
                    <td style={{ padding: "10px" }}>{l.phone}</td>
                    <td style={{ padding: "10px" }}><SourceTag source={l.source} /></td>
                    <td style={{ padding: "10px" }}>
                      <select
                        value={l.kanban_stage || l.status || "New"}
                        onChange={(e) => handleStageChange(l.id, e.target.value)}
                        style={{ padding: "4px 8px", borderRadius: 8, fontSize: 12, border: "1px solid #CBD5E1" }}
                      >
                        {activeStages.concat(nonActiveStates).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "10px" }}>{l.assignedToName || l.assigned_to || "Unassigned"}</td>
                    <td style={{ padding: "10px" }}>
                      <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => loadLeadDetails(l.id)}>
                        Lead Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEAD DETAILS DRAWER */}
      {selectedLeadId && leadDetails && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", justifyContent: "flex-end" }}>
          <div className="glass-card" style={{ width: 620, height: "100vh", borderRadius: 0, background: "#FFFFFF", padding: 24, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 18, margin: 0 }}>{leadDetails.lead.name}</h3>
                <div style={{ fontSize: 12, color: "#64748B" }}>{leadDetails.lead.phone} | {leadDetails.lead.email || "No Email"}</div>
              </div>
              <button className="btn btn-secondary" style={{ borderRadius: 999, padding: "6px 10px" }} onClick={() => setSelectedLeadId(null)}>
                <X size={16} />
              </button>
            </div>

            {/* AI Next Action Recommendation Card */}
            {leadDetails.aiRecommendation && (
              <div style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(79, 70, 229, 0.08) 100%)", border: "1px solid #BFDBFE", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#1E40AF", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={16} /> Gemini AI Next Action Recommendation
                  </span>
                  <span className="pill pill-violet" style={{ fontSize: 10.5 }}>{leadDetails.aiRecommendation.recommendedChannel}</span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", marginBottom: 4 }}>
                  {leadDetails.aiRecommendation.recommendedNextAction}
                </div>

                <div style={{ fontSize: 12, color: "#475569", marginBottom: 10, background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  "{leadDetails.aiRecommendation.suggestedMessage}"
                </div>

                <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12 }}>
                  <strong>Rationale:</strong> {leadDetails.aiRecommendation.reasonForRecommendation}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ borderRadius: 999 }} onClick={() => setShowFollowUpModal(true)}>
                    Accept & Schedule Task
                  </button>
                </div>
              </div>
            )}

            {/* Property Matches */}
            <div>
              <h4 style={{ fontSize: 14, color: "#0F172A", marginBottom: 10 }}>Automated Property Matches ({leadDetails.matchedProperties.length})</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leadDetails.matchedProperties.map((m) => (
                  <div key={m.property.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{m.property.title}</div>
                      <div style={{ fontSize: 11.5, color: "#64748B" }}>📍 {m.property.location} · 💰 ₹{(m.property.price / 100000).toFixed(1)} Lakhs</div>
                    </div>
                    <span className="pill pill-success" style={{ fontSize: 11, fontWeight: 800 }}>{m.matchScore}% Match</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Timeline */}
            <div>
              <h4 style={{ fontSize: 14, color: "#0F172A", marginBottom: 10 }}>Chronological Activity Timeline</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {leadDetails.activities.map((act) => (
                  <div key={act.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#0F172A" }}>
                      <span>{act.title}</span>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>{new Date(act.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>{act.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IPHONE CHAT FRAME MODAL */}
      {selectedChatLead && (
        <IPhoneChatModal
          lead={selectedChatLead}
          onClose={() => setSelectedChatLead(null)}
          onRefresh={loadData}
        />
      )}
    </>
  );
}
