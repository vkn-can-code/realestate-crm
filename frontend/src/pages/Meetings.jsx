import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import { Pill, SourceTag } from "../components/UI.jsx";
import { useUser } from "../context/UserContext.jsx";
import IPhoneChatModal from "../components/iPhoneChatModal.jsx";
import {
  Calendar,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Check,
  X,
  Phone,
  MessageSquare,
  ExternalLink,
  Building,
  DollarSign,
  MapPin,
  Eye,
  User,
  Clock,
  FileText,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Tag,
} from "lucide-react";

export default function Meetings() {
  const { activeUser } = useUser();
  const [activeTab, setActiveTab] = useState("meetings"); // "meetings" | "feedback_config"
  const [meetings, setMeetings] = useState([]);
  const [team, setTeam] = useState([]);
  const [slotsData, setSlotsData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ leadId: "", leadPhone: "", dateStr: selectedDate, timeSlot: "10:00", assignedTo: "" });

  // Complete Meeting Modal State
  const [completingMeeting, setCompletingMeeting] = useState(null);
  const [meetingSummaryText, setMeetingSummaryText] = useState("");
  const [isSubmittingComplete, setIsSubmittingComplete] = useState(false);

  // 360-Degree Lead Inspector Drawer Modal State
  const [inspectingMeeting, setInspectingMeeting] = useState(null);
  const [inspectingLeadDetails, setInspectingLeadDetails] = useState(null);
  const [loadingLeadDetails, setLoadingLeadDetails] = useState(false);

  // iPhone Live Chat Modal State
  const [selectedChatLead, setSelectedChatLead] = useState(null);

  // Feedback Form Builder Config State
  const [feedbackConfig, setFeedbackConfig] = useState({ title: "", subtitle: "", questions: [] });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  function refresh() {
    api.get("/meetings").then(setMeetings);
    api.get("/team").then(setTeam);
    api.get(`/meetings/slots?date=${selectedDate}`).then(setSlotsData);
    api.get("/feedback/config").then(setFeedbackConfig);
  }

  useEffect(refresh, [selectedDate]);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/meetings/book", {
      leadId: form.leadId,
      leadPhone: form.leadPhone,
      dateStr: form.dateStr,
      timeSlot: form.timeSlot,
      repId: form.assignedTo || activeUser?.id,
    });
    setForm({ leadId: "", leadPhone: "", dateStr: selectedDate, timeSlot: "10:00", assignedTo: "" });
    setShowForm(false);
    refresh();
  }

  async function handleCompleteSubmit(e) {
    e.preventDefault();
    if (!completingMeeting) return;
    setIsSubmittingComplete(true);
    try {
      await api.post(`/meetings/${completingMeeting.id}/complete`, {
        meetingSummary: meetingSummaryText,
        completedBy: activeUser.name || "Sales Rep",
      });
      alert("Meeting marked as Completed! Feedback survey link has been automatically dispatched to client via Telegram, WhatsApp & Email.");
      setCompletingMeeting(null);
      setMeetingSummaryText("");
      refresh();
    } catch (err) {
      alert(`Error completing meeting: ${err.message}`);
    } finally {
      setIsSubmittingComplete(false);
    }
  }

  async function handleSaveFeedbackConfig(e) {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await api.post("/feedback/config", feedbackConfig);
      alert("Feedback Form Customizer settings saved cleanly!");
      refresh();
    } catch (err) {
      alert(`Error saving feedback config: ${err.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  }

  // Open 360 Lead Inspector Drawer
  const open360Inspector = async (meeting) => {
    setInspectingMeeting(meeting);
    setLoadingLeadDetails(true);
    setInspectingLeadDetails(null);
    try {
      const res = await fetch(`/api/leads/${meeting.leadId}/details`);
      if (res.ok) {
        const data = await res.json();
        setInspectingLeadDetails(data);
      } else {
        setInspectingLeadDetails({
          lead: { id: meeting.leadId, name: meeting.leadName || "Client", phone: meeting.leadPhone || "N/A" },
        });
      }
    } catch (err) {
      setInspectingLeadDetails({
        lead: { id: meeting.leadId, name: meeting.leadName || "Client", phone: meeting.leadPhone || "N/A" },
      });
    } finally {
      setLoadingLeadDetails(false);
    }
  };

  // Click handler on slot grid cell
  const handleSlotClick = (rep, slot) => {
    if (slot.status !== "booked") return;
    const meeting = meetings.find(
      (m) =>
        (m.assignedTo === rep.repId || m.assignedToName === rep.repName) &&
        (m.dateStr === selectedDate || m.scheduledAt?.startsWith(selectedDate)) &&
        m.timeSlot === slot.timeSlot &&
        m.status !== "Cancelled"
    );
    if (meeting) {
      open360Inspector(meeting);
    } else {
      open360Inspector({
        id: `MTG-SLOT-${slot.timeSlot}`,
        leadId: slot.bookedBy || "LEAD-SLOT",
        leadName: rep.repName ? `Client (${rep.repName}'s ${slot.timeSlot} slot)` : "Client",
        leadPhone: "Registered Slot",
        scheduledAt: `${selectedDate}T${slot.timeSlot}:00Z`,
        dateStr: selectedDate,
        timeSlot: slot.timeSlot,
        assignedTo: rep.repId,
        assignedToName: rep.repName,
        status: "Scheduled",
      });
    }
  };

  // Filter Allocated Meetings Table based on User Role
  const filteredMeetings = (activeUser && activeUser.role !== "admin")
    ? meetings.filter(
        (m) =>
          m.assignedTo === activeUser.id ||
          m.assignedTo === activeUser.name ||
          m.assignedToName === activeUser.name ||
          m.assignedToName === activeUser.id
      )
    : meetings;

  // Filter Live Time Slot Grid Cards based on User Role
  const userSlotsData = (activeUser && activeUser.role !== "admin")
    ? slotsData.filter((r) => {
        const matchId = r.repId === activeUser.id;
        const matchName = r.repName && activeUser.name && r.repName.toLowerCase() === activeUser.name.toLowerCase();
        const matchUser = r.repName && activeUser.username && r.repName.toLowerCase() === activeUser.username.toLowerCase();
        const matchPart = activeUser.name && r.repName && r.repName.toLowerCase().includes(activeUser.name.toLowerCase());
        return matchId || matchName || matchUser || matchPart;
      })
    : slotsData;

  return (
    <>
      <Topbar
        title="Meetings & Client Feedback Console"
        subtitle="Manage booked consultations, sales outcome summaries, and post-meeting client feedback."
        actions={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ padding: "6px 12px", borderRadius: 999, border: "1px solid var(--border)", background: "var(--surface)" }}
            />
            <button className="cylinder-action-btn active" onClick={() => setShowForm((s) => !s)}>
              <Plus size={15} /> {showForm ? "Cancel" : "Book Manual Slot"}
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === "meetings" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("meetings")}
        >
          <Calendar size={14} /> Meetings & Slot Grid ({meetings.length})
        </button>
        {activeUser?.role === "admin" && (
          <button
            className={`btn ${activeTab === "feedback_config" ? "btn-primary" : "btn-secondary"}`}
            style={{ borderRadius: 999 }}
            onClick={() => setActiveTab("feedback_config")}
          >
            <SlidersHorizontal size={14} /> Feedback Form Customizer
          </button>
        )}
      </div>

      {activeTab === "feedback_config" ? (
        <form className="glass-card" style={{ padding: 24, maxWidth: 800 }} onSubmit={handleSaveFeedbackConfig}>
          <h3 style={{ fontSize: 18, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal size={18} /> Post-Meeting Client Feedback Form Customizer
          </h3>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
            Customize the questions and title sent to clients after a meeting is completed.
          </p>

          <div style={{ marginBottom: 16 }}>
            <label className="field-label">Survey Form Title</label>
            <input
              style={{ width: "100%" }}
              value={feedbackConfig.title || ""}
              onChange={(e) => setFeedbackConfig({ ...feedbackConfig, title: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="field-label">Subtitle / Welcome Message</label>
            <input
              style={{ width: "100%" }}
              value={feedbackConfig.subtitle || ""}
              onChange={(e) => setFeedbackConfig({ ...feedbackConfig, subtitle: e.target.value })}
            />
          </div>

          <h4 style={{ fontSize: 15, marginBottom: 12, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
            Survey Questions
          </h4>

          {(feedbackConfig.questions || []).map((q, idx) => (
            <div key={q.id || idx} style={{ background: "#FFFFFF", border: "1px solid var(--violet-100)", borderRadius: 10, padding: 14, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--violet-900)", marginBottom: 6 }}>Question #{idx + 1}</div>
              <input
                style={{ width: "100%", marginBottom: 8 }}
                value={q.text || ""}
                onChange={(e) => {
                  const newQ = [...feedbackConfig.questions];
                  newQ[idx].text = e.target.value;
                  setFeedbackConfig({ ...feedbackConfig, questions: newQ });
                }}
              />
            </div>
          ))}

          <button className="btn btn-primary" style={{ borderRadius: 999 }} type="submit" disabled={isSavingConfig}>
            {isSavingConfig ? "Saving..." : "Save Feedback Form Settings"}
          </button>
        </form>
      ) : (
        <>
          {/* Manual Slot Booking Form */}
          {showForm && (
            <form className="glass-card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: 14 }}>Book Consultation Slot</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label className="field-label">Lead ID *</label>
                  <input required placeholder="LEAD-1001" value={form.leadId} onChange={(e) => setForm({ ...form, leadId: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Lead Phone *</label>
                  <input required placeholder="+91 98765 43210" value={form.leadPhone} onChange={(e) => setForm({ ...form, leadPhone: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Date *</label>
                  <input required type="date" value={form.dateStr} onChange={(e) => setForm({ ...form, dateStr: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Time Slot *</label>
                  <select value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}>
                    {["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"].map((t) => (
                      <option key={t} value={t}>{t} ({formatSlotLabel(t)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Assign Sales Advisor *</label>
                  <select required value={form.assignedTo || (activeUser?.role !== "admin" ? activeUser?.id : "")} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                    <option value="">Select advisor...</option>
                    {team.filter((t) => t.role === "sales").map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 16, borderRadius: 999 }} type="submit">Reserve Slot & Send Reminder</button>
            </form>
          )}

          {/* Live Salesperson Time Slot Schedule Grid */}
          <div className="glass-card" style={{ marginBottom: 25, padding: 20 }}>
            <h3 style={{ fontSize: 16, marginBottom: 14, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} /> Live Time Slot Grid for {selectedDate}
              {activeUser?.role !== "admin" && (
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "2px 10px", borderRadius: 999 }}>
                  Showing My Schedule ({activeUser?.name || "Advisor"})
                </span>
              )}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {userSlotsData.map((rep) => (
                <div key={rep.repId} style={{ background: "#FFFFFF", border: "1px solid var(--violet-100)", borderRadius: 14, padding: 16, boxShadow: "0 2px 12px rgba(76, 47, 176, 0.05)" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "var(--violet-900)", marginBottom: 2 }}>{rep.repName}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{rep.repTitle}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {rep.slots.map((s) => {
                      const isAvail = s.status === "available";
                      const isBooked = s.status === "booked";

                      return (
                        <div
                          key={s.timeSlot}
                          title={isBooked ? "🔒 Slot Booked — Click to view 360° Lead Details" : isAvail ? "Free Slot" : "Unavailable"}
                          onClick={() => handleSlotClick(rep, s)}
                          style={{
                            padding: "6px 4px",
                            borderRadius: 8,
                            textAlign: "center",
                            fontSize: 11,
                            fontWeight: 700,
                            background: isAvail ? "#E1F7EF" : isBooked ? "#FCE4E7" : "#F1F0F7",
                            color: isAvail ? "#1D8A67" : isBooked ? "#C33E52" : "var(--muted)",
                            border: isAvail ? "1px solid #A3E6CD" : isBooked ? "2px solid #E11D48" : "1px solid transparent",
                            cursor: isBooked ? "pointer" : "default",
                            boxShadow: isBooked ? "0 2px 8px rgba(225, 29, 72, 0.2)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {s.timeSlot}
                          <div style={{ fontSize: 9, opacity: 0.95, textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 2 }}>
                            {isAvail ? "Free" : isBooked ? "🔒 Booked" : "Off"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {userSlotsData.length === 0 && (
                <div style={{ color: "var(--muted)", padding: 20, textAlign: "center", fontStyle: "italic" }}>
                  No slot schedule available for your account on this date.
                </div>
              )}
            </div>
          </div>

          {/* Booked Meetings Table */}
          <div className="glass-card">
            <h3 style={{ fontSize: 16, marginBottom: 14 }}>Allocated Meetings & Consultation Queue</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lead ID / Name</th>
                  <th>Date & Time Slot</th>
                  <th>Assigned Sales Rep</th>
                  <th>Status</th>
                  <th>Meeting Summary Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeetings.map((m) => {
                  const isCompleted = m.status === "Completed";

                  return (
                    <tr
                      key={m.id}
                      style={{ cursor: "pointer", transition: "background 0.15s ease" }}
                      title="Click row to open 360° Lead Inspector View"
                    >
                      <td style={{ fontWeight: 600 }} onClick={() => open360Inspector(m)}>
                        <div style={{ color: "#2563EB", display: "flex", alignItems: "center", gap: 6 }}>
                          <Eye size={14} /> {m.leadName || m.leadId}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{m.leadPhone}</div>
                      </td>
                      <td onClick={() => open360Inspector(m)}>
                        <div>{m.dateStr || new Date(m.scheduledAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: "#2563EB" }}>
                          {m.timeSlot ? formatSlotLabel(m.timeSlot) : new Date(m.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td onClick={() => open360Inspector(m)}>{team.find((t) => t.id === m.assignedTo)?.name || m.assignedToName || m.assignedTo}</td>
                      <td onClick={() => open360Inspector(m)}>
                        {isCompleted ? (
                          <Pill tone="success"><Check size={12} /> Completed</Pill>
                        ) : (
                          <Pill tone="violet">{m.status}</Pill>
                        )}
                      </td>
                      <td onClick={() => open360Inspector(m)} style={{ maxWidth: 220, fontSize: 12 }}>
                        {m.meetingSummary ? (
                          <span style={{ color: "var(--text)" }}>"{m.meetingSummary}"</span>
                        ) : (
                          <span style={{ color: "var(--muted)", fontStyle: "italic" }}>No notes added yet</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: "4px 10px", fontSize: 11, borderRadius: 999 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              open360Inspector(m);
                            }}
                          >
                            <Eye size={12} /> 360° View
                          </button>

                          {isCompleted ? (
                            <span style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>Done</span>
                          ) : (
                            <button
                              className="btn btn-primary"
                              style={{ padding: "4px 10px", fontSize: 11, borderRadius: 999 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompletingMeeting(m);
                                setMeetingSummaryText(m.meetingSummary || "");
                              }}
                            >
                              <CheckCircle2 size={12} /> Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMeetings.length === 0 && (
                  <tr><td colSpan={6} className="empty-state">No meetings scheduled for this filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 360-DEGREE LEAD INSPECTOR DRAWER MODAL */}
          {inspectingMeeting && (
            <div
              className="modal-backdrop"
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(15, 23, 42, 0.5)",
                backdropFilter: "blur(14px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10000,
                padding: 16,
              }}
              onClick={() => setInspectingMeeting(null)}
            >
              <div
                className="glass-card"
                style={{
                  width: "100%",
                  maxWidth: 780,
                  maxHeight: "90vh",
                  overflowY: "auto",
                  background: "rgba(255, 255, 255, 0.98)",
                  padding: 24,
                  borderRadius: 24,
                  boxShadow: "0 25px 60px rgba(15, 23, 42, 0.25)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Top Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #E2E8F0", paddingBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>
                        {inspectingMeeting.leadName || inspectingMeeting.leadId}
                      </span>
                      <SourceTag source={inspectingLeadDetails?.lead?.source || "website"} />
                    </div>
                    <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
                      <span>🆔 {inspectingMeeting.leadId}</span>
                      <span>📅 Booked: {inspectingMeeting.dateStr || selectedDate} at {formatSlotLabel(inspectingMeeting.timeSlot)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setInspectingMeeting(null)}
                    style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <X size={18} color="#475569" />
                  </button>
                </div>

                {loadingLeadDetails ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#64748B" }}>
                    Loading 360° Lead Intelligence...
                  </div>
                ) : (
                  <div>
                    {/* Key Attributes Overview Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: 12, borderRadius: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Phone & Contact</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginTop: 4 }}>
                          {inspectingLeadDetails?.lead?.phone || inspectingMeeting.leadPhone || "Not provided"}
                        </div>
                      </div>

                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: 12, borderRadius: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Requirement & Intent</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#2563EB", marginTop: 4 }}>
                          {inspectingLeadDetails?.lead?.requirement || "Property Consultation"}
                        </div>
                      </div>

                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: 12, borderRadius: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>Budget & Location</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", marginTop: 4 }}>
                          {inspectingLeadDetails?.lead?.budget || "₹80 Lakhs"} ({inspectingLeadDetails?.lead?.location || "Kakkanad"})
                        </div>
                      </div>
                    </div>

                    {/* Interactive Action Control Toolbar */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                      <a
                        href={`tel:${inspectingLeadDetails?.lead?.phone || inspectingMeeting.leadPhone}`}
                        className="btn btn-primary"
                        style={{ borderRadius: 999, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                      >
                        <Phone size={14} /> Call Client Now
                      </a>

                      <button
                        className="btn btn-secondary"
                        style={{ borderRadius: 999, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                        onClick={() => {
                          setSelectedChatLead(inspectingLeadDetails?.lead || { id: inspectingMeeting.leadId, name: inspectingMeeting.leadName, source: "whatsapp" });
                        }}
                      >
                        <MessageSquare size={14} color="#2563EB" /> Open Live Chat Preview
                      </button>

                      <Link
                        to="/proposals"
                        className="btn btn-secondary"
                        style={{ borderRadius: 999, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                      >
                        <FileText size={14} color="#7C3AED" /> Create Proposal
                      </Link>

                      <Link
                        to={`/leads/${inspectingMeeting.leadId}`}
                        className="btn btn-secondary"
                        style={{ borderRadius: 999, padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
                      >
                        <ExternalLink size={14} color="#D97706" /> Full 360° Profile Page
                      </Link>
                    </div>

                    {/* Matched Properties Section */}
                    {(inspectingLeadDetails?.matchedProperties || []).length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                          <Building size={16} color="#2563EB" /> Recommended Matched Properties for Client
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {inspectingLeadDetails.matchedProperties.slice(0, 2).map((p) => (
                            <div key={p.id} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: 12 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{p.title}</div>
                              <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>📍 {p.location}</div>
                              <div style={{ fontSize: 13, fontWeight: 800, color: "#2563EB", marginTop: 6 }}>₹{(p.price / 100000).toFixed(1)} Lakhs</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Interaction History Timeline */}
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <Clock size={16} color="#7C3AED" /> Recent Interaction Timeline
                      </h4>
                      <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 14, maxHeight: 180, overflowY: "auto" }}>
                        {(inspectingLeadDetails?.activities || []).length > 0 ? (
                          inspectingLeadDetails.activities.slice(0, 4).map((act, i) => (
                            <div key={i} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #E2E8F0" }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A" }}>{act.action || act.title}</div>
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>By: {act.performedBy || "System AI"} • {act.timestamp || "Recent"}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                            Meeting scheduled. Further interactions will be logged here automatically.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPLETE MEETING & SUMMARY MODAL */}
          {completingMeeting && (
            <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
              <div className="glass-card" style={{ width: "90%", maxWidth: 520, padding: 24, background: "#FFFFFF" }}>
                <h3 style={{ fontSize: 18, marginBottom: 8, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle2 size={18} /> Complete Meeting: {completingMeeting.leadName || completingMeeting.leadId}
                </h3>
                <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
                  Summarize what happened during the meeting with the client. Upon saving, a personalized feedback survey link will be automatically dispatched across Telegram, WhatsApp, and Email.
                </p>

                <form onSubmit={handleCompleteSubmit}>
                  <div style={{ marginBottom: 16 }}>
                    <label className="field-label">Meeting Outcome & Summary Notes *</label>
                    <textarea
                      required
                      rows={4}
                      style={{ width: "100%", padding: 10, borderRadius: 10 }}
                      placeholder="e.g., Client loved 3BHK Kakkanad villa. Requested site visit for Saturday. Budget finalized at ₹1.2 Cr."
                      value={meetingSummaryText}
                      onChange={(e) => setMeetingSummaryText(e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button type="button" className="btn btn-secondary" style={{ borderRadius: 999 }} onClick={() => setCompletingMeeting(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: 999 }} disabled={isSubmittingComplete}>
                      {isSubmittingComplete ? "Dispatching..." : "Mark Completed & Send Feedback"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* IPHONE LIVE CHAT PREVIEW MODAL */}
          {selectedChatLead && (
            <IPhoneChatModal
              lead={selectedChatLead}
              onClose={() => setSelectedChatLead(null)}
              onRefresh={refresh}
            />
          )}
        </>
      )}
    </>
  );
}

function formatSlotLabel(timeStr) {
  if (!timeStr) return "";
  const [h] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:00 ${period}`;
}
