import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import { Pill, SourceTag, statusTone, AttributionBadge } from "../components/UI.jsx";
import { useUser } from "../context/UserContext.jsx";
import IPhoneChatModal from "../components/iPhoneChatModal.jsx";
import {
  PhoneCall,
  MessageSquare,
  Bot,
  Sparkles,
  Clipboard,
  Lightbulb,
  Pin,
  Edit3,
  Smartphone,
  Rocket,
  CheckCircle2,
  UserX,
  FileText,
  Send,
  Building,
  Star,
  Award,
  ShieldCheck,
  Mail,
  User,
  Clock,
  FileCheck,
  DollarSign,
  AlertTriangle,
  History,
  Check,
  X,
  Eye,
  RefreshCw,
  Zap,
  Trash2,
} from "lucide-react";

export default function LeadDetail() {
  const { id } = useParams();
  const { activeUser, teamMembers } = useUser();
  const navigate = useNavigate();

  const [deleting, setDeleting] = useState(false);

  // Active 9-Tab Client 360 View State
  const [active360Tab, setActive360Tab] = useState("overview"); // overview, timeline, conversations, documents, properties, transaction, followups, insights, history

  const [leadDetails, setLeadDetails] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [showIPhoneModal, setShowIPhoneModal] = useState(false);

  // Conversation Filter State
  const [convChannelFilter, setConvChannelFilter] = useState("ALL");
  const [draftMessage, setDraftMessage] = useState("");
  const [rephrasing, setRephrasing] = useState(false);
  const [rephraseTone, setRephraseTone] = useState("Professional");

  // AI Analysis State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Review Queue Items for this Lead
  const [reviewItems, setReviewItems] = useState([]);

  // Log Follow-up Form State
  const [showLogForm, setShowLogForm] = useState(false);
  const [followUpNum, setFollowUpNum] = useState(1);
  const [newStage, setNewStage] = useState("Ongoing");
  const [followUpNote, setFollowUpNote] = useState("");

  // Document Vault State
  const [vaultDocuments, setVaultDocuments] = useState([]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [detailsRes, commsRes, reviewRes, docsRes] = await Promise.all([
        fetch(`/api/leads/${id}/details`).then((r) => r.json()),
        fetch(`/api/communications/lead/${id}`).then((r) => r.json()),
        fetch("/api/communications/review-queue").then((r) => r.json()),
        fetch(`/api/documents/lead/${id}`).then((r) => r.json()).catch(() => []),
      ]);

      setLeadDetails(detailsRes || null);
      setCommunications(commsRes || []);
      if (Array.isArray(reviewRes)) {
        setReviewItems(reviewRes.filter((r) => r.lead_id === id || r.client_id === detailsRes?.lead?.client_id));
      }
      setVaultDocuments(docsRes || []);
      setLoading(false);
    } catch (err) {
      console.error("[Lead Detail 360 Load Error]", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => {
      Promise.all([
        fetch(`/api/leads/${id}/details`).then((r) => r.json()),
        fetch(`/api/communications/lead/${id}`).then((r) => r.json()),
      ]).then(([detailsRes, commsRes]) => {
        if (detailsRes) setLeadDetails(detailsRes);
        if (commsRes) setCommunications(commsRes);
      }).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const lead = leadDetails?.lead;
  const matchedProperties = leadDetails?.matchedProperties || [];
  const activities = leadDetails?.activities || [];
  const aiRec = leadDetails?.aiRecommendation;

  // AI Rephrase Action
  async function handleAiRephrase(tone) {
    if (!draftMessage.trim()) return;
    setRephrasing(true);
    setRephraseTone(tone);
    try {
      const res = await fetch("/api/communications/ai-rephrase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draftMessage, tone }),
      });
      const data = await res.json();
      if (data.rephrasedText) setDraftMessage(data.rephrasedText);
    } catch (err) {
      alert(`AI Rephrase note: ${err.message}`);
    } finally {
      setRephrasing(false);
    }
  }

  // AI Analyze Action
  async function handleAiAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/communications/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: communications,
          leadContext: lead,
        }),
      });
      const data = await res.json();
      if (data.analysis) setAiAnalysis(data.analysis);
    } catch (err) {
      alert(`AI Analysis error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleResolveReviewItem(reviewId, action) {
    try {
      await fetch(`/api/communications/review-queue/${reviewId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolvedByName: activeUser.name }),
      });
      setActionMsg(`✅ Review queue item resolved (${action}).`);
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStageChange(newStageKey) {
    try {
      await fetch(`/api/leads/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStage: newStageKey, changedByName: activeUser.name }),
      });
      setActionMsg(`✅ Moved pipeline stage to '${newStageKey}'.`);
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAssignChange(newAssignedTo) {
    const assignedMember = teamMembers.find((t) => t.id === newAssignedTo);
    try {
      await fetch(`/api/leads/${id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: newAssignedTo,
          assignedToName: assignedMember ? assignedMember.name : "Unassigned",
        }),
      });
      setActionMsg(`✅ Assigned lead to ${assignedMember ? assignedMember.name : "Unassigned"}`);
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleCompleteFollowup() {
    try {
      await fetch(`/api/leads/${id}/followup/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedByName: activeUser.name })
      });
      setActionMsg("✅ Follow-up marked as completed.");
      refreshData();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return <div style={{ color: "#64748B", padding: 32, textAlign: "center" }}>Loading Client 360 View...</div>;
  }

  if (!lead) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <h3 style={{ color: "#DC2626" }}>Lead / Client Not Found</h3>
        <Link to="/" className="btn btn-primary" style={{ borderRadius: 999 }}>Back to Dashboard</Link>
      </div>
    );
  }

  const clientId = lead.client_id || `CLIENT-${lead.id.replace(/[^0-9]/g, "").padStart(6, "0") || "000101"}`;

  // Filtered Communications
  const filteredComms = communications.filter((c) => {
    if (convChannelFilter === "ALL") return true;
    return (c.channel || "").toUpperCase() === convChannelFilter;
  });

  return (
    <>
      <Topbar
        title={`Client 360° View — ${lead.name}`}
        subtitle={`Unified Client ID: ${clientId} · Single Source of Truth Profile`}
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 999 }} onClick={refreshData}>
              <RefreshCw size={13} /> Refresh 360 View
            </button>
            <button
              className="btn btn-sm"
              style={{ borderRadius: 999, background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 6 }}
              disabled={deleting}
              onClick={async () => {
                if (!window.confirm(`Are you sure you want to permanently delete this lead (${lead.name})? This cannot be undone.`)) return;
                setDeleting(true);
                try {
                  await api.delete(`/leads/${id}`);
                  navigate("/");
                } catch (err) {
                  alert(`Delete failed: ${err.message}`);
                  setDeleting(false);
                }
              }}
            >
              <Trash2 size={13} /> {deleting ? "Deleting..." : "Delete Lead"}
            </button>
            <Link to="/" className="btn btn-secondary btn-sm" style={{ borderRadius: 999 }}>
              Back to Feed
            </Link>
          </div>
        }
      />

      {actionMsg && (
        <div className="glass-card" style={{ marginBottom: 16, fontSize: 13, color: "#1D4ED8", background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          {actionMsg}
        </div>
      )}

      {/* HEADER CLIENT SUMMARY CARD */}
      <div className="glass-card" style={{ marginBottom: 20, padding: 20, background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.95) 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <h2 style={{ margin: 0, fontSize: 22, color: "#0F172A" }}>{lead.name}</h2>
              <span className="pill pill-violet" style={{ fontSize: 12, fontWeight: 800 }}>
                ID: {clientId}
              </span>
              <SourceTag source={lead.source} />
            </div>

            <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#475569", flexWrap: "wrap" }}>
              <span>📞 {lead.phone}</span>
              <span>✉️ {lead.email || "No Email On File"}</span>
              {lead.location && <span>📍 {lead.location}</span>}
              {lead.budget && <span>💰 Budget: {lead.budget}</span>}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Pipeline Stage</div>
              <select
                value={lead.kanban_stage || lead.status || "New"}
                onChange={(e) => handleStageChange(e.target.value)}
                style={{ fontSize: 13, fontWeight: 800, padding: "5px 12px", borderRadius: 10, border: "1px solid #CBD5E1", background: "#FFFFFF" }}
              >
                {["New", "Contacted", "Qualified", "Site Visit Scheduled", "Site Visit Done", "Negotiation", "Booking / Token", "Won", "Nurture", "Dormant", "Lost", "DND"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700, textTransform: "uppercase" }}>Assigned Consultant</div>
              <select
                value={lead.assigned_to || ""}
                onChange={(e) => handleAssignChange(e.target.value)}
                style={{ fontSize: 13, fontWeight: 700, padding: "5px 12px", borderRadius: 10, border: "1px solid #CBD5E1", background: "#FFFFFF" }}
              >
                <option value="">Unassigned</option>
                {teamMembers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 9-TAB NAVIGATION BAR */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", borderBottom: "2px solid #E2E8F0", paddingBottom: 10 }}>
        {[
          { id: "overview", label: "1. Overview", icon: User },
          { id: "timeline", label: `2. Timeline (${activities.length})`, icon: Clock },
          { id: "conversations", label: `3. Conversations (${communications.length})`, icon: MessageSquare },
          { id: "documents", label: "4. Documents", icon: FileText },
          { id: "properties", label: `5. Property Interest (${matchedProperties.length})`, icon: Building },
          { id: "transaction", label: "6. Transaction", icon: DollarSign },
          { id: "followups", label: "7. Follow-ups", icon: CheckCircle2 },
          { id: "insights", label: "8. AI Insights", icon: Sparkles },
          { id: "history", label: "9. Activity History", icon: History },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = active360Tab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive360Tab(tab.id)}
              className="btn"
              style={{
                borderRadius: 999,
                fontSize: 12,
                padding: "6px 14px",
                fontWeight: isActive ? 800 : 600,
                background: isActive ? "#2563EB" : "#F1F5F9",
                color: isActive ? "#FFFFFF" : "#334155",
              }}
            >
              <IconComp size={13} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {active360Tab === "overview" && (
        <div className="two-col">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="glass-card">
              <h3 style={{ fontSize: 16, marginBottom: 14, color: "#0F172A" }}>Unified Client Specification Profile</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "#334155" }}>
                <div><strong>Client ID:</strong> <code style={{ color: "#2563EB" }}>{clientId}</code></div>
                <div><strong>Lead ID:</strong> <code>{lead.id}</code></div>
                <div><strong>Full Name:</strong> {lead.name}</div>
                <div><strong>Phone / WhatsApp:</strong> {lead.phone}</div>
                <div><strong>Email Address:</strong> {lead.email || "Not specified"}</div>
                <div><strong>Outreach Channel:</strong> {lead.source || "Manual"}</div>
                <div><strong>Preferred Location:</strong> {lead.location || "Not specified"}</div>
                <div><strong>Budget Spec:</strong> {lead.budget || "Not specified"}</div>
                <div><strong>Property Type:</strong> {lead.property_type || "Not specified"}</div>
                <div><strong>Possession Timeline:</strong> {lead.timeline || "Not specified"}</div>
                <div><strong>Lead Temperature:</strong> {lead.lead_temperature || "Warm"}</div>
                <div><strong>Assigned Sales Rep:</strong> {lead.assignedToName || lead.assigned_to || "Unassigned"}</div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: 16, marginBottom: 10, color: "#0F172A" }}>Requirement & Preference Notes</h3>
              <div style={{ fontSize: 13, color: "#475569", background: "#F8FAFC", padding: 14, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                {lead.requirement || lead.property_interest || "No requirement notes captured yet."}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* AI Recommendation Card */}
            {aiRec && (
              <div style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(79, 70, 229, 0.08) 100%)", border: "1px solid #BFDBFE", borderRadius: 16, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1E40AF", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={16} /> Gemini AI Next Action Strategy
                  </span>
                  <span className="pill pill-violet" style={{ fontSize: 10.5 }}>{aiRec.recommendedChannel}</span>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", marginBottom: 6 }}>{aiRec.recommendedNextAction}</div>
                <div style={{ fontSize: 12, color: "#475569", background: "#FFFFFF", padding: 10, borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 8 }}>
                  "{aiRec.suggestedMessage}"
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}><strong>Rationale:</strong> {aiRec.reasonForRecommendation}</div>
              </div>
            )}

            {/* Quick Actions Card */}
            <div className="glass-card">
              <h3 style={{ fontSize: 16, marginBottom: 12, color: "#0F172A" }}>Consultant Quick Actions</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="btn btn-primary" style={{ justifyContent: "center", borderRadius: 999 }} onClick={() => setShowIPhoneModal(true)}>
                  <Smartphone size={14} /> Open iPhone Chat Console
                </button>
                <button className="btn btn-secondary" style={{ justifyContent: "center", borderRadius: 999 }} onClick={() => setActive360Tab("followups")}>
                  <CheckCircle2 size={14} /> Schedule Next Follow-Up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IPHONE CHAT FRAME MODAL */}
      {showIPhoneModal && (
        <IPhoneChatModal
          lead={lead}
          onClose={() => setShowIPhoneModal(false)}
          onRefresh={refreshData}
        />
      )}

      {/* TAB 2: UNIFIED CHRONOLOGICAL TIMELINE */}
      {active360Tab === "timeline" && (
        <div className="glass-card">
          <h3 style={{ fontSize: 17, marginBottom: 4, color: "#0F172A" }}>Unified Chronological Activity Timeline</h3>
          <div style={{ fontSize: 12, color: "#64748B", marginBottom: 16 }}>
            Consolidates calls, chats, emails, documents, stage transitions, and AI events into a single audit trail.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activities.length === 0 ? (
              <div className="empty-state">No timeline events recorded yet.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} style={{ display: "flex", gap: 14, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 12 }}>
                  <div style={{ width: 140, fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
                    {new Date(act.created_at).toLocaleString("en-IN")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#0F172A" }}>{act.title}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{act.description}</div>
                  </div>
                  <span className="pill pill-violet" style={{ fontSize: 10.5, height: "fit-content" }}>{act.performed_by_name || act.performed_by}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONVERSATIONS */}
      {active360Tab === "conversations" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 17, margin: 0, color: "#0F172A" }}>Unified Multi-Channel Communications Console</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>Consolidated feed of Email, WhatsApp, Telegram, Call transcripts & Website chats.</div>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: "flex", gap: 4 }}>
              {["ALL", "CHAT", "EMAIL", "WHATSAPP", "TELEGRAM", "CALL"].map((ch) => (
                <button
                  key={ch}
                  onClick={() => setConvChannelFilter(ch)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: convChannelFilter === ch ? 800 : 500,
                    background: convChannelFilter === ch ? "#2563EB" : "#F1F5F9",
                    color: convChannelFilter === ch ? "#FFFFFF" : "#334155",
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* Communications Feed List */}
          <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 20, background: "#F8FAFC", padding: 14, borderRadius: 14, border: "1px solid #E2E8F0" }}>
            {filteredComms.length === 0 ? (
              <div className="empty-state">No communications found for filter '{convChannelFilter}'.</div>
            ) : (
              filteredComms.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: c.direction === "inbound" ? "#FFFFFF" : "#EFF6FF",
                    border: `1px solid ${c.direction === "inbound" ? "#E2E8F0" : "#BFDBFE"}`,
                    borderRadius: 12,
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, color: "#0F172A" }}>
                      {c.sender_name || c.sender} ({c.channel.toUpperCase()})
                    </span>
                    <span style={{ color: "#94A3B8" }}>{new Date(c.created_at).toLocaleString("en-IN")}</span>
                  </div>
                  {c.subject && <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E40AF", marginBottom: 2 }}>{c.subject}</div>}
                  <div style={{ fontSize: 12.5, color: "#334155", whiteSpace: "pre-wrap" }}>{c.body}</div>
                </div>
              ))
            )}
          </div>

          {/* AI REPHRASE & OUTBOUND COMPOSER */}
          <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles size={14} /> AI Message Rephrase & Composer
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                {["Professional", "Friendly", "Concise", "Persuasive", "Follow-up", "Formal"].map((tone) => (
                  <button
                    key={tone}
                    type="button"
                    disabled={rephrasing || !draftMessage.trim()}
                    onClick={() => handleAiRephrase(tone)}
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: 10.5, borderRadius: 999, padding: "2px 8px", background: rephraseTone === tone ? "#EEF2FF" : "transparent" }}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={3}
              value={draftMessage}
              onChange={(e) => setDraftMessage(e.target.value)}
              placeholder="Type message to client or click AI Rephrase to refine tone..."
              style={{ width: "100%", padding: 10, fontSize: 13, borderRadius: 8, border: "1px solid #E2E8F0", marginBottom: 8 }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ borderRadius: 999 }}
                onClick={() => {
                  alert(`Message queued for dispatch to ${lead.phone}!`);
                  setDraftMessage("");
                }}
              >
                <Send size={13} /> Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS & AI REVIEW QUEUE */}
      {active360Tab === "documents" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 17, margin: 0, color: "#0F172A" }}>Client Document Vault & Extracted Data Containers</h3>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Static repository of approved KYC, Contracts, and Post-Possession Documents received via email (info.oaklinetechnologies@gmail.com).
              </div>
            </div>
            <span className="pill pill-success" style={{ fontSize: 11, fontWeight: 800 }}>
              {vaultDocuments.length} Static Vault Records
            </span>
          </div>

          {/* AI Review Queue Pending Approval Items */}
          {reviewItems.length > 0 && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#B45309", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={16} /> Pending Human Approval Ingestions ({reviewItems.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {reviewItems.map((item) => (
                  <div key={item.id} style={{ background: "#FFFFFF", padding: 12, borderRadius: 10, border: "1px solid #FCD34D", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: "#64748B" }}>Confidence Score: {(item.confidence_score * 100).toFixed(0)}% · Source: {item.source_channel}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-primary btn-sm" style={{ borderRadius: 999, fontSize: 11 }} onClick={() => handleResolveReviewItem(item.id, "APPROVED")}>
                        <Check size={12} /> Approve Update
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ borderRadius: 999, fontSize: 11, color: "#DC2626" }} onClick={() => handleResolveReviewItem(item.id, "REJECTED")}>
                        <X size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CLIENT STATIC DOCUMENT VAULT GRID */}
          {vaultDocuments.length === 0 ? (
             <div className="empty-state">No documents available in the vault yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {vaultDocuments.map((doc) => (
                <div key={doc.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 16, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: "#0F172A", marginBottom: 4 }}>{doc.name}</div>
                      <span className="pill pill-violet" style={{ fontSize: 10.5, letterSpacing: 0.5, fontWeight: 800, padding: "3px 8px" }}>
                        {doc.category}
                      </span>
                    </div>
                    {doc.status === "APPROVED" && (
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: "#10B981", background: "#D1FAE5", padding: "4px 8px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        <Check size={12} /> APPROVED
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 14 }}>
                    Received via {doc.channel} · {doc.confidence} Confidence
                  </div>

                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 800, color: "#3B82F6", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={14} /> Extracted Data Container
                    </div>
                    <div style={{ fontSize: 11.5, color: "#334155", display: "flex", flexDirection: "column", gap: 4 }}>
                      {doc.extractedData && Object.keys(doc.extractedData).map((key) => {
                        if (key === "aiSummary") return null;
                        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        return (
                          <div key={key}>
                            <strong>{label}:</strong> {doc.extractedData[key]}
                          </div>
                        );
                      })}
                      {doc.extractedData?.aiSummary && (
                        <div style={{ marginTop: 6 }}>
                          <strong>Ai Summary:</strong> {doc.extractedData.aiSummary}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROPERTY INTEREST */}
      {active360Tab === "properties" && (
        <div className="glass-card">
          <h3 style={{ fontSize: 17, marginBottom: 14, color: "#0F172A" }}>Automated Property Matches ({matchedProperties.length})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {matchedProperties.map((m) => (
              <div key={m.property.id} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>{m.property.title}</div>
                  <span className="pill pill-success" style={{ fontSize: 11, fontWeight: 800 }}>{m.matchScore}% Match</span>
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>📍 {m.property.location} · 💰 ₹{(m.property.price / 100000).toFixed(1)} Lakhs</div>
                <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 10 }}>{m.property.description || "Verified ready-to-move listing."}</div>
                <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999, fontSize: 11, width: "100%", justifyContent: "center" }}>
                  Generate & Send Proposal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: TRANSACTION */}
      {active360Tab === "transaction" && (
        <div className="glass-card">
          <h3 style={{ fontSize: 17, marginBottom: 14, color: "#0F172A" }}>Transaction & Contract Intelligence</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, fontSize: 13, color: "#334155" }}>
            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>Target Purchase Price</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#2563EB" }}>{lead.budget || "₹80 Lakhs"}</div>
            </div>
            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>Estimated Closing Date</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{lead.estimated_closing_date || "Pending"}</div>
            </div>
            <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
              <div style={{ fontSize: 11, color: "#64748B", fontWeight: 700 }}>Contract Status</div>
              <span className="pill pill-warning" style={{ fontSize: 11, fontWeight: 800 }}>{lead.contract_status || "Pre-Agreement"}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FOLLOW-UPS */}
      {active360Tab === "followups" && (
        <div className="glass-card">
          <h3 style={{ fontSize: 17, marginBottom: 14, color: "#0F172A" }}>Follow-up Schedule & Actions</h3>
          <div style={{ fontSize: 13, color: "#334155", marginBottom: 14 }}>
            <strong>Next Action:</strong> {lead.next_action || "Schedule routine phone discussion"} <br />
            <strong>Due Date:</strong> {lead.next_action_date ? lead.next_action_date.split('T')[0] : "Pending Schedule"}
          </div>
          <button className="btn btn-primary" style={{ borderRadius: 999 }} onClick={handleCompleteFollowup}>
            <CheckCircle2 size={15} /> Mark Next Action Completed
          </button>
        </div>
      )}

      {/* TAB 8: AI INSIGHTS */}
      {active360Tab === "insights" && (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 17, margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} /> Deep AI Conversation & Buying Intent Analysis
            </h3>
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 999 }} disabled={analyzing} onClick={handleAiAnalyze}>
              {analyzing ? "Analyzing Conversation..." : "Run Deep AI Analysis"}
            </button>
          </div>

          {aiAnalysis ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, fontSize: 13 }}>
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <strong>Sentiment:</strong> {aiAnalysis.sentiment}
              </div>
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <strong>Buying Intent:</strong> {aiAnalysis.buyingIntent}
              </div>
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0" }}>
                <strong>Urgency Level:</strong> {aiAnalysis.urgencyLevel}
              </div>
              <div style={{ background: "#F8FAFC", padding: 14, borderRadius: 12, border: "1px solid #E2E8F0", gridColumn: "span 3" }}>
                <strong>Recommended Next Action:</strong> {aiAnalysis.nextBestAction}
              </div>
            </div>
          ) : (
            <div className="empty-state">Click 'Run Deep AI Analysis' to extract buying intent, objections, and urgency signals.</div>
          )}
        </div>
      )}

      {/* TAB 9: ACTIVITY HISTORY */}
      {active360Tab === "history" && (
        <div className="glass-card">
          <h3 style={{ fontSize: 17, marginBottom: 14, color: "#0F172A" }}>Audit Log & Data Mutation History</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activities.length === 0 ? (
              <div className="empty-state">No audit logs found for this lead.</div>
            ) : (
              activities.map((act) => (
                <div key={act.id} style={{ display: "grid", gridTemplateColumns: "1fr 3fr 1fr", gap: 12, borderBottom: "1px solid #F1F5F9", paddingBottom: 10, alignItems: "start" }}>
                   <div style={{ fontSize: 11.5, color: "#64748B" }}>
                      {new Date(act.created_at).toLocaleString("en-IN")}
                   </div>
                   <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1E293B" }}>{act.title}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>{act.description}</div>
                   </div>
                   <div style={{ textAlign: "right" }}>
                      <span className="pill pill-violet" style={{ fontSize: 10 }}>{act.performed_by_name || act.performed_by}</span>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </>
  );
}
