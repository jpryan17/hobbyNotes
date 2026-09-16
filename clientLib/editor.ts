// support for app segment editing & studio overlay

import {Nav} from './navFW.js'
import {Elt} from './elt.js'
import {SVGTSpan, textWidth} from './svgElt.js'
import {SI} from './serverInterface.js'
import {initAnyDJSI} from './ida.js'
import {StudioOverlay} from './studioOverlay.js'

type NavColors = {bg:string,std:string,active:string,over:string, busy:string}

export class Sed {
    //
    static editControlsWidth:number = 0
    static editControls:SVGTSpan
    static editControlsActiveStatus=true
    static savedContent:Elt
    static controls = ['[E]',' ','[R]',' ','[L]']
    static colors:string[]
    //
    constructor (navColors:NavColors){
        Sed.colors = [navColors.std,navColors.active,navColors.over,navColors.busy,'red']
        
        // Initialize modern Studio Overlay controls
        StudioOverlay.init(navColors)
        SI.logInit()    
    }
    //
    static setEditControlsPos(lineWidth:number){
        StudioOverlay.setPos(lineWidth)
    }
    static setEditControlStatus(status:boolean){
        Sed.editControlsActiveStatus = status
    }

    static setTargetColor(ev:Event,color:string){
        const target = ev.target as Element
        const control = Elt.wrapper(target) as Elt
        control.setA('stroke',color) 
    }
    static getTargetColor(ev:Event){
        const target = ev.target as Element
        const control = Elt.wrapper(target) as Elt
        return control.getA('stroke') as string
    }
    //control handlers
    static segEditHandler(ev:Event){
        const [_,activeC,__,busyC,] = Sed.colors
        Sed.setTargetColor(ev,busyC)
        SI.requestSegEdit(Nav.segId)
        Sed.setTargetColor(ev,activeC)
    }
    static async segReplaceHandler(ev:Event){
        const [_,activeC,__,busyC,alertC] = Sed.colors
        const target = ev.target as Element
        const control = Elt.wrapper(target) as Elt
        const color = Sed.getTargetColor(ev)
        if (color != alertC){
            Sed.setTargetColor(ev,busyC)
            Nav.setLastVisit()
            await SI.setSegMap(true, Nav.segId)
            if (SI.errorFlag != 0) {
                Sed.setTargetColor(ev,alertC)
            } else {
                Nav.loadSegment()
                initAnyDJSI()
                if ((window as any).MathJax?.typesetPromise) {
                    (window as any).MathJax.typesetPromise([Nav.segDiv.elt]).catch((err: any) => console.log('MathJax typeset error:', err))
                }
                Nav.setSegPos()
            }
        }
        Sed.setTargetColor(ev,activeC)  
    }
    static logViewHandler(ev:Event){
        const [_,activeC,__,busyC,___] = Sed.colors
        const target = ev.target as Element
        const control = Elt.wrapper(target) as Elt
        if (Sed.logDisplayed(control)){
            // restore segment
            Nav.fo.removeChildren()
            Nav.fo.append(Sed.savedContent)
            Nav.setSegPos()
            control.setAA(['stroke',activeC,'pointer-events','auto'])
        } else {
            control.setAA(['stroke',busyC])
            Nav.setLastVisit()
            Sed.savedContent = Nav.fo.child() as Elt
            Nav.fo.removeChildren()
            Nav.fo.elt.append(SI.logged.elt)
            Nav.display()
        }
    }
    static logDisplayed(control:Elt){
        const color = control.getA('stroke')
        return (color == Nav.color.busy)
    }
}
