import { redis, json, getToken, getPlayer, today, weekKey, todaysIds, correctIndex, FREE, PRO, pid } from "../lib/core.js";

export async function POST(request) {
  const token = getToken(request);
  if (!token) return json({ error: "Missing player code" }, 401);
  const p = await getPlayer(token);
  if (!p?.name) return json({ error: "Pick a player name first" }, 400);
  const { id, choice } = await request.json().catch(() => ({}));
  const date = today(), limit = p.pro ? PRO : FREE;
  if (!todaysIds(date).slice(0, limit).includes(id)) return json({ error: "That question isn't available to you today" }, 403);
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) return json({ error: "Invalid choice" }, 400);

  const right = correctIndex(id), ok = choice === right;
  const key = `ans:${token}:${date}`;
  const fresh = await redis.hsetnx(key, String(id), `${choice}:${ok ? 1 : 0}`);
  if (!fresh) return json({ error: "Already answered" }, 409);
  await redis.expire(key, 8 * 86400);

  const wk = `wk:${weekKey(date)}`, me = pid(token);
  const cur = (await redis.hget(wk, me)) || { n: p.name, c: 0, a: 0 };
  await redis.hset(wk, { [me]: { n: p.name, c: cur.c + (ok ? 1 : 0), a: cur.a + 1 } });
  await redis.expire(wk, 40 * 86400);
  return json({ ok, right });
}
