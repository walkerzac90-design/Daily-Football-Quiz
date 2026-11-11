import Stripe from "stripe";
import { json, getToken, getPlayer } from "../lib/core.js";

export async function POST(request) {
  const token = getToken(request);
  if (!token) return json({ error: "Missing player code" }, 401);
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) return json({ error: "Payments aren't set up yet" }, 503);
  const p = await getPlayer(token);
  if (!p?.name) return json({ error: "Pick a player name first" }, 400);
  if (p.pro) return json({ error: "You're already on Pro" }, 400);
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = new URL(request.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    client_reference_id: token,
    subscription_data: { metadata: { token } },
    allow_promotion_codes: true,
    success_url: `${origin}/?paid=1`,
    cancel_url: `${origin}/`,
  });
  return json({ url: session.url });
}
