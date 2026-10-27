import { SVGElt, SVGGrpElt, SVGText, SVGTSpan} from './svgElt.js'
import {Nav} from './navFW.js'

export interface IndexItemDesc {
    type:'html'|'diagram'|'index',
    topic:string,
    navTopic?:string,
    indents?:number
    indexDesc?:IndexItemDesc[],
    indexSelection?:number
    htmlSegmentId?:string|undefined,
    layoutCB?:Function|undefined
    initCB?:Function|undefined
  }
let that:Index
export class Index extends SVGGrpElt{
    static fontSize = 16
    static rowHeight = 36
    static margin = 16
    static stdColor = '#334155'
    static overColor = '#0284c7'
    static selectedColor = '#0369a1'
    chosen: number
    choices: [IndexItemDesc, SVGText, SVGElt][] = []
    public _rawIndexDesc: IndexItemDesc[]

    constructor(indexDesc: IndexItemDesc[], initialSelection: number){
        super()
        that = this
        this._rawIndexDesc = indexDesc
        this.chosen = initialSelection
        this.setA('style', 'background-color: transparent;')
        const [m, fs] = [Index.margin, Index.fontSize]
        let y = m + 21
        indexDesc.forEach((choice, idx) => {
            const indents = (choice.indents) ? choice.indents : 0
            const text = choice.topic
            
            // Background selection/hover pill rect
            const rowY = y - fs - 3
            const isSelected = (idx === this.chosen)
            const rect = new SVGElt('rect')
            rect.setAA([
                'x', m - 8,
                'y', rowY,
                'height', Index.rowHeight - 6,
                'rx', 6,
                'ry', 6,
                'fill', isSelected ? '#e0f2fe' : 'transparent',
                'stroke', isSelected ? '#bae6fd' : 'none',
                'stroke-width', 1
            ])
            this.append(rect)

            const item = new SVGText()
            item.setV(text)
            item.setAA([
                'x', m + indents * 16,
                'y', y,
                'font-size', fs,
                'font-family', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                'font-weight', isSelected ? '700' : '500',
                'fill', isSelected ? Index.selectedColor : Index.stdColor,
                'cursor', 'pointer'
            ])
            this.choices.push([choice, item, rect])
            this.append(item)

            // Dynamic rect width based on item bounding box + padding
            setTimeout(() => {
                try {
                    const bb = item.getBB()
                    if (bb && bb.width > 0) {
                        rect.setA('width', Math.max(175, bb.width + indents * 16 + 24))
                    }
                } catch(e) {}
            }, 0)

            const onHover = () => {
                if (this.chosen !== idx) {
                    rect.setA('fill', '#f1f5f9')
                    item.setA('fill', Index.overColor)
                }
            }
            const onOut = () => {
                if (this.chosen !== idx) {
                    rect.setAA(['fill', 'transparent', 'stroke', 'none'])
                    item.setA('fill', Index.stdColor)
                }
            }
            const onClick = () => {
                this.chosen = idx
                this.setSelectedItem()
                Nav.processSelection()
            }

            rect.elt.addEventListener('mouseover', onHover)
            rect.elt.addEventListener('mouseout', onOut)
            rect.elt.addEventListener('click', onClick)

            item.elt.addEventListener('mouseover', onHover)
            item.elt.addEventListener('mouseout', onOut)
            item.elt.addEventListener('click', onClick)

            y += Index.rowHeight
        })
    }

    setSelectedItem(){
        this.choices.forEach((c, i) => {
            const isSel = (i == this.chosen)
            const [choice, item, rect] = c
            rect.setAA([
                'fill', isSel ? '#e0f2fe' : 'transparent',
                'stroke', isSel ? '#bae6fd' : 'none',
                'stroke-width', isSel ? 1 : 0
            ])
            item.setAA([
                'fill', isSel ? Index.selectedColor : Index.stdColor,
                'font-weight', isSel ? '700' : '500',
                'pointer-events', isSel ? 'none' : 'auto'
            ])
        })
    }
}