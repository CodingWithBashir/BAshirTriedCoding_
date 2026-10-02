import { after, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const testDirectory = await mkdtemp(join(tmpdir(), "coding-with-bashir-api-test-"));
process.env.LOCAL_STORE_PATH = join(testDirectory, "store.json");
const { app } = await import("../src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const address = server.address();
const base = `http://127.0.0.1:${address.port}`;

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(testDirectory, { recursive: true, force: true });
});

test("health endpoint reports a ready API", async () => {
  const response = await fetch(`${base}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "coding-with-bashir-api");
});

test("projects are returned from the starter portfolio collection", async () => {
  const response = await fetch(`${base}/api/projects`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.ok(body.items.some((item) => item.slug === "agabonabanyefree"));
});

test("contact endpoint rejects invalid submissions with field errors", async () => {
  const response = await fetch(`${base}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "x", email: "no", subject: "", message: "short" }),
  });
  const body = await response.json();
  assert.equal(response.status, 422);
  assert.ok(body.fields.email);
  assert.ok(body.fields.message);
});

test("valid contact message is accepted into the persistent store", async () => {
  const response = await fetch(`${base}/api/contact`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Amina", email: "amina@example.com", subject: "A thoughtful collaboration", message: "I would love to talk about a small learning project." }),
  });
  const body = await response.json();
  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.match(body.message, /Thanks for reaching out/);
});
