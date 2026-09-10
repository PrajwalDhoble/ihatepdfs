import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { env } from "./config/env.js";
import toolsRoutes from "./routes/toolsRoutes.js";
import jobsRoutes from "./routes/jobsRoutes.js";
import seoRoutes from "./routes/seoRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  // Behind a reverse proxy (nginx, a hosting platform's load balancer) in
  // production — without this, express-rate-limit and req.ip both see the
  // proxy's IP for every request instead of the real client, which breaks
  // rate limiting entirely (everyone shares one bucket).
  if (env.nodeEnv === "production") {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(compression());
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
