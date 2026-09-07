import { drawProjectionTreeDiagram } from '../../../dLib/btreeProjected.js';
import { SI } from '../../../clientLib/serverInterface.js';
async function saveProjectionTreeDiagram() {
    console.log('bd');
    new SI('app1');
    drawProjectionTreeDiagram();
    const div = document.getElementById('static-diagram');
    const svg = div.innerHTML;
    await SI.sendSVG('projectedBtree', svg);
    if (SI.errorFlag == 0) {
        console.log('ah did it work?');
    }
    else {
        console.log(`SI did not post svg.`);
    }
}
saveProjectionTreeDiagram();
console.log('at end');
//# sourceMappingURL=main.js.map