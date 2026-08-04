import {Nav} from './navFW.js'
import {keyToExp,expToId} from './exputils.js'
import {InteractiveTree} from './interactiveTree.js'
import {SVGElt, SVGText, SVGTSpan} from './svgElt.js'

function processSelection(){subtree.processSelection()}

let subtree:SubtreeDiagram

export function initSubtree(id:string){
    subtree = new SubtreeDiagram()
    const div = document.getElementById(id) as HTMLElement
    div.innerHTML = ''
    div.appendChild(subtree.elt)
    const frame = new SVGElt('rect')
    frame.setAA(['x',1,'y',1,'fill','none','stroke','blue','stroke-width',2,
                    'width',subtree.treeWidth-4,'height',subtree.treeHeight-4])
    subtree.tree.append(frame)
}
export function displaySubtree(){
    const fow = Nav.foWidth
    const w = fow - 30
    let sx = w/subtree.treeWidth
    sx = Math.min(sx,1)
    const h = sx*subtree.treeHeight
    subtree.setAA(['width',w,'height',h])
    subtree.tree.xscale(sx,sx)
}

export class SubtreeDiagram extends SVGElt{
    tree:InteractiveTree
    treeWidth=900
    treeHeight=400
    treeMaxBD=6
    treeNodeSize=6
    selectedNodeColor='black'
    leftSubtreeColor='red'
    rightSubtreeColor='blue'
    subtrees:[string[],string[]] =[[],[]]
    //
    constructor(){
        super('svg','subtree')
        this.setAA(['width',this.treeWidth,'height',this.treeHeight])
        this.tree = new InteractiveTree(this,'subtree',
                                    this.treeWidth,this.treeHeight,
                                    this.treeMaxBD,this.treeNodeSize,{},1,processSelection)
        this.tree.w = this.treeWidth
        this.tree.h = this.treeHeight + 50
        this.initOutputBox()
    }
    processSelection(){
        if(this.tree.wasVisited.length > 1) {
            this.tree.setNodeColor(this.tree.wasVisited[0],this.tree.myColor.base)
            this.clearSubtrees()
            this.tree.wasVisited=[this.tree.wasVisited[1]]   
        } 
        this.tree.setNodeColor(this.tree.wasVisited[0],this.selectedNodeColor)
        this.setSubtrees(this.tree.wasVisited[0])
        this.showSubtrees()
    }
    coloredText(textSegs:[string,string][]){
        const line = new SVGText()
        textSegs.forEach(seg=>{
            const span = new SVGTSpan(line)
            span.setV(seg[0])
            span.setA('stroke',seg[1])
        })
        return line
    }
    initOutputBox(){
        const box = this.coloredText([['select the ','cadetblue'],
                                    ['source node',this.selectedNodeColor],
                                    [' for the ','black'],
                                    ['left',this.leftSubtreeColor],
                                    [' and ','black'],
                                    ['right',this.rightSubtreeColor],
                                    [' subtrees','black']])
        box.setAA(['x',15,'y',this.treeHeight-35,'font-size',18])
        this.tree.elt.appendChild(box.elt)
    }
    clearSubtrees(){
        this.subtrees[0].forEach(e=>this.setNodeColor(e,this.tree.myColor.base))
        this.subtrees[1].forEach(e=>this.setNodeColor(e,this.tree.myColor.base))
    }
    setSubtrees(sourceNodeKey:string){
        const sourceExp = keyToExp(sourceNodeKey)
        this.subtrees = [this.subtreeNodes(sourceExp.concat('-')),
                         this.subtreeNodes(sourceExp.concat('+'))]
    }
    subtreeNodes(rootNode:string){
        let currentLength = rootNode.length
        let nodes:string[]=[rootNode]
        while(currentLength<this.tree.maxBD){
            nodes.forEach(e=>{
                if (e.length == currentLength)
                nodes.push(e.concat('-'))
                nodes.push(e.concat('+'))
            })
            currentLength++
        }
        return nodes
    }
    showSubtrees(){
        this.subtrees[0].forEach(e=>this.setNodeColor(e,this.leftSubtreeColor))
        this.subtrees[1].forEach(e=>this.setNodeColor(e,this.rightSubtreeColor))
    }
    setNodeColor(exp:string,color:string){
        this.tree.setNodeColorByExp(exp,color)
        const key = expToId(exp)
        this.tree.setNodeColor(key,color)
    } 
}

