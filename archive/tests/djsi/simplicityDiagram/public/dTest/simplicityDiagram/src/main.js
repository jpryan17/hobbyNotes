import { SimplicityDiagram } from "../../../dLib/simplicity.js";
function drawSimplicityDiagram() {
    const slot = document.getElementById('main-slot');
    const cg = new SimplicityDiagram();
    slot.appendChild(cg.elt);
}
/*
function drawSimplicityDiagram(){
    const diagram = new SimplicityDiagram()
    Nav.addHTMLGroup('simplicity-diagram',diagram)
}
*/
drawSimplicityDiagram();
//# sourceMappingURL=main.js.map