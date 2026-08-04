import { SVGTextElt, SVGText, SVGTSpan } from './svgElt.js'
import {TBox} from './svgTextBox.js'

type Selection = [string,Function]
//type ExtendedSelection = [string,Function,number]
class SList {
    public w: SVGText = new SVGText()

    constructor(public parent:SVGTextElt,list:Selection[],width:number){
        this.w.setA('font-size', this.parent.getN('font-size'))
        const selectionList = list.map(selection=> {
            const [text,cb] = selection
            const selectionWidth = this.subWH(selection[0])[0] as number
            return [text,cb,selectionWidth]
        })
        const widths = selectionList.map(e=> e[2]) as number[]
        const totalWidth = widths.reduce((a,c)=>a+c,0)

        
    }
    subWH(sub:string){
        this.w.setV(sub)
        return this.w.getTextWH()
    }
}