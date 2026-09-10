import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4000", 10),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  mongoUri: process.env.MONGO_URI ?? "", // optional in MVP — see server/src/config/db.ts
  tempDir: process.env.TEMP_DIR ?? "/tmp/repairmypdf",
  maxUploadMB: parseInt(process.env.MAX_UPLOAD_MB ?? "100", 10),
  jobExpiryMinutes: parseInt(process.env.JOB_EXPIRY_MINUTES ?? "60", 10),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "60000", 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? "30", 10),
};

export { required };
