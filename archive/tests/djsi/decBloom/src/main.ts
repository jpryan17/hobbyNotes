
import {HF} from '../../../libs/holidayFrame.js'
import {CDQtree} from '../../../libs/cdqtree.js'
import {SVGElt, SVGGrpElt, SVGText, SVGTSpan} from '../../../libs/svgElements.js'


class DecemberBloom extends SVGGrpElt{
    tree:CDQtree
    rfDur= 60000
    rfMax= 500
    rfMin= 1
    blmDur = 15000
    dimDim = 7000
    gb = 5000

    constructor(){
        super()
        this.width = 920
        this.height = 920
        new HF(this)
        this.tree = new CDQtree(900,3,7)
        this.elt.appendChild(this.tree.elt)
        this.tree.gmove(1,1)
    }
    
    
}
async function drawCDQTreeDiagram(){
    const db = new DecemberBloom()
    let bt = Date.now()
    
    while(Date.now() -bt < db.rfDur){
        await db.tree.drip()
        const interval = 1 
        const st = Date.now()
        while(Date.now()- st < interval){
            db.tree.diffuse()
            db.tree.updateColorDisplay()
        }
    }
    
    //db.tree.setCurrentColors()
    //db.tree.updateColorDisplay()
    
    bt = Date.now()
    db.tree.saveCurrentColors()
    db.tree.setFavSelection()
    bt = Date.now()
    while(Date.now() - bt < db.blmDur){
        db.tree.savedColors.forEach((v,k)=>{
            const cd = (Date.now()-bt)
            const [ro,go,bo] = v 
            const [rm,gm,bm] = db.tree.favSelection.get(k)
            const r = ro + cd/db.blmDur * (rm-ro)
            const g = go + cd/db.blmDur * (gm-go)
            const b = bo + cd/db.blmDur * (bm-bo)

            const [l,_] = db.tree.nodeInfo.get(k)
            db.tree.nodeInfo.set(k,[l,[r,g,b]])
        })
        db.tree.updateColorDisplay()
        await db.tree.awaitFor(5)
    }
    
   
    db.tree.favSelection.forEach((v,k)=>{
        const [l,_] = db.tree.nodeInfo.get(k)
        db.tree.nodeInfo.set(k,[l,v])
    })
    db.tree.updateColorDisplay()
    await db.tree.awaitFor(1)
    
    bt = Date.now()
    
    while(Date.now() - bt < db.dimDim){
        db.tree.favSelection.forEach((v,k)=>{
            const cd = (Date.now()-bt)
            const [link,_] = db.tree.nodeInfo.get(k)
            const [ro,go,bo] = v
            const r = Math.round(ro + cd/db.dimDim * (255-ro))
            const g = Math.round(go + cd/db.dimDim * (240-go))
            const b = Math.round(bo + cd/db.dimDim * (240-bo))
            db.tree.nodeInfo.set(k,[link,[r,g,b]])
            db.tree.updateColorDisplay()
            
        })
        await db.tree.awaitFor(1)
    }
    
    db.tree.clearTreeColors()
    const text = new SVGText()
    text.setAA(['font-size',60,'stroke','red'])
    text.setV('Happy')
    const rest = new SVGTSpan(text)
    rest.setA('stroke','green')
    rest.setV(' Holidays !')
    const re = text.elt as SVGGeometryElement
    const rb = re.getBBox()
    const ree = rest.elt as SVGGeometryElement
    const rbb = ree.getBBox()
    const x = 1/2 * window.innerWidth -  rb.width
    const y = 1/2 * window.innerHeight - 1/2* rb.height
    text.setAA(['x',x,'y',y])
    db.elt.appendChild(text.elt)
    await db.tree.awaitFor(db.gb)
    /*
    bt = Date.now()
    while(Date.now() - bt < db.gb){
        const cd = (Date.now()-bt)
        const pv = Math.round(cd/db.gb * 255)
        text.setA('stroke',`rgb(255,${pv},${pv})`)
        rest.setA('stroke',`rgb(${pv},255,${pv})`)
        await db.tree.awaitFor(1)
    }
    */
    db.tree.clearTreeColors()
}

drawCDQTreeDiagram() 


