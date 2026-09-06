import { useState, useEffect } from "react";
import Topbar from "../components/Topbar.jsx";
import { useUser } from "../context/UserContext.jsx";
import { Sparkles, Ban, Zap, FileText, UploadCloud, History, CheckCircle2, Mail, Check, X, ShieldAlert, FileCheck, Eye, RefreshCw } from "lucide-react";

export default function ReviewCentre() {
  const { activeUser } = useUser();
  const [activeTab, setActiveTab] = useState("documents"); // documents, duplicates
  const [docQueue, setDocQueue] = useState([]);
  const [duplicateItems, setDuplicateItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  const loadAllQueues = async () => {
    setLoading(true);
    try {
      const [docRes, dupRes] = await Promise.all([
        fetch("/api/communications/review-queue").then((r) => (r.ok ? r.json() : [])),
        fetch("/api/review-centre").then((r) => (r.ok ? r.json() : [])),
      ]);

      setDocQueue(docRes || []);
      setDuplicateItems(dupRes || []);
    } catch (err) {
      console.error("[Review Centre Load Error]", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllQueues();
  }, []);

  const handleDocAction = async (id, action) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/communications/review-queue/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, resolvedByName: activeUser?.name || "Admin Manager" }),
      });

      if (res.ok) {
        setActionMsg(`✅ Document extraction item #${id} resolved (${action}). Saved to Client 360 Vault.`);
        loadAllQueues();
      }
    } catch (err) {
      alert(`Action error: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDuplicateAction = async (id, actionType) => {
    setActionInProgress(id);
    try {
      const res = await fetch(`/api/review-centre/${id}/${actionType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedBy: activeUser?.name || "Admin Manager" }),
      });

      if (res.ok) {
        setActionMsg(`✅ Duplicate lead action applied (${actionType}).`);
        loadAllQueues();
      }
    } catch (err) {
      alert(`Action error: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <>
      <Topbar
        title="AI Review Centre & Human Approval Hub"
        subtitle="Approve email document extractions (KYC, Contracts, Post-Possession Docs) and resolve duplicate lead imports."
      />

      {actionMsg && (
        <div className="glass-card" style={{ marginBottom: 16, fontSize: 13, color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
          {actionMsg}
        </div>
      )}

      {/* SUB-TABS NAVIGATION BAR */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab("documents")}
          className="btn"
          style={{
            borderRadius: 999,
            fontSize: 13,
            fontWeight: activeTab === "documents" ? 800 : 600,
            background: activeTab === "documents" ? "#2563EB" : "#F1F5F9",
            color: activeTab === "documents" ? "#FFFFFF" : "#334155",
          }}
        >
          <FileText size={15} /> 1. Email Document Extractions ({docQueue.length})
        </button>

        <button
          onClick={() => setActiveTab("duplicates")}
          className="btn"
          style={{
            borderRadius: 999,
            fontSize: 13,
            fontWeight: activeTab === "duplicates" ? 800 : 600,
            background: activeTab === "duplicates" ? "#2563EB" : "#F1F5F9",
            color: activeTab === "duplicates" ? "#FFFFFF" : "#334155",
          }}
        >
          <UploadCloud size={15} /> 2. Duplicate Lead Re-Imports ({duplicateItems.length})
        </button>
      </div>

      {/* TAB 1: EMAIL DOCUMENT EXTRACTIONS & HUMAN APPROVAL HUB */}
      {activeTab === "documents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* ACCEPTED POST-POSSESSION DOCUMENTS GUIDANCE CONTAINER */}
          <div className="glass-card" style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(124, 58, 237, 0.05) 100%)", border: "1px solid #BFDBFE" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: 15, color: "#1E40AF", display: "flex", alignItems: "center", gap: 8 }}>
              <FileCheck size={18} /> Accepted Email Document Formats & Post-Possession Categories
            </h4>
            <p style={{ fontSize: 12.5, color: "#475569", marginBottom: 12 }}>
              Supported file formats: <code>.pdf</code>, <code>.docx</code>, <code>.doc</code>, <code>.png</code>, <code>.jpg</code>, <code>.jpeg</code>. Documents received via <code>info.oaklinetechnologies@gmail.com</code> are automatically parsed by Gemini OCR and placed here for human approval before landing in the static Client 360 Vault.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12, color: "#1E293B" }}>
              <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <strong>🔑 Post-Possession & Handover:</strong>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>Possession Certificate, Key Handover Sign-off, Site Inspection Acceptance</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <strong>📜 Legal & Title Deeds:</strong>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>Deed of Conveyance, Sale Deed, Property Registration Records</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 10, border: "1px solid #E2E8F0" }}>
                <strong>💰 Closing Financials:</strong>
                <div style={{ color: "#64748B", fontSize: 11, marginTop: 2 }}>Settlement Statement (CD/HUD-1), Payment Receipts, HOA Transfer Records</div>
              </div>
            </div>
          </div>

          {/* QUEUE LIST */}
          {loading ? (
            <div style={{ color: "#64748B", padding: 32, textAlign: "center" }}>Loading document review queue...</div>
          ) : docQueue.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <CheckCircle2 size={48} color="#059669" />
              </div>
              <h3 style={{ margin: "0 0 8px 0", color: "#0F172A" }}>No Pending Document Reviews</h3>
              <p style={{ margin: 0, color: "#64748B", fontSize: 14 }}>
                All incoming email document extractions have been reviewed and approved into Client 360 Vaults.
              </p>
            </div>
          ) : (
            docQueue.map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 17, fontWeight: 800, color: "#0F172A" }}>{item.title}</span>
                      <span className="pill pill-violet" style={{ fontSize: 11 }}>
                        {(item.confidenceScore * 100).toFixed(0)}% AI Confidence
                      </span>
                      <span className="pill pill-info" style={{ fontSize: 11 }}>
                        Source: {item.source_channel}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 4 }}>
                      Received via <strong>info.oaklinetechnologies@gmail.com</strong> on {new Date(item.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => handleDocAction(item.id, "APPROVED")}
                      disabled={actionInProgress === item.id}
                      className="btn btn-primary"
                      style={{ borderRadius: 999 }}
                    >
                      <Check size={15} /> Approve & Save to Client 360
                    </button>
                    <button
                      onClick={() => handleDocAction(item.id, "REJECTED")}
                      disabled={actionInProgress === item.id}
                      className="btn btn-ghost"
                      style={{ color: "#DC2626", borderRadius: 999 }}
                    >
                      <X size={15} /> Reject Extraction
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Current CRM Value */}
                  <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 14, border: "1px solid #E2E8F0" }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#64748B", marginBottom: 6 }}>Current CRM Value</div>
                    <pre style={{ fontSize: 12, color: "#0F172A", background: "#FFFFFF", padding: 10, borderRadius: 8, overflowX: "auto" }}>
                      {JSON.stringify(item.currentValue, null, 2)}
                    </pre>
                  </div>

                  {/* AI Extracted Suggested Value */}
                  <div style={{ background: "#EFF6FF", borderRadius: 12, padding: 14, border: "1px solid #BFDBFE" }}>
                    <div style={{ fontWeight: 700, fontSize: 12.5, color: "#1D4ED8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      <Sparkles size={14} /> AI Extracted Proposed Value
                    </div>
                    <pre style={{ fontSize: 12, color: "#0F172A", background: "#FFFFFF", padding: 10, borderRadius: 8, overflowX: "auto" }}>
                      {JSON.stringify(item.aiSuggestedValue, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: DUPLICATE LEAD RE-IMPORTS */}
      {activeTab === "duplicates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {loading ? (
            <div style={{ color: "#64748B", padding: 32, textAlign: "center" }}>Loading duplicate queue...</div>
          ) : duplicateItems.length === 0 ? (
            <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <CheckCircle2 size={48} color="#059669" />
              </div>
              <h3 style={{ margin: "0 0 8px 0", color: "#0F172A" }}>No Pending Duplicate Reviews</h3>
              <p style={{ margin: 0, color: "#64748B", fontSize: 14 }}>
                All re-imported duplicate leads have been resolved.
              </p>
            </div>
          ) : (
            duplicateItems.map((item) => {
              const lead = item.existingLead || {};
              const newRow = item.newRowData || {};

              return (
                <div key={item.id} className="glass-card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>{lead.name || "Existing Lead"}</span>
                        <span className="pill pill-violet" style={{ textTransform: "uppercase" }}>Stage: {lead.kanban_stage || lead.status || "new"}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Phone: <strong>{lead.phone}</strong></div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleDuplicateAction(item.id, "resolve_skip")} disabled={actionInProgress === item.id} className="btn btn-secondary" style={{ borderRadius: 999 }}>
                        Skip
                      </button>
                      <button onClick={() => handleDuplicateAction(item.id, "resolve_reengage")} disabled={actionInProgress === item.id} className="btn btn-primary" style={{ borderRadius: 999 }}>
                        Re-engage
                      </button>
                      <button onClick={() => handleDuplicateAction(item.id, "resolve_dnd")} disabled={actionInProgress === item.id} className="btn btn-ghost" style={{ color: "#DC2626", borderRadius: 999 }}>
                        Mark DND
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}
