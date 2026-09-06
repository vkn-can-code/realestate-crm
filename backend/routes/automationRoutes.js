import { Router } from "express";
import db, { newUuid } from "../data/db.js";
import { getOverdueFollowUps, getTodayFollowUps, getUpcomingFollowUps, getStaleLeads } from "../services/followUpService.js";
import { evaluateAutomationRules, getDefaultAutomationRules } from "../services/automationRuleService.js";
import { leads } from "../data/store.js";

const router = Router();

// GET /api/follow-ups/overdue
router.get("/follow-ups/overdue", (req, res) => {
  try {
    const list = getOverdueFollowUps(db);
    res.json(list.length > 0 ? list : leads.filter((l) => l.followUpStatus === "Overdue"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/follow-ups/today
router.get("/follow-ups/today", (req, res) => {
  try {
    const list = getTodayFollowUps(db);
    res.json(list.length > 0 ? list : leads.filter((l) => l.nextActionDate && l.nextActionDate.startsWith(new Date().toISOString().split("T")[0])));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/follow-ups/upcoming
router.get("/follow-ups/upcoming", (req, res) => {
  try {
    const list = getUpcomingFollowUps(db);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/follow-ups/stale
router.get("/follow-ups/stale", (req, res) => {
  const days = parseInt(req.query.days || "3", 10);
  try {
    const list = getStaleLeads(db, days);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/automation-rules
router.get("/automation-rules", (req, res) => {
  try {
    let rules = db.prepare("SELECT * FROM automation_rules ORDER BY created_at DESC").all();
    if (rules.length === 0) {
      const defaults = getDefaultAutomationRules();
      for (const r of defaults) {
        db.prepare(`
          INSERT INTO automation_rules (id, name, trigger_event, delay_minutes, condition_json, action_type, automation_level, escalation_json, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(r.id, r.name, r.trigger_event, r.delay_minutes, r.condition_json, r.action_type, r.automation_level, r.escalation_json, r.is_active);
      }
      rules = db.prepare("SELECT * FROM automation_rules ORDER BY created_at DESC").all();
    }
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/automation-rules
router.post("/automation-rules", (req, res) => {
  const { name, triggerEvent, delayMinutes, condition, actionType, automationLevel, escalation } = req.body;
  if (!name || !triggerEvent || !actionType) {
    return res.status(400).json({ error: "Rule Name, Trigger Event, and Action Type are required." });
  }

  const id = `RULE-${newUuid().slice(0, 8)}`;
  try {
    db.prepare(`
      INSERT INTO automation_rules (id, name, trigger_event, delay_minutes, condition_json, action_type, automation_level, escalation_json, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      name,
      triggerEvent,
      delayMinutes || 0,
      typeof condition === "object" ? JSON.stringify(condition) : (condition || "{}"),
      actionType,
      automationLevel || "level_2_assisted",
      typeof escalation === "object" ? JSON.stringify(escalation) : (escalation || "{}")
    );

    const created = db.prepare("SELECT * FROM automation_rules WHERE id = ?").get(id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/automation-rules/:id/run
router.post("/automation-rules/:id/run", (req, res) => {
  const { id } = req.params;
  try {
    const rule = db.prepare("SELECT * FROM automation_rules WHERE id = ?").get(id);
    if (!rule) return res.status(404).json({ error: "Automation Rule not found." });

    const eligibleLeads = db.prepare("SELECT * FROM leads WHERE (dnd IS NULL OR dnd = 0) AND kanban_stage NOT IN ('Won', 'Lost', 'DND') LIMIT 20").all();
    let executedCount = 0;

    for (const lead of eligibleLeads) {
      evaluateAutomationRules(db, rule.trigger_event, lead);
      executedCount++;
    }

    res.json({ ok: true, ruleId: id, ruleName: rule.name, leadsProcessed: executedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
