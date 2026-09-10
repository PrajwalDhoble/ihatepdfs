import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import toolsRoutes from "./routes/toolsRoutes.js";
import jobsRoutes from "./routes/jobsRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
    })
  );
  app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" })); // JSON bodies stay small; file bytes go through multer separately

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/tools", toolsRoutes);
  app.use("/api/jobs", jobsRoutes);
  app.use(seoRoutes); // serves /sitemap.xml and /robots.txt at the site root

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
