import { Nav } from './navFW.js';
import { casDemo, setCasDemo } from './casDemo.js';

export class CasRef extends HTMLElement {
  static stdColor = '#0284c7';
  static overColor = '#0369a1';

  constructor() {
    super();
  }

  connectedCallback(): void {
    this.setAttribute(
      'style',
      `display:inline-block;color:${CasRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;padding:2px 6px;border-radius:4px;transition:background 0.15s, color 0.15s;`
    );

    this.addEventListener('mouseover', () => {
      this.setAttribute(
        'style',
        `display:inline-block;color:${CasRef.overColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;background:#e0f2fe;padding:2px 6px;border-radius:4px;`
      );
    });

    this.addEventListener('mouseout', () => {
      this.setAttribute(
        'style',
        `display:inline-block;color:${CasRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;background:transparent;padding:2px 6px;border-radius:4px;`
      );
    });

    this.addEventListener('click', (e) => {
      e.stopPropagation();
      const calcId = this.getAttribute('calc-id') || this.getAttribute('calcId') || 'r_diff';
      const expr = this.getAttribute('expr') || '';

      const index = Nav.indices[Nav.currentIndex];
      const choice = index ? index.choices[index.chosen] : null;
      const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
      const buttonText = `back to ${topicName}`;

      if (!casDemo) setCasDemo();

      Nav.setLastVisit();
      Nav.addNavLineBackButton(buttonText);
      Nav.fo.removeChildren();
      Nav.fo.append(casDemo);
      Nav.display();

      // Load calculation AFTER mounting to DOM so connectedCallback does not wipe it out
      casDemo.loadCalculation(calcId, expr);

      casDemo.layout();
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => casDemo.layout());
      }
    });
  }
}
