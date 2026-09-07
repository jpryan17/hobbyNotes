import { Btree } from './btree.js';
let tree;
export function drawPlainTreeDiagram(parent) {
    tree = new Btree(parent, 'plain', 900, 400, 7, 2, { antenna: true,
        leftRoom: 10, rightRoom: 10,
        topRoom: 60, bottomRoom: 0 });
}
//# sourceMappingURL=mainPlain.js.map