import {WU,setExp,setVal,compareExps, expToId} from './exputils.js'
import {InteractiveTree} from './interactiveTree.js'
import {SVGElt,SVGText,SVGTSpan} from './svgElt.js'
import { Nav } from './navFW.js'
//

function processSelection(){that.processSelection()}
//

let simtree:SimplicityDiagram

export function initSimtree(id:string){
    simtree = new SimplicityDiagram()
    const div = document.getElementById(id) as HTMLElement
    div.innerHTML = ''
    div.appendChild(simtree.elt)
    const frame = new SVGElt('rect')
    frame.setAA(['x',1,'y',1,'fill','none','stroke','blue','stroke-width',2,
                    'width',simtree.treeWidth-4,'height',simtree.treeHeight-4])
    simtree.tree.append(frame)
}
export function displaySimtree(){
    const fow = Nav.foWidth
    const w = fow - 30
    let sx = w/simtree.treeWidth
    sx = Math.min(sx,1)
    const h = sx*simtree.treeHeight
    console.log(`sim w ${w} h ${h}`)
    simtree.setAA(['width',w,'height',h])
    simtree.tree.xscale(sx,sx)
}

let that:SimplicityDiagram
export class SimplicityDiagram extends SVGElt{
    tree:InteractiveTree
    treeWidth=900
    treeHeight=400
    treeMaxBD=6
    treeNodeSize=6
    //
    selectedNodeColor='black'
    selectedLinkColor='gray'
    leftNodeColor='red'
    rightNodeColor='blue'
    //
    box:SVGText
    line1:SVGTSpan
    line2:SVGTSpan
    line3:SVGTSpan
    selectedLabel:SVGTSpan
    selected:SVGTSpan
    cmd:SVGText
    leftLabel:SVGTSpan
    leftResult:SVGTSpan
    rightLabel:SVGTSpan
    rightResult:SVGTSpan
    //
    constructor(){
        super('svg')
        that=this
        this.tree = new InteractiveTree(this,'simplicity',
            this.treeWidth,this.treeHeight,this.treeMaxBD,this.treeNodeSize,
            {bottomRoom:75},1,processSelection)
        this.tree.setAA(['x',20,'y',20])
        
        this.cmd= new SVGText()
        this.tree.append(this.cmd)
        this.cmd.setAA(['x',25,'y',this.tree.h-85,'font-size','16','stroke','cadetblue'])
        this.cmd.setV('select node')
        this.box = new SVGText()
        this.box.setAA(['x',25,'y',this.tree.h-65,'font-size','16','stroke','black','visibility','hidden'])
        this.line1= new SVGTSpan(this.box)
        this.line2= new SVGTSpan(this.box)
        this.line2.setA('y',this.treeHeight-45)
        this.line3= new SVGTSpan(this.box)
        this.line3.setA('y',this.treeHeight-25)
        this.selectedLabel = new SVGTSpan(this.line1,25)
        this.selectedLabel.setV('selected node: ')
        this.selected = new SVGTSpan(this.line1)
        this.leftLabel= new SVGTSpan(this.line2,25)
        this.leftLabel.setV('simpler left nodes:')
        this.leftLabel.setA('stroke',this.leftNodeColor)
        this.leftResult= new SVGTSpan(this.line2)
        this.rightLabel=new SVGTSpan(this.line3,25)
        this.rightLabel.setV('simpler right nodes:')
        this.rightLabel.setA('stroke',this.rightNodeColor)
        this.rightResult= new SVGTSpan(this.line3)
        this.tree.append(this.box)
    }
    processSelection(){
        if(this.tree.wasVisited.length > 1) {
            this.clearTree()
            this.tree.wasVisited=[this.tree.wasVisited[1]]   
        }
        this.setTreeSelectionColors()
        this.updateOutputBox()
    }
    updateOutputBox(){
        this.cmd.setV('select another node')
        this.box.setA('visibility','visible')
        this.selected.setV(setVal(setExp(this.tree.wasVisited[0])))
        let [left,right]=this.simplerLeftRightNodes()
        this.leftResult.setV(this.labelList(left))
        this.rightResult.setV(this.labelList(right))
    }
    clearTree(){
        this.tree.setNodeColor(this.tree.wasVisited[0],this.tree.color.base)
        this.colorSimplerNodes(this.tree.color.base)
        this.colorSimplerLinks(this.tree.color.base)
    }
    colorSimplerNodes(color:string){
        for(let nodeId of this.simplerNodes()) 
            this.tree.setNodeColor(nodeId,color)
    }
    colorSimplerLinks(color:string){
        let topNode = this.tree.wasVisited[0]
        const nodes = this.simplerNodes()
        for(let i=0;i<nodes.length;i++){
            const linkKey = `${nodes[i]}${topNode}`
            this.tree.setLinkColor(linkKey,color)
            topNode=nodes[i]
        }
    }
    setTreeSelectionColors(){
        this.tree.setNodeColor(this.tree.wasVisited[0],this.selectedNodeColor)
        this.colorSimplerLeftRightNodes()
        this.colorSimplerLinks(this.selectedLinkColor)    
    }
    simplerNodes (){
        let nodeExp = setExp(this.tree.wasVisited[0])
        let nodes:string[]=[]
        for (let i=nodeExp.length-1;i>=0;i--){
            let subExp = nodeExp.substring(0,i)
            nodes.push(expToId(subExp))
        }
        return nodes
    }
    colorSimplerLeftRightNodes(){
        let [leftNodes,rightNodes]=this.simplerLeftRightNodes()
        for(let node of leftNodes)
            this.tree.setNodeColor(node,this.leftNodeColor)
        for(let node of rightNodes)
            this.tree.setNodeColor(node,this.rightNodeColor)
    }
    simplerLeftRightNodes() {
        let keyExp = setExp(this.tree.wasVisited[0])
        let nodes = this.simplerNodes()
        let leftNodes:string[]=[]
        let rightNodes:string[]=[]
        for (let node of nodes){
            if(compareExps(setExp(node),keyExp) == 1)
                leftNodes.push(node)
            else
                rightNodes.push(node)
        }
        return [leftNodes,rightNodes]
    }
    labelList(nodes:string[]){
        let rv:string[] =[]
        for (let node of nodes)
            rv.push(setVal(setExp(node)))
        return '{'.concat(rv.join(','),'}')
    }
}

