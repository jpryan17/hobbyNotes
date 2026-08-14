import { Nav } from './navFW.js';
import { bid, setBID } from './bid.js';
export class BIDRef extends HTMLElement {
    static stdColor = '#0284c7';
    static overColor = '#d97706';
    constructor() {
        super();
    }
    connectedCallback() {
        this.setAttribute('style', `color:${BIDRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`);
        this.addEventListener('mouseover', () => {
            this.setAttribute('style', `color:${BIDRef.overColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`);
        });
        this.addEventListener('mouseout', () => {
            this.setAttribute('style', `color:${BIDRef.stdColor};font-weight:bold;cursor:pointer;text-decoration:underline;text-underline-offset:3px;`);
        });
        this.addEventListener('click', () => {
            const mode = this.getAttribute('mode') || 'transect';
            const index = Nav.indices[Nav.currentIndex];
            const choice = index.choices[index.chosen];
            const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
            const buttonText = `back to ${topicName}`;
            if (!bid)
                setBID();
            bid.setMode(mode);
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.append(bid);
            bid.layout();
            Nav.display();
        });
    }
}
