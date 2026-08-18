"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const https_1 = require("https");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
/*
const Fs = require('fs')

function lastUpdatedDate (file) {
  const { mtime, ctime } = Fs.statSync(file)

  console.log(`File data   last modified: ${mtime}`)
  console.log(`File status last modified: ${ctime}`)

  return mtime
}
*/
// the (hobbyNote app) segment server
const options = {
    key: (0, fs_1.readFileSync)("../ssl/localhost+1-key.pem"),
    cert: (0, fs_1.readFileSync)("../ssl/localhost+1.pem"),
};
class Serv {
    static port = 8080;
    static segArray = Array();
    static errFlag = 0;
    static server = (0, https_1.createServer)(options, (request, response) => {
        console.log(`input request method ${request.method} input request url ${request.url}`);
        const url = request.url;
        const urlList = url.substring(1).split("/");
        console.log(`urlList[0] ${urlList[0]}`);
        if (urlList[0] == "startEditor") {
            const app = urlList[1];
            const segment = urlList[2];
            console.log(`received start editor request for ${app} seg ${segment}.`);
            const filePath = `./${app}/segs/${segment}.html`;
            (0, child_process_1.spawn)("SeaMonkey", ["-editor", `${filePath}`]);
            response.writeHead(200, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html",
            });
            response.end(`editor launched for ${segment}`);
        }
        else if (urlList[0] == "getSegs" || urlList[0] == "reload") {
            if (urlList[0] == "reload") {
                const app = urlList[1];
                const seg = urlList[2];
                if (app && seg) {
                    try {
                        console.log(`running ttdRefR for ${app} seg ${seg}...`);
                        (0, child_process_1.execSync)(`npm run ttdRefR -- --app ${app} --seg ${seg}`);
                    }
                    catch (e) {
                        console.error(`error running ttdRefR:`, e);
                    }
                }
                (0, child_process_1.execSync)(`node ./nodeUtils/public/genSegsFiles.js ${app}`);
            }
            const app = urlList[1];
            const fn = "segsFile.json";
            const fp = `./${app}/segs/${fn}`;
            try {
                const segs = (0, fs_1.readFileSync)(fp, "utf8");
                console.log(`server sending ${fn} segs`);
                response.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                });
                response.end(segs);
            }
            catch (err) {
                const msg = `error reading ${fn} ${err}`;
                console.log(msg);
                response.writeHead(404, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/html",
                });
                response.end(msg);
            }
        }
        else if (urlList[0] == "getSegsDate") {
            const [app, editFlag] = [urlList[1], urlList[2]];
            const fn = editFlag == "true" ? "segsEditFile.json" : "segsFile.json";
            const fp = `../${app}/segs/${fn}`;
            try {
                const timestamp = (0, fs_1.statSync)(fp).mtimeMs;
                response.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "application/json",
                });
                response.end(timestamp.toString());
            }
            catch (err) {
                const msg = `error finding modified time for ${fn} ${err}`;
                console.log(msg);
                response.writeHead(404, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type": "text/html",
                });
                response.end(msg);
            }
        }
        else if (urlList[0] == "svgPost") {
            const [app, svgName] = [urlList[1], urlList[2]];
            let svg = "";
            request.on("data", (chunk) => {
                svg += chunk.toString(); // convert Buffer to string
            });
            request.on("end", () => {
                console.log(`app ${app} svgName ${svgName} svg`);
                const fp = `./${app}/diagrams/${svgName}.svg`;
                try {
                    (0, fs_1.writeFileSync)(fp, svg);
                    response.writeHead(200, {
                        "Content-Security-Policy-Report-Only": "default-src 'self'",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST",
                        "Access-Control-Allow-Headers": "Origin, Content-Type",
                        // other security headers here...
                    });
                    response.end("ok");
                }
                catch (err) {
                    const msg = `error writing ${fp} ${err}`;
                    console.log(msg);
                    /*
                              response.writeHead(404, {
                                
                              "Content-Security-Policy-Report-Only": "default-src 'self'",
                              'Access-Control-Allow-Origin': '*',
                              'Access-Control-Allow-Methods' : 'GET, POST',
                              'Access-Control-Allow-Headers' : 'Origin, Content-Type'
                              // other security headers here...
              
                              })
                              */
                    response.end(msg);
                }
            });
        }
        else {
            console.log("unrecognized command sent to server");
            response.writeHead(404, {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "text/html",
            });
            response.end("command not recognized.");
        }
    });
    //
    constructor() {
        Serv.server.listen(Serv.port);
        console.log(`server listening on port ${Serv.port}`);
    }
}
//
new Serv();
