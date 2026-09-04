import * as http from "node:http";
import * as url from "node:url";
import { LeanRunner } from "./runner.js";

const runner = new LeanRunner();
const PORT = parseInt(process.argv[2], 10) || 8001;

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res: http.ServerResponse, data: any, statusCode: number = 200) {
  setCorsHeaders(res);
  res.setHeader("Content-Type", "application/json");
  res.writeHead(statusCode);
  res.end(JSON.stringify(data, null, 2));
}

async function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk.toString(); });
    req.on("end", () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error("Invalid JSON payload"));
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || "", true);
  const pathname = parsedUrl.pathname || "";

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/lean/health
  if (req.method === "GET" && (pathname === "/api/lean/health" || pathname === "/health")) {
    const health = await runner.getHealth();
    return sendJson(res, health);
  }

  // POST /api/lean/verify
  if (req.method === "POST" && pathname === "/api/lean/verify") {
    try {
      const payload = await parseBody(req);
      const code = payload.code || "";
      const includeScaffold = payload.includeScaffold !== false;

      if (!code.trim()) {
        return sendJson(res, { error: "Code snippet cannot be empty." }, 400);
      }

      const result = await runner.verifySnippet(code, includeScaffold);
      return sendJson(res, result);
    } catch (err: any) {
      return sendJson(res, { error: err.message }, 500);
    }
  }

  // POST /api/lean/prove
  // Generates and verifies a structured theorem: e.g. "theorem name : goal := by tactic"
  if (req.method === "POST" && pathname === "/api/lean/prove") {
    try {
      const payload = await parseBody(req);
      const name = payload.theoremName || "middleway_thm";
      const goal = payload.goal || "True";
      const tactics = payload.tactics || payload.tactic || "trivial";

      const theoremSnippet = `theorem ${name} : ${goal} := by\n  ${tactics}\n`;
      const result = await runner.verifySnippet(theoremSnippet, true);

      return sendJson(res, {
        theorem: theoremSnippet,
        ...result
      });
    } catch (err: any) {
      return sendJson(res, { error: err.message }, 500);
    }
  }

  // 404 for unknown endpoints
  sendJson(res, { error: `Endpoint not found: ${req.method} ${pathname}` }, 404);
});

server.listen(PORT, () => {
  console.log(`\n============================================================`);
  console.log(`  Lean 4 Middle Way Service running on http://localhost:${PORT}`);
  console.log(`  - Health: GET  http://localhost:${PORT}/api/lean/health`);
  console.log(`  - Verify: POST http://localhost:${PORT}/api/lean/verify`);
  console.log(`  - Prove:  POST http://localhost:${PORT}/api/lean/prove`);
  console.log(`============================================================\n`);
});
