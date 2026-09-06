import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext.jsx";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import { User, Lock, Key, ShieldCheck, Save, CheckCircle2, AlertCircle, Mail, MessageSquare, Send, RefreshCw, Zap, Check, Play } from "lucide-react";

export default function Settings() {
  const { activeUser, isAdmin } = useUser();
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profile, setProfile] = useState({
    name: activeUser?.name || "Admin (Sales Manager)",
    email: activeUser?.email || "admin@realtycrm.com",
    username: activeUser?.username || "admin",
    role: "System Administrator & Sales Manager",
    companyName: "RealtyPulse Real Estate Agency",
    phone: "+91 9633541720",
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Communication Channels & Test Mode State
  const [channels, setChannels] = useState([]);
  const [testEmailForm, setTestEmailForm] = useState({
    senderEmail: "rajesh.kumar@example.com",
    senderName: "Rajesh Kumar",
    subject: "Inquiry regarding 3BHK Villa in Kakkanad",
    body: "Hi Team, I am interested in looking at ready-to-move 3BHK villas in Kakkanad with budget under 1.2 Crore.",
  });
  const [testIngesting, setTestIngesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/communications/channels");
      if (res.ok) {
        const data = await res.json();
        setChannels(data || []);
      }
    } catch (err) {
      console.error("[Fetch Channels Error]", err);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setMsg("");
    setError("");

    if (!passwords.oldPassword || !passwords.newPassword) {
      setError("Please fill in current and new password fields.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (passwords.newPassword.length < 4) {
      setError("New password must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/team/${activeUser.id}/password`, {
        currentPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });

      setMsg("Admin password updated & saved successfully!");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(`Update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestEmailIngest(e) {
    e.preventDefault();
    setTestIngesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/communications/email/test-ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testEmailForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email ingestion failed");

      setTestResult(data);
    } catch (err) {
      alert(`Test ingestion error: ${err.message}`);
    } finally {
      setTestIngesting(false);
    }
  }

  return (
    <>
      <Topbar
        title="Admin Settings & Communication Channels"
        subtitle="Configure 24/7 channel ingestion, email monitoring (info.oaklinetechnologies@gmail.com), security credentials, and identity matching."
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* COMMUNICATION CHANNELS CONFIGURATION CARD */}
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 18, margin: 0, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={20} /> Communication Channels & Ingestion Status
              </h3>
              <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                Monitors incoming messages 24/7 to link communications directly to Unified Client Profiles.
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" style={{ borderRadius: 999 }} onClick={fetchChannels}>
              <RefreshCw size={13} /> Refresh Channels Status
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            {/* EMAIL CHANNEL CARD */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ background: "#EA4335", color: "#FFF", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mail size={16} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>Company Email</span>
                </div>
                <span className="pill pill-success" style={{ fontSize: 10, fontWeight: 800 }}>CONNECTED</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#334155", fontWeight: 700, marginBottom: 4 }}>
                info.oaklinetechnologies@gmail.com
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12 }}>
                Provider: Gmail / IMAP API · Status: Active Monitoring
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669", fontWeight: 700 }}>
                <CheckCircle2 size={13} /> 24/7 Automated Ingestion Enabled
              </div>
            </div>

            {/* WHATSAPP CHANNEL CARD */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ background: "#25D366", color: "#FFF", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MessageSquare size={16} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>WhatsApp Business</span>
                </div>
                <span className="pill pill-success" style={{ fontSize: 10, fontWeight: 800 }}>CONNECTED</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#334155", fontWeight: 700, marginBottom: 4 }}>
                +91 96335 41720
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12 }}>
                Provider: Meta Cloud API · Status: Active Monitoring
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669", fontWeight: 700 }}>
                <CheckCircle2 size={13} /> Live Webhook Connected
              </div>
            </div>

            {/* TELEGRAM CHANNEL CARD */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ background: "#0088cc", color: "#FFF", width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Send size={16} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 14, color: "#0F172A" }}>Telegram Channel</span>
                </div>
                <span className="pill pill-success" style={{ fontSize: 10, fontWeight: 800 }}>CONNECTED</span>
              </div>
              <div style={{ fontSize: 12.5, color: "#334155", fontWeight: 700, marginBottom: 4 }}>
                @Oaklinetechnologies
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", marginBottom: 12 }}>
                Bot ID: 8764560822 · Status: Active Monitoring
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669", fontWeight: 700 }}>
                <CheckCircle2 size={13} /> MTProto Adapter Listening
              </div>
            </div>
          </div>

          {/* TEST MODE EMAIL INGESTION CONSOLE */}
          <div style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(79, 70, 229, 0.06) 100%)", border: "1px solid #BFDBFE", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: 15, color: "#1E40AF", display: "flex", alignItems: "center", gap: 8 }}>
                <Play size={16} /> Test Mode: Process Incoming Email & Identity Matching Engine
              </h4>
              <span className="pill pill-violet" style={{ fontSize: 10.5 }}>Test Ingestion Console</span>
            </div>

            <form onSubmit={handleTestEmailIngest}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="field-label">Sender Email *</label>
                  <input
                    required
                    style={{ width: "100%" }}
                    value={testEmailForm.senderEmail}
                    onChange={(e) => setTestEmailForm({ ...testEmailForm, senderEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Sender Name *</label>
                  <input
                    required
                    style={{ width: "100%" }}
                    value={testEmailForm.senderName}
                    onChange={(e) => setTestEmailForm({ ...testEmailForm, senderName: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="field-label">Email Subject</label>
                  <input
                    style={{ width: "100%" }}
                    value={testEmailForm.subject}
                    onChange={(e) => setTestEmailForm({ ...testEmailForm, subject: e.target.value })}
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="field-label">Email Body Content</label>
                  <textarea
                    rows={2}
                    style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #CBD5E1" }}
                    value={testEmailForm.body}
                    onChange={(e) => setTestEmailForm({ ...testEmailForm, body: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={testIngesting} className="btn btn-primary" style={{ borderRadius: 999 }}>
                {testIngesting ? "Ingesting & Matching..." : "Simulate Incoming Email Intake"}
              </button>
            </form>

            {testResult && (
              <div style={{ marginTop: 16, background: "#FFFFFF", border: "1px solid #A7F3D0", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#047857", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle2 size={16} /> Email Successfully Ingested & Matched!
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, fontSize: 12.5, color: "#0F172A" }}>
                  <div><strong>Unified Client ID:</strong> <code style={{ color: "#2563EB" }}>{testResult.clientId}</code></div>
                  <div><strong>Match Method:</strong> {testResult.matchMethod}</div>
                  <div><strong>Confidence Score:</strong> {(testResult.confidenceScore * 100).toFixed(0)}%</div>
                  <div><strong>Client Name:</strong> {testResult.matchedClient?.primary_name}</div>
                  <div><strong>Communication ID:</strong> {testResult.commId}</div>
                  <div><strong>Status:</strong> {testResult.matchStatus}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PROFILE & SECURITY CREDENTIALS TWO-COL */}
        <div className="two-col">
          {/* Left Column: Admin Profile Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="glass-card">
              <h3 style={{ fontSize: 17, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: "#0F172A" }}>
                <User size={18} /> Admin Account Profile
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="field-label">Administrator Name</label>
                  <input style={{ width: "100%" }} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                </div>

                <div>
                  <label className="field-label">Primary Email Address</label>
                  <input style={{ width: "100%" }} value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="field-label">Username</label>
                    <input style={{ width: "100%" }} value={profile.username} disabled />
                  </div>
                  <div>
                    <label className="field-label">Role Privilege</label>
                    <input style={{ width: "100%" }} value={isAdmin ? "Super Admin" : "Sales Rep"} disabled />
                  </div>
                </div>

                <div>
                  <label className="field-label">Agency / Enterprise Name</label>
                  <input style={{ width: "100%" }} value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
                </div>

                <div>
                  <label className="field-label">Contact Phone</label>
                  <input style={{ width: "100%" }} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Change Password Credentials */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <form className="glass-card" onSubmit={handlePasswordChange}>
              <h3 style={{ fontSize: 17, marginBottom: 14, display: "flex", alignItems: "center", gap: 8, color: "#0F172A" }}>
                <Lock size={18} /> Change Admin Password
              </h3>
              <p style={{ fontSize: 12.5, color: "#64748B", marginBottom: 16 }}>
                Update your security credentials for logging into the Admin Management Portal.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                <div>
                  <label className="field-label">Current Admin Password *</label>
                  <input
                    type="password"
                    required
                    style={{ width: "100%" }}
                    placeholder="Enter current password"
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">New Password *</label>
                  <input
                    type="password"
                    required
                    style={{ width: "100%" }}
                    placeholder="Enter new password (min 4 chars)"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  />
                </div>

                <div>
                  <label className="field-label">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    style={{ width: "100%" }}
                    placeholder="Re-type new password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <div style={{ marginBottom: 14, fontSize: 13, color: "#EF4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              {msg && (
                <div style={{ marginBottom: 14, fontSize: 13, color: "#059669", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={15} /> {msg}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center", borderRadius: 999 }}
              >
                <Save size={16} /> {loading ? "Updating Credentials..." : "Update Security Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
