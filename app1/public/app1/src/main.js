import { SI } from "../../clientLib/serverInterface.js";
import { top } from "./top.js";
async function appEditor() {
    new SI("app1");
    await SI.setSegMap();
    if (SI.errorFlag != 0) {
        console.log(`SI did not establish segMap.`);
    }
    top(true);
}
appEditor();
