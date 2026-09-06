import { Router } from "express";
import { team, newId, saveToDisk } from "../data/store.js";

const router = Router();

// GET /api/team -> Fetch all team members
router.get("/", (req, res) => res.json(team));

// POST /api/team/login -> Authenticate sales rep or admin
router.post("/login", (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    return res.status(400).json({ error: "Username/Email and Password are required" });
  }

  const query = String(usernameOrEmail).trim().toLowerCase();
  const pass = String(password).trim();

  const member = team.find((t) => {
    const matchEmail = t.email && t.email.trim().toLowerCase() === query;
    const matchUsername = t.username && t.username.trim().toLowerCase() === query;
    const matchName = t.name && t.name.trim().toLowerCase() === query;
    const matchPass = t.password && String(t.password).trim() === pass;
    return (matchEmail || matchUsername || matchName) && matchPass;
  });

  if (!member) {
    return res.status(401).json({ error: "Invalid username/email or password" });
  }

  // Check access denial
  if (member.accessStatus === "access_denied") {
    return res.status(403).json({ error: "Access Denied: Your account has been suspended by Admin manager." });
  }

  res.json({
    ok: true,
    user: {
      id: member.id,
      name: member.name,
      email: member.email,
      username: member.username,
      role: member.role || "sales",
      title: member.title || "Property Advisor",
    },
  });
});

// Admin (sales manager) creates a new sales-person login.
router.post("/", (req, res) => {
  const { name, email, role, username, password, title } = req.body;
  const member = {
    id: newId("TEAM"),
    name,
    email,
    title: title || "Property Specialist",
    username: username || email.split("@")[0],
    password: password || "password123",
    role: role || "sales",
    accessStatus: "active",
    isAvailable: true,
    workingHours: { start: "10:00", end: "17:00" },
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    disabledDates: [],
    blockedSlots: [],
  };
  team.push(member);
  saveToDisk();
  res.status(201).json(member);
});

// Admin resets sales representative password
router.patch("/:id/reset-password", (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters long" });
  }

  const member = team.find((t) => t.id === req.params.id);
  if (!member) return res.status(404).json({ error: "Team member not found" });

  member.password = newPassword.trim();
  saveToDisk();
  res.json({ ok: true, message: `Password reset successfully for ${member.name}`, member });
});

// Admin toggles full access denial / grant
router.patch("/:id/access-status", (req, res) => {
  const { accessStatus } = req.body; // "active" | "access_denied"
  if (!["active", "access_denied"].includes(accessStatus)) {
    return res.status(400).json({ error: "Invalid access status" });
  }

  const member = team.find((t) => t.id === req.params.id);
  if (!member) return res.status(404).json({ error: "Team member not found" });

  member.accessStatus = accessStatus;
  saveToDisk();
  res.json({ ok: true, message: `Access status updated to ${accessStatus} for ${member.name}`, member });
});

// Admin changes own password
router.post("/admin-change-password", (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  const adminMember = team.find((t) => t.id === userId || t.role === "admin");
  if (!adminMember) return res.status(404).json({ error: "Admin account not found" });

  if (adminMember.password !== oldPassword.trim()) {
    return res.status(400).json({ error: "Current password is incorrect" });
  }

  adminMember.password = newPassword.trim();
  saveToDisk();
  res.json({ ok: true, message: "Admin password updated successfully" });
});

// Admin updates employee availability & working hours
router.patch("/:id/availability", (req, res) => {
  const member = team.find((t) => t.id === req.params.id);
  if (!member) return res.status(404).json({ error: "Team member not found" });

  const { isAvailable, workingHours, disabledDates, blockedSlots } = req.body;

  if (isAvailable !== undefined) member.isAvailable = Boolean(isAvailable);
  if (workingHours) member.workingHours = workingHours;
  if (disabledDates) member.disabledDates = disabledDates;
  if (blockedSlots) member.blockedSlots = blockedSlots;

  saveToDisk();
  res.json(member);
});

export default router;
