import { drawLabelTreeDiagram } from "../../dlib/btreeLabeled.js";
import { SI } from '../../clientLib/serverInterface.js';
async function saveLabelTreeDiagram() {
    console.log('bd');
    new SI('app1', true);
    drawLabelTreeDiagram();
    const div = document.getElementById('btree-label-diagram');
    const svg = div.innerHTML;
    await SI.sendSVG('labeledBtree', svg);
    if (SI.errorFlag == 0) {
        console.log('ah did it work?');
    }
    else {
        console.log(`SI did not post svg.`);
    }
    return;
}
await saveLabelTreeDiagram();
console.log('at end');
//# sourceMappingURL=main.js.map