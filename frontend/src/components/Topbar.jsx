import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import { Search, Bell, Sparkles, Activity, AlertTriangle, Calendar, ClipboardCheck, Bot, UserPlus, Check, X, LogOut } from "lucide-react";

export default function Topbar({ title, subtitle, actions }) {
  const { activeUser, isAdmin, logout } = useUser();
  const [aiStatus, setAiStatus] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(3);

  const notifRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAiStatus() {
      try {
        const res = await fetch("/api/ai/status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setAiStatus(data);
        }
      } catch (err) {}
    }

    async function fetchNotifications() {
      try {
        const query = activeUser ? `?userId=${activeUser.id}&role=${activeUser.role}&userName=${encodeURIComponent(activeUser.name || "")}` : "";
        const res = await fetch(`/api/notifications${query}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
          }
        }
      } catch (err) {}
    }

    fetchAiStatus();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchAiStatus();
      fetchNotifications();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function getInitials(name) {
    if (!name) return "P";
    // Strip parenthetical role titles like "(Sales Manager)"
    const clean = name.replace(/\(.*\)/g, "").trim();
    if (!clean) return "P";
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "P";
    return parts[0][0].toUpperCase();
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function getNotifIcon(type) {
    switch (type) {
      case "meeting":
        return <Calendar size={16} color="#2563EB" />;
      case "review":
        return <ClipboardCheck size={16} color="#D97706" />;
      case "ai_warning":
        return <AlertTriangle size={16} color="#EF4444" />;
      case "ai_success":
        return <Bot size={16} color="#059669" />;
      case "lead":
      default:
        return <UserPlus size={16} color="#7C3AED" />;
    }
  }

  // Render Engine Provider Status Pill
  const isQuotaExceeded = aiStatus?.isQuotaExceeded;
  const lastProvider = aiStatus?.lastAnsweredBy || "n8n_ai";

  let badgeBg = "#ECFDF5";
  let badgeBorder = "#A7F3D0";
  let badgeColor = "#047857";
  let StatusIcon = Activity;
  let badgeLabel = "n8n AI Active";
  let tooltip = "n8n AI Agent is dynamically handling customer communications.";

  if (isQuotaExceeded || lastProvider === "system_fallback") {
    badgeBg = "#FEF3C7";
    badgeBorder = "#FDE68A";
    badgeColor = "#B45309";
    StatusIcon = AlertTriangle;
    badgeLabel = "Fallback Engine";
    tooltip = "Google Gemini rate limit reached. Fallback engine active.";
  } else if (lastProvider === "gemini_api") {
    badgeBg = "#EFF6FF";
    badgeBorder = "#BFDBFE";
    badgeColor = "#1D4ED8";
    StatusIcon = Sparkles;
    badgeLabel = "Gemini 2.0 Active";
    tooltip = "Direct Google Gemini API is generating dynamic AI replies.";
  }

  return (
    <header className="pro-navbar">
      {/* Left: Brand Logo & Page Title Header */}
      <div className="pro-navbar-left">
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#0F172A", fontFamily: "var(--font-heading)", letterSpacing: "-0.04em" }}>
            realtypulse
          </span>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }} />
        </div>
        <div style={{ width: 1, height: 20, background: "#CBD5E1", margin: "0 6px" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0, lineHeight: 1.2 }}>{title}</h1>
          {subtitle && <span style={{ fontSize: 11.5, color: "#475569", fontWeight: 600, marginTop: 2 }}>{subtitle}</span>}
        </div>
      </div>

      {/* Right: Right-Aligned Action Controls & Navigation Utilities */}
      <div className="pro-navbar-right" ref={notifRef}>
        {/* Page-Specific Action Buttons */}
        {actions && <div className="navbar-page-actions">{actions}</div>}

        {/* Live AI Status Badge */}
        {aiStatus && (
          <div
            className="navbar-ai-badge"
            title={tooltip}
            style={{
              background: badgeBg,
              border: `1px solid ${badgeBorder}`,
              color: badgeColor,
            }}
          >
            <StatusIcon size={13} />
            <span>{badgeLabel}</span>
          </div>
        )}

        {/* Quick Search Circular Button */}
        <button className="navbar-icon-btn" title="Quick Search">
          <Search size={16} strokeWidth={2.2} />
        </button>

        {/* Notification Bell Circular Button */}
        <button
          className="navbar-icon-btn"
          title="Notifications"
          onClick={() => setShowNotifications((s) => !s)}
        >
          <Bell size={16} strokeWidth={2.2} />
          {unreadCount > 0 && <span className="navbar-badge-count">{unreadCount}</span>}
        </button>

        {/* User Profile Circular Avatar Button */}
        {activeUser && (
          <div
            className="navbar-avatar-circle-btn"
            title={`Logged in as ${activeUser.name} (${isAdmin ? "Admin Manager" : "Sales Representative"})`}
          >
            {getInitials(activeUser.name)}
          </div>
        )}

        {/* Circular Logout Button */}
        <button onClick={logout} title="Sign Out of RealtyPulse CRM" className="navbar-logout-circle-btn">
          <LogOut size={16} strokeWidth={2.2} />
        </button>

        {/* Notification Dropdown Drawer */}
        {showNotifications && (
          <div
            className="glass-card"
            style={{
              position: "absolute",
              top: 54,
              right: 0,
              width: 380,
              background: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(28px)",
              border: "1px solid rgba(255, 255, 255, 0.95)",
              borderRadius: 24,
              boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
              padding: 18,
              zIndex: 9999,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: "#0F172A" }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ background: "#EF4444", color: "#FFF", fontSize: 10.5, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>
                    {unreadCount} New
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  style={{ background: "transparent", border: "none", color: "#2563EB", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Check size={13} /> Mark all read
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
              {notifications.map((n) => (
                <Link
                  key={n.id}
                  to={n.link}
                  onClick={() => setShowNotifications(false)}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 12,
                    borderRadius: 14,
                    background: n.read ? "#F8FAFC" : "#EFF6FF",
                    border: n.read ? "1px solid #E2E8F0" : "1px solid #BFDBFE",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ marginTop: 2 }}>{getNotifIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2, lineHeight: 1.3 }}>{n.message}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 6, fontWeight: 600 }}>{n.timestamp}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
