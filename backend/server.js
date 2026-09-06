import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import morgan from "morgan";
import { WebSocketServer } from "ws";

import leadsRouter from "./routes/leads.js";
import propertiesRouter from "./routes/properties.js";
import followupsRouter from "./routes/followups.js";
import meetingsRouter from "./routes/meetings.js";
import proposalsRouter from "./routes/proposals.js";
import teamRouter from "./routes/team.js";
import socialRouter from "./routes/social.js";
import leadSearchRouter from "./routes/leadSearch.js";
import aiRouter from "./routes/aiRoutes.js";
import vapiRouter from "./routes/vapiRoutes.js";
import exotelRouter, { handleExotelWebSocketConnection } from "./routes/exotelRoutes.js";
import importLeadsRouter from "./routes/importLeads.js";
import inboundCallWebhookRouter from "./routes/inboundCallWebhook.js";
import reviewCentreRouter from "./routes/reviewCentre.js";
import feedbackRouter from "./routes/feedback.js";
import notificationsRouter from "./routes/notifications.js";
import marketIntelligenceRouter from "./routes/marketIntelligenceRoutes.js";
import recruitmentRouter from "./routes/recruitmentRoutes.js";
import automationRouter from "./routes/automationRoutes.js";
import communicationRouter from "./routes/communicationRoutes.js";
import documentsRouter from "./routes/documents.js";

import { startTelegram } from "./integrations/telegram.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true })); // Handle Twilio & Exotel urlencoded webhooks
app.use("/public", express.static("public"));
app.use("/proposals", express.static("public/proposals"));
app.use("/posters", express.static("public/posters"));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/leads", leadsRouter);
app.use("/api/properties", propertiesRouter);
app.use("/api/followups", followupsRouter);
app.use("/api/meetings", meetingsRouter);
app.use("/api/proposals", proposalsRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/team", teamRouter);
app.use("/api/social", socialRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/lead-search", leadSearchRouter);
app.use("/api/ai", aiRouter);
app.use("/api/vapi", vapiRouter);
app.use("/api/exotel", exotelRouter);
app.use("/api/leads/import-process", importLeadsRouter);
app.use("/api/webhooks", inboundCallWebhookRouter);
app.use("/api/review-centre", reviewCentreRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/market-intelligence", marketIntelligenceRouter);
app.use("/api/recruitment", recruitmentRouter);
app.use("/api/communications", communicationRouter);
app.use("/api", automationRouter);

const server = http.createServer(app);

// WebSocket Server for Exotel Voicebot WebSocket stream connections
const wss = new WebSocketServer({ server });

wss.on("connection", (ws, req) => {
  console.log(`⚡ [Exotel WebSocket Connected] Path: ${req.url}, Headers:`, JSON.stringify(req.headers));
  handleExotelWebSocketConnection(ws, req);
});

server.listen(PORT, async () => {
  console.log(`Real Estate CRM API running on http://localhost:${PORT}`);

  try {
    await startTelegram();
  } catch (error) {
    console.error("Telegram startup failed:", error);
  }

  // Native Follow-Up & Automation Cron (Runs every 6 hours natively without n8n dependency)
  setInterval(async () => {
    try {
      const { default: db } = await import("./data/db.js");
      const { getStaleLeads } = await import("./services/followUpService.js");
      const { evaluateAutomationRules } = await import("./services/automationRuleService.js");

      const stale = getStaleLeads(db, 3);
      if (stale.length > 0) {
        console.log(`⏰ [Native Follow-Up Engine] Evaluating ${stale.length} stale leads natively...`);
        stale.forEach((l) => evaluateAutomationRules(db, "stale_lead_detected", l));
      }
    } catch (err) {
      console.warn(`[Native Followup Cron Note] ${err.message}`);
    }
  }, 6 * 60 * 60 * 1000);
});
