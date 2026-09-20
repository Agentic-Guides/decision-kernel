// Decision Kernel — エージェント発見ファイル（llms.txt / agents.txt / openapi.json / robots.txt / sitemap.xml / agent.json / ai-catalog.json）
// ★判断提案のみ。実弾・資金・送金・金融/医療の責任判断は一切行わない。

export const DISCOVERY = {
	"llms.txt": `# Decision Kernel

> The judgment API — a decision that was too expensive per row now fits in your pipeline.

Decision Kernel exposes TypeSafe Jev (a System One decision model) as a fast,
calibrated, low-cost judgment API. Send text; get department (triage), urgency,
spam, tone, and whether it needs human review — all in one request, ~0.5s, with
explicit confidence.

Built on Cloudflare Workers. Judgment proposals only — no money movement, no
financial/medical/legal accountability (classification + routing suggestions only).

## For AI agents

- **What this is**: a judgment API. Send a message; get 5 typed judgments with
  probabilities.
- **What it can do**: \`POST /classify\` returns triage, urgency, spam, tone, risk.
  \`GET /openapi.json\` has the machine-readable schema. \`GET /agents.txt\` has the
  capability card.
- **How to use it**: curl the endpoint or add it as an MCP/tool to your agent.
  No API key (starter) — see pricing tiers.

## Key files

- [openapi.json](openapi.json) — machine-readable API spec
- [agents.txt](agents.txt) — capability announcement
- [demo](/demo) — interactive web demo (free)

## Endpoints

- \`GET /\` — web demo
- \`POST /classify\` — the judgment API (5 judgments, parallel)
- \`GET /health\` — status
- \`GET /openapi.json\` — spec
- \`GET /llms.txt\` — this file
- \`GET /agents.txt\` — capability card
`,
	"agents.txt": `# Decision Kernel — agents.txt
Name: Decision Kernel
Tagline: A decision that was too expensive per row now fits in your pipeline.
Type: AI judgment API (TypeSafe Jev / System One)
Protocols: HTTPS / OpenAPI / (x402 incoming soon)
Capabilities:
  - triage: which department handles this message (choice + confidence)
  - urgency: needs immediate attention (0-1)
  - spam: is this an automated pitch (0-1)
  - tone: positive / neutral / angry (choice)
  - risk: needs human review before any automatic action (0-1)
  - parallel: all 5 judgments in ~0.5s in ONE request
Authorization: none for starter / API-key for pro (see docs)
Language: English / India / Indonesia friendly
URL: https://decision-kernel.pickaxe.workers.dev
`,
	"agents.md": `# Decision Kernel — for AI agents

A fast, calibrated judgment API. Send a customer message; get department,
urgency, spam, tone, and risk-to-review — with probabilities — in a single,
~0.5s request.

Read \`llms.txt\` for the index and \`openapi.json\` for the schema. The core call:

\`\`\`
POST /classify
{ "text": "my app keeps crashing, please help" }
\`\`\`

\`\`\`json
{
  "judgments": {
    "triage":  { "choice": "technical", "confidence": 1 },
    "urgency": { "score": 0.4 },
    "spam":    { "score": 0.03 },
    "tone":    { "choice": "angry", "confidence": 0.45 },
    "risk":    { "score": 0.57 }
  }
}
\`\`\`

Judgment proposals only — no money movement.
`,
	"openapi.json": JSON.stringify({
		openapi: "3.0.3",
		info: {
			title: "Decision Kernel",
			version: "1.0.0",
			description:
				"The judgment API — TypeSafe Jev (System One). Classify text into triage, urgency, spam, tone, and risk-to-review with explicit confidence, in one ~0.5s request. Judgment proposals only; no money movement.",
		},
		servers: [{ url: "https://decision-kernel.pickaxe.workers.dev" }],
		paths: {
			"/classify": {
				post: {
					summary: "Return 5 typed judgments for a message",
					requestBody: {
						required: true,
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										text: { type: "string", description: "The message to judge" },
									},
									required: ["text"],
								},
							},
						},
					},
					responses: {
						200: {
							description: "Judgments",
							content: {
								"application/json": {
									schema: {
										type: "object",
										properties: {
											judgments: {
												type: "object",
												properties: {
													triage: { type: "object" },
													urgency: { type: "object" },
													spam: { type: "object" },
													tone: { type: "object" },
													risk: { type: "object" },
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			"/health": {
				get: { summary: "Service status", responses: { 200: { description: "ok" } } },
			},
		},
	}, null, 2),
	"robots.txt": `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Perplexity-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: anthropic-ai
Allow: /

Sitemap: https://decision-kernel.pickaxe.workers.dev/sitemap.xml
`,
	sitemap: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://decision-kernel.pickaxe.workers.dev/</loc><priority>1.0</priority></url>
  <url><loc>https://decision-kernel.pickaxe.workers.dev/openapi.json</loc><priority>0.9</priority></url>
  <url><loc>https://decision-kernel.pickaxe.workers.dev/llms.txt</loc><priority>0.8</priority></url>
  <url><loc>https://decision-kernel.pickaxe.workers.dev/agents.txt</loc><priority>0.8</priority></url>
</urlset>
`,
	agentCard: JSON.stringify({
		type: "object",
		name: "Decision Kernel",
		version: "1.0.0",
		description: "The judgment API — TypeSafe Jev (System One). Classify text into triage, urgency, spam, tone, and risk-to-review with explicit confidence in ~0.5s.",
		url: "https://decision-kernel.pickaxe.workers.dev",
		capabilities: [
			{ name: "classify", description: "5 parallel judgments in one request", input_schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"] }, endpoint: "/classify" },
		],
	}, null, 2),
	aiCatalog: JSON.stringify({
		name: "Decision Kernel",
		version: "1.0.0",
		description: "AI judgment API built on TypeSafe Jev — triage, urgency, spam, tone, risk-to-review with calibrated confidence.",
		url: "https://decision-kernel.pickaxe.workers.dev",
		tags: ["judgment", "api", "jev", "typesafe", "classification", "routing"],
		capabilities: ["classify"],
	}, null, 2),
};
