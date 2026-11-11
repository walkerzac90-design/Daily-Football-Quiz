# Daily Football Quiz (Vercel)

Static front end (`public/`) + serverless API (`api/`) + Upstash Redis for storage + Stripe subscriptions.

- Answers are checked on the server, so players can't read them from the page.
- Free players get 3 questions a day, Pro players get 10. Limits are enforced on the server.
- "Today" and "this week" roll over in the `QUIZ_TZ` timezone (default Europe/London). The leaderboard resets every Monday.
- Players are identified by a private random code stored in their browser (no passwords). They can copy it to restore their account on another device.

## Deploy

1. Create a GitHub repo and push this folder. (Or run `npx vercel` from this folder.)
2. At vercel.com, choose **Add New → Project** and import the repo. No build settings are needed.
3. In the project, open **Storage → Marketplace → Upstash Redis**, create a database and connect it. This adds the `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`) variables for you.

## Stripe (start in Test mode)

1. Stripe Dashboard → **Product catalogue → Add product**. Add a recurring monthly price (e.g. £2.99). Copy the **Price ID** (`price_...`).
2. **Developers → API keys**: copy the **Secret key** (`sk_test_...`).
3. In Vercel → **Settings → Environment Variables**, add:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID`
   - `QUIZ_TZ` (optional)
4. Deploy, then copy your live URL (e.g. `https://your-quiz.vercel.app`).
5. Stripe → **Developers → Webhooks → Add endpoint**:
   - URL: `https://your-quiz.vercel.app/api/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (`whsec_...`) into Vercel as `STRIPE_WEBHOOK_SECRET`.
6. In Stripe, turn on the **Customer portal** (Settings → Billing → Customer portal) so Pro players can cancel.
7. **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables take effect.
8. Test with card `4242 4242 4242 4242`, any future expiry and any CVC. The player should become Pro within a few seconds.
9. When happy, repeat with Live mode keys, a live price and a live webhook endpoint.

## Adding questions

Edit `lib/questions.js`. Each row is `[question, correct answer, wrong, wrong, wrong]`. Add new rows at the **end** only. Push to GitHub and Vercel redeploys. With N questions at 10 a day, the cycle repeats every N/10 days, so aim for 400+ for a year without repeats.

## Notes

- The leaderboard reads one Redis hash per week, which is fine for thousands of players. Beyond that, switch it to a sorted set.
- There is no rate limiting. Add one (for example Upstash Ratelimit) if you see abuse.
