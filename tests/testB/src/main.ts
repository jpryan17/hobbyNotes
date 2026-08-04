import {TBox} from '../../clientLib/svgTextBox.js'
import { SVGElt, SVGText, SVGTSpan } from '../../clientLib/svgElt.js'
let tbox:TBox

function main (){
    const mainSlot = document.getElementById('main-slot') as HTMLElement
    const cv = new SVGElt('svg')
    const [ww,wh] = [window.innerWidth-20,window.innerHeight-20]
    cv.setAA(['x',0,'y',0,'width',ww,'height',wh,'style','background-color:beige'])
    mainSlot.appendChild(cv.elt)
    const text0 = "hello"
    const text1 = text0.concat(' this is not-much-more-than-not-nothing')
    const text2 = text1.concat(', but not nothing is something, is it not?')
    const text3 = text2.concat(' Well, maybe it is not at that.')
    const text4 = text3.concat(' And who knows? It could just be not that.')
    const texts = [text0,text1,text2,text3,text4]
    //texts.forEach( (text,i) => {checkTBoxLastLineFlag(cv,text,i)})
    texts.forEach( (text,i) => {checkTBoxNoHeight(cv,text,i)})

    //checkTBoxNoHeight(cv,text2,1)
}
function checkTBoxNoHeight(cv:SVGElt,text:string,pos:number){
    const w = 100
    const h = 50
    const y = 20 + pos * (h + 50)
    const txoff = [[0,true],[200,false]] as [number,boolean][]
    //const txoff = [[0,false]] as [number,boolean][]
    txoff.forEach(tx=>{
        const x = tx[0]
        const hh = (tx[1]) ? h : undefined
        const tw = new SVGText()
        tw.setAA(['x',x+5,'y',y+5,'width',w,'height',h,'stroke','blue','fill','black',
                    'font-family','Arial, Helvetica, sans-serif','font-size',12])
        cv.append(tw)
        tbox = new TBox(tw,text,w,hh)
        const bd = new SVGElt('rect')
        bd.setAA(['x',x,'y',y,'width',w,'height',h,'stroke','black','fill','none'])
        cv.append(bd)
    })
}
function checkTBoxLastLineFlag(cv:SVGElt,text:string,pos:number){
    const w = 100
    const h = 50
    const y = 20 + pos * (h + 50)
    const txoff = [[0,true],[200,false]] as [number,boolean][]
    txoff.forEach(tx=>{
        const x = tx[0]
        const tv = tx[1]
        const tw = new SVGText()
        tw.setAA(['x',x+5,'y',y+5,'width',w,'height',h,'stroke','blue','fill','black',
                    'font-family','Arial, Helvetica, sans-serif','font-size',12])
        cv.append(tw)
        tbox = new TBox(tw,text,w,h,tv)
        const bd = new SVGElt('rect')
        bd.setAA(['x',x,'y',y,'width',w,'height',h,'stroke','black','fill','none'])
        cv.append(bd)
    })
}
main()
