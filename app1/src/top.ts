
import {Nav} from '../../clientLib/navFW.js'
import {TTDRef} from '../../clientLib/ttdRef.js'
import {mainIndex} from './indices.js'
import {setTTD} from '../../clientLib/ttd.js'

export function top(edit=false){

    new Nav('app1',null,edit)
    setTTD()
    customElements.define('ttd-ref',TTDRef)
    Nav.clearNavLine()
    Nav.loadIndex('main index',mainIndex)     
}

