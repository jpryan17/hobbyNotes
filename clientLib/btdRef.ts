import { Nav } from './navFW.js';
import { btd, setBTD, BTD_MODE_METADATA } from './btd.js';
import { BTreeMode } from './bTreeConfig.js';
import { getDemoCatalogItem } from './demoCatalog.js';

export class BTDRef extends HTMLElement {
  static stdColor = '#0369a1';
  static overColor = '#0284c7';

  constructor() {
    super();
  }

  connectedCallback(): void {
    const rawId = this.getAttribute('id') || this.getAttribute('demo-id') || '';
    let mode = (this.getAttribute('mode') as BTreeMode) || 'plain';
    let demoTitle = this.getAttribute('title') || '';

    if (rawId) {
      const demo = getDemoCatalogItem(rawId);
      if (demo && demo.mode) {
        mode = demo.mode as BTreeMode;
        if (!demoTitle) demoTitle = demo.title;
      }
    }

    if (!demoTitle && BTD_MODE_METADATA[mode]) {
      demoTitle = BTD_MODE_METADATA[mode].title;
    }

    if (!this.innerHTML.trim() && demoTitle) {
      this.textContent = demoTitle;
    }

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
      const index = Nav.indices[Nav.currentIndex];
      const choice = index ? index.choices[index.chosen] : null;
      const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
      const buttonText = `back to ${topicName}`;

      if (!btd) setBTD();
      btd.setMode(mode, demoTitle);

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
