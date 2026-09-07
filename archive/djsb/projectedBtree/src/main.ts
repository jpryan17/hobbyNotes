import {drawProjectionTreeDiagram} from '../../../dLib/btreeProjected.js'
import {SI} from '../../../clientLib/serverInterface.js'

async function saveProjectionTreeDiagram(){
    console.log('bd')  
    new SI('app1')
    drawProjectionTreeDiagram()
    
    const div = document.getElementById('static-diagram') as HTMLDivElement
    const svg = div.innerHTML as string
    
    await SI.sendSVG('projectedBtree',svg)
    
    if (SI.errorFlag == 0) {
        console.log('ah did it work?')
        
    } else {
        console.log(`SI did not post svg.`)
    }

}
saveProjectionTreeDiagram()
console.log('at end')