# Agent Instructions & Guidelines

## Formatting & Notation
- **Simple Unicode**: Always use simple, clean Unicode symbols (e.g., `+`, `-`, `*`, `→`, `⇒`, `|`, `∈`, `ℝ`, `ℕ`, `𝔹`, `[ - + ]`, `{ ... }`) rather than dense LaTeX syntax (avoid `$...$`, `\mid`, `\mathbb`, etc.).
- **Human-Friendly Readability**: Keep walkthroughs, reports, and code explanations clear, visual, and easy to scan at a glance.

## Workflow & Deployment
- **Stop at Build**: After completing code changes, compile and verify with `npm run build` and STOP. Do NOT automatically run `deploy` or push to git. Let the user decide whether they want quick local validation (`npm run dev`) or quick page refresh (`npm run deploy`).
