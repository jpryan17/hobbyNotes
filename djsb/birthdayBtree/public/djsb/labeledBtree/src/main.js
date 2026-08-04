import { drawLabelTreeDiagram } from "../../../dLib/btreeLabeled.js";
import { SI } from '../../../clientLib/serverInterface.js';
async function saveLabelTreeDiagram() {
    console.log('bd');
    new SI('app1');
    drawLabelTreeDiagram();
    const div = document.getElementById('static-diagram');
    const svg = div.innerHTML;
    await SI.sendSVG('btreeLabeled', svg);
    if (SI.errorFlag == 0) {
        console.log('ah did it work?');
    }
    else {
        console.log(`SI did not post svg.`);
    }
}
saveLabelTreeDiagram();
console.log('at end');
//# sourceMappingURL=main.js.map