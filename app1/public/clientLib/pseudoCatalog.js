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
};
