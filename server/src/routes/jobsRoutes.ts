import { Router } from "express";
import { getJobStatus, downloadJob } from "../controllers/jobsController.js";

const router = Router();

router.get("/:id", getJobStatus);
router.get("/:id/download", downloadJob);

export default router;
