import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import { StatCard, Pill, SourceTag, statusTone, AttributionBadge } from "../components/UI.jsx";
import { useUser } from "../context/UserContext.jsx";
import IPhoneChatModal from "../components/iPhoneChatModal.jsx";
import {
  Send,
  UserPlus,
  UploadCloud,
  Search,
  MessageSquare,
  Phone,
  Globe,
  Plus,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  DollarSign,
  MapPin,
  X,
  ExternalLink,
  Smartphone,
  Users,
} from "lucide-react";

// Source filters
const FILTERS = ["all", "call", "website", "whatsapp", "telegram", "manual", "bulk_import"];

export default function Dashboard() {
  const { activeUser, teamMembers, isAdmin } = useUser();
  const [leads, setLeads] = useState([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [salesFilter, setSalesFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // iPhone Mobile Chat Frame Modal State
  const [selectedChatLead, setSelectedChatLead] = useState(null);

  // Manual Onboard
  const [outreachErrors, setOutreachErrors] = useState([]);
  
  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "telegram",
    listingIntent: "buy", // buy, rent_in, to_sell, to_rent
    location: "",
    budget: "₹80 Lakhs",
    propertyType: "3BHK Apartment",
    possession: "ready_to_move",
    requirement: "",
    assignedTo: "",
    sendOutreach: true,
    sendTelegramOutbound: false,
    telegramUsername: "",
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Telegram Search & Direct Outreach Container State
  const [telegramPhoneSearch, setTelegramPhoneSearch] = useState("");
  const [telegramForceReengage, setTelegramForceReengage] = useState(false);
  const [telegramSearchStatus, setTelegramSearchStatus] = useState("");
  const [telegramSearching, setTelegramSearching] = useState(false);

  const loadLeads = () => {
    setLoading(true);
    api
      .get("/leads")
      .then((data) => setLeads(data))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
    const interval = setInterval(() => {
      api.get("/leads").then((data) => setLeads(data)).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Base leads accessible by user role
  const roleLeads = useMemo(() => {
    if (isAdmin || !activeUser) return leads;
    return leads.filter((lead) => {
      const matchId = lead.assignedTo === activeUser.id || lead.assigned_to === activeUser.id;
      const matchName = lead.assignedTo === activeUser.name || lead.assigned_to === activeUser.name;
      const matchUser = lead.username && (lead.assignedTo === activeUser.username || lead.assigned_to === activeUser.username);
      const matchEmail = lead.email && (lead.assignedTo === activeUser.email || lead.assigned_to === activeUser.email);
      return matchId || matchName || matchUser || matchEmail;
    });
  }, [leads, isAdmin, activeUser]);

  // Filtered Leads Feed
  const filteredLeads = useMemo(() => {
    return roleLeads.filter((lead) => {
      const matchSource =
        sourceFilter === "all"
          ? true
          : sourceFilter === "bulk_import"
          ? lead.source === "excel_import" || lead.source === "bulk_import"
          : (lead.source || "").toLowerCase() === sourceFilter;

      const matchSales = salesFilter === "all" ? true : (lead.assigned_to === salesFilter || lead.assignedTo === salesFilter);
      return matchSource && matchSales;
    });
  }, [roleLeads, sourceFilter, salesFilter]);

  // Lead Counts Metrics
  const stats = useMemo(() => {
    return {
      total: roleLeads.length,
      telegram: roleLeads.filter((l) => l.source === "telegram").length,
      whatsapp: roleLeads.filter((l) => l.source === "whatsapp").length,
      call: roleLeads.filter((l) => l.source === "call").length,
      website: roleLeads.filter((l) => l.source === "website").length,
      excel: roleLeads.filter((l) => l.source === "excel_import" || l.source === "bulk_import").length,
    };
  }, [roleLeads]);

  async function handleAssign(leadId, assignedToId) {
    const member = teamMembers.find((t) => t.id === assignedToId);
    try {
      await api.patch(`/leads/${leadId}/assign`, {
        assignedTo: assignedToId,
        assignedToName: member ? member.name : "Unassigned",
      });
      loadLeads();
    } catch (e) {
      alert(`Assign note: ${e.message}`);
    }
  }

  async function handleTelegramSearchOutreach(e) {
    e.preventDefault();
    if (!telegramPhoneSearch.trim()) return;

    setTelegramSearching(true);
    setTelegramSearchStatus("🔍 Searching Telegram directory for " + telegramPhoneSearch + "...");

    try {
      const res = await api.post("/ai/start-engagement", {
        phone: telegramPhoneSearch,
        channel: "telegram",
        conversationMode: "OUTBOUND",
        force: telegramForceReengage,
        performedBy: activeUser.name,
      });

      setTelegramSearchStatus(`✅ Telegram user found! Started AI outreach for ${telegramPhoneSearch}.`);
      setTelegramPhoneSearch("");
      loadLeads();
    } catch (err) {
      setTelegramSearchStatus(`Telegram Search Note: ${err.message}`);
    } finally {
      setTelegramSearching(false);
    }
  }

  async function handleManualOnboardSubmit(e) {
    e.preventDefault();
    setManualSubmitting(true);
    try {
      const res = await api.post("/leads/manual-onboard", {
        ...manualForm,
        performedBy: activeUser.name,
      });

      if (res.error) {
        setOutreachErrors(prev => [...prev, `Lead Onboarded, but Telegram Failed: ${res.error}`]);
      } else if (res.outreachError) {
        setOutreachErrors(prev => [...prev, `Telegram Outreach Failed: ${res.outreachError}`]);
      }

      setShowAddModal(false);
      setManualForm({
        name: "",
        phone: "",
        email: "",
        source: "telegram",
        listingIntent: "buy",
        location: "",
        budget: "₹80 Lakhs",
        propertyType: "3BHK Apartment",
        possession: "ready_to_move",
        requirement: "",
        assignedTo: "",
        sendOutreach: true,
        sendTelegramOutbound: false,
        telegramUsername: "",
      });
      loadLeads();
      alert(`Client ${manualForm.name} onboarded under Telegram container!`);
    } catch (err) {
      alert(`Onboarding error: ${err.message}`);
    } finally {
      setManualSubmitting(false);
    }
  }

  return (
    <>
      <Topbar
        title="Enquiry Dashboard & Direct Outreach"
        subtitle="Manage client enquiries, Telegram direct search, bulk imports, and lead allocations."
        actions={
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: 999 }}
          >
            <Plus size={14} /> Onboard Client Manually
          </button>
        }
      />

      {/* COMPACT SINGLE-ROW STAT CONTAINERS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 18 }}>
        <div style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.95)", borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>Total Enquiries</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#0F172A", marginTop: 2 }}>{stats.total}</div>
          </div>
          <div style={{ background: "#EEF2FF", color: "#2563EB", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={15} />
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.95)", borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>Telegram</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#0088cc", marginTop: 2 }}>{stats.telegram}</div>
          </div>
          <div style={{ background: "#E0F2FE", color: "#0088cc", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Send size={14} />
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.95)", borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>WhatsApp</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#16A34A", marginTop: 2 }}>{stats.whatsapp}</div>
          </div>
          <div style={{ background: "#DCFCE7", color: "#16A34A", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={14} />
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.95)", borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>Call Bot</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#D97706", marginTop: 2 }}>{stats.call}</div>
          </div>
          <div style={{ background: "#FEF3C7", color: "#D97706", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Phone size={14} />
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.95)", borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>Website Form</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#7C3AED", marginTop: 2 }}>{stats.website}</div>
          </div>
          <div style={{ background: "#F3E8FF", color: "#7C3AED", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={14} />
          </div>
        </div>

        <div style={{ background: "rgba(255, 255, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.95)", borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(15,23,42,0.04)" }}>
          <div>
            <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em" }}>Bulk Import</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: "#475569", marginTop: 2 }}>{stats.excel}</div>
          </div>
          <div style={{ background: "#F1F5F9", color: "#475569", width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UploadCloud size={14} />
          </div>
        </div>
      </div>

      {/* OUTREACH ERROR NOTIFICATION PANEL */}
      {outreachErrors.length > 0 && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#DC2626", fontWeight: 800, fontSize: 14 }}>
              <AlertTriangle size={18} /> Outreach Delivery Failures ({outreachErrors.length})
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setOutreachErrors([])} style={{ color: "#DC2626", padding: 4 }}>
              <X size={16} /> Clear All
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {outreachErrors.map((err, i) => (
              <div key={i} style={{ background: "#FFFFFF", padding: "10px 14px", borderRadius: 10, fontSize: 13, color: "#7F1D1D", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626" }}></span>
                {err}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TELEGRAM SEARCH & DIRECT OUTREACH CONTAINER */}
      <div
        className="glass-card"
        style={{
          marginBottom: 24,
          padding: 20,
          background: "linear-gradient(135deg, rgba(0, 136, 204, 0.05) 0%, rgba(37, 99, 235, 0.08) 100%)",
          border: "1px solid #93C5FD",
          borderRadius: 20,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#0088cc",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 136, 204, 0.3)",
              }}
            >
              <Send size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 17, color: "#0F172A" }}>Telegram Direct Search & AI Outreach</h3>
                <span className="pill pill-info" style={{ fontSize: 10.5, fontWeight: 800 }}>
                  Telegram Container Active
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "#64748B" }}>
                Enter any Telegram username (or phone number) to search the directory, locate the contact, and initiate AI property outreach.
              </p>
            </div>
          </div>

          <span
            style={{
              background: "#E0F2FE",
              color: "#0369A1",
              fontSize: 11.5,
              fontWeight: 800,
              padding: "4px 12px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={13} /> Outreached through Telegram
          </span>
        </div>

        <form onSubmit={handleTelegramSearchOutreach} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type="text"
                required
                placeholder="Enter Telegram username (e.g. @joker763) or phone number..."
                value={telegramPhoneSearch}
                onChange={(e) => setTelegramPhoneSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #93C5FD",
                  fontSize: 13.5,
                  background: "#FFFFFF",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={telegramSearching || !telegramPhoneSearch.trim()}
              className="btn btn-primary"
              style={{ borderRadius: 999, background: "#0088cc", borderColor: "#0088cc", whiteSpace: "nowrap" }}
            >
              <Send size={15} /> {telegramSearching ? "Searching Telegram..." : "Search & Start Telegram Outreach"}
            </button>
          </div>
          
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748B", cursor: "pointer", alignSelf: "flex-start", marginLeft: 4 }}>
            <input
              type="checkbox"
              checked={telegramForceReengage}
              onChange={(e) => setTelegramForceReengage(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            Force Re-engage (Override active AI engagement check)
          </label>
        </form>

        {telegramSearchStatus && (
          <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 700, color: "#0369A1" }}>
            {telegramSearchStatus}
          </div>
        )}
      </div>

      {/* FILTER BAR */}
      <div
        className="glass-card"
        style={{
          marginBottom: 16,
          padding: "12px 20px",
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>Channel Source:</span>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className="btn btn-sm"
              style={{
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: sourceFilter === f ? 800 : 500,
                background: sourceFilter === f ? "#2563EB" : "#F1F5F9",
                color: sourceFilter === f ? "#FFFFFF" : "#334155",
                textTransform: "capitalize",
              }}
            >
              {f === "bulk_import" ? "Excel Bulk Import" : f}
            </button>
          ))}
        </div>

        {/* Consultant Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#64748B" }}>Consultant:</span>
          <select
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            style={{
              padding: "5px 12px",
              borderRadius: 10,
              border: "1px solid #CBD5E1",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <option value="all">All Consultants</option>
            {teamMembers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* UNIFIED ENQUIRIES TABLE */}
      <div className="glass-card">
        {loading ? (
          <div style={{ color: "#64748B", padding: 32, textAlign: "center" }}>Loading enquiries...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="empty-state">No enquiries found for selected filters.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="lead-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E2E8F0", textAlign: "left" }}>
                  <th style={{ padding: "10px" }}>Lead ID & Name</th>
                  <th style={{ padding: "10px" }}>Channel Source</th>
                  <th style={{ padding: "10px" }}>Listing Intent</th>
                  <th style={{ padding: "10px" }}>Budget / Location</th>
                  <th style={{ padding: "10px" }}>Requirement</th>
                  <th style={{ padding: "10px" }}>Assigned Consultant</th>
                  <th style={{ padding: "10px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const intentLabel =
                    lead.listing_intent === "to_sell"
                      ? "For Sale (Listing)"
                      : lead.listing_intent === "to_rent"
                      ? "For Rent Out (Listing)"
                      : lead.listing_intent === "rent_in"
                      ? "Rent In (Tenant)"
                      : "Buy Property";

                  const intentPillTone =
                    lead.listing_intent === "to_sell" || lead.listing_intent === "to_rent"
                      ? "pill-warning"
                      : lead.listing_intent === "rent_in"
                      ? "pill-info"
                      : "pill-success";

                  return (
                    <tr key={lead.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {/* Name & Phone */}
                      <td style={{ padding: "10px" }}>
                        <div style={{ fontWeight: 800, color: "#0F172A" }}>{lead.name}</div>
                        <div style={{ fontSize: 11.5, color: "#64748B" }}>{lead.phone}</div>
                      </td>

                      {/* Channel Source Badge */}
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <SourceTag source={lead.source} />
                          {lead.source === "telegram" && (
                            <span style={{ fontSize: 10, background: "#E0F2FE", color: "#0369A1", padding: "2px 6px", borderRadius: 999, fontWeight: 800 }}>
                              Telegram Container
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Listing Intent Dropdown Label */}
                      <td style={{ padding: "10px" }}>
                        <span className={`pill ${intentPillTone}`} style={{ fontSize: 11, fontWeight: 800 }}>
                          {intentLabel}
                        </span>
                      </td>

                      {/* Budget / Location */}
                      <td style={{ padding: "10px" }}>
                        <div style={{ fontWeight: 700, color: "#0F172A" }}>{lead.budget || "₹80 Lakhs"}</div>
                        <div style={{ fontSize: 11.5, color: "#64748B" }}>
                          {lead.location ? lead.location : <span style={{ fontStyle: "italic", color: "#94A3B8" }}>Pending Location</span>}
                        </div>
                      </td>

                      {/* Requirement */}
                      <td style={{ padding: "10px", maxWidth: 220 }}>
                        <div style={{ fontSize: 12, color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {lead.requirement || lead.property_interest || "Ready to move 3BHK options."}
                        </div>
                      </td>

                      {/* Assigned Consultant */}
                      <td style={{ padding: "10px" }}>
                        <select
                          value={lead.assigned_to || ""}
                          onChange={(e) => handleAssign(lead.id, e.target.value)}
                          style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, border: "1px solid #CBD5E1" }}
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Action: Open 360 View & Open iPhone Chat */}
                      <td style={{ padding: "10px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ borderRadius: 999, fontSize: 11, padding: "4px 10px" }}
                            onClick={() => setSelectedChatLead(lead)}
                            title="Open iPhone Chat Console"
                          >
                            <Smartphone size={12} /> Chat
                          </button>
                          <Link to={`/leads/${lead.id}`} className="btn btn-sm btn-ghost" style={{ borderRadius: 999, fontSize: 11, padding: "4px 10px" }}>
                            360° <ExternalLink size={11} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* IPHONE MOBILE CHAT MODAL */}
      {selectedChatLead && (
        <IPhoneChatModal
          lead={selectedChatLead}
          onClose={() => setSelectedChatLead(null)}
          onRefresh={loadLeads}
        />
      )}

      {/* SINGLE CLIENT MANUAL ONBOARDING MODAL */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="glass-card" style={{ width: 620, background: "#FFFFFF", padding: 24, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 17, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                <UserPlus size={18} /> Onboard Client Manually
              </h3>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)} style={{ borderRadius: 999, padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleManualOnboardSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div>
                  <label className="field-label">Full Name *</label>
                  <input
                    required
                    style={{ width: "100%" }}
                    placeholder="e.g. Rahul Menon"
                    value={manualForm.name}
                    onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Phone Number *</label>
                  <input
                    required
                    style={{ width: "100%" }}
                    placeholder="+91 98765 43210"
                    value={manualForm.phone}
                    onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Email Address *</label>
                  <input
                    type="email"
                    style={{ width: "100%" }}
                    placeholder="rahul@example.com"
                    value={manualForm.email}
                    onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">Channel / Source</label>
                  <select
                    style={{ width: "100%" }}
                    value={manualForm.source}
                    onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                  >
                    <option value="telegram">Telegram Channel</option>
                    <option value="whatsapp">WhatsApp Outreach</option>
                    <option value="call">Voice Call (Inbound/Outbound)</option>
                    <option value="website">Website Form</option>
                    <option value="manual">Direct Manual Entry</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Listing Intent / Category</label>
                  <select
                    style={{ width: "100%" }}
                    value={manualForm.listingIntent}
                    onChange={(e) => setManualForm({ ...manualForm, listingIntent: e.target.value })}
                  >
                    <option value="buy">Client Wants to Buy Property</option>
                    <option value="rent_in">Client Wants to Rent In</option>
                    <option value="to_sell">Client Listing Property For Sale</option>
                    <option value="to_rent">Client Listing Property For Rent Out</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Preferred Location</label>
                  <input
                    style={{ width: "100%" }}
                    placeholder="e.g. Kakkanad, Kochi"
                    value={manualForm.location}
                    onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">Budget Range</label>
                  <input
                    style={{ width: "100%" }}
                    placeholder="e.g. ₹80 Lakhs / ₹25k mo"
                    value={manualForm.budget}
                    onChange={(e) => setManualForm({ ...manualForm, budget: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">Property Type & Specs</label>
                  <input
                    style={{ width: "100%" }}
                    placeholder="e.g. 3BHK Apartment"
                    value={manualForm.propertyType}
                    onChange={(e) => setManualForm({ ...manualForm, propertyType: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">Possession Timeline</label>
                  <select
                    style={{ width: "100%" }}
                    value={manualForm.possession}
                    onChange={(e) => setManualForm({ ...manualForm, possession: e.target.value })}
                  >
                    <option value="ready_to_move">Ready to Move</option>
                    <option value="under_construction">Under Construction (Within 6-12 mos)</option>
                  </select>
                </div>
              </div>

              {/* OUTBOUND ENQUIRY OPTIONS */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <Send size={14} /> Outbound Enquiry Options
                </div>
                
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#334155", marginBottom: manualForm.sendTelegramOutbound ? 12 : 0, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={manualForm.sendTelegramOutbound}
                    onChange={(e) => setManualForm({ ...manualForm, sendTelegramOutbound: e.target.checked })}
                    style={{ cursor: "pointer" }}
                  />
                  <strong>Trigger Telegram Outbound Enquiry</strong> (AI Bot)
                </label>

                {manualForm.sendTelegramOutbound && (
                  <div style={{ marginTop: 8 }}>
                    <label className="field-label">Telegram Username *</label>
                    <input
                      required
                      style={{ width: "100%", background: "#FFFFFF" }}
                      placeholder="e.g. @joker763 or joker763"
                      value={manualForm.telegramUsername}
                      onChange={(e) => setManualForm({ ...manualForm, telegramUsername: e.target.value })}
                    />
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                      Username must be valid and user must have started the bot to receive messages.
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={manualSubmitting} className="btn btn-primary">
                  {manualSubmitting ? "Onboarding..." : "Onboard Client & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
