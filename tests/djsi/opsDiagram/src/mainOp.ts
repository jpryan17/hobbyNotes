import {Elt} from '../../../clientLib/elt.js'
import { setVal,expToId,setExpression} from '../../../dLib/exputils.js'
import {InteractiveTree} from '../../../dLib/interactiveTree.js'
import {SVGText,SVGTSpan} from '../../../clientLib/svgElt.js'
import {RsOps} from '../../../dLib/rsOps.js'
import {DR} from '../../../dLib/dyadicRationals.js'

let s1Color:string
let s3Color:string
let opExp=''
//let mc= 0
//let ac=0
//let maxOps = 25000000
//let bailed=false
//let bailMsg=''
let currentOp = 'addition'
let additionalDisplay = 'none '

const tree = new InteractiveTree('op',1000,500,6,6,
                                    2,processCB,initCB,middleCB)
const dh = 1000
const line=new SVGText('line',25,+dh-15)
const cmd = new SVGTSpan(line)
const res = new SVGTSpan(line,250)
const s0= new SVGTSpan(res)
const s1= new SVGTSpan(res)
const s2= new SVGTSpan(res)
const s3= new SVGTSpan(res)
const s4= new SVGTSpan(res)
const s5= new SVGTSpan(res)
const also=new SVGTSpan(line,600)
const d1= new SVGTSpan(also)
const d2= new SVGTSpan(also)
const d3= new SVGTSpan(also)
const d4= new SVGTSpan(also)
const d5= new SVGTSpan(also)

export function drawOpTreeDiagram(){ 
    setOpControls()

    const dh = 1000
    line.setA('font-size','20')
    line.setA('stroke','black')
    line.setA('x','25')
    line.setA('y',(+dh-15).toString())
    tree.elt.appendChild(line.elt)
    tree.clearOutput()
}
function initCB(){
    line.clear()
    cmd.setV('select node')
}
function middleCB(){
    s0.setV('selected: ')
    s1.setA('stroke',tree.myColor.firstSelection)
    s1.setV(setVal(setExpression(tree.wasVisited[0])))
    cmd.setV('select another')
}

function processCB(){
    RsOps.mc=0
    RsOps.ac=0
    let leftExp = setExpression(tree.wasVisited[0])
    let rightExp = setExpression(tree.wasVisited[1])
    let [c1,c2]= setColors(leftExp,rightExp)
    tree.setNodeColor(tree.wasVisited[0],c1)
    tree.setNodeColor(tree.wasVisited[1],c2)
    s0.setV('result: ')
    s1.setA('stroke',c1)
    s3.setA('stroke',c2)
    s1.setV(setVal(leftExp))
    s2.setV((currentOp=='addition') ? ' + ' : ' * ')
    s3.setV(setVal(rightExp))
    s4.setV(' = ')
    if(currentOp=='multiplication'){
        s5.setA('stroke','lightpink')
        s5.setV('pending...')
        window.setTimeout(showResult,100)
    } else
        showResult()

    function showResult(){
        opExp = (currentOp=='addition') ?
                    RsOps.add(leftExp,rightExp) : RsOps.multiply(leftExp,rightExp)
        if(RsOps.bailed){
            line.clear()
            s5.setV(opExp)
            additionalDisplay='none'
            showAdditionalDisplay()
            RsOps.bailed=false
        }
        else {
            if (opExp.length <= tree.nodeSize){
                let opVal = expToId(opExp)
                let opNode= getElementByIdOrKey(opVal) as HTMLElement
                opNode.setAttributeNS(null,'fill',tree.myColor.op)
                tree.wasVisited.push(opVal)
            } else
                tree.setDirectionAntenna(opExp)
                s5.setA('stroke',tree.myColor.op)
                s5.setV(setVal(opExp))
            showAdditionalDisplay()
        }
    }
}
function getElementByIdOrKey(idOrKey:string){
    const id = tree.setId(idOrKey)
    return document.getElementById(id)
}
function showAdditionalDisplay(){
    if (additionalDisplay=='(recursive) operations counts ')
        d1.setV(` (additions:${RsOps.ac} multiplications:${RsOps.mc}) `)
    else if(additionalDisplay =='dyadic rationals '){
        let leftExp =setExpression(tree.wasVisited[0])
        let rightExp = setExpression(tree.wasVisited[1])    
        d1.setA('stroke',s1Color)
        d3.setA('stroke',s3Color)
        d5.setA('stroke',tree.myColor.op)
        d1.setV(DR.fmtExp(leftExp))
        d2.setV((currentOp=='addition')?  ' + ' : ' * ')
        d3.setV(DR.fmtExp(rightExp))
        d4.setV(' = ')
        d5.setV(DR.fmtExp(opExp))
    } else{
        also.clear()
        if(RsOps.bailed)
            window.setTimeout(() => {RsOps.bailed=false},50)
    }
    cmd.setV('click to clear')
}
function setColors(left:string,right:string,result?:string){
    const stdLeftColor = 'lightblue'
    const repeatColor='darkturquoise'
    const stdRightColor = 'palegreen'
    const resultColor = 'black'
    if (result!=undefined && left==result && right== result)
        return [resultColor,resultColor]
    else if (left==right)
        return[repeatColor,repeatColor]
    else
        return[stdLeftColor,stdRightColor]
}

function setOpControls(){
    const opButton = document.createElement('button') as HTMLElement
    opButton.setAttributeNS(null,'id','opButton')
    opButton.innerHTML = 'operation'
    const opText = document.createElement('span') as HTMLElement
    opText.setAttributeNS(null,'id','opText')
    opText.innerHTML = ' : addition    '
    opButton.addEventListener('click', event =>{
        currentOp=(currentOp=='addition') ? 'multiplication' : 'addition'
        opText.innerHTML= ' :'.concat(currentOp,'    ')
        s2.setV((currentOp=='addition') ? ' + ' : ' * ')
        tree.clearOutput()
    })
    const showButton = document.createElement('button') as HTMLElement
    showButton.setAttributeNS(null,'id','showButton')
    showButton.innerHTML = 'additional display'
    const showText = document.createElement('span') as HTMLElement
    showText.setAttributeNS(null,'id','showText')
    showText.innerHTML = ' : none '
    showButton.addEventListener('click', event =>{
        if (additionalDisplay=='none ') 
            additionalDisplay='(recursive) operations counts '
        else if (additionalDisplay=='(recursive) operations counts ') 
            additionalDisplay='dyadic rationals '
        else 
            additionalDisplay='none '
        showText.innerHTML= ' : '.concat(additionalDisplay)
        if(tree.state==2)
            showAdditionalDisplay()
    })
    const maxOpsButton = document.createElement('button') as HTMLElement
    maxOpsButton.setAttributeNS(null,'id','maxOpsButton')
    maxOpsButton.innerHTML='max operations'
    
    maxOpsButton.addEventListener('click', event =>{
        maxOpsVisibility('visible')
    })
    
    const maxOpsText=document.createElement('input') as HTMLInputElement
    maxOpsText.type = 'number'
    maxOpsText.value = (RsOps.maxOps).toString()
    maxOpsText.setAttributeNS(null,'visibility','hidden')
    const maxOpsTextCommitButton= document.createElement('button') as HTMLElement
    maxOpsTextCommitButton.setAttributeNS(null,'visibility','hidden')
    maxOpsTextCommitButton.innerHTML='commit'
    maxOpsTextCommitButton.addEventListener('click', event =>{
        let newVal = parseInt(maxOpsText.value)
        if (newVal>50000) RsOps.maxOps = newVal
        maxOpsText.value = (RsOps.maxOps).toString()
        maxOpsVisibility('hidden')
    })
    const maxOpsTextAbortButton= document.createElement('button') as HTMLElement
    maxOpsTextAbortButton.innerHTML='abort'
    maxOpsTextAbortButton.setAttributeNS(null,'visibility','hidden')
    maxOpsTextAbortButton.addEventListener('click', event =>{
        maxOpsText.value = (RsOps.maxOps).toString()
        maxOpsVisibility('hidden')
    })
    function maxOpsVisibility(v:string){
        maxOpsText.style.visibility = v
        maxOpsTextAbortButton.style.visibility = v
        maxOpsTextCommitButton.style.visibility = v
    }
    maxOpsVisibility('hidden')
    const controls = new Elt()
    const ms = document.getElementById('main-slot')
    ms?.appendChild(controls.elt)
    controls.elt.appendChild(opButton)
    controls.elt.appendChild(opText)
    controls.elt.appendChild(showButton)
    controls.elt.appendChild(showText)
    controls.elt.appendChild(maxOpsButton)
    controls.elt.appendChild(maxOpsText)
    controls.elt.appendChild(maxOpsTextCommitButton)
    controls.elt.appendChild(maxOpsTextAbortButton)

}
