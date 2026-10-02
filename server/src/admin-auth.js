import { createHmac, timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "./passwords.js";
import {
  createAdminUser,
  findAdminByEmail,
  findAdminById,
  mongoConnected,
  updateAdminUser,
} from "./storage.js";

export const ADMIN_ROLES = ["owner", "admin", "editor", "support", "viewer"];
export const SESSION_COOKIE = "cwb_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;
export function isAdminSystemReady() {
  return Boolean(process.env.JWT_SECRET && Buffer.byteLength(process.env.JWT_SECRET) >= 32);
}

export const hashAdminPassword = hashPassword;

export async function bootstrapConfiguredOwner() {
  if (process.env.NODE_ENV === "production" && !mongoConnected) {
    console.warn("[admin] bootstrap paused until persistent MongoDB storage is connected");
    return false;
  }
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!email || !password) {
    console.info("[admin] no bootstrap owner configured; set ADMIN_EMAIL, ADMIN_PASSWORD and JWT_SECRET to enable the admin workspace");
    return false;
  }
  if (!isAdminSystemReady()) {
    console.warn("[admin] JWT_SECRET must be at least 32 bytes; admin login is disabled until it is configured");
    return false;
  }
  if (password.length < 12) {
    console.warn("[admin] ADMIN_PASSWORD must contain at least 12 characters; bootstrap owner was not created");
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn("[admin] ADMIN_EMAIL is invalid; bootstrap owner was not created");
    return false;
  }

  const existing = await findAdminByEmail(email);
  const credentials = {
    name: process.env.ADMIN_NAME?.trim().slice(0, 80) || "Portfolio owner",
    email,
    passwordHash: hashAdminPassword(password),
    role: "owner",
    active: true,
    createdBy: "environment",
  };
  if (existing) await updateAdminUser(existing.id, credentials);
  else await createAdminUser(credentials);
  console.info(`[admin] bootstrap owner is ready for ${email}`);
  return true;
}

export function publicAdmin(admin) {
  if (!admin) return null;
  const { passwordHash: _passwordHash, ...safe } = admin;
  return safe;
}

export async function authenticateCredentials(email, password) {
  const admin = await findAdminByEmail(String(email || "").trim().toLowerCase());
  if (!admin || !admin.active || !verifyPassword(password, admin.passwordHash)) return null;
  return admin;
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signToken(admin) {
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({ sub: String(admin.id), kind: "admin", iat: now, exp: now + SESSION_SECONDS });
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", process.env.JWT_SECRET).update(unsigned).digest("base64url");
  return `${unsigned}.${signature}`;
}

function readCookie(request) {
  const cookies = String(request.headers.cookie || "").split(";");
  const pair = cookies.map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${SESSION_COOKIE}=`));
  return pair ? pair.slice(SESSION_COOKIE.length + 1) : "";
}

function verifyToken(token) {
  if (!isAdminSystemReady() || !token) return null;
  const pieces = token.split(".");
  if (pieces.length !== 3) return null;
  const unsigned = `${pieces[0]}.${pieces[1]}`;
  const expected = createHmac("sha256", process.env.JWT_SECRET).update(unsigned).digest();
  let received;
  try { received = Buffer.from(pieces[2], "base64url"); } catch { return null; }
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const header = JSON.parse(Buffer.from(pieces[0], "base64url").toString("utf8"));
    const payload = JSON.parse(Buffer.from(pieces[1], "base64url").toString("utf8"));
    if (header.alg !== "HS256" || (payload.kind && payload.kind !== "admin") || !payload.sub || !Number.isFinite(payload.exp) || payload.exp <= Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getSessionAdmin(request) {
  const payload = verifyToken(readCookie(request));
  if (!payload) return null;
  const admin = await findAdminById(payload.sub);
  return admin?.active ? admin : null;
}

export function setSessionCookie(response, admin) {
  const production = process.env.NODE_ENV === "production";
  const secure = production ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=${encodeURIComponent(signToken(admin))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure}`);
}

export function clearSessionCookie(response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}
