import { redis, json, getToken, getPlayer, savePlayer, today, weekKey, pid } from "../lib/core.js";

export async function POST(request) {
  const token = getToken(request);
  if (!token) return json({ error: "Missing player code" }, 401);
  const { name } = await request.json().catch(() => ({}));
  const clean = String(name || "").replace(/[<>&"]/g, "").trim().slice(0, 20);
  if (clean.length < 2) return json({ error: "Name must be at least 2 characters" }, 400);
  const p = (await getPlayer(token)) || { pro: false };
  await savePlayer(token, { ...p, name: clean });
  const key = `wk:${weekKey(today())}`, cur = await redis.hget(key, pid(token));
  if (cur) await redis.hset(key, { [pid(token)]: { ...cur, n: clean } });
  return json({ name: clean });
}
