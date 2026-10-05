import { expToId, setVal,setExp,compareExps,findCut} from './exputils.js'
import {InteractiveTree} from './interactiveTree.js'
import { Nav } from './navFW.js'
import {SVGText,SVGTSpan, SVGElt} from './svgElt.js'
import { nodeKeyToBirthdayLinePos } from './btree.js'

function init(){that.init()}
function middle(){that.middle()}
function process(){that.process()}
//
let cutTree:CutDiagram
export function initCutTree(id:string){
    cutTree = new CutDiagram()
    const div = document.getElementById(id) as HTMLElement
    div.innerHTML = ''
    div.appendChild(cutTree.elt)
    const frame = new SVGElt('rect')
    frame.setAA(['x',1,'y',1,'fill','none','stroke','blue','stroke-width',2,
                    'width',cutTree.treeWidth-4,'height',cutTree.treeHeight-4])
    cutTree.tree.append(frame)
}
export function displayCutTree(){
    const fow = Nav.foWidth
    const w = fow - 30
    let sx = w/cutTree.treeWidth
    sx = Math.min(sx,1)
    const h = sx*cutTree.treeHeight
    cutTree.setAA(['width',w,'height',h])
    cutTree.tree.xscale(sx,sx)
}

//
let that:CutDiagram
export class CutDiagram extends SVGElt{
    treeWidth=900
    treeHeight=400
    maxBD=6
    nodeSize=6
    tree:InteractiveTree
    line:SVGText
    cmd:SVGTSpan
    res:SVGTSpan
    s0:SVGTSpan
    s1:SVGTSpan
    s2:SVGTSpan
    s3:SVGTSpan
    s4:SVGTSpan
    s5:SVGTSpan
    //
    constructor(){
        super('svg')
        that = this 
        this.tree = new InteractiveTree(this,'cut',
                            this.treeWidth,this.treeHeight,this.maxBD,this.nodeSize,
                            {antenna:true,topRoom:30},2,process,init,middle,true)
        this.tree.setAA(['x',20,'y',20])
        this.line = new SVGText('line')
        this.tree.append(this.line)
        this.line.setAA(['x',40,'y',this.treeHeight-25])
        this.line.setAA(['font-size',16,'stroke','black'])
        this.tree.w = this.treeWidth
        this.tree.h = this.treeHeight + 60
        this.cmd = new SVGTSpan(this.line)
        this.res =new SVGTSpan(this.line,250)
        this.s0= new SVGTSpan(this.res)
        this.s1= new SVGTSpan(this.res)
        this.s2= new SVGTSpan(this.res)
        this.s3= new SVGTSpan(this.res)
        this.s4= new SVGTSpan(this.res)
        this.s5= new SVGTSpan(this.res)
        this.tree.clearOutput()
    }
    init(){
        this.line.clear()
        this.cmd.setV('select node')
        this.cmd.setA('stroke','blue')
    }
    middle(){
        this.s0.setV('selected: ')
        this.s1.setA('stroke',this.tree.myColor.firstSelection)
        this.s1.setV(setVal(setExp(this.tree.wasVisited[0])))
        this.cmd.setV('select another')
    }
    process(){
        const [left,leftExp,right,rightExp] = this.setLeftRight()
        const cutExp = findCut(leftExp,rightExp)
        const cut = expToId(cutExp)
        const [leftC,rightC,cutC] = ['darkred','green','black']
        const leftNode= this.tree.getTreeNode(left)
        const rightNode= this.tree.getTreeNode(right)
        leftNode.setA('fill',leftC)
        rightNode.setA('fill',rightC)
        const [bd,pos] = nodeKeyToBirthdayLinePos(cut)
        if (bd > this.maxBD) {
            if (bd > this.maxBD+1) {
                console.log('we have an unexpected birthday here!')
            } else {
                const basePos = (pos % 2 == 0) ? 1/2 * pos : 1/2 * (pos -1)
                const key = `K${bd-1}${basePos}${cut}`
                const antenna = this.tree.getTreeLink(key)
                antenna.setA('stroke',cutC)
            }
        } else {
            const cutNode= this.tree.getTreeNode(cut)
            cutNode.setA('fill',cutC)
        }

        this.s1.setA('stroke',leftC)
        this.s3.setA('stroke',rightC)
        this.s5.setA('stroke',cutC)
        this.s0.setV('result: ')
        this.s1.setV(setVal(leftExp))
        this.s2.setV(' | ')
        this.s3.setV(setVal(rightExp))
        this.s4.setV(' = ')
        this.s5.setV(setVal(cutExp))
        this.cmd.setV('click on background to clear')
        this.tree.wasVisited.push(cut)
        }    
    setLeftRight(){
        let choice = this.tree.wasVisited[1]
        let prevChoice = this.tree.wasVisited[0]
        let cx = setExp(choice)
        let px = setExp(prevChoice)
        if (compareExps(cx,px)==-1)
            return [prevChoice,px,choice,cx]
        return [choice,cx,prevChoice,px]
    }
}
