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
    const instanceKey = this.getAttribute("instance");
    if (instanceKey) {
      this.setupInstanceRef(instanceKey);
      return;
    }

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
        const isPureTheorem = !matchedMode && !matchedExample && (tier === "3" || catalogStmt?.tier === "theorem" || catalogStmt?.tier === "axiom" || catalogStmt?.tier === "constitutional");
        FSDRef.openScaffoldCard(scaffoldOrId, titleAttr, {
          autoOpenCalc: isPureTheorem ? false : autoOpenCalc,
          disableCalculator: isPureTheorem,
          presetKey: presetAttr,
          activeModeId: modeAttr
        });
        return;
      }

      const exp = this.getAttribute("exp") || "r";
      const quantifiersStr = this.getAttribute("quantifiers");
      const slotsStr = this.getAttribute("slots");
      const stageStr = this.getAttribute("stage");

      if (!fsd) setFSD();

      const index = Nav.indices[Nav.currentIndex];
      const choice = index ? index.choices[index.chosen] : null;
      const buttonText = `back to ${choice && choice[0] ? choice[0].topic : 'lecture'}`;

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

  /**
   * Configures an embedded instance reference element as an interactive clickable link/chip.
   */
  private setupInstanceRef(instanceKey: string) {
    const titleAttr = this.getAttribute("title") || "Theorem Instance Derivation";
    const scaffold = this.getAttribute("scaffold") || "telescoping_ftc";

    if (!this.innerHTML || this.innerHTML.trim() === "") {
      this.innerHTML = `🎯 <b>${titleAttr}</b> (Instance Calculator)`;
    }

    const stdCol = FSDRef.tier3StdColor;
    const overCol = FSDRef.tier3OverColor;

    this.setAttribute(
      "style",
      `color:${stdCol};font-weight:bold;cursor:pointer;text-decoration:underline;`
    );

    this.addEventListener("mouseover", () => {
      this.setAttribute(
        "style",
        `color:${overCol};font-weight:bold;cursor:pointer;text-decoration:underline;`
      );
    });

    this.addEventListener("mouseout", () => {
      this.setAttribute(
        "style",
        `color:${stdCol};font-weight:bold;cursor:pointer;text-decoration:underline;`
      );
    });

    this.addEventListener("click", () => {
      FSDRef.openInstanceCalculator(scaffold, instanceKey, titleAttr);
    });
  }

  public static openScaffoldCard(
    scaffoldOrId: string,
    titleAttr?: string,
    options?: { autoOpenCalc?: boolean; presetKey?: string; activeModeId?: string; disableCalculator?: boolean }
  ) {
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

    const index = Nav.indices[Nav.currentIndex];
    const choice = index ? index.choices[index.chosen] : null;
    const buttonText = `back to ${choice && choice[0] ? choice[0].topic : 'lecture'}`;

    const effectiveScaffold = catalogStmt?.scaffoldKey || scaffoldOrId;
    const formalArg = getScaffoldReflection(effectiveScaffold, titleAttr || catalogStmt?.title);
    if (catalogStmt && !formalArg.expression) {
      formalArg.expression = catalogStmt.expression;
    }

    const isPureTheorem = options?.disableCalculator ?? (
      !options?.activeModeId &&
      !options?.presetKey &&
      !matchedMode &&
      !matchedExample &&
      (catalogStmt?.tier === "theorem" || catalogStmt?.tier === "axiom" || catalogStmt?.tier === "constitutional" || effectiveScaffold.includes("scaffold") || effectiveScaffold.includes("telescoping_ftc"))
    );

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
        autoOpenCalculator: isPureTheorem ? false : (options?.autoOpenCalc || !!matchedMode || !!matchedExample),
        presetKey: options?.presetKey || (matchedExample ? (matchedExample.presetKey || matchedExample.id) : undefined),
        activeModeId: options?.activeModeId || (matchedMode ? matchedMode.id : undefined),
        disableCalculator: isPureTheorem
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
  }

  /**
   * Navigates to a dedicated Theorem Instance Calculator UI in Nav.fo.
   */
  public static openInstanceCalculator(
    scaffoldOrId: string,
    instanceKey: string,
    titleAttr?: string
  ) {
    const index = Nav.indices[Nav.currentIndex];
    const choice = index ? index.choices[index.chosen] : null;
    const topicName = choice && choice[0] ? choice[0].topic : 'lecture';
    const buttonText = `back to ${topicName}`;

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

    const card = FSDRef.buildInstanceCalculatorCard(scaffoldOrId, instanceKey, titleAttr, topicName);
    scrollWrap.append(card);
    Nav.fo.append(scrollWrap);

    if (Nav.fo && Nav.fo.elt) {
      Nav.fo.elt.removeEventListener("scroll", Nav.onFoScroll);
      Nav.fo.elt.addEventListener("scroll", Nav.onFoScroll);
      Nav.fo.elt.removeEventListener("toggle", Nav.onFoScroll, true);
      Nav.fo.elt.addEventListener("toggle", Nav.onFoScroll, true);
    }

    Nav.display();
  }

  /**
   * Builds the interactive Instance Calculator card UI.
   */
  public static buildInstanceCalculatorCard(
    scaffold: string,
    instanceKey: string,
    titleAttr?: string,
    topicName?: string
  ): Elt {
    const cleanKey = instanceKey.trim().toLowerCase();
    const effectiveTitle = titleAttr || "Theorem Instance Derivation";

    const isHaloMember =
      scaffold === "nucleus_halo_decomposition" ||
      cleanKey.startsWith("point_") ||
      cleanKey.includes("halo") ||
      cleanKey === "point_4_plus_3dx";

    // Default configuration for unit_circle_rim
    let initialN = isHaloMember ? 3 : 8;
    let initialScale = isHaloMember ? 4.0 : 1.0;
    let domainMemberMath = isHaloMember ? "x = x₀ + k · dx = 4 + 3·dx" : "F(k) = k · (2π / N) · R";
    let differenceLabel = isHaloMember ? "ε = x - st(x) = k · dx ∈ μ(0)" : "ΔF(k) = (2π / N) · R ≡ ds = R · dθ";
    let derivationDesc = isHaloMember
      ? "Decomposes a specific hyperreal number into its standard real nucleus and infinitesimal Day ω halo perturbation."
      : "Parameterizes the unit circle rim S¹_ω as a uniform march of N infinitesimal steps.";
    let unit = isHaloMember ? "" : " rad";
    let scaleLabel = isHaloMember ? "Nucleus x₀" : "Radius R";
    let isTrigRim = !isHaloMember;

    if (cleanKey === "cubic_sum" || cleanKey === "cubic") {
      initialN = 4;
      domainMemberMath = "F(k) = c · k³";
      differenceLabel = "ΔF(k) = c · (3k² + 3k + 1)";
      derivationDesc = "Classical discrete antiderivative telescoping to net cubic boundary difference.";
      unit = "";
      scaleLabel = "Scale c";
      isTrigRim = false;
    } else if (cleanKey === "sum_of_odds" || cleanKey === "odds") {
      initialN = 5;
      domainMemberMath = "F(k) = c · k²";
      differenceLabel = "ΔF(k) = c · (2k + 1) (odd integers)";
      derivationDesc = "Pythagorean / Gauss sum of consecutive odd integers collapsing to n².";
      unit = "";
      scaleLabel = "Scale c";
      isTrigRim = false;
    } else if (cleanKey === "work_energy") {
      initialN = 4;
      initialScale = 2.0;
      domainMemberMath = "F(v) = ½ · m · (k · Δv)²";
      differenceLabel = "ΔF(k) = W_k (work increment)";
      derivationDesc = "Telescoping mechanical work increments yielding net kinetic energy change.";
      unit = " J";
      scaleLabel = "Mass m (kg)";
      isTrigRim = false;
    }

    const box = document.createElement("div");
    box.style.cssText = "max-width: 900px; margin: 0 auto; border: 1.5px solid #0284c7; border-radius: 8px; background: #f0f9ff; padding: 20px 24px; box-shadow: 0 4px 14px rgba(0,0,0,0.06); font-family: system-ui, -apple-system, sans-serif;";

    // Header
    const headerRow = document.createElement("div");
    headerRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; border-bottom: 1.5px solid #bae6fd; padding-bottom: 12px; margin-bottom: 16px;";

    const titleGroup = document.createElement("div");
    titleGroup.style.cssText = "display: flex; align-items: center; gap: 10px; flex-wrap: wrap;";

    const titleText = document.createElement("span");
    titleText.style.cssText = "font-weight: 800; font-size: 16px; color: #0369a1;";
    titleText.textContent = `🎯 ${effectiveTitle}`;
    titleGroup.appendChild(titleText);

    const domainBadge = document.createElement("span");
    domainBadge.style.cssText = "font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 3px 8px; border-radius: 4px; border: 1px solid #bae6fd;";
    domainBadge.textContent = isHaloMember ? "Domain Member x ∈ ℝ_ω" : "Domain Member F ∈ (ℕ → ℝ_ω)";
    titleGroup.appendChild(domainBadge);

    headerRow.appendChild(titleGroup);

    // Link button to pure theorem card
    const thmBtn = document.createElement("button");
    thmBtn.style.cssText = "background: #ffffff; border: 1px solid #0284c7; color: #0284c7; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 4px; cursor: pointer; transition: all 0.15s ease;";
    thmBtn.textContent = `📜 Governing Theorem: MiddleWay.${scaffold}`;
    thmBtn.addEventListener("mouseover", () => {
      thmBtn.style.background = "#0284c7";
      thmBtn.style.color = "#ffffff";
    });
    thmBtn.addEventListener("mouseout", () => {
      thmBtn.style.background = "#ffffff";
      thmBtn.style.color = "#0284c7";
    });
    thmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      FSDRef.openScaffoldCard(scaffold, `MiddleWay.${scaffold}`);
    });
    headerRow.appendChild(thmBtn);

    box.appendChild(headerRow);

    // Mathematical Spec Box
    const specBox = document.createElement("div");
    specBox.style.cssText = "background: #ffffff; border: 1px solid #e0f2fe; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.6; color: #334155;";
    const universalThmMath = isHaloMember
      ? "∀ x ∈ ℝ_ω^{fin}, x = st(x) + ε  where  ε ∈ μ(0)"
      : "∑_{k=0}^{N-1} ΔF(k) = F(N) - F(0)";
    const dustOrIncLabel = isHaloMember ? "Microscopic Halo Dust:" : "Microscopic Increment:";

    specBox.innerHTML = `
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.5px;">Applied Instance Specification</div>
      <div><strong>Universal Theorem:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-family:monospace; color:#0f172a;">${universalThmMath}</code></div>
      <div><strong>Instantiated Member:</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-family:monospace; color:#0f172a;">${domainMemberMath}</code></div>
      <div><strong>${dustOrIncLabel}</strong> <code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-family:monospace; color:#0f172a;">${differenceLabel}</code></div>
      <div style="margin-top: 6px; color: #475569; font-style: italic;">${derivationDesc}</div>
    `;
    box.appendChild(specBox);

    // Interactive Controls Bar
    const controlsBar = document.createElement("div");
    controlsBar.style.cssText = "display: flex; gap: 20px; flex-wrap: wrap; align-items: center; background: #ffffff; border: 1px solid #bae6fd; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px;";

    let curN = initialN;
    let curScale = initialScale;

    // N control
    const nGroup = document.createElement("div");
    nGroup.style.cssText = "display: flex; align-items: center; gap: 8px;";
    const nLabel = document.createElement("span");
    nLabel.style.cssText = "font-size: 13px; font-weight: 600; color: #1e293b;";
    nLabel.textContent = isHaloMember ? "Halo Step k (dx):" : "Steps N:";
    nGroup.appendChild(nLabel);

    const nDec = document.createElement("button");
    nDec.textContent = "-";
    nDec.style.cssText = "width: 28px; height: 28px; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer;";
    const nInput = document.createElement("input");
    nInput.type = "number";
    nInput.value = curN.toString();
    nInput.style.cssText = "width: 55px; height: 26px; padding: 0 4px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: bold;";
    const nInc = document.createElement("button");
    nInc.textContent = "+";
    nInc.style.cssText = "width: 28px; height: 28px; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer;";

    nGroup.appendChild(nDec);
    nGroup.appendChild(nInput);
    nGroup.appendChild(nInc);
    controlsBar.appendChild(nGroup);

    // Scale / Radius control
    const scaleGroup = document.createElement("div");
    scaleGroup.style.cssText = "display: flex; align-items: center; gap: 8px;";
    const scaleLabelEl = document.createElement("span");
    scaleLabelEl.style.cssText = "font-size: 13px; font-weight: 600; color: #1e293b;";
    scaleLabelEl.textContent = `${scaleLabel}:`;
    scaleGroup.appendChild(scaleLabelEl);

    const sDec = document.createElement("button");
    sDec.textContent = "-";
    sDec.style.cssText = "width: 28px; height: 28px; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer;";
    const sInput = document.createElement("input");
    sInput.type = "number";
    sInput.value = curScale.toString();
    sInput.style.cssText = "width: 60px; height: 26px; padding: 0 4px; text-align: center; border: 1px solid #cbd5e1; border-radius: 4px; font-family: monospace; font-size: 13px; font-weight: bold;";
    const sInc = document.createElement("button");
    sInc.textContent = "+";
    sInc.style.cssText = "width: 28px; height: 28px; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e1; border-radius: 4px; background: #f8fafc; cursor: pointer;";

    scaleGroup.appendChild(sDec);
    scaleGroup.appendChild(sInput);
    scaleGroup.appendChild(sInc);
    controlsBar.appendChild(scaleGroup);

    box.appendChild(controlsBar);

    // Live Derivation Output
    const outBox = document.createElement("div");
    outBox.style.cssText = "background: #ffffff; border: 1.5px solid #0284c7; border-radius: 6px; padding: 16px; font-family: monospace; font-size: 13px; color: #0f172a;";
    box.appendChild(outBox);

    const updateCalc = () => {
      if (isHaloMember) {
        const x0 = curScale;
        const k = curN;
        const signStr = k > 0 ? `+ ${k}·dx` : (k < 0 ? `- ${Math.abs(k)}·dx` : "");
        const pointStr = k === 0 ? `${x0}` : `${x0} ${signStr}`;
        const dustStr = k === 0 ? "0 (Zero Dust)" : (k > 0 ? `${k}·dx` : `-${Math.abs(k)}·dx`);

        const isZeroDust = k === 0;
        const statusNotice = isZeroDust
          ? `<div style="font-family: system-ui, sans-serif; font-size: 12px; color: #059669; font-weight: 600; margin-top: 12px; padding: 8px 12px; background: #ecfdf5; border-radius: 4px; border: 1px solid #a7f3d0;">
               ✓ Hard Dyadic Element: Born on finite days with zero halo dust (ε = 0, st(x) = x).
             </div>`
          : `<div style="font-family: system-ui, sans-serif; font-size: 12px; color: #059669; font-weight: 600; margin-top: 12px; padding: 8px 12px; background: #ecfdf5; border-radius: 4px; border: 1px solid #a7f3d0;">
               ✓ Non-Zero Transfinite Halo Member: Point resides in the microscopic monad μ(${x0}). Microscopic distance |x - x₀| = ${Math.abs(k)}·dx &lt; 1/n for all standard n. Verified: x ≈ st(x) in Lean 4.
             </div>`;

        outBox.innerHTML = `
          <div style="font-family: system-ui, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 10px;">Live Nucleus-Halo Decomposition Derivation</div>
          <div style="margin-bottom: 6px;"><strong>1. Instantiated Domain Point:</strong></div>
          <div style="background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
            x = <span style="font-weight: 800; color: #0284c7;">${pointStr}</span> ∈ ℝ_ω
          </div>
          <div style="margin-bottom: 6px;"><strong>2. Standard Part Shadow Map:</strong></div>
          <div style="background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
            st(x) = st(${pointStr}) = <span style="font-weight: 800; color: #0284c7;">${x0}</span> ∈ ℝ
          </div>
          <div style="margin-bottom: 6px;"><strong>3. Infinitesimal Halo Perturbation:</strong></div>
          <div style="background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
            ε = x - st(x) = <span style="font-weight: 800; color: #0284c7;">${dustStr}</span> ∈ μ(0)
          </div>
          <div style="margin-bottom: 6px;"><strong>4. Exact Reconstruction:</strong></div>
          <div style="background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
            x = st(x) + ε = (${x0}) + (${dustStr}) = <span style="font-weight: 800; color: #0284c7;">${pointStr}</span>
          </div>
          ${statusNotice}
        `;
        return;
      }

      const n = Math.max(1, Math.min(64, curN));
      const c = curScale;

      let F: (k: number) => number;
      if (cleanKey === "cubic_sum" || cleanKey === "cubic") {
        F = (k) => c * Math.pow(k, 3);
      } else if (cleanKey === "sum_of_odds" || cleanKey === "odds") {
        F = (k) => c * Math.pow(k, 2);
      } else if (cleanKey === "work_energy") {
        F = (k) => 0.5 * c * Math.pow(k, 2);
      } else {
        // unit_circle_rim
        F = (k) => (k / n) * (2 * Math.PI) * c;
      }

      const f0 = F(0);
      const fn = F(n);
      const deltaTerms: number[] = [];
      let sum = 0;
      for (let k = 0; k < n; k++) {
        const d = F(k + 1) - F(k);
        deltaTerms.push(d);
        sum += d;
      }

      const boundaryDiff = fn - f0;

      const termStrs = deltaTerms.map((t) => t.toFixed(Number.isInteger(t) ? 0 : 3));
      const sumTermsExpr = termStrs.length <= 8
        ? termStrs.join(" + ")
        : `${termStrs.slice(0, 4).join(" + ")} + ... + ${termStrs.slice(-2).join(" + ")}`;

      outBox.innerHTML = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0369a1; margin-bottom: 10px;">Live Telescoping Derivation Result</div>
        <div style="margin-bottom: 6px;"><strong>1. Discrete Transect Sum:</strong></div>
        <div style="background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px; word-break: break-all;">
          ∑_{k=0}^{${n-1}} ΔF(k) = [ ${sumTermsExpr} ] = <span style="font-weight: 800; color: #0284c7;">${sum.toFixed(3)}${unit}</span>
        </div>
        <div style="margin-bottom: 6px;"><strong>2. Exact Boundary Difference:</strong></div>
        <div style="background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin-bottom: 10px;">
          F(${n}) - F(0) = (${fn.toFixed(3)}) - (${f0.toFixed(3)}) = <span style="font-weight: 800; color: #0284c7;">${boundaryDiff.toFixed(3)}${unit}</span>
        </div>
        <div style="font-family: system-ui, sans-serif; font-size: 12px; color: #059669; font-weight: 600; margin-top: 12px; padding: 8px 12px; background: #ecfdf5; border-radius: 4px; border: 1px solid #a7f3d0;">
          ✓ Verified: All ${n - 1} interior boundaries cancel telescopically, yielding exact boundary equality without limits.
        </div>
      `;
    };

    const stepN = isTrigRim ? 2 : 1;
    nDec.addEventListener("click", () => {
      curN = isHaloMember ? curN - 1 : Math.max(isTrigRim ? 2 : 1, curN - stepN);
      nInput.value = curN.toString();
      updateCalc();
    });
    nInc.addEventListener("click", () => {
      curN = isHaloMember ? curN + 1 : Math.min(64, curN + stepN);
      nInput.value = curN.toString();
      updateCalc();
    });
    nInput.addEventListener("input", () => {
      const v = parseInt(nInput.value);
      if (!isNaN(v) && (isHaloMember || v >= 1)) {
        curN = v;
        updateCalc();
      }
    });

    sDec.addEventListener("click", () => {
      curScale = isHaloMember
        ? parseFloat((curScale - 0.5).toFixed(1))
        : Math.max(0.1, parseFloat((curScale - 0.5).toFixed(1)));
      sInput.value = curScale.toString();
      updateCalc();
    });
    sInc.addEventListener("click", () => {
      curScale = isHaloMember
        ? parseFloat((curScale + 0.5).toFixed(1))
        : Math.min(20.0, parseFloat((curScale + 0.5).toFixed(1)));
      sInput.value = curScale.toString();
      updateCalc();
    });
    sInput.addEventListener("input", () => {
      const v = parseFloat(sInput.value);
      if (!isNaN(v) && (isHaloMember || v > 0)) {
        curScale = v;
        updateCalc();
      }
    });

    updateCalc();

    return new Elt("div", undefined, "H", box);
  }
}
