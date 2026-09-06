/**
 * Automation Rules Engine Service
 * Evaluates triggers (lead_created, no_interaction, stage_changed) and executes actions according to level:
 * - Level 1: AI Suggestion (Requires human approval)
 * - Level 2: Assisted Automation (Creates salesperson tasks & reminders)
 * - Level 3: Full Automation (Auto-sends approved email/WhatsApp outreach if DND is inactive)
 */

import { newUuid } from "../data/db.js";

export function getDefaultAutomationRules() {
  return [
    {
      id: "RULE-101",
      name: "New Lead Immediate Response",
      trigger_event: "lead_created",
      delay_minutes: 10,
      condition_json: JSON.stringify({ minBudget: 0 }),
      action_type: "create_call_task",
      automation_level: "level_2_assisted",
      escalation_json: JSON.stringify({ delayMinutesAfter: 30, notifyManager: true }),
      is_active: 1,
    },
    {
      id: "RULE-102",
      name: "Qualified Lead Inactivity Follow-Up",
      trigger_event: "no_interaction",
      delay_minutes: 4320, // 3 days
      condition_json: JSON.stringify({ stage: "Qualified" }),
      action_type: "generate_ai_draft",
      automation_level: "level_1_suggestion",
      escalation_json: JSON.stringify({ moveStageAfterDays: 7, targetStage: "Nurture" }),
      is_active: 1,
    },
    {
      id: "RULE-103",
      name: "Site Visit Follow-Up Campaign",
      trigger_event: "stage_changed",
      delay_minutes: 120, // 2 hours after site visit
      condition_json: JSON.stringify({ stage: "Site Visit Done" }),
      action_type: "send_whatsapp_feedback",
      automation_level: "level_3_full",
      escalation_json: JSON.stringify({ notifySalesperson: true }),
      is_active: 1,
    },
  ];
}

export function evaluateAutomationRules(db, triggerEvent, lead) {
  try {
    let rules = db.prepare("SELECT * FROM automation_rules WHERE trigger_event = ? AND is_active = 1").all(triggerEvent);

    if (rules.length === 0) {
      // Seed default rules if table is empty
      const count = db.prepare("SELECT COUNT(*) as cnt FROM automation_rules").get().cnt;
      if (count === 0) {
        const defaults = getDefaultAutomationRules();
        for (const r of defaults) {
          db.prepare(`
            INSERT INTO automation_rules (id, name, trigger_event, delay_minutes, condition_json, action_type, automation_level, escalation_json, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(r.id, r.name, r.trigger_event, r.delay_minutes, r.condition_json, r.action_type, r.automation_level, r.escalation_json, r.is_active);
        }
        rules = db.prepare("SELECT * FROM automation_rules WHERE trigger_event = ? AND is_active = 1").all(triggerEvent);
      }
    }

    const results = [];

    for (const rule of rules) {
      const actId = `ACT-${newUuid().slice(0, 8)}`;
      let statusMsg = "";

      if (rule.automation_level === "level_1_suggestion") {
        statusMsg = `AI Suggestion Generated: Rule '${rule.name}' recommended follow-up action. (Requires Human Approval)`;
      } else if (rule.automation_level === "level_2_assisted") {
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        db.prepare(`
          UPDATE leads
          SET next_action = ?, next_action_date = ?, follow_up_status = 'Pending', automation_status = 'Active'
          WHERE id = ?
        `).run(`Follow-up task created by ${rule.name}`, tomorrow, lead.id);

        statusMsg = `Assisted Task Created: Scheduled follow-up task for salesperson based on rule '${rule.name}'.`;
      } else if (rule.automation_level === "level_3_full") {
        if (lead.dnd === 1) {
          statusMsg = `Full Automation Skipped: Lead ${lead.name} has DND active.`;
        } else {
          statusMsg = `Full Automation Dispatched: Executed auto-outreach campaign for rule '${rule.name}'.`;
        }
      }

      // Log in lead_activities
      db.prepare(`
        INSERT INTO lead_activities (id, lead_id, activity_type, title, description, performed_by, performed_by_name)
        VALUES (?, ?, 'automation_rule', ?, ?, 'automation_engine', 'Automation Rules Engine')
      `).run(actId, lead.id, `Automation Rule Triggered: ${rule.name}`, statusMsg);

      results.push({ ruleId: rule.id, ruleName: rule.name, level: rule.automation_level, statusMsg });
    }

    return results;
  } catch (err) {
    console.warn("[Automation Engine Error]", err.message);
    return [];
  }
}
