import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  completeLearnerLesson,
  createLearner,
  findBySlug,
  findLearnerByEmail,
  findLearnerCertificate,
  findPublicCertificateByNumber,
  listLearnerCertificates,
  listLearnerProgress,
  updateLearner,
} from "./storage.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import {
  clearLearnerSessionCookie,
  getSessionLearner,
  isLearnerAuthReady,
  publicLearner,
  setLearnerSessionCookie,
} from "./learner-auth.js";

export const learnerRouter = Router();
learnerRouter.use((_request, response, next) => {
  response.set("Cache-Control", "no-store, private");
  next();
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many sign-in attempts. Try again in 15 minutes." },
});
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many accounts were created from this connection. Try again later." },
});

function asyncRoute(handler) {
  return (request, response, next) => Promise.resolve(handler(request, response, next)).catch(next);
}

function badRequest(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validEmail(value) {
  return typeof value === "string" && value.length <= 160 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function authUnavailable(response) {
  if (isLearnerAuthReady()) return false;
  response.status(503).json({ error: "Account sign-in is not configured. Set a 32-character JWT_SECRET on the server." });
  return true;
}

function validateProfileImage(value) {
  if (value === null || value === "") return "";
  if (typeof value !== "string" || value.length > 300_000) throw badRequest("Choose a smaller profile photo (maximum 220 KB after resizing).", 413);
  const match = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw badRequest("Profile photos must be uploaded as JPEG images.");
  const bytes = Buffer.from(match[1], "base64");
  if (bytes.length < 4 || bytes.length > 220_000 || bytes.toString("base64") !== match[1] || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
    throw badRequest("That profile photo is not a valid JPEG or is too large.");
  }
  return value;
}

async function requireLearner(request, response, next) {
  try {
    const learner = await getSessionLearner(request);
    if (!learner) {
      clearLearnerSessionCookie(response);
      return response.status(401).json({ error: "Sign in to access your learning space." });
    }
    request.learner = publicLearner(learner);
    next();
  } catch (error) {
    next(error);
  }
}

learnerRouter.get("/auth/session", asyncRoute(async (request, response) => {
  const learner = await getSessionLearner(request);
  response.json({ configured: isLearnerAuthReady(), authenticated: Boolean(learner), user: publicLearner(learner) });
}));

learnerRouter.post("/auth/signup", signupLimiter, asyncRoute(async (request, response) => {
  if (authUnavailable(response)) return;
  const { name = "", email = "", password = "" } = request.body ?? {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (cleanName.length < 2 || cleanName.length > 80) throw badRequest("Name must contain 2 to 80 characters.");
  if (!validEmail(cleanEmail)) throw badRequest("Enter a valid email address.");
  if (typeof password !== "string" || password.length < 12 || password.length > 256) throw badRequest("Choose a password with at least 12 characters.");
  const existing = await findLearnerByEmail(cleanEmail);
  if (existing) throw badRequest("An account with that email already exists. Sign in instead.", 409);
  const learner = await createLearner({ name: cleanName, email: cleanEmail, passwordHash: hashPassword(password), active: true });
  setLearnerSessionCookie(response, learner);
  response.status(201).json({ ok: true, user: publicLearner(learner) });
}));

learnerRouter.post("/auth/login", loginLimiter, asyncRoute(async (request, response) => {
  if (authUnavailable(response)) return;
  const { email = "", password = "" } = request.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || !email || !password || password.length > 256) {
    throw badRequest("Enter your email address and password.");
  }
  const learner = await findLearnerByEmail(email);
  if (!learner || !learner.active || !verifyPassword(password, learner.passwordHash)) {
    return response.status(401).json({ error: "Email or password is incorrect." });
  }
  const updated = await updateLearner(learner.id, { lastLoginAt: new Date().toISOString() });
  setLearnerSessionCookie(response, updated || learner);
  response.json({ ok: true, user: publicLearner(updated || learner) });
}));

learnerRouter.post("/auth/logout", asyncRoute(async (request, response) => {
  clearLearnerSessionCookie(response);
  response.json({ ok: true });
}));

learnerRouter.get("/verify/certificates/:certificateNumber", asyncRoute(async (request, response) => {
  const item = await findPublicCertificateByNumber(request.params.certificateNumber);
  if (!item) throw badRequest("No awarded certificate matches that number.", 404);
  response.json({ item });
}));

learnerRouter.patch("/learner/profile", requireLearner, asyncRoute(async (request, response) => {
  const profileImage = validateProfileImage(request.body?.profileImage);
  const learner = await updateLearner(request.learner.id, { profileImage });
  if (!learner) throw badRequest("Your learner account could not be found.", 404);
  response.json({ ok: true, user: publicLearner(learner) });
}));

learnerRouter.get("/learner/progress", requireLearner, asyncRoute(async (request, response) => {
  response.json({ items: await listLearnerProgress(request.learner.id) });
}));

learnerRouter.get("/learner/certificates", requireLearner, asyncRoute(async (request, response) => {
  response.json({ items: await listLearnerCertificates(request.learner.id) });
}));

learnerRouter.get("/learner/certificates/:identifier", requireLearner, asyncRoute(async (request, response) => {
  const certificate = await findLearnerCertificate(request.params.identifier, request.learner.id);
  if (!certificate) throw badRequest("That earned certificate was not found in your account.", 404);
  response.json({ item: certificate });
}));

learnerRouter.post("/learner/courses/:slug/lessons/:lessonIndex/complete", requireLearner, asyncRoute(async (request, response) => {
  const course = await findBySlug("courses", request.params.slug);
  if (!course) throw badRequest("Course not found.", 404);
  const lessonIndex = Number(request.params.lessonIndex);
  if (!Number.isSafeInteger(lessonIndex)) throw badRequest("Choose a valid lesson.");
  const result = await completeLearnerLesson(request.learner, course, lessonIndex);
  response.json(result);
}));
