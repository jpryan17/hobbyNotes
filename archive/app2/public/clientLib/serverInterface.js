import { Nav } from "./navFW.js";
import { Elt } from "./elt.js";
// (hobbyNote app) server interface
export class SI {
    static origin = "https://localhost:8080";
    static logged;
    static errorFlag = -1;
    static app;
    //
    constructor(app) {
        SI.app = app;
        SI.logInit();
    }
    static async sendSVG(svgName, svg) {
        const url = `${SI.origin}/svgPost/${SI.app}/${svgName}`;
        try {
            console.log("before post JSON");
            const response = await fetch(url, {
                method: "POST",
                body: svg,
                headers: {
                    "Content-type": "application/text/plain; charset=UTF-8",
                },
            });
            console.log(`response:${response.ok} status ${response.status}`);
            if (response.ok) {
                SI.errorFlag = 0;
                SI.log("svg processed");
            }
            else {
                SI.errorFlag = 1;
                SI.log("svg post failed: response not ok.");
            }
        }
        catch (err) {
            SI.errorFlag = 2;
            SI.log(`svg post failed. ${err}`);
        }
    }
    static async setSegMap(reload = false, segId) {
        let url;
        if (reload) {
            url = segId ? `${SI.origin}/reload/${SI.app}/${segId}` : `${SI.origin}/reload/${SI.app}`;
        }
        else {
            url = `${SI.origin}/getSegs/${SI.app}`;
        }
        try {
            console.log(`[SI.setSegMap] Attempting server fetch from ${url}...`);
            const response = await fetch(url, { method: "GET" });
            console.log(`[SI.setSegMap] Server response: ok=${response.ok} status=${response.status}`);
            if (response.ok) {
                const segArray = (await response.json());
                segArray.forEach((entry) => {
                    const sId = entry.id.split("/")[0];
                    Nav.segMap.set(sId, entry.seg);
                });
                SI.errorFlag = 0;
                SI.log(`segMap build complete via server. map size ${Nav.segMap.size}`);
                return;
            }
        }
        catch (err) {
            console.warn(`[SI.setSegMap] Server fetch from ${url} failed, attempting static fallback...`, err);
        }
        // Fallback: fetch static segsFile.json served by live-server or local static host
        try {
            const fallbackUrl = `./segs/segsFile.json`;
            console.log(`[SI.setSegMap] Attempting fallback fetch from ${fallbackUrl}...`);
            const fallbackResponse = await fetch(fallbackUrl, { method: "GET" });
            if (fallbackResponse.ok) {
                const segArray = (await fallbackResponse.json());
                segArray.forEach((entry) => {
                    const sId = entry.id.split("/")[0];
                    Nav.segMap.set(sId, entry.seg);
                });
                SI.errorFlag = 0;
                SI.log(`segMap build complete via static fallback. map size ${Nav.segMap.size}`);
            }
            else {
                SI.errorFlag = 1;
                SI.log("segMap static fallback failed: response not ok.");
            }
        }
        catch (fallbackErr) {
            SI.errorFlag = 2;
            SI.log(`segMap static fallback failed: ${fallbackErr}`);
        }
    }
    static async deleteSW() {
        const appSW = "sw.js";
        const registered = await navigator.serviceWorker.getRegistration(appSW);
        console.log(`registered ${registered}`);
    }
    static async requestSegEdit(segId) {
        SI.log(`server edit request made for ${Nav.app} seg ${segId}.`);
        const url = `${SI.origin}/startEditor/${Nav.app}/${segId}`;
        const response = await fetch(url, { method: "GET" });
        SI.log(`response ok ${response.ok} status ${response.status}`);
    }
    static logInit() {
        if (Nav.editMode && !SI.logged) {
            SI.logged = new Elt("div");
            SI.logged.elt.innerHTML = "";
        }
    }
    static log(msg) {
        console.log(msg);
        if (Nav.editMode) {
            const currentLog = SI.logged.getV();
            const newLog = currentLog.concat("<br>", `${msg}`);
            SI.logged.setV(newLog);
        }
    }
}
