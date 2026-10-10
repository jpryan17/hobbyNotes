/**
 * DirectedEquality & Calculation Types — Middle Way Mathematics
 *
 * Unified data structures consolidating the calculation machinery between:
 * 1. EquationEvaluator (EED / EqDemo)
 * 2. FsCalculator (Formal Statement Calculators)
 *
 * Core Concept:
 * A Directed Equality (LHS ⟹ RHS) is an operational calculation stencil:
 * - LHS: Parameter slots (SlotParam[]) awaiting input bindings.
 * - Arrow: Evaluates according to an operational rule.
 * - RHS: Codomain value (CalculationResult) in ℝ_ω, 𝔻, ℂ_ω, ℕ, ℤ, or 𝔹.
 */

export type CalculationDomain = "ℝ" | "ℝ_ω" | "ℂ" | "ℂ_ω" | "ℕ" | "ℤ" | "𝔻" | "𝔹" | string;

/**
 * Option for discrete dropdown-style parameter slots.
 */
export interface SlotOption {
  value: number;
  label: string;
  description?: string;
}

/**
 * Unified parameter slot specification.
 * Represents an input variable in any calculation stencil.
 */
export interface SlotParam {
  name: string;
  symbol: string;
  domain: CalculationDomain;
  defaultValue: number | string | number[];
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
  options?: SlotOption[];
}

/**
 * Unified calculation evaluation result.
 * Supports both standard numerical outputs, dyadic Conway tree coordinates,
 * and nonstandard hyperreal nucleus-halo decompositions (st(x) + ε).
 */
export interface CalculationResult {
  /** Raw numeric, vector, or boolean value */
  resultValue?: number | number[] | boolean | string;

  /** Primary user-facing display string (EED) */
  displayValue?: string;

  /** Display string (FSD / FsCalculator) */
  displayResult?: string;

  /** Mathematical formula string representing the evaluation */
  formattedFormula?: string;

  /** Domain tag badge (e.g. "ℝ_ω", "𝔻", "𝔹") */
  domainBadge?: string;

  /** Standard part / nucleus: st(x) ∈ ℝ (or 𝔻) */
  hardPart?: string;

  /** Infinitesimal halo dust: ε = k·dx ∈ μ(0) */
  dustPart?: string;

  /** True if dustPart is zero or purely standard */
  isHard?: boolean;

  /** Conway tree path (e.g. "+-++") */
  dyadicPath?: string;

  /** Conway birthday level (Day n) */
  dyadicBirthday?: number;

  /** Formatted dyadic rational fraction "m / 2^k" */
  dyadicRational?: string;

  /** Optional pedagogical notes or annotations */
  notes?: string;

  /** Step-by-step evaluation details or breakdown strings */
  details?: string[];
}

/**
 * Unified specification for a Directed Equality calculation stencil.
 * Bridges EquationSpec (EED) and FsCalculationMode (FSD).
 */
export interface DirectedEqualitySpec {
  /** Unique stencil identifier */
  id: string;

  /** Human-readable title */
  title?: string;

  /** Direction label e.g. "(v₀, g, t) → v" (backward compatibility with FsCalculationMode) */
  label?: string;

  /** Linked Formal Statement catalog ID if certified */
  formalStatementId?: string;

  /** Governing Lean scaffold theorem key (e.g. "telescoping_ftc", "sin_halo") */
  governingTheorem?: string;

  /** Lean 4 machine-verified type signature */
  leanSignature?: string;

  /** Unicode formula on the left-hand side */
  lhsFormula?: string;

  /** Backward-compatibility alias for lhsFormula / description */
  formulaDescription?: string;

  /** Optional LaTeX string representation */
  latexFormula?: string;

  /** Target symbol on the right-hand side (e.g. "y", "v", "ΔF") */
  rhsSymbol?: string;

  /** Backward-compatibility alias for rhsSymbol */
  targetSymbol?: string;

  /** Codomain on the right-hand side (e.g. "ℝ_ω", "𝔻", "𝔹") */
  rhsDomain?: CalculationDomain;

  /** Backward-compatibility alias for rhsDomain */
  targetDomain?: CalculationDomain;

  /** Optional physical unit for target symbol */
  targetUnit?: string;

  /** Pedagogical explanation of the rule */
  description?: string;

  /** Ordered input parameter slots */
  inputs: SlotParam[];

  /**
   * Deterministic evaluation function mapping slot inputs to a CalculationResult.
   */
  evaluate: (inputs: Record<string, number>) => CalculationResult;

  /** Optional discrete simulation trigger */
  hasSimulation?: boolean | ((inputs: Record<string, number>) => boolean);

  /** Optional runner hook for animated visualizer simulations */
  runSimulation?: (inputs: Record<string, number>, arg: any) => any;

  /** Linked pseudocode algorithm ID in PSEUDO_CATALOG */
  pseudoAlgoId?: string;
}

// ============================================================================
// Backward-Compatibility Type Aliases
// ============================================================================

export type EquationSlot = SlotParam;
export type CalcVariable = SlotParam;
export type CalcVariableOption = SlotOption;
export type EquationResult = CalculationResult;
export type FsEvaluationResult = CalculationResult;
export type EquationSpec = DirectedEqualitySpec;
export type FsCalculationMode = DirectedEqualitySpec;

// ============================================================================
// Shared Helper Functions
// ============================================================================

/**
 * Normalizes any slot into a standard SlotParam.
 */
export function normalizeSlotParam(slot: Partial<SlotParam> & { name: string; symbol: string }): SlotParam {
  return {
    name: slot.name,
    symbol: slot.symbol,
    domain: slot.domain || "ℝ",
    defaultValue: slot.defaultValue !== undefined ? slot.defaultValue : 0,
    step: slot.step !== undefined ? slot.step : 1,
    min: slot.min !== undefined ? slot.min : -100,
    max: slot.max !== undefined ? slot.max : 100,
    unit: slot.unit,
    description: slot.description,
    options: slot.options
  };
}

/**
 * Formats a hyperreal value into its standard nucleus and infinitesimal halo dust.
 */
export function createHaloResult(
  hardVal: number,
  kDustMultiplier: number,
  hardStr?: string,
  dustMagnitude?: number
): CalculationResult {
  const hardFormatted = hardStr || hardVal.toFixed(4);
  const k = Math.round(kDustMultiplier);
  const derivMag = dustMagnitude !== undefined ? dustMagnitude : 1.0;
  const dustVal = k * derivMag;
  const isHard = k === 0;

  const dustStr = isHard
    ? "0 (Zero Dust)"
    : `${dustVal >= 0 ? "+" : ""}${dustVal.toFixed(4)}·dx`;

  const display = isHard ? hardFormatted : `${hardFormatted} + ${dustStr.replace(/^\+/, "")}`;

  return {
    resultValue: hardVal,
    displayValue: display,
    displayResult: display,
    hardPart: hardFormatted,
    dustPart: dustStr,
    isHard,
    domainBadge: "ℝ_ω"
  };
}

/**
 * Formats a dyadic rational result with its Conway tree path and birthday.
 */
export function createDyadicResult(
  m: number,
  k: number,
  path: string,
  birthday: number
): CalculationResult {
  const value = m / Math.pow(2, k);
  const fractionStr = k === 0 ? `${m}` : `${m} / ${Math.pow(2, k)}`;

  return {
    resultValue: value,
    displayValue: fractionStr,
    displayResult: fractionStr,
    dyadicRational: fractionStr,
    dyadicPath: path,
    dyadicBirthday: birthday,
    domainBadge: "𝔻"
  };
}

export { SlotController, SlotControllerOptions } from "./slotController.js";

