import { Nav } from './navFW.js';
import { eqDemo, setEqDemo } from './eqDemo.js';

/**
 * EqRef: Custom Element for inline or block references to Equation Evaluations.
 * Syntax: <eq-ref eq-id="nucleus_halo_1d">«Eq: x = st(x) + ε»</eq-ref>
 * Or:     <eq-ref formula="2*x + 3" domain="ℝ">«Eval: 2x + 3»</eq-ref>
 */
export class EqRef extends HTMLElement {
  static stdColor = '#047857';
  static overColor = '#065f46';
  static stdBg = '#ecfdf5';
  static overBg = '#d1fae5';
  static stdBorder = '#a7f3d0';
  static overBorder = '#6ee7b7';

  constructor() {
    super();
  }

  connectedCallback(): void {
    const rawHtml = this.innerHTML.trim();
    const rawIdAttr = this.getAttribute('id') || this.getAttribute('de-id') || '';
    const eqKeyAttr = this.getAttribute('equation-key') || this.getAttribute('eq-id') || this.getAttribute('calc-id') || this.getAttribute('eqId') || '';
    const eqId = eqKeyAttr || rawIdAttr;
    const desc = this.getAttribute('desc') || this.getAttribute('title') || '';
    const formula = this.getAttribute('formula') || this.getAttribute('expr') || '';

    const keyToNumId: Record<string, number> = {
      linear_ladder_step: 42,
      fs_linear_ladder_step: 42,
      geom_ladder_step: 41,
      fs_geom_ladder_step: 41,
      ff_v_from_v0_g_t: 2,
      fs_free_fall_accel: 2
    };
    const resolvedNumId = /^\d+$/.test(rawIdAttr)
      ? rawIdAttr
      : (keyToNumId[eqId] ? String(keyToNumId[eqId]) : '');
    const badgeHtml = resolvedNumId
      ? `<span style="margin-left:5px;font-size:0.75em;background:#d1fae5;color:#065f46;padding:1px 5px;border-radius:10px;font-weight:700;">#${resolvedNumId}</span>`
      : '';

    const cleanText = rawHtml.replace(/^«Eq:\s*/i, '').replace(/»$/, '').trim();
    const displayLabel = desc || cleanText || formula || (eqId ? `Stencil ${eqId}` : 'Directed Equation');

    if (!rawHtml.startsWith('📐')) {
      this.innerHTML = `<span style="font-size:0.88em;opacity:0.95;margin-right:3px;">📐</span><span>${displayLabel}</span>${badgeHtml}`;
    }

    this.setAttribute(
      'style',
      `display:inline-flex;align-items:center;gap:3px;color:${EqRef.stdColor};background:${EqRef.stdBg};border:1px solid ${EqRef.stdBorder};font-weight:600;font-size:0.92em;cursor:pointer;padding:2px 8px;border-radius:6px;line-height:1.4;margin:1px 2px;transition:all 0.15s ease;text-decoration:none;`
    );

    this.addEventListener('mouseover', () => {
      this.style.background = EqRef.overBg;
      this.style.color = EqRef.overColor;
      this.style.borderColor = EqRef.overBorder;
      this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
    });

    this.addEventListener('mouseout', () => {
      this.style.background = EqRef.stdBg;
      this.style.color = EqRef.stdColor;
      this.style.borderColor = EqRef.stdBorder;
      this.style.boxShadow = 'none';
    });

    this.addEventListener('click', (e) => {
      e.stopPropagation();

      const index = Nav.indices[Nav.currentIndex];
      const choice = index ? index.choices[index.chosen] : null;
      const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
      const buttonText = `back to ${topicName}`;

      if (!eqDemo) setEqDemo();

      const domain = this.getAttribute('domain') || 'ℝ';

      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      Nav.setLastVisit();
      Nav.addNavLineBackButton(buttonText);
      Nav.fo.removeChildren();
      Nav.fo.elt.scrollTop = 0;
      Nav.fo.append(eqDemo);
      Nav.display();

      eqDemo.loadEquation(eqId, formula, domain);
      eqDemo.layout();
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => eqDemo.layout());
      }
    });
  }
}
