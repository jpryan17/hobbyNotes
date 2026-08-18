import { Nav } from '../../clientLib/navFW.js';
import { mainIndex } from './indices.js';

export function top(edit = false) {
    new Nav('app2', null, edit);
    Nav.clearNavLine();
    Nav.loadIndex('main index', mainIndex);
}
