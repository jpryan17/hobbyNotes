import { SVGElt, textWidth} from './svgElt.js'
import {Btree} from './btree.js'
import { DR } from './dyadicRationals.js'
import {keyToExp, WU} from './exputils.js'

export function drawDRTreeDiagram(){ 
    const width=900
    const height = 450
    const maxBD = 4
    const nodeSize = 22
    const bgColor='aliceblue'
    const fontSize = 12

    const svg = new SVGElt('svg')
    const div = document.getElementById('static-diagram') as HTMLDivElement
    div.appendChild(svg.elt)
    svg.setAA(['width',width,'height',height,
                'style',`background-color:${bgColor}`])
    const tree = new Btree(svg,'labeledTree',width,height,maxBD,nodeSize,{antenna:true,topRoom:70})
    setDRTreeInfo(tree,fontSize)
}

function setDRTreeInfo (tree:Btree,fontSize:number){
    for (let i=0;i<=tree.maxBD;i++){
        for (let j=0;j<Math.pow(2,i);j++){
            const key = `K${i}${j}`
            const exp = keyToExp(key)
            const node = tree.getTreeNode(key) as SVGElt
            const cx = node.getN('cx') 
            const cy = node.getN('cy')          
            const nodeLabel = setNodeLabel(i,j)
            const drLabel = new DR(exp).format()
            const w = textWidth(drLabel,fontSize)
            const x = cx -1/2 * w
            const y = cy + 1/3 * fontSize
            tree.setText(x,y,drLabel,'black',fontSize)
        }
    }
}   
function setNodeLabel(bd:number, lp:number){
    let len = Math.pow(2,bd)
    let sign = WU.plus
    if (lp >= len/2){
        sign = WU.minus
        lp = len - lp - 1
    }
    let expansion = WU.plus.repeat(bd).split("")
    let signPos = bd -1
    while (signPos > 0){
        if(lp % 2 > 0){
            expansion[signPos] = WU.minus
        }
        lp = Math.floor(lp/2)
        signPos--
    }
    if(sign == WU.plus){
        for(let i=0;i<bd;i++){
            expansion[i] = (expansion[i] == WU.plus) ? WU.minus : WU.plus
        }
    }
    let exp = expansion.join(" ")
    return (exp=='') ? '[ ]' : '['.concat(expansion.join(" "),']')
}
