/**
 * Follow-Up Center & Stale Lead Detection Engine
 */

export function getOverdueFollowUps(db) {
  const nowIso = new Date().toISOString();
  try {
    return db.prepare(`
      SELECT * FROM leads
      WHERE (dnd IS NULL OR dnd = 0)
        AND kanban_stage NOT IN ('Won', 'Lost', 'DND')
        AND next_action_date IS NOT NULL
        AND next_action_date < ?
        AND (follow_up_status IS NULL OR follow_up_status != 'Completed')
      ORDER BY next_action_date ASC
    `).all(nowIso);
  } catch (e) {
    console.warn("[FollowUpService Overdue Error]", e.message);
    return [];
  }
}

export function getTodayFollowUps(db) {
  const todayStr = new Date().toISOString().split("T")[0];
  try {
    return db.prepare(`
      SELECT * FROM leads
      WHERE (dnd IS NULL OR dnd = 0)
        AND kanban_stage NOT IN ('Won', 'Lost', 'DND')
        AND next_action_date LIKE ?
      ORDER BY next_action_date ASC
    `).all(`${todayStr}%`);
  } catch (e) {
    console.warn("[FollowUpService Today Error]", e.message);
    return [];
  }
}

export function getUpcomingFollowUps(db) {
  const nowIso = new Date().toISOString();
  try {
    return db.prepare(`
      SELECT * FROM leads
      WHERE (dnd IS NULL OR dnd = 0)
        AND kanban_stage NOT IN ('Won', 'Lost', 'DND')
        AND next_action_date > ?
      ORDER BY next_action_date ASC
    `).all(nowIso);
  } catch (e) {
    console.warn("[FollowUpService Upcoming Error]", e.message);
    return [];
  }
}

export function getStaleLeads(db, daysThreshold = 3) {
  const cutoffDate = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  try {
    // Find leads with no interaction for > X days
    // Exclude: DND, Won, Lost, Nurture, future scheduled follow-up
    return db.prepare(`
      SELECT * FROM leads
      WHERE (dnd IS NULL OR dnd = 0)
        AND kanban_stage NOT IN ('Won', 'Lost', 'Nurture', 'DND')
        AND (
          (last_interaction_at IS NOT NULL AND last_interaction_at < ?)
          OR
          (last_interaction_at IS NULL AND created_at < ?)
        )
        AND (next_action_date IS NULL OR next_action_date <= ?)
      ORDER BY COALESCE(last_interaction_at, created_at) ASC
    `).all(cutoffDate, cutoffDate, nowIso);
  } catch (e) {
    console.warn("[FollowUpService Stale Error]", e.message);
    return [];
  }
}
