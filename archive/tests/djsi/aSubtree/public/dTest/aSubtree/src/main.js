import { SubtreeDiagram } from "../../../dLib/subtree.js";
import { Nav } from '../../../clientLib/navFW.js';
new Nav('app1');
function drawSubtreeDiagram() {
    const cg = new SubtreeDiagram('subtree-diagram');
    Nav.fo.append(cg);
}
drawSubtreeDiagram();
//# sourceMappingURL=main.js.map