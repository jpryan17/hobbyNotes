import {drawDRTreeDiagram} from "../../../dLib/btreeDR.js"
import {SI} from '../../../clientLib/serverInterface.js'

async function saveDRTreeDiagram(){
    console.log('bd')  
    new SI('app1')
    
    drawDRTreeDiagram()
    
    const div = document.getElementById('static-diagram') as HTMLDivElement
    const svg = div.innerHTML as string
    
    await SI.sendSVG('btreeDR',svg)
    
    if (SI.errorFlag == 0) {
        console.log('ah did it work?')
        
    } else {
        console.log(`SI did not post svg.`)
    }

}
saveDRTreeDiagram()
console.log('at end')