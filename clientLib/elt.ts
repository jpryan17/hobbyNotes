const SVGns = 'http://www.w3.org/2000/svg'
const HTMLns = 'http://www.w3.org/1999/xhtml'

export class Elt{
    elt:Element
    static elements = new Map<Element,Elt>()

    constructor(qname='div', id?:string,nsi='H', wrapElt?:Element){
    const ns = (nsi=="H")? HTMLns: SVGns
    if(wrapElt){
        this.elt = wrapElt
    } else {
        this.elt = document.createElementNS(ns,qname) as Element
    }
    if(id != undefined) this.elt.setAttribute("id",id)
    Elt.elements.set(this.elt,this)
    }

    static delete(key:Element){Elt.elements.delete(key)}
    
    static wrapper<Elt>(key:Element|null){if (key) return Elt.elements.get(key)}
    
    append(elt:Elt){this.elt.appendChild(elt.elt)}
    getV() {return this.elt.innerHTML}
    setV(val: string) { this.elt.innerHTML = val}
    getA(name:string) {return this.elt.getAttribute(name)}
    getS(name:string) {return this.getA(name) as string}
    getN(name:string) {return +this.getS(name)}
    getAN(names:string[]){return names.map(e => this.getN(e)) as number[]}

    getAA(names:string[]) { return names.map(e => this.elt.getAttributeNS(null,e))}
    setA(name: string, val: string|number) 
        { this.elt.setAttributeNS(null, name, val.toString())}
    setAA(avPairs:(string|number)[]){
        for(let i=0;i<avPairs.length-1;i+=2){
            this.elt.setAttributeNS(null, avPairs[i].toString(),avPairs[i+1].toString())
        }
    }
    eltBCR(){
        if (this.elt.parentElement){
            return this.elt.getBoundingClientRect()
        } else {
            const scratchArea = document.getElementById('scratch-slot') as HTMLHeadElement
            scratchArea.innerHTML = ''
            scratchArea.appendChild(this.elt)
            const  bcr = this.elt.getBoundingClientRect()
            scratchArea.innerHTML = ''           
            return bcr
        }
    }
    eltW(){return this.eltBCR().width}
    eltH(){return this.eltBCR().height}
    eltX(){return this.eltBCR().x}
    eltY(){return this.eltBCR().y}
    eltWH(){
        const dr = this.eltBCR()
        return [dr.width,dr.height]
    }
    eltXYWH(){
        const dr = this.eltBCR()
        return [dr.x,dr.y,dr.width,dr.height]
    }
    removeChildren(){
        Array.from(this.elt.children).forEach(c=>this.elt.removeChild(c))
    }

    child (){
        const children = Array.from(this.elt.children)
        if (children.length == 0){
            console.log(`${this} has no children`)
        } else if (children.length != 1){
            console.log(`${this} has multiple children`)
        } else {
            return Elt.wrapper(children[0]) as Elt
        }
    }

    children(){
        const widgets:Elt[]=[]
        Array.from(this.elt.children).forEach( elt =>{
            const widget = Elt.wrapper(elt) as Elt
            widgets.push(widget)
        })
        return widgets
    }

    static ga(elt:string|Element, att:string|string[]){
        if (typeof elt == "string"){
            elt = document.getElementById(elt) as Element
        }
        if (typeof att == 'string'){
            return elt.getAttributeNS(null, att)
        } else {
            const asElt = elt as Element
            return att.map(e => asElt.getAttributeNS(null,e) as string)
        }
    }
    static sa(elt:string|Element,a:string,v:string|number){
        if (typeof elt == "string"){
            elt = document.getElementById(elt) as Element
        }
        elt.setAttributeNS(null, a, v.toString())
    }
    static saa(elt:string|Element,av:(string|number)|(string|number)[]){
        if (typeof elt == "string"){
            elt = document.getElementById(elt) as Element
        }
        if (! Array.isArray(av)) {
            av = [av]
        }
        for(let i=0;i<av.length-1;i+=2){
                elt.setAttributeNS(null, av[i].toString(),av[i+1].toString())
            }
    }
}
