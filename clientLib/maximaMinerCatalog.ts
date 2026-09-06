/**
 * MaximaMiner Catalog & Trace Parser
 * Bridges Maxima's Common Lisp execution traces, Algorithm Identification Codes (AIC),
 * and Middle Way Mathematics operational semantics.
 */

export interface MaximaMinerTrace {
  aic: string;
  algorithmName: string;
  description: string;
  attemptedHeuristics?: string[];
  callTreeText: string;
  rawOutput?: string;
  details?: string[];
}

export interface TraceTreeNode {
  func: string;
  depth: number;
  args: string;
  result?: string;
  children: TraceTreeNode[];
}

const TRACE_LINE_RE = /^(\s*)(\d+)\s+(Enter|Exit)\s+([a-zA-Z0-9_%-]+)\s+(.*)$/;

/**
 * Parses raw Maxima stdout containing Common Lisp trace lines into a structured tree and text.
 */
export function parseMaximaTrace(rawOutput: string): {
  callTree: TraceTreeNode[];
  callTreeText: string;
  finalResult: string;
  aic: string;
  algorithmName: string;
  description: string;
  attemptedHeuristics: string[];
} {
  const lines = rawOutput.split(/\r?\n/);
  const rootNodes: TraceTreeNode[] = [];
  const stack: TraceTreeNode[] = [];
  let finalResult = '';
  const attemptedHeuristics: string[] = [];
  let winningAic = 'ALG-MWM-GENERIC';
  let winningName = 'Symbolic Transformation Engine';
  let winningDesc = 'Evaluated via Maxima CAS core simplification and algebraic rewrite rules.';

  for (const line of lines) {
    const trimmed = line.trim();
    const match = line.match(TRACE_LINE_RE);
    if (match) {
      const [, spaces, , action, func, rest] = match;
      const depth = spaces.length;

      if (action === 'Enter') {
        const node: TraceTreeNode = {
          func,
          depth,
          args: rest.trim(),
          children: []
        };
        if (stack.length > 0) {
          stack[stack.length - 1].children.push(node);
        } else {
          rootNodes.push(node);
        }
        stack.push(node);
      } else if (action === 'Exit') {
        if (stack.length > 0) {
          let idx = stack.length - 1;
          while (idx >= 0 && stack[idx].func !== func) {
            idx--;
          }
          if (idx >= 0) {
            stack[idx].result = rest.trim();
            // Track heuristic attempts
            const resVal = rest.trim();
            if (func === 'diffdiv') {
              if (resVal === 'false') {
                attemptedHeuristics.push('diffdiv (Derivative-Divides: Failed)');
              } else {
                winningAic = 'ALG-HEUR-DIFFDIV';
                winningName = 'Derivative-Divides Heuristic';
                winningDesc = "Solved by detecting f(u(x)) * u'(x) pattern substitution directly.";
              }
            } else if (func === 'ratint' && resVal && resVal !== 'false') {
              winningAic = 'ALG-RATINT';
              winningName = 'Rational Function Integration (Hermite / Partial Fractions)';
              winningDesc = 'Solved via exact algebraic decomposition over polynomial ring ℚ[x].';
            } else if (func === 'trigint' && resVal && resVal !== 'false') {
              winningAic = 'ALG-TRIGINT';
              winningName = 'Trigonometric Substitution';
              winningDesc = 'Transformed trig powers into polynomial u-substitution and re-entered integrator.';
            } else if (func === 'rischint') {
              if (resVal.includes('integrate')) {
                attemptedHeuristics.push('rischint (Risch Algorithm: Non-Elementary Proved)');
              } else {
                winningAic = 'ALG-RISCH';
                winningName = 'Risch Decision Procedure';
                winningDesc = 'Solved using algebraic differential field tower integration.';
              }
            }
            stack.splice(idx);
          }
        }
      }
    } else if (
      trimmed &&
      !trimmed.startsWith('display2d') &&
      !trimmed.startsWith('false') &&
      !trimmed.startsWith('trace') &&
      !trimmed.startsWith('[') &&
      !trimmed.startsWith('integrate') &&
      !trimmed.startsWith('diff') &&
      !trimmed.startsWith('ratsimp')
    ) {
      finalResult = trimmed;
    }
  }

  if (finalResult.includes('gamma_incomplete')) {
    winningAic = 'ALG-SPECIAL-GAMMA';
    winningName = 'Incomplete Gamma Special Function';
    winningDesc = 'Non-elementary integral represented in terms of incomplete gamma special function.';
  }

  // Generate hierarchical callTreeText
  function printNode(node: TraceTreeNode, indent = 0): string {
    const pad = '  '.repeat(indent);
    const resStr = node.result !== undefined ? ` -> ${node.result}` : '';
    const cur = `${pad}• [${node.func}] args: ${node.args}${resStr}`;
    if (node.children.length === 0) return cur;
    return [cur, ...node.children.map(c => printNode(c, indent + 1))].join('\n');
  }

  const callTreeText = rootNodes.length > 0 
    ? rootNodes.map(r => printNode(r)).join('\n')
    : `• [maxima_eval] result: ${finalResult || 'Evaluated'}`;

  return {
    callTree: rootNodes,
    callTreeText,
    finalResult,
    aic: winningAic,
    algorithmName: winningName,
    description: winningDesc,
    attemptedHeuristics
  };
}

/**
 * Pre-mined canonical trace records for instant offline exploration & Middle Way Math presets.
 */
export const PREMINED_MAXIMA_TRACES: Record<string, MaximaMinerTrace> = {
  // Case 1: Derivative-Divides Heuristic
  'x*exp(x^2)': {
    aic: 'ALG-HEUR-DIFFDIV',
    algorithmName: 'Derivative-Divides Heuristic',
    description: "Moses' 1967 derivative-divides heuristic identified u = x^2, u' = 2x, solving in a single substitution pass without entering Risch machinery.",
    attemptedHeuristics: [],
    callTreeText: '• [sinint] args: [x*%e^x^2, x] -> %e^x^2/2\n  • [integrator] args: [x*%e^x^2, x] -> %e^x^2/2\n    • [diffdiv] args: [x*%e^x^2, x] -> %e^x^2/2',
    rawOutput: `1 Enter sinint [x*%e^x^2, x]
 1 Enter integrator [x*%e^x^2, x]
  1 Enter diffdiv [x*%e^x^2, x]
  1 Exit  diffdiv %e^x^2/2
 1 Exit  integrator %e^x^2/2
1 Exit  sinint %e^x^2/2
%e^x^2/2`
  },

  // Case 2: Hermite Rational Decomposition
  '1/(x^3+1)': {
    aic: 'ALG-RATINT',
    algorithmName: 'Rational Function Integration (Hermite / Partial Fractions)',
    description: "Once diffdiv heuristic failed, Maxima recognized the rational polynomial quotient and routed the problem to ratint.lisp over ℚ[x].",
    attemptedHeuristics: ['diffdiv (Derivative-Divides: Failed)'],
    callTreeText: '• [sinint] args: [1/(x^3+1), x] -> (-log(x^2-x+1)/6) + atan((2*x-1)/sqrt(3))/sqrt(3) + log(x+1)/3\n  • [integrator] args: [1/(x^3+1), x] -> (-log(x^2-x+1)/6) + atan((2*x-1)/sqrt(3))/sqrt(3) + log(x+1)/3\n    • [diffdiv] args: [1/(x^3+1), x] -> false\n    • [ratint] args: [1/(x^3+1), x] -> (-log(x^2-x+1)/6) + atan((2*x-1)/sqrt(3))/sqrt(3) + log(x+1)/3',
    rawOutput: `1 Enter sinint [1/(x^3+1), x]
 1 Enter integrator [1/(x^3+1), x]
  1 Enter diffdiv [1/(x^3+1), x]
  1 Exit  diffdiv false
  1 Enter ratint [1/(x^3+1), x]
  1 Exit  ratint (-log(x^2-x+1)/6)+atan((2*x-1)/sqrt(3))/sqrt(3)+log(x+1)/3
 1 Exit  integrator (-log(x^2-x+1)/6)+atan((2*x-1)/sqrt(3))/sqrt(3)+log(x+1)/3
1 Exit  sinint (-log(x^2-x+1)/6)+atan((2*x-1)/sqrt(3))/sqrt(3)+log(x+1)/3
(-log(x^2-x+1)/6)+atan((2*x-1)/sqrt(3))/sqrt(3)+log(x+1)/3`
  },

  // Case 3: Trigonometric Substitution
  'sin(x)^3': {
    aic: 'ALG-TRIGINT',
    algorithmName: 'Trigonometric Substitution',
    description: "Trigint converted sin(x)³ dx into polynomial (u² - 1) du with dummy variable cos(x), recursively resolved terms with diffdiv, and back-substituted.",
    attemptedHeuristics: ['diffdiv on original sin(x)³ (Failed)'],
    callTreeText: '• [sinint] args: [sin(x)^3, x] -> cos(x)^3/3 - cos(x)\n  • [integrator] args: [sin(x)^3, x] -> cos(x)^3/3 - cos(x)\n    • [diffdiv] args: [sin(x)^3, x] -> false\n    • [trigint] args: [sin(x)^3, x] -> cos(x)^3/3 - cos(x)\n      • [integrator] args: [g492^2-1, g492]\n        • [integrator] args: [-1, g492] -> -g492\n        • [integrator] args: [g492^2, g492] -> g492^3/3\n          • [diffdiv] args: [g492^2, g492] -> g492^3/3',
    rawOutput: `1 Enter sinint [sin(x)^3, x]
 1 Enter integrator [sin(x)^3, x]
  1 Enter diffdiv [sin(x)^3, x]
  1 Exit  diffdiv false
  1 Enter trigint [sin(x)^3, x]
   1 Enter integrator [g492^2-1, g492]
    2 Enter integrator [-1, g492]
    2 Exit  integrator -g492
    2 Enter integrator [g492^2, g492]
     3 Enter diffdiv [g492^2, g492]
     3 Exit  diffdiv g492^3/3
    2 Exit  integrator g492^3/3
   1 Exit  integrator cos(x)^3/3 - cos(x)
  1 Exit  trigint cos(x)^3/3 - cos(x)
 1 Exit  integrator cos(x)^3/3 - cos(x)
1 Exit  sinint cos(x)^3/3 - cos(x)
cos(x)^3/3 - cos(x)`
  },

  // Case 4: Incomplete Gamma
  'exp(x)/x': {
    aic: 'ALG-SPECIAL-GAMMA',
    algorithmName: 'Incomplete Gamma Special Function (Non-Elementary)',
    description: "Risch algorithm proved no elementary antiderivative exists in any differential field tower; integrator fell back to transcendental special function -Γ(0, -x).",
    attemptedHeuristics: [
      'diffdiv (Derivative-Divides: Failed)',
      'rischint (Risch Algorithm: Non-Elementary Antiderivative Proved)'
    ],
    callTreeText: '• [sinint] args: [%e^x/x, x] -> -gamma_incomplete(0, -x)\n  • [integrator] args: [%e^x/x, x] -> -gamma_incomplete(0, -x)\n    • [diffdiv] args: [%e^x/x, x] -> false\n    • [rischint] args: [%e^x/x, x] -> integrate(%e^x/x, x)',
    rawOutput: `1 Enter sinint [%e^x/x, x]
 1 Enter integrator [%e^x/x, x]
  1 Enter diffdiv [%e^x/x, x]
  1 Exit  diffdiv false
  1 Enter rischint [%e^x/x, x]
  1 Exit  rischint integrate(%e^x/x, x)
 1 Exit  integrator -gamma_incomplete(0, -x)
1 Exit  sinint -gamma_incomplete(0, -x)
-gamma_incomplete(0, -x)`
  },

  // MWM Stencil: Discrete Difference
  'r_diff': {
    aic: 'ALG-MWM-DIFF-STENCIL',
    algorithmName: 'Hyperfinite Discrete Difference Stencil on ℝ_ω',
    description: 'Constructs forward difference quotient ((x+w)³ - x³)/w on the hyperfinite grid, factors out infinitesimal step w, and maps to standard part st(·).',
    attemptedHeuristics: ['standard derivative diff(x^3, x) superseded by discrete difference quotient'],
    callTreeText: '• [diff_w] args: [x^3, x, w]\n  • [expand] args: [(x+w)^3 - x^3] -> 3*w*x^2 + 3*w^2*x + w^3\n  • [ratsimp] args: [(3*w*x^2 + 3*w^2*x + w^3) / w] -> 3*x^2 + 3*w*x + w^2\n  • [st] args: [3*x^2 + 3*w*x + w^2, w=0] -> 3*x^2',
    rawOutput: `1 Enter diff_w [x^3, x, w]
 1 Enter expand [(x+w)^3 - x^3]
 1 Exit  expand 3*w*x^2 + 3*w^2*x + w^3
 1 Enter ratsimp [(3*w*x^2 + 3*w^2*x + w^3)/w]
 1 Exit  ratsimp 3*x^2 + 3*w*x + w^2
 1 Enter standard_part [3*x^2 + 3*w*x + w^2]
 1 Exit  standard_part 3*x^2
1 Exit  diff_w 3*x^2`
  },

  // MWM Stencil: 1D Discrete Laplacian
  'r_laplace': {
    aic: 'ALG-MWM-LAPLACIAN-2ND-DIFF',
    algorithmName: 'Discrete Curvature & Laplacian Stencil Δ² on ℝ_ω',
    description: 'Applies three-point second discrete difference stencil [1, -2, 1]/Δx² to quadratic polynomial x², canceling quadratic terms exactly to yield constant 2.',
    attemptedHeuristics: [],
    callTreeText: '• [laplace_1d] args: [x^2, x, dx]\n  • [eval_stencil] args: [( (x+dx)^2 - 2*x^2 + (x-dx)^2 ) / dx^2]\n  • [expand] args: [(x^2 + 2*x*dx + dx^2) - 2*x^2 + (x^2 - 2*x*dx + dx^2)] -> 2*dx^2\n  • [ratsimp] args: [2*dx^2 / dx^2] -> 2',
    rawOutput: `1 Enter laplace_1d [x^2, x, dx]
 1 Enter expand [x^2+2*dx*x+dx^2 - 2*x^2 + x^2-2*dx*x+dx^2]
 1 Exit  expand 2*dx^2
 1 Enter ratsimp [2*dx^2 / dx^2]
 1 Exit  ratsimp 2
1 Exit  laplace_1d 2`
  },

  // MWM Stencil: Flux Conservation Ledger
  'heat_slice_flux': {
    aic: 'ALG-MWM-CONSERVATION-LEDGER',
    algorithmName: 'Local Energy Flux Conservation Balance (James Lab)',
    description: 'Audits inward flux q_in from slice (i-1) against outward flux q_out to slice (i+1), establishing exact spatial energy preservation.',
    attemptedHeuristics: [],
    callTreeText: '• [flux_ledger] args: [u[i-1], u[i], u[i+1], alpha, dx]\n  • [flux_in] args: [alpha*(u[i-1] - u[i])/dx]\n  • [flux_out] args: [alpha*(u[i] - u[i+1])/dx]\n  • [ratsimp] args: [(flux_in - flux_out)/dx] -> (alpha/dx^2)*(u[i-1] - 2*u[i] + u[i+1])',
    rawOutput: `1 Enter flux_ledger [u[i-1], u[i], u[i+1]]
 1 Enter diffdiv [...] -> false
 1 Enter ratsimp [((u[i-1]-u[i]) - (u[i]-u[i+1]))]
 1 Exit  ratsimp u[i-1] - 2*u[i] + u[i+1]
1 Exit  flux_ledger (alpha/dx^2)*(u[i-1] - 2*u[i] + u[i+1])`
  },

  // MWM Stencil: Toeplitz Matrix Laplacian
  'toeplitz_5x5': {
    aic: 'ALG-MWM-TOEPLITZ-SPECTRUM',
    algorithmName: 'Toeplitz Matrix Eigenvalue Spectrum & Fourier Stability',
    description: 'Generates 5x5 tridiagonal Toeplitz diffusion operator and computes its discrete sine eigenvalue spectrum λ_k = -4*(α/Δx²)*sin²(kπ/10).',
    attemptedHeuristics: [],
    callTreeText: '• [toeplitz_laplacian] args: [dim=5, stencil=[1, -2, 1]]\n  • [charpoly] args: [det(A - lambda*I)]\n  • [eigenvalues] args: [A] -> 5 distinct roots on ℝ_ω\n  • [trigsimp] args: [lambda_k] -> -4*(alpha/dx^2)*sin(k*pi/10)^2  (all lambda_k < 0)',
    rawOutput: `1 Enter toeplitz_laplacian [5, [1, -2, 1]]
 1 Enter eigenvalues [matrix([-2,1...],[1,-2,1...])]
 1 Exit  eigenvalues 5 distinct negative roots
1 Exit  toeplitz_laplacian lambda_k = -4*(alpha/dx^2)*sin^2(k*pi/10)`
  },

  // MWM Stencil: Telescoping Sum
  'telescoping_conservation': {
    aic: 'ALG-MWM-TELESCOPING-SUM',
    algorithmName: 'Pairwise Telescoping Difference Cancellation',
    description: 'Sums adjacent difference terms ∑_{k=0}^N (F(k+1) - F(k)), canceling all interior nodes to guarantee boundary conservation F(N+1) - F(0).',
    attemptedHeuristics: ['ratint (false)'],
    callTreeText: '• [telescoping_sum] args: [F[k+1] - F[k], k, 0, N]\n  • [pairwise_cancel] args: [N steps]\n  • [boundary_eval] args: [F[N+1] - F[0]]',
    rawOutput: `1 Enter telescoping_sum [F[k+1] - F[k], 0, N]
 1 Enter pairwise_cancel [...]
 1 Exit  pairwise_cancel F[N+1] - F[0]
1 Exit  telescoping_sum F[N+1] - F[0]`
  },

  // MWM Complex: Complex Multiplication
  'c_mul': {
    aic: 'ALG-MWM-COMPLEX-GRID-PRODUCT',
    algorithmName: 'Hyperfinite Complex Ring Multiplication on ℂ_ω',
    description: 'Carries out discrete product (a + bi)(c + di) = (ac - bd) + (ad + bc)i over the infinitesimal Cartesian grid.',
    attemptedHeuristics: [],
    callTreeText: '• [c_mul] args: [2+3*%i, 4-%i]\n  • [rectform] args: [(2*4 - 3*(-1)) + (2*(-1) + 3*4)*%i] -> 11 + 10*%i',
    rawOutput: `1 Enter c_mul [2+3*%i, 4-%i]
 1 Enter rectform [...]
 1 Exit  rectform 11 + 10*%i
1 Exit  c_mul 11 + 10*%i`
  },

  // MWM Complex: Cauchy Cell Loop
  'c_loop': {
    aic: 'ALG-MWM-CAUCHY-CELL-CANCELLATION',
    algorithmName: 'Discrete Cauchy-Riemann Edge Circulation Cancellation',
    description: 'Integrates directed holomorphic field around cell boundary edges; shared interior edges cancel pairwise with opposite orientation, yielding 0.',
    attemptedHeuristics: [],
    callTreeText: '• [cauchy_loop] args: [f(z), cell[i,j]]\n  • [edge_sums] args: [bottom + right + top + left] -> 0 identically',
    rawOutput: `1 Enter cauchy_loop [f(z), cell[i,j]]
 1 Enter edge_circulation [...]
 1 Exit  edge_circulation 0
1 Exit  cauchy_loop 0`
  },

  // MWM Conway: Dyadic Tree
  'tree_node': {
    aic: 'ALG-MWM-CONWAY-DYADIC-EXPANSION',
    algorithmName: 'Conway Transfinite Dyadic Tree Traversal',
    description: 'Walks the 2^n binary successor tree following sign vector (+, -, -) to calculate exact dyadic rational 1/4.',
    attemptedHeuristics: [],
    callTreeText: '• [tree_traverse] args: ["+--"]\n  • [root] -> 0\n  • [branch_plus] -> 1\n  • [branch_minus] -> 1/2\n  • [branch_minus] -> 1/4',
    rawOutput: `1 Enter tree_traverse ["+--"]
 1 Exit  tree_traverse 1/4`
  },

  // MWM Conway: Dyadic Addition
  'tree_add': {
    aic: 'ALG-MWM-CONWAY-GAME-ADDITION',
    algorithmName: 'Conway Inductive Game & Number Addition',
    description: 'Computes inductive sum of tree positions 1 = { 0 | } and 1/2 = { 0 | 1 } via Conway game sum definitions.',
    attemptedHeuristics: [],
    callTreeText: '• [conway_add] args: [1, 1/2]\n  • [dyadic_sum] args: [1 + 1/2] -> 3/2',
    rawOutput: `1 Enter conway_add [1, 1/2]
 1 Exit  conway_add 3/2`
  },

  // Newtonian Kinematics: Free Fall Trajectory
  'newton_free_fall': {
    aic: 'ALG-MWM-SYMBOLIC',
    algorithmName: 'Middle Way Algebraic Reduction',
    description: 'Evaluated expression for Newtonian Kinematics: Free Fall Trajectory & Constant Acceleration.',
    attemptedHeuristics: ['Primary Maxima /evalMaxima endpoint offline or timed out'],
    callTreeText: '• [mwm_reduction] expression: s: v0*t - 1/2*g*t^2$ ratsimp((subst(t+dt, t, s) - s)/dt); ratsimp((subst(t-dt, t, s) - 2*s + subst(t+dt, t, s))/dt^2);\n  • result: v(t) = v0 - g*t,   a(t) = -g',
    rawOutput: `display2d: false;
s: v0*t - 1/2*g*t^2;
ratsimp((subst(t+dt, t, s) - s)/dt);
-> (2*v0 - 2*g*t - dt*g)/2
st( (2*v0 - 2*g*t - dt*g)/2 ) -> v0 - g*t
ratsimp((subst(t-dt, t, s) - 2*s + subst(t+dt, t, s))/dt^2);
-> -g`
  },

  // Newtonian Kinematics: Work-Kinetic Energy
  'newton_work_energy': {
    aic: 'ALG-HEUR-DIFFDIV',
    algorithmName: 'Work-Kinetic Energy Differential Invariance',
    description: "Moses' diffdiv heuristic integrates momentum flow m·v dv directly on ℝ_ω, yielding the kinetic energy function (1/2)·m·v².",
    attemptedHeuristics: ['standard discrete sum telescoped into exact kinetic energy difference'],
    callTreeText: '• [sinint] args: [m*v, v] -> (m*v^2)/2\n  • [integrator] args: [m*v, v] -> (m*v^2)/2\n    • [diffdiv] args: [v, v] -> v^2/2\n  • [telescoping_sum] args: [∑_{k=0}^{n-1} m*v_k*Δv_k] -> (1/2)*m*v_n^2 - (1/2)*m*v_0^2',
    rawOutput: `1 Enter sinint [m*v, v]
 1 Enter integrator [m*v, v]
  1 Enter diffdiv [v, v]
  1 Exit  diffdiv v^2/2
 1 Exit  integrator (m*v^2)/2
1 Exit  sinint (m*v^2)/2
(m*v^2)/2`
  },

  // Newtonian Kinematics: Harmonic Oscillator
  'newton_harmonic_oscillator': {
    aic: 'ALG-HEUR-DIFFDIV',
    algorithmName: 'Harmonic Restoring Force Potential Integration',
    description: 'Evaluates the conservative spring potential via diffdiv integration on restoring force -k·x dx, yielding -k·x²/2.',
    attemptedHeuristics: [],
    callTreeText: '• [sinint] args: [-k*x, x] -> -(k*x^2)/2\n  • [integrator] args: [-k*x, x] -> -(k*x^2)/2\n    • [diffdiv] args: [x, x] -> x^2/2\n  • [energy_conservation] args: [(1/2)*m*v^2 + (1/2)*k*x^2 = E_total]',
    rawOutput: `1 Enter sinint [-k*x, x]
 1 Enter integrator [-k*x, x]
  1 Enter diffdiv [x, x]
  1 Exit  diffdiv x^2/2
 1 Exit  integrator -(k*x^2)/2
1 Exit  sinint -(k*x^2)/2
-(k*x^2)/2`
  },

  // Hyperfinite Summation / Telescoping FTC
  'r_ftc': {
    aic: 'ALG-MWM-TELESCOPING-FTC',
    algorithmName: 'Hyperfinite Summation & Telescoping FTC on ℝ_ω',
    description: 'Computes closed-form hyperfinite sum of discrete integers ∑_{i=1}^n i = (n² + n)/2 via pairwise boundary cancellation.',
    attemptedHeuristics: [],
    callTreeText: '• [simpsum] args: [sum(i, i, 1, n)] -> (n^2 + n)/2\n  • [telescoping_ftc] args: [hyper_sum (delta F) n] -> F(n) - F(0)',
    rawOutput: `ev(sum(i, i, 1, n), simpsum: true);
-> (n^2 + n)/2`
  },

  // Toeplitz Matrix Laplacian
  'mat_laplace': {
    aic: 'ALG-MWM-TOEPLITZ-SPECTRUM',
    algorithmName: 'Toeplitz Tridiagonal Laplacian Spectrum',
    description: 'Evaluates 5x5 tridiagonal discrete Laplacian A and computes symbolic eigenvalues [-2, -1, -2-√3, -2+√3, -3].',
    attemptedHeuristics: [],
    callTreeText: '• [toeplitz_laplacian] args: [dim=5, stencil=[1, -2, 1]]\n  • [eigenvalues] args: [A] -> [[-2, -1, -2-sqrt(3), -2+sqrt(3), -3], [1, 1, 1, 1, 1]]\n  • [stability_check] args: [all lambda_k < 0] -> Guaranteed Asymptotic Thermal Stability',
    rawOutput: `A: matrix([-2,1,0,0,0],[1,-2,1,0,0],[0,1,-2,1,0],[0,0,1,-2,1],[0,0,0,1,-2])$
eigenvalues(A);
-> [[-2, -1, -2-sqrt(3), -2+sqrt(3), -3], [1, 1, 1, 1, 1]]`
  }
};

// Aliases for chip IDs and expressions
PREMINED_MAXIMA_TRACES['miner_diffdiv'] = PREMINED_MAXIMA_TRACES['x*exp(x^2)'];
PREMINED_MAXIMA_TRACES['miner_ratint'] = PREMINED_MAXIMA_TRACES['1/(x^3+1)'];
PREMINED_MAXIMA_TRACES['miner_trigint'] = PREMINED_MAXIMA_TRACES['sin(x)^3'];
PREMINED_MAXIMA_TRACES['miner_gamma'] = PREMINED_MAXIMA_TRACES['exp(x)/x'];
PREMINED_MAXIMA_TRACES['FREE_FALL(v0*t - 1/2*g*t^2, t)'] = PREMINED_MAXIMA_TRACES['newton_free_fall'];
PREMINED_MAXIMA_TRACES['free_fall(v0*t-1/2*g*t^2,t)'] = PREMINED_MAXIMA_TRACES['newton_free_fall'];
PREMINED_MAXIMA_TRACES['WORK_ENERGY_SUM(F, x0, xn)'] = PREMINED_MAXIMA_TRACES['newton_work_energy'];
PREMINED_MAXIMA_TRACES['HOOKES_LAW_LEAPFROG(k, m, dt)'] = PREMINED_MAXIMA_TRACES['newton_harmonic_oscillator'];
PREMINED_MAXIMA_TRACES['FLUX_ACCUMULATION(u_{i-1}, u_i, u_{i+1})'] = PREMINED_MAXIMA_TRACES['heat_slice_flux'];
PREMINED_MAXIMA_TRACES['TELESCOPING_CONSERVATION(q, 0, N)'] = PREMINED_MAXIMA_TRACES['telescoping_conservation'];
PREMINED_MAXIMA_TRACES['DIFF_W(x^3, x)'] = PREMINED_MAXIMA_TRACES['r_diff'];
PREMINED_MAXIMA_TRACES['LAPLACE_1D(x^2, x)'] = PREMINED_MAXIMA_TRACES['r_laplace'];
PREMINED_MAXIMA_TRACES['TELESCOPING_FTC(F, 0, n)'] = PREMINED_MAXIMA_TRACES['r_ftc'];
PREMINED_MAXIMA_TRACES['TOEPLITZ(5, alpha)'] = PREMINED_MAXIMA_TRACES['toeplitz_5x5'];
PREMINED_MAXIMA_TRACES['TOEPLITZ_LAPLACIAN(5, alpha)'] = PREMINED_MAXIMA_TRACES['mat_laplace'];


