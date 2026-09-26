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
    toString() {
        const pStr = this.path === '' ? '[]' : `[${this.path}]`;
        return `Node(${pStr} ⇔ ${this.format()}, Day ${this.birthday})`;
    }
}
/**
 * Concrete implementation of the Dyadic Arithmetic Machine.
 */
export class DyadicMachineClass {
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
     * Universal node resolver from string path, DR, number, or existing node.
     */
    node(input) {
        if (typeof input === 'number') {
            return this.fromInt(input);
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
        if (typeof input === 'number') {
            return this.fromInt(input).value;
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
}
/**
 * Singleton instance of the Dyadic Arithmetic Machine.
 */
export const dyadicMachine = new DyadicMachineClass();
