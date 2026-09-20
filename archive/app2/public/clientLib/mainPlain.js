import { Btree } from './btree.js';
let tree;
export function drawPlainTreeDiagram(parent) {
    tree = new Btree(parent, 'plain', 900, 400, 7, 2, { antenna: true,
        leftRoom: 10, rightRoom: 10,
        topRoom: 20, bottomRoom: 10 });
}
