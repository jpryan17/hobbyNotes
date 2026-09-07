import { Nav } from '../../../clientLib/navFW.js'
import {CutDiagram} from "../../../dLib/cut.js"

new Nav('app1')
function drawCutDiagram(){
    const id='cut-diagram'
    const cg = new CutDiagram(id)
    Nav.fo.append(cg)
}
drawCutDiagram()
