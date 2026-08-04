import { Nav } from '../clientLib/navFW.js';
import { initSubtree, displaySubtree } from '../dLib/subtree.js';
const ida = [
    { seg: 'treeBasics', diagram: 'subtree', init: initSubtree, display: displaySubtree }
];
//
export function initAnyDJSI() {
    ida.forEach(entry => {
        if (Nav.segId == entry.seg) {
            entry.init(entry.diagram);
        }
    });
}
export function displayAnyDJSI() {
    ida.forEach(entry => {
        if (Nav.segId == entry.seg) {
            entry.display();
        }
    });
}
//# sourceMappingURL=ida.js.map