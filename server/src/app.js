import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { adminRouter } from "./admin.js";
import { findBySlug, listContent, mongoConnected, saveMessage } from "./storage.js";

export const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({ crossOriginEmbedderPolicy: false }));

const configuredOrigins = [process.env.FRONTEND_ORIGINS, process.env.CLIENT_ORIGIN]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const local = process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const arenaPreview = process.env.NODE_ENV !== "production" && /^https:\/\/[a-z0-9-]+\.e2b\.(app|dev)$/i.test(origin);
    callback(null, local || arenaPreview || configuredOrigins.includes(origin.replace(/\/$/, "")));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "X-Requested-With"],
  maxAge: 600,
}));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many messages just now. Please try again in a little while." },
});
const collections = new Set(["projects", "courses", "certificates", "articles", "testimonials"]);

app.get("/api/health", (_request, response) => {
  const ready = process.env.NODE_ENV !== "production" || mongoConnected;
  response.status(ready ? 200 : 503).json({
    ok: ready,
    service: "coding-with-bashir-api",
    database: mongoConnected ? "mongodb" : "local-preview",
    environment: process.env.NODE_ENV || "development",
    ...(ready ? {} : { error: "MongoDB is required in production. Configure MONGODB_URI before serving persistent API traffic." }),
    time: new Date().toISOString(),
  });
});

app.get("/api", (_request, response) => {
  response.json({
    name: "Coding With Bashir API",
    version: "1.1.0",
    routes: ["/api/health", "/api/projects", "/api/courses", "/api/certificates", "/api/articles", "/api/testimonials", "/api/contact", "/api/admin/*"],
    adminAuth: "HttpOnly session cookie; role-based access control",
  });
});

// Never accept writes into an ephemeral JSON store from a production service.
app.use("/api", (_request, response, next) => {
  if (process.env.NODE_ENV === "production" && !mongoConnected) {
    return response.status(503).json({ error: "Persistent MongoDB storage is unavailable. Configure MONGODB_URI and retry." });
  }
  next();
});

// Admin routes are mounted before the public collection catch-all.
app.use("/api/admin", adminRouter);

app.get("/api/:collection", async (request, response, next) => {
  const { collection } = request.params;
  if (!collections.has(collection)) return response.status(404).json({ error: "Collection not found." });
  try {
    const items = await listContent(collection);
    const { category, limit } = request.query;
    const filtered = category && category !== "All"
      ? items.filter((item) => item.category?.toLowerCase() === String(category).toLowerCase())
      : items;
    const maxItems = Math.min(Math.max(Number.parseInt(String(limit || "60"), 10) || 60, 1), 100);
    response.set("Cache-Control", "public, max-age=60, stale-while-revalidate=180");
    response.json({ items: filtered.slice(0, maxItems), source: mongoConnected ? "mongodb" : "preview" });
  } catch (error) { next(error); }
});

app.get("/api/:collection/:slug", async (request, response, next) => {
  const { collection, slug } = request.params;
  if (!collections.has(collection)) return response.status(404).json({ error: "Item not found." });
  try {
    const item = await findBySlug(collection, slug);
    if (!item) return response.status(404).json({ error: "Item not found." });
    response.json({ item });
  } catch (error) { next(error); }
});

app.post("/api/contact", messageLimiter, async (request, response, next) => {
  try {
    const { name = "", email = "", subject = "", message = "" } = request.body ?? {};
    const clean = {
      name: String(name).replace(/[<>]/g, "").trim().slice(0, 90),
      email: String(email).trim().toLowerCase().slice(0, 160),
      subject: String(subject).replace(/[<>]/g, "").trim().slice(0, 160),
      message: String(message).replace(/<\/?[^>]+(>|$)/g, "").trim().slice(0, 5000),
    };
    const errors = {};
    if (clean.name.length < 2) errors.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean.email)) errors.email = "Please enter a valid email address.";
    if (clean.subject.length < 3) errors.subject = "Please add a short subject.";
    if (clean.message.length < 10) errors.message = "Your message needs a little more detail (at least 10 characters).";
    if (Object.keys(errors).length) return response.status(422).json({ error: "Check the highlighted fields and try again.", fields: errors });

    const saved = await saveMessage(clean);
    response.status(201).json({ ok: true, message: "Thanks for reaching out — your note is on its way.", receivedAt: saved.createdAt ?? saved._id });
  } catch (error) { next(error); }
});

app.use((_request, response) => response.status(404).json({ error: "That API route doesn't exist." }));
app.use((error, _request, response, _next) => {
  const status = error.status || (error.code === 11000 ? 409 : error.name === "ValidationError" ? 422 : 500);
  if (status >= 500) console.error("[api] request failed:", error.message);
  const message = status === 413
    ? "Your request is too large."
    : status === 409
      ? "That record conflicts with an existing value."
      : status >= 500
        ? "Something went wrong on the server."
        : error.message || "The request could not be completed.";
  response.status(status).json({ error: message });
});
