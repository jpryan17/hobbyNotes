import { Elt } from './elt.js';
import { PSEUDO_CATALOG, IPseudoAlgorithm } from './pseudoCatalog.js';

/**
 * Syntax highlighter for structured Pascal/ALGOL-style pseudocode.
 */
function highlightPseudoCode(rawCode: string): string {
  const lines = rawCode.split('\n');

  const formattedLines = lines.map((line, idx) => {
    const lineNum = idx + 1;
    const lineNumStr = `<span style="display:inline-block;width:32px;margin-right:16px;text-align:right;color:#64748b;user-select:none;font-weight:normal;">${lineNum}</span>`;

    // Handle comments
    const commentIdx = line.indexOf('//');
    let codePart = commentIdx >= 0 ? line.substring(0, commentIdx) : line;
    let commentPart = commentIdx >= 0 ? line.substring(commentIdx) : '';

    // Escape basic HTML entities in code and comment
    codePart = codePart
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    commentPart = commentPart
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight strings like '+' or '-'
    codePart = codePart.replace(/('[^']*')/g, '<span style="color:#f87171;">$1</span>');

    // Highlight keywords
    codePart = codePart.replace(
      /\b(function|var|begin|end|return|for|each|in|do|if|then|else|while|to)\b/g,
      '<span style="color:#c084fc;font-weight:bold;">$1</span>'
    );

    // Highlight types
    codePart = codePart.replace(
      /\b(Node|Integer|Dyadic)\b/g,
      '<span style="color:#38bdf8;font-weight:600;">$1</span>'
    );
    codePart = codePart.replace(
      /\bSet of Node\b/g,
      '<span style="color:#38bdf8;font-weight:600;">Set of Node</span>'
    );

    // Highlight primitive ops & built-ins
    codePart = codePart.replace(
      /\b(SimplerOptions|Cut|ConwayAdd|Insert|EmptySet|Maximum|Minimum|EulerExp|sqr|val|node|length)\b/g,
      '<span style="color:#4ade80;font-weight:600;">$1</span>'
    );

    // Highlight assignment & special operators
    codePart = codePart.replace(
      /(:=|&gt;=|&lt;=|\+\+|≫|⊕)/g,
      '<span style="color:#fbbf24;font-weight:bold;">$1</span>'
    );

    const formattedComment = commentPart
      ? `<span style="color:#94a3b8;font-style:italic;">${commentPart}</span>`
      : '';

    return `<div style="line-height:1.6;white-space:pre;">${lineNumStr}${codePart}${formattedComment}</div>`;
  });

  return formattedLines.join('');
}

/**
 * PseudoViewer: Interactive detail inspection card for structured pseudocode algorithms.
 * Integrates into NavFW with the standard back button navigation.
 */
export class PseudoViewer extends Elt {
  private currentAlgorithmId: string = 'conway_add';

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
    }
    this.render();
  }

  public layout(): void {
    // Stage relayout hook if needed
  }

  private render(): void {
    const algo: IPseudoAlgorithm = PSEUDO_CATALOG[this.currentAlgorithmId] || PSEUDO_CATALOG['conway_add'];
    const allAlgos = Object.values(PSEUDO_CATALOG);

    const codeHtml = highlightPseudoCode(algo.code);

    const primitivesHtml = algo.primitives
      .map(
        (p) =>
          `<span style="display:inline-block;padding:2px 8px;margin:2px 4px 2px 0;background:#1e293b;border:1px solid #334155;border-radius:4px;font-family:monospace;font-size:11.5px;color:#38bdf8;">${p}</span>`
      )
      .join(' ');

    const explanationHtml = algo.explanation
      .map(
        (exp, i) =>
          `<li style="margin-bottom:8px;line-height:1.5;"><strong style="color:#1e3a8a;">${i + 1}.</strong> ${exp}</li>`
      )
      .join('');

    let exampleHtml = '';
    if (algo.example) {
      const ex = algo.example;
      const inputsHtml = ex.inputs
        .map(
          (inp) =>
            `<span style="display:inline-block;background:#f1f5f9;border:1px solid #cbd5e1;padding:3px 8px;border-radius:4px;font-family:monospace;font-size:12px;color:#1e293b;margin-right:6px;">${inp}</span>`
        )
        .join(' ');
      const stepsHtml = ex.steps
        .map((s) => `<li style="margin-bottom:4px;color:#334155;font-size:13px;">${s}</li>`)
        .join('');

      exampleHtml = `
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:8px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
            <span style="background:#2563eb;color:#ffffff;font-size:11px;font-weight:bold;padding:2px 8px;border-radius:4px;text-transform:uppercase;">
              Trace Example
            </span>
            <span style="font-size:13px;font-weight:600;color:#1e293b;">Concrete Execution</span>
          </div>
          <div style="margin-bottom:10px;">
            <strong style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Inputs:</strong>
            <div style="margin-top:4px;">${inputsHtml}</div>
          </div>
          <div style="margin-bottom:10px;">
            <strong style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Inductive Steps:</strong>
            <ol style="margin:4px 0 0 18px;padding:0;">${stepsHtml}</ol>
          </div>
          <div style="background:#ecfdf5;border:1px solid #6ee7b7;padding:8px 12px;border-radius:6px;display:flex;align-items:center;gap:8px;">
            <span style="color:#059669;font-weight:bold;font-size:13px;">Result:</span>
            <code style="font-family:monospace;font-weight:bold;color:#065f46;font-size:13px;">${ex.result}</code>
          </div>
        </div>
      `;
    }

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
      <div style="max-width:860px;margin:0 auto;border:1.5px solid #cbd5e1;border-radius:12px;background:#ffffff;box-shadow:0 6px 20px rgba(0,0,0,0.06);overflow:hidden;">
        
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
            <div style="background:rgba(56,189,248,0.12);border:1px solid #38bdf8;color:#7dd3fc;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">
              Structured Pseudocode
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
            Bridge: Text ⟷ Pseudocode ⟷ TypeScript
          </div>
        </div>

        <!-- Body Content -->
        <div style="padding:22px 24px;">

          <!-- Pseudocode Editor Box -->
          <div style="border-radius:8px;overflow:hidden;border:1px solid #1e293b;box-shadow:inset 0 2px 6px rgba(0,0,0,0.3);margin-bottom:22px;">
            <div style="background:#1e293b;padding:8px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;">
              <div style="display:flex;align-items:center;gap:6px;">
                <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span>
                <span style="width:10px;height:10px;border-radius:50%;background:#eab308;display:inline-block;"></span>
                <span style="width:10px;height:10px;border-radius:50%;background:#22c55e;display:inline-block;"></span>
                <span style="font-family:monospace;font-size:12px;color:#94a3b8;margin-left:8px;">${algo.id}.pseudo</span>
              </div>
              <span style="font-size:11.5px;color:#94a3b8;font-family:monospace;">Tree-Inductive Structured Syntax</span>
            </div>
            <div style="background:#090d16;padding:16px;color:#f1f5f9;font-family:Consolas, 'Courier New', monospace;font-size:13px;overflow-x:auto;">
              ${codeHtml}
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

          <!-- Example Trace -->
          ${exampleHtml}

        </div>

      </div>
    `;

    // Attach click listeners to tabs
    const buttons = this.elt.querySelectorAll('.pseudo-tab-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const targetId = (e.currentTarget as HTMLElement).getAttribute('data-algo-id');
        if (targetId) {
          this.showAlgorithm(targetId);
        }
      });
    });
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
