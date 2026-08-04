import { Nav } from "./navFW.js";
import { fsd, setFSD } from "./fsd.js";

export class FSDRef extends HTMLElement {
  static stdColor = "firebrick";
  static overColor = "fuchsia";

  constructor() {
    super();
  }

  connectedCallback() {
    this.setAttribute(
      "style",
      `color:${FSDRef.stdColor};font-weight:bold;cursor:pointer;`
    );

    this.addEventListener("mouseover", () => {
      this.setAttribute(
        "style",
        `color:${FSDRef.overColor};font-weight:bold;cursor:pointer;`
      );
    });

    this.addEventListener("mouseout", () => {
      this.setAttribute(
        "style",
        `color:${FSDRef.stdColor};font-weight:bold;cursor:pointer;`
      );
    });

    this.addEventListener("click", () => {
      const exp = this.getAttribute("exp") || "r";

      const index = Nav.indices[Nav.currentIndex];
      const choice = index.choices[index.chosen];
      const buttonText = `back to ${choice[0].topic}`;

      if (!fsd) setFSD();
      fsd.clear();
      fsd.pxe.exp = exp;

      Nav.setLastVisit();
      Nav.addNavLineBackButton(buttonText);
      Nav.fo.removeChildren();
      Nav.fo.append(fsd);
      fsd.layoutEditor();
      fsd.showControls();
      Nav.display();
    });
  }
}
