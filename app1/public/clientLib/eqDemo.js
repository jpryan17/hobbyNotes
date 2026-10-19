import { Elt } from './elt.js';
import { EquationEvaluator, EQUATION_REGISTRY, EQUATION_PRESETS } from './equationEvaluator.js';
/**
 * EqDemo: Interactive Full-Stage Demo Container for Equation Evaluation.
 * Serves as an indexed NavFW Demo stage (like TTD, FSD, BTD, BID) where students
 * can directly build and instantiate typed algebraic equations (LHS ⟹ RHS single slot).
 */
const ID_TO_PRESET_OR_FORMULA = {
    '1': { formula: 'v0 - g * t', domain: 'ℝ_ω', title: 'Uniform Free Fall Velocity' },
    '2': { formula: '(v0 - v) / g', domain: 'ℝ_ω', title: 'Free Fall Elapsed Time' },
    '3': { formula: 'v0*t - 0.5*g*t^2', domain: 'ℝ_ω', title: 'Free Fall Position Transect' },
    '4': { preset: 'telescoping_sum', formula: '0.5 * m * v^2', domain: 'ℝ_ω', title: 'Kinetic Energy' },
    '5': { formula: 'sqrt(2 * ke / m)', domain: 'ℝ_ω', title: 'Velocity from Kinetic Energy' },
    '6': { formula: 'u_C + (alpha * dt / (dx^2)) * (u_L - 2*u_C + u_R)', domain: 'ℝ_ω', title: 'Thermal Diffusion Step' },
    '7': { preset: 'complex_halo_2d', formula: '(x1*x2 - y1*y2) + i*(x1*y2 + x2*y1)', domain: 'ℂ_ω', title: 'Complex Step Product' },
    '8': { formula: 'I0 * cos(theta2 - theta1)^2', domain: 'ℝ', title: 'Polarizer Transmission' },
    '9': { preset: 'bayes_filter', formula: '(p_d_given_h * p_h) / (p_d_given_h * p_h + p_d_given_not_h * (1 - p_h))', domain: '[0, 1]', title: 'Bayesian Posterior' },
    '10': { formula: 'omega * dx', domain: 'ℝ', title: 'Scale Balance Product' },
    '11': { preset: 'quadratic_halo_diff', formula: '4 * x^3', domain: 'ℝ_ω', title: 'Quartic Derivative' },
    '12': { formula: '(a + b) / 2', domain: 'ℝ_ω', title: 'IVT Midpoint Bisection' },
    '13': { formula: '2 * pi * m / (2^n)', domain: 'ℝ_ω', title: 'Dyadic Angle Generator' },
    '14': { formula: '2 * R * sin(delta_theta / 2)', domain: 'ℝ_ω', title: 'Polygonal Horn Rim Chord' },
    '15': { preset: 'sin_halo', formula: 'sin(2 * pi * m / (2^n))', domain: '[-1, 1]', title: 'Dyadic Sine Stencil' },
    '16': { formula: 'cos(theta) + i*sin(theta)', domain: 'ℂ_ω', title: 'Unit Rotor Group Projection' },
    '17': { preset: 'nucleus_halo_1d', formula: 'x0 + k * dx', domain: 'ℝ_ω', title: '1D Nucleus-Halo Decomposition' },
    'ff_v_from_v0_g_t': { formula: 'v0 - g * t', domain: 'ℝ_ω' },
    'ff_t_from_v_v0_g': { formula: '(v0 - v) / g', domain: 'ℝ_ω' },
    'ff_s_from_v0_g_t': { formula: 'v0*t - 0.5*g*t^2', domain: 'ℝ_ω' },
    'we_ke_from_m_v': { preset: 'telescoping_sum' },
    'we_v_from_ke_m': { formula: 'sqrt(2 * ke / m)', domain: 'ℝ_ω' },
    'diff_heat_step': { formula: 'u_C + (alpha * dt / (dx^2)) * (u_L - 2*u_C + u_R)', domain: 'ℝ_ω' },
    'complex_mult_eval': { preset: 'complex_halo_2d' },
    'polarizer_transmission': { formula: 'I0 * cos(theta2 - theta1)^2', domain: 'ℝ' },
    'bayes_posterior': { preset: 'bayes_filter' },
    'scale_reciprocity_eval': { formula: 'omega * dx', domain: 'ℝ' },
    'diff_x4_st': { preset: 'quadratic_halo_diff' },
    'ivt_root_bisection': { formula: '(a + b) / 2', domain: 'ℝ_ω' },
    'trig_dyadic_angle': { formula: '2 * pi * m / (2^n)', domain: 'ℝ_ω' },
    'trig_chord_length': { formula: '2 * R * sin(delta_theta / 2)', domain: 'ℝ_ω' },
    'trig_sin_dyadic_eval': { preset: 'sin_halo' },
    'trig_sin_rotor_eval': { formula: 'cos(theta) + i*sin(theta)', domain: 'ℂ_ω' },
    'nucleus_halo_decomp_eval': { preset: 'nucleus_halo_1d' }
};
export class EqDemo extends Elt {
    evaluator;
    constructor() {
        super('div', 'eq-demo-stage', 'H');
        this.elt.setAttribute('style', 'box-sizing: border-box; width: 100%; min-height: 100%; padding: 16px 20px 80px 20px; background: transparent; font-family: system-ui, -apple-system, sans-serif;');
        this.evaluator = new EquationEvaluator({ initialStage: 1, presetId: 'nucleus_halo_1d' });
        this.evaluator.switchToCustom('x0 + k*dx', 'ℝ_ω', 1);
        this.elt.appendChild(this.evaluator.elt);
    }
    loadEquation(presetIdOrKey, formula, domain) {
        const key = (presetIdOrKey || '').trim();
        if (key && (EQUATION_REGISTRY.has(key) || EquationEvaluator.getEquation(key))) {
            this.evaluator.selectEquation(key, 4);
            return;
        }
        if (key && EQUATION_PRESETS[key]) {
            this.evaluator.selectPreset(key, 4);
            return;
        }
        if (key && ID_TO_PRESET_OR_FORMULA[key]) {
            const entry = ID_TO_PRESET_OR_FORMULA[key];
            if (entry.preset && (EQUATION_REGISTRY.has(entry.preset) || EQUATION_PRESETS[entry.preset])) {
                this.evaluator.selectEquation(entry.preset, 4);
                return;
            }
            if (entry.formula) {
                this.evaluator.switchToCustom(entry.formula, entry.domain || domain || 'ℝ_ω', 4);
                return;
            }
        }
        if (formula) {
            this.evaluator.switchToCustom(formula, domain || 'ℝ', 4);
        }
        else {
            this.evaluator.switchToCustom('x0 + k*dx', domain || 'ℝ_ω', 4);
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
