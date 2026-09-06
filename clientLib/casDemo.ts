import { Elt } from './elt.js';
import { Nav } from './navFW.js';
import { MwmCasCalculator } from './mwmCasCalculator.js';

/**
 * CasDemo: Interactive Full-Stage Demo Container for Middle Way CAS Calculations.
 * Embeds the MwmCasCalculator and provides layout, navigation, and state restoration.
 */
export class CasDemo extends Elt {
  public calculator: MwmCasCalculator;

  constructor() {
    super('div', 'cas-demo-stage', 'H');

    this.elt.setAttribute(
      'style',
      'box-sizing: border-box; width: 100%; min-height: 100%; padding: 12px 16px; background: transparent; font-family: system-ui, -apple-system, sans-serif;'
    );

    // Calculator instance
    this.calculator = document.createElement('mwm-cas-calculator') as MwmCasCalculator;
    this.calculator.addEventListener('mwm-calc-change', () => {
      this.updateTitle();
    });
    this.elt.appendChild(this.calculator);
  }

  public updateTitle() {
    // Title is rendered within calculator header
  }

  public loadCalculation(calcId: string, expr?: string) {
    if (calcId && this.calculator) {
      this.calculator.selectPreset(calcId, expr);
      this.updateTitle();
    }
  }

  public layout() {
    // Optional relayout hook
  }
}

export let casDemo: CasDemo;

export function setCasDemo(): CasDemo {
  if (!casDemo) {
    casDemo = new CasDemo();
  }
  return casDemo;
}

export function initCasDemo(): CasDemo {
  setCasDemo();
  return casDemo;
}

export function layoutCasDemo(): void {
  if (casDemo) {
    casDemo.layout();
  }
}
