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

test("public certificate collection no longer exposes sample learner awards", async () => {
  const response = await fetch(`${base}/api/certificates`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.items.length, 0);
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

test("learner accounts own saved lesson progress and receive a certificate after course completion", async () => {
  const password = "CuriousLearner!2042";
  const signup = await fetch(`${base}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Amina Uwimana", email: "AMINA@example.com", password }),
  });
  const account = await signup.json();
  assert.equal(signup.status, 201);
  assert.equal(account.user.email, "amina@example.com");
  assert.equal("passwordHash" in account.user, false);
  const cookie = signup.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie?.startsWith("cwb_learner_session="));

  const privateBeforeSignIn = await fetch(`${base}/api/learner/progress`);
  assert.equal(privateBeforeSignIn.status, 401);

  const coursesResponse = await fetch(`${base}/api/courses`);
  const courses = (await coursesResponse.json()).items;
  const course = courses.find((item) => item.slug === "javascript");
  assert.ok(course);
  assert.equal("progress" in course, false);

  let result;
  for (let lessonIndex = 0; lessonIndex < course.lessons; lessonIndex += 1) {
    const response = await fetch(`${base}/api/learner/courses/${course.slug}/lessons/${lessonIndex}/complete`, {
      method: "POST",
      headers: { cookie },
    });
    assert.equal(response.status, 200);
    result = await response.json();
    assert.ok(result.progress.completedLessonIndexes.includes(lessonIndex));
    if (lessonIndex < course.lessons - 1) assert.equal(result.certificate, null);
  }
  assert.equal(result.progress.completedLessonIndexes.length, course.lessons);
  assert.equal(result.progress.completedAt != null, true);
  assert.equal(result.certificate.courseSlug, course.slug);
  assert.equal(result.certificate.recipientName, "Amina Uwimana");
  assert.equal(result.certificate.lessonCount, course.lessons);

  const earned = await fetch(`${base}/api/learner/certificates`, { headers: { cookie } });
  const earnedItems = (await earned.json()).items;
  assert.equal(earnedItems.length, 1);
  assert.equal(earnedItems[0].certificateNumber, result.certificate.certificateNumber);
  const ownCertificate = await fetch(`${base}/api/learner/certificates/${result.certificate.id}`, { headers: { cookie } });
  assert.equal(ownCertificate.status, 200);
  const verification = await fetch(`${base}/api/verify/certificates/${result.certificate.certificateNumber}`);
  const verificationBody = await verification.json();
  assert.equal(verification.status, 200);
  assert.equal(verificationBody.item.recipientName, "Amina Uwimana");
  assert.equal(verificationBody.item.certificateNumber, result.certificate.certificateNumber);
  assert.equal("learnerId" in verificationBody.item, false);
  assert.equal("passwordHash" in verificationBody.item, false);

  const logout = await fetch(`${base}/api/auth/logout`, { method: "POST", headers: { cookie } });
  assert.equal(logout.status, 200);
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "amina@example.com", password }),
  });
  assert.equal(login.status, 200);
  assert.equal((await login.json()).user.name, "Amina Uwimana");
  const wrongPassword = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "amina@example.com", password: "incorrect-password" }),
  });
  assert.equal(wrongPassword.status, 401);

  const secondSignup = await fetch(`${base}/api/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Kigali Learner", email: "second@example.com", password }),
  });
  assert.equal(secondSignup.status, 201);
  const secondCookie = secondSignup.headers.get("set-cookie")?.split(";")[0];
  const otherLearnerProgress = await fetch(`${base}/api/learner/progress`, { headers: { cookie: secondCookie } });
  assert.deepEqual((await otherLearnerProgress.json()).items, []);
  const otherLearnerCertificates = await fetch(`${base}/api/learner/certificates`, { headers: { cookie: secondCookie } });
  assert.deepEqual((await otherLearnerCertificates.json()).items, []);
  const privateCertificate = await fetch(`${base}/api/learner/certificates/${result.certificate.id}`, { headers: { cookie: secondCookie } });
  assert.equal(privateCertificate.status, 404);
});
