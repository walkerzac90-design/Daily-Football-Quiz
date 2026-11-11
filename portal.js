import Stripe from "stripe";
import { json, getToken, getPlayer } from "../lib/core.js";

export async function POST(request) {
  const token = getToken(request);
  const p = token && (await getPlayer(token));
  if (!p?.customer) return json({ error: "No subscription found" }, 404);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.billingPortal.sessions.create({ customer: p.customer, return_url: new URL(request.url).origin + "/" });
  return json({ url: session.url });
}
