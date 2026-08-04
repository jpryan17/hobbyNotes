import {Nav} from './navFW.js'
import {ttd} from './ttd.js'


export class TTDRef extends HTMLElement {
    static stdColor = 'firebrick'
    static overColor = 'fuchsia'
    //
    constructor(){
        super()
    }
    connectedCallback() {
        this.addEventListener('mouseover',()=>{
            this.setAttribute('style',`color:${TTDRef.overColor}`)
        })
        this.addEventListener('mouseout',()=>{
            this.setAttribute('style',`color:${TTDRef.stdColor}`)
        })
        this.addEventListener('click',()=>{
            const exp = this.getAttribute('exp') as string
            const index = Nav.indices[Nav.currentIndex]
            const choice = index.choices[index.chosen]
            const buttonText = `back to ${choice[0].topic}`
            ttd.pxe.exp = exp
            Nav.setLastVisit()
            Nav.addNavLineBackButton(buttonText)
            Nav.fo.removeChildren()
            Nav.fo.append(ttd)
            ttd.layoutEditor()
            ttd.displayTable()
            Nav.display()
        })
    }
}
