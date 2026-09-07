import { Nav } from '../../../libs/navFW.js';
import { SimplicityDiagram } from "../../../diagrams/simplicity.js";
new Nav();
function drawSimplicityDiagram() {
    const cg = new SimplicityDiagram();
    Nav.setContentToDiagram(cg);
}
drawSimplicityDiagram();
//# sourceMappingURL=main.js.map