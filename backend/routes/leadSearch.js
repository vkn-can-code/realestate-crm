import { Router } from "express";
import webSearch from "../integrations/webSearch.js";

const router = Router();

// GET /api/lead-search?name=...
router.get("/", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "name is required" });
  try {
    const result = await webSearch.searchPerson({ name });
    res.json(result);
  } catch (err) {
    res.status(503).json({ error: err.message });
  }
});

export default router;
