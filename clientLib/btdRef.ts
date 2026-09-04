import { Nav } from './navFW.js';
import { btd, setBTD } from './btd.js';
import { BTreeMode } from './bTreeConfig.js';

export class BTDRef extends HTMLElement {
  static stdColor = 'firebrick';
  static overColor = 'fuchsia';

  constructor() {
    super();
  }

  connectedCallback(): void {
    this.setAttribute(
      'style',
      `color:${BTDRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`
    );

    this.addEventListener('mouseover', () => {
      this.setAttribute(
        'style',
        `color:${BTDRef.overColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`
      );
    });

    this.addEventListener('mouseout', () => {
      this.setAttribute(
        'style',
        `color:${BTDRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`
      );
    });

    this.addEventListener('click', () => {
      const mode = (this.getAttribute('mode') as BTreeMode) || 'plain';

      const index = Nav.indices[Nav.currentIndex];
      const choice = index.choices[index.chosen];
      const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
      const buttonText = `back to ${topicName}`;

      if (!btd) setBTD();
      btd.setMode(mode);

      Nav.setLastVisit();
      Nav.addNavLineBackButton(buttonText);
      Nav.fo.removeChildren();
      Nav.fo.append(btd);
      Nav.display();
      btd.layout();
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => btd.layout());
      }
    });
  }
}
