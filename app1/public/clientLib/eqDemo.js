import { Elt } from './elt.js';
import { EquationEvaluator, EQUATION_PRESETS } from './equationEvaluator.js';
/**
 * EqDemo: Interactive Full-Stage Demo Container for Equation Evaluation.
 * Serves as an indexed NavFW Demo stage (like TTD, FSD, BTD, BID) where students
 * can directly build and instantiate typed algebraic equations (LHS ⟹ RHS single slot).
 */
export class EqDemo extends Elt {
    evaluator;
    constructor() {
        super('div', 'eq-demo-stage', 'H');
        this.elt.setAttribute('style', 'box-sizing: border-box; width: 100%; min-height: 100%; padding: 16px 20px 80px 20px; background: transparent; font-family: system-ui, -apple-system, sans-serif;');
        this.evaluator = new EquationEvaluator({ initialStage: 1, presetId: 'nucleus_halo_1d' });
        this.evaluator.switchToCustom('x0 + k*dx', 'ℝ_ω', 1);
        this.elt.appendChild(this.evaluator.elt);
    }
    loadEquation(presetId, formula, domain) {
        if (presetId && EQUATION_PRESETS[presetId]) {
            this.evaluator.selectPreset(presetId, 4);
        }
        else if (formula) {
            this.evaluator.switchToCustom(formula, domain, 4);
        }
        else {
            this.evaluator.switchToCustom('2*x + 3', domain || 'ℝ', 4);
        }
    }
    resetToBuilder() {
        this.evaluator.switchToCustom('x0 + k*dx', 'ℝ_ω', 1);
    }
    layout() {
        // Optional relayout hook
    }
}
export let eqDemo;
export function setEqDemo() {
    if (!eqDemo) {
        eqDemo = new EqDemo();
    }
    return eqDemo;
}
export function initEqDemo() {
    setEqDemo();
    eqDemo.resetToBuilder();
    return eqDemo;
}
export function layoutEqDemo() {
    if (eqDemo) {
        eqDemo.layout();
    }
}
