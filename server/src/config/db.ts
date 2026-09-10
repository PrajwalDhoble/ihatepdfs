import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * MongoDB is intentionally optional for the anonymous MVP (see Phase 0
 * architecture: "don't add MongoDB just because it exists"). Job state is
 * tracked in-memory/on-disk by the job service. If MONGO_URI is set, we
 * connect so future features (job history, users, analytics) can use it;
 * if not, the server runs fine without it.
 */
export async function connectDatabase(): Promise<void> {
  if (!env.mongoUri) {
    console.log("[db] MONGO_URI not set — running without MongoDB (anonymous MVP mode).");
    return;
  }

  try {
    await mongoose.connect(env.mongoUri);
    console.log("[db] Connected to MongoDB.");
  } catch (err) {
    console.error("[db] Failed to connect to MongoDB:", err);
    console.log("[db] Continuing without MongoDB — job history/persistence will be unavailable.");
  }
}
