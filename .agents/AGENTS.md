# Agent Instructions & Guidelines

## Formatting & Notation
- **Simple Unicode**: Always use simple, clean Unicode symbols (e.g., `+`, `-`, `*`, `→`, `⇒`, `|`, `∈`, `ℝ`, `ℕ`, `𝔹`, `[ - + ]`, `{ ... }`) rather than dense LaTeX syntax (avoid `$...$`, `\mid`, `\mathbb`, etc.).
- **Human-Friendly Readability**: Keep walkthroughs, reports, and code explanations clear, visual, and easy to scan at a glance.

## Narrative Style & Cross-References
- **No Embedded Nav Links / File Names**: Avoid embedded navigation links (e.g., `<a href="..." onclick="window.parent.postMessage(...)">`) and raw segment filenames (e.g., `numbersIntro.html`).
- **Conversational References**: Refer casually and conversationally to the phase, course, or lecture topic (e.g., "As explored in our foundational discussion of Numbers & Trees...", or "In the 2D Analysis lectures...").

## Workflow & Deployment
- **Stop at Build**: After completing code changes, compile and verify with `npm run build` and STOP. Do NOT automatically run `deploy` or push to git. Let the user decide whether they want quick local validation (`npm run dev`) or quick page refresh (`npm run deploy`).
