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
            const quantifiersStr = this.getAttribute("quantifiers");
            const stageStr = this.getAttribute("stage");
            const index = Nav.indices[Nav.currentIndex];
            const choice = index.choices[index.chosen];
            const buttonText = `back to ${choice[0].topic}`;
            if (!fsd)
                setFSD();
            fsd.clear();
            fsd.pxe.exp = exp;
            if (quantifiersStr || stageStr === "4") {
                // Setup Stage 2 slots
                fsd.setupStage2();
                // Assign default subscripted variables to slots
                const vars = ["x₁", "x₂"];
                fsd.slots.forEach((s, idx) => {
                    s.assignedVar = vars[idx] || `x${idx + 1}`;
                });
                // Parse quantifiers
                fsd.setupStage3();
                if (quantifiersStr) {
                    if (quantifiersStr.includes("∀x") || quantifiersStr.includes("∀x₁")) {
                        fsd.quantifierBindings.push({ quantifier: "∀", variable: "x₁" });
                    }
                    if (quantifiersStr.includes("∃y") || quantifiersStr.includes("∃x₂")) {
                        fsd.quantifierBindings.push({ quantifier: "∃", variable: "x₂" });
                    }
                    if (quantifiersStr.includes("∃y") && quantifiersStr.includes("∀x")) {
                        // Reverse order if ∃y comes before ∀x
                        if (quantifiersStr.indexOf("∃y") < quantifiersStr.indexOf("∀x")) {
                            fsd.quantifierBindings = [
                                { quantifier: "∃", variable: "x₂" },
                                { quantifier: "∀", variable: "x₁" },
                            ];
                        }
                    }
                }
                else {
                    fsd.quantifierBindings = [
                        { quantifier: "∀", variable: "x₁" },
                        { quantifier: "∃", variable: "x₂" },
                    ];
                }
                // Launch Stage 4 directly
                fsd.setupStage4();
            }
            else if (stageStr === "2") {
                fsd.setupStage2();
            }
            else {
                fsd.showControls();
            }
            Nav.setLastVisit();
            Nav.addNavLineBackButton(buttonText);
            Nav.fo.removeChildren();
            Nav.fo.append(fsd);
            fsd.layoutEditor();
            Nav.display();
        });
    }
}
