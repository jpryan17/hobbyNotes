import { Nav } from '../../clientLib/navFW.js';
import { TTDRef } from '../../clientLib/ttdRef.js';
import { FSDRef } from '../../clientLib/fsdRef.js';
import { mainIndex } from './indices.js';
import { setTTD } from '../../clientLib/ttd.js';
import { setFSD } from '../../clientLib/fsd.js';
export function top(edit = false) {
    new Nav('app1', null, edit);
    setTTD();
    setFSD();
    customElements.define('ttd-ref', TTDRef);
    customElements.define('fsd-ref', FSDRef);
    Nav.clearNavLine();
    Nav.loadIndex('main index', mainIndex);
}
