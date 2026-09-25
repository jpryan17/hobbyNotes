import { Elt } from './elt.js';
import { EquationEvaluator, EQUATION_PRESETS } from './equationEvaluator.js';

/**
 * EqDemo: Interactive Full-Stage Demo Container for Equation Evaluation.
 * Serves as an indexed NavFW Demo stage (like TTD, FSD, BTD, BID) where students
 * can directly build and instantiate typed algebraic equations (LHS ⟹ RHS single slot).
 */
export class EqDemo extends Elt {
  public evaluator: EquationEvaluator;

  constructor() {
    super('div', 'eq-demo-stage', 'H');

    this.elt.setAttribute(
      'style',
      'box-sizing: border-box; width: 100%; min-height: 100%; padding: 16px 20px 80px 20px; background: transparent; font-family: system-ui, -apple-system, sans-serif;'
    );

    this.evaluator = new EquationEvaluator({ initialStage: 1, presetId: 'nucleus_halo_1d' });
    this.evaluator.switchToCustom('x0 + k*dx', 'ℝ_ω', 1);
    this.elt.appendChild(this.evaluator.elt);
  }

  public loadEquation(presetId?: string, formula?: string, domain?: string) {
    if (presetId && EQUATION_PRESETS[presetId]) {
      this.evaluator.selectPreset(presetId, 4);
    } else if (formula) {
      this.evaluator.switchToCustom(formula, domain, 4);
    } else {
      this.evaluator.switchToCustom('2*x + 3', domain || 'ℝ', 4);
    }
  }

  public resetToBuilder() {
    this.evaluator.switchToCustom('x0 + k*dx', 'ℝ_ω', 1);
  }

  public layout() {
    // Optional relayout hook
  }
}

export let eqDemo: EqDemo;

export function setEqDemo(): EqDemo {
  if (!eqDemo) {
    eqDemo = new EqDemo();
  }
  return eqDemo;
}

export function initEqDemo(): EqDemo {
  setEqDemo();
  eqDemo.resetToBuilder();
  return eqDemo;
}

export function layoutEqDemo(): void {
  if (eqDemo) {
    eqDemo.layout();
  }
}
