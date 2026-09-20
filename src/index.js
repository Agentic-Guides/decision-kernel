// Decision Kernel — judgment API（Cloudflare Workers）
// Jev (TypeSafe System One) をサーバー側で並列呼び、確信度つき判断を返す
// ★判断提案のみ。実弾・資金・送金・金融/医療の責任判断は一切行わない。
// デモページ(静的HTML)をGET / で配信し、POST /classify が判断API本体。
// TYPESAFE_API_KEY は Cloudflare Secret（暗号化）から読む。

import { DISCOVERY } from "./discovery.js";
const ENDPOINT = "https://api.typesafe.ai/v1/systemone";

// 判断タイプ：1リクエストで並列に問う（Jevの強み）
function buildQuestions(state) {
	return {
		triage: {
			type: "choice",
			instructions:
				"Which department should handle this customer message? Choose the best single fit.",
			criteria: {
				billing: "Charges, invoices, refunds, subscriptions, payments",
				technical: "Errors, broken features, bugs, app not working",
				account: "Login, password, account access, signup, security",
				sales: "Pricing, new accounts, upgrades, sales questions",
			},
		},
		urgency: {
			type: "noul",
			instructions: "Does this require immediate attention right now?",
		},
		spam: {
			type: "noul",
			instructions: "Is this spam, an automated pitch, or a promotional blast?",
		},
		tone: {
			type: "choice",
			instructions: "What is the emotional tone of this message?",
			criteria: {
				positive: "Satisfied, praising, thanking, friendly",
				neutral: "Factual, informational, procedural",
				angry: "Frustrated, upset, demanding, threatening (e.g. chargeback/cancel threat)",
			},
		},
		risk: {
			type: "noul",
			instructions:
				"Should this message require human review before any automatic action is taken?",
		},
	};
}

// 静的デモページ（英語・判断APIを試せる）
const DEMO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Decision Kernel — the judgment API</title>
<style>
  :root{--bg:#0b0f1a;--card:#131a2b;--line:#233052;--txt:#e8ecf7;--muted:#8b96b5;--acc:#5b8cff;--ok:#2ecc71;--warn:#f1c40f;}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--txt);font-family:'Segoe UI',system-ui,sans-serif;line-height:1.5;padding:40px 20px}
  .wrap{max-width:860px;margin:0 auto}
  header h1{font-size:1.8rem;letter-spacing:-0.5px}
  header p{color:var(--muted);margin-top:6px}
  .pill{display:inline-block;background:#1d2740;border:1px solid var(--line);border-radius:20px;padding:3px 12px;font-size:0.75rem;color:var(--acc);margin-top:10px}
  .demo{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;margin-top:28px}
  label{font-size:0.8rem;color:var(--muted);display:block;margin-bottom:8px}
  textarea{width:100%;background:#0d1424;border:1px solid var(--line);border-radius:10px;color:var(--txt);padding:14px;font-size:1rem;min-height:80px;resize:vertical}
  button{background:var(--acc);color:#fff;border:none;border-radius:10px;padding:12px 22px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:14px}
  button:disabled{opacity:.5;cursor:wait}
  .spin{display:none;color:var(--muted);font-size:0.85rem;margin-top:10px}
  .res{margin-top:20px}
  .judg{background:#0d1424;border:1px solid var(--line);border-radius:10px;padding:14px;margin-top:10px;font-size:0.92rem}
  .judg b{color:var(--acc)}
  .tag{display:inline-block;border-radius:6px;padding:2px 10px;font-size:0.8rem;margin:2px}
  .t-ok{background:#10281a;color:var(--ok)} .t-warn{background:#2a2208;color:var(--warn)}
  footer{margin-top:40px;color:var(--muted);font-size:0.8rem}
  .code{background:#0d1424;border:1px solid var(--line);border-radius:8px;padding:12px;font-family:monospace;font-size:0.8rem;white-space:pre-wrap;margin-top:10px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>⚡ Decision Kernel</h1>
    <p>The judgment API — a decision that was too expensive per row now fits in your pipeline.</p>
    <span class="pill">Jev · TypeSafe System One · Cloudflare</span>
  </header>

  <div class="demo">
    <label>Paste a customer message:</label>
    <textarea id="msg">This is the THIRD time I was charged wrong. I am furious. Fix it or I will cancel and write bad reviews everywhere.</textarea>
    <button id="go">Run 5 judgments →</button>
    <div id="spin" class="spin">Jev is deciding… (~0.5s)</div>
    <div class="res" id="res"></div>
  </div>

  <div class="demo">
    <label>Use it via HTTP</label>
    <div class="code">curl -X POST https://decision-kernel.pickaxe.workers.dev/classify \\
  -H "Content-Type: application/json" \\
  -d '{"text":"I was charged twice and want a refund"}'</div>
  </div>

  <footer>
    Judgment proposals only — no money movement. Judgments: triage · urgency · spam · tone · risk-to-review.
  </footer>
</div>
<script>
document.getElementById('go').onclick = async () => {
  const btn=document.getElementById('go'), res=document.getElementById('res'), msg=document.getElementById('msg');
  btn.disabled=true; document.getElementById('spin').style.display='block'; res.innerHTML='';
  try {
    const r = await fetch('/classify', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({text: msg.value})});
    const d = await r.json();
    if (d.error) { res.innerHTML = '<div class="judg">Error: '+d.error+'</div>'; return; }
    const j = d.judgments;
    let h='';
    h += row('Department', j.triage.choice, tag(j.triage.confidence));
    h += row('Urgency', pct(j.urgency.score), warn(j.urgency.score));
    h += row('Spam', pct(j.spam.score), warn(j.spam.score));
    h += row('Tone', j.tone.choice, '');
    h += row('Needs human review', pct(j.risk.score), warn(j.risk.score));
    res.innerHTML = '<div class="judg">'+h+'</div>';
  } catch(e) { res.innerHTML='<div class="judg">Request failed: '+e+'</div>'; }
  finally { btn.disabled=false; document.getElementById('spin').style.display='none'; }
};
function row(k,v,t){ return '<div style="margin:6px 0"><b>'+k+'</b>: '+v+' '+ (t||'') + '</div>'; }
function tag(c){ c=c??0; return c>=0.8?'<span class="tag t-ok">conf '+(c*100|0)+'%</span>':'<span class="tag t-warn">conf '+(c*100|0)+'%</span>'; }
function pct(x){ x=x??0; return (x*100|0)+'%'; }
function warn(x){ return (x??0)>=0.7?'<span class="tag t-warn">ACT</span>':''; }
</script>
</body>
</html>`;

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type",
				},
			});
		}

		// デモページ（静的HTML）
		if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/demo")) {
			return new Response(DEMO_HTML, {
				headers: { "Content-Type": "text/html; charset=utf-8" },
			});
		}

		// ==== エージェント発見ファイル（AIエージェントが発見・理解・呼べるように）====
		// llms.txt
		if (request.method === "GET" && url.pathname === "/llms.txt") {
			return new Response(DISCOVERY["llms.txt"], { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
		}
		// agents.txt（bot.txt相当・能力告知）
		if (request.method === "GET" && url.pathname === "/agents.txt") {
			return new Response(DISCOVERY["agents.txt"], { headers: { "Content-Type": "text/plain; charset=utf-8" } });
		}
		// agents.md（人間可読版）
		if (request.method === "GET" && url.pathname === "/agents.md") {
			return new Response(DISCOVERY["agents.md"], { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
		}
		// openapi.json（機械可読スキーマ）
		if (request.method === "GET" && url.pathname === "/openapi.json") {
			return new Response(DISCOVERY["openapi.json"], { headers: { "Content-Type": "application/json" } });
		}
		// robots.txt（AIクローラー明示Allow）
		if (request.method === "GET" && url.pathname === "/robots.txt") {
			return new Response(DISCOVERY["robots.txt"], { headers: { "Content-Type": "text/plain" } });
		}
		// sitemap.xml
		if (request.method === "GET" && url.pathname === "/sitemap.xml") {
			return new Response(DISCOVERY["sitemap"], { headers: { "Content-Type": "application/xml" } });
		}
		// .well-known/agent.json（AgentCard）
		if (request.method === "GET" && url.pathname === "/.well-known/agent.json") {
			return new Response(DISCOVERY["agentCard"], { headers: { "Content-Type": "application/json" } });
		}
		// .well-known/ai-catalog.json（ARD・Google等AIサイト登録）
		if (request.method === "GET" && url.pathname === "/.well-known/ai-catalog.json") {
			return new Response(DISCOVERY["aiCatalog"], { headers: { "Content-Type": "application/json" } });
		}

		if (url.pathname === "/health") {
			return Response.json({
				status: "ok", service: "decision-kernel", version: "0.4.0-demo",
				jev: env.TYPESAFE_API_KEY ? "configured" : "missing",
				note: "Judgment proposal only. No money movement.",
			});
		}

		// APIドキュメント（JSON）
		if (request.method === "GET" && url.pathname === "/docs") {
			return Response.json({
				name: "Decision Kernel — the judgment API",
				tagline: "A judgment that was too expensive per row now fits in your pipeline.",
				base_url: "https://decision-kernel.pickaxe.workers.dev",
				endpoints: ["GET /", "GET /health", "GET /docs", "POST /classify"],
				judgments: ["triage", "urgency", "spam", "tone", "risk"],
				example: { method: "POST /classify", body: { text: "hello" } },
			});
		}

		// 判断API本体（全タイプを並列判定）
		if (url.pathname === "/classify" && request.method === "POST") {
			if (!env.TYPESAFE_API_KEY) {
				return Response.json({ error: "TYPESAFE_API_KEY not configured (Cloudflare secret)" }, { status: 503 });
			}
			let body;
			try { body = await request.json(); } catch { return Response.json({ error: "invalid json" }, { status: 400 }); }
			const text = (body.text || "").toString().trim();
			if (!text) { return Response.json({ error: "text required" }, { status: 400 }); }

			// 構造化state（公式スキル: 質問に必要な文脈を含める）
			const state = {
				message: text,
				source: body.source || "web",
				language: body.language || null,
			};

			const payload = {
				model: "jev-latest",
				state: state,
				questions: buildQuestions(),
			};

			try {
				const resp = await fetch(ENDPOINT, {
					method: "POST",
					headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.TYPESAFE_API_KEY}` },
					body: JSON.stringify(payload),
				});
				if (!resp.ok) return Response.json({ error: "Jev upstream error", status: resp.status }, { status: 502 });
				const data = await resp.json();
				const a = data.answers || {};
				return Response.json({
					judgments: {
						triage: { choice: a.triage?.choice, probabilities: a.triage?.probabilities, confidence: a.triage?.confidence },
						urgency: { score: a.urgency?.noul },
						spam: { score: a.spam?.noul },
						tone: { choice: a.tone?.choice, confidence: a.tone?.confidence },
						risk: { score: a.risk?.noul },
					},
					note: "Judgment proposal only. No money movement.",
				});
			} catch (e) {
				return Response.json({ error: "Jev call failed", detail: String(e) }, { status: 502 });
			}
		}

		return Response.json({ error: "not found" }, { status: 404 });
	},
};
