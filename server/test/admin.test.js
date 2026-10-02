import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const testDirectory = await mkdtemp(join(tmpdir(), "coding-with-bashir-admin-test-"));
process.env.LOCAL_STORE_PATH = join(testDirectory, "store.json");
process.env.JWT_SECRET = "admin-test-secret-with-more-than-thirty-two-bytes";
process.env.ADMIN_EMAIL = "owner@codingwithbashir.test";
process.env.ADMIN_PASSWORD = "Test-only-owner-passphrase-2026";
process.env.ADMIN_NAME = "Test Owner";
process.env.NODE_ENV = "test";

const { app } = await import("../src/app.js");
const { bootstrapConfiguredOwner, setSessionCookie } = await import("../src/admin-auth.js");
await bootstrapConfiguredOwner();
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}`;

async function call(path, { method = "GET", body, cookie } = {}) {
  const headers = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${base}${path}`, { method, headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function signIn(email, password) {
  const { response, payload } = await call("/api/admin/login", { method: "POST", body: { email, password } });
  const setCookie = response.headers.get("set-cookie") || "";
  return { response, payload, cookie: setCookie.split(";")[0] };
}

let ownerCookie;
let viewerCookie;
let supportCookie;
let editorCookie;
let adminCookie;
let contactId;

before(async () => {
  assert.ok(process.env.LOCAL_STORE_PATH);
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
});

test("admin setup is explicit and rejects a weak signing secret", async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "too-short";
  const { payload: session } = await call("/api/admin/session");
  assert.equal(session.configured, false);
  assert.equal(session.setupRequired, true);
  const { response } = await call("/api/admin/login", { method: "POST", body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } });
  assert.equal(response.status, 503);
  process.env.JWT_SECRET = originalSecret;
});

test("production refuses preview-store reads and writes when MongoDB is unavailable", async () => {
  const originalEnvironment = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    const health = await call("/api/health");
    assert.equal(health.response.status, 503);
    assert.equal(health.payload.ok, false);
    const projects = await call("/api/projects");
    assert.equal(projects.response.status, 503);
    const contact = await call("/api/contact", {
      method: "POST",
      body: { name: "Test Person", email: "test@example.com", subject: "Production storage", message: "This must never be written to an ephemeral production store." },
    });
    assert.equal(contact.response.status, 503);
  } finally {
    process.env.NODE_ENV = originalEnvironment;
  }
});

test("bootstrap owner signs in with a protected HttpOnly cookie", async () => {
  const { response, payload, cookie } = await signIn(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  assert.equal(response.status, 200);
  assert.equal(payload.user.role, "owner");
  assert.equal(payload.user.email, process.env.ADMIN_EMAIL);
  assert.ok(!("passwordHash" in payload.user));
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(response.headers.get("set-cookie"), /SameSite=Lax/i);
  assert.match(response.headers.get("cache-control"), /no-store/i);
  ownerCookie = cookie;
  const { payload: session } = await call("/api/admin/session", { cookie });
  assert.equal(session.authenticated, true);
  assert.equal(session.user.role, "owner");
});

test("production session cookies require HTTPS", () => {
  const originalEnvironment = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    let cookie = "";
    setSessionCookie({ setHeader: (name, value) => { assert.equal(name, "Set-Cookie"); cookie = value; } }, { id: "production-cookie-check" });
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /; Secure/i);
  } finally {
    process.env.NODE_ENV = originalEnvironment;
  }
});

test("owner can create, edit, list, and delete validated content", async () => {
  const created = await call("/api/admin/content/projects", {
    method: "POST",
    cookie: ownerCookie,
    body: { name: "Admin-managed demo", slug: "admin-managed-demo", category: "Web App", label: "Studio test", description: "A project created through the protected content studio.", stack: ["Next.js", "Node.js"], featured: false },
  });
  assert.equal(created.response.status, 201);
  assert.ok(created.payload.item.id);
  const publicList = await call("/api/projects");
  assert.ok(publicList.payload.items.some((item) => item.slug === "admin-managed-demo"));

  const updated = await call(`/api/admin/content/projects/${created.payload.item.id}`, {
    method: "PATCH",
    cookie: ownerCookie,
    body: { description: "Updated safely through the admin API." },
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.payload.item.description, "Updated safely through the admin API.");

  const duplicate = await call("/api/admin/content/projects", {
    method: "POST",
    cookie: ownerCookie,
    body: { name: "Duplicate", slug: "admin-managed-demo", category: "Web App", description: "A duplicate slug should be rejected." },
  });
  assert.equal(duplicate.response.status, 409);

  const removed = await call(`/api/admin/content/projects/${created.payload.item.id}`, { method: "DELETE", cookie: ownerCookie });
  assert.equal(removed.response.status, 200);
  const afterDelete = await call("/api/projects");
  assert.ok(!afterDelete.payload.items.some((item) => item.slug === "admin-managed-demo"));

  const article = await call("/api/admin/content/articles", {
    method: "POST", cookie: ownerCookie,
    body: { title: "A note from the studio", slug: "a-note-from-the-studio", category: "Engineering", excerpt: "A useful first step for a new idea.", body: "Begin with one small question.\n\nWrite down what you expect to happen, then test it and learn from the result." },
  });
  assert.equal(article.response.status, 201);
  const publicArticle = await call("/api/articles/a-note-from-the-studio");
  assert.equal(publicArticle.payload.item.body, "Begin with one small question.\n\nWrite down what you expect to happen, then test it and learn from the result.");
  const removedArticle = await call(`/api/admin/content/articles/${article.payload.item.id}`, { method: "DELETE", cookie: ownerCookie });
  assert.equal(removedArticle.response.status, 200);
});

test("owner can add role-scoped users without exposing password hashes", async () => {
  const roles = ["viewer", "support", "editor", "admin"];
  const cookies = [];
  for (const role of roles) {
    const email = `${role}@codingwithbashir.test`;
    const created = await call("/api/admin/users", {
      method: "POST",
      cookie: ownerCookie,
      body: { name: `${role} test account`, email, password: `Test-${role}-password-2026`, role },
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.payload.item.role, role);
    assert.ok(!("passwordHash" in created.payload.item));
    const signed = await signIn(email, `Test-${role}-password-2026`);
    assert.equal(signed.response.status, 200);
    cookies.push(signed.cookie);
  }
  [viewerCookie, supportCookie, editorCookie, adminCookie] = cookies;
});

test("role permissions are checked by the server for every protected action", async () => {
  const overview = await call("/api/admin/overview", { cookie: viewerCookie });
  assert.equal(overview.response.status, 200);
  assert.equal(overview.payload.inboxAvailable, false);
  assert.equal(overview.payload.activityAvailable, false);
  assert.deepEqual(overview.payload.recentMessages, []);
  assert.deepEqual(overview.payload.recentActivity, []);
  assert.ok(!("unreadMessages" in overview.payload.counts));
  const canRead = await call("/api/admin/content/projects", { cookie: viewerCookie });
  assert.equal(canRead.response.status, 200);
  const cannotWrite = await call("/api/admin/content/projects", {
    method: "POST", cookie: viewerCookie,
    body: { name: "Viewer attempt", slug: "viewer-attempt", category: "Test", description: "This must not be allowed." },
  });
  assert.equal(cannotWrite.response.status, 403);
  assert.equal((await call("/api/admin/messages", { cookie: viewerCookie })).response.status, 403);
  assert.equal((await call("/api/admin/users", { cookie: editorCookie })).response.status, 403);
  assert.equal((await call("/api/admin/messages", { cookie: editorCookie })).response.status, 403);
  const editorCreate = await call("/api/admin/content/testimonials", {
    method: "POST", cookie: editorCookie,
    body: { name: "Editor test", quote: "Editors can safely manage portfolio content." },
  });
  assert.equal(editorCreate.response.status, 201);
  assert.ok(editorCreate.payload.item.id);
  assert.equal((await call("/api/admin/messages", { cookie: adminCookie })).response.status, 200);
  assert.equal((await call("/api/admin/activity", { cookie: adminCookie })).response.status, 200);
  assert.equal((await call("/api/admin/users", { cookie: adminCookie })).response.status, 403);
  const adminOverview = await call("/api/admin/overview", { cookie: adminCookie });
  assert.equal(adminOverview.payload.inboxAvailable, true);
  assert.equal(adminOverview.payload.activityAvailable, true);
});

test("support can triage contact messages but cannot edit content", async () => {
  const submission = await call("/api/contact", {
    method: "POST",
    body: { name: "Amina", email: "amina@example.com", subject: "A test inquiry", message: "A local-only admin inbox permission test." },
  });
  assert.equal(submission.response.status, 201);
  const supportOverview = await call("/api/admin/overview", { cookie: supportCookie });
  assert.equal(supportOverview.payload.inboxAvailable, true);
  assert.equal(supportOverview.payload.activityAvailable, true);
  assert.ok(supportOverview.payload.recentMessages.some((item) => item.subject === "A test inquiry"));
  assert.deepEqual(supportOverview.payload.recentActivity, []);
  const inbox = await call("/api/admin/messages?status=new", { cookie: supportCookie });
  assert.equal(inbox.response.status, 200);
  const message = inbox.payload.items.find((item) => item.subject === "A test inquiry");
  assert.ok(message);
  contactId = message.id;
  const triaged = await call(`/api/admin/messages/${contactId}`, { method: "PATCH", cookie: supportCookie, body: { status: "replied" } });
  assert.equal(triaged.response.status, 200);
  assert.equal(triaged.payload.item.status, "replied");
  assert.equal((await call("/api/admin/content/projects", { cookie: supportCookie })).response.status, 403);
});

test("bootstrap owner cannot be demoted through the role manager", async () => {
  const { payload } = await call("/api/admin/users", { cookie: ownerCookie });
  const owner = payload.items.find((item) => item.email === process.env.ADMIN_EMAIL);
  const update = await call(`/api/admin/users/${owner.id}`, { method: "PATCH", cookie: ownerCookie, body: { role: "admin" } });
  assert.equal(update.response.status, 409);
});

test("tampered or missing cookies cannot access protected admin data", async () => {
  assert.equal((await call("/api/admin/overview")).response.status, 401);
  assert.equal((await call("/api/admin/overview", { cookie: "cwb_admin_session=not-a-valid-token" })).response.status, 401);
});

test("audit trail records sign-ins and portfolio changes", async () => {
  const { response, payload } = await call("/api/admin/activity?limit=100", { cookie: ownerCookie });
  assert.equal(response.status, 200);
  assert.ok(payload.items.some((item) => item.action === "login"));
  assert.ok(payload.items.some((item) => item.action === "create" && item.entity === "admin-user"));
});
