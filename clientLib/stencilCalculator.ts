// clientLib/stencilCalculator.ts
// =============================================================================
// Middle Way Math Schema-Driven Stencil Calculator
// Canonical shared implementation for reader app (<interactive-stencil>, eqDemo)
// and CRUD Studio (directed_equations & stencil_presets inspection and authoring).
// =============================================================================

export interface StencilModeSlot {
  id?: number | string;
  equation_id?: number | string;
  slot_order: number;
  slot_kind?: 'parameter' | 'input' | string;
  name: string;
  symbol: string;
  domain: string;
  unit?: string | null;
  default_value?: number | string | null;
  min_val?: number | string | null;
  max_val?: number | string | null;
  step_val?: number | string | null;
  description?: string | null;
}

export interface StencilPreset {
  id?: number | string;
  preset_key: string;
  equation_id: number | string;
  title: string;
  unit?: string | null;
  param_values: Record<string, number | string>;
  input_defaults?: Record<string, number | string>;
  description?: string | null;
}

export interface StencilEquation {
  id: number | string;
  equation_key: string;
  title: string;
  label?: string | null;
  formula_expr: string;
  target_symbol?: string | null;
  target_domain?: string | null;
  target_unit?: string | null;
  formula_description?: string | null;
}

export interface StencilCalculatorOptions {
  container: HTMLElement;
  equation: StencilEquation;
  slots: StencilModeSlot[];
  presets?: StencilPreset[];
  initialPresetKeyOrId?: string | number;
  isCrudMode?: boolean;
  onSavePreset?: (preset: {
    preset_key: string;
    title: string;
    unit: string;
    param_values: Record<string, number>;
    description: string;
  }) => Promise<void> | void;
}

/**
 * Evaluates a mathematical formula given variable assignments.
 * Supports standard algebraic operators (+, -, *, /, ^, Math functions).
 */
export function evaluateFormulaExpression(
  formulaExpr: string,
  variables: Record<string, number>
): { result: number | null; error?: string; formattedStep?: string } {
  try {
    let expr = formulaExpr.trim();

    // Standard ladder stencils special-case optimizations for precision & symbols
    if (expr.includes('a * Math.pow(r, k)') || expr.includes('a · rⁿ') || expr.includes('a * r^k') || expr.includes('a * r^n')) {
      const a = variables['a'] ?? 1;
      const r = variables['r'] ?? 2;
      const k = variables['k'] ?? variables['n'] ?? 0;
      const res = a * Math.pow(r, k);
      return {
        result: res,
        formattedStep: `${a} · (${r})^${k} = ${Number.isInteger(res) ? res : res.toFixed(4)}`
      };
    }

    if (expr.includes('a + n * d') || expr.includes('a + k · d') || expr.includes('a + n · d')) {
      const a = variables['a'] ?? 0;
      const d = variables['d'] ?? 1;
      const n = variables['n'] ?? variables['k'] ?? 0;
      const res = a + n * d;
      return {
        result: res,
        formattedStep: `${a} + (${n} · ${d}) = ${Number.isInteger(res) ? res : res.toFixed(4)}`
      };
    }

    if (expr.includes('v0 - g * t') || expr.includes('v₀ - g · t')) {
      const v0 = variables['v0'] ?? variables['v₀'] ?? 0;
      const g = variables['g'] ?? 9.80665;
      const t = variables['t'] ?? 0;
      const res = v0 - g * t;
      return {
        result: res,
        formattedStep: `${v0} - (${g} · ${t}) = ${res.toFixed(3)}`
      };
    }

    // Generic JS Expression evaluation with sanitized variable scope
    // Replace caret with Math.pow or **
    expr = expr.replace(/\^/g, '**').replace(/·/g, '*');

    // Create safe evaluation function
    const varNames = Object.keys(variables);
    const varValues = Object.values(variables);
    const evaluator = new Function(...varNames, `return (${expr});`);
    const val = evaluator(...varValues);

    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return { result: null, error: 'Expression evaluated to NaN or non-finite value' };
    }

    return {
      result: val,
      formattedStep: `${formulaExpr} = ${Number.isInteger(val) ? val : val.toFixed(4)}`
    };
  } catch (err: any) {
    return { result: null, error: err.message || 'Evaluation error' };
  }
}

/**
 * Mounts the Schema-Driven Stencil Calculator into a container.
 */
export function mountStencilCalculator(options: StencilCalculatorOptions): {
  recalculate: () => void;
  setPreset: (presetKeyOrId: string | number) => void;
  destroy: () => void;
} {
  const {
    container,
    equation,
    slots,
    presets = [],
    initialPresetKeyOrId,
    isCrudMode = false,
    onSavePreset
  } = options;

  container.innerHTML = '';

  // Classify slots into parameters vs inputs
  const paramSlots = slots.filter((s) => {
    if (s.slot_kind === 'parameter') return true;
    if (s.slot_kind === 'input') return false;
    // Fallback heuristic: single index letters (n, k, t, x) with integer/natural domain are inputs
    const isIndex = s.name === 'n' || s.name === 'k' || s.name === 't' || s.domain === 'ℕ';
    return !isIndex && s.slot_order < 2;
  });

  const inputSlots = slots.filter((s) => {
    return !paramSlots.includes(s);
  });

  // State
  const paramValues: Record<string, number | null> = {};
  paramSlots.forEach((s) => {
    const def = s.default_value !== null && s.default_value !== undefined ? Number(s.default_value) : null;
    paramValues[s.name] = def;
  });

  const inputValues: Record<string, number> = {};
  inputSlots.forEach((s) => {
    const def = s.default_value !== null && s.default_value !== undefined ? Number(s.default_value) : 0;
    inputValues[s.name] = def;
  });

  let activePreset: StencilPreset | null = null;

  // Root Element
  const root = document.createElement('div');
  root.className = 'stencil-calculator-root';
  root.style.cssText = `
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
    overflow: hidden;
    margin: 16px 0 24px 0;
    line-height: 1.5;
  `;

  // 1. Header Bar: Formula & Equation Metadata
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border-bottom: 1.5px solid #e2e8f0;
    padding: 12px 18px;
    flex-wrap: wrap;
    gap: 10px;
  `;

  const targetSym = equation.target_symbol || 'y';
  const targetDom = equation.target_domain || 'ℝ_ω';
  const targetUnit = equation.target_unit ? ` (${equation.target_unit})` : '';
  const formulaDisplay = equation.formula_expr ? `${targetSym} = ${equation.formula_expr}` : equation.title;

  header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      <span style="font-size: 16px;">📐</span>
      <span style="font-family: 'Cambria Math', Georgia, serif; font-size: 18px; font-weight: 700; color: #1e3a8a;">
        ${escapeHtml(formulaDisplay)}
      </span>
      <code style="background: #eff6ff; color: #1d4ed8; font-size: 11.5px; padding: 2px 8px; border-radius: 4px; font-weight: 700; border: 1px solid #bfdbfe;">
        ${escapeHtml(equation.equation_key)}
      </code>
      <span style="background: #f1f5f9; color: #475569; font-size: 11px; padding: 2px 7px; border-radius: 12px; font-weight: 600;">
        Codomain: ${escapeHtml(targetDom)}${escapeHtml(targetUnit)}
      </span>
    </div>
    <div id="calculator-status-badge" style="display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;">
      <!-- Dynamic Status Badge rendered here -->
    </div>
  `;
  root.appendChild(header);

  // 2. Body Container
  const body = document.createElement('div');
  body.style.cssText = 'padding: 16px 20px;';

  // --- Section A: Parameter Configuration (The Stencil) ---
  const paramSection = document.createElement('div');
  paramSection.style.cssText = `
    background: #faf5ff;
    border: 1.5px solid #d8b4fe;
    border-radius: 8px;
    padding: 14px 16px;
    margin-bottom: 16px;
  `;

  paramSection.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 14px;">⚙️</span>
        <span style="font-size: 13.5px; font-weight: 700; color: #581c87; text-transform: uppercase; letter-spacing: 0.5px;">
          Parameter Configuration (The Stencil)
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <label style="font-size: 12px; font-weight: 600; color: #6b21a8;" for="preset-select-dropdown">Preset:</label>
        <select id="preset-select-dropdown" style="font-size: 12.5px; padding: 4px 10px; border-radius: 4px; border: 1px solid #c084fc; background: #ffffff; color: #4c1d95; font-weight: 600; cursor: pointer;">
          <option value="">-- Custom (Open Parameters) --</option>
          ${presets
            .map(
              (p) => `<option value="${p.preset_key || p.id}">🎛️ ${escapeHtml(p.title || p.preset_key)}</option>`
            )
            .join('')}
        </select>
        ${
          isCrudMode
            ? `<button type="button" id="btn-save-as-preset" style="font-size: 12px; font-weight: 700; color: #ffffff; background: #7c3aed; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; transition: background 0.15s ease;">
                 💾 Save as Preset
               </button>`
            : ''
        }
      </div>
    </div>
    <div id="param-inputs-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
      <!-- Parameter slot inputs rendered here -->
    </div>
  `;

  body.appendChild(paramSection);

  // --- Section B: Stepping & Evaluation Transect (The Parameterized Calculator) ---
  const calcSection = document.createElement('div');
  calcSection.id = 'calc-transect-section';
  calcSection.style.cssText = `
    background: #f0fdf4;
    border: 1.5px solid #86efac;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
  `;

  calcSection.innerHTML = `
    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 12px;">
      <span style="font-size: 14px;">⚡</span>
      <span style="font-size: 13.5px; font-weight: 700; color: #14532d; text-transform: uppercase; letter-spacing: 0.5px;">
        Stepping &amp; Evaluation Transect (Parameterized Calculator)
      </span>
    </div>
    <div id="unparameterized-gate-msg" style="display: none; padding: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; color: #92400e; font-size: 13px;">
      ⚠️ <strong>Parameters Required:</strong> Please provide values for all stencil parameters above to activate the calculator transect.
    </div>
    <div id="calc-active-controls">
      <div id="input-slots-container" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 14px;">
        <!-- Input Stepper Slots rendered here -->
      </div>
      <!-- Output Banner -->
      <div id="calc-output-banner" style="background: #ffffff; border: 1.5px solid #22c55e; border-radius: 8px; padding: 14px 18px; box-shadow: 0 2px 6px rgba(34, 197, 94, 0.08);">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="font-size: 12px; font-weight: 700; color: #15803d; text-transform: uppercase;">Evaluated Output (${escapeHtml(targetSym)}):</span>
            <div id="calc-result-display" style="font-size: 26px; font-weight: 800; color: #166534; font-family: 'Cambria Math', Georgia, serif; line-height: 1.2; margin-top: 2px;">
              --
            </div>
          </div>
          <div id="calc-step-breakdown" style="font-family: monospace; font-size: 13px; color: #4b5563; text-align: right;">
            --
          </div>
        </div>
      </div>
    </div>
  `;

  body.appendChild(calcSection);

  // Modal target for CRUD "Save as Preset"
  const modalContainer = document.createElement('div');
  modalContainer.id = 'stencil-preset-modal-target';
  body.appendChild(modalContainer);

  root.appendChild(body);
  container.appendChild(root);

  // --- Render Parameter Slots ---
  const paramGrid = paramSection.querySelector('#param-inputs-grid') as HTMLDivElement;
  paramSlots.forEach((slot) => {
    const slotCard = document.createElement('div');
    slotCard.style.cssText = `
      background: #ffffff;
      border: 1px solid #e9d5ff;
      border-radius: 6px;
      padding: 10px 12px;
    `;

    const min = slot.min_val !== null ? `min="${slot.min_val}"` : '';
    const max = slot.max_val !== null ? `max="${slot.max_val}"` : '';
    const step = slot.step_val !== null ? `step="${slot.step_val}"` : 'step="any"';
    const unitText = slot.unit ? ` <span style="font-size: 11px; color: #7c3aed; font-weight: 600;">(${escapeHtml(slot.unit)})</span>` : '';
    const initialVal = paramValues[slot.name] !== null && paramValues[slot.name] !== undefined ? paramValues[slot.name] : '';

    slotCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
        <label for="slot-input-${slot.name}" style="font-size: 12.5px; font-weight: 700; color: #4c1d95;">
          ${escapeHtml(slot.description || slot.name)} [ <code>${escapeHtml(slot.symbol || slot.name)}</code> ]${unitText}
        </label>
        <span style="font-size: 10.5px; color: #6b21a8; font-weight: 600;">${escapeHtml(slot.domain)}</span>
      </div>
      <input type="number" id="slot-input-${slot.name}" ${min} ${max} ${step} value="${initialVal}" placeholder="[ _ ]" style="
        width: 100%;
        box-sizing: border-box;
        padding: 6px 10px;
        font-size: 13.5px;
        font-family: monospace;
        font-weight: 700;
        border: 1.5px solid #c084fc;
        border-radius: 4px;
        color: #1e1b4b;
        background: #faf5ff;
        outline: none;
      " />
    `;

    const input = slotCard.querySelector('input') as HTMLInputElement;
    input.addEventListener('input', () => {
      const val = input.value.trim() === '' ? null : Number(input.value);
      paramValues[slot.name] = val;
      // Clear preset dropdown selection since parameters were modified manually
      presetDropdown.value = '';
      activePreset = null;
      recalculate();
    });

    paramGrid.appendChild(slotCard);
  });

  // --- Render Input Slots ---
  const inputContainer = calcSection.querySelector('#input-slots-container') as HTMLDivElement;
  inputSlots.forEach((slot) => {
    const inputSlotCard = document.createElement('div');
    inputSlotCard.style.cssText = `
      background: #ffffff;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 10px 14px;
    `;

    const min = slot.min_val !== null && slot.min_val !== undefined ? Number(slot.min_val) : 0;
    const max = slot.max_val !== null && slot.max_val !== undefined ? Number(slot.max_val) : 100;
    const step = slot.step_val !== null && slot.step_val !== undefined ? Number(slot.step_val) : 1;
    const initialVal = inputValues[slot.name] ?? min;

    inputSlotCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
        <label style="font-size: 13px; font-weight: 700; color: #166534;">
          ${escapeHtml(slot.description || 'Stepping Index')} [ <code>${escapeHtml(slot.symbol || slot.name)} ∈ ${escapeHtml(slot.domain)}</code> ]
        </label>
        <span style="font-size: 13px; font-weight: 700; color: #15803d; font-family: monospace;" id="input-val-label-${slot.name}">
          Step: ${initialVal} / ${max}
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <button type="button" class="btn-step-minus" style="width: 32px; height: 32px; border: 1px solid #86efac; background: #f0fdf4; color: #166534; font-size: 16px; font-weight: bold; border-radius: 4px; cursor: pointer; line-height: 1;">-</button>
        <input type="range" class="input-slider" min="${min}" max="${max}" step="${step}" value="${initialVal}" style="flex: 1; cursor: pointer; accent-color: #16a34a;" />
        <button type="button" class="btn-step-plus" style="width: 32px; height: 32px; border: 1px solid #86efac; background: #f0fdf4; color: #166534; font-size: 16px; font-weight: bold; border-radius: 4px; cursor: pointer; line-height: 1;">+</button>
        <input type="number" class="input-num-box" min="${min}" max="${max}" step="${step}" value="${initialVal}" style="width: 65px; padding: 4px 6px; font-size: 13px; font-family: monospace; font-weight: bold; text-align: center; border: 1px solid #86efac; border-radius: 4px; color: #14532d;" />
      </div>
    `;

    const slider = inputSlotCard.querySelector('.input-slider') as HTMLInputElement;
    const numBox = inputSlotCard.querySelector('.input-num-box') as HTMLInputElement;
    const label = inputSlotCard.querySelector(`#input-val-label-${slot.name}`) as HTMLSpanElement;
    const minusBtn = inputSlotCard.querySelector('.btn-step-minus') as HTMLButtonElement;
    const plusBtn = inputSlotCard.querySelector('.btn-step-plus') as HTMLButtonElement;

    const updateInputVal = (newVal: number) => {
      const clamped = Math.min(max, Math.max(min, newVal));
      inputValues[slot.name] = clamped;
      slider.value = clamped.toString();
      numBox.value = clamped.toString();
      label.textContent = `Step: ${clamped} / ${max}`;
      recalculate();
    };

    slider.addEventListener('input', () => updateInputVal(Number(slider.value)));
    numBox.addEventListener('change', () => updateInputVal(Number(numBox.value)));
    minusBtn.addEventListener('click', () => updateInputVal(inputValues[slot.name] - step));
    plusBtn.addEventListener('click', () => updateInputVal(inputValues[slot.name] + step));

    inputContainer.appendChild(inputSlotCard);
  });

  // --- Recalculation Engine & State Management ---
  const statusBadge = header.querySelector('#calculator-status-badge') as HTMLDivElement;
  const gateMsg = calcSection.querySelector('#unparameterized-gate-msg') as HTMLDivElement;
  const activeControls = calcSection.querySelector('#calc-active-controls') as HTMLDivElement;
  const resultDisplay = calcSection.querySelector('#calc-result-display') as HTMLDivElement;
  const stepBreakdown = calcSection.querySelector('#calc-step-breakdown') as HTMLDivElement;
  const presetDropdown = paramSection.querySelector('#preset-select-dropdown') as HTMLSelectElement;

  function recalculate(): void {
    // 1. Verify if all parameter slots are provided
    const allParamsProvided = paramSlots.every((s) => {
      const val = paramValues[s.name];
      return val !== null && val !== undefined && !isNaN(val);
    });

    if (!allParamsProvided) {
      // Unparameterized Stencil State
      statusBadge.innerHTML = `
        <span style="background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 12px; border: 1px solid #fde68a;">
          ● Open Stencil (Parameters Required)
        </span>
      `;
      gateMsg.style.display = 'block';
      activeControls.style.opacity = '0.4';
      activeControls.style.pointerEvents = 'none';
      resultDisplay.textContent = 'Awaiting parameters...';
      stepBreakdown.textContent = 'Formula parameters not yet bound';
      return;
    }

    // Parameterized Calculator State
    gateMsg.style.display = 'none';
    activeControls.style.opacity = '1';
    activeControls.style.pointerEvents = 'auto';

    const presetLabel = activePreset ? `🎛️ Preset: ${escapeHtml(activePreset.title)}` : '✓ Parameterized Calculator (Ready)';
    statusBadge.innerHTML = `
      <span style="background: #ecfdf5; color: #065f46; padding: 3px 10px; border-radius: 12px; border: 1px solid #a7f3d0;">
        ${presetLabel}
      </span>
    `;

    // Combine parameters and inputs
    const allVars: Record<string, number> = {};
    for (const [k, v] of Object.entries(paramValues)) {
      if (v !== null && v !== undefined) allVars[k] = v;
    }
    for (const [k, v] of Object.entries(inputValues)) {
      allVars[k] = v;
    }

    const { result, error, formattedStep } = evaluateFormulaExpression(equation.formula_expr, allVars);

    if (error || result === null) {
      resultDisplay.textContent = 'Error';
      stepBreakdown.textContent = error || 'Calculation failed';
      return;
    }

    const formattedNum = Number.isInteger(result) ? result.toString() : result.toFixed(3);
    const unitSuffix = equation.target_unit ? ` ${equation.target_unit}` : '';

    // Musical note hint helper for 12-TET if applicable
    let noteHint = '';
    if (equation.equation_key === 'geom_ladder_step' && allVars['a'] === 440) {
      const k = Math.round(allVars['k'] ?? allVars['n'] ?? 0);
      const noteMap: Record<number, string> = {
        0: 'A4 (Unison)',
        1: 'A#4',
        2: 'B4',
        3: 'C5 (Minor third)',
        4: 'C#5',
        5: 'D5 (Perfect fourth)',
        6: 'D#5',
        7: 'E5 (Perfect fifth)',
        8: 'F5',
        9: 'F#5',
        10: 'G5',
        11: 'G#5',
        12: 'A5 (Octave doubling)'
      };
      if (noteMap[k]) noteHint = ` &nbsp;•&nbsp; <span style="font-size: 15px; color: #6d28d9; font-weight: 600;">${noteMap[k]}</span>`;
    }

    resultDisplay.innerHTML = `${formattedNum}${unitSuffix}${noteHint}`;
    stepBreakdown.textContent = formattedStep || '';
  }

  // --- Preset Switching ---
  function applyPreset(preset: StencilPreset): void {
    activePreset = preset;
    presetDropdown.value = preset.preset_key || String(preset.id);

    // Apply param_values
    const vals = typeof preset.param_values === 'object' ? preset.param_values : JSON.parse(preset.param_values || '{}');
    for (const [paramName, val] of Object.entries(vals)) {
      const numVal = Number(val);
      paramValues[paramName] = numVal;
      const inputEl = paramSection.querySelector(`#slot-input-${paramName}`) as HTMLInputElement | null;
      if (inputEl) inputEl.value = String(numVal);
    }

    // Apply input defaults if provided
    if (preset.input_defaults) {
      const inVals = typeof preset.input_defaults === 'object' ? preset.input_defaults : JSON.parse(preset.input_defaults || '{}');
      for (const [inName, inVal] of Object.entries(inVals)) {
        inputValues[inName] = Number(inVal);
        const slider = inputContainer.querySelector('.input-slider') as HTMLInputElement | null;
        if (slider) slider.value = String(inVal);
        const numBox = inputContainer.querySelector('.input-num-box') as HTMLInputElement | null;
        if (numBox) numBox.value = String(inVal);
      }
    }

    recalculate();
  }

  presetDropdown.addEventListener('change', () => {
    const chosenKey = presetDropdown.value;
    if (!chosenKey) {
      activePreset = null;
      recalculate();
      return;
    }
    const found = presets.find((p) => p.preset_key === chosenKey || String(p.id) === chosenKey);
    if (found) {
      applyPreset(found);
    }
  });

  // --- Save as Preset (CRUD only) ---
  if (isCrudMode) {
    const savePresetBtn = paramSection.querySelector('#btn-save-as-preset') as HTMLButtonElement | null;
    savePresetBtn?.addEventListener('click', () => {
      // Open inline preset modal
      modalContainer.innerHTML = `
        <div style="background: #ffffff; border: 2px solid #7c3aed; border-radius: 8px; padding: 18px; margin-top: 14px; box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0; color: #581c87; font-size: 15px; font-weight: 700;">💾 Save Current Parameters as Stencil Preset</h4>
            <button type="button" id="btn-close-preset-modal" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #64748b;">✕</button>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Preset Title:</label>
              <input type="text" id="modal-preset-title" placeholder="e.g. 19-TET Acoustic Scale" style="width: 100%; box-sizing: border-box; padding: 6px 10px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;" />
            </div>
            <div>
              <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Preset Key (Slug):</label>
              <input type="text" id="modal-preset-key" placeholder="e.g. preset_19tet_scale" style="width: 100%; box-sizing: border-box; padding: 6px 10px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace;" />
            </div>
          </div>
          <div style="margin-bottom: 14px;">
            <label style="font-size: 12px; font-weight: 700; color: #334155; display: block; margin-bottom: 4px;">Description:</label>
            <input type="text" id="modal-preset-desc" placeholder="Acoustic tuning or physical constants description..." style="width: 100%; box-sizing: border-box; padding: 6px 10px; font-size: 13px; border: 1px solid #cbd5e1; border-radius: 4px;" />
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" id="btn-cancel-preset" style="padding: 6px 14px; font-size: 12.5px; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 4px; cursor: pointer;">Cancel</button>
            <button type="button" id="btn-commit-preset" style="padding: 6px 16px; font-size: 12.5px; font-weight: 700; border: none; background: #7c3aed; color: #ffffff; border-radius: 4px; cursor: pointer;">Save Preset to Database ✓</button>
          </div>
        </div>
      `;

      modalContainer.querySelector('#btn-close-preset-modal')?.addEventListener('click', () => {
        modalContainer.innerHTML = '';
      });
      modalContainer.querySelector('#btn-cancel-preset')?.addEventListener('click', () => {
        modalContainer.innerHTML = '';
      });

      modalContainer.querySelector('#btn-commit-preset')?.addEventListener('click', async () => {
        const titleInput = modalContainer.querySelector('#modal-preset-title') as HTMLInputElement;
        const keyInput = modalContainer.querySelector('#modal-preset-key') as HTMLInputElement;
        const descInput = modalContainer.querySelector('#modal-preset-desc') as HTMLInputElement;

        const title = titleInput.value.trim();
        const key = keyInput.value.trim() || `preset_${Date.now().toString().slice(-4)}`;
        const desc = descInput.value.trim();

        if (!title) {
          alert('Please provide a title for the preset.');
          return;
        }

        const capturedParams: Record<string, number> = {};
        for (const [pName, pVal] of Object.entries(paramValues)) {
          if (pVal !== null && pVal !== undefined) {
            capturedParams[pName] = pVal;
          }
        }

        if (onSavePreset) {
          await onSavePreset({
            preset_key: key,
            title,
            unit: equation.target_unit || '',
            param_values: capturedParams,
            description: desc
          });
        }

        modalContainer.innerHTML = '';
      });
    });
  }

  // --- Initial Load ---
  if (initialPresetKeyOrId) {
    const found = presets.find(
      (p) => p.preset_key === initialPresetKeyOrId || String(p.id) === String(initialPresetKeyOrId)
    );
    if (found) {
      applyPreset(found);
    } else {
      recalculate();
    }
  } else {
    recalculate();
  }

  return {
    recalculate,
    setPreset: (keyOrId) => {
      const found = presets.find((p) => p.preset_key === keyOrId || String(p.id) === String(keyOrId));
      if (found) applyPreset(found);
    },
    destroy: () => {
      container.innerHTML = '';
    }
  };
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
