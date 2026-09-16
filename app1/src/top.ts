
import {Nav} from '../../clientLib/navFW.js'
import {TTDRef} from '../../clientLib/ttdRef.js'
import {FSDRef} from '../../clientLib/fsdRef.js'
import {BTDRef} from '../../clientLib/btdRef.js'
import {BIDRef} from '../../clientLib/bidRef.js'
import {StemCard} from '../../clientLib/stemCard.js'
import {CasRef} from '../../clientLib/casRef.js'
import {MwmCasCalculator} from '../../clientLib/mwmCasCalculator.js'
import {mainIndex, hydrateDiagramCallbacks} from './indices.js'
import {setTTD} from '../../clientLib/ttd.js'
import {setFSD} from '../../clientLib/fsd.js'
import {setBTD} from '../../clientLib/btd.js'
import {setBID} from '../../clientLib/bid.js'

export function top(edit=false){

    new Nav('app1',null,edit)
    if (!customElements.get('ttd-ref')) customElements.define('ttd-ref', TTDRef)
    if (!customElements.get('fsd-ref')) customElements.define('fsd-ref', FSDRef)
    if (!customElements.get('btd-ref')) customElements.define('btd-ref', BTDRef)
    if (!customElements.get('bid-ref')) customElements.define('bid-ref', BIDRef)
    if (!customElements.get('stem-card')) customElements.define('stem-card', StemCard)
    if (!customElements.get('cas-ref')) customElements.define('cas-ref', CasRef)
    if (!customElements.get('mwm-cas-calculator')) customElements.define('mwm-cas-calculator', MwmCasCalculator)
    setTTD()
    setFSD()
    setBTD()
    setBID()

    Nav.clearNavLine()
    const activeIndex = (typeof window !== 'undefined' && (window as any).__MWM_DEV_INDEX__)
        ? hydrateDiagramCallbacks((window as any).__MWM_DEV_INDEX__)
        : mainIndex;
    Nav.loadIndex('main', activeIndex)     
}

