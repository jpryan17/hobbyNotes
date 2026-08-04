import { Banner } from '../../clientLib/banner.js';
import { Nav } from '../../clientLib/navFW.js';
function test() {
    new Nav('app1');
    const banner = new Banner(['my oh my', 'my oh my oh my']);
    Nav.fo.append(banner);
    banner.layout();
}
test();
//# sourceMappingURL=main.js.map