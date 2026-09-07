"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bldAppScript = bldAppScript;
const esbuild_1 = require("esbuild");
//should be run in app's dist dir
async function bldAppScript() {
    await (0, esbuild_1.build)({
        entryPoints: ['main.ts'],
        bundle: true,
        outfile: 'appScript.js'
    });
}
bldAppScript();
