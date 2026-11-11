import { Redis } from "@upstash/redis";
import { createHash } from "node:crypto";
import { QUESTIONS as Q } from "./questions.js";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});
export { Q };
export const FREE = 3, PRO = 10, PER_DAY = 10;
const TZ = process.env.QUIZ_TZ || "Europe/London";

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()); // YYYY-MM-DD
const parts = (d) => d.split("-").map(Number);
export const dayNum = (d) => { const [y, m, x] = parts(d); return Math.floor(Date.UTC(y, m - 1, x) / 864e5); };
export const weekKey = (d) => {
  const [y, m, x] = parts(d); const dt = new Date(Date.UTC(y, m - 1, x));
  dt.setUTCDate(dt.getUTCDate() - ((dt.getUTCDay() + 6) % 7));
  return dt.toISOString().slice(0, 10);
};
export const todaysIds = (d) => [...Array(PER_DAY)].map((_, i) => (dayNum(d) * PER_DAY + i) % Q.length);

// Options are rotated by a fixed amount so everyone sees the same order. Index 0 of each bank row is the right answer.
export function options(id) {
  const o = Q[id].slice(1).map((t, k) => ({ t, ok: k === 0 }));
  const r = id % 4;
  return o.map((_, k) => o[(k + r) % 4]);
}
export const correctIndex = (id) => options(id).findIndex((x) => x.ok);

export function getToken(request) {
  const t = request.headers.get("x-player") || "";
  return /^[a-f0-9]{32,96}$/.test(t) ? t : null;
}
export const pid = (token) => createHash("sha256").update(token).digest("hex").slice(0, 16);
export async function getPlayer(token) {
  return (await redis.get("player:" + token)) || null;
}
export const savePlayer = (token, p) => redis.set("player:" + token, p);
