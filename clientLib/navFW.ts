import {Elt} from './elt.js'
import {SVGElt,SVGText,SVGTSpan, textWidth} from './svgElt.js'
import {Index,IndexItemDesc} from './navIndex.js'
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
    static overviewControl:SVGTSpan
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
    static editMode:boolean = false
    static isReturning = false
    static returningScrollTop = 0
    
    static marginLeft:number
    static marginTop:number
    static color = {
        bg: '#ffffff',
        std: '#0f172a',
        active: '#0284c7',
        over: '#0369a1',
        busy: '#d97706',
        muted: '#64748b',
        border: '#e2e8f0',
        frame: '#f1f5f9'
    }
    static margin = { start: 16, init: 60, std: 14, line: 30 }
    static foWidth: number
    static foHeight: number
    static foPadding = 14
    static foBgColor = '#ffffff'
    static width: number
    static fontSize = 14
    static sideFontSize = 13.5
    static lineHeight = 44
    static offset = 24
    static frameMargin = 6
    static upArrow = '▶'
    static dnArrow = '☰'
    static isIndexVisible = true
    static arrowSize = 18
    static textFontSize = 16

    static getTextStyle(){
        const bPad = 50
        return `background-color:${Nav.foBgColor};box-sizing:border-box;width:100%;min-height:100%;padding:${Nav.foPadding}px ${Nav.foPadding + 8}px ${bPad}px ${Nav.foPadding + 8}px;font-size:${Nav.textFontSize}px;font-family:-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;line-height:1.6;display:flow-root;`
    }

    constructor (app:string,parent:Elt|null=null,editMode=false,cb:Function|undefined=undefined,
                  bgC='#f1f5f9',lineC='#ffffff',indexC='#f8fafc',foC='#ffffff'){
        const mainSlot = document.getElementById('main-slot') as HTMLDivElement
         //
        Nav.app = app
        Nav.parent = parent
        Nav.cb = cb
        Nav.editMode = false
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
        Nav.overviewControl = new SVGTSpan(Nav.lineBlock)
        Nav.overviewControl.setAA(['visibility','hidden','pointer-events','none'])

        Nav.index = new SVGElt('svg')
        Nav.indexRect = new SVGElt('rect')
        Nav.foRect = new SVGElt('rect')
        Nav.fo = new SVGElt('foreignObject')
        //
        mainSlot.appendChild(Nav.frame.elt)
        Nav.frame.append(Nav.line)
        Nav.line.append(Nav.lineRect)
        Nav.line.append(Nav.lineBlock)
        Nav.frame.append(Nav.index)
        Nav.frame.append(Nav.foRect)
        Nav.frame.append(Nav.fo)
        //
        const fm = Nav.frameMargin
        const h = Nav.lineHeight
        const y = 2 * fm + h
        const xp = Nav.margin.start
        const yp = 1/2 * Nav.lineHeight + .35 * Nav.fontSize + fm
        Nav.frame.setA('style',`background-color:${bgC}`)
        Nav.line.setA('height',h)
        Nav.lineRect.setAA(['x',fm,'y',fm,'height',h,'fill',`${lineC}`,'rx',8,'ry',8,'stroke',Nav.color.border,'stroke-width',1])
        Nav.index.setAA(['x',fm,'y',y])
        Nav.indexRect.setAA(['x',0,'y',0,'fill',`${indexC}`,'rx',6,'ry',6,'stroke',Nav.color.border,'stroke-width',1])
        Nav.foRect.setAA(['y',y,'fill',`${Nav.foBgColor}`,'rx',8,'ry',8,'stroke',Nav.color.border,'stroke-width',1])
        Nav.fo.setAA(['y',y,'style',`overflow-y:auto;overflow-x:hidden;`])
        Nav.isIndexVisible = true
        Nav.lineArrowButton.setAA([
            'x', xp,
            'y', yp,
            'fill', Nav.color.active,
            'font-size', Nav.arrowSize,
            'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-weight', 'bold',
            'cursor', 'pointer'
        ])
        Nav.updateArrowButton()
        Nav.lineArrowButton.elt.addEventListener('click',()=>
            {Nav.lineArrowButtonPressed()})
        Nav.lineArrowButton.elt.addEventListener('mouseover',()=>
            {Nav.lineArrowButton.setA('fill',Nav.color.over)})
        Nav.lineArrowButton.elt.addEventListener('mouseout',()=>
            {Nav.lineArrowButton.setA('fill',Nav.color.active)})
        //
        Nav.setTextSizeControl()
        Nav.setReturnControl()
        Nav.setOverviewControl()
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
        const controls = ['A−', 'A+']
        controls.forEach(header => {
            const widget = new SVGTSpan(Nav.textSizeControl)
            widget.setAA([
                'font-size', Nav.fontSize,
                'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                'font-weight', '600',
                'fill', Nav.color.muted,
                'cursor', 'pointer'
            ])
            widget.setV(` ${header} `)
            const titleElt = document.createElementNS('http://www.w3.org/2000/svg', 'title')
            titleElt.textContent = header === 'A−' ? 'Decrease text size' : 'Increase text size'
            widget.elt.appendChild(titleElt)
            widget.elt.addEventListener('mouseover', () => widget.setA('fill', Nav.color.active))
            widget.elt.addEventListener('mouseout', () => widget.setA('fill', Nav.color.muted))
            if (header === 'A−') {
                widget.elt.addEventListener('click', () => Nav.changeTextSize('-'))
            } else {
                widget.elt.addEventListener('click', () => Nav.changeTextSize('+'))
            }
        })
    }
    static setReturnControl(){
        Nav.returnControl.setAA([
            'font-size', Nav.fontSize,
            'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-weight', '700',
            'fill', '#059669',
            'pointer-events', 'none',
            'visibility', 'hidden',
            'cursor', 'pointer'
        ])
        Nav.returnControl.setV('↺ Return to Dialogue')
        const retTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title')
        retTitle.textContent = 'Collapse open details and return to lecture text'
        Nav.returnControl.elt.appendChild(retTitle)
        Nav.returnControl.elt.addEventListener('mouseover', () => {
            Nav.returnControl.setA('fill', '#047857')
        })
        Nav.returnControl.elt.addEventListener('mouseout', () => {
            Nav.returnControl.setA('fill', '#059669')
        })
        Nav.returnControl.elt.addEventListener('click', (ev: Event) => {
            ev.stopPropagation()
            Nav.scrollToLectureDialogue()
        })
    }
    static setOverviewControl(){
        Nav.overviewControl.setAA([
            'font-size', Nav.fontSize,
            'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-weight', '600',
            'fill', Nav.color.muted,
            'pointer-events', 'auto',
            'visibility', 'visible',
            'cursor', 'pointer'
        ])
        Nav.overviewControl.setV('⌂ Overview')
        const ovTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title')
        ovTitle.textContent = 'Open Overview'
        Nav.overviewControl.elt.appendChild(ovTitle)
        Nav.overviewControl.elt.addEventListener('mouseover', () => {
            Nav.overviewControl.setA('fill', Nav.color.active)
        })
        Nav.overviewControl.elt.addEventListener('mouseout', () => {
            Nav.overviewControl.setA('fill', Nav.color.muted)
        })
        Nav.overviewControl.elt.addEventListener('click', (ev: Event) => {
            ev.stopPropagation()
            window.location.href = './overview.html'
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
        const yp = 1/2 * Nav.lineHeight + .35 * Nav.fontSize + Nav.frameMargin
        const controlWidth = textWidth('A− A+', Nav.fontSize)
        const xp = lineWidth - controlWidth - 14
        Nav.textSizeControl.setAA(['x', xp, 'y', yp, 'visibility', 'visible', 'pointer-events', 'auto'])

        if (Nav.overviewControl) {
            const ovWidth = textWidth('⌂ Overview', Nav.fontSize)
            const ovXp = xp - ovWidth - 22
            Nav.overviewControl.setAA(['x', ovXp, 'y', yp, 'visibility', 'visible', 'pointer-events', 'auto'])
            return ovXp - 20
        }

        return xp - 20
    }
    //
    static display(){
        const bw = window.innerWidth - Nav.offset
        const bh = window.innerHeight - Nav.offset
        const fm = Nav.frameMargin
        const y = 2 * fm + Nav.lineHeight
        //
        Nav.frame.setAA(['width',bw,'height',bh])
        Nav.line.setA('width',bw-2*fm)
        Nav.lineRect.setA('width',bw-2*fm)
        Nav.foHeight = bh - Nav.lineHeight - 3 * fm 

        //
        const textSizeControlSize = Nav.setTextSizeControlPos(bw-2*fm)
        //
        let indexWidth = 0
        let layoutCB = this.cb
        if(Nav.currentIndex != -1){
            const index = Nav.indices[Nav.currentIndex] 
            if(index.chosen != -1) {
                layoutCB = index.choices[index.chosen][0].layoutCB 
            }
            if (Nav.isIndexVisible){
                Nav.index.removeChildren()
                Nav.index.append(Nav.indexRect)
                Nav.index.append(index)
                indexWidth = index.getBB().width + 2 * Index.margin
                Nav.indexRect.setAA(['width',indexWidth,'height',Nav.foHeight])
                Nav.index.setAA(['visibility', 'visible'])
            } else {
                Nav.index.removeChildren()
                Nav.index.setAA(['visibility', 'hidden'])
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
        window.dispatchEvent(new CustomEvent('nav-display-resize'));
    } 
    static addNavLineIndexItem(header:string,cb?:Function){
        const widget = new SVGTSpan(Nav.lineTopics)
        const [stdC,activeC] = [Nav.color.std,Nav.color.active]
        const isFirst = Nav.lineTopics.children().length === 0
        const displayLabel = isFirst ? header : `›  ${header}`
        widget.setAA([
            'font-size', Nav.fontSize,
            'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-weight', '700',
            'fill', stdC,
            'pointer-events', 'none'
        ])
        widget.setV(displayLabel)
        widget.elt.addEventListener('mouseover',()=>{widget.setA('fill',Nav.color.over)})
        widget.elt.addEventListener('mouseout',()=>{
            const color = (widget.getA('pointer-events')=='none')? stdC : activeC
            widget.setA('fill',color)
        })
        widget.elt.addEventListener('click',(ev)=>{
            if (cb) cb(ev)
            else Nav.lineItemSelectionHandler(ev)
        })
        const lineElts = Nav.lineTopics.children()
        for(let i=0; i < lineElts.length-1; i++){
            lineElts[i].setAA(['fill',activeC,'font-weight','600','pointer-events','auto','cursor','pointer'])
        }  
        if (cb) lineElts[0].setAA(['fill',activeC,'font-weight','600','pointer-events','auto','cursor','pointer'])
        Nav.showNavLine()
    }

    static updateArrowButton(){
        const glyph = Nav.isIndexVisible ? Nav.dnArrow : Nav.upArrow
        const tooltip = Nav.isIndexVisible ? 'Collapse index' : 'Expand index'
        Nav.lineArrowButton.setV(glyph)
        const titleElt = document.createElementNS('http://www.w3.org/2000/svg', 'title')
        titleElt.textContent = tooltip
        Nav.lineArrowButton.elt.appendChild(titleElt)
    }

    static lineArrowButtonPressed(){
        Nav.isIndexVisible = !Nav.isIndexVisible
        Nav.updateArrowButton()
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
        let seg = Nav.embeddedSeg(Nav.segId)  
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
                        The segment template <code>${Nav.segId}</code> was not found in active cache.
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
        widget.setAA([
            'font-size', Nav.fontSize,
            'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'font-weight', '600',
            'fill', activeC,
            'pointer-events', 'auto',
            'cursor', 'pointer'
        ])
        widget.setV(`‹  ${header}`)
        const backTitle = document.createElementNS('http://www.w3.org/2000/svg', 'title')
        backTitle.textContent = `Back to ${header}`
        widget.elt.appendChild(backTitle)
        widget.elt.addEventListener('mouseover',()=>{widget.setA('fill',Nav.color.over)})
        widget.elt.addEventListener('mouseout',()=>{
            const color = (widget.getA('pointer-events')=='none')? stdC : activeC
            widget.setA('fill',color)
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
            lineElts[widgetPos].setAA(['fill',stdC,'font-weight','700','pointer-events','none','cursor','default'])
            for (let i = 0; i < widgetPos; i++){
                lineElts[i].setAA(['fill',activeC,'font-weight','600','pointer-events','auto','cursor','pointer'])
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
        const yp = 1/2 * Nav.lineHeight + .35 * Nav.fontSize + Nav.frameMargin
        const lineElts = Nav.lineTopics.children()
        lineElts.forEach(widget => {
            const svgElt = widget as SVGElt
            const bb = svgElt.getBB()
            widget.setAA(['x',xp,'y',yp])
            xp += bb.width + Nav.margin.std  
        })
        if (Nav.returnControl) {
            Nav.returnControl.setAA(['x', xp + 10, 'y', yp])
        }
    }
    static clearNavLine(){
        Nav.lineTopics.removeChildren()
        Nav.showNavLine()
    }
}
