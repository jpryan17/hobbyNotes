import {keyToExp,expToId} from './exputils.js'
import {InteractiveTree} from './interactiveTree.js'
import {SVGText,SVGTSpan,SVGElt,textWidth} from './svgElt.js'
import {RsOps} from './rsOps.js'
import {Nav} from './navFW.js'

let addTree:OpDiagram
export function initAddTree(id:string){
    addTree = new OpDiagram(id,'+')
    const div = document.getElementById(id) as HTMLElement
    div.innerHTML = ''
    div.appendChild(addTree.elt)
    const frame = new SVGElt('rect')
    frame.setAA(['x',1,'y',1,'fill','none','stroke','blue','stroke-width',2,
                    'width',addTree.treeWidth-4,'height',addTree.treeHeight-4])
    addTree.tree.append(frame)
}
export function displayAddTree(){
    const fow = Nav.foWidth
    const w = fow - 30
    let sx = w/addTree.treeWidth
    sx = Math.min(sx,1)
    const h = sx*addTree.treeHeight
    addTree.setAA(['width',w,'height',h])
    addTree.tree.xscale(sx,sx)
}
//
let multiplyTree:OpDiagram
export function initMultiplyTree(id:string){
    multiplyTree = new OpDiagram(id,'\u2217')
    const div = document.getElementById(id) as HTMLElement
    div.innerHTML = ''
    div.appendChild(multiplyTree.elt)
    const frame = new SVGElt('rect')
    frame.setAA(['x',1,'y',1,'fill','none','stroke','blue','stroke-width',2,
                    'width',multiplyTree.treeWidth-4,'height',multiplyTree.treeHeight-4])
    multiplyTree.tree.append(frame)
}
export function displayMultiplyTree(){
    const fow = Nav.foWidth
    const w = fow - 30
    let sx = w/multiplyTree.treeWidth
    sx = Math.min(sx,1)
    const h = sx*multiplyTree.treeHeight
    multiplyTree.setAA(['width',w,'height',h])
    multiplyTree.tree.xscale(sx,sx)
}

function processCB (){that.processCB()}
function initCB (){that.initCB()}
function middleCB (){that.middleCB()}
function showRest (){that.showRest()}

let that:OpDiagram

export class OpDiagram extends SVGElt{
    tree:InteractiveTree
    treeWidth=900
    treeHeight=400
    treeMaxBD=6
    treeNodeSize=6
    //
    op1 = ''
    op2 = ''
    fontSize = 20
    prompt = new SVGText()
    rcnt = new SVGText()
    lineA = new SVGText()
    a1 = new SVGTSpan(this.lineA)
    opA = new SVGTSpan(this.lineA)
    a2 = new SVGTSpan(this.lineA)
    eqA = new SVGTSpan(this.lineA)
    rA = new SVGTSpan(this.lineA)
    c1 = 'red'
    c2 = 'green'
    c3 = 'black'
    xp = 1
    //
    constructor(public id:string, public op:string){
        super('svg')
        that = this
        this.tree = new InteractiveTree(this,id,
                                        this.treeWidth,this.treeHeight,
                                        this.treeMaxBD,this.treeNodeSize,
                                        {bottomRoom:75,topRoom:30,antenna:true},
                                        2,processCB,initCB,middleCB)
        this.append(this.tree)
        this.init()
    }
    processCB(){
        RsOps.mc=0
        RsOps.ac=0
        RsOps.bailed = false
        this.prompt.setV('click on background to clear')
        this.setLineValues()
    }
    initCB(){
        this.lineA.setA('visibility','hidden')
        this.rcnt.setV('')
        this.tree.clearTree()
        this.prompt.setV('select the first operand')
    }
    middleCB(){
        this.prompt.setV('select the second operand')
    }

    init(){
        const xp = 10
        let yp = this.treeHeight - this.tree.bottomRoom + this.fontSize
        this.prompt.setAA(['font-size',this.fontSize,'stroke','darkblue','x',xp,'y',yp])
        this.prompt.setV('select the first operand')
        this.tree.append(this.prompt)
        const xppp =  3/5 * this.treeWidth
        this.rcnt.setAA(['font-size',16,'x',xppp,'y',yp])
        this.tree.append(this.rcnt)
        yp += this.fontSize + 10
        this.lineA.setAA(['font-size',this.fontSize,'x',xp,'y',yp,'stroke',this.c3,'visibility','hidden']) 
        this.opA.setV(this.op) 
        this.eqA.setV('=')
        this.a1.setA('stroke',this.c1)
        this.a2.setA('stroke',this.c2)
        this.tree.append(this.lineA)
    }
    setLineValues(){
        const exp1 = keyToExp(this.tree.wasVisited[0])
        this.op1 = exp1
        const exp2 = keyToExp(this.tree.wasVisited[1])
        this.op2 = exp2
        this.op2 = exp2
        const exp1F = (exp1.length==0)? '[ ]' : '['.concat(exp1,']')
        const exp2F = (exp2.length==0)? '[ ]' : '['.concat(exp2,']')
        let xp = 12
        this.a1.setA('x',xp)
        this.a1.setV(exp1F)
        xp += textWidth(exp1F,this.fontSize) + 4
        this.opA.setA('x',xp)
        xp += textWidth(this.op,this.fontSize) + 4
        this.a2.setA('x',xp)
        this.a2.setV(exp2F)
        xp += textWidth(exp2F,this.fontSize) + 4
        this.tree.setNodeColor(expToId(exp1),this.c1)
        this.tree.setNodeColor(expToId(exp2),this.c2)
        this.eqA.setA('x',xp)

        this.rcnt.setA('stroke','pink')
        this.rcnt.setV('pending ..')
        this.xp = xp += textWidth('=',this.fontSize) + 4
        window.setTimeout(showRest,100)
    }
    showRest(){
        this.rcnt.setA('stroke',this.c3)
        let rci = `(max recursion count ${RsOps.maxOps} exceeded)`
        const exp1 = keyToExp(this.tree.wasVisited[0])
        const exp2 = keyToExp(this.tree.wasVisited[1])
        const exp3 = (this.op == '+') ? RsOps.add(exp1,exp2) : RsOps.multiply(exp1,exp2)
        const exp3F = (exp3.length==0)? '[ ]' : '['.concat(exp3,']')
        if (! RsOps.bailed){
            if ((this.op == '+'))
                rci = `(addition recursion count ${RsOps.ac})`
            else
                rci = `(recursions. mult: ${RsOps.mc}   add: ${RsOps.ac})`
            if (exp3.length <= this.tree.maxBD){
                this.tree.setNodeColor(expToId(exp3),this.c3)
            } else{
                this.tree.setDirectionAntenna(exp3)
            }  
        }
        this.rA.setA('x',this.xp)
        this.rA.setV(exp3F)
        this.rcnt.setV(rci)
        this.lineA.setA('visibility','visible')
    }
    setTextWidths(texts:string[]){
        let widths:number[]=[]
        texts.forEach(txt=>{
            const w = textWidth(txt,this.fontSize)
            widths.push(w)
        })
        return widths
    }
}