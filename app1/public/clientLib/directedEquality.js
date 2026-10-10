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
// ============================================================================
// Shared Helper Functions
// ============================================================================
/**
 * Normalizes any slot into a standard SlotParam.
 */
export function normalizeSlotParam(slot) {
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
export function createHaloResult(hardVal, kDustMultiplier, hardStr, dustMagnitude) {
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
export function createDyadicResult(m, k, path, birthday) {
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
export { SlotController } from "./slotController.js";
