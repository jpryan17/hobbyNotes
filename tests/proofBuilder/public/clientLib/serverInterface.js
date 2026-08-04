import { Nav } from './navFW.js';
import { Elt } from './elt.js';
// (hobbyNote app) server interface
export class SI {
    //
    constructor(app) {
        SI.app = app;
        SI.logInit();
    }
    static async sendSVG(svgName, svg) {
        const url = `${SI.origin}/svgPost/${SI.app}/${svgName}`;
        try {
            console.log('before post JSON');
            const response = await fetch(url, {
                method: 'POST',
                body: svg,
                headers: {
                    "Content-type": "application/text/plain; charset=UTF-8"
                }
            });
            console.log(`response:${response.ok} status ${response.status}`);
            if (response.ok) {
                SI.errorFlag = 0;
                SI.log(`svg processed`);
            }
            else {
                SI.errorFlag = 1;
                SI.log('svg post failed: response not ok.');
            }
        }
        catch (err) {
            SI.errorFlag = 2;
            SI.log(`svg post failed. ${err}`);
        }
    }
    //
    static async setSegMap(reload = false) {
        let url;
        if (reload) {
            url = `${SI.origin}/reload/${SI.app}`;
        }
        else {
            url = `${SI.origin}/getSegs/${SI.app}`;
        }
        try {
            console.log('before fetch JSON');
            const response = await fetch(url, { method: 'GET' });
            console.log(`response:${response.ok} status ${response.status}`);
            if (response.ok) {
                const segArray = await response.json();
                segArray.forEach(entry => {
                    const segId = entry.id.split('/')[0];
                    Nav.segMap.set(segId, entry.seg);
                });
                SI.errorFlag = 0;
                SI.log(`segMap build complete. map size ${Nav.segMap.size}`);
                if (reload) {
                }
            }
            else {
                SI.errorFlag = 1;
                SI.log('segMap build failed: response not ok.');
            }
        }
        catch (err) {
            SI.errorFlag = 2;
            SI.log(`segMap build failed. ${err}`);
        }
    }
    static async deleteSW() {
        const appSW = 'sw.js';
        const registered = await navigator.serviceWorker.getRegistration(appSW);
        console.log(`registered ${registered}`);
        /*
        console.log(`registered ${registered}`)
        if(registered){
            try{
                await registered.unregister()
                console.log('service worker unregistered')
            } catch (err){
                console.log(`error unregistering service worker ${err}`)
            }
        } else {
            console.log('no sw to unregister')
        }
        */
    }
    static async requestSegEdit(segId) {
        SI.log(`server edit request made for ${Nav.app} seg ${segId}.`);
        const url = `${SI.origin}/startEditor/${Nav.app}/${segId}`;
        const response = await fetch(url, { method: 'GET' });
        SI.log(`response ok ${response.ok} status ${response.status}`);
    }
    static logInit() {
        if (Nav.editMode && !SI.logged) {
            SI.logged = new Elt('div');
            SI.logged.elt.innerHTML = '';
        }
    }
    static log(msg) {
        console.log(msg);
        if (Nav.editMode) {
            const currentLog = SI.logged.getV();
            const newLog = currentLog.concat('<br>', `${msg}`);
            SI.logged.setV(newLog);
        }
    }
}
SI.origin = 'https://localhost:8080';
SI.errorFlag = -1;
//# sourceMappingURL=serverInterface.js.map