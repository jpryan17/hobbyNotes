import { SubtreeDiagram } from "../../../dLib/subtree.js";
import { Nav } from '../../../clientLib/navFW.js';
new Nav('app1');
function drawSubtreeDiagram() {
    const cg = new SubtreeDiagram();
    Nav.fo.append(cg);
    Nav.display();
}
drawSubtreeDiagram();
//# sourceMappingURL=main.js.map