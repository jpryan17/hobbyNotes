# Middle Way Mathematics

*A Machine-Certified, Constructive Journey from Logic to Quantum Reality*

Live Portal: **[https://middlewaymath.app](https://middlewaymath.app)**  
Open-Source Repository: **[https://github.com/jpryan17/hobbyNotes](https://github.com/jpryan17/hobbyNotes)**

> [!WARNING]
> **Active Development Notice: Pre-Stable Project**  
> *Middle Way Mathematics* and its in-situ authoring studio are undergoing active, continuous evolution. Core authoring tools (TTD, FSD, stencils, pseudocode algorithms), curricular segments, and database schemas are being refined daily. Expect ongoing interface changes, experimental workflows, and non-finalized authoring tools until the v2.0 milestone stabilizes.

---

## 🌟 Overview & Mission

Middle Way Mathematics is an interactive textbook designed to be a robust proof of concept for a formal science curriculum that serves the 75% or so of students not bound for STEM related careers in a manner consistent with the needs of students preparing for further STEM related study. Our motivation is that current theories of physical reality rest among the pinnacles of human culture, and should be made as available as possible for all to share. In order to simplify the description of the mathematics required, the curriculum leverages the Conway number tree to ground a nonstandard description of mathematics that assumes that the infinitesimal 1/omega (where omega is the supremum of the natural numbers) is a number.

A machine based agent is responsible for much of the development of this page. As such, the chance that this page reflects a shared hallucination cannot be ignored; so an effort was made to minimize this possibility. First, the page includes formal statements. These statements are quantified predicate expressions, i.e. statements are encoded in FOL. All statements are verified by the Lean theorem prover. Thus the mathematical description is at least consistent. Second, any calculation is defined for a formal statement. A calculation is described by pseudo-code which is interpreted by a 'calculation machine' independent of any access to runtime resources for mathematical calculation.

This dual approach of verifying the conceptual description, and demonstrating its support for calculation, support the claim that this page is indeed a robust prototype providing PoC for its proposed curriculum.

---

## 🛠️ Sovereign Authoring Studio & Educational Hub Framework

Beyond a static curriculum, the repository features an integrated **in-situ authoring studio and educational hub framework** operating on the principle of **pedagogical sovereignty**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      IN-SITU STUDIO TOOLBAR                            │
 │  [👁️ View/Edit] [✏️ Content] [+ Stencil] [🔄 Reload] [🚀 Build Page]    │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
         ┌───────────────────────────┴───────────────────────────┐
         ▼                                                       ▼
 ┌───────────────────────────────┐               ┌───────────────────────────────┐
 │          INSTRUCTOR           │               │          HUB KEEPER           │
 │     (Pedagogical Freedom)     │               │      (Canonical Baseline)     │
 ├───────────────────────────────┤               ├───────────────────────────────┤
 │ • Rewrites narrative chapters │               │ • Curates the shared baseline │
 │ • Re-orders outline hierarchy │               │   (`seed.sql`)                │
 │ • Compiles self-contained     │               │ • Governs global Lean proofs  │
 │   course pages in < 300ms     │               │   and calculation modes       │
 │ • Zero committee approval     │               │ • Database Console (/console) │
 └───────────────────────────────┘               └───────────────────────────────┘
```

1. **SeaMonkey-Style WYSIWYG & HTML Source Editor (`[✏️ Content]`)**:
   - **Multi-View Modes**: Seamless switching between `[Normal (WYSIWYG)]` (HTML5 `contenteditable` styled with framework typography), `[HTML Source]` (precision code editor), and `[Split View]`.
   - **Structural MWM Element Palette**: One-click insertion of Note (`.box-blue`), Theorem (`.box-emerald`), Caution (`.box-amber`), and Card containers.
   - **Atomic Stencil Tag Guards**: Interactive `<fsd-ref>` tags are protected with `contenteditable="false"`, allowing educators to format prose without corrupting stencil attributes.
   - **Live MathJax Rendering**: On-demand formula typesetting directly in the visual editor.

2. **In-Memory Dev Sandbox & Rapid Snapshot Engine (`[🚀 Build Page]`)**:
   - Outline and narrative edits operate safely in client memory without mutating the database.
   - A single click compiles the author's live browser state into an isolated, zero-dependency standalone HTML file in **under 300 milliseconds** (`app1/builds/<custom_name>.html`).

3. **PostgreSQL Bridge & Safety Valve**:
   - **`[💾 Update DB]`**: Explicit transactional synchronization of client outlines and segment overrides to PostgreSQL.
   - **Interactive SQL & Transaction Console (`/console`)**: Stateful transaction management (`BEGIN`, `COMMIT`, `ROLLBACK`) and template library.
   - **`[🔄 Reset DB from Source]`**: Instant (< 300ms) restoration of the PostgreSQL database from the canonical Git baseline (`db/seed.sql`).

---

## 🛡️ Dual-Verification Architecture: Mathematical Consistency & Autonomous Calculation

MWM unites formal axiomatic rigor, algorithmic computation, and phenomenological grounding into a unified, robust framework:

1. **Conceptual Consistency (Lean 4 Theorem Prover)**:
   - Machine-checked formal theorems in `MiddleWayLean/Scaffold.lean` certifying transfinite calculus (`ℝ_ω, ℂ_ω`), infinitesimal differentials (`dx = 1/ω`), discrete Fundamental Theorem of Calculus (FTC), Cauchy loop cancellation, and continuous unitary evolution.
   - Dual-mode verification: build-time pre-computed kernel cache (`genLeanCache`, 171 certified theorem keys) for instantaneous `Q.E.D. ✓` certification on static web pages at zero cloud cost, plus an optional live local verification server (`npm run leanServer`).

2. **Autonomous Calculation Machine (The Discrete Machine & Pseudocode)**:
   - Self-contained, zero-dependency pseudocode algorithms interpreted directly in client memory (`clientLib/pseudoInterpreter.ts`, `clientLib/dyadicMachine.ts`) independent of external symbolic CAS or cloud math engines.
   - Concrete numerical test cases (`verified_presets`) continuously validating every calculation mode and function rule.

3. **Phenomenological Grounding & Algebraic Inversion**:
   - **Physical Bridge Simulations**: Client-side interactive simulations for Newtonian Kinematics, Work-Energy Conservation, Discrete Heat Diffusion, and Cauchy Complex Circulation.
   - **Generic FS Calculator**: Directional calculation stencils enabling students to explore inverse problems and parameter sensitivities intuitively.

---

## 🗺️ Curriculum Architecture (52 Modular Segments)

The curriculum unfolds across two sequential tracks:

### Track 1: General Science Foundation
*A complete foundational sequence for 100% of students (unburdened by continuous calculus):*
1. **Propositional Logic & TTD**: Truth tables, Boolean connectives, and the interactive Truth Table Demo.
2. **Formal Statements & FSD**: Predicate logic, set tuples, and the Formal Statements Demo on a discrete grid.
3. **Numbers & Graph Trees**: Constructing 1D `ℝ_ω` (2-successor) and 2D `ℂ_ω` (4-successor) continua with step size `dx = 1/ω`.
4. **Bayesian Inference & BTD**: Inverse probability, belief updating, and the Bayesian Tree Demo.
5. **Quantum Logic & Inference**: Phase rotations, complex probability amplitudes, and quantum state projections.

### Track 2: Liberal Arts Mathematics, STEM Bridges & Seminars
*Deepening structural mechanics and physical bridges:*
* **Course 1: Linear Algebra & Vector Spaces**: Emergent group structures, linear transformations, and inner product spaces.
* **Course 2: Analysis 1D**: The infinitesimal microscope, algebraic derivatives, local linearity, and telescoping integration.
* **Course 3: Analysis 2D**: The complex grid `ℂ_ω`, conformal geometry, discrete contour integrals, and continuous quantum evolution.
* **STEM Physical Bridges**:
  - *Newtonian Bridge*: Discrete curvature invariance (`free_fall_accel`) and the telescoping Work-Energy theorem.
  - *Thermal Bridge*: Discrete Laplacian heat diffusion across tridiagonal Toeplitz contact stencils.
* **Applied Seminars & Masterclasses**:
  - *Fourier Duality* (`x ↔ p`, `t ↔ E`), *Halo Soup*, *Holographic Principle & Information Boundaries*, *Higher Successors*, *Cosmology as Information*, *Particle Zoo*, and *Quantum Entanglement*.
* **Educational Proposals**:
  - *Proposal 1*: The Public Utility Model for Formal Science & Patronage of Open Educational Resource Hubs (`lean4GenEdProposal`).
  - *Proposal 2*: Multi-Service Grounded Dual-Layer AI Tutor Architecture (`dualAgentAcademicProposal`).
  - *Proposal 3*: Minimal Axiomatic Core (`minimalAxiomaticCoreProposal`).

---

## 📁 Repository Layout

```
hobbyNotes/
├── MiddleWayLean/      # Lean 4 constitutional theorem specifications & proofs
├── clientLib/          # Shared runtime TypeScript, in-situ Studio Overlay & FS Calculator
├── app1/               # Main curriculum application (source, 52 segments, and static build)
├── console/            # Interactive Database & Transaction Console (port 3000)
├── db/                 # Canonical database schema & seed snapshot (seed_v2.sql)
├── server/             # Express DB Bridge, static publisher & transactional sync server
├── nodeUtils/          # Build scripts, Lean/Maxima cache generators, and segment bundlers
├── leanServer/         # Local Lean 4 verification microservice (port 8001)
└── archive/            # Historical tests, scratch files, diagrams & MaximaMiner CAS tools
```

---

## 💻 Local Development & Verification

```bash
# Install dependencies
npm install

# Launch local development server with hot reload (live-server on port 8080)
npm run dev

# (Optional) Launch Express DB Bridge & Console (port 3000)
npm run server

# Compile TypeScript and bundle all 52 segments + static index
npm run build

# (Optional) Launch local live Lean 4 kernel verification microservice
npm run leanServer

# Deploy static bundle to production
npm run deploy
```

---

## 📄 Attribution & Governance

Created by **J.P. Ryan**, in collaboration with an embedded machine-based intelligent assistant. Governed by **The Middle Way Mathematics Foundation** for open educational exploration at **[middlewaymath.app](https://middlewaymath.app)**.
