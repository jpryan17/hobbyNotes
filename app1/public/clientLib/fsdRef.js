import { Nav } from "./navFW.js";
import { fsd, setFSD } from "./fsd.js";
export class FSDRef extends HTMLElement {
    static stdColor = "firebrick";
    static overColor = "fuchsia";
    constructor() {
        super();
    }
    connectedCallback() {
        this.setAttribute("style", `color:${FSDRef.stdColor};font-weight:bold;cursor:pointer;`);
        this.addEventListener("mouseover", () => {
            this.setAttribute("style", `color:${FSDRef.overColor};font-weight:bold;cursor:pointer;`);
        });
        this.addEventListener("mouseout", () => {
            this.setAttribute("style", `color:${FSDRef.stdColor};font-weight:bold;cursor:pointer;`);
        });
        this.addEventListener("click", () => {
            const exp = this.getAttribute("exp") || "r";
            const quantifiers = this.getAttribute("quantifiers") || "∀x ∃y";
            const index = Nav.indices[Nav.currentIndex];
            const choice = index.choices[index.chosen];
            const buttonText = `back to ${choice[0].topic}`;
            if (!fsd)
                setFSD();
            fsd.pxe.exp = exp;
            fsd.quantifierList = quantifiers.split(" ");
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.append(fsd);
            fsd.layoutEditor();
            fsd.displayTable();
            Nav.display();
        });
    }
}
