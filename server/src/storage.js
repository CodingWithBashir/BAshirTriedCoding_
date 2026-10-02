import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { seeds } from "./data.js";
import { models } from "./models.js";

const directory = dirname(fileURLToPath(import.meta.url));
const storePath = resolve(process.env.LOCAL_STORE_PATH || resolve(directory, "../data/store.json"));
const contentCollections = new Set(["projects", "courses", "certificates", "articles", "testimonials"]);
const legacySampleCertificateCodes = new Set(["CWB-2025-001", "CWB-2025-002", "CWB-2025-003", "CWB-2025-004", "CWB-2025-005", "CWB-2024-006", "CWB-2024-007"]);
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
    learners: [],
    learnerProgress: [],
    learnerCertificates: [],
  };
}

function cleanContentRecord(collection, row) {
  if (!row || typeof row !== "object") return row;
  if (collection === "certificates" && legacySampleCertificateCodes.has(row.code)) return null;
  if (collection !== "courses") return row;
  const { progress: _legacyDemoProgress, ...clean } = row;
  return clean;
}

async function readLocalState() {
  try {
    const parsed = JSON.parse(await readFile(storePath, "utf8"));
    const initial = emptyLocalState();
    return {
      content: Object.fromEntries(Object.entries(initial.content).map(([key, rows]) => [
        key,
        (Array.isArray(parsed.content?.[key]) ? parsed.content[key] : rows).map((row) => cleanContentRecord(key, row)).filter(Boolean),
      ])),
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      admins: Array.isArray(parsed.admins) ? parsed.admins : [],
      audit: Array.isArray(parsed.audit) ? parsed.audit : [],
      learners: Array.isArray(parsed.learners) ? parsed.learners : [],
      learnerProgress: Array.isArray(parsed.learnerProgress) ? parsed.learnerProgress : [],
      learnerCertificates: Array.isArray(parsed.learnerCertificates) ? parsed.learnerCertificates : [],
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
  if (!alreadySeeded) {
    for (const collection of ["projects", "courses", "certificates", "articles", "testimonials"]) {
      const Model = models[collection];
      for (const row of seeds[collection] ?? []) {
        const selector = row.slug ? { slug: row.slug } : { name: row.name };
        await Model.updateOne(selector, { $setOnInsert: row }, { upsert: true, setDefaultsOnInsert: true });
      }
    }
    await models.settings.updateOne({ key: seedKey }, { $setOnInsert: { value: { version: 1 } } }, { upsert: true });
    console.info("[database] portfolio collections are ready");
  } else {
    console.info("[database] starter content has already been initialized");
  }

  const courseProgressMigration = "remove-global-course-demo-progress-v1";
  if (!await models.settings.exists({ key: courseProgressMigration })) {
    await models.courses.collection.updateMany({ progress: { $exists: true } }, { $unset: { progress: "" } });
    await models.settings.updateOne({ key: courseProgressMigration }, { $setOnInsert: { value: { version: 1 } } }, { upsert: true });
    console.info("[database] removed legacy shared course progress; learner progress is now account-specific");
  }

  const sampleCertificateMigration = "remove-sample-portfolio-certificates-v1";
  if (!await models.settings.exists({ key: sampleCertificateMigration })) {
    await models.certificates.deleteMany({ code: { $in: Array.from(legacySampleCertificateCodes) } });
    await models.settings.updateOne({ key: sampleCertificateMigration }, { $setOnInsert: { value: { version: 1 } } }, { upsert: true });
    console.info("[database] removed static sample certificates; learner certificates are awarded on course completion");
  }
}

export async function listContent(collection) {
  if (!contentCollections.has(collection)) throw httpError("Unknown public collection.", 404);
  const Model = models[collection];
  if (mongoConnected) {
    const result = await Model.find().sort({ createdAt: -1 }).lean();
    return result.map((row) => cleanContentRecord(collection, plainRecord(row))).filter(Boolean);
  }
  const state = await readLocalState();
  return state.content[collection] ?? [];
}

export async function findBySlug(collection, slug) {
  if (!contentCollections.has(collection)) return null;
  if (mongoConnected) {
    const result = await models[collection].findOne({ slug }).lean();
    if (result) return cleanContentRecord(collection, plainRecord(result));
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

export async function findLearnerByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  if (mongoConnected) {
    const learner = await models.learners.findOne({ email: normalized }).select("+passwordHash").lean();
    return plainRecord(learner);
  }
  const state = await readLocalState();
  return state.learners.find((learner) => learner.email === normalized) ?? null;
}

export async function findLearnerById(id) {
  if (mongoConnected) {
    const learner = await models.learners.findById(id).select("+passwordHash").lean();
    return plainRecord(learner);
  }
  const state = await readLocalState();
  return state.learners.find((learner) => String(learner.id) === String(id)) ?? null;
}

export async function createLearner(learner) {
  if (mongoConnected) return plainRecord(await models.learners.create(learner));
  return mutateLocal((state) => {
    if (state.learners.some((item) => item.email === learner.email)) throw httpError("An account with that email already exists.", 409, "DUPLICATE_EMAIL");
    const created = { ...learner, id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastLoginAt: null };
    state.learners.push(created);
    return created;
  });
}

export async function updateLearner(id, changes) {
  if (mongoConnected) {
    return plainRecord(await models.learners.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }).select("+passwordHash").lean());
  }
  return mutateLocal((state) => {
    const learner = state.learners.find((item) => String(item.id) === String(id));
    if (!learner) return null;
    Object.assign(learner, changes, { updatedAt: new Date().toISOString() });
    return learner;
  });
}

export async function listLearnerProgress(learnerId) {
  if (mongoConnected) {
    const rows = await models.learnerProgress.find({ learnerId }).sort({ updatedAt: -1 }).lean();
    return rows.map(plainRecord);
  }
  const state = await readLocalState();
  return state.learnerProgress.filter((row) => String(row.learnerId) === String(learnerId));
}

export async function listLearnerCertificates(learnerId) {
  if (mongoConnected) {
    const rows = await models.learnerCertificates.find({ learnerId }).sort({ issuedAt: -1 }).lean();
    return rows.map(plainRecord);
  }
  const state = await readLocalState();
  return state.learnerCertificates
    .filter((row) => String(row.learnerId) === String(learnerId))
    .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
}

export async function findLearnerCertificate(identifier, learnerId) {
  if (mongoConnected) {
    const key = String(identifier);
    const filter = /^[a-f\d]{24}$/i.test(key) ? { _id: key } : { certificateNumber: key };
    const certificate = await models.learnerCertificates.findOne({ ...filter, learnerId }).lean();
    return plainRecord(certificate);
  }
  const state = await readLocalState();
  return state.learnerCertificates.find((row) => String(row.learnerId) === String(learnerId) && (String(row.id) === String(identifier) || row.certificateNumber === identifier)) ?? null;
}

export async function findPublicCertificateByNumber(certificateNumber) {
  const normalized = String(certificateNumber).trim().toUpperCase();
  let certificate;
  if (mongoConnected) {
    certificate = await models.learnerCertificates.findOne({ certificateNumber: normalized })
      .select("courseTitle lessonCount recipientName certificateNumber issuedAt")
      .lean();
  } else {
    const state = await readLocalState();
    certificate = state.learnerCertificates.find((row) => row.certificateNumber === normalized) ?? null;
  }
  if (!certificate) return null;
  return {
    courseTitle: certificate.courseTitle,
    lessonCount: certificate.lessonCount,
    recipientName: certificate.recipientName,
    certificateNumber: certificate.certificateNumber,
    issuedAt: certificate.issuedAt,
  };
}

function newCertificateNumber() {
  return `CWB-${new Date().getFullYear()}-${randomUUID().replaceAll("-", "").slice(0, 24).toUpperCase()}`;
}

export async function completeLearnerLesson(learner, course, lessonIndex) {
  const lessonCount = Math.min(120, Math.max(1, Number(course.lessons) || 1));
  if (!Number.isInteger(lessonIndex) || lessonIndex < 0 || lessonIndex >= lessonCount) throw httpError("Choose a valid lesson in this course.", 400);
  if (mongoConnected) {
    const filter = { learnerId: learner.id, courseSlug: course.slug };
    const update = { $set: { courseTitle: course.title, lessonCount }, $addToSet: { completedLessonIndexes: lessonIndex } };
    let progress;
    try {
      progress = await models.learnerProgress.findOneAndUpdate(
        filter, update, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      ).lean();
    } catch (error) {
      if (error.code !== 11000) throw error;
      progress = await models.learnerProgress.findOneAndUpdate(filter, update, { new: true, runValidators: true }).lean();
    }
    let certificate = null;
    if (progress.completedLessonIndexes.length >= lessonCount) {
      const completedAt = progress.completedAt || new Date();
      await models.learnerProgress.updateOne(filter, { $set: { completedAt } });
      try {
        certificate = await models.learnerCertificates.findOneAndUpdate(
          filter,
          { $setOnInsert: { courseTitle: course.title, lessonCount, recipientName: learner.name, certificateNumber: newCertificateNumber(), issuedAt: completedAt } },
          { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
        ).lean();
      } catch (error) {
        if (error.code !== 11000) throw error;
        certificate = await models.learnerCertificates.findOne(filter).lean();
      }
      await models.learnerProgress.updateOne(filter, { $set: { certificateId: certificate._id, completedAt } });
      progress = await models.learnerProgress.findOne(filter).lean();
    }
    return { progress: plainRecord(progress), certificate: plainRecord(certificate) };
  }

  return mutateLocal((state) => {
    let progress = state.learnerProgress.find((row) => String(row.learnerId) === String(learner.id) && row.courseSlug === course.slug);
    if (!progress) {
      progress = {
        id: randomUUID(), learnerId: String(learner.id), courseSlug: course.slug, courseTitle: course.title,
        lessonCount, completedLessonIndexes: [], completedAt: null, certificateId: null,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      };
      state.learnerProgress.push(progress);
    }
    progress.courseTitle = course.title;
    progress.lessonCount = lessonCount;
    if (!progress.completedLessonIndexes.includes(lessonIndex)) progress.completedLessonIndexes.push(lessonIndex);
    progress.completedLessonIndexes.sort((a, b) => a - b);
    progress.updatedAt = new Date().toISOString();
    let certificate = null;
    if (progress.completedLessonIndexes.length >= lessonCount) {
      progress.completedAt ||= new Date().toISOString();
      certificate = state.learnerCertificates.find((row) => String(row.learnerId) === String(learner.id) && row.courseSlug === course.slug) ?? null;
      if (!certificate) {
        certificate = {
          id: randomUUID(), learnerId: String(learner.id), courseSlug: course.slug, courseTitle: course.title, lessonCount,
          recipientName: learner.name, certificateNumber: newCertificateNumber(), issuedAt: progress.completedAt,
        };
        state.learnerCertificates.push(certificate);
      }
      progress.certificateId = certificate.id;
    }
    return { progress, certificate };
  });
}
