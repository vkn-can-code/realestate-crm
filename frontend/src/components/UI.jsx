import { Phone, Globe, Calendar, MessageSquare, Send, Pin, User, Bot, UploadCloud } from "lucide-react";

export function StatCard({ label, value, trend, icon: IconComponent }) {
  return (
    <div className="glass-card stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="label">{label}</div>
        {IconComponent && <IconComponent size={18} color="#64748B" />}
      </div>
      <div className="value">{value}</div>
      {trend && <div className="trend">{trend}</div>}
    </div>
  );
}

export function Pill({ children, tone = "violet" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function statusTone(status) {
  switch (status) {
    case "Closed Won":
    case "Completed":
      return "success";
    case "Negotiation":
    case "Meeting Scheduled":
      return "warning";
    case "Lost":
    case "Call Unanswered":
      return "danger";
    case "Contacted":
    case "Ongoing":
    default:
      return "violet";
  }
}

export function SourceTag({ source }) {
  const map = {
    call: { label: "Voice Call", className: "source-call", Icon: Phone },
    website: { label: "Website", className: "source-website", Icon: Globe },
    website_booking: { label: "Web Booking", className: "source-website", Icon: Calendar },
    whatsapp: { label: "WhatsApp", className: "source-whatsapp", Icon: MessageSquare },
    telegram: { label: "Telegram", className: "source-telegram", Icon: Send },
    manual: { label: "User Onboarded", className: "source-website", Icon: User },
    manual_telegram: { label: "Outreached via Telegram", className: "source-telegram", Icon: Send },
    manual_whatsapp: { label: "Outreached via WhatsApp", className: "source-whatsapp", Icon: MessageSquare },
    telegram_onboard: { label: "Outreached via Telegram", className: "source-telegram", Icon: Send },
    bulk_import: { label: "Bulk Excel Import", className: "source-website", Icon: UploadCloud },
    excel_import: { label: "Bulk Excel Import", className: "source-website", Icon: UploadCloud },
  };

  const item = map[source] || { label: source || "Direct", className: "source-call", Icon: Pin };
  const { Icon, label, className } = item;

  return (
    <span className={`source-tag ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <Icon size={13} strokeWidth={2.2} /> <span>{label}</span>
    </span>
  );
}

export function AttributionBadge({ lead }) {
  if (!lead) return null;
  const isVapi = lead.source === "call";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 11, color: "#64748B" }}>
      <span style={{ background: "#F1F5F9", padding: "2px 8px", borderRadius: 8, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
        <User size={12} /> {lead.assignedToName || "Unassigned"}
      </span>
      {isVapi && (
        <span style={{ background: "#EFF6FF", color: "#1D4ED8", padding: "2px 8px", borderRadius: 8, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
          <Bot size={12} /> Vapi AI Bot
        </span>
      )}
    </div>
  );
}
