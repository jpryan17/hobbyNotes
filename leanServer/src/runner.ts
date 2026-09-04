import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface Diagnostic {
  line: number;
  col: number;
  severity: "error" | "warning" | "info";
  message: string;
}

export interface VerificationResult {
  success: boolean;
  qed: boolean;
  executionTimeMs: number;
  diagnostics: Diagnostic[];
  rawOutput: string;
}

export class LeanRunner {
  private leanPath: string;
  private scaffoldPath: string;
  private scratchDir: string;

  constructor(projectRoot?: string) {
    const root = projectRoot || path.resolve(__dirname, "..", "..");
    this.scaffoldPath = path.join(root, "MiddleWayLean", "Scaffold.lean");
    this.scratchDir = path.join(root, "leanServer", "scratch");

    if (!fs.existsSync(this.scratchDir)) {
      fs.mkdirSync(this.scratchDir, { recursive: true });
    }

    this.leanPath = this.resolveLeanBinary();
  }

  private resolveLeanBinary(): string {
    // 1. Check userprofile elan path on Windows
    const elanPath = path.join(
      process.env.USERPROFILE || "C:\\Users\\jprya",
      ".elan",
      "bin",
      process.platform === "win32" ? "lean.exe" : "lean"
    );
    if (fs.existsSync(elanPath)) {
      return elanPath;
    }
    // 2. Fall back to PATH
    return process.platform === "win32" ? "lean.exe" : "lean";
  }

  public async getHealth(): Promise<{ status: string; leanVersion: string; leanPath: string; scaffoldFound: boolean }> {
    return new Promise((resolve) => {
      const proc = spawn(this.leanPath, ["--version"]);
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

  public async verifySnippet(code: string, includeScaffold: boolean = true): Promise<VerificationResult> {
    const startMs = Date.now();
    const tempFileId = `verify_${Date.now()}_${Math.floor(Math.random() * 10000)}.lean`;
    const tempFilePath = path.join(this.scratchDir, tempFileId);

    let fullCode = "";
    if (includeScaffold && fs.existsSync(this.scaffoldPath)) {
      const scaffoldContent = fs.readFileSync(this.scaffoldPath, "utf-8");
      fullCode = `${scaffoldContent}\n\n-- === USER VERIFICATION SNIPPET ===\nnamespace MiddleWay\n\n${code}\n\nend MiddleWay\n`;
    } else {
      fullCode = code;
    }

    fs.writeFileSync(tempFilePath, fullCode, "utf-8");

    return new Promise((resolve) => {
      const proc = spawn(this.leanPath, [tempFilePath]);
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
          if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        } catch {}
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

  private parseDiagnostics(output: string): Diagnostic[] {
    const diagRegex = /^(?:.*[/\\])?([^:]+):(\d+):(\d+):\s+(error|warning|info):\s+(.+)$/gm;
    const diags: Diagnostic[] = [];
    let match;

    while ((match = diagRegex.exec(output)) !== null) {
      diags.push({
        line: parseInt(match[2], 10),
        col: parseInt(match[3], 10),
        severity: match[4] as "error" | "warning" | "info",
        message: match[5].trim()
      });
    }

    return diags;
  }
}
