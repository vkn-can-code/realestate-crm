import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useUser } from "../context/UserContext.jsx";
import {
  Inbox,
  ClipboardCheck,
  UploadCloud,
  Search,
  KanbanSquare,
  Calendar,
  FileText,
  Home,
  Palette,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  UserPlus,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

export default function Sidebar() {
  const { activeUser, isAdmin, logout } = useUser();
  const [reviewCount, setReviewCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("sidebar-expanded", isExpanded);
  }, [isExpanded]);

  useEffect(() => {
    fetch("/api/review-centre/count")
      .then((res) => (res.ok ? res.json() : { pendingCount: 0 }))
      .then((data) => setReviewCount(data.pendingCount || 0))
      .catch(() => {});
  }, []);

  const navItems = isAdmin
    ? [
        { to: "/", label: "Enquiry Dashboard", Icon: Inbox },
        { to: "/agent-recruitment", label: "Agent Recruitment AI", Icon: UserPlus },
        { to: "/market-intelligence", label: "Market & Competitor Intelligence", Icon: TrendingUp },
        { to: "/review-centre", label: "Review Centre", Icon: ClipboardCheck, badge: reviewCount },
        { to: "/bulk-import", label: "Bulk Import & Outreach", Icon: UploadCloud },
        { to: "/lead-search", label: "Lead Search", Icon: Search },
        { to: "/followups", label: "Follow-ups & Kanban", Icon: KanbanSquare },
        { to: "/meetings", label: "Booking Management", Icon: Calendar },
        { to: "/proposals", label: "Proposal Generator", Icon: FileText },
        { to: "/properties", label: "Property Inventory", Icon: Home },
        { to: "/social", label: "Social Media Studio", Icon: Palette },
        { to: "/team", label: "Team & Access", Icon: Users },
      ]
    : [
        { to: "/", label: "My Allocated Leads", Icon: Inbox },
        { to: "/followups", label: "My Follow-ups & Kanban", Icon: KanbanSquare },
        { to: "/lead-search", label: "Lead Search", Icon: Search },
        { to: "/meetings", label: "My Bookings & Visits", Icon: Calendar },
        { to: "/proposals", label: "Proposal Builder", Icon: FileText },
        { to: "/properties", label: "Property Inventory", Icon: Home },
        { to: "/social", label: "Social Media Studio", Icon: Palette },
      ];

  return (
    <aside className={`sidebar ${isExpanded ? "expanded" : ""}`}>
      {/* Top Brand Mark */}
      <div className="sidebar-logo-container">
        <div className="sidebar-brand-icon" title="RealtyPulse Real Estate Agency">
          p
        </div>
        {isExpanded && <span className="sidebar-brand-text">RealtyPulse</span>}
      </div>

      <button 
        className="sidebar-toggle-btn"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronLeft size={16} strokeWidth={3} /> : <ChevronRight size={16} strokeWidth={3} />}
      </button>

      {/* Floating Vertical Icon Navigation List */}
      <nav className="sidebar-nav-list">
        {navItems.map(({ to, label, Icon, badge }) => (
          <div key={to} className="tooltip-wrap" data-tooltip={label}>
            <NavLink
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-icon-pill${isActive ? " active" : ""}`}
            >
              <Icon size={20} strokeWidth={2.2} />
              {isExpanded && <span className="sidebar-label">{label}</span>}
              {badge > 0 && <span className="badge-dot" />}
            </NavLink>
          </div>
        ))}
      </nav>

      {/* Bottom Circular Actions */}
      <div className="sidebar-bottom-actions">
        <div className="tooltip-wrap" data-tooltip={`Settings & Profile: ${activeUser?.name || "Admin"}`}>
          <NavLink to="/settings" className="nav-icon-pill">
            <Settings size={20} strokeWidth={2.2} />
            {isExpanded && <span className="sidebar-label">Settings</span>}
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
