import mongoose, { Schema } from "mongoose";

/**
 * Mirrors JobRecord in models/jobStore.ts. Not used by the active MVP flow
 * (which uses the in-memory store) — defined now so persisted job history
 * can be added later without a schema redesign, per the Phase 0 database
 * plan (MongoDB added only once a real need, like history, exists).
 */
const jobSchema = new Schema(
  {
    toolSlug: { type: String, required: true },
    status: { type: String, enum: ["queued", "processing", "done", "failed"], default: "queued" },
    outputFiles: { type: [String], default: [] },
    error: { type: String },
  },
  { timestamps: true }
);

export const JobModel = mongoose.models.Job || mongoose.model("Job", jobSchema);
