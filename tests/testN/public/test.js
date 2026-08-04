"use strict";
class Test {
    constructor(overrides) {
        this.defaults = {
            topMargin: 10,
            bottomMargin: 10,
            leftMargin: 10,
            rightMargin: 10,
            defaultStripHeight: 20
        };
        for (const property in overrides) {
            console.log(`prop ${property}`);
            //const prop = overrides[property]
        }
    }
}
let tc = new Test({ leftMargin: 30 });
console.log(`defaults ${tc.defaults} \nleft margin ${tc.defaults.leftMargin}`);
//# sourceMappingURL=test.js.map