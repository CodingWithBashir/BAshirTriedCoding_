import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { seeds } from "./data.js";
import { models } from "./models.js";

const directory = dirname(fileURLToPath(import.meta.url));
const storePath = resolve(process.env.LOCAL_STORE_PATH || resolve(directory, "../data/store.json"));
const contentCollections = new Set(["projects", "courses", "certificates", "articles", "testimonials"]);
let localMutationQueue = Promise.resolve();
export let mongoConnected = false;

function emptyLocalState() {
  return {
    content: Object.fromEntries(Object.entries(seeds).map(([key, rows]) => [
      key,
      structuredClone(rows).map((row, index) => ({ ...row, id: `seed-${key}-${index + 1}` })),
    ])),
    messages: [],
    admins: [],
    audit: [],
  };
}

async function readLocalState() {
  try {
    const parsed = JSON.parse(await readFile(storePath, "utf8"));
    const initial = emptyLocalState();
    return {
      content: Object.fromEntries(Object.entries(initial.content).map(([key, rows]) => [
        key,
        Array.isArray(parsed.content?.[key]) ? parsed.content[key] : rows,
      ])),
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      admins: Array.isArray(parsed.admins) ? parsed.admins : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
    };
  } catch (error) {
    if (error.code !== "ENOENT") console.error("[database] Could not read local store:", error.message);
    return emptyLocalState();
  }
}

async function writeLocalState(state) {
  await mkdir(dirname(storePath), { recursive: true });
  const temporaryPath = `${storePath}.${process.pid}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(state, null, 2), { mode: 0o600 });
  await rename(temporaryPath, storePath);
}

function mutateLocal(mutator) {
  let result;
  const operation = localMutationQueue.catch(() => {}).then(async () => {
    const state = await readLocalState();
    result = await mutator(state);
    await writeLocalState(state);
  });
  localMutationQueue = operation;
  return operation.then(() => result);
}

function plainRecord(document) {
  if (!document) return null;
  const plain = typeof document.toObject === "function" ? document.toObject() : document;
  const id = String(plain.id ?? plain._id ?? "");
  return { ...plain, id };
}

function httpError(message, status = 400, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    if (process.env.NODE_ENV === "production") {
      console.error("[database] MONGODB_URI is required in production; persistent API routes will remain unavailable.");
    } else {
      console.info("[database] MONGODB_URI isn't set; using the local preview store. Set MONGODB_URI to enable MongoDB.");
    }
    return false;
  }
  try {
    await models.projects.db.openUri(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, maxPoolSize: 8 });
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
  const seedKey = "starter-content-v1";
  const alreadySeeded = await models.settings.exists({ key: seedKey });
  if (alreadySeeded) {
    console.info("[database] starter content has already been initialized");
    return;
  }
  for (const collection of ["projects", "courses", "certificates", "articles", "testimonials"]) {
    const Model = models[collection];
    for (const row of seeds[collection] ?? []) {
      const selector = row.slug ? { slug: row.slug } : { name: row.name };
      await Model.updateOne(selector, { $setOnInsert: row }, { upsert: true, setDefaultsOnInsert: true });
    }
  }
  await models.settings.updateOne({ key: seedKey }, { $setOnInsert: { value: { version: 1 } } }, { upsert: true });
  console.info("[database] portfolio collections are ready");
}

export async function listContent(collection) {
  if (!contentCollections.has(collection)) throw httpError("Unknown public collection.", 404);
  const Model = models[collection];
  if (mongoConnected) {
    const result = await Model.find().sort({ createdAt: -1 }).lean();
    return result.map(plainRecord);
  }
  const state = await readLocalState();
  return state.content[collection] ?? [];
}

export async function findBySlug(collection, slug) {
  if (!contentCollections.has(collection)) return null;
  if (mongoConnected) {
    const result = await models[collection].findOne({ slug }).lean();
    if (result) return plainRecord(result);
  }
  const state = await readLocalState();
  return (state.content[collection] ?? []).find((row) => row.slug === slug) ?? null;
}

export async function createContent(collection, item) {
  if (!contentCollections.has(collection)) throw httpError("Unknown content collection.", 404);
  if (mongoConnected) return plainRecord(await models[collection].create(item));
  return mutateLocal((state) => {
    const rows = state.content[collection];
    if (item.slug && rows.some((row) => row.slug === item.slug)) throw httpError("An item with that slug already exists.", 409, "DUPLICATE_SLUG");
    const created = { ...item, id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    rows.unshift(created);
    return created;
  });
}

export async function updateContent(collection, key, changes) {
  if (!contentCollections.has(collection)) throw httpError("Unknown content collection.", 404);
  if (mongoConnected) {
    const filter = /^[a-f\d]{24}$/i.test(String(key)) ? { _id: key } : { slug: key };
    return plainRecord(await models[collection].findOneAndUpdate(filter, { $set: changes }, { new: true, runValidators: true }).lean());
  }
  return mutateLocal((state) => {
    const rows = state.content[collection];
    const index = rows.findIndex((row) => String(row.id ?? row._id ?? "") === String(key) || row.slug === key);
    if (index < 0) return null;
    const nextSlug = changes.slug ?? rows[index].slug;
    if (nextSlug && rows.some((row, rowIndex) => rowIndex !== index && row.slug === nextSlug)) {
      throw httpError("An item with that slug already exists.", 409, "DUPLICATE_SLUG");
    }
    rows[index] = { ...rows[index], ...changes, updatedAt: new Date().toISOString() };
    return rows[index];
  });
}

export async function deleteContent(collection, key) {
  if (!contentCollections.has(collection)) throw httpError("Unknown content collection.", 404);
  if (mongoConnected) {
    const filter = /^[a-f\d]{24}$/i.test(String(key)) ? { _id: key } : { slug: key };
    return Boolean(await models[collection].findOneAndDelete(filter));
  }
  return mutateLocal((state) => {
    const rows = state.content[collection];
    const index = rows.findIndex((row) => String(row.id ?? row._id ?? "") === String(key) || row.slug === key);
    if (index < 0) return false;
    rows.splice(index, 1);
    return true;
  });
}

export async function saveMessage(message) {
  if (mongoConnected) return plainRecord(await models.messages.create(message));
  return mutateLocal((state) => {
    const saved = { ...message, id: randomUUID(), status: "new", createdAt: new Date().toISOString() };
    state.messages.unshift(saved);
    return saved;
  });
}

export async function listMessages({ status, limit = 100 } = {}) {
  const maximum = Math.min(Math.max(Number(limit) || 100, 1), 500);
  if (mongoConnected) {
    const filter = status && status !== "all" ? { status } : {};
    const result = await models.messages.find(filter).sort({ createdAt: -1 }).limit(maximum).lean();
    return result.map(plainRecord);
  }
  const state = await readLocalState();
  return state.messages
    .filter((message) => !status || status === "all" || message.status === status)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maximum);
}

export async function updateMessage(id, changes) {
  if (mongoConnected) return plainRecord(await models.messages.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }).lean());
  return mutateLocal((state) => {
    const message = state.messages.find((row) => String(row.id ?? row._id ?? "") === String(id));
    if (!message) return null;
    Object.assign(message, changes, { updatedAt: new Date().toISOString() });
    return message;
  });
}

export async function findAdminByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  if (mongoConnected) {
    const admin = await models.admins.findOne({ email: normalized }).select("+passwordHash").lean();
    return plainRecord(admin);
  }
  const state = await readLocalState();
  return state.admins.find((admin) => admin.email === normalized) ?? null;
}

export async function findAdminById(id) {
  if (mongoConnected) {
    const admin = await models.admins.findById(id).select("+passwordHash").lean();
    return plainRecord(admin);
  }
  const state = await readLocalState();
  return state.admins.find((admin) => String(admin.id) === String(id)) ?? null;
}

export async function listAdminUsers() {
  if (mongoConnected) {
    const admins = await models.admins.find().select("-passwordHash").sort({ createdAt: 1 }).lean();
    return admins.map(plainRecord);
  }
  const state = await readLocalState();
  return state.admins.map(({ passwordHash: _passwordHash, ...admin }) => admin);
}

export async function createAdminUser(user) {
  if (mongoConnected) return plainRecord(await models.admins.create(user));
  return mutateLocal((state) => {
    if (state.admins.some((admin) => admin.email === user.email)) throw httpError("An administrator with that email already exists.", 409, "DUPLICATE_EMAIL");
    const created = { ...user, id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastLoginAt: null };
    state.admins.push(created);
    return created;
  });
}

export async function updateAdminUser(id, changes) {
  if (mongoConnected) {
    return plainRecord(await models.admins.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }).select("+passwordHash").lean());
  }
  return mutateLocal((state) => {
    const admin = state.admins.find((row) => String(row.id) === String(id));
    if (!admin) return null;
    Object.assign(admin, changes, { updatedAt: new Date().toISOString() });
    return admin;
  });
}

export async function countActiveOwners() {
  if (mongoConnected) return models.admins.countDocuments({ role: "owner", active: true });
  const state = await readLocalState();
  return state.admins.filter((admin) => admin.role === "owner" && admin.active).length;
}

export async function addAuditEvent(event) {
  if (mongoConnected) return plainRecord(await models.audit.create(event));
  return mutateLocal((state) => {
    const saved = { ...event, id: randomUUID(), createdAt: new Date().toISOString() };
    state.audit.unshift(saved);
    state.audit = state.audit.slice(0, 500);
    return saved;
  });
}

export async function listAuditEvents(limit = 100) {
  const maximum = Math.min(Math.max(Number(limit) || 100, 1), 500);
  if (mongoConnected) {
    const events = await models.audit.find().sort({ createdAt: -1 }).limit(maximum).lean();
    return events.map(plainRecord);
  }
  const state = await readLocalState();
  return state.audit.slice(0, maximum);
}
