import { drawBirthdayTreeDiagram } from "../../../dLib/btreeBirthday.js";
import { SI } from '../../../clientLib/serverInterface.js';
async function saveBirthdayTreeDiagram() {
    console.log('bd');
    new SI('app1');
    drawBirthdayTreeDiagram();
    const div = document.getElementById('static-diagram');
    const svg = div.innerHTML;
    await SI.sendSVG('btreeBirthday', svg);
    if (SI.errorFlag == 0) {
        console.log('ah did it work?');
    }
    else {
        console.log(`SI did not post svg.`);
    }
}
saveBirthdayTreeDiagram();
console.log('at end');
//# sourceMappingURL=main.js.map