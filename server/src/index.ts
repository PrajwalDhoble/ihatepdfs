import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { startCleanupScheduler, stopCleanupScheduler } from "./utils/tempDir.js";
import { registerAllProcessors } from "./processors/register.js";

async function main() {
  registerAllProcessors();
  await connectDatabase();
  startCleanupScheduler();

  const app = createApp();
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
}

main().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
