# Cloudflare and abuse protection

The protection that matters runs **inside the app**, so it works on Vercel with no extra setup. Cloudflare adds one free piece (Turnstile) and one optional extra.

## What the app already does
| Layer | What it stops | Where |
|---|---|---|
| Trusted client address (platform headers only; IPv6 grouped by /64; stored only as a keyed hash) | Forged `X-Forwarded-For`, rotating IPv6, raw IPs in the database | `src/lib/net/clientIp.ts`, `TRUST_PROXY` |
| Per-address, per-person and app-wide limits for the AI chat (minute, hour, day) | One phone, one account or a botnet using up a free model's quota | `src/lib/ai/policy.ts` |
| Lower daily limit for accounts younger than 24 hours | Mass-signup farming | `NEW_ACCOUNT_HOURS` |
| Daily token budget per person and for the whole app | Long questions burning the quota | `AI_USER_TOKENS_PER_DAY`, `AI_GLOBAL_TOKENS_PER_DAY` |
| One answer at a time per person | Parallel spam | lock in `src/server/ai/service.ts` |
| Cooldown after the provider says "slow down", "quota" or "bad key" | Hundreds of failed calls in a row | `src/lib/ai/providerError.ts` |
| Short questions (600 chars), 4 turns of history, 450 output tokens | Wasted tokens | `src/lib/ai/limits.ts`, `AI_MAX_OUTPUT_TOKENS` |
| Phone numbers, emails and links removed before the provider sees a question | Contact details going to a free tier that may keep prompts | `src/lib/ai/scrub.ts` |
| Emergency messages never call the model and are never limited | A parent in trouble getting blocked | `src/lib/ai/safety.ts` |
| Daily email cap (`MAIL_DAILY_CAP`, default 250) and per-address sign-up cap | Sign-up spam burning the free email plan | `src/server/auth/service.ts` |
| Hashed rate-limit keys (no emails or addresses stored) | Personal data sitting in the limiter table | `limiterKey` in `src/server/auth/crypto.ts` |
| Same-origin check, sign-in required, JSON only, body size cap | Cross-site and anonymous abuse of `/api/chat` | `src/app/api/chat/route.ts` |
| Daily cleanup (`/api/cron/cleanup`, needs `CRON_SECRET`) | Old counters, sessions, codes and never-verified accounts piling up | `vercel.json` |

## Turnstile (free bot check): recommended
1. Cloudflare dashboard > Turnstile > Add site. Add your exact hostname (for example `cribs-ecru.vercel.app`) and `localhost` for testing. Widget mode: Managed.
2. Copy the **site key** and the **secret key**.
3. Vercel > Settings > Environment Variables:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the site key (plain)
   - `TURNSTILE_SECRET_KEY` = the secret key (**Sensitive**)
4. Redeploy. Sign-up and "forgot password" now show the check. If either variable is missing the check is simply off.

If Cloudflare is unreachable the check **fails closed** (sign-up is refused) so bots cannot slip through an outage.

## Putting the whole site behind Cloudflare: not recommended for now
- Cloudflare's WAF and rate-limit rules only work when your domain's DNS is proxied through Cloudflare, which needs a custom domain.
- The `*.vercel.app` address stays reachable directly, so a header like `CF-Connecting-IP` could be forged unless direct access is blocked (a Vercel paid feature). That is why `TRUST_PROXY` stays `vercel`.
- If you later do proxy through Cloudflare, ask before changing `TRUST_PROXY`.

## Emergency switches
- Vercel > Firewall > **Attack Challenge Mode** (free): turns on a challenge for every visitor during an attack.
- Lower `AI_GLOBAL_PER_DAY` or remove the AI key in Vercel and redeploy. The Ask tab then shows "not available" and search keeps working.

## Cloudflare AI Gateway (optional)
You can send model calls through Cloudflare's AI Gateway for a usage dashboard and caching. It works with the OpenAI-compatible provider by setting `AI_BASE_URL` to the gateway address from Cloudflare's docs. The in-app limits above still apply.
