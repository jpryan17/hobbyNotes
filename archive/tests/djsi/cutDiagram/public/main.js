import { Nav } from '../../../libs/navFW.js';
import { CutDiagram } from "../../../diagrams/cut.js";
new Nav();
function drawCutDiagram() {
    const id = 'cut-diagram';
    const cg = new CutDiagram(id);
    Nav.setContentToDiagram(cg);
}
drawCutDiagram();
//# sourceMappingURL=main.js.map