import {Nav} from '../../../clientLib/navFW.js'
import {setTTD} from '../../../clientLib/ttd.js'
import {initProofBuilder,displayProofBuilder} from '../../../dLib/propProofBuilder.js'


function test(){
    setTTD()
    const pb = initProofBuilder()
    new Nav('app1',null,false,displayProofBuilder)
    Nav.fo.append(pb)
    Nav.display()
    console.log('before addProp')
    //const res = pb.addProp()
}
test()
