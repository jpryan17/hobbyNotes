import {Elt} from './elt.js'
import {SVGElt,SVGText} from './svgElt.js'
//
type Widget = {type:WidgetType,loc:Loc,style:Name,action?:Name,text?:SVGText,rect?:SVGElt,label?:SVGText}
type Style =  {maxHeight:WidgetMaxHeight,colors:ColorStyle}
type Action = {type:ActionType,status:Status,action:CallMethod|ChangeState}
//
type Name = string
type Method = Function
type Color = string
type States = string[]
type Following = Widget|null
//
type WidgetType = 'strip'|'button'|'box'|'col'
type Quad = 'topLeft'|'topRight'|'bottomLeft'|'bottomRight'
type HorzAlign = 'left'|'center'|'right'
type VertAlign = 'top'|'center'|'bottom'
type RelPos = 'above'|'below'|'leftOf'|'rightOf'
type FromSide = 'left'|'right'
type LocType = 'quad'|'rel'|'linear'
type QuadLoc = {quad:Quad[],horzAlign:HorzAlign,vertAlign:VertAlign}
type RelLoc = {relTo:Widget,repOps:RelPos,alignment:HorzAlign|VertAlign}
type LinearLoc = {strip:Widget,side:FromSide,following:Following} 
type Loc = {type:LocType,loc:QuadLoc|RelLoc|LinearLoc}
//
type ActionType = 'callMethod'|'changeState'
type ChoiceType = 'single'|'multiple'
type Choice = number|number[]
type CallMethod = {method:Method}
type ChangeState = {states:States,choiceType:ChoiceType,choice:Choice}
//
type Status = 'inhibited'|'std'|'selected'|'over'|'busy'|'failed'
type ConstantColor = Color|null
type ActionColor = {status:Status,widgetColor:ConstantColor}
type ActionColors = ActionColor[]
type WidgetColor = ConstantColor | ActionColors
type ColorStyle = {text:WidgetColor,bg:WidgetColor,border:WidgetColor,label:WidgetColor}
type WidgetMaxHeight = null|[number,'pts'|'rel']
//
export class Container extends SVGElt{
    public widgets = new Map<Name,Widget>()
    public actions= new Map<Name,Action>()
    public styles = new Map<Name,Style>()
    public toWidget = new Map<SVGElt,Widget>()
//
    constructor(){
        super('svg')
    }
    addAction(name:Name,action:Action){
        this.actions.set(name,action)
    }
    addStyle(name:Name,style:Style){
        this.styles.set(name,style)
    }
    addSelectionWidget(name:Name,loc:Loc,style:Name,type:WidgetType,text:string,action:Name){
        const widget = this.initWidget(type,loc,style,false) as Widget
        this.addListeners(widget)
        this.widgets.set(name,widget)
    }
    addListeners(widget:Widget){
        const svgElt = (widget.rect != undefined) ? widget.rect : widget.text as SVGElt
        const elt = svgElt.elt as HTMLElement
        elt.addEventListener('mouseover',(ev)=>{this.mouseOver(ev)})
        elt.addEventListener('mouseout',(ev)=>{this.mouseOut(ev)})
        elt.addEventListener('click',(ev)=>{this.click(ev)})
    }
    addStrip(name:Name,loc:Loc,type:WidgetType,style:Name,label?:string){
        const needLabel = label != undefined
        const widget = this.initWidget(type,loc,style,needLabel) as Widget
        this.widgets.set(name,widget)
    }
    addField(name:Name,type:WidgetType,loc:Loc,style:Name,label?:string){
        const needLabel = label != undefined
        const widget = this.initWidget(type,loc,style,needLabel)
        this.widgets.set(name,widget)
    }
    initWidget(type:WidgetType,loc:Loc,style:Name,needLabel:boolean){
        const widget = {type:type,loc:loc,style:style}  as Widget

        if(this.needsRect(widget)){
            widget.rect = new SVGElt('rect')
        }
        if(this.hasText(widget)){
            widget.text = new SVGText()
        }
        if(needLabel){
            widget.label = new SVGText()
        }
        this.setLoc(widget)
        return widget
    }
    needsRect(widget:Widget){
        const style = this.styles.get(widget.style) as Style
        return ['strip'].includes(widget.type) || style.colors.border != null
    }
    hasText(widget:Widget){
        return ['button','selection','field'].includes(widget.type)
    }
    setLoc(widget:Widget){
        const loc = widget.loc as Loc
        if (loc.type == 'quad'){
            this.setQuadLoc()
        } else if (loc.type == 'rel'){
            this.setRelLoc()
        } else if (loc.type == 'linear'){
            this.setLinearLoc()
        }
    }
    setQuadLoc(){
        
    }
    setRelLoc(){
        
    }
    setLinearLoc(){
        
    }
    setColor(occasion:string,widget:Widget){

    }
    eventWidget(ev:Event){
        const elt = ev.target as HTMLElement
        const svg =  Elt.wrapper(this.elt) as SVGElt
        return this.toWidget.get(svg)
    }
    mouseOver(e:Event){
        const widget = this.eventWidget(e) as Widget
        const actionName  = widget.action as Name
        const action = this.actions.get(actionName) as Action
        const status = action.status
        if (['std','selected'].includes(status)){
            const color = this.setColor('over',widget)
        }
    }
    mouseOut(e:Event){
        const widget = this.eventWidget(e) as Widget
        const actionName  = widget.action as Name
        const action = this.actions.get(actionName) as Action
        const status = action.status
    }
    click(e:Event){
        const widget = this.eventWidget(e) as Widget
        const actionName  = widget.action as Name
        const action = this.actions.get(actionName) as Action
        const status = action.status
    }
    
}
