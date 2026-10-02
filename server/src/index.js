import "./env.js";
import { app } from "./app.js";
import { bootstrapConfiguredOwner } from "./admin-auth.js";
import { connectMongo } from "./storage.js";

const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, "0.0.0.0", () => {
  console.info(`[api] Coding With Bashir API listening on 0.0.0.0:${port}`);
});

// Start serving immediately; managed hosts can check /api/health while services connect.
await connectMongo();
await bootstrapConfiguredOwner().catch((error) => console.error("[admin] bootstrap failed:", error.message));

function shutdown(signal) {
  console.info(`[api] received ${signal}; closing gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 7000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
