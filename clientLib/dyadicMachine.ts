import { DR } from './dyadicRationals.js';
import { WU } from './exputils.js';

export { DR, WU };

/**
 * A node on the 2-successor Conway number tree.
 * A node is fundamentally its sign string (the sequence of pluses and minuses from the root).
 * From this string, its Conway birthday (path.length) and corresponding dyadic rational
 * number (DR) are constructed on demand.
 */
export interface IDyadicNode {
  /**
   * The sign sequence path from the root.
   * Root: "" (empty string)
   * '-': branch left (negative direction)
   * '+': branch right (positive direction)
   */
  readonly path: string;

  /**
   * Generation depth / Conway birthday = path.length.
   */
  readonly birthday: number;

  /**
   * The corresponding dyadic rational number m / 2^k constructed from the path string.
   */
  readonly value: DR;

  /**
   * Constructs the dyadic rational (m / 2^k) from the path string.
   */
  toDR(): DR;

  /**
   * Formatted string representation (e.g. "1/2", "3/4", "-1&1/2", "0").
   */
  format(): string;

  /**
   * Detailed string representation.
   */
  toString(): string;
}

/**
 * Individual squaring step in Euler hyperfinite compounding.
 */
export interface IEulerStep {
  readonly step: number;         // 0 = base u0, 1..k = squaring steps
  readonly node: IDyadicNode;    // dyadic node value at this step
  readonly description: string;  // e.g. "Step 0 (Base u₀ = 1 + x/2¹²)" or "Squaring 1: u₁ = u₀²"
}

/**
 * Complete trace of Euler hyperfinite compounding: exp(x) = (1 + x/2^k)^(2^k).
 */
export interface IEulerCompoundingTrace {
  readonly input: IDyadicNode;   // original input x
  readonly k: number;            // compounding resolution (N = 2^k slices)
  readonly stepSize: IDyadicNode;// dx = 1 / 2^k
  readonly delta: IDyadicNode;   // delta = x / 2^k
  readonly base: IDyadicNode;    // u0 = 1 + delta
  readonly steps: IEulerStep[];  // sequence of squarings u0 -> u1 -> ... -> uk
  readonly result: IDyadicNode;  // final result uk
}

/**
 * Implementation of IDyadicNode where a node is defined purely by its path string.
 * Birthday and the corresponding dyadic rational are constructed from that string.
 */
export class DyadicNode implements IDyadicNode {
  readonly path: string;

  constructor(path: string, _legacyDR?: DR) {
    this.path = (path || '').trim();
  }

  /**
   * Generation depth / Conway birthday constructed from path length:
   * Root "" has birthday 0; "-" and "+" have birthday 1, etc.
   */
  get birthday(): number {
    return this.path.length;
  }

  /**
   * The corresponding dyadic rational constructed on demand from the path string.
   */
  get value(): DR {
    return this.toDR();
  }

  /**
   * Constructs the dyadic rational (m / 2^k) from the path string.
   */
  toDR(): DR {
    return new DR(this.path).reduce();
  }

  format(): string {
    return this.toDR().format();
  }

  toString(): string {
    const pStr = this.path === '' ? '[]' : `[${this.path}]`;
    return `Node(${pStr} ⇔ ${this.format()}, Day ${this.birthday})`;
  }
}

/**
 * Core Dyadic Arithmetic Machine Interface.
 * Operates purely over the Ring of Dyadic Rationals (𝔻, +, ·)
 * Grounded in the 2-successor Conway number tree.
 *
 * No external mathematical libraries (Math.sin, Math.exp, etc.) are used.
 */
export interface IDyadicMachine {
  // --- Dual-Identifier Construction ---
  root(): IDyadicNode;
  fromPath(path: string): IDyadicNode;
  fromDR(dr: DR): IDyadicNode;
  fromInt(n: number): IDyadicNode;
  fromFraction(num: number, precision?: number, sign?: '+' | '-'): IDyadicNode;
  node(input: string | DR | IDyadicNode | number): IDyadicNode;

  // --- Tree Navigation (2-Successor Functions) ---
  left(node: IDyadicNode | string): IDyadicNode;   // Branch '-'
  right(node: IDyadicNode | string): IDyadicNode;  // Branch '+'
  parent(node: IDyadicNode | string): IDyadicNode | null;

  // --- Ring Arithmetic (𝔻, +, ·) ---
  add(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): IDyadicNode;
  sub(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): IDyadicNode;
  neg(a: IDyadicNode | DR | number): IDyadicNode;
  mul(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): IDyadicNode;

  // Power-of-two scaling / bit shifting: shift(a, k) = a * 2^k
  shift(a: IDyadicNode | DR | number, k: number): IDyadicNode;

  // Ordering & Comparison
  abs(a: IDyadicNode | DR | number): IDyadicNode;
  compare(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): -1 | 0 | 1;
  eq(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): boolean;
  lt(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): boolean;
  gt(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): boolean;

  // Convenience power of two
  pow2(k: number): IDyadicNode;

  // --- Nonstandard Transcendental Engine (Euler Compounding) ---
  exp(x: IDyadicNode | DR | number | string, k?: number, precisionBits?: number): IDyadicNode;
  expWithTrace(x: IDyadicNode | DR | number | string, k?: number, precisionBits?: number): IEulerCompoundingTrace;
}

/**
 * Concrete implementation of the Dyadic Arithmetic Machine.
 */
export class DyadicMachineClass implements IDyadicMachine {
  /**
   * Root node (Day 0): path "" (empty string).
   */
  root(): IDyadicNode {
    return new DyadicNode('');
  }

  /**
   * Resolves a sign path of pluses and minuses to a node.
   * Path "" yields the root (0).
   */
  fromPath(path: string): IDyadicNode {
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
  fromDR(dr: DR): IDyadicNode {
    const reduced = new DR(undefined, dr.sign, dr.numerator, dr.precision).reduce();
    const path = reduced.toSignExpansion();
    return new DyadicNode(path);
  }

  /**
   * Constructs a node from an integer.
   */
  fromInt(n: number): IDyadicNode {
    if (n === 0) return this.root();
    const sign = n < 0 ? WU.minus : WU.plus;
    const absN = Math.abs(n);
    const dr = new DR(undefined, sign, absN, 0);
    return this.fromDR(dr);
  }

  /**
   * Constructs a node from a dyadic fraction: sign * (num / 2^precision).
   */
  fromFraction(num: number, precision: number = 0, sign: '+' | '-' = '+'): IDyadicNode {
    if (num === 0) return this.root();
    const s = sign === '-' ? WU.minus : WU.plus;
    const dr = new DR(undefined, s, Math.abs(num), precision).reduce();
    return this.fromDR(dr);
  }

  /**
   * Universal node resolver from string path, DR, number, or existing node.
   */
  node(input: string | DR | IDyadicNode | number): IDyadicNode {
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

  private toDR(input: IDyadicNode | DR | number): DR {
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
  left(node: IDyadicNode | string): IDyadicNode {
    const path = typeof node === 'string' ? node : node.path;
    return new DyadicNode(path + WU.minus);
  }

  /**
   * Right child (branch '+', positive direction). Pure string concatenation.
   */
  right(node: IDyadicNode | string): IDyadicNode {
    const path = typeof node === 'string' ? node : node.path;
    return new DyadicNode(path + WU.plus);
  }

  /**
   * Parent node on the tree (drops the last sign). Returns null at root.
   */
  parent(node: IDyadicNode | string): IDyadicNode | null {
    const path = typeof node === 'string' ? node : node.path;
    if (path.length === 0) return null;
    return new DyadicNode(path.slice(0, -1));
  }

  // --- Ring Arithmetic ---

  add(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): IDyadicNode {
    const drA = this.toDR(a);
    const drB = this.toDR(b);
    return this.fromDR(DR.add(drA, drB));
  }

  sub(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): IDyadicNode {
    const drA = this.toDR(a);
    const drB = this.toDR(b);
    return this.fromDR(DR.sub(drA, drB));
  }

  neg(a: IDyadicNode | DR | number): IDyadicNode {
    const drA = this.toDR(a);
    return this.fromDR(DR.negate(drA));
  }

  mul(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): IDyadicNode {
    const drA = this.toDR(a);
    const drB = this.toDR(b);
    return this.fromDR(DR.multiply(drA, drB));
  }

  shift(a: IDyadicNode | DR | number, k: number): IDyadicNode {
    const drA = this.toDR(a);
    return this.fromDR(DR.shift(drA, k));
  }

  abs(a: IDyadicNode | DR | number): IDyadicNode {
    const drA = this.toDR(a);
    if (drA.sign === WU.minus) {
      return this.fromDR(DR.negate(drA));
    }
    return this.fromDR(drA);
  }

  compare(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): -1 | 0 | 1 {
    return DR.compare(this.toDR(a), this.toDR(b));
  }

  eq(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): boolean {
    return this.compare(a, b) === 0;
  }

  lt(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): boolean {
    return this.compare(a, b) === -1;
  }

  gt(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number): boolean {
    return this.compare(a, b) === 1;
  }

  pow2(k: number): IDyadicNode {
    if (k >= 0) {
      const dr = new DR(undefined, WU.plus, Math.pow(2, k), 0);
      return this.fromDR(dr);
    } else {
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
  exp(
    xInput: IDyadicNode | DR | number | string,
    k: number = 12,
    precisionBits: number = 32
  ): IDyadicNode {
    return this.expWithTrace(xInput, k, precisionBits).result;
  }

  /**
   * Calculates exp(x) and returns the full step-by-step trace of squarings.
   */
  expWithTrace(
    xInput: IDyadicNode | DR | number | string,
    k: number = 12,
    precisionBits: number = 32
  ): IEulerCompoundingTrace {
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
    let deltaInt =
      deltaShift >= 0 ? (xNum << BigInt(deltaShift)) : (xNum >> BigInt(-deltaShift));
    if (dr.sign === WU.minus) {
      deltaInt = -deltaInt;
    }

    let u = one + deltaInt;
    const steps: IEulerStep[] = [
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

  private fromBigIntFraction(uBig: bigint, P: number): IDyadicNode {
    if (uBig === 0n) return this.root();
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
export const dyadicMachine: IDyadicMachine = new DyadicMachineClass();
