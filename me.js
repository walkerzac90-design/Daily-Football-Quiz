import { redis, json, getToken, getPlayer, today, weekKey, todaysIds, options, correctIndex, Q, FREE, PRO, pid } from "../lib/core.js";

export async function GET(request) {
  const token = getToken(request);
  if (!token) return json({ error: "Missing player code" }, 401);
  const p = await getPlayer(token);
  const date = today(), pro = !!p?.pro, limit = pro ? PRO : FREE;
  const answered = (await redis.hgetall(`ans:${token}:${date}`)) || {};
  const questions = todaysIds(date).slice(0, limit).map((id) => {
    const q = { id, q: Q[id][0], options: options(id).map((x) => x.t) };
    const a = answered[id];
    if (a !== undefined && a !== null) {
      const [choice, ok] = String(a).split(":");
      Object.assign(q, { yours: +choice, ok: ok === "1", right: correctIndex(id) });
    }
    return q;
  });
  const week = (await redis.hget(`wk:${weekKey(date)}`, pid(token))) || { c: 0, a: 0 };
  return json({
    exists: !!p, name: p?.name || "", pro, hasCustomer: !!p?.customer,
    billing: !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID),
    free: FREE, proLimit: PRO, week: { c: week.c, a: week.a }, weekStart: weekKey(date), questions,
  });
}
