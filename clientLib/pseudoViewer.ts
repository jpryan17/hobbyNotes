import { Elt } from './elt.js';
import { PSEUDO_CATALOG, IPseudoAlgorithm } from './pseudoCatalog.js';
import {
  PseudoInterpreter,
  IStepState,
} from './pseudoInterpreter.js';
import { dyadicMachine } from './dyadicMachine.js';

interface IPresetConfig {
  id: string;
  label: string;
  funcName: string;
  args: any[];
}

const ALGO_PRESETS: Record<string, IPresetConfig[]> = {
  conway_add: [
    {
      id: 'cut_bounds',
      label: 'Cut(1, 1&1/2) ⟹ 1&1/4 (Stepping the Tree)',
      funcName: 'Cut',
      args: [dyadicMachine.fromInt(1), dyadicMachine.fromPath('++-')],
    },
    {
      id: 'simpler_half',
      label: 'SimplerOptions([+-]) ⟹ { 0 }, { 1 }',
      funcName: 'SimplerOptions',
      args: [dyadicMachine.fromPath('+-')],
    },
    {
      id: 'conway_add_demo',
      label: 'ConwayAdd([+-], [+-+]) ⟹ 1/2 + 3/4 = 1&1/4',
      funcName: 'ConwayAdd',
      args: [dyadicMachine.fromPath('+-'), dyadicMachine.fromPath('+-+')],
    },
  ],
  euler_compounding: [
    {
      id: 'euler_exp_1',
      label: 'EulerExp(1, 4) ⟹ 4 squarings (16 slices)',
      funcName: 'EulerExp',
      args: [dyadicMachine.fromInt(1), 4],
    },
    {
      id: 'euler_exp_half',
      label: 'EulerExp(1/2, 4) ⟹ 4 squarings',
      funcName: 'EulerExp',
      args: [dyadicMachine.fromPath('+-'), 4],
    },
  ],
};

/**
 * Syntax highlighter for structured Pascal/ALGOL-style pseudocode with active line highlight.
 */
function highlightPseudoCode(rawCode: string, activeLine: number = -1): string {
  const lines = rawCode.split('\n');

  const formattedLines = lines.map((line, idx) => {
    const lineNum = idx + 1;
    const isActive = lineNum === activeLine;

    const arrow = isActive
      ? `<span style="color:#eab308;font-weight:bold;margin-right:4px;">▶</span>`
      : `<span style="display:inline-block;width:12px;margin-right:4px;"></span>`;

    const lineNumColor = isActive ? '#fbbf24' : '#64748b';
    const lineNumStr = `<span style="display:inline-block;width:30px;margin-right:14px;text-align:right;color:${lineNumColor};user-select:none;font-weight:${
      isActive ? 'bold' : 'normal'
    };">${lineNum}</span>`;

    // Handle comments
    const commentIdx = line.indexOf('//');
    let codePart = commentIdx >= 0 ? line.substring(0, commentIdx) : line;
    let commentPart = commentIdx >= 0 ? line.substring(commentIdx) : '';

    codePart = codePart
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    commentPart = commentPart
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    codePart = codePart.replace(/('[^']*')/g, '<span style="color:#f87171;">$1</span>');

    codePart = codePart.replace(
      /\b(function|var|begin|end|return|for|each|in|do|if|then|else|while|to)\b/g,
      '<span style="color:#c084fc;font-weight:bold;">$1</span>'
    );

    codePart = codePart.replace(
      /\b(Node|Integer|Dyadic)\b/g,
      '<span style="color:#38bdf8;font-weight:600;">$1</span>'
    );
    codePart = codePart.replace(
      /\bSet of Node\b/g,
      '<span style="color:#38bdf8;font-weight:600;">Set of Node</span>'
    );

    codePart = codePart.replace(
      /\b(SimplerOptions|Cut|ConwayAdd|Insert|EmptySet|Maximum|Minimum|EulerExp|sqr|val|node|length)\b/g,
      '<span style="color:#4ade80;font-weight:600;">$1</span>'
    );

    codePart = codePart.replace(
      /(:=|&gt;=|&lt;=|\+\+|≫|⊕)/g,
      '<span style="color:#fbbf24;font-weight:bold;">$1</span>'
    );

    const formattedComment = commentPart
      ? `<span style="color:#94a3b8;font-style:italic;">${commentPart}</span>`
      : '';

    const bgStyle = isActive
      ? 'background:rgba(234,179,8,0.22);border-left:4px solid #eab308;padding-left:4px;border-radius:2px;'
      : 'padding-left:8px;';

    return `<div id="pseudo-line-${lineNum}" style="line-height:1.6;white-space:pre;${bgStyle}">${arrow}${lineNumStr}${codePart}${formattedComment}</div>`;
  });

  return formattedLines.join('');
}

/**
 * PseudoViewer: Interactive inspection card with built-in Step Interpreter.
 */
export class PseudoViewer extends Elt {
  private currentAlgorithmId: string = 'conway_add';
  private interpreter: PseudoInterpreter | null = null;
  private stepper: Generator<IStepState, IStepState, void> | null = null;
  private currentState: IStepState | null = null;
  private autoRunTimer: any = null;
  private currentPresetIndex: number = 0;
  private stepCount: number = 0;

  constructor() {
    super('div', 'pseudo-viewer-stage', 'H');

    this.elt.setAttribute(
      'style',
      'box-sizing:border-box;width:100%;min-height:100%;padding:16px 20px 80px 20px;background:transparent;font-family:system-ui,-apple-system,sans-serif;'
    );
  }

  public showAlgorithm(id: string): void {
    if (PSEUDO_CATALOG[id]) {
      this.currentAlgorithmId = id;
      this.currentPresetIndex = 0;
      this.stopAutoRun();
      this.initInterpreter();
    }
    this.render();
  }

  public layout(): void {
    // Stage relayout hook if needed
  }

  private initInterpreter(): void {
    const algo = PSEUDO_CATALOG[this.currentAlgorithmId] || PSEUDO_CATALOG['conway_add'];
    try {
      this.interpreter = new PseudoInterpreter(algo.code);
      this.resetStepper();
    } catch (e) {
      console.error('[PseudoViewer] Error initializing interpreter:', e);
      this.interpreter = null;
    }
  }

  private resetStepper(): void {
    this.stopAutoRun();
    this.stepCount = 0;
    this.currentState = null;
    if (!this.interpreter) return;

    const presets = ALGO_PRESETS[this.currentAlgorithmId] || [];
    const preset = presets[this.currentPresetIndex];
    if (preset) {
      this.stepper = this.interpreter.runStepper(preset.funcName, preset.args);
    } else {
      this.stepper = null;
    }
    this.updateEditorHighlight(-1);
    this.updateWatchPanels();
  }

  private stepForward(): void {
    if (!this.stepper) {
      this.resetStepper();
    }
    if (!this.stepper) return;

    const next = this.stepper.next();
    this.stepCount++;
    this.currentState = next.value;

    if (next.done) {
      this.stopAutoRun();
      this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
      this.updateWatchPanels(true);
    } else {
      this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
      this.updateWatchPanels(false);
    }
  }

  private toggleAutoRun(): void {
    if (this.autoRunTimer) {
      this.stopAutoRun();
      this.updateRunButtonLabel(false);
    } else {
      if (!this.stepper || (this.currentState && this.currentState.isDone)) {
        this.resetStepper();
      }
      this.updateRunButtonLabel(true);
      this.autoRunTimer = setInterval(() => {
        if (!this.stepper) {
          this.stopAutoRun();
          this.updateRunButtonLabel(false);
          return;
        }
        const next = this.stepper.next();
        this.stepCount++;
        this.currentState = next.value;
        if (next.done) {
          this.stopAutoRun();
          this.updateRunButtonLabel(false);
          this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
          this.updateWatchPanels(true);
        } else {
          this.updateEditorHighlight(this.currentState ? this.currentState.currentLine : -1);
          this.updateWatchPanels(false);
        }
      }, 450);
    }
  }

  private stopAutoRun(): void {
    if (this.autoRunTimer) {
      clearInterval(this.autoRunTimer);
      this.autoRunTimer = null;
    }
  }

  private updateRunButtonLabel(isRunning: boolean): void {
    const btn = this.elt.querySelector('#pseudo-btn-run');
    if (btn) {
      btn.innerHTML = isRunning ? '⏸ Pause' : '▶ Run';
      btn.setAttribute(
        'style',
        `padding:5px 14px;border:1px solid ${
          isRunning ? '#f59e0b' : '#22c55e'
        };background:${
          isRunning ? '#78350f' : '#14532d'
        };color:#ffffff;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;`
      );
    }
  }

  private updateEditorHighlight(activeLine: number): void {
    const algo = PSEUDO_CATALOG[this.currentAlgorithmId] || PSEUDO_CATALOG['conway_add'];
    const editor = this.elt.querySelector('#pseudo-editor-body');
    if (editor) {
      editor.innerHTML = highlightPseudoCode(algo.code, activeLine);
      if (activeLine > 0) {
        const lineEl = editor.querySelector(`#pseudo-line-${activeLine}`);
        if (lineEl && typeof lineEl.scrollIntoView === 'function') {
          lineEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }
  }

  private updateWatchPanels(isFinal: boolean = false): void {
    const varsContainer = this.elt.querySelector('#pseudo-watch-vars');
    const stackContainer = this.elt.querySelector('#pseudo-watch-stack');
    const badge = this.elt.querySelector('#pseudo-status-badge');

    if (badge) {
      if (isFinal) {
        badge.innerHTML = `✓ Execution Finished (Step ${this.stepCount})`;
        badge.setAttribute(
          'style',
          'background:#064e3b;color:#6ee7b7;border:1px solid #059669;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;'
        );
      } else if (this.stepCount > 0) {
        badge.innerHTML = `Stepping (Step ${this.stepCount}, Line ${
          this.currentState ? this.currentState.currentLine : ''
        })`;
        badge.setAttribute(
          'style',
          'background:#78350f;color:#fde68a;border:1px solid #d97706;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;'
        );
      } else {
        badge.innerHTML = 'Ready to Step';
        badge.setAttribute(
          'style',
          'background:#1e293b;color:#94a3b8;border:1px solid #334155;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;'
        );
      }
    }

    if (varsContainer) {
      if (!this.currentState || Object.keys(this.currentState.variables).length === 0) {
        varsContainer.innerHTML = `<span style="color:#64748b;font-style:italic;font-size:12.5px;">No active local variables. Click "Step" to begin.</span>`;
      } else {
        const rows = Object.entries(this.currentState.variables)
          .map(
            ([k, v]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1e293b;font-family:monospace;font-size:12px;">
              <span style="color:#38bdf8;font-weight:bold;">${k}:</span>
              <span style="color:#f1f5f9;max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${v}">${v}</span>
            </div>`
          )
          .join('');
        varsContainer.innerHTML = rows;
      }
    }

    if (stackContainer) {
      if (this.currentState && this.currentState.result !== undefined) {
        const resStr =
          typeof this.currentState.result === 'object' && 'format' in this.currentState.result
            ? `${this.currentState.result.toString()}`
            : String(this.currentState.result);
        stackContainer.innerHTML = `
          <div style="background:#064e3b;border:1px solid #059669;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:12.5px;color:#a7f3d0;">
            <strong style="color:#34d399;">Return Value:</strong> ${resStr}
          </div>
        `;
      } else if (!this.currentState || this.currentState.callStack.length === 0) {
        stackContainer.innerHTML = `<span style="color:#64748b;font-style:italic;font-size:12.5px;">Stack empty.</span>`;
      } else {
        const stackHtml = this.currentState.callStack
          .map(
            (c, i) => `
            <div style="padding:3px 0;font-family:monospace;font-size:12px;color:#cbd5e1;">
              <span style="color:#64748b;">[${i}]</span> ${c}
            </div>`
          )
          .join('');
        stackContainer.innerHTML = stackHtml;
      }
    }
  }

  private render(): void {
    const algo: IPseudoAlgorithm =
      PSEUDO_CATALOG[this.currentAlgorithmId] || PSEUDO_CATALOG['conway_add'];
    const allAlgos = Object.values(PSEUDO_CATALOG);
    const presets = ALGO_PRESETS[this.currentAlgorithmId] || [];

    const primitivesHtml = algo.primitives
      .map(
        (p) =>
          `<span style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;background:#1e293b;border:1px solid #334155;border-radius:4px;font-family:monospace;font-size:11.5px;color:#38bdf8;">${p}</span>`
      )
      .join(' ');

    const explanationHtml = algo.explanation
      .map(
        (exp, i) =>
          `<li style="margin-bottom:8px;line-height:1.5;"><strong style="color:#1e3a8a;">${
            i + 1
          }.</strong> ${exp}</li>`
      )
      .join('');

    const presetOptions = presets
      .map(
        (p, idx) =>
          `<option value="${idx}" ${
            idx === this.currentPresetIndex ? 'selected' : ''
          }>${p.label}</option>`
      )
      .join('');

    const tabsHtml = allAlgos
      .map((a) => {
        const isActive = a.id === this.currentAlgorithmId;
        const style = isActive
          ? 'background:#2563eb;color:#ffffff;font-weight:bold;border-color:#2563eb;'
          : 'background:#f1f5f9;color:#475569;font-weight:normal;border-color:#cbd5e1;';
        return `<button data-algo-id="${a.id}" class="pseudo-tab-btn" style="padding:6px 14px;border:1px solid;border-radius:6px;font-size:12.5px;cursor:pointer;transition:all 0.15s;${style}">${a.name}</button>`;
      })
      .join(' ');

    this.elt.innerHTML = `
      <div style="max-width:890px;margin:0 auto;border:1.5px solid #cbd5e1;border-radius:12px;background:#ffffff;box-shadow:0 6px 20px rgba(0,0,0,0.06);overflow:hidden;">
        
        <!-- Header Banner -->
        <div style="background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:#f8fafc;padding:22px 24px;border-bottom:1px solid #334155;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:10px;">
            <div>
              <span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;background:#3b82f6;color:#ffffff;padding:3px 10px;border-radius:4px;margin-bottom:8px;">
                ${algo.badge}
              </span>
              <h2 style="margin:0;font-size:21px;font-weight:700;color:#ffffff;line-height:1.3;">
                ${algo.name}
              </h2>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="background:rgba(34,197,94,0.15);border:1px solid #22c55e;color:#4ade80;font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:20px;">
                Interactive Stepper Active
              </span>
              <div style="background:rgba(56,189,248,0.12);border:1px solid #38bdf8;color:#7dd3fc;font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:20px;">
                Structured Pseudocode
              </div>
            </div>
          </div>

          <p style="margin:6px 0 14px 0;font-size:14px;color:#cbd5e1;line-height:1.5;">
            ${algo.summary}
          </p>

          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);padding:10px 14px;border-radius:8px;font-size:12.5px;">
            <div style="margin-bottom:6px;">
              <span style="color:#94a3b8;font-weight:600;">Mathematical Domain:</span>
              <span style="font-family:monospace;color:#f1f5f9;margin-left:6px;font-weight:bold;">${algo.domain}</span>
            </div>
            <div>
              <span style="color:#94a3b8;font-weight:600;">Primitive Machine Ops:</span>
              <span style="margin-left:6px;">${primitivesHtml}</span>
            </div>
          </div>
        </div>

        <!-- Algorithm Navigation Bar -->
        <div style="background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-right:4px;">Algorithms:</span>
            ${tabsHtml}
          </div>
          <div style="font-size:12px;color:#64748b;font-style:italic;">
            Interactive Pedagogical Stepper
          </div>
        </div>

        <!-- Body Content -->
        <div style="padding:20px 24px;">

          <!-- Stepper Control Bar -->
          <div style="background:#1e293b;border:1px solid #334155;border-radius:8px 8px 0 0;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <button id="pseudo-btn-step" style="padding:5px 14px;border:1px solid #38bdf8;background:#0284c7;color:#ffffff;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;transition:background 0.15s;">
                ⏭ Step Forward
              </button>
              <button id="pseudo-btn-run" style="padding:5px 14px;border:1px solid #22c55e;background:#166534;color:#ffffff;border-radius:6px;font-size:12px;font-weight:bold;cursor:pointer;transition:background 0.15s;">
                ▶ Run Auto
              </button>
              <button id="pseudo-btn-reset" style="padding:5px 12px;border:1px solid #475569;background:#334155;color:#e2e8f0;border-radius:6px;font-size:12px;cursor:pointer;">
                ↺ Reset
              </button>

              <span style="font-size:12px;color:#94a3b8;margin-left:6px;font-weight:600;">Target:</span>
              <select id="pseudo-select-preset" style="background:#0f172a;color:#f1f5f9;border:1px solid #475569;border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;">
                ${presetOptions}
              </select>
            </div>

            <div id="pseudo-status-badge" style="background:#1e293b;color:#94a3b8;border:1px solid #334155;padding:3px 10px;border-radius:12px;font-size:11.5px;font-weight:600;">
              Ready to Step
            </div>
          </div>

          <!-- Code Box Container -->
          <div style="border-radius:0 0 8px 8px;overflow:hidden;border:1px solid #1e293b;border-top:none;box-shadow:inset 0 2px 6px rgba(0,0,0,0.3);margin-bottom:18px;">
            <div id="pseudo-editor-body" style="background:#090d16;padding:16px;color:#f1f5f9;font-family:Consolas, 'Courier New', monospace;font-size:13px;overflow-x:auto;max-height:480px;overflow-y:auto;">
              ${highlightPseudoCode(algo.code, -1)}
            </div>
          </div>

          <!-- Live Variable Watch & Call Stack Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;margin-bottom:22px;">
            
            <!-- Scope Watch Panel -->
            <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 14px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:11.5px;font-weight:bold;color:#38bdf8;text-transform:uppercase;letter-spacing:0.5px;">
                  🔍 Live Variable Watch
                </span>
                <span style="font-size:11px;color:#64748b;">Active Scope</span>
              </div>
              <div id="pseudo-watch-vars">
                <span style="color:#64748b;font-style:italic;font-size:12.5px;">Click "Step Forward" to watch variables evolve.</span>
              </div>
            </div>

            <!-- Call Stack & Return Result -->
            <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:12px 14px;">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <span style="font-size:11.5px;font-weight:bold;color:#34d399;text-transform:uppercase;letter-spacing:0.5px;">
                  ⚡ Call Stack &amp; Return
                </span>
                <span style="font-size:11px;color:#64748b;">Invocation Tree</span>
              </div>
              <div id="pseudo-watch-stack">
                <span style="color:#64748b;font-style:italic;font-size:12.5px;">Stack empty.</span>
              </div>
            </div>

          </div>

          <!-- Dual Complexity Ledger -->
          <div style="margin-bottom:22px;">
            <h4 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;">
              Dual Architecture Complexity Ledger
            </h4>
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:12px;">
              
              <div style="border:1.5px solid #fecaca;background:#fff5f5;border-radius:8px;padding:14px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                  <span style="color:#dc2626;font-weight:bold;font-size:14px;">🌳</span>
                  <span style="font-weight:bold;font-size:13px;color:#991b1b;">Tree-Inductive Formulation</span>
                </div>
                <div style="font-size:13px;color:#7f1d1d;line-height:1.4;">
                  ${algo.complexity.tree}
                </div>
              </div>

              <div style="border:1.5px solid #bbf7d0;background:#f0fdf4;border-radius:8px;padding:14px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                  <span style="color:#16a34a;font-weight:bold;font-size:14px;">⚙️</span>
                  <span style="font-weight:bold;font-size:13px;color:#166534;">Dyadic Machine Ring Isomorphism</span>
                </div>
                <div style="font-size:13px;color:#14532d;line-height:1.4;">
                  ${algo.complexity.dyadic}
                </div>
              </div>

            </div>
          </div>

          <!-- Analysis & Rationale -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:10px;">
            <h4 style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#1e3a8a;">
              Mathematical Notes &amp; Invariants
            </h4>
            <ul style="margin:0;padding-left:18px;font-size:13.5px;color:#334155;">
              ${explanationHtml}
            </ul>
          </div>

        </div>

      </div>
    `;

    // Attach event listeners
    const buttons = this.elt.querySelectorAll('.pseudo-tab-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetId = (e.currentTarget as HTMLElement).getAttribute('data-algo-id');
        if (targetId) {
          this.showAlgorithm(targetId);
        }
      });
    });

    const stepBtn = this.elt.querySelector('#pseudo-btn-step');
    if (stepBtn) {
      stepBtn.addEventListener('click', () => this.stepForward());
    }

    const runBtn = this.elt.querySelector('#pseudo-btn-run');
    if (runBtn) {
      runBtn.addEventListener('click', () => this.toggleAutoRun());
    }

    const resetBtn = this.elt.querySelector('#pseudo-btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetStepper());
    }

    const presetSelect = this.elt.querySelector('#pseudo-select-preset') as HTMLSelectElement;
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        this.currentPresetIndex = Number((e.target as HTMLSelectElement).value);
        this.resetStepper();
      });
    }

    this.initInterpreter();
  }
}

export let pseudoViewer: PseudoViewer;

export function setPseudoViewer(): PseudoViewer {
  if (!pseudoViewer) {
    pseudoViewer = new PseudoViewer();
  }
  return pseudoViewer;
}

export function initPseudoViewer(): PseudoViewer {
  setPseudoViewer();
  return pseudoViewer;
}
