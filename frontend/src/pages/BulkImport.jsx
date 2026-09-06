import { useState, useEffect } from "react";
import Topbar from "../components/Topbar.jsx";
import { UploadCloud, Zap, Send, CheckCircle2, AlertTriangle, Search, History, Download, UserPlus, UserCheck, MessageSquare, Mail, Phone, MapPin, DollarSign, Building, Calendar } from "lucide-react";

export default function BulkImport() {
  const [activeTab, setActiveTab] = useState("manual_onboard"); // "manual_onboard" | "bulk_upload"
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [timelineLeadId, setTimelineLeadId] = useState("");
  const [timelineEvents, setTimelineEvents] = useState(null);
  const [batchHistory, setBatchHistory] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  // Manual Client Onboarding Form State
  const [manualForm, setManualForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "telegram",
    listingIntent: "buy",
    location: "Kakkanad",
    budget: "₹80 Lakhs",
    propertyType: "3BHK Apartment",
    possession: "ready_to_move",
    requirement: "",
    assignedTo: "",
    sendOutreach: true,
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualResult, setManualResult] = useState(null);

  useEffect(() => {
    fetchBatchHistory();
    fetchTeamMembers();
  }, []);

  async function fetchBatchHistory() {
    try {
      const res = await fetch("/api/leads/import-process/batches");
      if (res.ok) {
        const data = await res.json();
        setBatchHistory(data.batches || []);
      }
    } catch (err) {
      console.error("[Fetch Batch History Error]", err);
    }
  }

  async function fetchTeamMembers() {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        setTeamMembers(data || []);
      }
    } catch (err) {
      console.error("[Fetch Team Error]", err);
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/leads/import-process/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "File upload failed");
      }

      const data = await res.json();
      setImportResult(data);
      fetchBatchHistory();
    } catch (err) {
      alert(`Import error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualForm.name || !manualForm.phone) {
      alert("Please provide client name and phone number.");
      return;
    }

    setManualSubmitting(true);
    setManualResult(null);

    try {
      const payload = { ...manualForm };
      if (payload.sendOutreach && payload.source === "telegram") {
        payload.sendTelegramOutbound = true;
        payload.telegramUsername = payload.phone;
        // Don't disable sendOutreach, so it logs properly, but outreachService handles WhatsApp natively and skips Telegram.
      }

      const res = await fetch("/api/leads/manual-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to onboard client");

      setManualResult(data);
      // Reset form fields
      setManualForm({
        name: "",
        phone: "",
        email: "",
        source: "telegram",
        listingIntent: "buy",
        location: "Kakkanad",
        budget: "₹80 Lakhs",
        propertyType: "3BHK Apartment",
        possession: "ready_to_move",
        requirement: "",
        assignedTo: "",
        sendOutreach: true,
      });
    } catch (err) {
      alert(`Onboarding error: ${err.message}`);
    } finally {
      setManualSubmitting(false);
    }
  }

  async function handleInspectTimeline() {
    if (!timelineLeadId.trim()) return;
    try {
      const res = await fetch(`/api/leads/${timelineLeadId.trim()}/timeline`);
      if (!res.ok) throw new Error("Lead timeline not found");
      const data = await res.json();
      setTimelineEvents(data.timeline || []);
    } catch (err) {
      alert(err.message);
      setTimelineEvents(null);
    }
  }

  function downloadErrorListCsv() {
    if (!importResult || !importResult.errors || importResult.errors.length === 0) return;

    let csvContent = "data:text/csv;charset=utf-8,RowNumber,Name,Phone,Reason\n";
    importResult.errors.forEach((e) => {
      csvContent += `${e.rowNumber},"${e.name}","${e.phone}","${e.reason}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `import_errors_batch_${importResult.batchId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <Topbar
        title="Client Onboarding & Lead Management Console"
        subtitle="Onboard single clients manually or bulk import lead datasets (Excel/CSV) with full real estate attributes."
      />

      {/* Tab Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${activeTab === "manual_onboard" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("manual_onboard")}
        >
          <UserPlus size={15} /> Single Client Manual Onboarding
        </button>
        <button
          className={`btn ${activeTab === "bulk_upload" ? "btn-primary" : "btn-secondary"}`}
          style={{ borderRadius: 999 }}
          onClick={() => setActiveTab("bulk_upload")}
        >
          <UploadCloud size={15} /> Bulk File Import (Excel / CSV)
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* MANUAL CLIENT ONBOARDING TAB */}
        {activeTab === "manual_onboard" && (
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 18, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              <UserPlus size={20} /> Manually Onboard Single Client
            </h3>
            <p style={{ margin: "0 0 20px 0", fontSize: 13, color: "#64748B" }}>
              Add client details manually to the CRM. Captures all real estate attributes (Email, Location, BHK, Budget, Possession, Channel).
            </p>

            {manualResult && (
              <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 16, padding: 18, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, color: "#047857", fontSize: 15, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <UserCheck size={18} /> Client Successfully Onboarded! ID: {manualResult.lead?.id}
                </div>
                <div style={{ fontSize: 13, color: "#0F172A", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div><strong>Name:</strong> {manualResult.lead?.name}</div>
                  <div><strong>Phone:</strong> {manualResult.lead?.phone}</div>
                  <div><strong>Email:</strong> {manualResult.lead?.email || "N/A"}</div>
                  <div><strong>Channel:</strong> {manualResult.lead?.source}</div>
                  <div><strong>Location:</strong> {manualResult.lead?.location || "Not specified"}</div>
                  <div><strong>Budget:</strong> {manualResult.lead?.budget || "Not specified"}</div>
                </div>
                {manualResult.outreachResult && (
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#2563EB" }}>
                    🚀 {manualResult.outreachResult}
                  </div>
                )}
                {manualResult.outreachError && (
                  <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "8px 12px" }}>
                    ⚠️ Outreach Error: {manualResult.outreachError}
                  </div>
                )}
              </div>
            )}


            <form onSubmit={handleManualSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
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
                  <label className="field-label">Phone / WhatsApp Number *</label>
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
                  <label className="field-label">Outreach Channel / Source</label>
                  <select
                    style={{ width: "100%" }}
                    value={manualForm.source}
                    onChange={(e) => setManualForm({ ...manualForm, source: e.target.value })}
                  >
                    <option value="telegram">Telegram Channel</option>
                    <option value="whatsapp">WhatsApp Outreach</option>
                    <option value="call">Inbound / Outbound Voice Call</option>
                    <option value="website">Website Inquiry Form</option>
                    <option value="manual">Manual Direct Entry</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Listing Intent / Category</label>
                  <select
                    style={{ width: "100%" }}
                    value={manualForm.listingIntent}
                    onChange={(e) => setManualForm({ ...manualForm, listingIntent: e.target.value })}
                  >
                    <option value="buy">BUY — Client Wants to Buy Property</option>
                    <option value="sell">SELL — Client Listing Property For Sale</option>
                    <option value="rent_in">RENT IN — Client Wants to Rent / Lease</option>
                    <option value="rent_out">RENT OUT — Client Listing Property For Rent</option>
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
                    placeholder="e.g. ₹80 Lakhs / ₹25,000 mo"
                    value={manualForm.budget}
                    onChange={(e) => setManualForm({ ...manualForm, budget: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Property Type & BHK Specs</label>
                  <input
                    style={{ width: "100%" }}
                    placeholder="e.g. 3BHK Villa / 2BHK Apartment"
                    value={manualForm.propertyType}
                    onChange={(e) => setManualForm({ ...manualForm, propertyType: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Possession Requirement</label>
                  <select
                    style={{ width: "100%" }}
                    value={manualForm.possession}
                    onChange={(e) => setManualForm({ ...manualForm, possession: e.target.value })}
                  >
                    <option value="ready_to_move">Ready to Move</option>
                    <option value="under_construction">Under Construction (Within 6-12 mos)</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Assign Sales Consultant</label>
                  <select
                    style={{ width: "100%" }}
                    value={manualForm.assignedTo}
                    onChange={(e) => setManualForm({ ...manualForm, assignedTo: e.target.value })}
                  >
                    <option value="">-- Unassigned (Pool) --</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.title || m.role})</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="field-label">Requirement Summary / Special Notes</label>
                  <input
                    style={{ width: "100%" }}
                    placeholder="e.g. Needs gated villa near Infopark with covered parking"
                    value={manualForm.requirement}
                    onChange={(e) => setManualForm({ ...manualForm, requirement: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: "#0F172A", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={manualForm.sendOutreach}
                    onChange={(e) => setManualForm({ ...manualForm, sendOutreach: e.target.checked })}
                  />
                  Send Immediate Welcome & Confirmation Greeting (WhatsApp / Telegram)
                </label>
              </div>

              <button
                type="submit"
                disabled={manualSubmitting}
                className="btn btn-primary"
                style={{ borderRadius: 999, padding: "12px 28px", fontSize: 14, fontWeight: 700 }}
              >
                {manualSubmitting ? "Onboarding Client..." : "Onboard Client & Save to CRM"}
              </button>
            </form>
          </div>
        )}

        {/* BULK FILE UPLOAD TAB */}
        {activeTab === "bulk_upload" && (
          <div className="glass-card">
            <h3 style={{ margin: "0 0 6px 0", fontSize: 17, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              <UploadCloud size={18} /> Upload Excel / CSV Lead Dataset
            </h3>
            <p style={{ margin: "0 0 18px 0", fontSize: 13, color: "#64748B" }}>
              Supports <code>.xlsx</code>, <code>.xls</code>, and <code>.csv</code> files. Automatic deduplication by phone number. New leads trigger one-time outreach.
            </p>

            <form onSubmit={handleUpload} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                style={{
                  background: "#FFFFFF",
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  color: "#0F172A",
                  fontSize: 13,
                }}
              />
              <button
                type="submit"
                disabled={!file || uploading}
                className="btn btn-primary"
                style={{
                  padding: "10px 22px",
                  fontWeight: 700,
                  borderRadius: 999,
                  opacity: !file || uploading ? 0.6 : 1,
                  cursor: !file || uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? <><Zap size={15} /> Processing Import...</> : <><Send size={15} /> Upload & Start Outreach</>}
              </button>
            </form>
          </div>
        )}

        {/* Import Results Summary Card */}
        {importResult && activeTab === "bulk_upload" && (
          <div className="glass-card" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h4 style={{ margin: 0, color: "#047857", fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={18} /> Import Summary — Batch #{importResult.batchId}
              </h4>
              <span style={{ fontSize: 12, color: "#475569" }}>File: {importResult.filename}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "#FFFFFF", padding: "12px 16px", borderRadius: 12, textAlign: "center", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>{importResult.summary.rowCount}</div>
                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Total Rows</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "12px 16px", borderRadius: 12, textAlign: "center", border: "1px solid #A7F3D0" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#059669" }}>{importResult.summary.newLeadsCount}</div>
                <div style={{ fontSize: 11, color: "#047857", textTransform: "uppercase", fontWeight: 700 }}>New Leads Added</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "12px 16px", borderRadius: 12, textAlign: "center", border: "1px solid #FDE68A" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#D97706" }}>{importResult.summary.duplicateCount}</div>
                <div style={{ fontSize: 11, color: "#B45309", textTransform: "uppercase", fontWeight: 700 }}>Duplicates Skipped</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "12px 16px", borderRadius: 12, textAlign: "center", border: "1px solid #FCA5A5" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#DC2626" }}>{importResult.summary.errorCount}</div>
                <div style={{ fontSize: 11, color: "#991B1B", textTransform: "uppercase", fontWeight: 700 }}>Errors / Flagged</div>
              </div>
            </div>

            {/* Downloadable Error List */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <AlertTriangle size={15} /> Flagged Rows ({importResult.errors.length}):
                  </span>
                  <button onClick={downloadErrorListCsv} className="btn btn-sm" style={{ background: "#DC2626", color: "#fff", borderRadius: 999 }}>
                    <Download size={13} /> Download Error List (.CSV)
                  </button>
                </div>
                <div style={{ maxHeight: 150, overflowY: "auto", background: "#FFFFFF", borderRadius: 10, padding: 12, fontSize: 12, color: "#0F172A", border: "1px solid #FCA5A5" }}>
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} style={{ padding: "4px 0", borderBottom: "1px solid #F1F5F9" }}>
                      Row #{err.rowNumber}: <strong>{err.name}</strong> ({err.phone}) — <span style={{ color: "#DC2626" }}>{err.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lead Activity Timeline Inspector */}
        <div className="glass-card">
          <h3 style={{ margin: "0 0 6px 0", fontSize: 17, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={18} /> Per-Lead Activity Timeline Inspector
          </h3>
          <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#64748B" }}>
            Inspect full chronological activity log for any lead ID.
          </p>

          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Enter Lead ID (e.g. LEAD-2a332ecf)..."
              value={timelineLeadId}
              onChange={(e) => setTimelineLeadId(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", borderRadius: 999, border: "1px solid #CBD5E1", fontSize: 13, background: "#FFFFFF" }}
            />
            <button onClick={handleInspectTimeline} className="btn btn-primary" style={{ borderRadius: 999 }}>
              View Timeline
            </button>
          </div>

          {timelineEvents && (
            <div style={{ background: "#FFFFFF", borderRadius: 12, padding: 16, border: "1px solid #E2E8F0" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: 14, color: "#0F172A" }}>Activity Events Log</h4>
              {timelineEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: "#64748B" }}>No activity logs recorded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {timelineEvents.map((evt, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "8px 12px", background: "#F8FAFC", borderRadius: 8, fontSize: 12.5, borderLeft: "3px solid #2563EB" }}>
                      <div style={{ fontWeight: 700, color: "#2563EB", width: 140 }}>{evt.eventType}</div>
                      <div style={{ flex: 1, color: "#0F172A" }}>{evt.details}</div>
                      <div style={{ color: "#94A3B8" }}>{new Date(evt.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Batch History Card */}
        <div className="glass-card">
          <h3 style={{ margin: "0 0 16px 0", fontSize: 17, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <History size={18} /> Import Batch History
          </h3>

          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Filename</th>
                  <th>Uploaded By</th>
                  <th>Total Rows</th>
                  <th>New Leads</th>
                  <th>Duplicates</th>
                  <th>Errors</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {batchHistory.map((b) => (
                  <tr key={b.id}>
                    <td><code style={{ fontWeight: 700, color: "#2563EB" }}>{b.id}</code></td>
                    <td>{b.filename}</td>
                    <td>{b.uploadedByName}</td>
                    <td>{b.summary?.rowCount || 0}</td>
                    <td style={{ fontWeight: 700, color: "#059669" }}>{b.summary?.newLeadsCount || 0}</td>
                    <td style={{ color: "#D97706" }}>{b.summary?.duplicateCount || 0}</td>
                    <td style={{ color: "#DC2626" }}>{b.summary?.errorCount || 0}</td>
                    <td style={{ color: "#64748B" }}>{new Date(b.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
