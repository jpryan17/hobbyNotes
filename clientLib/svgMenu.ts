import {SVGElt,SVGGrpElt,SVGText} from './svgElt.js'

interface MenuBarInfo {
    parent:SVGElt
    choices:{label:string,state?:boolean,leftMarginOveride?:number}[]
    cb:Function,
    barHeight?:number,
    bgColor?:string,
    fontSize?:number
    fontColor?:string
    disabledColor?:string
    overColor?:string,
    startMargin?:number
    leftMargin?:number
}
export class MenuBar extends SVGGrpElt {
    barHeight = 30
    bgColor = 'gainsboro'
    fontSize = 18
    fontColor = 'blue'
    disabledColor = 'gray'
    overColor = 'purple'
    leftMargin = 25
    startMargin = 10
    menuBar:SVGElt
    items:SVGText[]=[]
    constructor(public options:MenuBarInfo){
        super()
        if (options.barHeight) this.barHeight = options.barHeight
        if (options.bgColor) this.bgColor = options.bgColor
        if (options.fontSize) this.fontSize = options.fontSize
        if (options.fontColor) this.fontColor = options.fontColor
        if (options.disabledColor) this.disabledColor = options.disabledColor
        if (options.overColor) this.overColor = options.overColor
        if (options.startMargin) this.startMargin = options.startMargin
        options.parent.append(this)
        this.menuBar = new SVGElt('rect')
        this.append(this.menuBar)
        this.menuBar.setAA(['x',0,'y',0,'height',this.barHeight,'fill',this.bgColor,
                            'stroke','purple','stroke-width',1])
        this.setItems()
    }
    setItems(){
        this.items = [] 
        this.options.choices.forEach(choice=>{
            const item = new SVGText()
            this.append(item)
            this.items.push(item)
            const pointerState = (choice.state)? 'all' : 'none'
            const y = 2/3 * this.barHeight
            item.setAA(['y',y,'font-size',this.fontSize,'stroke',this.fontColor,'pointer-events',pointerState])
            const fc =  (pointerState == 'all')? this.fontColor : this.disabledColor
            item.setA('stroke',fc)
            item.setV(choice.label)
            item.elt.addEventListener('mouseover', ev=>{
                const w = ev.target as SVGElement
                w.setAttribute('stroke',`${this.overColor}`)
            })
            item.elt.addEventListener('mouseout', ev=>{
                const w = ev.target as SVGElement
                w.setAttribute('stroke',`${this.fontColor}`)
            })
            item.elt.addEventListener('click', ev=>{
                const itemPos = this.items.find(item => ev.target == item.elt)
                this.options.cb(item)
            })
        })
    }
    layout(){
        const width = this.options.parent.getA('width') as String
        this.menuBar.setA('width',+width)
        let x = this.startMargin
        this.items.forEach((item,pos)=>{
            if (pos != 0){
                const choiceMargin = this.options.choices[pos].leftMarginOveride
                const margin = (choiceMargin) ? choiceMargin : this.leftMargin
                x += margin
            }
            item.setA('x',x)
            x += item.getBB().width
        }) 
    }
}
//
interface DropdownMenuInfo {
    parent:SVGElt
    choices:string[]
    cb:Function
    bgColor?:string,
    fontSize?:number,
    fontColor?:string,
    overColor?:string,
    betweenMargin?:number,
    sidesMargin?:number
}

export class DropdownMenu extends SVGGrpElt{
    bgColor = 'blanchedalmond'
    fontSize = 16
    fontColor = 'blue'
    disabledColor = 'gray'
    overColor = 'purple'
    betweenMargin = 8
    sidesMargin = 4
    dropdown:SVGElt
    items:SVGText[]=[]

    constructor(public options:DropdownMenuInfo){
        super()
        //
        if (options.bgColor) this.bgColor = options.bgColor
        if (options.fontSize) this.fontSize = options.fontSize
        if (options.fontColor) this.fontColor = options.fontColor
        if (options.overColor) this.overColor = options.overColor
        if (options.betweenMargin) this.betweenMargin = options.betweenMargin
        if (options.sidesMargin) this.sidesMargin = options.sidesMargin
        //
        options.parent.append(this)
        this.dropdown = new SVGElt('rect')
        this.append(this.dropdown)
        this.hide()
        this.dropdown.setAA(['x',0,'y',0,'fill',this.bgColor,'stroke','purple'])
        this.setItems()
    }
    setItems(){
        this.items = []
        this.options.choices.forEach((choice)=>{
            const item = new SVGText()
            this.items.push(item)
            this.append(item)
            const x = this.sidesMargin
            const y = this.sidesMargin+2/3*this.fontSize
            item.setAA(['x',x,'y',y,'font-size',this.fontSize,'stroke',this.fontColor])
            item.setV(choice)
            item.elt.addEventListener('mouseover', ev=>{
                const w = ev.target as SVGElement
                w.setAttribute('stroke',`${this.overColor}`)
            })
            item.elt.addEventListener('mouseout', ev=>{
                const w = ev.target as SVGElement
                w.setAttribute('stroke',`${this.fontColor}`)
            })
            item.elt.addEventListener('click', ev=>{
                const item = this.items.find(item => ev.target == item.elt)
                this.options.cb(item)
            })
                    
        })
    }
    layout(){
        this.setWH()
    }
    setWH(){
        const len = this.items.length
        const height = 2 * this.sidesMargin + this.betweenMargin * (len-1) + this.fontSize * len
        let maxWidth = 0
        this.items.forEach(item=>{
            const width = item.getBB().width
            if( width > maxWidth) maxWidth = width
        })
        maxWidth += 2 * this.sidesMargin + 2
        this.dropdown.setAA(['width',maxWidth,'height',height])
    }
    hide(){
        this.setA('style','visibility:hidden;pointer-events:none')
    }
    show(){
        this.setA('style','visibility:visible;pointer-events:auto')
    }
    setItemState(){

    }

}
