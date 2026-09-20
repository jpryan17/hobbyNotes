import { WU, compareExps, setCut } from './exputils.js';
export class RsOps {
    static mc = 0;
    static ac = 0;
    static maxOps = 10000000;
    static bailed = false;
    static bailMsg = '';
    static add(X, Y) {
        if (RsOps.bailed)
            return RsOps.bailMsg;
        if (RsOps.ac++ > RsOps.maxOps) {
            RsOps.bailed = true;
            RsOps.bailMsg = `bailed: adds:${RsOps.ac} multiplies:${RsOps.mc}`;
            return RsOps.bailMsg;
        }
        let [xl, xr] = RsOps.simplerSides(X);
        let [yl, yr] = RsOps.simplerSides(Y);
        let xly = RsOps.addVals(xl, Y);
        let xry = RsOps.addVals(xr, Y);
        let ylx = RsOps.addVals(yl, X);
        let yrx = RsOps.addVals(yr, X);
        let ls = RsOps.extremeVal(1, xly.concat(ylx));
        let rs = RsOps.extremeVal(-1, xry.concat(yrx));
        return setCut(ls, rs);
    }
    static addVals(inVals, val) {
        if (RsOps.bailed)
            return [];
        let vals = [];
        for (let i = 0; i < inVals.length; i++)
            vals.push(RsOps.add(inVals[i], val));
        return vals;
    }
    static multiply(X, Y) {
        if (RsOps.bailed)
            return RsOps.bailMsg;
        RsOps.mc++;
        let [xl, xr] = RsOps.simplerSides(X);
        let [yl, yr] = RsOps.simplerSides(Y);
        let xlyl = RsOps.multiplyVals(X, Y, xl, yl);
        let xryr = RsOps.multiplyVals(X, Y, xr, yr);
        let xlyr = RsOps.multiplyVals(X, Y, xl, yr);
        let xryl = RsOps.multiplyVals(X, Y, xr, yl);
        let ls = RsOps.extremeVal(1, xlyl.concat(xryr));
        let rs = RsOps.extremeVal(-1, xlyr.concat(xryl));
        if (RsOps.bailed)
            return RsOps.bailMsg;
        else
            return setCut(ls, rs);
    }
    static multiplyVals(X, Y, s1, s2) {
        if (RsOps.bailed)
            return [];
        let vals = [];
        for (let x of s1) {
            for (let y of s2) {
                vals.push(RsOps.add(RsOps.add(RsOps.multiply(x, Y), RsOps.multiply(X, y)), RsOps.invertVal(RsOps.multiply(x, y))));
            }
        }
        return vals;
    }
    static invertVal(val) {
        let rv = '';
        for (let i = 0; i < val.length; i++) {
            let sign = (val[i] == WU.plus) ? WU.minus : WU.plus;
            rv = rv.concat(sign);
        }
        return rv;
    }
    static simplerSides(exp) {
        let ls = [];
        let rs = [];
        for (let i = exp.length; i > 0; i--) {
            let simpler = exp.substring(0, i - 1);
            if (compareExps(exp, simpler) == -1)
                ls.push(simpler);
            else
                rs.push(simpler);
        }
        return [ls, rs];
    }
    static extremeVal(dir, vals) {
        if (vals.length == 0)
            return WU.undetermined;
        let extremeVal = vals[0];
        for (let i = 1; i < vals.length; i++) {
            if (compareExps(extremeVal, vals[i]) == dir)
                extremeVal = vals[i];
        }
        return extremeVal;
    }
}
