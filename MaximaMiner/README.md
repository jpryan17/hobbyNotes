# MaximaMiner

**Autonomous Exploration, Tracing, and Algorithmic Identification for Computer Algebra Systems**

---

## 1. Overview & Philosophy

Computer Algebra Systems (CAS) like **Maxima** represent over half a century of accumulated mathematical knowledge, heuristic shortcuts, and deep algebraic decision procedures. However, classical CAS operate as **opaque black boxes**:
* When a user calls `integrate(f(x), x)`, Maxima returns a result with **zero execution narrative**.
* The user cannot tell whether it executed Moses' derivative-divides heuristic (`diffdiv`), Hermite rational decomposition (`ratint`), trigonometric substitution (`trigint`), the algebraic Risch algorithm (`rischint`), or fell back to a transcendental special function (`gamma_incomplete`).
* Silent assumptions, parameter degeneracies ($a = 0$, $b \neq 0$), and complex branch cuts are hidden inside dynamic Lisp variables.

**MaximaMiner** is an autonomous tracing and algorithm-mining framework that hooks directly into Maxima’s underlying Common Lisp runtime. It parses internal call graphs, surfaces attempted vs. winning heuristics, and tags outputs with a standardized **Algorithm Identification Code (AIC)**.

---

## 2. Architecture

```
MaximaMiner/
├── config.py             # Maxima executable detection (C:\maxima-5.46.0\bin\maxima.bat)
├── core/
│   ├── runner.py         # Subprocess harness invoking Maxima with Lisp symbol tracing & 1D display
│   ├── parser.py         # Parser converting raw textual Lisp traces into hierarchical TraceNodes
│   ├── classifier.py     # Rule-based classifier assigning Algorithm Identification Codes (AIC)
│   └── tracer.py         # High-level Python API (MaximaMinerEngine)
├── catalog/
│   └── rules.py          # Knowledge base of Maxima Lisp internals (sin.lisp, risch.lisp, ratint.lisp)
└── examples/
    └── demo.py           # Benchmark demonstration suite
```

---

## 3. Discovered Case Studies & Algorithmic Fingerprints

Running `python MaximaMiner/examples/demo.py` probes Maxima with four canonical benchmark integrals and untangles their exact internal execution paths:

### Case 1: Direct Heuristic Substitution (`∫ x · e^(x²) dx`)
* **Identified Algorithm**: `[ALG-HEUR-DIFFDIV]` — Derivative-Divides Heuristic
* **What the Trace Revealed**: Maxima never entered the Risch algorithm or complex machinery. Moses' 1967 `diffdiv` heuristic immediately identified $u = x^2$, computed $u' = 2x$, and solved the problem in a single pass.
```
• [sinint] args: [x*%e^x^2, x] -> %e^x^2/2
  • [integrator] args: [x*%e^x^2, x] -> %e^x^2/2
    • [diffdiv] args: [x*%e^x^2, x] -> %e^x^2/2
```

### Case 2: Rational Function Decomposition (`∫ 1 / (x³ + 1) dx`)
* **Identified Algorithm**: `[ALG-RATINT]` — Rational Function Integration (Hermite / Partial Fractions)
* **Attempted & Failed**: `diffdiv` returned `false`.
* **What the Trace Revealed**: Once derivative-divides failed, Maxima recognized the rational polynomial quotient and routed the problem to `ratint.lisp`, performing square-free factorization and partial fractions over $\mathbb{Q}[x]$.
```
• [sinint] args: [1/(x^3+1), x]
  • [integrator] args: [1/(x^3+1), x]
    • [diffdiv] args: [1/(x^3+1), x] -> false
    • [ratint] args: [1/(x^3+1), x] -> (-log(x^2-x+1)/6) + atan((2*x-1)/sqrt(3))/sqrt(3) + log(x+1)/3
```

### Case 3: Trigonometric Substitution (`∫ sin(x)³ dx`)
* **Identified Algorithm**: `[ALG-TRIGINT]` — Trigonometric Substitution
* **Attempted & Failed**: `diffdiv` on original integrand returned `false`.
* **What the Trace Revealed**: Maxima invoked `trigint`, introduced a dummy substitution variable `g492 = cos(x)`, converted $\sin(x)^3 dx$ into the polynomial $-(1 - u^2) du = (u^2 - 1) du$, recursively re-entered `integrator`, solved the polynomial terms via `diffdiv`, and back-substituted.
```
• [sinint] args: [sin(x)^3, x]
  • [integrator] args: [sin(x)^3, x]
    • [diffdiv] args: [sin(x)^3, x] -> false
    • [trigint] args: [sin(x)^3, x] -> cos(x)^3/3 - cos(x)
      • [integrator] args: [g492^2-1, g492]
        • [integrator] args: [-1, g492] -> -g492
        • [integrator] args: [g492^2, g492] -> g492^3/3
          • [diffdiv] args: [g492^2, g492] -> g492^3/3
```

### Case 4: Non-Elementary Transcendental (`∫ e^x / x dx`)
* **Identified Algorithm**: `[ALG-SPECIAL-GAMMA]` — Incomplete Gamma Special Function
* **Attempted & Failed**:
  1. `diffdiv` returned `false`.
  2. `rischint` (Risch Algorithm) was called and proved that **no elementary antiderivative exists** (returned unevaluated `'integrate(%e^x/x, x)`).
* **What the Trace Revealed**: `integrator` caught the non-elementary proof from Risch and fell back to the transcendental special-function engine, returning $-\Gamma(0, -x)$.
```
• [sinint] args: [%e^x/x, x] -> -gamma_incomplete(0, -x)
  • [integrator] args: [%e^x/x, x] -> -gamma_incomplete(0, -x)
    • [diffdiv] args: [%e^x/x, x] -> false
    • [rischint] args: [%e^x/x, x] -> 'integrate(%e^x/x, x)
```

---

## 4. How to Run

```bash
# From repository root
python MaximaMiner/examples/demo.py
```

---

## 5. Next Milestones for MaximaMiner

1. **Parameter Boundary & `asksign` Interception**:
   Instrumenting `asksign` to systematically capture queries like `Is a positive, negative, or zero?` and map bifurcating parameter trees.
2. **Definite Integration & Contour Tracing**:
   Expanding trace profiles to `defint.lisp` (`dintexp`, `dintlog`) to detect residue calculus and branch cut crossings.
3. **Lean 4 Proof Template Generation**:
   Using the mined Algorithm Identification Code to generate scaffolding for verified Lean 4 theorem definitions.
