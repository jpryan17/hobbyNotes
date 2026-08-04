import { Nav } from "./navFW.js";
import { initSubtree, displaySubtree } from "./subtree.js";
import { displayCutTree, initCutTree } from "./cut.js";
import { displayOrderedtree, initOrderedtree } from "./order.js";
import { displaySimtree, initSimtree } from "./simplicity.js";
import { displayAddTree, initAddTree } from "./addMult.js";
import { displayMultiplyTree, initMultiplyTree } from "./addMult.js";
import { displayIsoTree, initIsoTree } from "./iso.js";
const ida = [
    {
        seg: "xaTotalOrder",
        diagram: "subtree",
        init: initSubtree,
        display: displaySubtree,
    },
    {
        seg: "xaTotalOrder",
        diagram: "simtree",
        init: initSimtree,
        display: displaySimtree,
    },
    {
        seg: "xaTotalOrder",
        diagram: "orderedtree",
        init: initOrderedtree,
        display: displayOrderedtree,
    },
    {
        seg: "xaCut",
        diagram: "cutTree",
        init: initCutTree,
        display: displayCutTree,
    },
    {
        seg: "xaAddition",
        diagram: "addition",
        init: initAddTree,
        display: displayAddTree,
    },
    {
        seg: "xaMultiplication",
        diagram: "multiplication",
        init: initMultiplyTree,
        display: displayMultiplyTree,
    },
    {
        seg: "xaDyadicRationals",
        diagram: "isomorphism",
        init: initIsoTree,
        display: displayIsoTree,
    },
];
//
export function initAnyDJSI() {
    ida.forEach((entry) => {
        if (Nav.segId == entry.seg) {
            entry.init(entry.diagram);
        }
    });
}
export function displayAnyDJSI() {
    ida.forEach((entry) => {
        if (Nav.segId == entry.seg) {
            entry.display();
        }
    });
}
