export const WU = {
    ns: 'http://www.w3.org/2000/svg',
    minus: '-',
    plus: '+',
    undetermined: '\u22A5'
};
export function setExp(id) {
    if (id == 'leftPerp' || id == 'rightPerp')
        return WU.undetermined;
    let bd = Number(id.substring(1, 2));
    let lp = Number(id.substring(2));
    return bdLpToExp(bd, lp);
}
export function bdLpToExp(bd, lp) {
    let len = Math.pow(2, bd);
    let sign = WU.plus;
    if (lp >= len / 2) {
        sign = WU.minus;
        lp = len - lp - 1;
    }
    let expansion = WU.plus.repeat(bd).split("");
    let signPos = bd - 1;
    while (signPos > 0) {
        if (lp % 2 > 0) {
            expansion[signPos] = WU.minus;
        }
        lp = Math.floor(lp / 2);
        signPos--;
    }
    if (sign == WU.plus) {
        for (let i = 0; i < bd; i++) {
            expansion[i] = (expansion[i] == WU.plus) ? WU.minus : WU.plus;
        }
    }
    return expansion.join("");
}
export function setVal(exp) {
    if (exp.length == 0)
        return ' [ ] ';
    else if (exp == WU.undetermined)
        return exp;
    else
        return ` [${exp}] `;
}
export function keyToBdLp(key) {
    const bd = +key.substring(1, 2);
    const lp = +key.substring(2);
    return [bd, lp];
}
export function keyToExp(key) {
    const [bd, lp] = keyToBdLp(key);
    return bdLpToExp(bd, lp);
}
export function expToBdPos(exp) {
    let bd = exp.length;
    let len = Math.pow(2, bd);
    let slen = len / 2;
    for (let i = 0; i < bd; i++) {
        let f = Math.pow(2, i + 2);
        slen += (exp[i] == WU.plus) ? len / f : -len / f;
    }
    return [bd, Math.floor(slen)];
}
export function expToId(exp) {
    const [bd, pos] = expToBdPos(exp);
    return `K${bd}${pos}`;
}
export function compareExps(r1, r2) {
    for (let i = 0; i < Math.max(r1.length, r2.length); i++) {
        if (i >= r1.length) {
            if (i >= r2.length)
                return 0;
            if (r2[i] == WU.plus)
                return 1;
            return -1;
        }
        else if (r1[i] == WU.plus) {
            if (i >= r2.length)
                return -1;
            if (r2[i] == WU.minus)
                return -1;
        }
        else {
            if (i >= r2.length)
                return 1;
            if (r2[i] == WU.plus)
                return 1;
        }
    }
    return 0;
}
function setMinLength(reals) {
    let len = reals[0].length;
    reals.forEach((r) => { if (r.length < len)
        len = r.length; });
    return len;
}
function setBetweenCandidates(r1, r2) {
    return [r1.concat(WU.plus), r2.concat(WU.minus),
        r1.concat(WU.plus, WU.plus), r1.concat(WU.minus, WU.plus),
        r2.concat(WU.minus, WU.minus), r2.concat(WU.plus, WU.minus)];
}
function uniqueBetweens(reals) {
    let uniques = [];
    for (let i = 0; i < reals.length; i++) {
        if (!uniques.includes(reals[i]))
            uniques.push(reals[i]);
    }
    return uniques;
}
function findSimpleOf(reals) {
    const rc = reals.length;
    const minLen = setMinLength(reals);
    let simple = '';
    for (let i = 0; i < minLen; i++) {
        for (let j = 1; j < rc; j++) {
            if (reals[0][i] != reals[j][i])
                return simple;
        }
        simple = simple.concat(reals[0][i]);
    }
    return simple;
}
export function findCut(ra, rb) {
    const cr = compareExps(ra, rb);
    const [r1, r2] = (cr == 1) ? [ra, rb] : [rb, ra];
    const candidates = setBetweenCandidates(r1, r2);
    const betweens = candidates.filter((r) => {
        return (compareExps(r1, r) == 1 &&
            compareExps(r, r2) == 1);
    });
    const uniques = uniqueBetweens(betweens);
    if (uniques.length == 1) {
        return uniques[0];
    }
    else {
        return findSimpleOf(uniques);
    }
}
export function setCut(lx, rx) {
    if (lx == WU.undetermined && rx == WU.undetermined)
        return '';
    if (lx == WU.undetermined) {
        let exp = rx.concat(WU.minus);
        return exp;
    }
    if (rx == WU.undetermined) {
        let exp = lx.concat(WU.plus);
        return exp;
    }
    return findCut(lx, rx);
}
export function nodeKeyToBirthdayLinePos(id) {
    let bd = Number(id.substring(1, 2));
    let lp = Number(id.substring(2));
    return [bd, lp];
}
//# sourceMappingURL=exputils.js.map