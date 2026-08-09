import {Elt} from './elt.js'
import {SVGElt,SVGText,SVGTSpan, textWidth} from './svgElt.js'
import {Index,IndexItemDesc} from './navIndex.js'
import {Sed} from './editor.js'
import { initAnyDJSI, displayAnyDJSI } from './ida.js'

export class Nav {
    static app:string
    static parent:Elt|null
    static cb:Function|undefined
    static segDiv:Elt
    static frame:SVGElt
    static line:SVGElt
    static lineRect:SVGElt
    static lineBlock:SVGText
    static lineArrowButton:SVGTSpan
    static lineTopics:SVGTSpan
    static textSizeControl:SVGTSpan
    static index:SVGElt
    static indexRect:SVGElt
    static fo:SVGElt
    static indices:Index[]=[]
    static currentIndex=-1
    static indexWidth:number

    static segId:string
    static segMap:Map<string,string> = new Map()
    static lastVisits = new Map<string,number>()
    static editMode:boolean
    
    static marginLeft:number
    static marginTop:number
    static color={bg:'beige',std:'black',active:'blue',over:'purple', busy:'orange'}
    static margin={start:15,init:75,std:25,line:30}
    static foWidth:number
    static foHeight:number
    static foPadding=10
    static foBgColor='whitesmoke'
    static width:number
    static fontSize = 20
    static sideFontSize = 14
    static lineHeight = 40
    static offset = 12
    static frameMargin  = 5
    static upArrow = '\u2B9D'
    static dnArrow = '\u2B9F'
    static arrowSize = 30
    static textFontSize = 16

    constructor (app:string,parent:Elt|null=null,editMode=false,cb:Function|undefined=undefined,
                  bgC='darkgoldenrod',lineC='beige',indexC='white',foC='aliceBlue'){
        const mainSlot = document.getElementById('main-slot') as HTMLDivElement
        const textStyle = `box-sizing:border-box;width:100%;padding:${Nav.foPadding}px;font-size:${Nav.textFontSize}px;overflow:visible;`
         //
        Nav.app = app
        Nav.parent = parent
        Nav.cb = cb
        Nav.segDiv = new Elt('div')
        Nav.segDiv.setA('style',textStyle)
        Nav.editMode = editMode
        Nav.frame = new SVGElt('svg')
        Nav.line = new SVGElt('g')
        Nav.lineRect = new SVGElt('rect')
        Nav.lineBlock = new SVGText()
        Nav.lineArrowButton = new SVGTSpan(Nav.lineBlock)
        Nav.lineTopics = new SVGTSpan(Nav.lineBlock)
        Nav.textSizeControl = new SVGTSpan(Nav.lineBlock)
        Nav.textSizeControl.setAA(['visibility','hidden','pointer-events','none'])
 
        Nav.index = new SVGElt('svg')
        Nav.indexRect = new SVGElt('rect')
        Nav.fo = new SVGElt('foreignObject')
        //
        mainSlot.appendChild(Nav.frame.elt)
        Nav.frame.append(Nav.line)
        Nav.line.append(Nav.lineRect)
        Nav.line.append(Nav.lineBlock)
        Nav.frame.append(Nav.index)
        Nav.frame.append(Nav.fo)
        //
        const fm = Nav.frameMargin
        const h = Nav.lineHeight
        const y = 2*fm + h
        const xp =  Nav.margin.start
        const yp = 1/2 * Nav.lineHeight + .6 * Nav.fontSize
        Nav.frame.setA('style',`background-color:${bgC}`)
        Nav.line.setA('height',h)
        Nav.lineRect.setAA(['x',fm,'y',fm,'height',h,'fill',`${lineC}`])
        Nav.index.setAA(['x',fm,'y',y])
        Nav.indexRect.setAA(['x',0,'y',0,'fill',`${indexC}`])
        Nav.fo.setAA(['y',y,'style',`overflow-y:auto;overflow-x:hidden;background-color:${Nav.foBgColor}`])
        Nav.lineArrowButton.setAA(['x',xp,'y',yp,'stroke',Nav.color.std,'font-size',Nav.arrowSize])
        Nav.lineArrowButton.setV(Nav.dnArrow)
        Nav.lineArrowButton.elt.addEventListener('click',()=>
            {Nav.lineArrowButtonPressed()})
        Nav.lineArrowButton.elt.addEventListener('mouseover',()=>
            {Nav.lineArrowButton.setA('stroke',Nav.color.over)})
        Nav.lineArrowButton.elt.addEventListener('mouseout',()=>
            {Nav.lineArrowButton.setA('stroke',Nav.color.std)})
        //
        Nav.setTextSizeControl()
        if(Nav.editMode) { new Sed(Nav.color) }
        if(Nav.parent){ Nav.addNavLineIndexItem('Banner',Nav.toBanner) }
        //
        window.onresize = () => {Nav.display()}
        Nav.display()
    }
    //
    static toBanner(e :EventCounts){
        const mainSlot = document.getElementById('main-slot') as HTMLDivElement
        mainSlot.innerHTML = ''
        const p = Nav.parent as Elt
        mainSlot.appendChild(p.elt)
    }
    // text size control addition 
    static setTextSizeControl(){
        const controls=['[\u2191]','A','[\u2193]']
        controls.forEach(header=>{
            const widget = new SVGTSpan(Nav.textSizeControl)
            widget.setA('font-size',Nav.fontSize)
            widget.setV(header)
            if (header == 'A'){
                widget.setA('stroke',Nav.color.std)
            } else {
                widget.setA('stroke',Nav.color.active)
                widget.elt.addEventListener('mouseover',(ev)=>{
                    widget.setA('stroke',Nav.color.over)
                })
                widget.elt.addEventListener('mouseout',()=>{
                    widget.setA('stroke',Nav.color.active)
                })
                //
                if (header == '[\u2191]'){
                    widget.elt.addEventListener('click',()=> {Nav.changeTextSize('+')})
                }else if(header == '[\u2193]'){
                    widget.elt.addEventListener('click',()=> {Nav.changeTextSize('-')})
                }
            }
        })
    }
    static changeTextSize(whichWay:string){
        Nav.textFontSize += (whichWay == '+') ? 1 : -1
        const textStyle = `box-sizing:border-box;width:100%;padding:${Nav.foPadding}px;font-size:${Nav.textFontSize}px;overflow:visible;`
        Nav.segDiv.setA('style',textStyle)
    }
    static setTextSizeControlPos(lineWidth:number){
        const controlWidth = textWidth('[\u2191]A[\u2193]',Nav.fontSize)
        const xp = lineWidth - controlWidth - 10
        Nav.textSizeControl.setA('x',xp)
        return lineWidth - controlWidth - 30
    }
    //
    static display(){
        const bw = window.innerWidth - Nav.offset
        const bh = window.innerHeight - Nav.offset
        const fm = Nav.frameMargin
        const py = Nav.lineHeight + 2 * fm
        //
        Nav.frame.setAA(['width',bw,'height',bh])
        Nav.line.setA('width',bw-2*fm)
        Nav.lineRect.setA('width',bw-2*fm)
        Nav.foHeight = bh - Nav.lineHeight - 3 * fm 

        //
        const textSizeControlSize = Nav.setTextSizeControlPos(bw-2*fm)
        if (Nav.editMode){ 
            Sed.setEditControlsPos(textSizeControlSize)
        }
        //
        let indexWidth = 0
        let layoutCB = this.cb
        if(Nav.currentIndex != -1){
            const index = Nav.indices[Nav.currentIndex] 
            if(index.chosen != -1) {
                layoutCB = index.choices[index.chosen][0].layoutCB 
            }
            const indexVisible = Nav.lineArrowButton.getV() == Nav.dnArrow
            if (indexVisible){
                Nav.index.removeChildren()
                Nav.index.append(Nav.indexRect)
                Nav.index.append(index)
                indexWidth = index.getBB().width + 2 * Index.margin
                Nav.indexRect.setAA(['width',indexWidth,'height',Nav.foHeight])
             }
        }
        const foX = (indexWidth>0)?  2 * fm + indexWidth : fm
        Nav.foWidth = (indexWidth>0)? bw - 3 * fm - indexWidth : bw - 2 * fm 
        Nav.fo.setAA(['x',`${foX}`,'width',Nav.foWidth,'height',Nav.foHeight])
        displayAnyDJSI()
        if(layoutCB){
            layoutCB()
        }
    } 
    static addNavLineIndexItem(header:string,cb?:Function){
        const widget = new SVGTSpan(Nav.lineTopics)
        const [stdC,activeC] = [Nav.color.std,Nav.color.active]
        widget.setAA(['font-size',Nav.fontSize,'stroke',stdC,'pointer-events','none'])
        widget.setV(header)
        widget.elt.addEventListener('mouseover',()=>{widget.setA('stroke',Nav.color.over)})
        widget.elt.addEventListener('mouseout',()=>{
            const color = (widget.getA('pointer-events')=='none')? stdC : activeC
            widget.setA('stroke',color)
        })
        widget.elt.addEventListener('click',(ev)=>{
            if (cb) cb(ev)
            else Nav.lineItemSelectionHandler(ev)
        })
        const lineElts = Nav.lineTopics.children()
        for(let i=0; i < lineElts.length-1; i++){
            lineElts[i].setAA(['stroke',activeC,'pointer-events','auto'])
        }  
        if (cb) lineElts[0].setAA(['stroke',activeC,'pointer-events','auto'])
        Nav.showNavLine()
    }

    static lineArrowButtonPressed(){
        const v = (Nav.lineArrowButton.getV() == Nav.dnArrow)? Nav.upArrow : Nav.dnArrow
        Nav.lineArrowButton.setV(v)
        Nav.display()
    }

    static loadIndex(header:string, indexDesc:IndexItemDesc[], initialSelection=0){
        let index = new Index(indexDesc,initialSelection)
        Nav.indices.push(index)
        Nav.currentIndex = Nav.indices.length -1
        //if(header){
        Nav.addNavLineIndexItem(header)
        //}
        index.setSelectedItem()
        Nav.processSelection()
    }

    //
    static processSelection(){
        Nav.textSizeControl.setAA(['visibility','hidden','pointer-events','none'])
        if(Nav.editMode) {Sed.setEditControlStatus(false)}
        const index = Nav.indices[Nav.currentIndex]
        const selected = index.choices[index.chosen]
        const [c,w] = selected //[IndexItemDesc,SVGTSpan]
        const lineElts = Nav.lineTopics.children()
        Nav.fo.removeChildren()
        if (c.type=='index'){
            Nav.loadNewIndex(c)
        } else {
            const len = lineElts.length
            const widget =  lineElts[len-1]
            const val = widget.getV()
            if(['comments','back'].includes(val)){
                Nav.lineTopics.elt.removeChild(widget.elt)
                Nav.showNavLine()
            }
            if (c.type=='html'){
                Nav.segId = c.htmlSegmentId as string
                Nav.loadSegment()
                initAnyDJSI()
                Nav.setSegPos()
                if (Nav.editMode) {Sed.setEditControlStatus(true)}
            } else if (c.initCB){
                const diagram = c.initCB()
                Nav.fo.append(diagram)
            }
        }
        Nav.display()
    }
    static setSegPos(){
        if(Nav.lastVisits.has(Nav.segId)){
            Nav.fo.elt.scrollTop = Nav.lastVisits.get(Nav.segId) as number
        } else {
            Nav.fo.elt.scrollTop = 0
        }     
    }
    static setLastVisit(){
        const index = Nav.indices[Nav.currentIndex]
        const choice = index.choices[index.chosen][0]
        if (choice.type == 'html'){
            Nav.lastVisits.set(Nav.segId,Nav.fo.elt.scrollTop)
        }        
    }
    static loadNewIndex(choice:IndexItemDesc){
        Nav.setLastVisit()
        const indexDesc = choice.indexDesc as IndexItemDesc[]
        Nav.loadIndex(choice.topic,indexDesc,choice.indexSelection)
    }
    static loadSegment(){
        Nav.textSizeControl.setAA(['visibility','visible','pointer-events','auto'])
        const seg = (Nav.editMode) ? Nav.segMap.get(Nav.segId) 
                                    : Nav.embeddedSeg(Nav.segId)  
        if(seg){
            Nav.segDiv.elt.innerHTML = seg
            Nav.fo.removeChildren()
            Nav.fo.append(Nav.segDiv)
        }
    }
    static embeddedSeg(segId:string){
        const seg = document.getElementById(segId) as HTMLElement
        const inner = seg.innerHTML
        return inner.substring(8,inner.length-8)
    }
    static addNavLineBackButton(header:string){
        const widget = new SVGTSpan(Nav.lineTopics)
        const [stdC,activeC] = [Nav.color.std,Nav.color.active]
        widget.setAA(['font-size',Nav.fontSize,'stroke',activeC,'pointer-events','auto'])
        widget.setV(header)
        widget.elt.addEventListener('mouseover',()=>{widget.setA('stroke',Nav.color.over)})
        widget.elt.addEventListener('mouseout',()=>{
            const color = (widget.getA('pointer-events')=='none')? stdC : activeC
            widget.setA('stroke',color)
        })
        widget.elt.addEventListener('click',(ev)=>{Nav.backButtonSelectionHandler(ev)})
        Nav.showNavLine()
    }
    static lineItemSelectionHandler(ev:Event){
        const lineElts = Nav.lineTopics.children()
        const elt = ev.target as Element
        const widget = Elt.wrapper(elt)
        const widgetPos = lineElts.findIndex(w=>w==widget)
        if(widgetPos != -1){
            for (let i = lineElts.length-1; i > widgetPos; i--){
                Nav.lineTopics.elt.removeChild(lineElts[i].elt)
            }
            const [stdC,activeC] = [Nav.color.std,Nav.color.active]
            Nav.currentIndex =  widgetPos
            lineElts[widgetPos].setAA(['stroke',stdC,'pointer-events','none'])
            for (let i = 0; i < widgetPos; i++){
                lineElts[i].setAA(['stroke',activeC,'pointer-events','auto'])
            }
        }
        Nav.setLastVisit()
        Nav.showNavLine()
        const index = Nav.indices[this.currentIndex]
        index.chosen = 0
        index.setSelectedItem()
        Nav.processSelection()
    }
    static backButtonSelectionHandler(ev:Event){
        const lineElts = Nav.lineTopics.children()
        const len = lineElts.length
        Nav.lineTopics.elt.removeChild(lineElts[len-1].elt)
        Nav.showNavLine()
        Nav.processSelection()
    }
    static showNavLine(){
        let xp = Nav.margin.init 
        const yp = 1/2 * Nav.lineHeight + 1/4 * Nav.fontSize + Nav.frameMargin
        const lineElts = Nav.lineTopics.children()
        lineElts.forEach(widget => {
            const svgElt = widget as SVGElt
            const bb = svgElt.getBB()
            widget.setAA(['x',xp,'y',yp])
            xp += bb.width + Nav.margin.std  
        })
    }
    static clearNavLine(){
        Nav.lineTopics.removeChildren()
        Nav.showNavLine()
    }
}
