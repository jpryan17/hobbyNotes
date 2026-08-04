import {SVGElt,SVGGrpElt,SVGText, SVGTSpan} from './svgElt.js'
import {Nav} from './navFW.js'

type Line = {size:number,pos:'L'|'C'|'R',topMargin:number,text:string}

export interface BN {
    buildDimensions:[number,number],
    outerBorderWidth:number,
    innerBorderWidth:number,
    connectWidth:number,
    color:{border:string,bg:string,fill:string,std:string},
    margin:number,
    lines:Line[]
}

export class SVGBanner extends SVGElt{
    frame:SVGElt
    grp:SVGGrpElt
    rect:SVGElt
    width=0
    height=0
    sw:number
    tBlock:SVGText
    bannerElts:SVGTSpan[]=[]
    connections:SVGElt[]=[]

    constructor(public bn:BN) {
        super('svg')
        this.sw = Nav.foWidth
        this.tBlock = new SVGText
        this.frame = new SVGElt('rect')
        this.append(this.frame)
        this.frame.setAA(['x',0,'y',0,'fill',bn.color.bg,
                        'stroke',bn.color.border,'stroke-width',bn.outerBorderWidth])
        
        this.grp =new SVGGrpElt()
        this.append(this.grp)

        this.rect = new SVGElt('rect')
        this.grp.append(this.rect)
        this.grp.append(this.tBlock)
        this.rect.setAA(['fill',bn.color.fill,
                        'stroke',bn.color.border,'stroke-width',bn.innerBorderWidth])
          
        let yp = bn.margin

        let y = this.bn.margin
        this.bannerElts = []
        this.bn.lines.forEach(line => {
            const lineWidget = new SVGTSpan(this.tBlock)
            this.bannerElts.push(lineWidget)
            lineWidget.setV(line.text)
            const color =  this.bn.color.std
            const yp = y + line.topMargin + 2/3 * line.size
            console.log(`span yp ${yp}`)
            lineWidget.setAA(['x',0,'y',yp,'font-size',line.size,'stroke',color])
            y = y + line.size + line.topMargin 
        })
        const maxWidth = this.tBlock.getBB().width
        this.width = maxWidth
        this.height = this.tBlock.getBB().height
        
        this.bn.lines.forEach((line,i)=> {
            const lineWidget = this.bannerElts[i]
            const lw = lineWidget.getBB().width
            const ct1 =  this.bn.margin + maxWidth
            const ct2 =  this.bn.margin + maxWidth/2 
            const x = (line.pos=='R')? ct1-lw : ct2-1/2*lw
            console.log(`line len ${lw} span x ${x}`)
            lineWidget.setA('x',x)
        })

        if(bn.connectWidth > 0){
            for(let i=0;i<4;i++){
                const lw = new SVGElt('line')
                lw.setAA(['stroke',bn.color.border,'stroke-width',bn.connectWidth])
                this.append(lw)
                this.connections.push(lw)
            }
        }
    }
    display(){
        const [ww,wh] = [Nav.foWidth,Nav.foHeight]
        const [dw,dh] = [ww-this.sw-1,wh-this.sw-1]
        console.log(`dw ${dw} dh ${dh}`)
        this.setAA(['width',dw,'height',dh])
        this.frame.setAA(['width',dw,'height',dh])
        const [bw,bh] = this.bn.buildDimensions
        const [sx,sy] = [dw/bw,dh/bh]
        const [gw,gh] = [this.rect.getN('width'),this.rect.getN('height')]
        const [mx,my] = [(dw-sx*gw)/2,(dh-sy*gh)/2]
        this.grp.gmoveScales(mx,my,sx,sy)
        if(this.bn.connectWidth>0){this.drawConnections()}
    } 
    drawConnections(){
        const [fx,fy,fw,fh] = this.frame.getAN(['x','y','width','height'])
        const [rw,rh] =[this.width,this.height]
        const [cw,ch] = this.bn.buildDimensions
        const [sx,sy] = [fw/cw,fh/ch]
        const [bw,bh] = [sx*rw/2,sy*rh/2]
    
        const fpts = [[fx,fy],[fx+fw,fy],[fx+fw,fy+fh,fx,fy+fh],[fx,fy+fh]]
        const [cx,cy] = [fx+fw/2,fy+fh/2]
        const bpts = [[cx-bw,cy-bh],[cx+bw,cy-bh],[cx+bw,cy+bh],[cx-bw,cy+bh]]

        for (let i=0; i<4; i++){
            const [x1,y1,x2,y2] = [fpts[i][0],fpts[i][1],bpts[i][0],bpts[i][1]]
            this.connections[i].setAA(['x1',x1,'y1',y1,'x2',x2,'y2',y2])
        }
    }
}

