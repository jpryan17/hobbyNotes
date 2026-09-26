import { Nav } from '../../clientLib/navFW.js';
import { TTDRef } from '../../clientLib/ttdRef.js';
import { FSDRef } from '../../clientLib/fsdRef.js';
import { BTDRef } from '../../clientLib/btdRef.js';
import { BIDRef } from '../../clientLib/bidRef.js';
import { StemCard } from '../../clientLib/stemCard.js';
import { EqRef } from '../../clientLib/eqRef.js';
import { PseudoRef } from '../../clientLib/pseudoRef.js';
import { mainIndex, hydrateDiagramCallbacks } from './indices.js';
import { setTTD } from '../../clientLib/ttd.js';
import { setFSD } from '../../clientLib/fsd.js';
import { setBTD } from '../../clientLib/btd.js';
import { setBID } from '../../clientLib/bid.js';
import { setEqDemo } from '../../clientLib/eqDemo.js';
import { setPseudoViewer } from '../../clientLib/pseudoViewer.js';
export function top(edit = false) {
    new Nav('app1', null, edit);
    if (!customElements.get('ttd-ref'))
        customElements.define('ttd-ref', TTDRef);
    if (!customElements.get('fsd-ref'))
        customElements.define('fsd-ref', FSDRef);
    if (!customElements.get('btd-ref'))
        customElements.define('btd-ref', BTDRef);
    if (!customElements.get('bid-ref'))
        customElements.define('bid-ref', BIDRef);
    if (!customElements.get('stem-card'))
        customElements.define('stem-card', StemCard);
    if (!customElements.get('eq-ref'))
        customElements.define('eq-ref', EqRef);
    if (!customElements.get('pseudo-ref'))
        customElements.define('pseudo-ref', PseudoRef);
    setTTD();
    setFSD();
    setBTD();
    setBID();
    setEqDemo();
    setPseudoViewer();
    Nav.clearNavLine();
    const activeIndex = (typeof window !== 'undefined' && window.__MWM_DEV_INDEX__)
        ? hydrateDiagramCallbacks(window.__MWM_DEV_INDEX__)
        : mainIndex;
    Nav.loadIndex('main', activeIndex);
}
