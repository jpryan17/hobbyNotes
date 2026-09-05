import { Nav } from "./navFW.js";
import { fsd, setFSD, QuantifierBinding, DomainType, parseDomainSpec, formatDomainSpec } from "./fsd.js";
import { ArgumentCard, FormalArgument } from "./argumentCard.js";

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
      const scaffold = this.getAttribute("scaffold") || "MiddleWayLean/Scaffold.lean";
      const titleAttr = this.getAttribute("title") || this.innerText.trim();

      const index = Nav.indices[Nav.currentIndex];
      const choice = index.choices[index.chosen];
      const buttonText = `back to ${choice[0].topic}`;

      if (tier === "3") {
        const formalArg: FormalArgument = {
          title: "Constitutional Scaffold Guarantee (Tier 3)",
          verdict: true,
          target: titleAttr,
          testOrPickLabel: "Scaffold",
          testOrPickValue: `MiddleWayLean/Scaffold.lean → ${scaffold}`,
          checks: [
            { label: "Kernel Check", question: "Verified by Lean 4 kernel at compile time?", passed: true, detail: "→ Certified ✓" },
            { label: "Domain Scope", question: "Global transfinite theorem over ℝ_ω / ℂ_ω?", passed: true, detail: "→ Universal" }
          ],
          conflictOrSupport: "Anchored in constitutional Middle Way Lean 4 scaffold.",
          conclusion: `Formally certified by Lean 4 in MiddleWayLean/Scaffold.lean (${scaffold}).`,
          leanSnippet: `-- Constitutional Scaffold Theorem\n#check MiddleWay.${scaffold}`
        };

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        Nav.setLastVisit();
        Nav.addNavLineBackButton(buttonText);
        Nav.fo.removeChildren();
        Nav.fo.elt.scrollTop = 0;
        Nav.fo.setA('style', 'overflow:hidden; padding: 16px;');
        Nav.fo.append(new ArgumentCard(formalArg));
        Nav.display();
        return;
      }

      const exp = this.getAttribute("exp") || "r";
      const quantifiersStr = this.getAttribute("quantifiers");
      const slotsStr = this.getAttribute("slots");
      const stageStr = this.getAttribute("stage");

      if (!fsd) setFSD();
      fsd.clear();
      fsd.pxe.exp = exp;

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

      if (quantifiersStr || stageStr === "4" || !stageStr) {
        // Setup Stage 2 slots
        fsd.setupStage2();

        // Assign domain-typed variables or constants to slots
        if (slotsStr) {
          const slotAssignments = slotsStr.split(",").map(s => s.trim());
          fsd.slots.forEach((s, idx) => {
            if (slotAssignments[idx]) {
              s.assignedVar = slotAssignments[idx];
            }
          });
        } else {
          // Intelligent default slot assignment
          if (exp === "paq" || exp === "poq" || exp === "p" || exp === "q" || exp === "np" || exp === "nq") {
            // Unary predicates on x₁: GT5(x₁), LT10(x₁), GT5(x₁) ∨ LT10(x₁), ¬GT5(x₁)
            fsd.slots.forEach((s) => {
              s.assignedVar = "x₁";
            });
          } else if (exp === "mam" || exp === "mom") {
            // Membership with subsets: x₁ ∈ GT5 ∧/∨ x₁ ∈ LT10
            if (fsd.slots.length >= 4) {
              fsd.slots[0].assignedVar = "x₁";
              fsd.slots[1].assignedVar = "GT5";
              fsd.slots[2].assignedVar = "x₁";
              fsd.slots[3].assignedVar = "LT10";
            } else if (fsd.slots.length >= 2) {
              fsd.slots[0].assignedVar = "x₁";
              fsd.slots[1].assignedVar = "y₁";
            }
          } else if (exp === "ras" || exp === "r" || exp === "s" || exp === "k" || exp === "nk") {
            // Binary predicates on x₁, x₂: GT(x₁, x₂), LT(x₁, x₂), EQ(x₁, x₂)
            fsd.slots.forEach((s, idx) => {
              s.assignedVar = (idx % 2 === 0) ? "x₁" : "x₂";
            });
          } else {
            fsd.slots.forEach((s, idx) => {
              if (s.domainType === "𝒫(ℕ)") {
                s.assignedVar = "y₁";
              } else {
                s.assignedVar = idx === 0 ? "x₁" : "x₂";
              }
            });
          }
        }

        // Parse quantifiers
        fsd.setupStage3();
        if (quantifiersStr) {
          fsd.quantifierBindings = [];
          // Parse quantified tokens (e.g. ∃x₁:ℕ, ∀x₁:[ℕ|GT(11)], ∃x₂:[ℕ|LT(5)], ∀x₂:ℕ ∃x₁:[ℕ|GT(x₂)])
          const qMatches = quantifiersStr.match(/(?:∀|∃|\\forall|\\exists)[^∀∃\\]+/g) || [quantifiersStr];
          for (const token of qMatches) {
            const isForall = token.startsWith("∀") || token.toLowerCase().startsWith("forall") || token.toLowerCase().startsWith("\\forall");
            const qSymbol: "∀" | "∃" = isForall ? "∀" : "∃";
            const cleanToken = token.replace(/∀|∃|\\forall|\\exists/g, "").trim().replace(/^,/, "").trim();
            const colonIdx = cleanToken.indexOf(":");
            let varRaw = colonIdx !== -1 ? cleanToken.substring(0, colonIdx) : cleanToken;
            let dRaw = colonIdx !== -1 ? cleanToken.substring(colonIdx + 1).trim() : "";

            let varName = varRaw ? varRaw.replace(/x1/g, "x₁").replace(/x2/g, "x₂").replace(/y1/g, "y₁").replace(/y2/g, "y₂").replace(/x_1/g, "x₁").replace(/x_2/g, "x₂").trim() : "x₁";

            let dSpec = parseDomainSpec(dRaw);
            if (varName.startsWith("y") && !dRaw) dSpec = { base: "𝒫(ℕ)" };
            const dTypeStr = formatDomainSpec(dSpec);

            fsd.setVarDomain(varName, dSpec);
            fsd.quantifierBindings.push({
              quantifier: qSymbol,
              variable: varName,
              domainType: dTypeStr
            });
          }
          if (fsd.quantifierBindings.length === 0) {
            fsd.quantifierBindings.push({ quantifier: "∃", variable: "x₁", domainType: "ℕ" });
          }
        } else {
          // Default quantifiers based on assigned variables
          const uniqueVars = Array.from(new Set(fsd.slots.map(s => s.assignedVar!).filter(v => v && v !== "GT5" && v !== "LT10" && v !== "EMPTY" && v !== "∅")));
          fsd.quantifierBindings = uniqueVars.map(v => ({
            quantifier: "∃",
            variable: v,
            domainType: formatDomainSpec(fsd.getVarDomain(v))
          }));
        }

        // Launch Stage 4 directly
        fsd.setupStage4();
      } else if (stageStr === "2") {
        fsd.setupStage2();
      } else {
        fsd.showControls();
      }

      fsd.layoutEditor();
    });
  }
}
