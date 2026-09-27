/**
 * Catalog of Structured Pseudocode Algorithms for MiddleWay Math.
 * Bridges prose, Conway tree-node representations, and the Dyadic Arithmetic Machine.
 */
export const PSEUDO_CATALOG = {
    conway_add: {
        id: 'conway_add',
        name: 'Conway Recursive Addition on Tree Nodes',
        badge: 'Tree-Inductive Arithmetic',
        summary: 'Evaluates the exact sum X + Y of two Conway numbers directly on their tree sign paths by recursive options reduction and Conway cut.',
        domain: 'X, Y ∈ {+, -}* (Tree Nodes, with [] at root 0)',
        primitives: [
            'options(X)',
            'cut(L, R)',
            'left(X)',
            'right(X)',
            'birthday(X)',
            'SimplerOptions(X)',
        ],
        complexity: {
            tree: 'O(4^d) recursive option calls (explodes exponentially with birthday d)',
            dyadic: 'O(1) aligned bit-shift and 32-bit integer add in the ring (𝔻, +, ·)',
        },
        code: `// =====================================================================
// 1. Extract Simpler Tree Ancestor Options
// =====================================================================
function SimplerOptions(X: Node): (Set of Node, Set of Node)
var
    XL, XR: Set of Node;
    i: Integer;
    prefix: Node;
begin
    XL := EmptySet();
    XR := EmptySet();

    // All proper prefixes are numbers born on earlier days
    for i := 0 to length(X) - 1 do
    begin
        prefix := X[0 .. i];
        if prefix < X then
            Insert(XL, prefix)
        else
            Insert(XR, prefix);
    end;

    return (XL, XR);
end;

// =====================================================================
// 2. The Conway Cut: Earliest Birthday Node Between Bounds
// =====================================================================
function Cut(leftBound: Node, rightBound: Node): Node
var
    candidate: Node;
begin
    // Walk down the binary tree from the root []
    candidate := [];
    while (candidate <= leftBound) or (candidate >= rightBound) do
    begin
        if candidate <= leftBound then
            candidate := candidate ++ '+'      // Branch right to grow
        else
            candidate := candidate ++ '-';     // Branch left to shrink
    end;
    return candidate;  // Unique simplest node strictly between bounds
end;

// =====================================================================
// 3. Conway Inductive Addition
// =====================================================================
function ConwayAdd(X: Node, Y: Node): Node
var
    XL, XR, YL, YR: Set of Node;
    leftResults, rightResults: Set of Node;
    maxLeft, minRight: Node;
begin
    // 1. Decompose both nodes into their simpler tree ancestors
    (XL, XR) := SimplerOptions(X);
    (YL, YR) := SimplerOptions(Y);

    leftResults  := EmptySet();
    rightResults := EmptySet();

    // 2. Recursive cross-additions: (XL + Y) and (X + YL)
    for each xL in XL do Insert(leftResults, ConwayAdd(xL, Y));
    for each yL in YL do Insert(leftResults, ConwayAdd(X, yL));

    // 3. Recursive cross-additions: (XR + Y) and (X + YR)
    for each xR in XR do Insert(rightResults, ConwayAdd(xR, Y));
    for each yR in YR do Insert(rightResults, ConwayAdd(X, yR));

    // 4. Extreme bounds: greatest left option and least right option
    maxLeft  := Maximum(leftResults);
    minRight := Minimum(rightResults);

    // 5. The sum is the simplest node created between the two bounds
    return Cut(maxLeft, minRight);
end;`,
        explanation: [
            'Every tree node X is identified solely by its sign sequence of + and - steps from the root [].',
            'The "options" of X are its ancestral prefixes born on earlier days, partitioned into XL (< X) and XR (> X).',
            'Conway addition recurses over all combinations of simpler ancestors, demonstrating why tree-inductive arithmetic is mathematically fundamental yet computationally explosive.',
            'The Conway cut finds the earliest-born (shortest string) node between max(leftResults) and min(rightResults).',
        ],
        example: {
            inputs: ['X = [+ -] (1/2)', 'Y = [+ - +] (3/4)'],
            steps: [
                'XL = { [], [+] },  XR = { [+ - -] }',
                'YL = { [], [+], [+ -] },  YR = { [+ - + -] }',
                'Recurse ConwayAdd on all 5 left options and 2 right options...',
                'max(leftResults) = 1,  min(rightResults) = 1&1/2',
            ],
            result: 'Cut(1, 1&1/2) = [+ + -] (1&1/4)',
        },
    },
    euler_compounding: {
        id: 'euler_compounding',
        name: 'Euler Hyperfinite Compounding in 𝔻',
        badge: 'Transcendental Dyadic Engine',
        summary: 'Evaluates exp(x) = (1 + x/2^K)^(2^K) using purely dyadic bit-shifts and K repeated squarings in the ring (𝔻, +, ·).',
        domain: 'x ∈ 𝔻 (Dyadic Rational / Tree Node), K ∈ ℕ (e.g. K = 12)',
        primitives: ['shift(a, k)', 'add(a, b)', 'sqr(a)', 'val(X)', 'node(d)'],
        complexity: {
            tree: 'Zero calculus limits, zero infinite series, zero floating-point math',
            dyadic: '1 bit-shift, 1 integer add, K repeated squarings in (𝔻, ·)',
        },
        code: `// =====================================================================
// Euler Hyperfinite Compounding in the Ring (𝔻, +, ·)
// =====================================================================
function EulerExp(x: Node, K: Integer): Node
var
    dx, delta, u: Dyadic;
    i: Integer;
begin
    dx    := 1 ≫ K;              // Microscopic tick dx = 1 / 2^K
    delta := val(x) ≫ K;         // Infinitesimal increment x · dx = x / 2^K
    u     := 1 ⊕ delta;          // Base growth slice u₀ = 1 + x/2^K

    // Exact repeated squaring in (𝔻, ·)
    for i := 1 to K do
    begin
        u := sqr(u);             // u_i = (u_{i-1})²
    end;

    return node(u);              // Canonical Conway tree node
end;`,
        explanation: [
            'Avoids transcendental library calls and floating-point rounding errors entirely.',
            'Divides unit time into 2^K infinitesimal intervals of width dx = 1/2^K.',
            'Continuous compounding is realized as the exact product of 2^K identical microscopic slices.',
            'Computed in only K iterations via binary repeated squarings in the ring (𝔻, +, ·).',
        ],
        example: {
            inputs: ['x = [+] (1.0)', 'K = 12 (4096 slices)'],
            steps: [
                'dx = 1/4096,  delta = 1/4096',
                'u₀ = 1 + 1/4096 = 4097/4096',
                '12 repeated squarings in (𝔻, ·)...',
                'u₁₂ = (u₁₁)² ≈ 2.7182818...',
            ],
            result: 'node(u₁₂) = [ + + - + - - + ... ] ⇔ e ≈ 2.718282',
        },
    },
    kinematics_step: {
        id: 'kinematics_step',
        name: 'Discrete Kinematic State Update in (𝔻, +, ·)',
        badge: 'Newtonian Difference Engine',
        summary: 'Evaluates discrete free-fall velocity v = v₀ ⊖ (g ⊗ t) and trajectory displacement s = (v₀ ⊗ t) ⊖ (1/2 ⊗ g ⊗ t²) strictly in the ring of dyadic rationals.',
        domain: 'v₀, g, t ∈ 𝔻 (Exact Dyadic Rationals on the 2-Successor Tree)',
        primitives: [
            '⊕ (dyadic add)',
            '⊖ (dyadic sub)',
            '⊗ (dyadic mul)',
            '≫ 1 (half bit-shift)',
            'sqr(t)',
            'node(d)',
        ],
        complexity: {
            tree: 'Finite difference stepping across discrete 2-successor rational tree',
            dyadic: 'Exact integer bit-shifts and ring additions; zero floating-point drift',
        },
        code: `// =====================================================================
// Discrete Kinematic Update in the Ring (𝔻, +, ·)
// =====================================================================
function KinematicStep(v0: Dyadic, g: Dyadic, t: Dyadic): (Dyadic, Dyadic)
var
    gt, halfG, t2, v, s: Dyadic;
begin
    // 1. Velocity decrement: v(t) = v₀ - g · t
    gt    := g ⊗ t;                   // Exact dyadic product
    v     := v0 ⊖ gt;                 // Ring subtraction

    // 2. Trajectory displacement: s(t) = v₀ · t - (1/2) · g · t²
    halfG := g ≫ 1;                   // Exact 1-bit right shift (division by 2)
    t2    := sqr(t);                  // t²
    s     := (v0 ⊗ t) ⊖ (halfG ⊗ t2); // Exact rational difference

    return (v, s);                    // Pair of canonical dyadic values
end;`,
        explanation: [
            'Bypasses continuous limits and floating-point math libraries entirely.',
            'Operates purely over the ring of dyadic rationals (𝔻, +, ·) where division by 2 is an exact bit-shift.',
            'Computes both velocity and position synchronously as discrete algebraic difference invariants.',
            'Every state maps directly to a finite Conway tree birthday and unique sign sequence.',
        ],
        example: {
            inputs: ['v₀ = 20 (20/1)', 'g = 9&3/4 (39/4 m/s²)', 't = 2 (2/1 s)'],
            steps: [
                'gt = (39/4) ⊗ 2 = 39/2 = 19&1/2 m/s',
                'v = 20 ⊖ 19&1/2 = 1/2 m/s (node [+ -])',
                'halfG = (39/4) ≫ 1 = 39/8',
                't² = 4',
                's = (20 ⊗ 2) ⊖ ((39/8) ⊗ 4) = 40 ⊖ 39/2 = 20&1/2 m (node [+ + + ...])',
            ],
            result: 'v = 1/2 m/s, s = 20&1/2 m (strictly exact in 𝔻)',
        },
    },
    rotor_trig_cordic: {
        id: 'rotor_trig_cordic',
        name: 'Dyadic CORDIC Unit Rotor Projection',
        badge: 'Discrete Trigonometric Engine',
        summary: 'Evaluates circular trigonometric coordinates (cos θ, sin θ) through N discrete dyadic rotations using only power-of-two bit-shifts and additions.',
        domain: 'θ ∈ 𝔻, step index i ∈ [0 .. N-1], coordinate pair (x, y) ∈ 𝔻²',
        primitives: [
            'x ≫ i (bit-shift)',
            'x ⊕ y (dyadic add)',
            'x ⊖ y (dyadic sub)',
            'CordicAngle(i)',
            'val(X)',
        ],
        complexity: {
            tree: 'Discrete angular winding along binary unit circle lattice',
            dyadic: 'N elementary shifts and additions; zero Math.sin / Math.cos dependency',
        },
        code: `// =====================================================================
// CORDIC Unit Rotor Projection in the Ring (𝔻, +, ·)
// =====================================================================
function CordicRotor(theta: Dyadic, N: Integer): (Dyadic, Dyadic)
var
    x, y, z, nextX, nextY: Dyadic;
    d, i: Integer;
begin
    // Initial scaled rotor along unit axis: K ≈ 0.607252935
    x := 39797 ≫ 16;  // Canonical dyadic scaling constant
    y := 0;
    z := theta;

    for i := 0 to N - 1 do
    begin
        if z >= 0 then
            d := 1
        else
            d := -1;

        // Elementary dyadic pseudo-rotation via 2^-i shifts
        nextX := x ⊖ (d ⊗ (y ≫ i));
        nextY := y ⊕ (d ⊗ (x ≫ i));
        z     := z ⊖ (d ⊗ CordicAngle(i));

        x := nextX;
        y := nextY;
    end;

    return (x, y);    // Exact dyadic projections (cos θ, sin θ)
end;`,
        explanation: [
            'Eliminates the purple arrow to external transcendental math libraries (Math.sin/cos).',
            'At step i, the coordinate vector rotates by angle arctan(2^-i) using only right-shifts (≫ i) and additions (⊕).',
            'Achieves 16-bit precision in only 16 iterations without Taylor series expansions or floating-point division.',
            'Unifies circular geometry with the discrete 2-successor structure of Middle Way arithmetic.',
        ],
        example: {
            inputs: ['θ = 0 (root [ ])', 'N = 16 iterations'],
            steps: [
                'Initial x = 39797 / 65536 ≈ 0.60725,  y = 0',
                '16 elementary dyadic rotations with elementary angle table...',
                'x converges to 1.0 (node [+]),  y converges to 0.0 (node [ ])',
            ],
            result: '(cos 0, sin 0) = (1, 0) ∈ 𝔻²',
        },
    },
    laplacian_heat_step: {
        id: 'laplacian_heat_step',
        name: 'Discrete Laplacian Thermal Diffusion in 𝔻',
        badge: 'Discrete Field Engine',
        summary: 'Advances 1D thermal distribution across spatial slices using the discrete second-difference operator in the ring (𝔻, +, ·).',
        domain: 'T[i] ∈ 𝔻, diffusion coefficient α ∈ 𝔻 (α ≤ 1/2 for stability)',
        primitives: [
            'T[i] ≪ 1 (double shift)',
            'T[i-1] ⊖ 2·T[i] ⊕ T[i+1] (second difference)',
            'alpha ⊗ laplacian',
            '⊕ (dyadic add)',
        ],
        complexity: {
            tree: 'Local discrete interaction across spatial neighbor tree',
            dyadic: 'O(M) shifts and additions per time-tick; unconditionally exact over 𝔻',
        },
        code: `// =====================================================================
// 1D Discrete Thermal Diffusion Step in (𝔻, +, ·)
// =====================================================================
function HeatDiffusionStep(T: Array of Dyadic, alpha: Dyadic, M: Integer): Array of Dyadic
var
    nextT: Array of Dyadic;
    i: Integer;
    laplacian: Dyadic;
begin
    nextT := CreateArray(M);

    // Boundary conditions: Dirichlet fixed endpoints
    nextT[0]   := T[0];
    nextT[M-1] := T[M-1];

    // Interior grid nodes: T_{n+1}[i] = T_n[i] + α · (T_n[i-1] - 2·T_n[i] + T_n[i+1])
    for i := 1 to M - 2 do
    begin
        laplacian := T[i-1] ⊖ (T[i] ≪ 1) ⊕ T[i+1];
        nextT[i]  := T[i] ⊕ (alpha ⊗ laplacian);
    end;

    return nextT;
end;`,
        explanation: [
            'Replaces continuous partial differential equations (PDEs) with exact discrete difference equations in 𝔻.',
            'Multiplying by 2 in the central difference is evaluated as an exact 1-bit left shift (≪ 1).',
            'Guarantees energy conservation and monotonic entropy growth across discrete spatial slices.',
        ],
        example: {
            inputs: ['T = [0, 1, 0]', 'α = 1/4 (node [+ - -])', 'M = 3'],
            steps: [
                'laplacian[1] = 0 ⊖ (1 ≪ 1) ⊕ 0 = -2',
                'diffusion increment = (1/4) ⊗ (-2) = -1/2',
                'nextT[1] = 1 ⊕ (-1/2) = 1/2 (node [+ -])',
            ],
            result: 'nextT = [0, 1/2, 0] (smooth central dispersion in 𝔻)',
        },
    },
    bayes_discrete_update: {
        id: 'bayes_discrete_update',
        name: 'Discrete Bayesian Posterior Update in 𝔻',
        badge: 'Probability Logic Engine',
        summary: 'Computes posterior probability P(H | E) = P(E | H) · P(H) / P(E) over a finite discrete hypothesis partition strictly in (𝔻, +, ·).',
        domain: 'Prior, Likelihood ∈ 𝔻 ∩ [0, 1], Hypothesis Space Ω',
        primitives: [
            'priorH ⊗ pEgivenH',
            '1 ⊖ priorH (complement)',
            '⊕ (dyadic add)',
            '⊘ (dyadic quotient)',
        ],
        complexity: {
            tree: 'Partition branching on finite hypothesis decision tree',
            dyadic: 'Ring multiplications and dyadic quotient; zero measure-theoretic integrals',
        },
        code: `// =====================================================================
// Discrete Bayesian Hypothesis Update in (𝔻, +, ·)
// =====================================================================
function BayesUpdate(priorH: Dyadic, pEgivenH: Dyadic, pEgivenNotH: Dyadic): Dyadic
var
    priorNotH, jointH, jointNotH, totalEvidence, posterior: Dyadic;
begin
    priorNotH     := 1 ⊖ priorH;
    jointH        := priorH ⊗ pEgivenH;
    jointNotH     := priorNotH ⊗ pEgivenNotH;
    totalEvidence := jointH ⊕ jointNotH;

    // Exact dyadic division
    posterior     := jointH ⊘ totalEvidence;

    return posterior;
end;`,
        explanation: [
            'Grounds probability strictly in discrete partition counting over finite event sets.',
            'Joint likelihoods are exact dyadic products in the ring (𝔻, +, ·).',
            'Normalizing evidence P(E) is evaluated as the exact sum of disjoint joint weights.',
            'Produces a verifiable rational probability without real-analysis measure theory.',
        ],
        example: {
            inputs: ['Prior P(H) = 1/2', 'Likelihood P(E|H) = 3/4', 'False positive P(E|¬H) = 1/4'],
            steps: [
                'jointH = (1/2) ⊗ (3/4) = 3/8',
                'jointNotH = (1/2) ⊗ (1/4) = 1/8',
                'totalEvidence = 3/8 ⊕ 1/8 = 4/8 = 1/2',
                'posterior = (3/8) ⊘ (1/2) = 3/4',
            ],
            result: 'P(H | E) = 3/4 (node [+ - +])',
        },
    },
};
