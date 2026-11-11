import { redis, json, getToken, today, weekKey, pid } from "../lib/core.js";

export async function GET(request) {
  const token = getToken(request), me = token ? pid(token) : null;
  const all = (await redis.hgetall(`wk:${weekKey(today())}`)) || {};
  const rows = Object.entries(all)
    .map(([id, v]) => ({ id, name: v.n, c: v.c, a: v.a }))
    .sort((x, y) => y.c - x.c || x.a - y.a || x.name.localeCompare(y.name));
  const top = rows.slice(0, 20).map((r, i) => ({ rank: i + 1, name: r.name, c: r.c, a: r.a, you: r.id === me }));
  const idx = rows.findIndex((r) => r.id === me);
  const you = idx >= 20 ? { rank: idx + 1, name: rows[idx].name, c: rows[idx].c, a: rows[idx].a, you: true } : null;
  return json({ top, you, players: rows.length });
}
