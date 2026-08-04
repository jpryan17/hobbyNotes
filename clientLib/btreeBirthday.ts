import { SVGElt} from './svgElt.js'
import {Btree} from './btree.js'
import {WU} from './exputils.js'

export function drawBirthdayTreeDiagram(){ 
    const width=950
    const height = 450
    const maxBD = 7
    const nodeSize = 2
    const bgColor='aliceblue'

    const svg = new SVGElt('svg')
    const div = document.getElementById('static-diagram') as HTMLDivElement
    div.appendChild(svg.elt)
    svg.setAA(['width',width,'height',height,
                'style',`background-color:${bgColor}`])
    const tree = new Btree(svg,'labeledTree',width,height,maxBD,nodeSize,{antenna:true,leftRoom:50})
    setBirthdayTreeInfo(tree)
}

function setBirthdayTreeInfo (tree:Btree){
    const colors = ['black','green','blue','red','darkgreen','orange','darkblue','lightgreen']
    const nodes = Array.from(tree.children()) as SVGElt[]
    for (let i=0;i<=tree.maxBD;i++){
        for (let j=0;j<Math.pow(2,i);j++){
            let key = `K${i}${j}`
            let node = getTreeNode(tree,key) as SVGElt
            node.setA('fill',colors[i])
         }
    }
}   
function getTreeNode(tree:Btree,key:string){
    let nodes = Array.from(tree.children()) as SVGElt[]
    let m = 0
    nodes.forEach((node,i)=>{
        if (node.getA('id') == key){ m = i}
        })
    return nodes[m]
}
