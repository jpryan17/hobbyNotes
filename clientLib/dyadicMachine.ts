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
  fromFloat(val: number, precisionBits?: number): IDyadicNode;
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
  div(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number, precisionBits?: number): IDyadicNode;
  sqrt(a: IDyadicNode | DR | number, precisionBits?: number): IDyadicNode;

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

  // --- Min / Max Utilities ---
  min(nodes: (IDyadicNode | DR | number)[]): IDyadicNode;
  max(nodes: (IDyadicNode | DR | number)[]): IDyadicNode;

  // --- Conway Tree-Inductive Arithmetic ---
  simplerOptions(node: IDyadicNode | DR | number | string): {
    leftOptions: IDyadicNode[];
    rightOptions: IDyadicNode[];
  };
  cut(
    leftBound: IDyadicNode | DR | number | null,
    rightBound: IDyadicNode | DR | number | null
  ): IDyadicNode;
  conwayAdd(
    x: IDyadicNode | DR | number | string,
    y: IDyadicNode | DR | number | string
  ): IDyadicNode;
  conwayNeg(x: IDyadicNode | DR | number | string): IDyadicNode;
  conwaySub(
    x: IDyadicNode | DR | number | string,
    y: IDyadicNode | DR | number | string
  ): IDyadicNode;

  // --- Nonstandard Transcendental & Physical Engines ---
  exp(x: IDyadicNode | DR | number | string, k?: number, precisionBits?: number): IDyadicNode;
  expWithTrace(x: IDyadicNode | DR | number | string, k?: number, precisionBits?: number): IEulerCompoundingTrace;
  cordicSinCos(theta: IDyadicNode | DR | number, iterations?: number): { sin: IDyadicNode; cos: IDyadicNode };
  kinematicStep(v0: IDyadicNode | DR | number, g: IDyadicNode | DR | number, t: IDyadicNode | DR | number): { v: IDyadicNode; s: IDyadicNode };
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
   * Constructs a node from an IEEE float/decimal with specified dyadic bit precision.
   */
  fromFloat(val: number, precisionBits: number = 16): IDyadicNode {
    if (val === 0 || isNaN(val)) return this.root();
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
  node(input: string | DR | IDyadicNode | number): IDyadicNode {
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

  private toDR(input: IDyadicNode | DR | number): DR {
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

  div(a: IDyadicNode | DR | number, b: IDyadicNode | DR | number, precisionBits: number = 16): IDyadicNode {
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

  sqrt(a: IDyadicNode | DR | number, precisionBits: number = 16): IDyadicNode {
    const drA = this.toDR(a);
    if (!drA.sign || drA.numerator === 0) return this.root();
    if (drA.sign === WU.minus) throw new Error('Square root of negative number in dyadicMachine');
    const P = Math.min(Math.max(precisionBits, 0), 30);
    const shift = 2 * P - drA.precision;
    const scaledTarget =
      shift >= 0
        ? BigInt(drA.numerator) << BigInt(shift)
        : BigInt(drA.numerator) >> BigInt(-shift);
    if (scaledTarget <= 0n) return this.root();
    let x0 = scaledTarget / 2n;
    if (x0 === 0n) x0 = 1n;
    let x1 = (x0 + scaledTarget / x0) / 2n;
    while (x1 < x0) {
      x0 = x1;
      x1 = (x0 + scaledTarget / x0) / 2n;
    }
    return this.fromBigIntFraction(x0, P);
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

  // Elementary rotation angles in radians for CORDIC: arctan(2^-i)
  private static readonly CORDIC_ANGLES: number[] = [
    0.7853981633974483, 0.4636476090008061, 0.24497866312686414, 0.12435499454676144,
    0.06241880999595735, 0.031239833430268277, 0.015623728620476831, 0.007812116210182813,
    0.0039062301319669718, 0.0019531225164788188, 0.0009765621895593195, 0.0004882812111948983,
    0.00024414062014936177, 0.00012207031189367021, 0.00006103515617420877, 0.00003051757811552617
  ];

  /**
   * Evaluates (cos θ, sin θ) via discrete CORDIC rotor rotation in (𝔻, +, ·).
   * Operates purely via power-of-two dyadic bit-shifts and additions; no Math.cos / Math.sin.
   */
  cordicSinCos(
    thetaInput: IDyadicNode | DR | number,
    iterations: number = 16
  ): { sin: IDyadicNode; cos: IDyadicNode } {
    const dr = this.toDR(thetaInput);
    let thetaVal = (dr.numerator / Math.pow(2, dr.precision)) * (dr.sign === WU.minus ? -1 : 1);

    const PI = 3.141592653589793;
    const TWO_PI = 6.283185307179586;

    // Range reduction to [-PI, PI]
    while (thetaVal > PI) thetaVal -= TWO_PI;
    while (thetaVal < -PI) thetaVal += TWO_PI;

    // Further reduce to [-PI/2, PI/2] by symmetry
    let negate = false;
    if (thetaVal > PI / 2) {
      thetaVal -= PI;
      negate = true;
    } else if (thetaVal < -PI / 2) {
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
  kinematicStep(
    v0: IDyadicNode | DR | number,
    g: IDyadicNode | DR | number,
    t: IDyadicNode | DR | number
  ): { v: IDyadicNode; s: IDyadicNode } {
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

  // --- Min / Max Utilities ---

  min(nodes: (IDyadicNode | DR | number)[]): IDyadicNode {
    if (nodes.length === 0) throw new Error('Cannot find minimum of empty node list');
    let m = this.node(nodes[0]);
    for (let i = 1; i < nodes.length; i++) {
      const cand = this.node(nodes[i]);
      if (this.lt(cand, m)) m = cand;
    }
    return m;
  }

  max(nodes: (IDyadicNode | DR | number)[]): IDyadicNode {
    if (nodes.length === 0) throw new Error('Cannot find maximum of empty node list');
    let m = this.node(nodes[0]);
    for (let i = 1; i < nodes.length; i++) {
      const cand = this.node(nodes[i]);
      if (this.gt(cand, m)) m = cand;
    }
    return m;
  }

  // --- Conway Tree-Inductive Arithmetic ---

  private conwayAddMemo = new Map<string, IDyadicNode>();

  /**
   * Decomposes a tree node into its simpler ancestral options:
   * All proper prefixes of the sign path born on earlier days,
   * partitioned into leftOptions (< node) and rightOptions (> node).
   */
  simplerOptions(nodeInput: IDyadicNode | DR | number | string): {
    leftOptions: IDyadicNode[];
    rightOptions: IDyadicNode[];
  } {
    const node = this.node(nodeInput);
    const leftOptions: IDyadicNode[] = [];
    const rightOptions: IDyadicNode[] = [];
    const p = node.path;

    for (let i = 0; i < p.length; i++) {
      const prefix = this.fromPath(p.slice(0, i));
      if (this.lt(prefix, node)) {
        leftOptions.push(prefix);
      } else if (this.gt(prefix, node)) {
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
  cut(
    leftBound: IDyadicNode | DR | number | null,
    rightBound: IDyadicNode | DR | number | null
  ): IDyadicNode {
    const lNode = leftBound !== null && leftBound !== undefined ? this.node(leftBound) : null;
    const rNode = rightBound !== null && rightBound !== undefined ? this.node(rightBound) : null;

    let candidate = this.root();
    let maxSteps = 128; // Safety ceiling

    while (maxSteps-- > 0) {
      if (lNode && this.compare(candidate, lNode) <= 0) {
        candidate = this.right(candidate);
      } else if (rNode && this.compare(candidate, rNode) >= 0) {
        candidate = this.left(candidate);
      } else {
        break; // Strictly between bounds: lNode < candidate < rNode
      }
    }

    return candidate;
  }

  /**
   * Conway Inductive Addition directly on tree sign paths:
   *   X + Y = { X^L + Y, X + Y^L | X^R + Y, X + Y^R }
   * Evaluates the sum via recursive options reduction and the bounding Conway cut.
   */
  conwayAdd(
    xInput: IDyadicNode | DR | number | string,
    yInput: IDyadicNode | DR | number | string
  ): IDyadicNode {
    const X = this.node(xInput);
    const Y = this.node(yInput);

    const key = `${X.path}|${Y.path}`;
    if (this.conwayAddMemo.has(key)) {
      return this.conwayAddMemo.get(key)!;
    }

    const { leftOptions: XL, rightOptions: XR } = this.simplerOptions(X);
    const { leftOptions: YL, rightOptions: YR } = this.simplerOptions(Y);

    const leftResults: IDyadicNode[] = [];
    const rightResults: IDyadicNode[] = [];

    // Cross-recursive option combinations
    for (const xL of XL) leftResults.push(this.conwayAdd(xL, Y));
    for (const yL of YL) leftResults.push(this.conwayAdd(X, yL));

    for (const xR of XR) rightResults.push(this.conwayAdd(xR, Y));
    for (const yR of YR) rightResults.push(this.conwayAdd(X, yR));

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
  conwayNeg(xInput: IDyadicNode | DR | number | string): IDyadicNode {
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
  conwaySub(
    xInput: IDyadicNode | DR | number | string,
    yInput: IDyadicNode | DR | number | string
  ): IDyadicNode {
    return this.conwayAdd(xInput, this.conwayNeg(yInput));
  }
}

/**
 * Singleton instance of the Dyadic Arithmetic Machine.
 */
export const dyadicMachine: IDyadicMachine = new DyadicMachineClass();
