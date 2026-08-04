import {drawPrecisionTreeDiagram} from "../../../dLib/btreePrecision.js"
import {SI} from '../../../clientLib/serverInterface.js'

async function savePrecisionTreeDiagram(){
    console.log('bd')  
    new SI('app1')
    
    drawPrecisionTreeDiagram()
    
    const div = document.getElementById('static-diagram') as HTMLDivElement
    const svg = div.innerHTML as string
    
    await SI.sendSVG('btreePrecision',svg)
    
    if (SI.errorFlag == 0) {
        console.log('ah did it work?')
        
    } else {
        console.log(`SI did not post svg.`)
    }

}
savePrecisionTreeDiagram()
console.log('at end')
