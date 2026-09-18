import { Nav } from "./navFW.js";
import { Elt } from "./elt.js";
import { fsd, setFSD, QuantifierBinding, DomainType, parseDomainSpec, formatDomainSpec } from "./fsd.js";
import { ArgumentCard, FormalArgument } from "./argumentCard.js";
import { getScaffoldReflection } from "./scaffoldReflection.js";
import { FS_CATALOG } from "./fsCatalog.js";

export class FSDRef extends HTMLElement {
  static stdColor = "firebrick";
  static overColor = "fuchsia";
  static tier3StdColor = "#0284c7";
  static tier3OverColor = "#0369a1";

  constructor() {
    super();
  }

  connectedCallback() {
    const isTier3 = this.getAttribute("tier") === "3";
    const stdCol = isTier3 ? FSDRef.tier3StdColor : FSDRef.stdColor;
    const overCol = isTier3 ? FSDRef.tier3OverColor : FSDRef.overColor;

    this.setAttribute(
      "style",
      `color:${stdCol};font-weight:bold;cursor:pointer;`
    );

    this.addEventListener("mouseover", () => {
      this.setAttribute(
        "style",
        `color:${overCol};font-weight:bold;cursor:pointer;`
      );
    });

    this.addEventListener("mouseout", () => {
      this.setAttribute(
        "style",
        `color:${stdCol};font-weight:bold;cursor:pointer;`
      );
    });

    this.addEventListener("click", () => {
      const tier = this.getAttribute("tier");
      const scaffoldOrId = this.getAttribute("scaffold") || this.getAttribute("id") || this.getAttribute("calc-id") || this.getAttribute("calcId") || "MiddleWayLean/Scaffold.lean";
      const titleAttr = this.getAttribute("title") || this.innerText.trim();
      const autoOpenCalc = this.hasAttribute("open-calc") || this.hasAttribute("auto-calc");
      const presetAttr = this.getAttribute("preset") || undefined;
      const modeAttr = this.getAttribute("calc-mode") || undefined;

      const index = Nav.indices[Nav.currentIndex];
      const choice = index ? index.choices[index.chosen] : null;
      const buttonText = `back to ${choice && choice[0] ? choice[0].topic : 'lecture'}`;

      const cleanId = scaffoldOrId.trim().toLowerCase();
      const matchedExample = FS_CATALOG.examples.find(
        (ex) => (ex.presetKey && ex.presetKey.toLowerCase() === cleanId) || ex.id.toLowerCase() === cleanId
      );
      const matchedMode = FS_CATALOG.calculationModes.find(
        (m) => m.id.toLowerCase() === cleanId || m.id === matchedExample?.modeId
      );
      const catalogStmt = FS_CATALOG.formalStatements.find(
        (s) => s.id === scaffoldOrId || s.scaffoldKey === scaffoldOrId ||
               s.id === (matchedExample?.statementId || matchedMode?.statementId) ||
               s.id.toLowerCase() === cleanId ||
               s.scaffoldKey.toLowerCase() === cleanId
      );

      if (tier === "3" || catalogStmt || matchedMode || matchedExample) {
        const effectiveScaffold = catalogStmt?.scaffoldKey || scaffoldOrId;
        const formalArg = getScaffoldReflection(effectiveScaffold, titleAttr || catalogStmt?.title);
        if (catalogStmt && !formalArg.expression) {
          formalArg.expression = catalogStmt.expression;
        }

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        Nav.setLastVisit();
        Nav.addNavLineBackButton(buttonText);
        Nav.fo.removeChildren();
        Nav.fo.elt.scrollTop = 0;
        Nav.fo.setA('style', 'overflow-y:auto;overflow-x:hidden;box-sizing:border-box;padding:16px 20px 80px 20px;');

        const scrollWrap = new Elt("div");
        scrollWrap.setA("style", "width:100%;min-height:100%;box-sizing:border-box;display:flow-root;padding-bottom:60px;");
        scrollWrap.append(
          new ArgumentCard(formalArg, {
            autoOpenCalculator: autoOpenCalc || !!matchedMode || !!matchedExample,
            presetKey: presetAttr || (matchedExample ? (matchedExample.presetKey || matchedExample.id) : undefined),
            activeModeId: modeAttr || (matchedMode ? matchedMode.id : undefined)
          })
        );
        Nav.fo.append(scrollWrap);

        if (Nav.fo && Nav.fo.elt) {
          Nav.fo.elt.removeEventListener("scroll", Nav.onFoScroll);
          Nav.fo.elt.addEventListener("scroll", Nav.onFoScroll);
          Nav.fo.elt.removeEventListener("toggle", Nav.onFoScroll, true);
          Nav.fo.elt.addEventListener("toggle", Nav.onFoScroll, true);
        }

        Nav.display();
        return;
      }

      const exp = this.getAttribute("exp") || "r";
      const quantifiersStr = this.getAttribute("quantifiers");
      const slotsStr = this.getAttribute("slots");
      const stageStr = this.getAttribute("stage");

      if (!fsd) setFSD();

      // Attach FSD to DOM first so child elements and tables can be queried safely
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      Nav.setLastVisit();
      Nav.addNavLineBackButton(buttonText);
      Nav.fo.removeChildren();
      Nav.fo.elt.scrollTop = 0;
      Nav.fo.setA('style', 'overflow:hidden;');
      Nav.fo.append(fsd);
      Nav.display();

      fsd.loadFromRefData({
        exp,
        quantifiers: quantifiersStr || undefined,
        slots: slotsStr || undefined,
        stage: stageStr || undefined,
      });
    });
  }
}
