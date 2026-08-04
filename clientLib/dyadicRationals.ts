import {nodeKeyToBirthdayLinePos, WU} from './exputils.js'

export class DR{
    sign:string|undefined = undefined
    numerator = 0
    precision = 0

    constructor(signSequence?:string,sign?:string,num?:number,prec?:number){
        if (signSequence && signSequence.length > 0) {
            this.sign = signSequence[0]
            const nArray = signSequence.split('').map(e=>(e==this.sign)? 'F' : 'B')
            const firstB = nArray.findIndex(e => e == 'B')
            if (firstB == -1) {
                this.numerator = signSequence.length
            } else {
                this.precision = signSequence.length - firstB
                let denom  = Math.pow(2,this.precision)
                this.numerator = denom * firstB
                for(let i=firstB;i<signSequence.length;i++){
                    const precisionSign = (nArray[i]=='B')? -1 : 1
                    this.numerator += precisionSign*1/Math.pow(2,i-firstB+1)*denom
                }
            }
        } else if(sign){
            this.sign = sign
            this.numerator = num as number
            this.precision = prec as number
        }
    }
    show(){
        let display = (this.sign == '-')? '-' : ''

    }
    format(){
        //console.log(`sign ${this.sign} num ${this.numerator} prec ${this.precision}`)
        let rv:string
        if(! this.sign){ return '0'}
        const sign = (this.sign == '+') ? '' : this.sign
        if(this.precision==0){
            return `${sign}${this.numerator}`
        } else{
            const denom = Math.pow(2,this.precision)
            const wholeCnt = Math.floor(this.numerator / denom)
            const remainder = this.numerator % denom
            if (wholeCnt==0 && remainder == 0){
                return '0'
            } else if (remainder == 0){
                return `${sign}${wholeCnt}`
            } else {
                const frac = (remainder > 1 && denom % remainder == 0)? 
                                `1/${denom/remainder}` : `${remainder}/${denom}`
                if (wholeCnt==0){
                    return `${sign}${frac}`
                } else {
                    return `${sign}${wholeCnt}&${frac}`
                }
            }
        }
    }
    toSignExpansion(){
        let signExp = ''
        if (this.sign){
            if (this.precision == 0){
                signExp = this.sign.repeat(this.numerator)
            } else {
                const denom = Math.pow(2,this.precision)
                const val = this.numerator / denom
                const whole = Math.floor(val)
                const num = this.numerator - whole * denom
                if (num == 0){
                    signExp = this.sign.repeat(whole)
                } else {
                    const otherSign = (this.sign==WU.plus)? WU.minus : WU.plus
                    signExp = this.sign.repeat(whole+1).concat(otherSign)
                    let rem = this.numerator - whole * denom 
                    for (let i=1;i<this.precision;i++){
                        let denom = Math.pow(2,this.precision-i+1)
                        /*
                        if (rem > 1 && denom/rem == Math.floor(denom/rem)){
                            rem = 1
                            denom = denom/rem
                        }
                        */
                        if(rem/denom <= 1/2){
                            signExp = signExp.concat(otherSign)
                        } else {
                            signExp = signExp.concat(this.sign)
                            rem -= 1/Math.pow(2,i) * Math.pow(2,this.precision)
                        }
                    }
                }
            }
        }
        return signExp 
    }
    static add(a1:DR,a2:DR){
        const maxOp = (a1.precision >= a2.precision)? a1 : a2
        const otherOp = (maxOp == a1)? a2 : a1
        const precDiff = Math.abs(a1.precision-a2.precision)
        const adjOp = (precDiff == 0)? 
                otherOp : 
                new DR(undefined,otherOp.sign,otherOp.numerator*Math.pow(2,precDiff),maxOp.precision)
        const s1 = (maxOp.sign == WU.plus)? 1 : -1
        const s2 = (adjOp.sign == WU.plus)? 1 : -1
        let num = s1 * maxOp.numerator + s2 * adjOp.numerator
        let sign:string|undefined = (num < 0)? WU.minus : WU.plus
        num = Math.abs(num)
        let prec = maxOp.precision
        if (num == 0) {
            prec = 0
            sign = undefined
        } 
        return new DR(undefined,sign,num,prec)
    }
    static multiply(a1:DR,a2:DR){

        const rv = new DR()
        if ( a1.sign && a2.sign){
            const a = a1.numerator
            const b = a1.precision
            const c = a2.numerator
            const d = a2.precision
            const p = b + d
            const denom = Math.pow(2,p)
            rv.sign = (a1.sign ==a2.sign)? WU.plus :WU.minus
            rv.numerator = a * c
            if (rv.numerator/denom != Math.floor(rv.numerator/denom))
                rv.precision = p
            else
                rv.numerator = rv.numerator / denom
        }
        return rv
    }
    static fmtExp(exp:string){
        const dr = new DR(exp)
        return dr.format()
    }
}
