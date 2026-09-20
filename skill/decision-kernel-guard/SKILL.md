---
name: decision-kernel-guard
description: "Use before any agent action that could cost money, delete data, or touch production: ask Decision Kernel's /guard to judge whether to approve, review, or block."
version: 1.0.0
author: Agentic-Guides
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [jev, typesafe, guard, safety, decision, agent-security]
    related_skills: [ask-jev, hermes-agent]
---

# Decision Kernel — Agent Guard Skill

Gate an agent's **money-moving, destructive, or irreversible actions** through
[Decision Kernel](https://decision-kernel.pickaxe.workers.dev) — a Jev (TypeSafe
System One) judgment API that returns a `verdict` (approve / review / block) with
explicit confidence in ~0.5s. The cost is pennies ($0.042 / M input tokens; output
free). A wrong cheap decision is still wrong, so never treat confidence as truth.

## When to use

Before **any** action where the consequence of a mistake is significant, or that
cannot be undone:

- spending / ordering / paying / sending money
- deleting, overwriting, or modifying a database or file
- mailing or messaging someone (esp. to an unverified list)
- touching production / external systems
- anything whose reversibility is in doubt

Do **not** call for trivially safe, reversible operations (e.g. reading, calculating)
unless the workflow requires it.

## How to call

`POST https://decision-kernel.pickaxe.workers.dev/guard`
`Content-Type: application/json`

```json
{
  "action": "send payment of $400 to vendor",
  "cost": 400,
  "touches": "external vendor account",
  "lastActions": ["render invoice", "verify vendor address"],
  "goal": "settle outstanding invoice",
  "lead": null
}
```

Response:

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

## What the fields mean

| Field | Type | Meaning |
|---|---|---|
| `verdict` | approve / review / block | What the guard says to do |
| `spend` | approve / review / deny | Jev's direct take on this action |
| `confidence` | 0–1 | How sure Jev is about `spend` |
| `off_goal` | 0–1 | Likelihood this is off today's objective |
| `duplicate` | 0–1 | Likelihood this was already done |
| `undoable` | 0–1 | Likelihood the action can be reversed |
| `last_ok` | 0–1 | Whether the last step succeeded |

## How to act on a verdict

```python
g = response["guard"]
verdict = g["verdict"]
spend = g["spend"]

# A deny always stops, whatever the numbers say.
if spend == "deny":
    halt_and_log()

# Normal, reversible actions can run when Jev is sure enough.
if verdict == "approve" and g["confidence"] >= 0.8:
    proceed()
elif verdict == "review" or g["confidence"] < 0.7:
    ask_human()
else:
    halt_and_log()
```

**Policy (align with your risk):**
- cheap + reversible → run at ≥ 0.7
- mailing, ordering, paying, deleting → require ≥ 0.9
- a `spend: deny` always stops, regardless of confidence
- if the guard doesn't answer within ~3s, hold the action for a human

## Rules

- **Show the history.** Jev can only judge what you give it. Pass `lastActions`
  (the last 10 actions) and `goal` on every call.
- **Count money, don't ask for it.** Daily budgets and spend totals belong in
  deterministic code, added up arithmetically. Do not ask a model "have you spent
  too much?" — compute it.
- **Log every decision.** Record action, verdict, probabilities, confidence, and
  what actually happened, so you can tune thresholds against real outcomes.
- **Lead checks get full context.** When a lead is involved, pass the full message
  thread in `lead`.

## Fail-safe

`/guard` returns a judgment **proposal only**. It never moves money, runs commands,
or executes anything itself — code in the calling agent decides whether to proceed.
If the API is unreachable or errors, treat the action as **pending human review**,
never auto-approve.
