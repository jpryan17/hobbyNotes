import {SVGElt,SVGGrpElt,SVGText, SVGTSpan} from './svgElt.js'

type FromSide = 'Left' | 'Right'
type Following = Control | null
type Loc = [number,FromSide,Following]
type ControlType = 'Button' | 'ButtonSet' | 'textField'
type Text = string
type Shape = 'Rect' | 'Round'
type Border = boolean
type Control = [ControlType,Loc]
type Button = Control & [Text,Shape]
type ButtonSet = Control & [Text[],Shape,Border]
type TextField = Control & [number,Border]
type LabeledControl = [string, ButtonSet | TextField]

class ControlPanel extends SVGElt{
    constructor(){
        super('svg')
    }
    addButton(button:Button){

    }
    addButtonSet(){
    }
    addTextField(){
    }
    addLabelButton(){

    }
    addLabelButtonSet(){

    }
    addLabelTextField(){

    }
}