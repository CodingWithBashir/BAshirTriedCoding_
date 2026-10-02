import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  addAuditEvent,
  countActiveOwners,
  createAdminUser,
  createContent,
  deleteContent,
  findAdminById,
  listAdminUsers,
  listAuditEvents,
  listContent,
  listMessages,
  updateAdminUser,
  updateContent,
  updateMessage,
} from "./storage.js";
import {
  ADMIN_ROLES,
  authenticateCredentials,
  clearSessionCookie,
  getSessionAdmin,
  hashAdminPassword,
  isAdminSystemReady,
  publicAdmin,
  setSessionCookie,
} from "./admin-auth.js";

export const adminRouter = Router();
adminRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store, private");
  next();
});

const contentCollections = new Set(["projects", "courses", "certificates", "articles", "testimonials"]);
const messageStatuses = new Set(["new", "read", "replied", "archived"]);
const passwordMinimum = 12;

const fieldDefinitions = {
  projects: {
    required: ["name", "slug", "category", "description"],
    strings: { name: 90, slug: 120, category: 60, label: 60, description: 3000, color: 32, variant: 40 },
    arrays: ["stack"], booleans: ["featured"],
  },
  courses: {
    required: ["title", "slug", "description"],
    strings: { title: 120, slug: 120, category: 60, level: 40, duration: 60, description: 3000, icon: 50, color: 32 },
    numbers: { lessons: [0, 500], progress: [0, 100] },
  },
  certificates: {
    required: ["title", "slug", "code", "description"],
    strings: { title: 140, slug: 120, category: 60, issued: 80, level: 40, code: 80, color: 32, description: 3000 },
  },
  articles: {
    required: ["title", "slug", "excerpt", "body"],
    strings: { title: 180, slug: 140, category: 60, date: 80, readTime: 40, excerpt: 500, body: 12000, variant: 40 },
  },
  testimonials: {
    required: ["name", "quote"],
    strings: { name: 90, role: 100, quote: 1200, initials: 8, color: 32 },
  },
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again in 15 minutes." },
});

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function badRequest(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requireRoles(...roles) {
  return (request, response, next) => {
    if (!roles.includes(request.adminUser?.role)) {
      return response.status(403).json({ error: "Your role does not have permission to perform this action." });
    }
    next();
  };
}

function audit(request, action, entity, entityId, summary, metadata = {}) {
  return addAuditEvent({
    actorId: String(request.adminUser.id),
    actorEmail: request.adminUser.email,
    action,
    entity,
    entityId: String(entityId || ""),
    summary,
    metadata,
  });
}

function cleanString(value, key, maxLength) {
  if (typeof value !== "string" && typeof value !== "number") throw badRequest(`${key} must be text.`);
  const result = String(value).trim();
  if (result.length > maxLength) throw badRequest(`${key} must be ${maxLength} characters or fewer.`);
  return result;
}

function sanitizeContent(collection, body, partial = false) {
  const definition = fieldDefinitions[collection];
  if (!definition) throw badRequest("Choose a supported content collection.", 404);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw badRequest("Send a JSON object for the content item.");
  const sanitized = {};
  for (const [key, value] of Object.entries(body)) {
    if (Object.hasOwn(definition.strings, key)) {
      sanitized[key] = cleanString(value, key, definition.strings[key]);
    } else if (definition.arrays?.includes(key)) {
      const source = Array.isArray(value) ? value : String(value ?? "").split(",");
      if (source.length > 30) throw badRequest(`${key} may contain up to 30 values.`);
      sanitized[key] = source.map((entry) => cleanString(entry, key, 40)).filter(Boolean);
    } else if (Object.hasOwn(definition.numbers ?? {}, key)) {
      const [minimum, maximum] = definition.numbers[key];
      const number = Number(value);
      if (!Number.isFinite(number) || number < minimum || number > maximum) {
        throw badRequest(`${key} must be a number between ${minimum} and ${maximum}.`);
      }
      sanitized[key] = number;
    } else if (definition.booleans?.includes(key)) {
      if (typeof value !== "boolean") throw badRequest(`${key} must be true or false.`);
      sanitized[key] = value;
    }
  }
  if (!Object.keys(sanitized).length) throw badRequest("No editable fields were included.");
  if (sanitized.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(sanitized.slug)) {
    throw badRequest("Slug must use lowercase letters, numbers, and single hyphens.");
  }
  if (!partial) {
    for (const key of definition.required) {
      if (!sanitized[key]) throw badRequest(`${key} is required.`);
    }
  }
  return sanitized;
}

async function requireAdmin(request, response, next) {
  try {
    const admin = await getSessionAdmin(request);
    if (!admin) {
      clearSessionCookie(response);
      return response.status(401).json({ error: "Sign in to the admin workspace." });
    }
    request.adminUser = publicAdmin(admin);
    next();
  } catch (error) {
    next(error);
  }
}

adminRouter.get("/session", asyncRoute(async (request, response) => {
  const admin = await getSessionAdmin(request);
  const users = await listAdminUsers();
  const configured = isAdminSystemReady();
  response.json({
    configured,
    setupRequired: !configured || users.length === 0,
    authenticated: Boolean(admin),
    user: publicAdmin(admin),
  });
}));

adminRouter.post("/login", loginLimiter, asyncRoute(async (request, response) => {
  if (!isAdminSystemReady()) {
    return response.status(503).json({ error: "Admin authentication is not configured. Add a 32-character JWT_SECRET and bootstrap admin credentials to the server environment." });
  }
  const { email = "", password = "" } = request.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password || password.length > 256) {
    return response.status(400).json({ error: "Enter your email address and password." });
  }
  const admin = await authenticateCredentials(email, password);
  if (!admin) return response.status(401).json({ error: "Email or password is incorrect, or this account is inactive." });
  const updated = await updateAdminUser(admin.id, { lastLoginAt: new Date().toISOString() });
  setSessionCookie(response, updated || admin);
  await addAuditEvent({ actorId: String(admin.id), actorEmail: admin.email, action: "login", entity: "session", entityId: String(admin.id), summary: "Signed in to the admin workspace" });
  response.json({ ok: true, user: publicAdmin(updated || admin) });
}));

adminRouter.post("/logout", asyncRoute(async (request, response) => {
  const admin = await getSessionAdmin(request);
  clearSessionCookie(response);
  if (admin) await addAuditEvent({ actorId: String(admin.id), actorEmail: admin.email, action: "logout", entity: "session", entityId: String(admin.id), summary: "Signed out of the admin workspace" });
  response.json({ ok: true });
}));

adminRouter.use(requireAdmin);

adminRouter.get("/overview", asyncRoute(async (request, response) => {
  const collections = ["projects", "courses", "certificates", "articles", "testimonials"];
  const role = request.adminUser.role;
  const inboxAvailable = ["owner", "admin", "support"].includes(role);
  const auditAvailable = ["owner", "admin"].includes(role);
  const teamAvailable = role === "owner";
  const [collectionRows, messages, auditEvents, users] = await Promise.all([
    Promise.all(collections.map((collection) => listContent(collection))),
    inboxAvailable ? listMessages({ limit: 500 }) : Promise.resolve([]),
    auditAvailable ? listAuditEvents(500) : Promise.resolve([]),
    teamAvailable ? listAdminUsers() : Promise.resolve([]),
  ]);
  const now = new Date();
  const dailyActivity = inboxAvailable || auditAvailable ? Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const key = day.toISOString().slice(0, 10);
    const auditCount = auditEvents.filter((event) => String(event.createdAt).slice(0, 10) === key).length;
    const inboxCount = messages.filter((message) => String(message.createdAt).slice(0, 10) === key).length;
    return { date: key, label: day.toLocaleDateString("en", { weekday: "short" }), count: auditCount + inboxCount };
  }) : [];
  const messageCounts = inboxAvailable
    ? Object.fromEntries(["new", "read", "replied", "archived"].map((status) => [status, messages.filter((message) => message.status === status).length]))
    : null;
  response.json({
    counts: {
      ...Object.fromEntries(collections.map((collection, index) => [collection, collectionRows[index].length])),
      ...(inboxAvailable ? { messages: messages.length, unreadMessages: messageCounts.new } : {}),
      ...(teamAvailable ? { members: users.length } : {}),
    },
    messageCounts,
    inboxAvailable,
    activityAvailable: inboxAvailable || auditAvailable,
    dailyActivity,
    recentMessages: inboxAvailable ? messages.slice(0, 5).map(({ message: _message, ...item }) => item) : [],
    recentActivity: auditAvailable ? auditEvents.slice(0, 8) : [],
  });
}));

adminRouter.get("/content/:collection", requireRoles("owner", "admin", "editor", "viewer"), asyncRoute(async (request, response) => {
  if (!contentCollections.has(request.params.collection)) throw badRequest("Choose a supported content collection.", 404);
  const items = await listContent(request.params.collection);
  response.json({ items });
}));

adminRouter.post("/content/:collection", requireRoles("owner", "admin", "editor"), asyncRoute(async (request, response) => {
  const collection = request.params.collection;
  const item = await createContent(collection, sanitizeContent(collection, request.body));
  await audit(request, "create", collection, item.slug, `Created ${collection.slice(0, -1)} “${item.title || item.name}”`);
  response.status(201).json({ item });
}));

adminRouter.patch("/content/:collection/:key", requireRoles("owner", "admin", "editor"), asyncRoute(async (request, response) => {
  const { collection, key } = request.params;
  const changes = sanitizeContent(collection, request.body, true);
  const item = await updateContent(collection, key, changes);
  if (!item) throw badRequest("Content item not found.", 404);
  await audit(request, "update", collection, item.id || item.slug, `Updated ${collection.slice(0, -1)} “${item.title || item.name}”`);
  response.json({ item });
}));

adminRouter.delete("/content/:collection/:key", requireRoles("owner", "admin", "editor"), asyncRoute(async (request, response) => {
  const { collection, key } = request.params;
  if (!contentCollections.has(collection)) throw badRequest("Choose a supported content collection.", 404);
  const rows = await listContent(collection);
  const item = rows.find((row) => String(row.id ?? row._id ?? "") === key || row.slug === key) ?? null;
  if (!item) throw badRequest("Content item not found.", 404);
  await deleteContent(collection, key);
  await audit(request, "delete", collection, item.id || item.slug, `Deleted ${collection.slice(0, -1)} “${item.title || item.name}”`);
  response.json({ ok: true });
}));

adminRouter.get("/messages", requireRoles("owner", "admin", "support"), asyncRoute(async (request, response) => {
  const status = String(request.query.status || "all");
  if (status !== "all" && !messageStatuses.has(status)) throw badRequest("Choose a valid message status.");
  const messages = await listMessages({ status, limit: request.query.limit });
  response.json({ items: messages });
}));

adminRouter.patch("/messages/:id", requireRoles("owner", "admin", "support"), asyncRoute(async (request, response) => {
  const status = request.body?.status;
  if (!messageStatuses.has(status)) throw badRequest("Choose new, read, replied, or archived as the message status.");
  const message = await updateMessage(request.params.id, { status });
  if (!message) throw badRequest("Contact message not found.", 404);
  await audit(request, "update-status", "message", message.id, `Changed a contact message to ${status}`);
  response.json({ item: message });
}));

adminRouter.get("/users", requireRoles("owner"), asyncRoute(async (_request, response) => {
  response.json({ items: await listAdminUsers(), roles: ADMIN_ROLES });
}));

adminRouter.post("/users", requireRoles("owner"), asyncRoute(async (request, response) => {
  const { name = "", email = "", password = "", role = "viewer" } = request.body ?? {};
  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  if (cleanName.length < 2 || cleanName.length > 80) throw badRequest("Name must contain 2 to 80 characters.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw badRequest("Enter a valid email address.");
  if (typeof password !== "string" || password.length < passwordMinimum || password.length > 256) throw badRequest(`Password must contain ${passwordMinimum} to 256 characters.`);
  if (!ADMIN_ROLES.includes(role)) throw badRequest("Choose a valid admin role.");
  const user = await createAdminUser({
    name: cleanName,
    email: cleanEmail,
    passwordHash: hashAdminPassword(password),
    role,
    active: true,
    createdBy: String(request.adminUser.id),
  });
  await audit(request, "create", "admin-user", user.id, `Invited ${user.email} as ${user.role}`);
  response.status(201).json({ item: publicAdmin(user) });
}));

adminRouter.patch("/users/:id", requireRoles("owner"), asyncRoute(async (request, response) => {
  const target = await findAdminById(request.params.id);
  if (!target) throw badRequest("Admin user not found.", 404);
  const updates = {};
  if (request.body?.role !== undefined) {
    if (!ADMIN_ROLES.includes(request.body.role)) throw badRequest("Choose a valid admin role.");
    updates.role = request.body.role;
  }
  if (request.body?.active !== undefined) {
    if (typeof request.body.active !== "boolean") throw badRequest("Active must be true or false.");
    updates.active = request.body.active;
  }
  if (request.body?.name !== undefined) {
    const name = String(request.body.name).trim();
    if (name.length < 2 || name.length > 80) throw badRequest("Name must contain 2 to 80 characters.");
    updates.name = name;
  }
  if (!Object.keys(updates).length) throw badRequest("Choose a name, role, or active status to update.");
  if (String(target.id) === String(request.adminUser.id) && updates.active === false) throw badRequest("You cannot deactivate your own owner account.", 409);
  if (target.createdBy === "environment" && (updates.role && updates.role !== "owner" || updates.active === false)) {
    throw badRequest("The environment bootstrap owner can only be changed by updating ADMIN_EMAIL or ADMIN_PASSWORD on the server.", 409);
  }
  const nextRole = updates.role ?? target.role;
  const nextActive = updates.active ?? target.active;
  if (target.role === "owner" && (nextRole !== "owner" || !nextActive) && await countActiveOwners() <= 1) {
    throw badRequest("At least one active owner must remain.", 409);
  }
  const updated = await updateAdminUser(target.id, updates);
  await audit(request, "update", "admin-user", target.id, `Updated access for ${target.email}`, updates);
  response.json({ item: publicAdmin(updated) });
}));

adminRouter.get("/activity", requireRoles("owner", "admin"), asyncRoute(async (request, response) => {
  response.json({ items: await listAuditEvents(request.query.limit) });
}));
