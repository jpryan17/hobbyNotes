import { Nav } from './navFW.js';
import { bid, setBID } from './bid.js';
import { btd, setBTD } from './btd.js';
import { BIDMode } from './bidConfig.js';
import { BTreeMode } from './bTreeConfig.js';

export class BIDRef extends HTMLElement {
  static stdColor = '#0284c7';
  static overColor = '#d97706';

  constructor() {
    super();
  }

  connectedCallback(): void {
    this.setAttribute(
      'style',
      `color:${BIDRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`
    );

    this.addEventListener('mouseover', () => {
      this.setAttribute(
        'style',
        `color:${BIDRef.overColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`
      );
    });

    this.addEventListener('mouseout', () => {
      this.setAttribute(
        'style',
        `color:${BIDRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`
      );
    });

    this.addEventListener('click', () => {
      const rawMode = this.getAttribute('mode') || this.getAttribute('ref') || 'eulerCompounding';
      const mode = rawMode as any;

      const index = Nav.indices[Nav.currentIndex];
      const choice = index.choices[index.chosen];
      const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
      const buttonText = `back to ${topicName}`;

      if (
        mode === 'eulerCompounding' ||
        ['plain', 'labeled', 'birthday', 'subtree', 'order', 'precision', 'dyadic', 'isomorphism', 'interactive'].includes(mode)
      ) {
        if (!btd) setBTD();
        btd.setMode(mode as BTreeMode);

        Nav.setLastVisit();
        Nav.addNavLineBackButton(buttonText);
        Nav.fo.removeChildren();
        Nav.fo.append(btd);
        Nav.display();
        btd.layout();
        if (typeof requestAnimationFrame !== 'undefined') {
          requestAnimationFrame(() => btd.layout());
        }
        return;
      }

      if (!bid) setBID();
      bid.setMode(mode as BIDMode);

      Nav.setLastVisit();
      Nav.addNavLineBackButton(buttonText);
      Nav.fo.removeChildren();
      Nav.fo.append(bid);
      Nav.display();
      bid.layout();
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => bid.layout());
      }
    });
  }
}
