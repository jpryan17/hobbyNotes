# Agent Instructions & Guidelines

## Formatting & Notation
- **Simple Unicode**: Always use simple, clean Unicode symbols (e.g., `+`, `-`, `*`, `→`, `⇒`, `|`, `∈`, `ℝ`, `ℕ`, `𝔹`, `[ - + ]`, `{ ... }`) rather than dense LaTeX syntax (avoid `$...$`, `\mid`, `\mathbb`, etc.).
- **Human-Friendly Readability**: Keep walkthroughs, reports, and code explanations clear, visual, and easy to scan at a glance.

## Narrative Style & Cross-References
- **No Embedded Nav Links / File Names**: Avoid embedded navigation links (e.g., `<a href="..." onclick="window.parent.postMessage(...)">`) and raw segment filenames (e.g., `numbersIntro.html`).
- **Conversational References**: Refer casually and conversationally to the phase, course, or lecture topic (e.g., "As explored in our foundational discussion of Numbers & Trees...", or "In the 2D Analysis lectures...").

## Workflow & Deployment
- **Stop at Build**: After completing code changes, compile and verify with `npm run build` and STOP. Do NOT automatically run `deploy` or push to git. Let the user decide whether they want quick local validation (`npm run dev`) or quick page refresh (`npm run deploy`).

## CRUD Studio Mental Model & Task Execution
- **Authoritative Affordance Model**: Maintain and consult `crud/crud_affordance_model.json` as the mental image and semantic affordance map of Middle Way Mathematics CRUD Studio.
- **Agent Task Execution**: When the user requests a CRUD task (e.g., adding an entity, linking a truth table, editing segment markup, or updating foreign keys), follow the state machine, selectors, behaviors, and recipes defined in `crud/crud_affordance_model.json`.
- **Bidirectional Synchronization**: When new controls, event handlers, or database behaviors are added to CRUD Studio, keep `crud/crud_affordance_model.json` updated so the mental model remains synchronized.

