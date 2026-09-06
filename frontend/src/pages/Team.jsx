import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Topbar from "../components/Topbar.jsx";
import { Pill } from "../components/UI.jsx";
import { useUser } from "../context/UserContext.jsx";
import { UserPlus, ShieldAlert, KeyRound, CheckCircle2, XCircle, Lock, Unlock } from "lucide-react";

export default function Team() {
  const { refreshTeam } = useUser();
  const [team, setTeam] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [resetModal, setResetModal] = useState({ show: false, member: null, newPassword: "" });

  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "sales",
    title: "Property Specialist",
  });

  function refresh() {
    api.get("/team").then((data) => {
      setTeam(data);
      refreshTeam();
    });
  }

  useEffect(refresh, []);

  async function handleSubmit(e) {
    e.preventDefault();
    await api.post("/team", form);
    setForm({ name: "", email: "", username: "", password: "", role: "sales", title: "Property Specialist" });
    setShowForm(false);
    refresh();
  }

  async function toggleAccess(member) {
    const nextStatus = member.accessStatus === "access_denied" ? "active" : "access_denied";
    await api.patch(`/team/${member.id}/access-status`, { accessStatus: nextStatus });
    refresh();
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!resetModal.newPassword || !resetModal.member) return;

    try {
      await api.patch(`/team/${resetModal.member.id}/reset-password`, {
        newPassword: resetModal.newPassword,
      });
      alert(`Password reset successfully for ${resetModal.member.name}!`);
      setResetModal({ show: false, member: null, newPassword: "" });
      refresh();
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    }
  }

  return (
    <>
      <Topbar
        title="Team & Access Control"
        subtitle="Admin manages logins, access denial, reset passwords, and booking schedules for sales representatives."
        actions={
          <button className="cylinder-action-btn active" onClick={() => setShowForm((s) => !s)}>
            <UserPlus size={15} /> {showForm ? "Cancel" : "Add Sales Person"}
          </button>
        }
      />

      {/* Reset Password Modal */}
      {resetModal.show && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(15,23,42,0.4)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <form className="glass-card" style={{ width: 420, background: "#FFFFFF" }} onSubmit={handleResetPassword}>
            <h3 style={{ fontSize: 17, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: "#0F172A" }}>
              <KeyRound size={18} /> Reset Password: {resetModal.member?.name}
            </h3>
            <p style={{ fontSize: 12.5, color: "#64748B", marginBottom: 16 }}>
              Set a new security password for <strong>{resetModal.member?.email}</strong>.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label className="field-label">New Password *</label>
              <input
                type="password"
                required
                style={{ width: "100%" }}
                placeholder="Enter new password"
                value={resetModal.newPassword}
                onChange={(e) => setResetModal({ ...resetModal, newPassword: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn btn-secondary" style={{ borderRadius: 999 }} onClick={() => setResetModal({ show: false, member: null, newPassword: "" })}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: 999 }}>
                Confirm Password Reset
              </button>
            </div>
          </form>
        </div>
      )}

      {showForm && (
        <form className="glass-card" style={{ marginBottom: 20 }} onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: 14 }}>Create Sales Person Credentials</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label className="field-label">Full Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Vikram Sharma" />
            </div>
            <div>
              <label className="field-label">Email *</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="vikram@realtycrm.com" />
            </div>
            <div>
              <label className="field-label">Role Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Property Specialist" />
            </div>
            <div>
              <label className="field-label">Username *</label>
              <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="vikrams" />
            </div>
            <div>
              <label className="field-label">Password *</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            </div>
            <div>
              <label className="field-label">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="sales">Sales Representative</option>
                <option value="admin">Admin / Sales Manager</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16, borderRadius: 999 }} type="submit">
            Create User Login
          </button>
        </form>
      )}

      <div className="glass-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name & Title</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>System Access</th>
              <th>Admin Access Control</th>
            </tr>
          </thead>
          <tbody>
            {team.map((t) => {
              const isDenied = t.accessStatus === "access_denied";
              return (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div>{t.name}</div>
                    <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 400 }}>{t.title || "Property Advisor"}</div>
                  </td>
                  <td>{t.email}</td>
                  <td><code style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>{t.username || "—"}</code></td>
                  <td><Pill tone={t.role === "admin" ? "violet" : "success"}>{t.role.toUpperCase()}</Pill></td>
                  <td>
                    {isDenied ? (
                      <span style={{ background: "#FEF2F2", color: "#DC2626", padding: "4px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <XCircle size={13} /> Access Denied / Suspended
                      </span>
                    ) : (
                      <span style={{ background: "#ECFDF5", color: "#059669", padding: "4px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 size={13} /> Active Access
                      </span>
                    )}
                  </td>
                  <td>
                    {t.role !== "admin" && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ borderRadius: 999 }}
                          onClick={() => setResetModal({ show: true, member: t, newPassword: "" })}
                        >
                          <KeyRound size={13} /> Reset Pass
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{
                            borderRadius: 999,
                            background: isDenied ? "#ECFDF5" : "#FEF2F2",
                            color: isDenied ? "#059669" : "#DC2626",
                            border: isDenied ? "1px solid #A7F3D0" : "1px solid #FCA5A5",
                          }}
                          onClick={() => toggleAccess(t)}
                        >
                          {isDenied ? <><Unlock size={13} /> Grant Access</> : <><Lock size={13} /> Deny Access</>}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
