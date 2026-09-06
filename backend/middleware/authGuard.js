import db from "../data/db.js";

/**
 * Authentication & RBAC Permission Guard Middleware
 * Verifies user role (admin vs sales) and enforces assignment isolation.
 */
export function extractUserContext(req, res, next) {
  const userId = req.headers["x-user-id"] || req.body?.userId || req.query?.userId || null;
  const userRole = req.headers["x-user-role"] || req.body?.userRole || req.query?.userRole || "sales";
  const userName = req.headers["x-user-name"] || req.body?.userName || req.body?.updatedByName || "User";

  req.user = {
    id: userId,
    role: userRole === "admin" ? "admin" : "sales",
    name: userName,
    isAdmin: userRole === "admin",
  };

  next();
}

/**
 * Lead Ownership Verification Guard
 * Ensures sales_rep can only view/edit leads assigned to them. Admin bypasses.
 */
export function verifyLeadOwnership(req, res, next) {
  const leadId = req.params.id || req.params.leadId || req.body.leadId;
  if (!leadId) return next();

  const user = req.user || { role: "sales", id: null };

  // Admin role can edit/view ANY lead
  if (user.role === "admin" || user.isAdmin) {
    return next();
  }

  // Find lead in SQLite DB
  const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(leadId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  // Check if lead is assigned to this sales rep
  if (lead.assigned_to !== user.id) {
    console.warn(`⛔ [403 Forbidden] User ${user.id} (${user.name}) attempted to access Lead ${leadId} assigned to ${lead.assigned_to || "Unassigned"}`);
    return res.status(403).json({
      error: "Permission denied: Sales representatives can only access or modify leads assigned to them.",
      leadId,
      assignedTo: lead.assigned_to,
    });
  }

  next();
}

export default { extractUserContext, verifyLeadOwnership };
