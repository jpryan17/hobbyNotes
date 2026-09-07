import { Elt } from "./elt.js";
import { SVGElt, SVGText } from "./svgElt.js";
import { SimulationResult, NumericRunnerRegistry, DomainSlotDef } from "./numericRunner.js";

export class NumericVisualizer extends Elt {
  private result: SimulationResult;
  private currentFrameIndex = 0;
  private isPlaying = false;
  private timer: any = null;

  private canvasWrap: Elt;
  private timeLabel: Elt;
  private slider: HTMLInputElement;
  private playBtn: Elt;
  private auditPill: Elt;
  private tensorDisplayWrap: Elt;
  private slotsInputsWrap: Elt;

  constructor(result: SimulationResult) {
    super("div");
    this.result = result;

    this.setA(
      "style",
      "margin-top: 14px; background: #0f172a; border: 1.5px solid #0284c7; border-radius: 8px; padding: 14px; color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;"
    );

    // Header
    const header = new Elt("div");
    header.setA(
      "style",
      "display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 8px; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;"
    );

    const titleWrap = new Elt("div");
    titleWrap.setA("style", "display: flex; align-items: center; gap: 8px;");
    const icon = new Elt("span");
    icon.setV("📊");
    const title = new Elt("span");
    title.setA("style", "font-weight: 700; font-size: 13px; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;");
    title.setV(result.title);
    titleWrap.append(icon);
    titleWrap.append(title);

    this.auditPill = new Elt("span");
    this.auditPill.setA(
      "style",
      "font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 12px; background: #166534; color: #dcfce7; border: 1px solid #22c55e;"
    );
    this.auditPill.setV("✓ Invariant Verified");

    header.append(titleWrap);
    header.append(this.auditPill);
    this.append(header);

    // 1. Interactive Domain-Typed Slot Inputs Section
    const slotsSection = new Elt("div");
    slotsSection.setA("style", "margin-bottom: 12px; background: #090d16; border: 1px solid #1e293b; border-radius: 6px; padding: 10px 12px;");

    const slotsSectionHeader = new Elt("div");
    slotsSectionHeader.setA("style", "font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: flex; justify-content: space-between;");
    slotsSectionHeader.setV("<span>⚙️ Domain-Typed Input Slots (User Configurable):</span><span style='color:#0284c7'>Type Safety: Channeled</span>");
    slotsSection.append(slotsSectionHeader);

    this.slotsInputsWrap = new Elt("div");
    this.slotsInputsWrap.setA("style", "display: flex; flex-wrap: wrap; gap: 10px; align-items: center;");
    this.buildSlotInputControls();
    slotsSection.append(this.slotsInputsWrap);
    this.append(slotsSection);

    // 2. Real-Time Tensor / Numeric Output Display
    this.tensorDisplayWrap = new Elt("div");
    this.tensorDisplayWrap.setA(
      "style",
      "margin-bottom: 12px; background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 10px 12px;"
    );
    this.append(this.tensorDisplayWrap);
    this.renderTensorDisplay();

    // 3. SVG Visualization Canvas
    this.canvasWrap = new Elt("div");
    this.canvasWrap.setA(
      "style",
      "background: #020617; border: 1px solid #1e293b; border-radius: 6px; padding: 10px; display: flex; justify-content: center; align-items: center; min-height: 180px; overflow: hidden;"
    );
    this.append(this.canvasWrap);

    // 4. Playback / Time Control Toolbar
    const controls = new Elt("div");
    controls.setA(
      "style",
      "display: flex; justify-content: space-between; align-items: center; margin-top: 12px; flex-wrap: wrap; gap: 10px;"
    );

    const btnGroup = new Elt("div");
    btnGroup.setA("style", "display: flex; gap: 6px; align-items: center;");

    this.playBtn = new Elt("button");
    this.playBtn.setA(
      "style",
      "background: #0284c7; color: #ffffff; border: 1px solid #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 700; cursor: pointer;"
    );
    this.playBtn.setV("▶ Play");
    this.playBtn.elt.addEventListener("click", () => this.togglePlay());

    const stepBtn = new Elt("button");
    stepBtn.setA(
      "style",
      "background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 4px 10px; border-radius: 4px; font-size: 11.5px; cursor: pointer;"
    );
    stepBtn.setV("⏭ Step");
    stepBtn.elt.addEventListener("click", () => this.stepForward());

    const resetBtn = new Elt("button");
    resetBtn.setA(
      "style",
      "background: #1e293b; color: #cbd5e1; border: 1px solid #334155; padding: 4px 10px; border-radius: 4px; font-size: 11.5px; cursor: pointer;"
    );
    resetBtn.setV("↺ Reset");
    resetBtn.elt.addEventListener("click", () => this.reset());

    btnGroup.append(this.playBtn);
    btnGroup.append(stepBtn);
    btnGroup.append(resetBtn);

    const sliderGroup = new Elt("div");
    sliderGroup.setA("style", "display: flex; align-items: center; gap: 8px; flex: 1; max-width: 320px; min-width: 180px;");

    this.slider = document.createElement("input");
    this.slider.type = "range";
    this.slider.min = "0";
    this.slider.max = (result.frames.length - 1).toString();
    this.slider.value = "0";
    this.slider.style.flex = "1";
    this.slider.style.cursor = "pointer";
    this.slider.addEventListener("input", () => {
      this.currentFrameIndex = parseInt(this.slider.value, 10);
      this.renderCurrentFrame();
    });

    this.timeLabel = new Elt("span");
    this.timeLabel.setA("style", "font-family: monospace; font-size: 11.5px; color: #94a3b8; min-width: 55px; text-align: right;");
    this.timeLabel.setV("t = 0.00s");

    sliderGroup.elt.appendChild(this.slider);
    sliderGroup.append(this.timeLabel);

    controls.append(btnGroup);
    controls.append(sliderGroup);
    this.append(controls);

    this.renderCurrentFrame();
  }

  /**
   * Builds domain-typed input controls for each slot
   */
  private buildSlotInputControls() {
    this.slotsInputsWrap.elt.innerHTML = "";

    this.result.domainSlots.forEach((slot) => {
      const slotBox = new Elt("div");
      slotBox.setA("style", "display: flex; align-items: center; gap: 6px; background: #1e293b; border: 1px solid #334155; border-radius: 4px; padding: 3px 8px;");

      const label = new Elt("span");
      label.setA("style", "font-size: 11px; font-weight: 700; color: #38bdf8; font-family: monospace;");
      label.setV(`${slot.name}:`);
      slotBox.append(label);

      const input = document.createElement("input");
      input.type = "number";
      input.value = slot.value;
      if (slot.min !== undefined) input.min = slot.min.toString();
      if (slot.max !== undefined) input.max = slot.max.toString();
      if (slot.step !== undefined) input.step = slot.step.toString();
      input.style.width = "55px";
      input.style.background = "#0f172a";
      input.style.color = "#f8fafc";
      input.style.border = "1px solid #475569";
      input.style.borderRadius = "3px";
      input.style.padding = "2px 4px";
      input.style.fontSize = "11.5px";
      input.style.fontFamily = "monospace";
      input.style.fontWeight = "bold";

      input.addEventListener("change", () => {
        slot.value = input.value;
        this.recalculateWithUserInputs();
      });

      slotBox.elt.appendChild(input);

      if (slot.unit) {
        const unit = new Elt("span");
        unit.setA("style", "font-size: 10.5px; color: #94a3b8;");
        unit.setV(slot.unit);
        slotBox.append(unit);
      }

      // Domain Type Badge
      const domBadge = new Elt("span");
      domBadge.setA("style", "font-size: 9.5px; padding: 1px 4px; border-radius: 3px; background: #0369a1; color: #ffffff; font-family: monospace; font-weight: 600;");
      domBadge.setV(slot.domain);
      slotBox.append(domBadge);

      this.slotsInputsWrap.append(slotBox);
    });
  }

  /**
   * Recalculates simulation and tensor output when user edits slot inputs
   */
  private recalculateWithUserInputs() {
    const slotMap: Record<string, string> = {};
    this.result.domainSlots.forEach((s) => {
      slotMap[s.name] = s.value;
    });

    const newResult = NumericRunnerRegistry.run(this.result.title, slotMap);
    if (!newResult) return;

    this.result = newResult;
    this.slider.max = (this.result.frames.length - 1).toString();
    this.currentFrameIndex = Math.min(this.currentFrameIndex, this.result.frames.length - 1);
    this.slider.value = this.currentFrameIndex.toString();

    this.renderTensorDisplay();
    this.renderCurrentFrame();
  }

  /**
   * Renders the bracketed Numeric / Tensor Result
   */
  private renderTensorDisplay() {
    this.tensorDisplayWrap.elt.innerHTML = "";

    const tout = this.result.currentTensorOutput;
    if (!tout) return;

    const tHeader = new Elt("div");
    tHeader.setA("style", "display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;");

    const tTitle = new Elt("span");
    tTitle.setA("style", "font-size: 11px; font-weight: 700; color: #a5f3fc; text-transform: uppercase; letter-spacing: 0.5px;");
    tTitle.setV(`⚡ Computed Numeric / Tensor Result: <b style="color:#ffffff">${tout.label}</b>`);

    const tDomain = new Elt("span");
    tDomain.setA("style", "font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #0284c7; color: #ffffff; font-weight: 700; font-family: monospace;");
    tDomain.setV(`Domain: ${tout.domain} (${tout.dimensions.join("×")})`);

    tHeader.append(tTitle);
    tHeader.append(tDomain);
    this.tensorDisplayWrap.append(tHeader);

    const pre = new Elt("pre");
    pre.setA(
      "style",
      "margin: 0; padding: 8px 12px; background: #000000; color: #38bdf8; border: 1px solid #1e293b; border-radius: 4px; font-family: 'Fira Code', Consolas, Monaco, monospace; font-size: 12px; line-height: 1.4; overflow-x: auto;"
    );
    pre.setV(tout.bracketedDisplay);
    this.tensorDisplayWrap.append(pre);
  }

  private togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private play() {
    this.isPlaying = true;
    this.playBtn.setV("⏸ Pause");
    this.playBtn.setA("style", "background: #e11d48; color: #ffffff; border: 1px solid #be123c; padding: 4px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 700; cursor: pointer;");

    this.timer = setInterval(() => {
      if (this.currentFrameIndex < this.result.frames.length - 1) {
        this.currentFrameIndex++;
        this.slider.value = this.currentFrameIndex.toString();
        this.renderCurrentFrame();
      } else {
        this.pause();
      }
    }, 60);
  }

  private pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.playBtn.setV("▶ Play");
    this.playBtn.setA("style", "background: #0284c7; color: #ffffff; border: 1px solid #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 11.5px; font-weight: 700; cursor: pointer;");
  }

  private stepForward() {
    this.pause();
    if (this.currentFrameIndex < this.result.frames.length - 1) {
      this.currentFrameIndex++;
      this.slider.value = this.currentFrameIndex.toString();
      this.renderCurrentFrame();
    }
  }

  private reset() {
    this.pause();
    this.currentFrameIndex = 0;
    this.slider.value = "0";
    this.renderCurrentFrame();
  }

  private renderCurrentFrame() {
    const frame = this.result.frames[this.currentFrameIndex];
    if (!frame) return;

    this.timeLabel.setV(`t = ${frame.time.toFixed(2)}s`);
    this.auditPill.setV(`✓ Invariant: ${frame.invariantMetric}`);

    this.canvasWrap.elt.innerHTML = "";

    if (this.result.variableLabels["accel"]) {
      this.renderFreeFallCanvas(frame);
    } else if (this.result.variableLabels["totalE"]) {
      this.renderWorkEnergyCanvas(frame);
    } else if (this.result.variableLabels["profile"]) {
      this.renderHeatDiffusionCanvas(frame);
    }
  }

  /**
   * Free Fall Canvas: Trajectory arc with moving particle
   */
  private renderFreeFallCanvas(frame: any) {
    const width = 500;
    const height = 180;
    const svg = new SVGElt("svg");
    svg.setAA(["width", width, "height", height, "style", "display: block;"]);

    const groundY = height - 25;
    const ground = new SVGElt("line");
    ground.setAA(["x1", 30, "y1", groundY, "x2", width - 20, "y2", groundY, "stroke", "#334155", "stroke-width", "2"]);
    svg.append(ground);

    const maxS = Math.max(...this.result.frames.map((f) => (f.data.s as number) || 1));
    const totalT = this.result.frames[this.result.frames.length - 1].time || 1;

    let pathD = "";
    this.result.frames.forEach((f, idx) => {
      const px = 40 + (f.time / totalT) * (width - 80);
      const py = groundY - ((f.data.s as number) / (maxS * 1.15)) * (height - 50);
      pathD += (idx === 0 ? "M " : " L ") + `${px.toFixed(1)} ${py.toFixed(1)}`;
    });

    const trajectory = new SVGElt("path");
    trajectory.setAA(["d", pathD, "fill", "none", "stroke", "#0284c7", "stroke-width", "1.5", "stroke-dasharray", "3,3", "opacity", "0.6"]);
    svg.append(trajectory);

    const curX = 40 + (frame.time / totalT) * (width - 80);
    const curY = groundY - ((frame.data.s as number) / (maxS * 1.15)) * (height - 50);

    const particle = new SVGElt("circle");
    particle.setAA(["cx", curX, "cy", curY, "r", "6", "fill", "#38bdf8", "stroke", "#ffffff", "stroke-width", "1.5"]);
    svg.append(particle);

    const vScale = 0.8;
    const vy = curY - (frame.data.v as number) * vScale;
    const vLine = new SVGElt("line");
    vLine.setAA(["x1", curX, "y1", curY, "x2", curX, "y2", vy, "stroke", "#f43f5e", "stroke-width", "2", "stroke-linecap", "round"]);
    svg.append(vLine);

    const textS = new SVGText();
    textS.setV(`s = ${(frame.data.s as number).toFixed(1)}m`);
    textS.setAA(["x", 40, "y", 22, "fill", "#38bdf8", "font-size", "12", "font-weight", "bold", "font-family", "monospace"]);
    svg.append(textS);

    const textV = new SVGText();
    textV.setV(`v = ${(frame.data.v as number).toFixed(1)}m/s`);
    textV.setAA(["x", 140, "y", 22, "fill", "#f43f5e", "font-size", "12", "font-weight", "bold", "font-family", "monospace"]);
    svg.append(textV);

    const textA = new SVGText();
    textA.setV(`a = ${(frame.data.accel as number).toFixed(2)}m/s² (Invariant ✓)`);
    textA.setAA(["x", 260, "y", 22, "fill", "#22c55e", "font-size", "12", "font-weight", "bold", "font-family", "monospace"]);
    svg.append(textA);

    this.canvasWrap.elt.appendChild(svg.elt);
  }

  /**
   * Work-Energy Canvas: Kinetic & Potential Energy Bars
   */
  private renderWorkEnergyCanvas(frame: any) {
    const width = 500;
    const height = 180;
    const svg = new SVGElt("svg");
    svg.setAA(["width", width, "height", height, "style", "display: block;"]);

    const groundY = height - 30;
    const maxE = Math.max(...this.result.frames.map((f) => (f.data.totalE as number) || 100));

    const ke = frame.data.ke as number;
    const pe = frame.data.pe as number;
    const totalE = frame.data.totalE as number;

    const barW = 70;
    const keH = (ke / maxE) * (height - 60);
    const peH = (pe / maxE) * (height - 60);
    const totH = (totalE / maxE) * (height - 60);

    const rectKE = new SVGElt("rect");
    rectKE.setAA(["x", 90, "y", groundY - keH, "width", barW, "height", keH, "fill", "#38bdf8", "rx", "4"]);
    svg.append(rectKE);

    const rectPE = new SVGElt("rect");
    rectPE.setAA(["x", 210, "y", groundY - peH, "width", barW, "height", peH, "fill", "#fbbf24", "rx", "4"]);
    svg.append(rectPE);

    const rectTot = new SVGElt("rect");
    rectTot.setAA(["x", 330, "y", groundY - totH, "width", barW, "height", totH, "fill", "#22c55e", "rx", "4"]);
    svg.append(rectTot);

    const base = new SVGElt("line");
    base.setAA(["x1", 50, "y1", groundY, "x2", 450, "y2", groundY, "stroke", "#334155", "stroke-width", "2"]);
    svg.append(base);

    const refLine = new SVGElt("line");
    refLine.setAA(["x1", 50, "y1", groundY - totH, "x2", 450, "y2", groundY - totH, "stroke", "#22c55e", "stroke-width", "1.5", "stroke-dasharray", "4,4"]);
    svg.append(refLine);

    const lKE = new SVGText();
    lKE.setV(`KE: ${ke.toFixed(1)}J`);
    lKE.setAA(["x", 92, "y", groundY + 18, "fill", "#38bdf8", "font-size", "11", "font-weight", "bold", "font-family", "monospace"]);
    svg.append(lKE);

    const lPE = new SVGText();
    lPE.setV(`PE: ${pe.toFixed(1)}J`);
    lPE.setAA(["x", 212, "y", groundY + 18, "fill", "#fbbf24", "font-size", "11", "font-weight", "bold", "font-family", "monospace"]);
    svg.append(lPE);

    const lTot = new SVGText();
    lTot.setV(`Total: ${totalE.toFixed(1)}J`);
    lTot.setAA(["x", 332, "y", groundY + 18, "fill", "#22c55e", "font-size", "11", "font-weight", "bold", "font-family", "monospace"]);
    svg.append(lTot);

    this.canvasWrap.elt.appendChild(svg.elt);
  }

  /**
   * Heat Diffusion Canvas: Multi-node rod temperature profile
   */
  private renderHeatDiffusionCanvas(frame: any) {
    const width = 500;
    const height = 180;
    const svg = new SVGElt("svg");
    svg.setAA(["width", width, "height", height, "style", "display: block;"]);

    const profile = (frame.data.profile as number[]) || [];
    const N = profile.length;
    const groundY = height - 35;
    const barWidth = Math.floor((width - 80) / N);

    profile.forEach((temp, i) => {
      const h = Math.max(2, (temp / 100) * (height - 65));
      const bx = 40 + i * barWidth;
      const by = groundY - h;

      const ratio = Math.min(1, Math.max(0, (temp - 20) / 70));
      const r = Math.round(56 + ratio * 190);
      const g = Math.round(189 - ratio * 120);
      const b = Math.round(248 - ratio * 200);
      const col = `rgb(${r},${g},${b})`;

      const rect = new SVGElt("rect");
      rect.setAA(["x", bx, "y", by, "width", barWidth - 2, "height", h, "fill", col, "rx", "2"]);
      svg.append(rect);

      if (N <= 12) {
        const tLabel = new SVGText();
        tLabel.setV(`${Math.round(temp)}°`);
        tLabel.setAA(["x", bx + 3, "y", by - 4, "fill", "#cbd5e1", "font-size", "9.5", "font-family", "monospace"]);
        svg.append(tLabel);
      }
    });

    const leftBoundary = new SVGElt("line");
    leftBoundary.setAA(["x1", 38, "y1", 20, "x2", 38, "y2", groundY, "stroke", "#94a3b8", "stroke-width", "3"]);
    svg.append(leftBoundary);

    const rightBoundary = new SVGElt("line");
    rightBoundary.setAA(["x1", 40 + N * barWidth, "y1", 20, "x2", 40 + N * barWidth, "y2", groundY, "stroke", "#94a3b8", "stroke-width", "3"]);
    svg.append(rightBoundary);

    const statusTxt = new SVGText();
    statusTxt.setV(`Global Thermal Sum: ${frame.data.heat} (Boundary Flux q_0 = q_N ≡ 0)`);
    statusTxt.setAA(["x", 40, "y", groundY + 22, "fill", "#22c55e", "font-size", "11", "font-weight", "bold", "font-family", "monospace"]);
    svg.append(statusTxt);

    this.canvasWrap.elt.appendChild(svg.elt);
  }
}
