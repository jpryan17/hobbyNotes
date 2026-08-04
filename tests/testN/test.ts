type Defaults = {
    Margin:10,
    bottomMargin:10,
    leftMargin:10,
    rightMargin:10,
    defaultStripHeight:20
}

class Test {public default
        topMargin:10,
        bottomMargin:10,
        leftMargin:10,
        rightMargin:10,
        defaultStripHeight:20
        }


    constructor(overrides:[string,number][]){
        overrides.forEach(e=>{
            const [propName,propVal] = e as [string,number]
            this.defaults[propName as keyof typeof this.defaults] = propVal
        })
}

const tc = new Test([['topMargin',30]])

