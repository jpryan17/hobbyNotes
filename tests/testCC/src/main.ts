import {BN,SVGBanner} from '../../clientLib/svgBanner.js'
import {Nav} from '../../clientLib/navFW.js'

function test (){
  let bn:BN
  new Nav('app1')
  bn = {
    buildDimensions:[600,400,],
    outerBorderWidth:5,
    innerBorderWidth:2,
    connectWidth:2,
    color:{border:'darkblue',bg:'aliceblue',fill:'azure',std:'black'},
    margin:40,
    lines:[ {size:35,pos:'C',topMargin:40,text:'an outline of'},
            {size:35,pos:'C',topMargin:30,text:'primary and seconbdary level'},
            {size:35,pos:'C',topMargin:30,text:'logic courses'}]       
  }
  const banner = new SVGBanner(bn)
  Nav.fo.append(banner)
  banner.display()
}
test()