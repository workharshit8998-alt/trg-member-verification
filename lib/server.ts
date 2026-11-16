import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const required = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};
const encKey = () => {
  const key = Buffer.from(required("TOKEN_ENCRYPTION_KEY"), "hex");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 64 hexadecimal characters");
  return key;
};
export function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encKey(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(v => v.toString("base64url")).join(".");
}
export function decrypt(value: string) {
  const [iv, tag, data] = value.split(".").map(v => Buffer.from(v, "base64url"));
  if (!iv || !tag || !data) throw new Error("Invalid encrypted token bundle");
  const decipher = createDecipheriv("aes-256-gcm", encKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
function sign(value: string) {
  return createHmac("sha256", required("SESSION_SECRET")).update(value).digest("base64url");
}
export function makeSession(userId: string) { return userId + "." + sign(userId); }
export function verifySession(value?: string | null) {
  if (!value) return null;
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const userId = value.slice(0, dot);
  const supplied = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(userId));
  return supplied.length === expected.length && timingSafeEqual(supplied, expected) ? userId : null;
}
export async function currentUserId() {
  const jar = await cookies();
  return verifySession(jar.get("trg_session")?.value);
}
export async function supabaseRequest(path: string, init: RequestInit = {}) {
  const base = required("SUPABASE_URL").replace(/\/$/, "");
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  return fetch(`${base}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });
}
export const env = (name: string) => required(name);
export const appUrl = () => required("APP_URL").replace(/\/$/, "");
