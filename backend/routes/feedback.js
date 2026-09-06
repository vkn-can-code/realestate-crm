import { Router } from "express";
import db, { newUuid } from "../data/db.js";
import { meetings, saveToDisk } from "../data/store.js";

const router = Router();

// Store feedback configuration in memory with defaults
let feedbackConfig = {
  title: "RealtyPulse Client Satisfaction Survey",
  subtitle: "Thank you for meeting with our real estate sales team! Please take 1 minute to share your feedback.",
  questions: [
    { id: "q1", text: "How satisfied were you with your sales consultation / site visit?", type: "rating" },
    { id: "q2", text: "Did our team address all your property requirements & budget questions?", type: "yes_no" },
    { id: "q3", text: "Additional comments or property preferences:", type: "text" },
  ],
};

const feedbackSubmissions = [];

// GET /api/feedback/config -> Retrieve feedback form layout config
router.get("/config", (req, res) => {
  res.json(feedbackConfig);
});

// POST /api/feedback/config -> Admin updates feedback form customizer settings
router.post("/config", (req, res) => {
  const { title, subtitle, questions } = req.body || {};
  if (title) feedbackConfig.title = title;
  if (subtitle) feedbackConfig.subtitle = subtitle;
  if (Array.isArray(questions)) feedbackConfig.questions = questions;
  res.json({ ok: true, feedbackConfig });
});

// POST /api/feedback/submit -> Public client feedback submission
router.post("/submit", (req, res) => {
  try {
    const { meetingId, clientName, phone, email, rating, answers, comments } = req.body || {};

    const submission = {
      id: `FB-${newUuid().slice(0, 8)}`,
      meetingId: meetingId || "GENERAL",
      clientName: clientName || "Valued Client",
      phone: phone || "",
      email: email || "",
      rating: Number(rating) || 5,
      answers: answers || {},
      comments: comments || "",
      submittedAt: new Date().toISOString(),
    };

    feedbackSubmissions.unshift(submission);

    // If meetingId provided, link feedback to meeting object
    if (meetingId) {
      const meeting = meetings.find((m) => m.id === meetingId);
      if (meeting) {
        meeting.clientFeedback = submission;
        saveToDisk();
      }
    }

    console.log(`⭐ [Client Feedback Received] Meeting ${meetingId || "N/A"} -> Rating: ${rating}/5 by ${clientName}`);

    res.json({ ok: true, submissionId: submission.id, message: "Thank you for your valuable feedback!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/feedback/responses -> Admin views all feedback responses
router.get("/responses", (req, res) => {
  res.json(feedbackSubmissions);
});

export default router;
