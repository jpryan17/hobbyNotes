import { SVGElt, SVGGrpElt } from './svgElt.js'
import {Btree} from './btree.js'

let tree:Btree
export function drawProjectionTreeDiagram(){ 
    const width = 900
    const height = 400
    const maxBD = 6
    const nodeSize = 4
    const bgColor='aliceblue'

    const svg = new SVGElt('svg')
    const div = document.getElementById('static-diagram') as HTMLDivElement
    div.appendChild(svg.elt)
    svg.setAA(['width',width,'height',height,
                'style',`background-color:${bgColor}`])
    const tree = new Btree(svg,'projectedBtree',width,height,maxBD,nodeSize,{bottomRoom:50})

    drawProjections(tree)
}

function drawProjections(tree:Btree){
    let h = tree.h
    for (let i=0;i<= tree.maxBD;i++){
        for (let j=0;j<Math.pow(2,i);j++){
            let key = `K${i}${j}`
            let svgc = tree.elt.children
            let val =svgc.namedItem(key) as SVGCircleElement
            let x = val.cx.baseVal.value
            let y = val.cy.baseVal.value+tree.nodeSize
            let yy= h-0.5*tree.bottomRoom
            tree.setLine(x,y,x,yy,'lightgray')
        }
    }  
}
