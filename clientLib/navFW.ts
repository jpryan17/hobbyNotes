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
    static returnControl:SVGTSpan
    static index:SVGElt
    static indexRect:SVGElt
    static foRect:SVGElt
    static fo:SVGElt
    static indices:Index[]=[]
    static currentIndex=-1
    static indexWidth:number

    static segId:string
    static segMap:Map<string,string> = new Map()
    static lastVisits = new Map<string,number>()
    static editMode:boolean
    static isReturning = false
    static returningScrollTop = 0
    static devLine: SVGElt
    static devLineRect: SVGElt
    static devLineBlock: SVGText
    static devLineHeight = 36
    
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
    static offset = 30
    static frameMargin  = 5
    static upArrow = '\u2B9D'
    static dnArrow = '\u2B9F'
    static arrowSize = 30
    static textFontSize = 16

    static getTextStyle(){
        const bPad = Nav.editMode ? 95 : 50
        return `background-color:${Nav.foBgColor};box-sizing:border-box;width:100%;min-height:100%;padding:${Nav.foPadding}px ${Nav.foPadding + 5}px ${bPad}px ${Nav.foPadding + 5}px;font-size:${Nav.textFontSize}px;display:flow-root;`
    }

    constructor (app:string,parent:Elt|null=null,editMode=false,cb:Function|undefined=undefined,
                  bgC='darkgoldenrod',lineC='beige',indexC='white',foC='aliceBlue'){
        const mainSlot = document.getElementById('main-slot') as HTMLDivElement
         //
        Nav.app = app
        Nav.parent = parent
        Nav.cb = cb
        Nav.editMode = editMode
        Nav.segDiv = new Elt('div')
        Nav.segDiv.setA('style',Nav.getTextStyle())
        Nav.frame = new SVGElt('svg')
        Nav.line = new SVGElt('g')
        Nav.lineRect = new SVGElt('rect')
        Nav.lineBlock = new SVGText()
        Nav.lineArrowButton = new SVGTSpan(Nav.lineBlock)
        Nav.lineTopics = new SVGTSpan(Nav.lineBlock)
        Nav.textSizeControl = new SVGTSpan(Nav.lineBlock)
        Nav.textSizeControl.setAA(['visibility','hidden','pointer-events','none'])
        Nav.returnControl = new SVGTSpan(Nav.lineBlock)
        Nav.returnControl.setAA(['visibility','hidden','pointer-events','none'])

        if (Nav.editMode) {
            Nav.devLine = new SVGElt('g')
            Nav.devLineRect = new SVGElt('rect')
            Nav.devLineBlock = new SVGText()
        }

        Nav.index = new SVGElt('svg')
        Nav.indexRect = new SVGElt('rect')
        Nav.foRect = new SVGElt('rect')
        Nav.fo = new SVGElt('foreignObject')
        //
        mainSlot.appendChild(Nav.frame.elt)
        Nav.frame.append(Nav.line)
        Nav.line.append(Nav.lineRect)
        Nav.line.append(Nav.lineBlock)
        if (Nav.editMode) {
            Nav.frame.append(Nav.devLine)
            Nav.devLine.append(Nav.devLineRect)
            Nav.devLine.append(Nav.devLineBlock)
        }
        Nav.frame.append(Nav.index)
        Nav.frame.append(Nav.foRect)
        Nav.frame.append(Nav.fo)
        //
        const fm = Nav.frameMargin
        const h = Nav.lineHeight
        const devH = Nav.editMode ? Nav.devLineHeight : 0
        const yDev = 2 * fm + h
        const y = Nav.editMode ? (3 * fm + h + devH) : (2 * fm + h)
        const xp =  Nav.margin.start
        const yp = 1/2 * Nav.lineHeight + .6 * Nav.fontSize
        Nav.frame.setA('style',`background-color:${bgC}`)
        Nav.line.setA('height',h)
        Nav.lineRect.setAA(['x',fm,'y',fm,'height',h,'fill',`${lineC}`])
        if (Nav.editMode) {
            Nav.devLine.setA('height', devH)
            Nav.devLineRect.setAA(['x', fm, 'y', yDev, 'height', devH, 'fill', '#fef9c3'])
        }
        Nav.index.setAA(['x',fm,'y',y])
        Nav.indexRect.setAA(['x',0,'y',0,'fill',`${indexC}`])
        Nav.foRect.setAA(['y',y,'fill',`${Nav.foBgColor}`])
        Nav.fo.setAA(['y',y,'style',`overflow-y:auto;overflow-x:hidden;`])
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
        Nav.setReturnControl()
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
    static setReturnControl(){
        Nav.returnControl.setA('font-size', Nav.fontSize)
        Nav.returnControl.setV('> [\u21BA Return]')
        Nav.returnControl.setAA(['stroke', Nav.color.active, 'pointer-events', 'none', 'visibility', 'hidden'])
        Nav.returnControl.elt.addEventListener('mouseover', () => {
            Nav.returnControl.setA('stroke', Nav.color.over)
        })
        Nav.returnControl.elt.addEventListener('mouseout', () => {
            Nav.returnControl.setA('stroke', Nav.color.active)
        })
        Nav.returnControl.elt.addEventListener('click', (ev: Event) => {
            ev.stopPropagation()
            Nav.scrollToLectureDialogue()
        })
    }
    static onFoScroll = () => {
        Nav.updateReturnControlVisibility()
    }
    static updateReturnControlVisibility() {
        if (!Nav.fo || !Nav.fo.elt) return
        const scrollTop = Nav.fo.elt.scrollTop
        const hasOpenDetails = document.querySelector('details[open]') !== null
        
        if (Nav.isReturning) {
            if (hasOpenDetails) {
                Nav.isReturning = false
            } else {
                Nav.returnControl.setAA(['visibility', 'hidden', 'pointer-events', 'none'])
                Nav.showNavLine()
                return
            }
        }

        // Return button appears ONLY when a hidden <details> section is expanded!
        if (hasOpenDetails) {
            Nav.returnControl.setAA(['visibility', 'visible', 'pointer-events', 'auto'])
        } else {
            Nav.returnControl.setAA(['visibility', 'hidden', 'pointer-events', 'none'])
        }
        Nav.showNavLine()
    }
    static scrollToLectureDialogue(){
        const openDetails = Array.from(document.querySelectorAll('details[open]'))
        if (openDetails.length === 0) return

        // 1. Check if the innermost open details is nested inside another open details
        const innermost = openDetails[openDetails.length - 1] as HTMLDetailsElement
        const parentOpen = innermost.parentElement?.closest('details[open]') as HTMLDetailsElement | null

        if (parentOpen) {
            // Nested details case: collapse ONLY this nested details
            innermost.open = false

            // Scroll cleanly back to this nested details' previous position (its summary/header)
            innermost.scrollIntoView({ behavior: 'auto', block: 'start' })

            if (Nav.fo && Nav.fo.elt) {
                Nav.returningScrollTop = Nav.fo.elt.scrollTop
            }

            // Keep returnControl visible and active because parent details remains open!
            Nav.isReturning = false
            Nav.updateReturnControlVisibility()
            return
        }

        // 2. Outermost (root) details case: collapse all open details
        openDetails.forEach(d => {
            (d as HTMLDetailsElement).open = false
        })

        // 3. Set returning state flag & immediately hide returnControl
        Nav.isReturning = true
        Nav.returnControl.setAA(['visibility', 'hidden', 'pointer-events', 'none'])
        Nav.showNavLine()

        // 4. Scroll cleanly to lecture dialogue anchor or outermost details
        const anchor = document.getElementById('jillQuestionAnchor') || document.querySelector('a[name="jillQuestionAnchor"]')
        if (anchor) {
            anchor.scrollIntoView({ behavior: 'auto', block: 'start' })
        } else {
            const prev = innermost.previousElementSibling
            if (prev) {
                prev.scrollIntoView({ behavior: 'auto', block: 'start' })
            } else {
                innermost.scrollIntoView({ behavior: 'auto', block: 'start' })
            }
        }

        if (Nav.fo && Nav.fo.elt) {
            Nav.returningScrollTop = Nav.fo.elt.scrollTop
        }

        // 5. Confirm returnControl remains hidden
        setTimeout(() => {
            Nav.returnControl.setAA(['visibility', 'hidden', 'pointer-events', 'none'])
            Nav.showNavLine()
        }, 150)
    }
    static changeTextSize(whichWay:string){
        Nav.textFontSize += (whichWay == '+') ? 1 : -1
        Nav.segDiv.setA('style',Nav.getTextStyle())
    }
    static setTextSizeControlPos(lineWidth:number){
        const controlWidth = textWidth('[\u2191]A[\u2193]',Nav.fontSize)
        const xp = lineWidth - controlWidth - 10
        Nav.textSizeControl.setA('x',xp)
        Nav.textSizeControl.setAA(['visibility','visible','pointer-events','auto'])
        return xp - 20
    }
    //
    static display(){
        const bw = window.innerWidth - Nav.offset
        const bh = window.innerHeight - Nav.offset
        const fm = Nav.frameMargin
        const devH = Nav.editMode ? Nav.devLineHeight : 0
        const y = Nav.editMode ? (3 * fm + Nav.lineHeight + devH) : (2 * fm + Nav.lineHeight)
        //
        Nav.frame.setAA(['width',bw,'height',bh])
        Nav.line.setA('width',bw-2*fm)
        Nav.lineRect.setA('width',bw-2*fm)
        if (Nav.editMode && Nav.devLine) {
            Nav.devLine.setA('width', bw - 2 * fm)
            Nav.devLineRect.setA('width', bw - 2 * fm)
        }
        Nav.foHeight = bh - Nav.lineHeight - (Nav.editMode ? devH + 4 * fm : 3 * fm) 

        //
        const textSizeControlSize = Nav.setTextSizeControlPos(bw-2*fm)
        if (Nav.editMode){ 
            Sed.setEditControlsPos(bw - 2 * fm)
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
        Nav.index.setAA(['x', fm, 'y', y])
        Nav.foRect.setAA(['x',`${foX}`,'y',y,'width',Nav.foWidth,'height',Nav.foHeight])
        Nav.fo.setAA(['x',`${foX}`,'y',y,'width',Nav.foWidth,'height',Nav.foHeight])
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
        const label = choice.navTopic || choice.topic
        Nav.loadIndex(label,indexDesc,choice.indexSelection)
    }
    static async loadSegment(){
        Nav.textSizeControl.setAA(['visibility','visible','pointer-events','auto'])
        Nav.fo.setA('style', 'overflow-y:auto;overflow-x:hidden;')
        let seg = (Nav.editMode) ? Nav.segMap.get(Nav.segId) 
                                    : Nav.embeddedSeg(Nav.segId)  
        if (!seg && Nav.editMode) {
            seg = Nav.embeddedSeg(Nav.segId)
        }
        if (!seg) {
            try {
                const res = await fetch(`/api/segment-content/${Nav.segId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.content) {
                        seg = data.content;
                        Nav.segMap.set(Nav.segId, seg);
                    }
                }
            } catch (err) {
                console.warn(`[Nav.loadSegment] Dynamic fetch for ${Nav.segId} failed:`, err);
            }
        }
        if(seg){
            Nav.segDiv.setA('style', Nav.getTextStyle())
            Nav.segDiv.elt.innerHTML = seg
            Nav.fo.removeChildren()
            Nav.fo.append(Nav.segDiv)
            initAnyDJSI()
            if ((window as any).MathJax?.typesetPromise) {
                (window as any).MathJax.typesetPromise([Nav.segDiv.elt]).catch((err: any) => console.log('MathJax typeset error:', err));
            }
        } else {
            Nav.segDiv.elt.innerHTML = `
                <div style="padding: 40px 20px; text-align: center; color: #64748b; font-family: sans-serif;">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">📄</div>
                    <h3 style="color: #0f172a; margin-bottom: 6px;">Segment "${Nav.segId || 'Unknown'}" Not Loaded</h3>
                    <p style="font-size: 0.92rem; max-width: 500px; margin: 0 auto 16px; line-height: 1.5;">
                        The segment file <code>${Nav.segId}.html</code> was not found in active cache. Please verify that the file exists in <code>app1/segs/</code>.
                    </p>
                </div>
            `;
            Nav.fo.removeChildren()
            Nav.fo.append(Nav.segDiv)
        }
        if (Nav.fo && Nav.fo.elt) {
            Nav.fo.elt.removeEventListener('scroll', Nav.onFoScroll)
            Nav.fo.elt.addEventListener('scroll', Nav.onFoScroll)
            Nav.fo.elt.removeEventListener('toggle', Nav.onFoScroll, true)
            Nav.fo.elt.addEventListener('toggle', Nav.onFoScroll, true)
            Nav.segDiv.elt.removeEventListener('toggle', Nav.onFoScroll, true)
            Nav.segDiv.elt.addEventListener('toggle', Nav.onFoScroll, true)
            Nav.segDiv.elt.removeEventListener('click', Nav.onFoScroll, true)
            Nav.segDiv.elt.addEventListener('click', Nav.onFoScroll, true)
            setTimeout(() => { Nav.updateReturnControlVisibility() }, 100)
        }
    }
    static embeddedSeg(segId:string){
        const seg = document.getElementById(segId) as HTMLElement | HTMLTemplateElement | null
        if (!seg) return ''
        if (seg.tagName.toLowerCase() === 'template') {
            return (seg as HTMLTemplateElement).innerHTML
        }
        const inner = seg.innerHTML
        if (inner.startsWith('<!--SEG') && inner.endsWith('SEG-->')) {
            return inner.substring(8, inner.length - 8)
        }
        return inner
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
            while (Nav.indices.length > widgetPos + 1) {
                Nav.indices.pop()
            }
            const [stdC,activeC] = [Nav.color.std,Nav.color.active]
            Nav.currentIndex = widgetPos
            lineElts[widgetPos].setAA(['stroke',stdC,'pointer-events','none'])
            for (let i = 0; i < widgetPos; i++){
                lineElts[i].setAA(['stroke',activeC,'pointer-events','auto'])
            }
        }
        Nav.setLastVisit()
        Nav.showNavLine()
        const index = Nav.indices[Nav.currentIndex]
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
        if (Nav.returnControl) {
            Nav.returnControl.setAA(['x', xp, 'y', yp])
        }
    }
    static clearNavLine(){
        Nav.lineTopics.removeChildren()
        Nav.showNavLine()
    }
}
