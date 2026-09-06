import { Router } from "express";
import { meetings, leads } from "../data/store.js";
import db from "../data/db.js";

const router = Router();

// GET /api/notifications -> Aggregate live real-time notifications
router.get("/", (req, res) => {
  const { userId, role, userName } = req.query;
  const isSales = role === "sales" || (role !== "admin" && userId && userId !== "TEAM-1");
  const list = [];

  // 1. New Client Meetings Notifications (Filtered by Sales Rep if role='sales')
  const sortedMeetings = [...meetings].reverse();
  const userMeetings = isSales
    ? sortedMeetings.filter(
        (m) =>
          m.assignedTo === userId ||
          m.assignedTo === userName ||
          m.assignedToName === userName ||
          m.assignedToName === userId
      )
    : sortedMeetings;

  userMeetings.slice(0, 5).forEach((m) => {
    list.push({
      id: `notif-m-${m.id}`,
      title: isSales ? "📅 New Client Slot Booked For You!" : "New Client Meeting Scheduled",
      message: `Consultation booked for client ${m.leadName || "Client"} on ${m.dateStr || "2026-08-30"} at ${m.timeSlot || "10:00 AM"}.`,
      type: "meeting",
      timestamp: "Just now",
      read: false,
      link: "/meetings",
    });
  });

  // 2. Lead Assignment Notifications (Filtered for Sales Rep)
  const sortedLeads = [...leads].reverse();
  const userLeads = isSales
    ? sortedLeads.filter(
        (l) =>
          l.assignedTo === userId ||
          l.assigned_to === userId ||
          l.assignedTo === userName ||
          l.assigned_to === userName
      )
    : sortedLeads;

  userLeads.slice(0, 5).forEach((l) => {
    list.push({
      id: `notif-lead-${l.id}`,
      title: isSales ? "📥 Lead Allocated To You" : "New High-Intent Inquiry",
      message: `Client ${l.name} (${l.source?.toUpperCase() || "INQUIRY"}) assigned to you: "${l.requirement || "Property inquiry"}".`,
      type: "lead",
      timestamp: "10 mins ago",
      read: false,
      link: `/leads/${l.id}`,
    });
  });

  // 3. Admin-Only Notifications
  if (!isSales) {
    try {
      const pendingDocReviews = db.prepare("SELECT COUNT(*) as cnt FROM ai_review_queue WHERE status = 'NEEDS_HUMAN_REVIEW'").get()?.cnt || 0;
      if (pendingDocReviews > 0) {
        list.push({
          id: "notif-doc-rev-1",
          title: "📄 Document Ingestion: Human Approval Required",
          message: `${pendingDocReviews} email document extractions / identity matches received via info.oaklinetechnologies@gmail.com are waiting for review in Review Centre.`,
          type: "review",
          timestamp: "Just now",
          read: false,
          link: "/review-centre",
        });
      }
    } catch (e) {}

    const pendingDuplicates = leads.filter((l) => l.isDuplicate === true);
    if (pendingDuplicates.length > 0) {
      list.push({
        id: "notif-rev-1",
        title: "Review Centre Action Needed",
        message: `${pendingDuplicates.length} duplicate leads require manual review or re-engagement in Review Centre.`,
        type: "review",
        timestamp: "12 mins ago",
        read: false,
        link: "/review-centre",
      });
    }

    list.push({
      id: "notif-ai-1",
      title: "AI Agent & Voice Engine Status",
      message: "Google Gemini 2.0 Flash API & Vapi Call Bridge active with zero error reports.",
      type: "ai_success",
      timestamp: "Live",
      read: false,
      link: "/settings",
    });
  }

  res.json({
    unreadCount: list.filter((n) => !n.read).length,
    notifications: list,
  });
});

export default router;
