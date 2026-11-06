/**
 * LaurentDyad & Nonstandard Dyadic Domain (𝔻_ω ≡ 𝔻[ω, 1/ω])
 * Middle Way Mathematics
 *
 * Implements the computable, zero-axiom nonstandard dyadic polynomial ring certified
 * in MiddleWay.DyadicRing (Section 10).
 *
 * Structure:
 *   P(ω) = ∑ c_k · ω^k,   c_k ∈ 𝔻,  k ∈ ℤ
 *
 * Graded Scale:
 *   - k > 0 : Transfinite overflow scale (powers of ω).
 *   - k = 0 : Standard finite dyadic real part (shadow / st).
 *   - k < 0 : Infinitesimal underflow halo dust (powers of dx = 1/ω).
 *
 * Core Algebraic Rule:
 *   ω · (1/ω) = ω^1 · ω^(-1) = ω^0 = 1
 */

import { DR } from "./dyadicRationals.js";
import { WU } from "./exputils.js";
import { CalculationResult } from "./directedEquality.js";

export interface LaurentTerm {
  exp: number; // Exponent of ω (e.g. +1 for ω, 0 for st, -1 for dx)
  coeff: DR;   // Dyadic rational coefficient
}

export class LaurentDyad {
  terms: LaurentTerm[];

  constructor(terms: LaurentTerm[] = []) {
    this.terms = terms;
  }

  // Canonical Elements
  static zero(): LaurentDyad {
    return new LaurentDyad([]);
  }

  static one(): LaurentDyad {
    return new LaurentDyad([{ exp: 0, coeff: new DR(undefined, WU.plus, 1, 0) }]);
  }

  static omega(): LaurentDyad {
    return new LaurentDyad([{ exp: 1, coeff: new DR(undefined, WU.plus, 1, 0) }]);
  }

  static dx(): LaurentDyad {
    return new LaurentDyad([{ exp: -1, coeff: new DR(undefined, WU.plus, 1, 0) }]);
  }

  static fromDyad(d: DR): LaurentDyad {
    if (!d.sign || d.numerator === 0) return LaurentDyad.zero();
    return new LaurentDyad([{ exp: 0, coeff: d }]);
  }

  static fromNumber(val: number, exp: number = 0, precBits: number = 16): LaurentDyad {
    if (val === 0 || isNaN(val)) return LaurentDyad.zero();
    const sign = val < 0 ? WU.minus : WU.plus;
    const absVal = Math.abs(val);
    const P = Math.min(Math.max(precBits, 0), 30);
    const scale = Math.pow(2, P);
    const num = Math.round(absVal * scale);
    const dr = new DR(undefined, sign, num, P).reduce();
    return new LaurentDyad([{ exp, coeff: dr }]);
  }

  /**
   * Retrieves or sums the dyadic coefficient at power k (ω^k).
   */
  coeffAt(k: number): DR {
    let sum = new DR();
    for (const t of this.terms) {
      if (t.exp === k) {
        sum = DR.add(sum, t.coeff);
      }
    }
    return sum;
  }

  /**
   * Standard part / Shadow map (st): Extracts the k = 0 coordinate.
   */
  st(): DR {
    return this.coeffAt(0);
  }

  /**
   * Infinitesimal halo (terms with k < 0: powers of dx = 1/ω).
   */
  halo(): LaurentDyad {
    return new LaurentDyad(this.terms.filter(t => t.exp < 0)).normalize();
  }

  /**
   * Transfinite overflow part (terms with k > 0: powers of ω).
   */
  transfinite(): LaurentDyad {
    return new LaurentDyad(this.terms.filter(t => t.exp > 0)).normalize();
  }

  /**
   * Classification predicates
   */
  isFinite(): boolean {
    return this.terms.every(t => t.exp <= 0);
  }

  isInfinitesimal(): boolean {
    return this.terms.every(t => t.exp < 0);
  }

  isStandard(): boolean {
    return this.terms.every(t => t.exp === 0);
  }

  isZero(): boolean {
    return this.normalize().terms.length === 0;
  }

  /**
   * Normalization: combines matching powers of ω and sorts descending (highest power first).
   */
  normalize(): LaurentDyad {
    const map = new Map<number, DR>();
    for (const t of this.terms) {
      const existing = map.get(t.exp);
      if (existing) {
        map.set(t.exp, DR.add(existing, t.coeff));
      } else {
        map.set(t.exp, t.coeff);
      }
    }
    const result: LaurentTerm[] = [];
    for (const [exp, coeff] of map.entries()) {
      coeff.reduce();
      if (coeff.sign && coeff.numerator !== 0) {
        result.push({ exp, coeff });
      }
    }
    result.sort((a, b) => b.exp - a.exp);
    return new LaurentDyad(result);
  }

  /**
   * Algebraic Addition
   */
  add(other: LaurentDyad): LaurentDyad {
    return new LaurentDyad([...this.terms, ...other.terms]).normalize();
  }

  /**
   * Algebraic Negation
   */
  negate(): LaurentDyad {
    return new LaurentDyad(this.terms.map(t => ({ exp: t.exp, coeff: DR.negate(t.coeff) })));
  }

  /**
   * Algebraic Subtraction
   */
  sub(other: LaurentDyad): LaurentDyad {
    return this.add(other.negate());
  }

  /**
   * Algebraic Multiplication: discrete Cauchy convolution.
   * Core rule: ω^a · ω^b = ω^(a + b)
   * specifically, ω^1 · ω^(-1) = ω^0 = 1.
   */
  mul(other: LaurentDyad): LaurentDyad {
    const result: LaurentTerm[] = [];
    for (const t1 of this.terms) {
      for (const t2 of other.terms) {
        const productCoeff = DR.multiply(t1.coeff, t2.coeff);
        result.push({
          exp: t1.exp + t2.exp,
          coeff: productCoeff
        });
      }
    }
    return new LaurentDyad(result).normalize();
  }

  /**
   * Scalar scale
   */
  scale(factor: DR | number): LaurentDyad {
    const drFactor = typeof factor === "number" ? LaurentDyad.fromNumber(factor).st() : factor;
    return new LaurentDyad(this.terms.map(t => ({
      exp: t.exp,
      coeff: DR.multiply(t.coeff, drFactor)
    }))).normalize();
  }

  /**
   * Nonstandard difference quotient for a discrete step:
   * D(f) := st(ω · (f(x + dx) - f(x)))
   */
  static derivativeQuotient(fx: LaurentDyad, fxPlusDx: LaurentDyad): DR {
    const delta = fxPlusDx.sub(fx);
    const scaled = LaurentDyad.omega().mul(delta);
    return scaled.st();
  }

  /**
   * Formats a single term into human-readable notation.
   * e.g. exp=1 -> "3·ω", exp=-1 -> "1/4·dx", exp=-2 -> "1/8·dx²"
   */
  static formatTerm(t: LaurentTerm): string {
    const coeffStr = t.coeff.format();
    if (t.exp === 0) {
      return coeffStr;
    }
    let scaleSymbol = "";
    if (t.exp === 1) {
      scaleSymbol = "ω";
    } else if (t.exp > 1) {
      scaleSymbol = `ω^${t.exp}`;
    } else if (t.exp === -1) {
      scaleSymbol = "dx";
    } else {
      scaleSymbol = `dx^${Math.abs(t.exp)}`;
    }

    if (coeffStr === "1") return scaleSymbol;
    if (coeffStr === "-1") return `-${scaleSymbol}`;
    return `${coeffStr}·${scaleSymbol}`;
  }

  /**
   * Formats the entire polynomial into a clean string.
   */
  format(): string {
    const norm = this.normalize();
    if (norm.terms.length === 0) return "0";
    return norm.terms.map((t, idx) => {
      const formatted = LaurentDyad.formatTerm(t);
      if (idx === 0) return formatted;
      if (formatted.startsWith("-")) {
        return `- ${formatted.slice(1)}`;
      }
      return `+ ${formatted}`;
    }).join(" ");
  }

  /**
   * Converts to unified CalculationResult.
   */
  toCalculationResult(notes?: string): CalculationResult {
    const norm = this.normalize();
    const stVal = norm.st();
    const haloVal = norm.halo();
    const transVal = norm.transfinite();

    const hardStr = stVal.format();
    const dustStr = haloVal.isZero() ? "0 (Zero Dust)" : haloVal.format();
    const transStr = transVal.isZero() ? undefined : transVal.format();

    return {
      resultValue: stVal.toFloat(),
      displayValue: norm.format(),
      displayResult: norm.format(),
      hardPart: hardStr,
      dustPart: dustStr,
      transfinitePart: transStr,
      isHard: haloVal.isZero(),
      domainBadge: "𝔻_ω",
      notes: notes || (transStr ? `Transfinite overflow: ${transStr}` : undefined)
    };
  }
}
