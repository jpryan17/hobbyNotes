import {SVGGrpElt,SVGElt,SVGText} from './svgElt.js'
import { expToId } from './exputils.js'

export interface BtreeParameters{
    minHorzSpace?:number
    minVertSpace?:number
    baseColor?:string
    bgColor?:string
    topRoom?:number
    bottomRoom?:number
    leftRoom?:number
    rightRoom?:number
    antenna?:boolean
    antennaColor?:string
    antennaScale?:number
}
export class Btree extends SVGGrpElt{
    maxBD:number
    nodeSize:number
    log?:HTMLElement
    minHorzSpace=2
    minVertSpace=10
    baseColor='tan'
    bgColor= 'aliceBlue'
    topRoom=20
    bottomRoom=30
    leftRoom=10
    rightRoom=10
    antenna=false
    antennaColor= this.baseColor
    antennaScale = 1

    constructor(parent:SVGElt,public id:string,public w:number,public h:number,
                maxBD:number,nodeSize:number,parms?:BtreeParameters,xp=15,yp=15){
        super()
        parent.append(this)
        this.setAA(['id',id,'x',xp,'y',yp])
        this.maxBD=maxBD
        this.nodeSize=nodeSize
        this.processOptionalParameters(parms)
        this.setTreeNodes()
        this.setTreeLinks()
        if(this.antenna)
            this.setAllAntenna()
    }
    processOptionalParameters(parms:BtreeParameters|undefined){
        if (parms==undefined)
            return
        if (parms.minHorzSpace != undefined)
            this.minHorzSpace = parms.minHorzSpace
        if (parms.minVertSpace != undefined)
            this.minVertSpace = parms.minVertSpace
        if (parms.baseColor != undefined)
            this.baseColor = parms.baseColor
        if (parms.bgColor != undefined)
            this.bgColor = parms.bgColor
        if (parms.topRoom != undefined)
            this.topRoom = parms.topRoom
        if (parms.bottomRoom != undefined)
            this.bottomRoom = parms.bottomRoom
        if (parms.leftRoom != undefined)
            this.leftRoom = parms.leftRoom
        if (parms.rightRoom != undefined)
            this.rightRoom = parms.rightRoom
        if (parms.antenna != undefined)
            this.antenna = parms.antenna
        if (parms.antennaColor != undefined)
            this.antennaColor = parms.antennaColor
        if (parms.antennaScale != undefined)
            this.antennaScale = parms.antennaScale
    }
    setTreeNodes () {
         for (let i = 0; i <= this.maxBD; i++) {
            let levelCount = Math.pow(2, i)
            for (let j = 0; j<levelCount; j++){
                let key = `K${i}${j}`
                let [x,y]=this.setNodeCenter(i,j)
                this.setNodeCircle(x,y,this.nodeSize,this.baseColor,key)
            }
        }
    }
    getTreeNode(key:string){
        let nodes = Array.from(this.children()) as SVGElt[]
        let m = 0
        nodes.forEach((node,i)=>{
            if (node.getA('id') == key && node.getA('class') == 'node'){
                 m = i
            }
        })
        return nodes[m]
    }
    setNodeCenter(bd:number,pos:number){
        let areaWidth = this.w - (this.leftRoom + this.rightRoom)
        let areaHeight = this.h - (this.topRoom + this.bottomRoom)
        let levelSize = areaHeight/(this.maxBD+1) 
        let levelCount = Math.pow(2, bd)
        let levelWidth = areaWidth/levelCount
        let x = (pos + 1/2) * levelWidth + this.leftRoom
        let y = +this.h - (this.bottomRoom +(bd + 1/2)* levelSize)
        return [x,y]
    }
    setTreeLinks(){
        for (let i = 0; i < this.maxBD; i++) {
            let levelCount = Math.pow(2, i)
            for (let j = 0; j<levelCount; j++){
                this.setNodeLinks(i,j)
             }
        } 
    }
    getTreeLink(key:string){
        let links = Array.from(this.children()) as SVGElt[]
        let m = 0
        links.forEach((link,i)=>{
            if (link.getA('id') == key && link.getA('class') == 'link'){
                 m = i
            }
        })
        return links[m]
    }
    setNodeLinks(bd:number,pos:number){
        let k1= `K${bd}${pos}K${bd+1}${pos*2}`
        let k2= `K${bd}${pos}K${bd+1}${pos*2+1}`
        let [lx,ly,lxx,lyy] = this.setNodeLink(bd,pos,bd+1,pos*2)
        let [rx,ry,rxx,ryy] = this.setNodeLink(bd,pos,bd+1,pos*2+1)
        this.setLine(lx,ly,lxx,lyy,this.baseColor,k1)
        this.setLine(rx,ry,rxx,ryy,this.baseColor,k2)
    } 
    setNodeLink(bd:number,pos:number,bd1:number,pos1:number,topOffsetDir?:number){
        let [x,y]= this.setNodeCenter(bd,pos)
        let [xx,yy]= this.setNodeCenter(bd1,pos1)
        return trimLink(x,y,xx,yy,this.nodeSize,topOffsetDir)
    }
    setNodeColor(key:string, color:string) {
        const node = this.getTreeNode(key)
        node.setA('fill',color)
    }
    setNodeColorByExp(exp:string,color:string){
        const key = expToId(exp)
        this.setNodeColor(key,color)
    } 
    setLinkColor (key:string, color:string) {
        const link = this.getTreeLink(key)
        link.setA('stroke',color)
    }
    setAllAntenna(){
        const levelCount = Math.pow(2,this.maxBD)
        for (let j = 0; j<levelCount; j++){
            const bd = this.maxBD
            const [x1,y1,xx1,yy1]=this.setNodeLink(bd,j,bd+1,j*2,-1)
            const k1= `K${bd}${j}K${bd+1}${j*2}`
            this.setLine(x1,y1,xx1,yy1,this.antennaColor,k1)
            const [x2,y2,xx2,yy2]=this.setNodeLink(this.maxBD,j,this.maxBD+1,j*2+1,-1)
            const k2= `K${bd}${j}K${bd+1}${j*2+1}`
            this.setLine(x2,y2,xx2,yy2,this.antennaColor,k2)
        }
    }
    setLine(x1:number,y1:number,x2:number,y2:number,c:string,id?:string,cl='link'){
        const ln = new SVGElt('line')
        ln.setAA(['x1',x1,'y1',y1,'x2',x2,'y2',y2,'stroke',c,'class',cl])
        if (id!=undefined) 
            ln.setA('id',id)
        this.append(ln)
        return ln
    }
    setNodeCircle (cx:number,cy:number,radius:number,fill:string,id?:string){
        const cc = new SVGElt('circle')
        cc.setAA(['cx',cx,'cy',cy,'r',radius,'fill',fill,'class','node'])
        if (id!=undefined) 
            cc.setA('id',id)
         this.append(cc)
        return cc
    }
    setText (x:number,y:number,label:string,color:string,fontSize?:number){
        const nodeLabel = new SVGText()
        nodeLabel.setAA(['x',x,'y',y,'stroke',color])
        if (fontSize) nodeLabel.setA('font-size',fontSize)
        nodeLabel.setV(label)
        this.append(nodeLabel)
        return nodeLabel
    } 
}
function trimLink(ax:number,ay:number,bx:number,by:number,rad:number,topOffsetDir?:number){
    let len = Math.sqrt(Math.pow(bx-ax,2) + Math.pow(by-ay,2))
    let p = rad/len
    let dx = p*(bx-ax)
    let dy = p*(by-ay)
    let dir = (topOffsetDir==undefined)? -1 : topOffsetDir
    return [ax+dx,ay+dy,bx+dir*dx,by+dir*dy]
}  
export function nodeKeyToBirthdayLinePos(id:string){
    let bd = Number(id.substring(1,2))
    let lp = Number(id.substring(2))
    return [bd,lp]
} 
export function setColor(id:string,color:string): void{
    let elt =document.getElementById(id) as HTMLElement
    elt.setAttributeNS(null,'fill',color)
}
export function log (msg:string){
    let logElt = document.getElementById('log') as HTMLElement
    let info =  logElt.innerHTML
    logElt.innerHTML= info.concat('<br>',msg)
}
