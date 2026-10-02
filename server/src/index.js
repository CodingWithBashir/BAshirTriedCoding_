import "dotenv/config";
import { app } from "./app.js";
import { connectMongo } from "./storage.js";

const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, "0.0.0.0", () => {
  console.info(`[api] Coding With Bashir API listening on 0.0.0.0:${port}`);
});

// Start serving immediately; MongoDB can be unavailable in a preview sandbox.
await connectMongo();

function shutdown(signal) {
  console.info(`[api] received ${signal}; closing gracefully`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 7000).unref();
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
