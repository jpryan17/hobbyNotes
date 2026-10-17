//
// crud/src/appInit.ts   --- initialize the LEM DB Configuration App ---
//
import { configQueries } from './initDownload';
import { validateConfigInfo } from './initValidate';
import { bldConfigObj } from './buildAppConfigObj';
import { initializeUI } from './uiNav';

export async function initializeApp() {
    const displayPanel = document.getElementById('display-panel') as HTMLDivElement;
    const downloads = await configQueries();
    const errorReport = validateConfigInfo(downloads);
    const msg = errorReport === undefined ? '' : errorReport;
    displayPanel.innerHTML = msg;
    const [tableMap, navPaths] = bldConfigObj(downloads);
    initializeUI(tableMap, navPaths, msg);
}
