import { Nav } from '../../clientLib/navFW.js';
import { TTDRef } from '../../clientLib/ttdRef.js';
import { FSDRef } from '../../clientLib/fsdRef.js';
import { BTDRef } from '../../clientLib/btdRef.js';
import { BIDRef } from '../../clientLib/bidRef.js';
import { mainIndex } from './indices.js';
import { setTTD } from '../../clientLib/ttd.js';
import { setFSD } from '../../clientLib/fsd.js';
import { setBTD } from '../../clientLib/btd.js';
import { setBID } from '../../clientLib/bid.js';
export function top(edit = false) {
    new Nav('app2', null, edit);
    setTTD();
    setFSD();
    setBTD();
    setBID();
    if (!customElements.get('ttd-ref'))
        customElements.define('ttd-ref', TTDRef);
    if (!customElements.get('fsd-ref'))
        customElements.define('fsd-ref', FSDRef);
    if (!customElements.get('btd-ref'))
        customElements.define('btd-ref', BTDRef);
    if (!customElements.get('bid-ref'))
        customElements.define('bid-ref', BIDRef);
    Nav.clearNavLine();
    Nav.loadIndex('main index', mainIndex);
}
