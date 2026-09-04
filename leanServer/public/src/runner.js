"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeanRunner = void 0;
const node_child_process_1 = require("node:child_process");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
class LeanRunner {
    leanPath;
    scaffoldPath;
    scratchDir;
    constructor(projectRoot) {
        const root = projectRoot || path.resolve(__dirname, "..", "..");
        this.scaffoldPath = path.join(root, "MiddleWayLean", "Scaffold.lean");
        this.scratchDir = path.join(root, "leanServer", "scratch");
        if (!fs.existsSync(this.scratchDir)) {
            fs.mkdirSync(this.scratchDir, { recursive: true });
        }
        this.leanPath = this.resolveLeanBinary();
    }
    resolveLeanBinary() {
        // 1. Check userprofile elan path on Windows
        const elanPath = path.join(process.env.USERPROFILE || "C:\\Users\\jprya", ".elan", "bin", process.platform === "win32" ? "lean.exe" : "lean");
        if (fs.existsSync(elanPath)) {
            return elanPath;
        }
        // 2. Fall back to PATH
        return process.platform === "win32" ? "lean.exe" : "lean";
    }
    async getHealth() {
        return new Promise((resolve) => {
            const proc = (0, node_child_process_1.spawn)(this.leanPath, ["--version"]);
            let stdout = "";
            proc.stdout.on("data", (d) => { stdout += d.toString(); });
            proc.on("close", (code) => {
                resolve({
                    status: code === 0 ? "ok" : "error",
                    leanVersion: stdout.trim(),
                    leanPath: this.leanPath,
                    scaffoldFound: fs.existsSync(this.scaffoldPath)
                });
            });
            proc.on("error", (err) => {
                resolve({
                    status: "unavailable",
                    leanVersion: err.message,
                    leanPath: this.leanPath,
                    scaffoldFound: fs.existsSync(this.scaffoldPath)
                });
            });
        });
    }
    async verifySnippet(code, includeScaffold = true) {
        const startMs = Date.now();
        const tempFileId = `verify_${Date.now()}_${Math.floor(Math.random() * 10000)}.lean`;
        const tempFilePath = path.join(this.scratchDir, tempFileId);
        let fullCode = "";
        if (includeScaffold && fs.existsSync(this.scaffoldPath)) {
            const scaffoldContent = fs.readFileSync(this.scaffoldPath, "utf-8");
            fullCode = `${scaffoldContent}\n\n-- === USER VERIFICATION SNIPPET ===\nnamespace MiddleWay\n\n${code}\n\nend MiddleWay\n`;
        }
        else {
            fullCode = code;
        }
        fs.writeFileSync(tempFilePath, fullCode, "utf-8");
        return new Promise((resolve) => {
            const proc = (0, node_child_process_1.spawn)(this.leanPath, [tempFilePath]);
            let stdout = "";
            let stderr = "";
            const timeout = setTimeout(() => {
                proc.kill();
                cleanup();
                resolve({
                    success: false,
                    qed: false,
                    executionTimeMs: Date.now() - startMs,
                    diagnostics: [{ line: 1, col: 1, severity: "error", message: "Lean verification timed out (5s limit exceeded)." }],
                    rawOutput: "Timeout"
                });
            }, 5000);
            proc.stdout.on("data", (d) => { stdout += d.toString(); });
            proc.stderr.on("data", (d) => { stderr += d.toString(); });
            const cleanup = () => {
                clearTimeout(timeout);
                try {
                    if (fs.existsSync(tempFilePath))
                        fs.unlinkSync(tempFilePath);
                }
                catch { }
            };
            proc.on("close", (exitCode) => {
                cleanup();
                const duration = Date.now() - startMs;
                const combinedOutput = (stdout + "\n" + stderr).trim();
                const diagnostics = this.parseDiagnostics(combinedOutput);
                const hasErrors = exitCode !== 0 || diagnostics.some(d => d.severity === "error");
                const isQed = !hasErrors && !combinedOutput.includes("unsolved goals") && !combinedOutput.includes("sorry");
                resolve({
                    success: !hasErrors,
                    qed: isQed,
                    executionTimeMs: duration,
                    diagnostics,
                    rawOutput: combinedOutput
                });
            });
            proc.on("error", (err) => {
                cleanup();
                resolve({
                    success: false,
                    qed: false,
                    executionTimeMs: Date.now() - startMs,
                    diagnostics: [{ line: 1, col: 1, severity: "error", message: err.message }],
                    rawOutput: err.stack || err.message
                });
            });
        });
    }
    parseDiagnostics(output) {
        const diagRegex = /^(?:.*[/\\])?([^:]+):(\d+):(\d+):\s+(error|warning|info):\s+(.+)$/gm;
        const diags = [];
        let match;
        while ((match = diagRegex.exec(output)) !== null) {
            diags.push({
                line: parseInt(match[2], 10),
                col: parseInt(match[3], 10),
                severity: match[4],
                message: match[5].trim()
            });
        }
        return diags;
    }
}
exports.LeanRunner = LeanRunner;
