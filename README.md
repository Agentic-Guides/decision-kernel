# 🧠 Decision Kernel

> **The judgment API — a decision that was too expensive per row now fits in your pipeline.**

Decision Kernel exposes [TypeSafe Jev](https://typesafe.ai/) (a System One decision
model) as a fast, **calibrated, low-cost judgment API**. Send text; get department
(triage), urgency, spam, tone, and whether it needs human review — **all in one
request, ~0.5s, with explicit confidence**.

It also exposes **`/guard`** — an **agent-safety gate**: before an agent spends
money, deletes data, or touches production, ask Decision Kernel to judge
`approve / review / block` with Jev's verdict.

Deployed on **Cloudflare Workers**. Judgment proposals only — no money movement,
no financial/medical/legal accountability (classification + routing suggestions
only). **The guard never executes anything itself.**

## Why judgment APIs

Most agent loops ask an LLM to pick between a few known answers, token by token,
slowing every call and paying for prose nobody reads. A decision model returns a
typed answer and a **calibrated probability in milliseconds**. Where code already
knows the possible answers, a judgment is the right interface.

> `LLMs think. Jev decides. Tools act.`

## Try it

- **Live web demo:** https://decision-kernel.pickaxe.workers.dev/
- **API:** `POST /classify` (email/ticket triage)
- **API:** `POST /guard` (agent action safety gate)

### `/classify` — route a customer message

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

### `/guard` — stop an agent from doing something dangerous

```bash
curl -X POST https://decision-kernel.pickaxe.workers.dev/guard \
  -H "Content-Type: application/json" \
  -d '{"action":"delete the leads database file","cost":0,"goal":"send a newsletter","lastActions":[]}'
```

```json
{
  "guard": {
    "verdict": "block",
    "spend": "deny",
    "confidence": 0.99,
    "off_goal": 0.95,
    "duplicate": 0.03,
    "undoable": 0.2,
    "last_ok": 0.33,
    "lead_real": null
  }
}
```

**Verdict logic:** `spend:deny` → always **block**; `review` or low-confidence →
**review**; otherwise **approve**. A deny stops the action no matter what the
numbers say. A judgment proposal only — code in the calling agent decides whether
to proceed.

## The judgments (one request, all parallel)

| Judgment | Type | Meaning |
|---|---|---|
| `triage` | choice | Which department (billing / technical / account / sales) |
| `urgency` | noul | Needs immediate attention (0–1) |
| `spam` | noul | Is this an automated pitch (0–1) |
| `tone` | choice | positive / neutral / angry |
| `risk` | noul | Needs human review before any automatic action (0–1) |

| Guard field | Type | Meaning |
|---|---|---|
| `spend` | choice | approve / review / deny |
| `off_goal` | noul | Off today's stated objective? |
| `duplicate` | noul | Already done in recent history? |
| `undoable` | noul | Can it be reversed if it goes wrong? |
| `last_ok` | noul | Did the last step succeed? |
| `lead_real` | noul | (when a lead is passed) is this a real enquiry? |

Every judgment returns a **calibrated probability**, so routes can split on
confidence (act automatically / confirm / escalate to a human).

## Pricing (planned)

| Tier | Price | Includes |
|---|---|---|
| Free | $0 | 10 judgments / day (demo) |
| Starter | $29/mo | 2,000 judgments, all 5 types |
| Pro | $99/mo | 10,000 judgments, parallel, priority |
| Enterprise | $499/mo | Custom judgment types, SLA |

**Guard Skill** (paid): the `skill/decision-kernel-guard/SKILL.md` — a drop-in
agent skill file that wires `/guard` into Hermes, Grok bot, or any agent, with
policies (cheap+reversible runs at ≥0.7, money/deletion requires ≥0.9, deny always
stops, hold on 3s no-response). Request via the pricing above.

Cost is a Cloudflare-free-tier Worker + Jev (~$0.04 / M input tokens) — >90% gross
margin. Target: small SaaS / support teams / agent developers in English / India /
Indonesia.

## Verified results

40-agent-action day, simulated against the live `/guard` (no funds moved):

| Category | Result |
|---|---|
| 10 malicious (pay transfer, DB delete, credential leak) | **blocked 10/10** ✅ |
| 21 normal (fetch, render, validate, preview) | approved ✅ |
| 9 borderline (bulk send, CSV export, schedule) | routed to review ✅ |
| false-block rate on safe actions | **0** (after verdict fix) ✅ |

Demo: `demo/guard_demo.py`

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

