import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { seeds } from "./data.js";
import { models } from "./models.js";

const directory = dirname(fileURLToPath(import.meta.url));
const storePath = resolve(process.env.LOCAL_STORE_PATH || resolve(directory, "../data/store.json"));
export let mongoConnected = false;

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.info("[database] MONGODB_URI isn't set; using the persistent local preview store. Set MONGODB_URI to enable MongoDB.");
    return false;
  }
  try {
    await models.projects.db.openUri(uri, { serverSelectionTimeoutMS: 2800, connectTimeoutMS: 2800, maxPoolSize: 5 });
    mongoConnected = true;
    console.info("[database] connected to MongoDB");
    await seedMongo();
    return true;
  } catch (error) {
    mongoConnected = false;
    await models.projects.db.close().catch(() => {});
    console.warn(`[database] MongoDB isn't available (${error.message}). The durable local preview store will be used instead.`);
    return false;
  }
}

async function seedMongo() {
  for (const collection of ["projects", "courses", "certificates", "articles", "testimonials"]) {
    const Model = models[collection];
    const rows = seeds[collection] ?? [];
    for (const row of rows) {
      const selector = row.slug ? { slug: row.slug } : { name: row.name };
      await Model.updateOne(selector, { $setOnInsert: row }, { upsert: true, setDefaultsOnInsert: true });
    }
  }
  console.info("[database] portfolio collections are ready");
}

async function readLocal() {
  try {
    const content = await readFile(storePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== "ENOENT") console.error("[database] Could not read local store:", error.message);
    return { messages: [] };
  }
}

async function writeLocal(value) {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(value, null, 2), { mode: 0o600 });
  const { rename } = await import("node:fs/promises");
  await rename(temporaryPath, storePath);
}

export async function listContent(collection) {
  const Model = models[collection];
  if (!Model || collection === "messages") throw new Error("Unknown public collection");
  if (mongoConnected) {
    try {
      const result = await Model.find().sort({ createdAt: 1 }).lean();
      return result.length ? result : (seeds[collection] ?? []);
    } catch (error) {
      console.error(`[database] Query for ${collection} failed:`, error.message);
    }
  }
  if (collection === "messages") return (await readLocal()).messages;
  return seeds[collection] ?? [];
}

export async function findBySlug(collection, slug) {
  const Model = models[collection];
  if (!Model || collection === "messages") return null;
  if (mongoConnected) {
    try {
      const result = await Model.findOne({ slug }).lean();
      if (result) return result;
    } catch (error) {
      console.error(`[database] Lookup in ${collection} failed:`, error.message);
    }
  }
  return (seeds[collection] ?? []).find((row) => row.slug === slug) ?? null;
}

export async function saveMessage(message) {
  if (mongoConnected) {
    try {
      return await models.messages.create(message);
    } catch (error) {
      console.error("[database] MongoDB contact insert failed:", error.message);
      throw new Error("The database is temporarily unavailable. Please try again shortly.");
    }
  }
  const state = await readLocal();
  const saved = { ...message, status: "new", createdAt: new Date().toISOString() };
  state.messages.push(saved);
  await writeLocal(state);
  return saved;
}
