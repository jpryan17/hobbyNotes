import { SVGElt } from './svgElt.js'
import {Btree} from './btree.js'
import {keyToExp} from './exputils.js'

export function drawPrecisionTreeDiagram(){ 
    const width = 900
    const height = 400
    const maxBD = 6
    const nodeSize = 2
    const bgColor='aliceblue'

    const svg = new SVGElt('svg')
    const div = document.getElementById('static-diagram') as HTMLDivElement
    div.appendChild(svg.elt)
    svg.setAA(['width',width,'height',height,
                'style',`background-color:${bgColor}`])
    const tree = new Btree(svg,'precisionBtree',width,height,maxBD,nodeSize)

    drawPrecisionProjection(tree,'--+')
}

function drawPrecisionProjection(tree:Btree,rootNode:string){
    const h = 400
    const nodes = subtreeNodes(tree,rootNode)
    const endNode = rootNode.substring(0,rootNode.length-1)
    const beginNode = rootNode.substring(0,rootNode.length-2)
    for (let i=0;i<= tree.maxBD;i++){
        for (let j=0;j<Math.pow(2,i);j++){
            let key = `K${i}${j}`
            let exp = keyToExp(key)
            let node = tree.getTreeNode(key)
            let x = node.getN('cx')
            let y = node.getN('cy')
            let yy= h-0.5*50
            if(exp==beginNode || exp==endNode){
                tree.setNodeColor(key,'black')
            }
            if (nodes.find(e=>e==exp)){
                tree.setNodeColor(key,'crimson')
                tree.setLine(x,y,x,yy,'lightpink')
            } else {
                tree.setLine(x,y,x,yy,'lightgray')
            }
        }
    }  
}
function subtreeNodes(tree:Btree,rootNode:string){
    let currentLength = rootNode.length
    let nodes:string[]=[rootNode]
    while(currentLength<tree.maxBD){
        nodes.forEach(e=>{
            if (e.length == currentLength)
            nodes.push(e.concat('-'))
            nodes.push(e.concat('+'))
        })
        currentLength++
    }
    return nodes
}