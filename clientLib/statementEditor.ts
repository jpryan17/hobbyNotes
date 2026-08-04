import {} from './predicateInfo.js'
import { SVGElt } from './svgElt.js'


class SE extends SVGElt{
    constructor(public context:string){
        super('svg')
    }
}