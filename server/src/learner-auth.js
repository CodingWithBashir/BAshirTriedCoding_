import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { findLearnerById } from "./storage.js";

export const LEARNER_SESSION_COOKIE = "cwb_learner_session";
const SESSION_SECONDS = 60 * 60 * 24 * 14;
const localSessionSecret = process.env.NODE_ENV === "production" ? "" : randomBytes(32).toString("base64url");

function sessionSecret() {
  const configured = process.env.JWT_SECRET;
  if (configured && Buffer.byteLength(configured) >= 32) return configured;
  return process.env.NODE_ENV === "production" ? "" : localSessionSecret;
}

export function isLearnerAuthReady() {
  return Boolean(sessionSecret());
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(learner) {
  const secret = sessionSecret();
  if (!secret) throw new Error("Learner authentication requires a 32-byte JWT_SECRET in production.");
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: String(learner.id), kind: "learner", iat: now, exp: now + SESSION_SECONDS });
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", secret).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function readCookie(request) {
  const cookies = String(request.headers.cookie || "").split(";");
  const pair = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${LEARNER_SESSION_COOKIE}=`));
  return pair ? pair.slice(LEARNER_SESSION_COOKIE.length + 1) : "";
}

function verifyToken(token) {
  const secret = sessionSecret();
  if (!secret || !token) return null;
  const pieces = token.split(".");
  if (pieces.length !== 3) return null;
  const unsigned = `${pieces[0]}.${pieces[1]}`;
  const expected = createHmac("sha256", secret).update(unsigned).digest();
  let received;
  try { received = Buffer.from(pieces[2], "base64url"); } catch { return null; }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const header = JSON.parse(Buffer.from(pieces[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(pieces[1], "base64url").toString("utf8"));
    if (header.alg !== "HS256" || payload.kind !== "learner" || !payload.sub || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionLearner(request) {
  const payload = verifyToken(readCookie(request));
  if (!payload) return null;
  const learner = await findLearnerById(payload.sub);
  return learner?.active ? learner : null;
}

export function publicLearner(learner) {
  if (!learner) return null;
  const { passwordHash: _passwordHash, ...safe } = learner;
  return safe;
}

export function setLearnerSessionCookie(response, learner) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${LEARNER_SESSION_COOKIE}=${encodeURIComponent(signToken(learner))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`);
}

export function clearLearnerSessionCookie(response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${LEARNER_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}
