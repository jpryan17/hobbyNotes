import { WU } from './exputils.js';
export class DR {
    constructor(signSequence) {
        this.sign = undefined;
        this.numerator = 0;
        this.precision = 0;
        if (signSequence && signSequence.length > 0) {
            this.sign = signSequence[0];
            const nArray = signSequence.split('').map(e => (e == this.sign) ? 'F' : 'B');
            const firstB = nArray.findIndex(e => e == 'B');
            if (firstB == -1) {
                this.numerator = signSequence.length;
            }
            else {
                this.precision = signSequence.length - firstB;
                let denom = Math.pow(2, this.precision);
                this.numerator = denom * firstB;
                for (let i = firstB; i < signSequence.length; i++) {
                    const precisionSign = (nArray[i] == 'B') ? -1 : 1;
                    this.numerator += precisionSign * 1 / Math.pow(2, i - firstB + 1) * denom;
                }
            }
        }
    }
    format() {
        let rv;
        if (!this.sign) {
            return '0';
        }
        else if (this.precision == 0) {
            return `${this.sign}${this.numerator}`;
        }
        else {
            const denom = Math.pow(2, this.precision);
            const wholeCnt = Math.floor(this.numerator / denom);
            const num = this.numerator - wholeCnt * denom;
            if (wholeCnt == 0) {
                return `${this.sign}${num}/${denom}`;
            }
            else {
                return `${this.sign}${wholeCnt}&${num}/${denom}`;
            }
        }
    }
    toSignExpansion() {
        let signExp = '';
        if (this.sign) {
            if (this.precision == 0) {
                signExp = this.sign.repeat(this.numerator);
            }
            else {
                const denom = Math.pow(2, this.precision);
                const whole = Math.floor(this.numerator / denom);
                const otherSign = (this.sign == WU.plus) ? WU.minus : WU.plus;
                signExp = this.sign.repeat(whole + 1).concat(otherSign);
                let rem = this.numerator - whole * denom;
                for (let i = 1; i < this.precision; i++) {
                    let denom = Math.pow(2, this.precision - i + 1);
                    /*
                    if (rem > 1 && denom/rem == Math.floor(denom/rem)){
                        rem = 1
                        denom = denom/rem
                    }
                    */
                    if (rem / denom <= 1 / 2) {
                        signExp = signExp.concat(otherSign);
                    }
                    else {
                        signExp = signExp.concat(this.sign);
                        rem -= 1 / Math.pow(2, i) * Math.pow(2, this.precision);
                    }
                }
            }
        }
        return signExp;
    }
    static add(a1, a2) {
        const a = a1.numerator;
        const b = a1.precision;
        const c = a2.numerator;
        const d = a2.precision;
        const min = Math.min(b, d);
        let max = Math.max(b, d);
        const s1 = (a1.sign == WU.plus) ? 1 : -1;
        const s2 = (a2.sign == WU.plus) ? 1 : -1;
        let num = s1 * Math.pow(2, d - min) * a + s2 * Math.pow(2, b - min) * c;
        let sign = (num < 0) ? WU.minus : WU.plus;
        num = Math.abs(num);
        const denom = Math.pow(2, max);
        if (num == 0) {
            sign = undefined;
            max = 0;
        }
        if (num > 1 && denom / num == Math.floor(denom / num)) {
            num = 1;
            max--;
        }
        const rv = new DR();
        rv.sign = sign;
        rv.precision = max;
        rv.numerator = num;
        return rv;
    }
    static multiply(a1, a2) {
        const rv = new DR();
        if (a1.sign && a2.sign) {
            const a = a1.numerator;
            const b = a1.precision;
            const c = a2.numerator;
            const d = a2.precision;
            const p = b + d;
            const denom = Math.pow(2, p);
            rv.sign = (a1.sign == a2.sign) ? WU.plus : WU.minus;
            rv.numerator = a * c;
            if (rv.numerator / denom != Math.floor(rv.numerator / denom))
                rv.precision = p;
            else
                rv.numerator = rv.numerator / denom;
        }
        return rv;
    }
    static fmtExp(exp) {
        const dr = new DR(exp);
        return dr.format();
    }
}
//# sourceMappingURL=dyadicRationals.js.map