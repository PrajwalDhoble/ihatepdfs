import { Router } from "express";
import { getAllTools } from "@shared/tools";
import { upload } from "../middleware/upload.js";
import { validateToolRequest } from "../middleware/validate.js";
import { toolsRateLimiter } from "../middleware/rateLimiter.js";
import { runTool } from "../controllers/toolsController.js";

const router = Router();

// GET /api/tools — powers client-side registry sync / health checks.
router.get("/", (_req, res) => {
  res.json({ tools: getAllTools() });
});

// POST /api/tools/:slug/run
router.post(
  "/:slug/run",
  toolsRateLimiter,
  upload.array("files", 20),
  validateToolRequest,
  runTool
);

export default router;
