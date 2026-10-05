import { SVGTextElt, SVGText, SVGTSpan } from './svgElt.js'

type BP = [[number,number],number]
type BPArray = BP[]

export class TBox {
    public textWidth: number
    public textHeight: number
    public ceil = 0
    public bestLC = 0
    public w: SVGText = new SVGText()
    public bpArray:BP[] = []

    // adds (multi-line width/height shaped) tspans of text to parent...
    constructor(public parent: SVGTextElt,public text:string,public width:number,public height?:number,
                        public includeLastLineInDiff=true, public breakOnHyphen=true) {
        this.w.setA('font-size', this.parent.getN('font-size'))
        const wh = this.subWH(text)
        this.textWidth = wh[0]
        this.textHeight = wh[1]
        this.setBP()
        if(this.bpArray.length==0){
            this.setLineSpan(this.text,1) 
        } else {
            let possibles:number[][] = []
             if (height != undefined) { 
                console.log(`why height`)
                this.setCeilingLC()
                const upper = Math.min(this.ceil,this.bpArray.length+1)
                if (upper == 1){
                    this.setLineSpan(this.text,1); return
                } else {
                    possibles = this.setPossibles(upper)
                }
            } else {
                console.log(`before for iw`)
                possibles = this.setPossiblesForIW()
            }
            const evaluated = this.evalPossibles(possibles)
            const bestPos = this.bestLineBreak(evaluated)
            //this.disp(possibles,evaluated,bestPos)
            this.setTspans(evaluated[bestPos][0])
        }
    } 
    setBP(){
        this.bpArray=[]
        let s = -1, bp = -1 , ep = -1
        for(let i=0; i<this.text.length;i++) {
            if (this.text[i] != ' ') {s=i; break}}
        if (s == -1) return
        for (let i=s+1;i<this.text.length;i++) {
            if(this.text[i] == ' '){
                bp = i
                for(let j=i+1;j<this.text.length;j++){
                    if (this.text[j] != ' ') {ep=j; break}
                }
                if (ep != -1) {
                    const w = this.subWH(this.text.substring(0,bp))[0]
                    this.bpArray.push([[bp,ep],w])
                    ep = -1
                }
            } else if(this.isEmbeddedHyphen(i)){
                console.log(`found embedded hyphen at ${i}`)
                const w = this.subWH(this.text.substring(0,i))[0]
                this.bpArray.push([[i+1,i+1],w])
            }
        }
    }
    setCeilingLC(){
        const h = this.height as number
        const r = h/this.width
        const rt = this.textHeight/this.textWidth
        const lineCnt =Math.sqrt(r/rt)
        const mww = this.maxWordWidth()
        const minLineCnt = Math.min(lineCnt,this.textWidth/mww)
        this.ceil = Math.ceil(minLineCnt)
    }  
    setPossibles (upper:number){
        let lowers:number[][] = []
        let uppers:number[][] = []
        if (upper > 2){
            lowers = this.setPossiblesForLineCnt(upper-1,lowers) as number[][]
        }
        if (upper >1) {
            uppers = this.setPossiblesForLineCnt(upper,uppers) as number[][]
        }
         return lowers.concat(uppers)
    }
    setPossiblesForLineCnt(lineCnt:number,possibles:number[][]){
        let newPossibles:number[][] =[]
        for (let i=1; i<lineCnt; i++) {
            newPossibles = this.setPossiblesForLineNumber(lineCnt,i,newPossibles)
        }
        return newPossibles
    }
    setPossiblesForLineNumber(lineCnt:number,lineNum:number,possibles:number[][]){
        const iw = this.textWidth/lineCnt * lineNum
        return this.setPossiblesForLine(iw,possibles)
    }
    setPossiblesForIW(){
        let newPossibles:number[][] =[]
        let currentWidth = this.width, currentLine = 1
        console.log(`init current width ${currentWidth} current line ${currentLine}`)
        while (currentWidth < this.textWidth){
            console.log(`top current width ${currentWidth} current line ${currentLine}`)
            newPossibles = this.setPossiblesForLine(currentWidth,newPossibles)
            currentLine += 1
            currentWidth = currentLine * this.width
            console.log(`bottom current width ${currentWidth} current line ${currentLine}`)
        }
        return newPossibles
    }
    setPossiblesForLine(iw:number,possibles:number[][]){
        let newPossibles:number[][]=[]
        const [before,after] = this.beforeAfterBP(iw)
        if (possibles.length==0){
            const bap:number[]=[]
            if(before >- 1) bap.push(before)
            if (after > -1) bap.push(after)
            if (bap.length >0) {
                const bbp = Math.min(...bap)
                newPossibles.push([bbp])
            }
        } else{
            possibles.slice().forEach(possible => {
                const bap:number[]=[]
                if (before > -1) bap.push(before)
                if (after > -1) bap.push(after)
                if (bap.length >0) {
                    const bbp = Math.min(...bap)
                    possible.push(bbp)
                    newPossibles.push(possible)
                }
             })
        }
        return newPossibles
    }
    evalPossibles(possibles:number[][]) :[number[],number][]{
        return possibles.map(p =>{
            const v = this.evalPossible(p) 
            return ([p,v])
        })
    }
    evalPossible(possible:number[]) :number{
        const iw = (this.height) ? this.textWidth/(possible.length+1) : this.width
        let diff = 0
        possible.forEach(bpPos=>{
            diff += Math.abs(this.bpArray[bpPos][1]-iw)
        })
        if (this.includeLastLineInDiff){
            diff += Math.abs(this.bpArray[possible[possible.length-1]][1]-this.textWidth)
        }
        return diff/possible.length
    }
    bestLineBreak(evaluated:[number[],number][]){
        let pos= 0
        for(let i=1; i<evaluated.length; i++){
            if (evaluated[i][1] < evaluated[pos][1]) {pos = i}
        }
        return pos
    }
    beforeAfterBP(iw:number){
        let before=-1, after=-1
        for(let i=0;i<this.bpArray.length;i++){
            if (this.bpArray[i][1] >= iw){
                after = i
                if(i>0) before = i-1
                break
            }
            if (after == -1) before = this.bpArray.length-1
        }
        return[before,after]
    }
    setTspans(bps:number[]){
        let cp = 0
        for (let i=0;i<bps.length;i++){
            const bp:BP = this.bpArray[bps[i]]
            const sub = this.text.substring(cp,bp[0][0])
            this.setLineSpan(sub,i+1)
            cp = bp[0][1]
        }
        const sub = this.text.substring(cp)
        const subW = this.subW(sub)
        this.setLineSpan(sub,bps.length+1)
    }
    setLineSpan(lineText: string, linePos: number) {
        const base = 2 / 3 * this.textHeight
        let [x, y] = this.parent.getAN(['x', 'y'])
        y += base + (linePos - 1) * this.textHeight
        const sw = new SVGTSpan(this.parent)
        sw.setAA(['x', x, 'y', y])
        sw.setV(lineText)
        this.parent.append(sw)
    }   
    subWH(sub:string){
        this.w.setV(sub)
        return this.w.getTextWH()
    }
    isEmbeddedHyphen(pos:number){
        if (! this.breakOnHyphen) return false
        if (pos == 0 || pos == this.text.length-1) return false
        if (this.text[pos] != '-' ) return false
        if ([' ','-'].includes(this.text[pos-1])) return false
        if ([' ','-'].includes(this.text[pos+1])) return false
        return true
    }
    maxWordWidth(){
        let maxSize = 0, cp= 0, np = 1, cnt = 0
        while(np > 0){
            np = this.text.indexOf(' ',cp)
            if (np == -1) {
                if (this.text.length-cp > maxSize) maxSize = this.text.length-cp
            } else {
                if (np-cp > maxSize) maxSize = np-cp
                cp = this.nextNonSpace(np)
                cnt += 1
            }
        }
        return maxSize
    }
    nextNonSpace(cp:number) {
        for (let p=cp; p < this.text.length; p++) if (this.text[p] != ' ') return p
        return -1
    }
    disp(possibles:number[][],evaluated:[number[],number][],bestPos:number){
        console.log(`targetH ${this.height} targetW ${this.width}\n`,
                    `textH ${this.textHeight} textH ${this.textWidth}\n`,
                    `ceiling ${this.ceil} text length ${this.text.length}\n`,
                    `bp Array ..`)  
        this.bpArray.forEach(bp => {console.log(`    ${bp}`)})
        console.log(`possibles ${possibles}`)
        console.log(`evaluated ${evaluated}`)
        console.log(`best pos ${bestPos}`)
    }
    subW(sub:string){return this.subWH(sub)[0]}
}
