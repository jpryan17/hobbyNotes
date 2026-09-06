import { Elt } from './elt.js';
import { Nav } from './navFW.js';
/**
 * CasDemo: Interactive Full-Stage Demo Container for Middle Way CAS Calculations.
 * Embeds the MwmCasCalculator and provides layout, navigation, and state restoration.
 */
export class CasDemo extends Elt {
    calculator;
    constructor() {
        super('div', 'cas-demo-stage', 'H');
        this.elt.setAttribute('style', 'box-sizing: border-box; width: 100%; min-height: 100%; padding: 20px 24px; background: #f8fafc; font-family: system-ui, -apple-system, sans-serif;');
        // Create container card
        const card = document.createElement('div');
        card.setAttribute('style', 'max-width: 820px; margin: 0 auto; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); overflow: hidden;');
        // Header with Breadcrumb & Close Button
        const header = document.createElement('div');
        header.setAttribute('style', 'display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; background: #0f172a; color: #ffffff;');
        header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; background: #0284c7; color: #ffffff; padding: 2px 8px; border-radius: 4px;">
          CAS Workbench
        </span>
        <span style="font-size: 14px; font-weight: 600; color: #e2e8f0;">
          MWM Interactive Calculation Demo
        </span>
      </div>
      <button id="casDemoBackBtn" style="background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25); color: #ffffff; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
        ← Back to Lecture
      </button>
    `;
        card.appendChild(header);
        // Calculator instance
        this.calculator = document.createElement('mwm-cas-calculator');
        card.appendChild(this.calculator);
        this.elt.appendChild(card);
        // Bind back button
        header.querySelector('#casDemoBackBtn')?.addEventListener('click', () => {
            const lineElts = Nav.lineTopics.children();
            const len = lineElts.length;
            if (len > 0) {
                Nav.lineTopics.elt.removeChild(lineElts[len - 1].elt);
            }
            Nav.showNavLine();
            Nav.processSelection();
        });
    }
    loadCalculation(calcId, expr) {
        if (calcId) {
            this.calculator.selectPreset(calcId);
        }
    }
    layout() {
        // Optional relayout hook
    }
}
export let casDemo;
export function setCasDemo() {
    if (!casDemo) {
        casDemo = new CasDemo();
    }
    return casDemo;
}
