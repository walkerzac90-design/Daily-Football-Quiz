import Stripe from "stripe";
import { redis, json, getPlayer, savePlayer } from "../lib/core.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_missing");

async function setPro(token, pro, extra = {}) {
  const p = (await getPlayer(token)) || {};
  await savePlayer(token, { ...p, ...extra, pro });
}

export async function POST(request) {
  const raw = await request.text(); // the raw body is needed to verify Stripe's signature
  let ev;
  try {
    ev = stripe.webhooks.constructEvent(raw, request.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return json({ error: "Bad signature" }, 400);
  }
  const o = ev.data.object;
  if (ev.type === "checkout.session.completed" && o.mode === "subscription" && o.client_reference_id) {
    await redis.set("sub:" + o.subscription, o.client_reference_id);
    await setPro(o.client_reference_id, true, { customer: o.customer, sub: o.subscription });
  } else if (ev.type === "customer.subscription.updated" || ev.type === "customer.subscription.deleted") {
    const token = o.metadata?.token || (await redis.get("sub:" + o.id));
    if (token) await setPro(token, ev.type !== "customer.subscription.deleted" && ["active", "trialing"].includes(o.status));
  }
  return json({ received: true });
}
