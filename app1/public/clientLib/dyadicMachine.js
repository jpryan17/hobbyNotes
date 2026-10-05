import { DR } from './dyadicRationals.js';
import { WU } from './exputils.js';
export { DR, WU };
/**
 * Implementation of IDyadicNode where a node is defined purely by its path string.
 * Birthday and the corresponding dyadic rational are constructed from that string.
 */
export class DyadicNode {
    path;
    constructor(path, _legacyDR) {
        this.path = (path || '').trim();
    }
    /**
     * Generation depth / Conway birthday constructed from path length:
     * Root "" has birthday 0; "-" and "+" have birthday 1, etc.
     */
    get birthday() {
        return this.path.length;
    }
    /**
     * The corresponding dyadic rational constructed on demand from the path string.
     */
    get value() {
        return this.toDR();
    }
    /**
     * Constructs the dyadic rational (m / 2^k) from the path string.
     */
    toDR() {
        return new DR(this.path).reduce();
    }
    format() {
        return this.toDR().format();
    }
    toFloat() {
        return this.toDR().toFloat();
    }
    toString() {
        const pStr = this.path === '' ? '[]' : `[${this.path}]`;
        return `Node(${pStr} ⇔ ${this.format()}, Day ${this.birthday})`;
    }
}
/**
 * Concrete implementation of the Dyadic Arithmetic Machine.
 */
export class DyadicMachineClass {
    systemLedger = {
        addCount: 0,
        mulCount: 0,
        cutCount: 0,
        maxDepth: 0,
    };
    resetLedger() {
        this.systemLedger = {
            addCount: 0,
            mulCount: 0,
            cutCount: 0,
            maxDepth: 0,
        };
    }
    /**
     * Root node (Day 0): path "" (empty string).
     */
    root() {
        return new DyadicNode('');
    }
    /**
     * Resolves a sign path of pluses and minuses to a node.
     * Path "" yields the root (0).
     */
    fromPath(path) {
        let cleanPath = (path || '').trim();
        if (cleanPath.length === 0) {
            return this.root();
        }
        // Normalize if legacy zeros and ones are encountered
        cleanPath = DR.pathToSignSeq(cleanPath);
        return new DyadicNode(cleanPath);
    }
    /**
     * Resolves a DR dyadic rational to a node with its canonical tree sign path.
     */
    fromDR(dr) {
        const reduced = new DR(undefined, dr.sign, dr.numerator, dr.precision).reduce();
        const path = reduced.toSignExpansion();
        return new DyadicNode(path);
    }
    /**
     * Constructs a node from an integer.
     */
    fromInt(n) {
        if (n === 0)
            return this.root();
        const sign = n < 0 ? WU.minus : WU.plus;
        const absN = Math.abs(n);
        const dr = new DR(undefined, sign, absN, 0);
        return this.fromDR(dr);
    }
    /**
     * Constructs a node from a dyadic fraction: sign * (num / 2^precision).
     */
    fromFraction(num, precision = 0, sign = '+') {
        if (num === 0)
            return this.root();
        const s = sign === '-' ? WU.minus : WU.plus;
        const dr = new DR(undefined, s, Math.abs(num), precision).reduce();
        return this.fromDR(dr);
    }
    /**
     * Constructs a node from an IEEE float/decimal with specified dyadic bit precision.
     */
    fromFloat(val, precisionBits = 16) {
        if (val === 0 || isNaN(val))
            return this.root();
        const sign = val < 0 ? WU.minus : WU.plus;
        const absVal = Math.abs(val);
        const P = Math.min(Math.max(precisionBits, 0), 30);
        const scale = Math.pow(2, P);
        const num = Math.round(absVal * scale);
        const dr = new DR(undefined, sign, num, P).reduce();
        return this.fromDR(dr);
    }
    /**
     * Universal node resolver from string path, DR, number, or existing node.
     */
    node(input) {
        if (typeof input === 'number') {
            return Number.isInteger(input) ? this.fromInt(input) : this.fromFloat(input);
        }
        if (typeof input === 'string') {
            return this.fromPath(input);
        }
        if ('path' in input) {
            return input;
        }
        return this.fromDR(input);
    }
    toDR(input) {
        if (typeof input === 'string') {
            return this.fromPath(input).value;
        }
        if (typeof input === 'number') {
            return (Number.isInteger(input) ? this.fromInt(input) : this.fromFloat(input)).value;
        }
        if ('toDR' in input && typeof input.toDR === 'function') {
            return input.toDR();
        }
        if ('value' in input) {
            return input.value;
        }
        return input;
    }
    // --- Tree Navigation (Pure String Operations) ---
    /**
     * Left child (branch '-', negative direction). Pure string concatenation.
     */
    left(node) {
        const path = typeof node === 'string' ? node : node.path;
        return new DyadicNode(path + WU.minus);
    }
    /**
     * Right child (branch '+', positive direction). Pure string concatenation.
     */
    right(node) {
        const path = typeof node === 'string' ? node : node.path;
        return new DyadicNode(path + WU.plus);
    }
    /**
     * Parent node on the tree (drops the last sign). Returns null at root.
     */
    parent(node) {
        const path = typeof node === 'string' ? node : node.path;
        if (path.length === 0)
            return null;
        return new DyadicNode(path.slice(0, -1));
    }
    // --- Ring Arithmetic ---
    add(a, b) {
        const drA = this.toDR(a);
        const drB = this.toDR(b);
        return this.fromDR(DR.add(drA, drB));
    }
    sub(a, b) {
        const drA = this.toDR(a);
        const drB = this.toDR(b);
        return this.fromDR(DR.sub(drA, drB));
    }
    neg(a) {
        const drA = this.toDR(a);
        return this.fromDR(DR.negate(drA));
    }
    mul(a, b) {
        const drA = this.toDR(a);
        const drB = this.toDR(b);
        return this.fromDR(DR.multiply(drA, drB));
    }
    div(a, b, precisionBits = 16) {
        const drA = this.toDR(a);
        const drB = this.toDR(b);
        if (!drB.sign || drB.numerator === 0) {
            throw new Error('Division by zero in dyadicMachine');
        }
        if (!drA.sign || drA.numerator === 0) {
            return this.root();
        }
        const resultSign = drA.sign === drB.sign ? WU.plus : WU.minus;
        const P = BigInt(Math.min(Math.max(precisionBits, 0), 40));
        const bigNumA = BigInt(drA.numerator) << BigInt(drB.precision);
        const bigNumB = BigInt(drB.numerator) << BigInt(drA.precision);
        const quotient = (bigNumA << P) / bigNumB;
        return this.fromBigIntFraction(resultSign === WU.minus ? -quotient : quotient, Number(P));
    }
    sqrt(a, precisionBits = 16) {
        const drA = this.toDR(a);
        if (!drA.sign || drA.numerator === 0)
            return this.root();
        if (drA.sign === WU.minus)
            throw new Error('Square root of negative number in dyadicMachine');
        const P = Math.min(Math.max(precisionBits, 0), 30);
        const shift = 2 * P - drA.precision;
        const scaledTarget = shift >= 0
            ? BigInt(drA.numerator) << BigInt(shift)
            : BigInt(drA.numerator) >> BigInt(-shift);
        if (scaledTarget <= 0n)
            return this.root();
        let x0 = scaledTarget / 2n;
        if (x0 === 0n)
            x0 = 1n;
        let x1 = (x0 + scaledTarget / x0) / 2n;
        while (x1 < x0) {
            x0 = x1;
            x1 = (x0 + scaledTarget / x0) / 2n;
        }
        return this.fromBigIntFraction(x0, P);
    }
    shift(a, k) {
        const drA = this.toDR(a);
        return this.fromDR(DR.shift(drA, k));
    }
    abs(a) {
        const drA = this.toDR(a);
        if (drA.sign === WU.minus) {
            return this.fromDR(DR.negate(drA));
        }
        return this.fromDR(drA);
    }
    compare(a, b) {
        return DR.compare(this.toDR(a), this.toDR(b));
    }
    eq(a, b) {
        return this.compare(a, b) === 0;
    }
    lt(a, b) {
        return this.compare(a, b) === -1;
    }
    gt(a, b) {
        return this.compare(a, b) === 1;
    }
    pow2(k) {
        if (k >= 0) {
            const dr = new DR(undefined, WU.plus, Math.pow(2, k), 0);
            return this.fromDR(dr);
        }
        else {
            const dr = new DR(undefined, WU.plus, 1, -k);
            return this.fromDR(dr);
        }
    }
    // --- Nonstandard Transcendental Engine (Euler Compounding) ---
    /**
     * Calculates the natural exponential exp(x) via Euler hyperfinite compounding:
     *   exp_k(x) = (1 + x / 2^k)^(2^k)
     * using exclusively dyadic shifts, additions, and k repeated squarings.
     */
    exp(xInput, k = 12, precisionBits = 32) {
        return this.expWithTrace(xInput, k, precisionBits).result;
    }
    /**
     * Calculates exp(x) and returns the full step-by-step trace of squarings.
     */
    expWithTrace(xInput, k = 12, precisionBits = 32) {
        const inputNode = this.node(xInput);
        const dr = inputNode.value;
        const P = precisionBits;
        // Handle x = 0: exp(0) = 1
        if (!dr.sign || dr.numerator === 0) {
            const oneNode = this.fromInt(1);
            return {
                input: inputNode,
                k,
                stepSize: this.pow2(-k),
                delta: this.root(),
                base: oneNode,
                steps: [{ step: 0, node: oneNode, description: 'Base u₀ = 1' }],
                result: oneNode,
            };
        }
        const stepSizeNode = this.pow2(-k);
        const deltaNode = this.shift(inputNode, -k);
        const baseNode = this.add(1, deltaNode);
        const one = 1n << BigInt(P);
        const xPrec = dr.precision;
        const xNum = BigInt(dr.numerator);
        const deltaShift = P - xPrec - k;
        let deltaInt = deltaShift >= 0 ? (xNum << BigInt(deltaShift)) : (xNum >> BigInt(-deltaShift));
        if (dr.sign === WU.minus) {
            deltaInt = -deltaInt;
        }
        let u = one + deltaInt;
        const steps = [
            {
                step: 0,
                node: this.fromBigIntFraction(u, P),
                description: `Step 0 (Base u₀ = 1 + x/2^${k})`,
            },
        ];
        for (let i = 1; i <= k; i++) {
            u = (u * u) >> BigInt(P);
            const stepNode = this.fromBigIntFraction(u, P);
            steps.push({
                step: i,
                node: stepNode,
                description: `Squaring ${i}/${k}: u_${i} = (u_${i - 1})²`,
            });
        }
        const resultNode = steps[steps.length - 1].node;
        return {
            input: inputNode,
            k,
            stepSize: stepSizeNode,
            delta: deltaNode,
            base: baseNode,
            steps,
            result: resultNode,
        };
    }
    // Elementary rotation angles in radians for CORDIC: arctan(2^-i)
    static CORDIC_ANGLES = [
        0.7853981633974483, 0.4636476090008061, 0.24497866312686414, 0.12435499454676144,
        0.06241880999595735, 0.031239833430268277, 0.015623728620476831, 0.007812116210182813,
        0.0039062301319669718, 0.0019531225164788188, 0.0009765621895593195, 0.0004882812111948983,
        0.00024414062014936177, 0.00012207031189367021, 0.00006103515617420877, 0.00003051757811552617
    ];
    /**
     * Evaluates (cos θ, sin θ) via discrete CORDIC rotor rotation in (𝔻, +, ·).
     * Operates purely via power-of-two dyadic bit-shifts and additions; no Math.cos / Math.sin.
     */
    cordicSinCos(thetaInput, iterations = 16) {
        const dr = this.toDR(thetaInput);
        let thetaVal = dr.toFloat();
        const PI = 3.141592653589793;
        const TWO_PI = 6.283185307179586;
        // Range reduction to [-PI, PI]
        while (thetaVal > PI)
            thetaVal -= TWO_PI;
        while (thetaVal < -PI)
            thetaVal += TWO_PI;
        // Further reduce to [-PI/2, PI/2] by symmetry
        let negate = false;
        if (thetaVal > PI / 2) {
            thetaVal -= PI;
            negate = true;
        }
        else if (thetaVal < -PI / 2) {
            thetaVal += PI;
            negate = true;
        }
        // Fixed-point scaling with P = 16 bits
        const P = 16;
        // Initial x is CORDIC scale factor K ≈ 0.607252935 * 2^16 = 39797
        let x = 39797;
        let y = 0;
        let z = Math.round(thetaVal * (1 << P));
        const iters = Math.min(iterations, DyadicMachineClass.CORDIC_ANGLES.length);
        for (let i = 0; i < iters; i++) {
            const angleFixed = Math.round(DyadicMachineClass.CORDIC_ANGLES[i] * (1 << P));
            const d = z >= 0 ? 1 : -1;
            const nextX = x - d * (y >> i);
            const nextY = y + d * (x >> i);
            z = z - d * angleFixed;
            x = nextX;
            y = nextY;
        }
        if (negate) {
            x = -x;
            y = -y;
        }
        const cosNode = this.fromBigIntFraction(BigInt(x), P);
        const sinNode = this.fromBigIntFraction(BigInt(y), P);
        return { cos: cosNode, sin: sinNode };
    }
    /**
     * Discrete kinematic update in the ring (𝔻, +, ·):
     *   v = v₀ - g·t
     *   s = v₀·t - (1/2)·g·t²
     */
    kinematicStep(v0, g, t) {
        const v0Node = this.node(v0);
        const gNode = this.node(g);
        const tNode = this.node(t);
        const gt = this.mul(gNode, tNode);
        const v = this.sub(v0Node, gt);
        const halfG = this.shift(gNode, -1);
        const t2 = this.mul(tNode, tNode);
        const v0t = this.mul(v0Node, tNode);
        const halfGt2 = this.mul(halfG, t2);
        const s = this.sub(v0t, halfGt2);
        return { v, s };
    }
    fromBigIntFraction(uBig, P) {
        if (uBig === 0n)
            return this.root();
        const sign = uBig < 0n ? WU.minus : WU.plus;
        let absU = uBig < 0n ? -uBig : uBig;
        let finalPrec = P;
        const bitLen = absU.toString(2).length;
        if (bitLen > 52) {
            const shift = bitLen - 52;
            absU = absU >> BigInt(shift);
            finalPrec -= shift;
        }
        const dr = new DR(undefined, sign, Number(absU), Math.max(0, finalPrec)).reduce();
        return this.fromDR(dr);
    }
    // --- Min / Max Utilities ---
    min(nodes) {
        if (nodes.length === 0)
            throw new Error('Cannot find minimum of empty node list');
        let m = this.node(nodes[0]);
        for (let i = 1; i < nodes.length; i++) {
            const cand = this.node(nodes[i]);
            if (this.lt(cand, m))
                m = cand;
        }
        return m;
    }
    max(nodes) {
        if (nodes.length === 0)
            throw new Error('Cannot find maximum of empty node list');
        let m = this.node(nodes[0]);
        for (let i = 1; i < nodes.length; i++) {
            const cand = this.node(nodes[i]);
            if (this.gt(cand, m))
                m = cand;
        }
        return m;
    }
    // --- Conway Tree-Inductive Arithmetic ---
    conwayAddMemo = new Map();
    /**
     * Decomposes a tree node into its simpler ancestral options:
     * All proper prefixes of the sign path born on earlier days,
     * partitioned into leftOptions (< node) and rightOptions (> node).
     */
    simplerOptions(nodeInput) {
        const node = this.node(nodeInput);
        const leftOptions = [];
        const rightOptions = [];
        const p = node.path;
        for (let i = 0; i < p.length; i++) {
            const prefix = this.fromPath(p.slice(0, i));
            if (this.lt(prefix, node)) {
                leftOptions.push(prefix);
            }
            else if (this.gt(prefix, node)) {
                rightOptions.push(prefix);
            }
        }
        return { leftOptions, rightOptions };
    }
    /**
     * The Conway Cut: Finds the earliest-born (shortest path) node strictly between bounds.
     * Walks down the binary tree from root [] (0), branching right '+' when <= leftBound,
     * or branching left '-' when >= rightBound.
     */
    cut(leftBound, rightBound) {
        const lNode = leftBound !== null && leftBound !== undefined ? this.node(leftBound) : null;
        const rNode = rightBound !== null && rightBound !== undefined ? this.node(rightBound) : null;
        let candidate = this.root();
        let maxSteps = 128; // Safety ceiling
        while (maxSteps-- > 0) {
            if (lNode && this.compare(candidate, lNode) <= 0) {
                candidate = this.right(candidate);
            }
            else if (rNode && this.compare(candidate, rNode) >= 0) {
                candidate = this.left(candidate);
            }
            else {
                break; // Strictly between bounds: lNode < candidate < rNode
            }
        }
        this.systemLedger.cutCount++;
        return candidate;
    }
    /**
     * Conway Inductive Addition directly on tree sign paths:
     *   X + Y = { X^L + Y, X + Y^L | X^R + Y, X + Y^R }
     * Evaluates the sum via recursive options reduction and the bounding Conway cut.
     */
    conwayAdd(xInput, yInput) {
        this.systemLedger.addCount++;
        const X = this.node(xInput);
        const Y = this.node(yInput);
        const key = `${X.path}|${Y.path}`;
        if (this.conwayAddMemo.has(key)) {
            return this.conwayAddMemo.get(key);
        }
        const { leftOptions: XL, rightOptions: XR } = this.simplerOptions(X);
        const { leftOptions: YL, rightOptions: YR } = this.simplerOptions(Y);
        const leftResults = [];
        const rightResults = [];
        // Cross-recursive option combinations
        for (const xL of XL)
            leftResults.push(this.conwayAdd(xL, Y));
        for (const yL of YL)
            leftResults.push(this.conwayAdd(X, yL));
        for (const xR of XR)
            rightResults.push(this.conwayAdd(xR, Y));
        for (const yR of YR)
            rightResults.push(this.conwayAdd(X, yR));
        const maxLeft = leftResults.length > 0 ? this.max(leftResults) : null;
        const minRight = rightResults.length > 0 ? this.min(rightResults) : null;
        const result = this.cut(maxLeft, minRight);
        this.conwayAddMemo.set(key, result);
        return result;
    }
    /**
     * Conway Negation: Inverts every sign character (+ <-> -),
     * reflecting the node across the tree root.
     */
    conwayNeg(xInput) {
        const X = this.node(xInput);
        let invPath = '';
        for (const ch of X.path) {
            invPath += ch === '+' ? '-' : '+';
        }
        return this.fromPath(invPath);
    }
    /**
     * Conway Subtraction: X - Y = X + (-Y).
     */
    conwaySub(xInput, yInput) {
        return this.conwayAdd(xInput, this.conwayNeg(yInput));
    }
    conwayMulMemo = new Map();
    /**
     * Conway Inductive Multiplication:
     *   X · Y = { Xᴸ·Y + X·Yᴸ - Xᴸ·Yᴸ, Xᴿ·Y + X·Yᴿ - Xᴿ·Yᴿ | Xᴸ·Y + X·Yᴿ - Xᴸ·Yᴿ, Xᴿ·Y + X·Yᴸ - Xᴿ·Yᴸ }
     */
    conwayMul(xInput, yInput) {
        this.systemLedger.mulCount++;
        const X = this.node(xInput);
        const Y = this.node(yInput);
        const key = `${X.path}|${Y.path}`;
        if (this.conwayMulMemo.has(key))
            return this.conwayMulMemo.get(key);
        const { leftOptions: XL, rightOptions: XR } = this.simplerOptions(X);
        const { leftOptions: YL, rightOptions: YR } = this.simplerOptions(Y);
        const leftResults = [];
        const rightResults = [];
        // Left options: (xL*Y + X*yL - xL*yL) and (xR*Y + X*yR - xR*yR)
        for (const xL of XL) {
            for (const yL of YL) {
                const sum = this.conwayAdd(this.conwayMul(xL, Y), this.conwayMul(X, yL));
                leftResults.push(this.conwaySub(sum, this.conwayMul(xL, yL)));
            }
        }
        for (const xR of XR) {
            for (const yR of YR) {
                const sum = this.conwayAdd(this.conwayMul(xR, Y), this.conwayMul(X, yR));
                leftResults.push(this.conwaySub(sum, this.conwayMul(xR, yR)));
            }
        }
        // Right options: (xL*Y + X*yR - xL*yR) and (xR*Y + X*yL - xR*yL)
        for (const xL of XL) {
            for (const yR of YR) {
                const sum = this.conwayAdd(this.conwayMul(xL, Y), this.conwayMul(X, yR));
                rightResults.push(this.conwaySub(sum, this.conwayMul(xL, yR)));
            }
        }
        for (const xR of XR) {
            for (const yL of YL) {
                const sum = this.conwayAdd(this.conwayMul(xR, Y), this.conwayMul(X, yL));
                rightResults.push(this.conwaySub(sum, this.conwayMul(xR, yL)));
            }
        }
        const maxLeft = leftResults.length > 0 ? this.max(leftResults) : null;
        const minRight = rightResults.length > 0 ? this.min(rightResults) : null;
        const result = this.cut(maxLeft, minRight);
        this.conwayMulMemo.set(key, result);
        return result;
    }
    conwayLessEq(xInput, yInput) {
        const X = this.node(xInput);
        const Y = this.node(yInput);
        const { leftOptions: XL } = this.simplerOptions(X);
        const { rightOptions: YR } = this.simplerOptions(Y);
        for (const xL of XL) {
            if (this.conwayLessEq(Y, xL))
                return false;
        }
        for (const yR of YR) {
            if (this.conwayLessEq(yR, X))
                return false;
        }
        return true;
    }
    countConwayAdd(xInput, yInput, depth = 1, stats = { calls: 0, maxDepth: 0, cuts: 0 }, maxCalls = 2_000_000) {
        const t0 = depth === 1 ? performance.now() : 0;
        stats.calls++;
        if (depth > stats.maxDepth)
            stats.maxDepth = depth;
        stats.cuts++;
        if (stats.calls >= maxCalls) {
            stats.bailed = true;
            if (depth === 1)
                stats.elapsedMs = performance.now() - t0;
            return stats;
        }
        const X = this.node(xInput);
        const Y = this.node(yInput);
        const { leftOptions: XL, rightOptions: XR } = this.simplerOptions(X);
        const { leftOptions: YL, rightOptions: YR } = this.simplerOptions(Y);
        for (const xL of XL) {
            this.countConwayAdd(xL, Y, depth + 1, stats, maxCalls);
            if (stats.bailed) {
                if (depth === 1)
                    stats.elapsedMs = performance.now() - t0;
                return stats;
            }
        }
        for (const yL of YL) {
            this.countConwayAdd(X, yL, depth + 1, stats, maxCalls);
            if (stats.bailed) {
                if (depth === 1)
                    stats.elapsedMs = performance.now() - t0;
                return stats;
            }
        }
        for (const xR of XR) {
            this.countConwayAdd(xR, Y, depth + 1, stats, maxCalls);
            if (stats.bailed) {
                if (depth === 1)
                    stats.elapsedMs = performance.now() - t0;
                return stats;
            }
        }
        for (const yR of YR) {
            this.countConwayAdd(X, yR, depth + 1, stats, maxCalls);
            if (stats.bailed) {
                if (depth === 1)
                    stats.elapsedMs = performance.now() - t0;
                return stats;
            }
        }
        if (depth === 1)
            stats.elapsedMs = performance.now() - t0;
        return stats;
    }
    countConwayMul(xInput, yInput, depth = 1, stats = { calls: 0, maxDepth: 0, cuts: 0, addCalls: 0 }, maxCalls = 2_000_000) {
        const t0 = depth === 1 ? performance.now() : 0;
        stats.calls++;
        if (depth > stats.maxDepth)
            stats.maxDepth = depth;
        stats.cuts++;
        if (stats.calls >= maxCalls) {
            stats.bailed = true;
            if (depth === 1)
                stats.elapsedMs = performance.now() - t0;
            return stats;
        }
        const X = this.node(xInput);
        const Y = this.node(yInput);
        const { leftOptions: XL, rightOptions: XR } = this.simplerOptions(X);
        const { leftOptions: YL, rightOptions: YR } = this.simplerOptions(Y);
        for (const xL of XL) {
            for (const yL of YL) {
                stats.addCalls = (stats.addCalls || 0) + 2;
                this.countConwayMul(xL, Y, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(X, yL, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(xL, yL, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
            }
        }
        for (const xR of XR) {
            for (const yR of YR) {
                stats.addCalls = (stats.addCalls || 0) + 2;
                this.countConwayMul(xR, Y, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(X, yR, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(xR, yR, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
            }
        }
        for (const xL of XL) {
            for (const yR of YR) {
                stats.addCalls = (stats.addCalls || 0) + 2;
                this.countConwayMul(xL, Y, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(X, yR, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(xL, yR, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
            }
        }
        for (const xR of XR) {
            for (const yL of YL) {
                stats.addCalls = (stats.addCalls || 0) + 2;
                this.countConwayMul(xR, Y, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(X, yL, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
                this.countConwayMul(xR, yL, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
            }
        }
        if (depth === 1)
            stats.elapsedMs = performance.now() - t0;
        return stats;
    }
    countConwayLessEq(xInput, yInput, depth = 1, stats = { calls: 0, maxDepth: 0, cuts: 0 }, maxCalls = 2_000_000) {
        const t0 = depth === 1 ? performance.now() : 0;
        stats.calls++;
        if (depth > stats.maxDepth)
            stats.maxDepth = depth;
        if (stats.calls >= maxCalls) {
            stats.bailed = true;
            if (depth === 1)
                stats.elapsedMs = performance.now() - t0;
            return stats;
        }
        const X = this.node(xInput);
        const Y = this.node(yInput);
        const { leftOptions: XL } = this.simplerOptions(X);
        const { rightOptions: YR } = this.simplerOptions(Y);
        for (const xL of XL) {
            if (this.compare(Y, xL) <= 0) {
                this.countConwayLessEq(Y, xL, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
            }
        }
        for (const yR of YR) {
            if (this.compare(yR, X) <= 0) {
                this.countConwayLessEq(yR, X, depth + 1, stats, maxCalls);
                if (stats.bailed) {
                    if (depth === 1)
                        stats.elapsedMs = performance.now() - t0;
                    return stats;
                }
            }
        }
        if (depth === 1)
            stats.elapsedMs = performance.now() - t0;
        return stats;
    }
}
/**
 * Singleton instance of the Dyadic Arithmetic Machine.
 */
export const dyadicMachine = new DyadicMachineClass();
