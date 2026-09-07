import { build } from 'esbuild';
//should be run in app's dist dir
export async function bldAppScript() {
    await build({
        entryPoints: ['main.ts'],
        bundle: true,
        outfile: 'appScript.js'
    });
}
bldAppScript();
