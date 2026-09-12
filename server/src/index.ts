import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { startCleanupScheduler, stopCleanupScheduler } from "./utils/tempDir.js";
import { registerAllProcessors } from "./processors/register.js";
import { isCloudConvertConfigured } from "./processors/cloudConvertClient.js";

async function main() {
  registerAllProcessors();
  await connectDatabase();
  startCleanupScheduler();

  // Visibility into paid/system-dependent tool config at a glance, without
  // needing to run a conversion first just to find out something's unset.
  console.log(
    `[config] CloudConvert: ${
      isCloudConvertConfigured()
        ? `configured (key starts with "${env.cloudConvertApiKey.slice(0, 8)}...")`
        : "NOT configured — Office conversion, PDF->image, and OCR PDF will return a clear error"
    }`
  );

  const app = createApp();
  app.set("trust proxy", 1);
  const server = app.listen(env.port, () => {
    console.log(`[server] RepairMyPDF API listening on port ${env.port} (${env.nodeEnv})`);
  });

  function shutdown() {
    console.log("[server] Shutting down...");
    stopCleanupScheduler();
    server.close(() => process.exit(0));
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Without these, an uncaught exception or a rejected promise with no
  // .catch() anywhere in the call chain crashes the process silently (or
  // leaves it in an undefined state) with nothing but Node's default
  // one-line stack trace, if that. Logging explicitly here means a crash
  // in production actually leaves a trace to debug from, and exits
  // deliberately rather than limping on in a broken state.
  process.on("uncaughtException", (err) => {
    console.error("[fatal] Uncaught exception:", err);
    process.exit(1);
  });
  process.on("unhandledRejection", (reason) => {
    console.error("[fatal] Unhandled promise rejection:", reason);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
