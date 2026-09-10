import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const toolsRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down and try again shortly." } },
});
