/**
 * Catalog of Atomic Structured Pseudocode Modules for MiddleWay Math.
 * Each module is a self-contained code unit with direct dependencies.
 */

export interface IPseudoComplexity {
  tree: string;
  dyadic: string;
}

export interface IPseudoExample {
  inputs: string[];
  steps: string[];
  result: string;
}

export interface IPseudoAlgorithm {
  id: string;
  funcName: string;
  name: string;
  badge: string;
  summary: string;
  domain: string;
  primitives: string[];
  complexity: IPseudoComplexity;
  code: string;
  explanation: string[];
  example?: IPseudoExample;
}

export const MODULE_CATALOG: Record<string, IPseudoAlgorithm> = {
  simpler_options: {
    id: 'simpler_options',
    funcName: 'SimplerOptions',
    name: 'Extract Simpler Tree Ancestor Options',
    badge: 'Tree Decomposition',
    summary:
      'Extracts all ancestral prefixes of node X born on earlier days, partitioned into left options (< X) and right options (> X).',
    domain: 'X ∈ {+, -}* (Tree Node) ⟹ (XL, XR) where each option has birthday < birthday(X)',
    primitives: [
      'EmptySet()',
      'Insert(set, item)',
      'length(X)',
      'prefix < X (tree order)',
      'X[0 .. i] (proper prefix)',
    ],
    complexity: {
      tree: 'O(d) prefix extractions, where d is the birthday (string depth) of node X',
      dyadic: 'O(1) sign-string prefix slice and set insertion',
    },
    code: `function SimplerOptions(X: Node): (Set of Node, Set of Node)
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
end;`,
    explanation: [
      'Every tree node X is identified by its sign sequence of + and - steps from the root [].',
      'The "options" of X are strictly its ancestral prefixes born on earlier days.',
      'Prefixes smaller than X form the left set XL; prefixes greater form the right set XR.',
      'Guarantees finite inductive reduction by well-founded induction on birthday depth.',
    ],
    example: {
      inputs: ['X = [+ -] (1/2, born Day 2)'],
      steps: [
        'Prefix length 0: [] (0) < [+ -] ⟹ Insert([], XL)',
        'Prefix length 1: [+] (1) > [+ -] ⟹ Insert([+], XR)',
      ],
      result: 'XL = { [] }, XR = { [+] }',
    },
  },

  cut: {
    id: 'cut',
    funcName: 'Cut',
    name: 'Conway Cut: Earliest Birthday Node Between Bounds',
    badge: 'Tree Simplicity',
    summary:
      'Finds the unique earliest-born (simplest) Conway tree node strictly between a lower bound and upper bound by binary walking from root [].',
    domain: 'leftBound, rightBound ∈ {+, -}* with leftBound < rightBound ⟹ candidate Node',
    primitives: [
      'candidate ++ "+" (branch right)',
      'candidate ++ "-" (branch left)',
      '<= (tree order comparison)',
      '>= (tree order comparison)',
    ],
    complexity: {
      tree: 'O(d) tree walk from root [] to the simplest intermediate node born on day d',
      dyadic: 'O(1) binary mediant branch navigation',
    },
    code: `function Cut(leftBound: Node, rightBound: Node): Node
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
end;`,
    explanation: [
      'The Conway cut embodies the Simplicity Theorem: between any two surreal numbers lies a unique simplest number born on the earliest day.',
      'Begins at the root node [] (0).',
      'If candidate ≤ leftBound, branches right (+) to grow larger.',
      'If candidate ≥ rightBound, branches left (-) to shrink smaller.',
      'Terminates at the unique simplest sign sequence strictly between leftBound and rightBound.',
    ],
    example: {
      inputs: ['leftBound = 1 ([+])', 'rightBound = 1&1/2 ([+ + -])'],
      steps: [
        'candidate = [] (0) <= 1 ⟹ branch right (+), candidate := [+]',
        'candidate = [+] (1) <= 1 ⟹ branch right (+), candidate := [+ +]',
        'candidate = [+ +] (2) >= 1&1/2 ⟹ branch left (-), candidate := [+ + -]',
      ],
      result: 'Cut(1, 1&1/2) = [+ + -] (1&1/4)',
    },
  },

  conway_add: {
    id: 'conway_add',
    funcName: 'ConwayAdd',
    name: 'Conway Inductive Addition',
    badge: 'Tree-Inductive Arithmetic',
    summary:
      'Evaluates the exact sum X + Y of two Conway numbers directly on their tree sign paths by recursive options reduction and Conway cut.',
    domain: 'X, Y ∈ {+, -}* (Tree Nodes, with [] at root 0)',
    primitives: [
      'SimplerOptions(X)',
      'Cut(L, R)',
      'ConwayAdd(x, y) [recursive]',
      'EmptySet()',
      'Insert(set, item)',
      'Maximum(set)',
      'Minimum(set)',
    ],
    complexity: {
      tree: 'O(4^d) recursive option calls (explodes exponentially with birthday d)',
      dyadic: 'O(1) aligned bit-shift and 32-bit integer add in the ring (𝔻, +, ·)',
    },
    code: `function ConwayAdd(X: Node, Y: Node): Node
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
      'Conway addition recurses over all combinations of simpler ancestors (XL + Y) and (X + YL).',
      'Demonstrates why tree-inductive arithmetic is mathematically fundamental yet computationally explosive.',
      'The Conway cut resolves the final sum as the earliest-born node strictly between maxLeft and minRight.',
    ],
    example: {
      inputs: ['X = [+ -] (1/2)', 'Y = [+ - +] (3/4)'],
      steps: [
        'XL = { [], [+] }, XR = { [+ - -] }',
        'YL = { [], [+], [+ -] }, YR = { [+ - + -] }',
        'Recurse ConwayAdd on all 5 left options and 2 right options...',
        'max(leftResults) = 1, min(rightResults) = 1&1/2',
      ],
      result: 'Cut(1, 1&1/2) = [+ + -] (1&1/4)',
    },
  },

  conway_order: {
    id: 'conway_order',
    funcName: 'ConwayLessEq',
    name: 'Conway Inductive Order (X ≤ Y)',
    badge: 'Tree-Inductive Order',
    summary:
      'Determines if node X ≤ Y directly on Conway tree options: no left option of X can be ≥ Y, and no right option of Y can be ≤ X.',
    domain: 'X, Y ∈ {+, -}* (Tree Nodes) ⟹ 1 if X ≤ Y else 0',
    primitives: [
      'SimplerOptions(X)',
      'ConwayLessEq(Y, xL) [mutual recursion]',
      'ConwayLessEq(yR, X)',
    ],
    complexity: {
      tree: 'O(2^(d_x + d_y)) mutual recursive option evaluations over earlier birthdays',
      dyadic: 'O(1) sign comparison and bit alignment in the ordered field (𝔻, ≤)',
    },
    code: `function ConwayLessEq(X: Node, Y: Node): Integer
var
    XL, XR, YL, YR: Set of Node;
    xL, yR: Node;
begin
    // 1. Decompose both nodes into simpler ancestral options
    (XL, XR) := SimplerOptions(X);
    (YL, YR) := SimplerOptions(Y);

    // 2. Condition 1: No left option of X is >= Y (i.e. Y <= xL is false)
    for each xL in XL do
    begin
        if ConwayLessEq(Y, xL) = 1 then
            return 0; // Violation found: xL >= Y
    end;

    // 3. Condition 2: No right option of Y is <= X (i.e. yR <= X is false)
    for each yR in YR do
    begin
        if ConwayLessEq(yR, X) = 1 then
            return 0; // Violation found: yR <= X
    end;

    // Satisfies Conway surreal order: X <= Y
    return 1;
end;`,
    explanation: [
      'Conway fundamental inductive definition of order: X ≤ Y ⇔ (∀ xᴸ ∈ Xᴸ, ¬(Y ≤ xᴸ)) ∧ (∀ yᴿ ∈ Yᴿ, ¬(yᴿ ≤ X)).',
      'Base case: 0 ≤ 0 ([] ≤ []) has XL = ∅ and YR = ∅, immediately returning 1 (true).',
      'Inductively generates a total linear order across the entire binary tree without continuous limits or Cauchy sequences.',
      'Grounds the entire field ordering in well-founded induction on birthday depth.',
    ],
    example: {
      inputs: ['X = [] (0)', 'Y = [+] (1)'],
      steps: [
        'XL = ∅, XR = ∅ for X = []',
        'YL = { [] }, YR = ∅ for Y = [+]',
        'Left loop: XL is empty ⟹ no violation',
        'Right loop: YR is empty ⟹ no violation',
      ],
      result: 'ConwayLessEq([], [+]) = 1 (0 ≤ 1)',
    },
  },

  conway_sort: {
    id: 'conway_sort',
    funcName: 'ConwaySort',
    name: 'Conway Total Order Sort',
    badge: 'Tree-Inductive Sorting',
    summary:
      'Sorts an array of Conway tree nodes into ascending linear order strictly using the recursive ConwayLessEq order predicate.',
    domain: 'A: Array of Node ⟹ Sorted A such that A[0] ≤ A[1] ≤ ... ≤ A[n-1]',
    primitives: [
      'ConwayLessEq(a, b)',
      'A[i] (array indexing)',
    ],
    complexity: {
      tree: 'O(n² · 2^d) inductive option comparisons across array elements',
      dyadic: 'O(n log n) standard numeric sort using 64-bit integer compare',
    },
    code: `function ConwaySort(A: Array of Node, n: Integer): Array of Node
var
    i, j: Integer;
    key: Node;
begin
    // Insertion sort grounded strictly on Conway inductive order
    for i := 1 to n - 1 do
    begin
        key := A[i];
        j := i - 1;

        // Shift elements greater than key to the right
        while (j >= 0) and (ConwayLessEq(key, A[j]) = 1) do
        begin
            A[j + 1] := A[j];
            j := j - 1;
        end;
        A[j + 1] := key;
    end;

    return A;
end;`,
    explanation: [
      'Demonstrates that Conway recursive order defines a true total ordering on any finite collection of surreal numbers.',
      'Uses insertion sort where every pairwise order decision invokes the inductive ConwayLessEq predicate.',
      'Shows how abstract combinatorial game options organize into a strict linear sequence from least to greatest.',
    ],
    example: {
      inputs: ['A = [1, -1, 1/2, 0, -1/2]', 'n = 5'],
      steps: [
        'Compare key -1 with 1: -1 ≤ 1 ⟹ shift',
        'Compare key 1/2 with 1: 1/2 ≤ 1 ⟹ insert after 0',
        'Final sorted array satisfies Conway order at every step',
      ],
      result: 'ConwaySort(A, 5) = [-1, -1/2, 0, 1/2, 1]',
    },
  },

  conway_sub: {
    id: 'conway_sub',
    funcName: 'ConwaySub',
    name: 'Conway Inductive Subtraction',
    badge: 'Tree-Inductive Arithmetic',
    summary:
      'Evaluates the exact difference X - Y of two Conway numbers as X + (-Y) via Conway tree negation and addition.',
    domain: 'X, Y ∈ {+, -}* (Tree Nodes) ⟹ X - Y',
    primitives: [
      'ConwayNeg(Y)',
      'ConwayAdd(X, -Y)',
    ],
    complexity: {
      tree: 'O(4^d) option tree expansion inherited from ConwayAdd',
      dyadic: 'O(1) aligned bit-shift and integer subtraction in the ring (𝔻, +, ·)',
    },
    code: `function ConwaySub(X: Node, Y: Node): Node
var
    negY: Node;
begin
    // Subtraction is addition of the tree negation: X - Y = X + (-Y)
    negY := ConwayNeg(Y);
    return ConwayAdd(X, negY);
end;`,
    explanation: [
      'Conway subtraction reduces directly to addition with the sign-inverted tree node.',
      'Reflects the right-hand argument Y across the root 0 (+ <-> -).',
      'Preserves the group inversion law in the surreal number field.',
    ],
    example: {
      inputs: ['X = [+ + -] (1&1/4)', 'Y = [+ - +] (3/4)'],
      steps: [
        'ConwayNeg([+ - +]) = [- + -] (-3/4)',
        'ConwayAdd(1&1/4, -3/4) = 1/2',
      ],
      result: 'ConwaySub(1&1/4, 3/4) = [+ -] (1/2)',
    },
  },

  conway_mul: {
    id: 'conway_mul',
    funcName: 'ConwayMul',
    name: 'Conway Inductive Multiplication',
    badge: 'Tree-Inductive Arithmetic',
    summary:
      'Evaluates the exact product X · Y of two Conway numbers directly on their tree sign paths via 4-way recursive cross options and Conway cut.',
    domain: 'X, Y ∈ {+, -}* (Tree Nodes) ⟹ X · Y',
    primitives: [
      'SimplerOptions(X)',
      'ConwayAdd(a, b)',
      'ConwaySub(a, b)',
      'ConwayMul(a, b) [recursive]',
      'Cut(L, R)',
    ],
    complexity: {
      tree: 'Hyper-exponential option explosion: each recursive step branches into 4 products, 2 additions, and 1 subtraction',
      dyadic: 'O(1) single integer multiplication and denominator bit addition: (m₁/2^e₁) · (m₂/2^e₂) = (m₁·m₂)/2^(e₁+e₂)',
    },
    code: `function ConwayMul(X: Node, Y: Node): Node
var
    XL, XR, YL, YR: Set of Node;
    leftResults, rightResults: Set of Node;
    term, maxLeft, minRight: Node;
begin
    // 1. Decompose both nodes into ancestral options
    (XL, XR) := SimplerOptions(X);
    (YL, YR) := SimplerOptions(Y);

    leftResults  := EmptySet();
    rightResults := EmptySet();

    // 2. Left options: (xL · Y) + (X · yL) - (xL · yL)
    for each xL in XL do
        for each yL in YL do
        begin
            term := ConwayAdd(ConwayMul(xL, Y), ConwayMul(X, yL));
            Insert(leftResults, ConwaySub(term, ConwayMul(xL, yL)));
        end;

    // (xR · Y) + (X · yR) - (xR · yR)
    for each xR in XR do
        for each yR in YR do
        begin
            term := ConwayAdd(ConwayMul(xR, Y), ConwayMul(X, yR));
            Insert(leftResults, ConwaySub(term, ConwayMul(xR, yR)));
        end;

    // 3. Right options: (xL · Y) + (X · yR) - (xL · yR)
    for each xL in XL do
        for each yR in YR do
        begin
            term := ConwayAdd(ConwayMul(xL, Y), ConwayMul(X, yR));
            Insert(rightResults, ConwaySub(term, ConwayMul(xL, yR)));
        end;

    // (xR · Y) + (X · yL) - (xR · yL)
    for each xR in XR do
        for each yL in YL do
        begin
            term := ConwayAdd(ConwayMul(xR, Y), ConwayMul(X, yL));
            Insert(rightResults, ConwaySub(term, ConwayMul(xR, yL)));
        end;

    // 4. Resolve simplest intermediate node between bounds
    maxLeft  := Maximum(leftResults);
    minRight := Minimum(rightResults);
    return Cut(maxLeft, minRight);
end;`,
    explanation: [
      'Conway multiplication is the pinnacle of tree-inductive surreal arithmetic.',
      'Crosses every left and right option pair through 4 distinct algebraic combinations.',
      'Demonstrates why multiplying even small Day 2 numbers triggers dozens of recursive invocations.',
      'The Conway Cut identifies the unique earliest-born surreal product satisfying all option bounds.',
    ],
    example: {
      inputs: ['X = [+] (1)', 'Y = [+ -] (1/2)'],
      steps: [
        'XL = { [] }, XR = ∅; YL = { [], [+] }, YR = { [+ - -] }',
        'Cross-multiply options: 0 · 1/2 + 1 · 0 - 0 · 0 = 0',
        'max(leftResults) = 0, min(rightResults) = 1',
      ],
      result: 'Cut(0, 1) = [+ -] (1/2)',
    },
  },

  conway_neg: {
    id: 'conway_neg',
    funcName: 'ConwayNeg',
    name: 'Conway Tree Negation (-X)',
    badge: 'Tree Reflection Primitive',
    summary:
      'Inverts every sign step (+ <-> -) along the path, reflecting the node across the tree root 0.',
    domain: 'X ∈ {+, -}* ⟹ -X ∈ {+, -}*',
    primitives: [
      'X[i] (sign step)',
      'TreeConcat(res, invSign)',
    ],
    complexity: {
      tree: 'O(d) sign string inversion where d is birthday depth',
      dyadic: 'O(1) numerator integer negation in (𝔻, +, ·)',
    },
    code: `function ConwayNeg(X: Node): Node
var
    res: Node;
    i: Integer;
begin
    res := [];
    for i := 0 to length(X) - 1 do
    begin
        if X[i] = '+' then
            res := res ++ '-'
        else
            res := res ++ '+';
    end;
    return res;
end;`,
    explanation: [
      'Reflects any surreal number across the central root 0.',
      'Positive steps (+) become negative steps (-); negative steps (-) become positive steps (+).',
      'Exact symmetry: ConwayNeg(ConwayNeg(X)) = X.',
    ],
    example: {
      inputs: ['X = [+ - +] (3/4)'],
      steps: ['+ -> -, - -> +, + -> - ⟹ [- + -]'],
      result: 'ConwayNeg([+ - +]) = [- + -] (-3/4)',
    },
  },

  euler_compounding: {
    id: 'euler_compounding',
    funcName: 'EulerExp',
    name: 'Euler Hyperfinite Compounding in 𝔻',
    badge: 'Transcendental Dyadic Engine',
    summary:
      'Evaluates exp(x) = (1 + x/2^K)^(2^K) using purely dyadic bit-shifts and K repeated squarings in the ring (𝔻, +, ·).',
    domain: 'x ∈ 𝔻 (Dyadic Rational / Tree Node), K ∈ ℕ (e.g. K = 12)',
    primitives: [
      '≫ K (power-of-two right bit-shift)',
      '⊕ (exact dyadic ring addition)',
      'sqr(u) (exact dyadic squaring)',
      'val(x) (node to dyadic projection)',
      'node(u) (dyadic to canonical tree node)',
    ],
    complexity: {
      tree: 'Zero calculus limits, zero infinite series, zero floating-point math',
      dyadic: '1 bit-shift, 1 integer add, K repeated squarings in (𝔻, ·)',
    },
    code: `function EulerExp(x: Node, K: Integer): Node
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
        'dx = 1/4096, delta = 1/4096',
        'u₀ = 1 + 1/4096 = 4097/4096',
        '12 repeated squarings in (𝔻, ·)...',
        'u₁₂ = (u₁₁)² ≈ 2.7182818...',
      ],
      result: 'node(u₁₂) = [ + + - + - - + ... ] ⇔ e ≈ 2.718282',
    },
  },

  kinematics_step: {
    id: 'kinematics_step',
    funcName: 'KinematicStep',
    name: 'Discrete Kinematic State Update in (𝔻, +, ·)',
    badge: 'Newtonian Difference Engine',
    summary:
      'Evaluates discrete free-fall velocity v = v₀ ⊖ (g ⊗ t) and trajectory displacement s = (v₀ ⊗ t) ⊖ (1/2 ⊗ g ⊗ t²) strictly in the ring of dyadic rationals.',
    domain: 'v₀, g, t ∈ 𝔻 (Exact Dyadic Rationals on the 2-Successor Tree)',
    primitives: [
      '⊗ (dyadic ring multiplication)',
      '⊖ (dyadic ring subtraction)',
      '≫ 1 (exact half bit-shift)',
      'sqr(t) (exact squaring)',
    ],
    complexity: {
      tree: 'Finite difference stepping across discrete 2-successor rational tree',
      dyadic: 'Exact integer bit-shifts and ring additions; zero floating-point drift',
    },
    code: `function KinematicStep(v0: Dyadic, g: Dyadic, t: Dyadic): (Dyadic, Dyadic)
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
        's = (20 ⊗ 2) ⊖ ((39/8) ⊗ 4) = 40 ⊖ 39/2 = 20&1/2 m',
      ],
      result: 'v = 1/2 m/s, s = 20&1/2 m (strictly exact in 𝔻)',
    },
  },

  cordic_angle: {
    id: 'cordic_angle',
    funcName: 'CordicAngle',
    name: 'Elementary CORDIC Rotation Angle Table',
    badge: 'Discrete Trigonometry',
    summary:
      'Provides the exact dyadic elementary rotation angle arctan(2^-i) for iteration step i without transcendental library calls.',
    domain: 'i ∈ [0 .. N-1] ⟹ angle θ_i ∈ 𝔻',
    primitives: [
      'CordicAngleTable(i) (elementary dyadic constant table)',
    ],
    complexity: {
      tree: 'O(1) discrete constant projection from predefined 16-step dyadic lattice',
      dyadic: 'O(1) table lookup with zero runtime transcendentals',
    },
    code: `function CordicAngle(i: Integer): Dyadic
begin
    // Table of elementary dyadic rotation angles arctan(2^-i)
    // i=0: π/4 ≈ 0.785398, i=1: arctan(1/2) ≈ 0.463648, ...
    return CordicAngleTable(i);
end;`,
    explanation: [
      'CORDIC rotation relies on an elementary sequence of angles θ_i = arctan(2^-i).',
      'Because tan(θ_i) = 2^-i, multiplying by the tangent reduces to a simple power-of-two bit-shift.',
      'Replaces continuous calculus angles with a finite dyadic table of N discrete steps.',
    ],
    example: {
      inputs: ['i = 0 (first step)'],
      steps: ['arctan(2^0) = arctan(1) = π/4 ≈ 0.785398'],
      result: 'CordicAngle(0) ≈ 0.785398 ∈ 𝔻',
    },
  },

  rotor_trig_cordic: {
    id: 'rotor_trig_cordic',
    funcName: 'CordicRotor',
    name: 'Dyadic CORDIC Unit Rotor Projection',
    badge: 'Discrete Trigonometric Engine',
    summary:
      'Evaluates circular trigonometric coordinates (cos θ, sin θ) through N discrete dyadic rotations using only power-of-two bit-shifts and additions.',
    domain: 'θ ∈ 𝔻, step index i ∈ [0 .. N-1] ⟹ coordinate pair (x, y) ∈ 𝔻²',
    primitives: [
      'CordicAngle(i)',
      '≫ i (power-of-two right bit-shift)',
      '⊖ (dyadic ring subtraction)',
      '⊕ (dyadic ring addition)',
      '⊗ (dyadic ring multiplication)',
    ],
    complexity: {
      tree: 'Discrete angular winding along binary unit circle lattice',
      dyadic: 'N elementary shifts and additions; zero Math.sin / Math.cos dependency',
    },
    code: `function CordicRotor(theta: Dyadic, N: Integer): (Dyadic, Dyadic)
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
      'Eliminates external transcendental math libraries (Math.sin/cos).',
      'At step i, the coordinate vector rotates by angle arctan(2^-i) using only right-shifts (≫ i) and additions (⊕).',
      'Achieves 16-bit precision in only 16 iterations without Taylor series expansions or floating-point division.',
      'Unifies circular geometry with the discrete 2-successor structure of Middle Way arithmetic.',
    ],
    example: {
      inputs: ['θ = 0 (root [ ])', 'N = 16 iterations'],
      steps: [
        'Initial x = 39797 / 65536 ≈ 0.60725, y = 0',
        '16 elementary dyadic rotations with elementary angle table...',
        'x converges to 1.0 (node [+]), y converges to 0.0 (node [ ])',
      ],
      result: '(cos 0, sin 0) = (1, 0) ∈ 𝔻²',
    },
  },

  laplacian_heat_step: {
    id: 'laplacian_heat_step',
    funcName: 'HeatDiffusionStep',
    name: 'Discrete Laplacian Thermal Diffusion in 𝔻',
    badge: 'Discrete Field Engine',
    summary:
      'Advances 1D thermal distribution across spatial slices using the discrete second-difference operator in the ring (𝔻, +, ·).',
    domain: 'T[i] ∈ 𝔻, diffusion coefficient α ∈ 𝔻 (α ≤ 1/2 for stability)',
    primitives: [
      'CreateArray(M)',
      'T[i] ≪ 1 (double shift)',
      '⊖ (dyadic ring subtraction)',
      '⊕ (dyadic ring addition)',
      '⊗ (dyadic ring multiplication)',
    ],
    complexity: {
      tree: 'Local discrete interaction across spatial neighbor tree',
      dyadic: 'O(M) shifts and additions per time-tick; unconditionally exact over 𝔻',
    },
    code: `function HeatDiffusionStep(T: Array of Dyadic, alpha: Dyadic, M: Integer): Array of Dyadic
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
    funcName: 'BayesUpdate',
    name: 'Discrete Bayesian Posterior Update in 𝔻',
    badge: 'Probability Logic Engine',
    summary:
      'Computes posterior probability P(H | E) = P(E | H) · P(H) / P(E) over a finite discrete hypothesis partition strictly in (𝔻, +, ·).',
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
    code: `function BayesUpdate(priorH: Dyadic, pEgivenH: Dyadic, pEgivenNotH: Dyadic): Dyadic
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

  maximum: {
    id: 'maximum',
    funcName: 'Maximum',
    name: 'Option Set Supremum (Maximum)',
    badge: 'Set Extremum Primitive',
    summary:
      'Scans a finite set of Conway tree options to find the maximal (greatest) node according to the surreal tree order.',
    domain: 'S ⊂ {+, -}* (Finite Option Set) ⟹ m ∈ S such that ∀ x ∈ S, x ≤ m',
    primitives: [
      'nil',
      'for each x in S',
      '> (surreal tree order)',
      'm := x',
    ],
    complexity: {
      tree: 'O(|S|) comparisons along binary sign trees',
      dyadic: 'O(|S|) 1-to-1 sign sequence comparisons',
    },
    code: `function Maximum(S: Set of Node): Node
var
    m, x: Node;
begin
    m := nil;
    for each x in S do
    begin
        if (m = nil) or (x > m) then
            m := x;
    end;
    return m;
end;`,
    explanation: [
      'Finds the supremum over a finite set of surreal tree options.',
      'Initializes candidate maximum to nil (unassigned empty bound).',
      'Iterates over each candidate option x in set S.',
      'Updates maximum m whenever an option is strictly greater (x > m) under Conway tree order.',
      'Essential for Conway addition and inductive game options resolution.',
    ],
    example: {
      inputs: ['S = { [], [+], [+-] } (values 0, 1, 1/2)'],
      steps: [
        'x = [] (0): m was nil ⟹ m := []',
        'x = [+] (1): [+] > [] ⟹ m := [+]',
        'x = [+-] (1/2): [+-] not > [+] ⟹ m stays [+]',
      ],
      result: 'Maximum(S) = [+] (1)',
    },
  },

  minimum: {
    id: 'minimum',
    funcName: 'Minimum',
    name: 'Option Set Infimum (Minimum)',
    badge: 'Set Extremum Primitive',
    summary:
      'Scans a finite set of Conway tree options to find the minimal (least) node according to the surreal tree order.',
    domain: 'S ⊂ {+, -}* (Finite Option Set) ⟹ m ∈ S such that ∀ x ∈ S, x ≥ m',
    primitives: [
      'nil',
      'for each x in S',
      '< (surreal tree order)',
      'm := x',
    ],
    complexity: {
      tree: 'O(|S|) comparisons along binary sign trees',
      dyadic: 'O(|S|) 1-to-1 sign sequence comparisons',
    },
    code: `function Minimum(S: Set of Node): Node
var
    m, x: Node;
begin
    m := nil;
    for each x in S do
    begin
        if (m = nil) or (x < m) then
            m := x;
    end;
    return m;
end;`,
    explanation: [
      'Finds the infimum over a finite set of surreal tree options.',
      'Initializes candidate minimum to nil (unassigned empty bound).',
      'Iterates over each candidate option x in set S.',
      'Updates minimum m whenever an option is strictly smaller (x < m) under Conway tree order.',
      'Forms the right bound in the Conway cut resolution.',
    ],
    example: {
      inputs: ['S = { [], [+], [-] } (values 0, 1, -1)'],
      steps: [
        'x = [] (0): m was nil ⟹ m := []',
        'x = [+] (1): [+] not < [] ⟹ m stays []',
        'x = [-] (-1): [-] < [] ⟹ m := [-]',
      ],
      result: 'Minimum(S) = [-] (-1)',
    },
  },

  empty_set: {
    id: 'empty_set',
    funcName: 'EmptySet',
    name: 'Empty Option Set Allocator',
    badge: 'Option Set Lifecycle Primitive',
    summary:
      'Initializes an empty finite discrete option collection ∅ born before the current generation day.',
    domain: '() ⟹ ∅ (Empty Option Collection)',
    primitives: [
      'Set() (finite option container)',
    ],
    complexity: {
      tree: 'O(1) allocation of empty ancestor collection',
      dyadic: 'O(1) set reference creation',
    },
    code: `function EmptySet(): Set of Node
var
    S: Set of Node;
begin
    // Allocate an empty finite option set ∅
    S := Set();
    return S;
end;`,
    explanation: [
      'All surreal inductive definitions ground in the empty option set ∅.',
      'The surreal number zero is defined by 0 = { ∅ | ∅ } on Day 0.',
      'Initializes clean accumulator sets for left options (XL) and right options (XR).',
    ],
    example: {
      inputs: ['()'],
      steps: ['Allocate discrete container ∅'],
      result: 'EmptySet() = ∅',
    },
  },

  insert: {
    id: 'insert',
    funcName: 'Insert',
    name: 'Option Set Inclusion',
    badge: 'Option Set Inclusion Primitive',
    summary:
      'Inserts candidate tree node into an ancestral option collection S if not already present.',
    domain: 'S ⊂ {+, -}*, item ∈ {+, -}* ⟹ S ∪ {item}',
    primitives: [
      'for each x in S',
      'x = item',
      'include(S, item)',
    ],
    complexity: {
      tree: 'O(|S|) prefix equality checks',
      dyadic: 'O(1) amortized hashed set insertion',
    },
    code: `function Insert(S: Set of Node, item: Node): Set of Node
var
    alreadyPresent: Integer;
    x: Node;
begin
    alreadyPresent := 0;
    for each x in S do
    begin
        if x = item then
            alreadyPresent := 1;
    end;

    if alreadyPresent = 0 then
        include(S, item);

    return S;
end;`,
    explanation: [
      'Maintains set uniqueness when aggregating cross-recursive option sums.',
      'Checks whether the tree node item is already present in S.',
      'Inserts the element into S if unique, ensuring option sets remain strictly finite and deduplicated.',
    ],
    example: {
      inputs: ['S = { [] } (0)', 'item = [+-] (1/2)'],
      steps: [
        'Check x = []: [] != [+-]',
        'alreadyPresent = 0 ⟹ include(S, [+-])',
      ],
      result: 'Insert(S, [+-]) = { [], [+-] }',
    },
  },

  length: {
    id: 'length',
    funcName: 'length',
    name: 'Birthday Depth (length)',
    badge: 'Tree Metric Primitive',
    summary:
      'Returns the string length (birthday depth) of node X from the root [].',
    domain: 'X ∈ {+, -}* ⟹ birthday(X) ∈ ℕ',
    primitives: [
      'birthday(X)',
      'count of sign steps from []',
    ],
    complexity: {
      tree: 'O(1) step count query on path string',
      dyadic: 'O(1) integer property access',
    },
    code: `function length(X: Node): Integer
begin
    // Birthday depth: count of sign steps (+, -) from the root []
    return birthday(X);
end;`,
    explanation: [
      'The length of a sign sequence is its birthday: the generation day d on which number X was created.',
      'Root [] has length 0 (Day 0).',
      'Numbers [+], [-] have length 1 (Day 1).',
      'Limits ancestor prefix loops to strictly earlier generations: 0 to length(X) - 1.',
    ],
    example: {
      inputs: ['X = [+-+] (3/4)'],
      steps: ['Count steps: "+", "-", "+" ⟹ 3 steps'],
      result: 'length([+-+]) = 3 (born Day 3)',
    },
  },

  sqr: {
    id: 'sqr',
    funcName: 'sqr',
    name: 'Exact Dyadic Squaring',
    badge: 'Ring Multiplicative Primitive',
    summary:
      'Evaluates the exact square u² of a dyadic rational via a single multiplication in the ring (𝔻, ·).',
    domain: 'u ∈ 𝔻 ⟹ u ⊗ u ∈ 𝔻',
    primitives: [
      '⊗ (exact dyadic ring multiplication)',
    ],
    complexity: {
      tree: 'Finite convolution of sign path numerators',
      dyadic: '1 integer multiplication and denominator doubling',
    },
    code: `function sqr(u: Dyadic): Dyadic
begin
    // Exact dyadic squaring via ring multiplication in (𝔻, ·)
    return u ⊗ u;
end;`,
    explanation: [
      'Computes u² strictly within the ring of dyadic rationals.',
      'If u = m / 2^e, then u² = m² / 2^(2e), staying strictly inside 𝔻.',
      'Core foundation of Euler hyperfinite compounding: enables (1 + x/2^K)^(2^K) in only K squarings.',
    ],
    example: {
      inputs: ['u = 3/4 ([+-+])'],
      steps: ['(3/4) ⊗ (3/4) = 9/16'],
      result: 'sqr(3/4) = 9/16 (node [+-+--])',
    },
  },

  val: {
    id: 'val',
    funcName: 'val',
    name: 'Rational Projection (val)',
    badge: 'Tree-to-Ring Projection',
    summary:
      'Extracts the exact rational value d ∈ 𝔻 from a Conway tree node sign sequence.',
    domain: 'X ∈ {+, -}* ⟹ d = m / 2^e ∈ 𝔻',
    primitives: [
      'to_dyadic(X)',
    ],
    complexity: {
      tree: 'O(d) binary Horner evaluation of sign string',
      dyadic: 'O(1) rational struct extraction',
    },
    code: `function val(X: Node): Dyadic
begin
    // Rational projection: evaluates sign path (+, -) into dyadic fraction d ∈ 𝔻
    return to_dyadic(X);
end;`,
    explanation: [
      'Bridges the tree-inductive realm and the algebraic ring (𝔻, +, ·).',
      'Interprets the sign path as an integer part followed by binary fractional bits.',
      'Allows algorithms to switch into fast machine arithmetic when continuous or transcendental rates are required.',
    ],
    example: {
      inputs: ['X = [+-]'],
      steps: ['Root 0 ➔ branch right (+) to 1 ➔ branch left (-) to 1/2'],
      result: 'val([+-]) = 1/2',
    },
  },

  node: {
    id: 'node',
    funcName: 'node',
    name: 'Canonical Tree Projection (node)',
    badge: 'Ring-to-Tree Projection',
    summary:
      'Maps a dyadic rational d ∈ 𝔻 to its unique earliest sign path on the binary tree.',
    domain: 'd ∈ 𝔻 ⟹ unique simplest node X ∈ {+, -}*',
    primitives: [
      'to_node(d)',
      'binary tree descent',
    ],
    complexity: {
      tree: 'O(e) tree descent to earliest born rational',
      dyadic: 'O(1) canonical path reconstruction',
    },
    code: `function node(d: Dyadic): Node
begin
    // Canonical tree projection: maps dyadic rational d to unique earliest sign path
    return to_node(d);
end;`,
    explanation: [
      'The inverse of val: projects an algebraic dyadic rational back into the geometric Conway tree.',
      'Guaranteed to produce the canonical, shortest sign string representing d.',
      'Enables results from Euler compounding, kinematics, or CORDIC to be displayed directly on the visual tree.',
    ],
    example: {
      inputs: ['d = 3/4'],
      steps: ['Reconstruct binary walk: + (1) ➔ - (1/2) ➔ + (3/4)'],
      result: 'node(3/4) = [+-+]',
    },
  },

  create_array: {
    id: 'create_array',
    funcName: 'CreateArray',
    name: 'Lattice Array Allocation',
    badge: 'Lattice Primitive',
    summary:
      'Allocates a spatial 1D grid array of M discrete dyadic cells initialized to root [].',
    domain: 'M ∈ ℕ ⟹ Array[0 .. M-1] of Dyadic',
    primitives: [
      'allocate_grid(M)',
    ],
    complexity: {
      tree: 'O(M) tree root references',
      dyadic: 'O(M) contiguous memory allocation',
    },
    code: `function CreateArray(M: Integer): Array of Dyadic
var
    arr: Array of Dyadic;
begin
    // Allocates a 1D spatial grid lattice of M discrete dyadic cells
    arr := allocate_grid(M);
    return arr;
end;`,
    explanation: [
      'Initializes discrete spatial domain for 1D diffusion and wave PDE stepping.',
      'Allocates M discrete cells, each initialized to 0 (root []).',
      'Provides indexed boundary access nextT[0] and interior iteration nextT[i].',
    ],
    example: {
      inputs: ['M = 3'],
      steps: ['Allocate 3 cells: [0, 0, 0]'],
      result: 'CreateArray(3) = [0, 0, 0]',
    },
  },

  cordic_angle_table: {
    id: 'cordic_angle_table',
    funcName: 'CordicAngleTable',
    name: 'Elementary CORDIC Angle Table',
    badge: 'Trigonometric Table Primitive',
    summary:
      'Provides the exact elementary rotation angle arctan(2^-i) for step i.',
    domain: 'i ∈ [0 .. 15] ⟹ θ_i ∈ 𝔻',
    primitives: [
      'lookup_angle(i)',
    ],
    complexity: {
      tree: 'O(1) constant projection',
      dyadic: 'O(1) direct table indexing',
    },
    code: `function CordicAngleTable(i: Integer): Dyadic
var
    angle: Dyadic;
begin
    // Elementary rotation angles arctan(2^-i) for discrete dyadic rotor
    // i=0: π/4 ≈ 0.785398, i=1: arctan(1/2) ≈ 0.463648, ...
    angle := lookup_angle(i);
    return angle;
end;`,
    explanation: [
      'Provides the predefined constants arctan(2^-i) where tangent is exactly 2^-i.',
      'Multiplication by the tangent reduces to a simple power-of-two right bit-shift (≫ i).',
      'Stores 16 elementary angles, providing 16-bit trigonometric accuracy with zero runtime transcendental overhead.',
    ],
    example: {
      inputs: ['i = 0'],
      steps: ['lookup_angle(0) = arctan(1) = π/4 ≈ 0.785398'],
      result: 'CordicAngleTable(0) ≈ 0.785398',
    },
  },

  op_add: {
    id: 'op_add',
    funcName: 'DyadicAdd',
    name: 'Dyadic Ring Addition (⊕)',
    badge: 'Ring Machine Primitive',
    summary:
      'Evaluates exact dyadic addition with power-of-two denominator alignment in the ring (𝔻, +, ·).',
    domain: 'a, b ∈ 𝔻 ⟹ a ⊕ b ∈ 𝔻',
    primitives: [
      'a ⊕ b',
      'power-of-two alignment',
    ],
    complexity: {
      tree: 'Replaces Conway inductive recursion O(4^d) with exact O(1) ring addition',
      dyadic: '1 bit-shift, 1 integer addition',
    },
    code: `function DyadicAdd(a: Dyadic, b: Dyadic): Dyadic
begin
    // Exact ring addition with power-of-two denominator alignment in (𝔻, +, ·)
    return a ⊕ b;
end;`,
    explanation: [
      'The foundational operation of the dyadic machine.',
      'Aligns denominators via bit-shifts and sums 64-bit integer numerators.',
      'Never introduces floating-point rounding error; mathematically exact.',
    ],
    example: {
      inputs: ['a = 1/4 (1/2²)', 'b = 1/2 (1/2¹)'],
      steps: [
        'Shift b to common denominator 4: b = 2/4',
        'Sum numerators: 1 + 2 = 3',
      ],
      result: 'DyadicAdd(1/4, 1/2) = 3/4',
    },
  },

  op_concat: {
    id: 'op_concat',
    funcName: 'TreeConcat',
    name: 'Tree Branch Concatenation (++)',
    badge: 'Tree Geometry Primitive',
    summary:
      'Appends a discrete sign step (+ for right branch, - for left branch) to walk down the binary tree.',
    domain: 'p ∈ {+, -}*, sign ∈ {+, -} ⟹ p ++ sign',
    primitives: [
      'p ++ sign',
    ],
    complexity: {
      tree: '1 step down the binary Conway tree',
      dyadic: 'O(1) string/path append',
    },
    code: `function TreeConcat(p: Node, sign: String): Node
begin
    // Appends sign step ('+' for right, '-' for left) to walk down the tree
    return p ++ sign;
end;`,
    explanation: [
      'Navigates down the Conway surreal tree one generation step at a time.',
      'Appending + moves to a larger child (right branch).',
      'Appending - moves to a smaller child (left branch).',
      'Used by the Conway Cut to walk from the root [] to the simplest intermediate node.',
    ],
    example: {
      inputs: ['p = [+] (1)', 'sign = "-"'],
      steps: ['Append "-" to path "+": "+-"'],
      result: 'TreeConcat([+], "-") = [+-] (1/2)',
    },
  },
};

/**
 * Backward compatibility alias mapping.
 * Both rule IDs (conway_add, euler_compounding) and function names (ConwayAdd, Cut) resolve.
 */
export const PSEUDO_CATALOG: Record<string, IPseudoAlgorithm> = {
  ...MODULE_CATALOG,
  // Function name aliases
  SimplerOptions: MODULE_CATALOG.simpler_options,
  Cut: MODULE_CATALOG.cut,
  ConwayAdd: MODULE_CATALOG.conway_add,
  ConwayLessEq: MODULE_CATALOG.conway_order,
  ConwayCompare: MODULE_CATALOG.conway_order,
  ConwaySort: MODULE_CATALOG.conway_sort,
  ConwaySub: MODULE_CATALOG.conway_sub,
  ConwayMul: MODULE_CATALOG.conway_mul,
  ConwayNeg: MODULE_CATALOG.conway_neg,
  EulerExp: MODULE_CATALOG.euler_compounding,
  KinematicStep: MODULE_CATALOG.kinematics_step,
  CordicAngle: MODULE_CATALOG.cordic_angle,
  CordicRotor: MODULE_CATALOG.rotor_trig_cordic,
  HeatDiffusionStep: MODULE_CATALOG.laplacian_heat_step,
  BayesUpdate: MODULE_CATALOG.bayes_discrete_update,

  // Primitive aliases
  Maximum: MODULE_CATALOG.maximum,
  Minimum: MODULE_CATALOG.minimum,
  EmptySet: MODULE_CATALOG.empty_set,
  Insert: MODULE_CATALOG.insert,
  length: MODULE_CATALOG.length,
  sqr: MODULE_CATALOG.sqr,
  val: MODULE_CATALOG.val,
  node: MODULE_CATALOG.node,
  CreateArray: MODULE_CATALOG.create_array,
  CordicAngleTable: MODULE_CATALOG.cordic_angle_table,
  DyadicAdd: MODULE_CATALOG.op_add,
  TreeConcat: MODULE_CATALOG.op_concat,

  // Short ID aliases
  euler_exp: MODULE_CATALOG.euler_compounding,
  cordic_rotor: MODULE_CATALOG.rotor_trig_cordic,
  '⊕': MODULE_CATALOG.op_add,
  '++': MODULE_CATALOG.op_concat,
};

/**
 * Resolves a module by ID or function name.
 */
export function getPseudoModule(idOrName: string): IPseudoAlgorithm | undefined {
  if (!idOrName) return undefined;
  return PSEUDO_CATALOG[idOrName] || PSEUDO_CATALOG[idOrName.toLowerCase()];
}

/**
 * Returns all atomic module source codes combined into a library program.
 */
export function getAllModulesCombinedCode(): string {
  return Object.values(MODULE_CATALOG)
    .map((m) => m.code)
    .join('\n\n');
}
