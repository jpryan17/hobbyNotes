import { Elt } from './elt.js';
import { EquationEvaluator, EQUATION_REGISTRY, EQUATION_PRESETS } from './equationEvaluator.js';
import { mountStencilCalculator } from './stencilCalculator.js';
const STENCIL_EQUATION_SCHEMAS = {
    linear_ladder_step: {
        equation: {
            id: 32,
            equation_key: 'linear_ladder_step',
            title: 'Linear Step Stencil: LS(n) = a + n·d',
            label: 'Arithmetic Progression Step Evaluator',
            formula_expr: 'a + n * d',
            target_symbol: 'LS(n)',
            target_domain: '𝔻_ω',
            target_unit: '',
            formula_description: 'Evaluates the n-th rung of the arithmetic ladder F(n : ℕ_ω) : 𝔻_ω ≔ a + d · n from initial value a ∈ ℝ_ω and step difference d ∈ ℝ_ω.'
        },
        slots: [
            { id: 64, equation_id: 32, slot_order: 0, slot_kind: 'parameter', name: 'a', symbol: 'a', domain: 'ℝ_ω', unit: '', default_value: 0, min_val: -1000, max_val: 1000, step_val: 1, description: 'Initial starting value (anchor)' },
            { id: 65, equation_id: 32, slot_order: 1, slot_kind: 'parameter', name: 'd', symbol: 'd', domain: 'ℝ_ω', unit: '', default_value: 1, min_val: -100, max_val: 100, step_val: 0.5, description: 'Constant additive step difference' },
            { id: 66, equation_id: 32, slot_order: 2, slot_kind: 'input', name: 'n', symbol: 'n', domain: 'ℕ_ω', unit: 'step', default_value: 0, min_val: 0, max_val: 100, step_val: 1, description: 'Step index along the unary spine' }
        ],
        presets: []
    },
    geom_ladder_step: {
        equation: {
            id: 31,
            equation_key: 'geom_ladder_step',
            title: 'Geometric Step Stencil: GS(k) = a · rᵏ',
            label: 'Geometric Progression Step Evaluator',
            formula_expr: 'a * Math.pow(r, k)',
            target_symbol: 'GS(k)',
            target_domain: '𝔻_ω',
            target_unit: 'Hz',
            formula_description: 'Evaluates the k-th step of a geometric progression G(k : ℕ_ω) : 𝔻_ω ≔ a · rᵏ from initial scale a ∈ ℝ_ω and common ratio r ∈ ℝ_ω.'
        },
        slots: [
            { id: 61, equation_id: 31, slot_order: 0, slot_kind: 'parameter', name: 'a', symbol: 'a', domain: 'ℝ_ω', unit: 'Hz', default_value: 440, min_val: 1, max_val: 20000, step_val: 1, description: 'Initial value / fundamental scale factor' },
            { id: 62, equation_id: 31, slot_order: 1, slot_kind: 'parameter', name: 'r', symbol: 'r', domain: 'ℝ_ω', unit: 'ratio', default_value: 1.059463094359, min_val: 0.01, max_val: 10, step_val: 0.001, description: 'Common multiplicative step ratio' },
            { id: 63, equation_id: 31, slot_order: 2, slot_kind: 'input', name: 'k', symbol: 'k', domain: 'ℕ_ω', unit: 'steps', default_value: 0, min_val: 0, max_val: 24, step_val: 1, description: 'Step index along the progression' }
        ],
        presets: [
            {
                id: 1,
                preset_key: 'preset_12tet_scale',
                equation_id: 31,
                title: '12-TET Chromatic Pitch Scale (440 Hz)',
                unit: 'Hz',
                param_values: { a: 440, r: 1.059463094359 },
                input_defaults: { k: 0 },
                description: 'Equal-tempered 12-tone chromatic scale anchored at Concert A4 = 440 Hz with semitone step ratio r = 2^(1/12).'
            },
            {
                id: 2,
                preset_key: 'preset_binary_branching',
                equation_id: 31,
                title: 'Binary Tree Branching (2ᵏ)',
                unit: 'nodes',
                param_values: { a: 1, r: 2 },
                input_defaults: { k: 3 },
                description: 'Pure 2-successor binary tree population doubling at each generation k.'
            }
        ]
    },
    ff_v_from_v0_g_t: {
        equation: {
            id: 1,
            equation_key: 'ff_v_from_v0_g_t',
            title: 'Uniform Free Fall Velocity: v(t) = v₀ - g·t',
            label: 'Uniform Free Fall Terminal Velocity',
            formula_expr: 'v0 - g * t',
            target_symbol: 'v(t)',
            target_domain: 'ℝ_ω',
            target_unit: 'm/s',
            formula_description: 'Computes discrete terminal velocity v(t) = v₀ - g·t on the hyperfinite transect.'
        },
        slots: [
            { id: 1, equation_id: 1, slot_order: 0, slot_kind: 'parameter', name: 'v0', symbol: 'v₀', domain: 'ℝ_ω', unit: 'm/s', default_value: 0, min_val: -100, max_val: 100, step_val: 1, description: 'Initial velocity' },
            { id: 2, equation_id: 1, slot_order: 1, slot_kind: 'parameter', name: 'g', symbol: 'g', domain: 'ℝ_ω', unit: 'm/s²', default_value: 9.80665, min_val: 0, max_val: 30, step_val: 0.1, description: 'Gravitational acceleration' },
            { id: 3, equation_id: 1, slot_order: 2, slot_kind: 'input', name: 't', symbol: 't', domain: 'ℝ_ω', unit: 's', default_value: 2.5, min_val: 0, max_val: 60, step_val: 0.5, description: 'Elapsed time' }
        ],
        presets: [
            {
                id: 3,
                preset_key: 'preset_earth_gravity',
                equation_id: 1,
                title: 'Earth Free Fall (g = 9.80665 m/s²)',
                unit: 'm/s',
                param_values: { v0: 0, g: 9.80665 },
                input_defaults: { t: 2 },
                description: 'Standard Earth gravitational acceleration from rest.'
            }
        ]
    }
};
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
    '29': { formula: 'f0 * (2^(1/12))^k', domain: '𝔻_ω', title: '12-TET Musical Scale Step' },
    '31': { formula: 'a * Math.pow(r, k)', domain: '𝔻_ω', title: 'Geometric Ladder Step' },
    '32': { formula: 'a + n * d', domain: '𝔻_ω', title: 'Linear Ladder Step' },
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
    'nucleus_halo_decomp_eval': { preset: 'nucleus_halo_1d' },
    'music_et_scale_step': { formula: 'f0 * (2^(1/12))^k', domain: '𝔻_ω', title: '12-TET Musical Scale Step' },
    'geom_ladder_step': { formula: 'a * Math.pow(r, k)', domain: '𝔻_ω', title: 'Geometric Ladder Step' },
    'linear_ladder_step': { formula: 'a + n * d', domain: '𝔻_ω', title: 'Linear Ladder Step' },
    'preset_12tet_scale': { formula: '440 * Math.pow(1.059463094359, k)', domain: '𝔻_ω', title: '12-TET Chromatic Pitch Scale (440 Hz)' },
    'preset_binary_branching': { formula: '1 * Math.pow(2, k)', domain: '𝔻_ω', title: 'Binary Tree Branching' },
    'preset_earth_gravity': { formula: 'v0 - 9.80665 * t', domain: 'ℝ_ω', title: 'Earth Free Fall (g = 9.807 m/s²)' }
};
export class EqDemo extends Elt {
    evaluator;
    stencilContainer;
    constructor() {
        super('div', 'eq-demo-stage', 'H');
        this.elt.setAttribute('style', 'box-sizing: border-box; width: 100%; min-height: 100%; padding: 16px 20px 80px 20px; background: transparent; font-family: system-ui, -apple-system, sans-serif;');
        this.stencilContainer = document.createElement('div');
        this.stencilContainer.style.cssText = 'max-width: 960px; margin: 0 auto 20px auto; display: none;';
        this.elt.appendChild(this.stencilContainer);
        this.evaluator = new EquationEvaluator({ initialStage: 1, presetId: 'nucleus_halo_1d' });
        this.evaluator.switchToCustom('x0 + k*dx', 'ℝ_ω', 1);
        this.elt.appendChild(this.evaluator.elt);
    }
    renderStencilIfApplicable(key) {
        const keyMap = {
            'linear_ladder_step': { schemaKey: 'linear_ladder_step' },
            '32': { schemaKey: 'linear_ladder_step' },
            'geom_ladder_step': { schemaKey: 'geom_ladder_step' },
            '31': { schemaKey: 'geom_ladder_step' },
            'preset_12tet_scale': { schemaKey: 'geom_ladder_step', presetKey: 'preset_12tet_scale' },
            'music_et_scale_step': { schemaKey: 'geom_ladder_step', presetKey: 'preset_12tet_scale' },
            '29': { schemaKey: 'geom_ladder_step', presetKey: 'preset_12tet_scale' },
            'preset_binary_branching': { schemaKey: 'geom_ladder_step', presetKey: 'preset_binary_branching' },
            'ff_v_from_v0_g_t': { schemaKey: 'ff_v_from_v0_g_t' },
            '1': { schemaKey: 'ff_v_from_v0_g_t' },
            'preset_earth_gravity': { schemaKey: 'ff_v_from_v0_g_t', presetKey: 'preset_earth_gravity' }
        };
        const match = keyMap[key];
        if (match && STENCIL_EQUATION_SCHEMAS[match.schemaKey]) {
            const schema = STENCIL_EQUATION_SCHEMAS[match.schemaKey];
            this.stencilContainer.style.display = 'block';
            mountStencilCalculator({
                container: this.stencilContainer,
                equation: schema.equation,
                slots: schema.slots,
                presets: schema.presets,
                initialPresetKeyOrId: match.presetKey,
                isCrudMode: false
            });
        }
        else {
            this.stencilContainer.style.display = 'none';
            this.stencilContainer.innerHTML = '';
        }
    }
    loadEquation(presetIdOrKey, formula, domain) {
        const key = (presetIdOrKey || '').trim();
        this.renderStencilIfApplicable(key);
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
        this.stencilContainer.style.display = 'none';
        this.stencilContainer.innerHTML = '';
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
