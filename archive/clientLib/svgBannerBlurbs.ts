import {SVGElt,SVGGrpElt,SVGText, SVGTSpan} from './svgElt.js'

type Quad = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight'
type VertAlign = 'Top' | 'Center' | 'Bottom'
type HorzAlign = 'Left' | 'Center' | 'Right'
type QuadLoc = [Quad[],VertAlign,HorzAlign]
type Rel = ['Before',VertAlign] | ['After',VertAlign] | ['LeftOf',HorzAlign] | ['RightOf',HorzAlign]
type RelLoc = [Blurb,Rel]
type Which = 'Quad' | 'Rel'
type Loc = [Which,QuadLoc|RelLoc]
type Range = [number,number]
type Widget = SVGTSpan | string
type Blurb = [Loc,Range]
type TextBlurbType = 'title' | 'column' | 'box'
type TextInfo = [string,TextBlurbType]
type TextBlurb = Blurb & TextInfo
type SelectionItem = [string,Function]
type SelectionListInfo  = [SelectionItem[],HorzAlign]
type SelectionBlurb = Blurb & SelectionListInfo
type ImageInfo = string
type ImageBlurb = Blurb & ImageInfo

class Banner extends SVGElt{
    constructor(){
        super('svg')
    }
    LocToXY(loc:Loc){
        if (loc[0] == 'Quad'){
            const [quad,vertAlign,horzAlign] = loc[1] as QuadLoc
            this.setQuadXY(quad)
        } else { 
            const [wrtBlurb,[rel,alignment]] = loc[1] as RelLoc
        }
    }
    setQuadXY(quad:Quad[]){ 
    }
    addTitle(loc:Loc,range:Range,title:string){
    }
    addSelectionList(loc:Loc,range:Range,selections:SelectionItem[]){
    }
    addTextCol(loc:Loc,range:Range){
    }
    addTextBox(loc:Loc,range:Range){
    }
    addImage(loc:Loc,range:Range,imageURI:ImageInfo){
    }
}
