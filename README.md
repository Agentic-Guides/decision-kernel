# 🧠 Decision Kernel

> **The judgment API — a decision that was too expensive per row now fits in your pipeline.**

Decision Kernel exposes [TypeSafe Jev](https://typesafe.ai/) (a System One decision
model) as a fast, **calibrated, low-cost judgment API**. Send text; get department
(triage), urgency, spam, tone, and whether it needs human review — **all in one
request, ~0.5s, with explicit confidence**.

Deployed on **Cloudflare Workers**. Judgment proposals only — no money movement,
no financial/medical/legal accountability (classification + routing suggestions
only).

## Why judgment APIs

Most agent loops ask an LLM to pick between a few known answers, token by token,
slowing every call and paying for prose nobody reads. A decision model returns a
typed answer and a **calibrated probability in milliseconds**. Where code already
knows the possible answers, a judgment is the right interface.

> `LLMs think. Jev decides. Tools act.`

## Try it

- **Live web demo:** https://decision-kernel.pickaxe.workers.dev/
- **API:** `POST /classify`

```bash
curl -X POST https://decision-kernel.pickaxe.workers.dev/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"my app keeps crashing when I try to export my data, please help"}'
```

```json
{
  "judgments": {
    "triage":  { "choice": "technical", "confidence": 1 },
    "urgency": { "score": 0.4 },
    "spam":    { "score": 0.03 },
    "tone":    { "choice": "angry", "confidence": 0.45 },
    "risk":    { "score": 0.57 }
  }
}
```

## The judgments (one request, all parallel)

| Judgment | Type | Meaning |
|---|---|---|
| `triage` | choice | Which department (billing / technical / account / sales) |
| `urgency` | noul | Needs immediate attention (0–1) |
| `spam` | noul | Is this an automated pitch (0–1) |
| `tone` | choice | positive / neutral / angry |
| `risk` | noul | Needs human review before any automatic action (0–1) |

Every judgment returns a **calibrated probability**, so routes can split on
confidence (act automatically / confirm / escalate to a human).

## Pricing (planned)

| Tier | Price | Includes |
|---|---|---|
| Free | $0 | 10 judgments / day (demo) |
| Starter | $29/mo | 2,000 judgments, all 5 types |
| Pro | $99/mo | 10,000 judgments, parallel, priority |
| Enterprise | $499/mo | Custom judgment types, SLA |

Cost is a Cloudflare-free-tier Worker + Jev (~$0.04 / M input tokens) — >90% gross
margin. Target: small SaaS / support teams in English / India / Indonesia.

## Agent discovery

Decision Kernel is built for AI agents:
- `llms.txt` — index & briefing
- `agents.txt` — capability card
- `agents.md` — human-readable guide
- `openapi.json` — machine-readable schema
- `robots.txt` — explicit AI-crawler allow
- `sitemap.xml`
- `/.well-known/agent.json` — AgentCard
- `/.well-known/ai-catalog.json` — ARD registry

## Run it yourself

```bash
npx wrangler deploy
# then set the secret (never committed):
echo "$YOUR_KEY" | npx wrangler secret put TYPESAFE_API_KEY
```

## Stack
- Cloudflare Workers (free tier, serverless)
- TypeSafe Jev (System One decision model)
- MIT License

---

**Judgment proposals only. No money movement.**
