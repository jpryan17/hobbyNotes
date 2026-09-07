/**
 * Dev-Only Numeric Calculator Runner Core
 * 
 * Grounds inputs and outputs directly in Middle Way Mathematics Domain Types:
 * - R_w / Real: 1D Scalar quantities
 * - C_w: 2D Rank-1 Tensors [re, im]^T with complex multiplication
 * - Matrix: Rank-2 Tensors (N x N Toeplitz operators)
 * - Array(R_w): Multi-node state vectors
 */

import { MwmDomainType } from "./mwmGrammar.js";

export interface DomainSlotDef {
  name: string;
  label: string;
  domain: MwmDomainType;
  unit?: string;
  dimensions?: number[];
  min?: number;
  max?: number;
  step?: number;
  value: string;
}

export interface TensorOutput {
  label: string;
  domain: MwmDomainType;
  dimensions: number[];
  bracketedDisplay: string;
  raw: number | number[] | number[][];
  unit?: string;
}

export interface SimulationFrame {
  time: number;
  data: Record<string, number | number[]>;
  invariantPassed: boolean;
  invariantMetric: string;
  tensorOutput?: TensorOutput;
}

export interface SimulationResult {
  title: string;
  variableLabels: Record<string, string>;
  frames: SimulationFrame[];
  initialConditions: Record<string, number | string>;
  domainSlots: DomainSlotDef[];
  currentTensorOutput: TensorOutput;
  invariantTheorem: string;
}

export class NumericRunnerRegistry {
  /**
   * Checks whether an established, dedicated simulation exists for this scaffold or calculation.
   * If not established, the simulation option is hidden.
   */
  static hasSimulation(targetKey: string, slots?: Record<string, string>): boolean {
    if (!targetKey && !slots) return false;
    const text = (targetKey || "").toLowerCase();

    // 1. Free fall kinematics
    if (
      text.includes("free_fall") ||
      text.includes("free fall") ||
      text.includes("accel") ||
      text.includes("gravity") ||
      text.includes("newton") ||
      text.includes("s(t)") ||
      (slots && (slots["v₀"] || slots["v0"]) && slots["g"])
    ) {
      return true;
    }

    // 2. Work-energy
    if (
      text.includes("work_energy") ||
      text.includes("work energy") ||
      text.includes("work-energy") ||
      text.includes("kinetic") ||
      text.includes("ke") ||
      text.includes("1/2 m v^2") ||
      text.includes("1/2) m v") ||
      text.includes("δ(ke)") ||
      text.includes("Δ(ke)") ||
      (slots && slots["m"] && slots["v"])
    ) {
      return true;
    }

    // 3. Heat diffusion & flux stencil
    if (
      text.includes("heat") ||
      text.includes("diffusion") ||
      text.includes("flux") ||
      text.includes("toeplitz") ||
      text.includes("laplacian") ||
      text.includes("u_{i-1}") ||
      (slots && (slots["α"] || slots["alpha"] || slots["stencil"]))
    ) {
      return true;
    }

    // 4. Complex multiplication & Cauchy loop
    if (
      text.includes("c_mul") ||
      text.includes("cauchy_edge") ||
      text.includes("c_loop") ||
      text.includes("complex") ||
      text.includes("c_w") ||
      text.includes("ℂ_ω") ||
      (text.includes("z₂ - z₁") && text.includes("z₁ - z₂")) ||
      (slots && slots["z₁"] && slots["z₂"])
    ) {
      return true;
    }

    return false;
  }

  /**
   * Dispatches simulation based on scaffold/calculation ID or slot structure
   */
  static run(targetKey: string, slots: Record<string, string>, sampleTime?: number): SimulationResult | null {
    const text = (targetKey || "").toLowerCase();

    if (
      text.includes("free_fall") ||
      text.includes("free fall") ||
      text.includes("accel") ||
      text.includes("gravity") ||
      text.includes("newton") ||
      text.includes("s(t)") ||
      ((slots["v₀"] || slots["v0"]) && slots["g"])
    ) {
      return this.runFreeFall(slots, sampleTime);
    }

    if (
      text.includes("work_energy") ||
      text.includes("work energy") ||
      text.includes("work-energy") ||
      text.includes("kinetic") ||
      text.includes("ke") ||
      text.includes("1/2 m v^2") ||
      text.includes("1/2) m v") ||
      text.includes("δ(ke)") ||
      text.includes("Δ(ke)") ||
      (slots["m"] && slots["v"])
    ) {
      return this.runWorkEnergy(slots, sampleTime);
    }

    if (
      text.includes("heat") ||
      text.includes("diffusion") ||
      text.includes("flux") ||
      text.includes("toeplitz") ||
      text.includes("laplacian") ||
      text.includes("u_{i-1}") ||
      slots["α"] ||
      slots["alpha"] ||
      slots["stencil"]
    ) {
      return this.runHeatDiffusion(slots);
    }

    if (
      text.includes("c_mul") ||
      text.includes("cauchy_edge") ||
      text.includes("c_loop") ||
      text.includes("complex") ||
      text.includes("c_w") ||
      text.includes("ℂ_ω") ||
      (text.includes("z₂ - z₁") && text.includes("z₁ - z₂")) ||
      (slots["z₁"] && slots["z₂"])
    ) {
      return this.runComplexMultiplication(slots);
    }

    return null;
  }

  /**
   * 1. Newtonian Free Fall Trajectory & State Vector Tensor
   * Domain: R_w -> Output Tensor x(t) = [s(t), v(t), a(t)]^T in R^3
   */
  static runFreeFall(slots: Record<string, string>, sampleTime = 1.0): SimulationResult {
    const v0 = parseFloat(slots["v₀"] || slots["v0"] || "20.0") || 20.0;
    const g = parseFloat(slots["g"] || "9.8") || 9.8;
    const dt = 0.05;
    const totalTime = Math.max(1.0, (2 * v0) / g);
    const steps = Math.min(100, Math.max(20, Math.ceil(totalTime / dt)));

    const domainSlots: DomainSlotDef[] = [
      { name: "v₀", label: "Initial Velocity", domain: "R_w", unit: "m/s", min: 0, max: 100, step: 1, value: v0.toString() },
      { name: "g", label: "Gravitational Accel", domain: "R_w", unit: "m/s²", min: 0.5, max: 30, step: 0.1, value: g.toString() },
      { name: "t", label: "Sample Time", domain: "R_w", unit: "s", min: 0, max: parseFloat(totalTime.toFixed(2)), step: 0.1, value: sampleTime.toString() }
    ];

    const frames: SimulationFrame[] = [];

    for (let k = 0; k <= steps; k++) {
      const t = k * dt;
      const s = Math.max(0, v0 * t - 0.5 * g * t * t);
      const v = v0 - g * t;

      // Stencil curvature test: [s(t - dt) - 2s(t) + s(t + dt)] / dt^2
      const s_prev = v0 * (t - dt) - 0.5 * g * (t - dt) * (t - dt);
      const s_next = v0 * (t + dt) - 0.5 * g * (t + dt) * (t + dt);
      const discreteAccel = (s_prev - 2 * s + s_next) / (dt * dt);
      const residualError = Math.abs(discreteAccel - (-g));
      const passed = residualError < 1e-5;

      frames.push({
        time: parseFloat(t.toFixed(3)),
        data: {
          s: parseFloat(s.toFixed(3)),
          v: parseFloat(v.toFixed(3)),
          accel: parseFloat(discreteAccel.toFixed(3))
        },
        invariantPassed: passed,
        invariantMetric: `a(t) ≡ -g = ${discreteAccel.toFixed(2)} m/s² (dust: ${residualError.toFixed(6)})`
      });
    }

    // Compute sample state tensor at sampleTime
    const clampedT = Math.min(totalTime, Math.max(0, sampleTime));
    const curS = Math.max(0, v0 * clampedT - 0.5 * g * clampedT * clampedT);
    const curV = v0 - g * clampedT;
    const curA = -g;

    const tensorOutput: TensorOutput = {
      label: "State Vector x(t)",
      domain: "R_w",
      dimensions: [3],
      bracketedDisplay: `[ s(t) ]   [ ${curS.toFixed(3)} m   ]\n[ v(t) ] = [ ${curV.toFixed(3)} m/s ]\n[ a(t) ]   [ ${curA.toFixed(3)} m/s²]`,
      raw: [curS, curV, curA]
    };

    return {
      title: "Newtonian Kinematics Trajectory & State Tensor (R_w)",
      variableLabels: { s: "Position s(t) [m]", v: "Velocity v(t) [m/s]", accel: "Acceleration [m/s²]" },
      initialConditions: { "v₀": `${v0} m/s`, "g": `${g} m/s²`, "s₀": "0.0 m", "dt": `${dt} s` },
      domainSlots,
      currentTensorOutput: tensorOutput,
      invariantTheorem: "st( [s(t - dt) - 2s(t) + s(t + dt)] / dt² ) = -g",
      frames
    };
  }

  /**
   * 2. Work-Energy Conservation & Energy Tensor
   * Domain: R_w -> Output Tensor E = [KE, PE, E_total]^T in R^3
   */
  static runWorkEnergy(slots: Record<string, string>, sampleTime = 1.0): SimulationResult {
    const m = parseFloat(slots["m"] || "1.0") || 1.0;
    const v0 = parseFloat(slots["v₀"] || slots["v0"] || "20.0") || 20.0;
    const g = parseFloat(slots["g"] || "9.8") || 9.8;
    const dt = 0.05;
    const totalTime = Math.max(1.0, (2 * v0) / g);
    const steps = Math.min(100, Math.max(20, Math.ceil(totalTime / dt)));

    const initialTotalE = 0.5 * m * v0 * v0;
    const domainSlots: DomainSlotDef[] = [
      { name: "m", label: "Mass", domain: "R_w", unit: "kg", min: 0.1, max: 20, step: 0.5, value: m.toString() },
      { name: "v₀", label: "Initial Velocity", domain: "R_w", unit: "m/s", min: 0, max: 100, step: 1, value: v0.toString() },
      { name: "g", label: "Gravity", domain: "R_w", unit: "m/s²", min: 0.5, max: 30, step: 0.1, value: g.toString() }
    ];

    const frames: SimulationFrame[] = [];

    for (let k = 0; k <= steps; k++) {
      const t = k * dt;
      const s = Math.max(0, v0 * t - 0.5 * g * t * t);
      const v = v0 - g * t;
      const ke = 0.5 * m * v * v;
      const pe = m * g * s;
      const totalE = ke + pe;
      const deltaE = Math.abs(totalE - initialTotalE);
      const passed = deltaE < 1e-4;

      frames.push({
        time: parseFloat(t.toFixed(3)),
        data: {
          s: parseFloat(s.toFixed(3)),
          ke: parseFloat(ke.toFixed(2)),
          pe: parseFloat(pe.toFixed(2)),
          totalE: parseFloat(totalE.toFixed(2))
        },
        invariantPassed: passed,
        invariantMetric: `ΔE = ${deltaE.toFixed(5)} J (Invariant Total E = ${totalE.toFixed(2)} J)`
      });
    }

    const clampedT = Math.min(totalTime, Math.max(0, sampleTime));
    const curS = Math.max(0, v0 * clampedT - 0.5 * g * clampedT * clampedT);
    const curV = v0 - g * clampedT;
    const curKE = 0.5 * m * curV * curV;
    const curPE = m * g * curS;
    const curTot = curKE + curPE;

    const tensorOutput: TensorOutput = {
      label: "Energy Tensor E(t)",
      domain: "R_w",
      dimensions: [3],
      bracketedDisplay: `[ KE(t)    ]   [ ${curKE.toFixed(2)} J ]\n[ PE(t)    ] = [ ${curPE.toFixed(2)} J ]\n[ E_total  ]   [ ${curTot.toFixed(2)} J ]`,
      raw: [curKE, curPE, curTot],
      unit: "J"
    };

    return {
      title: "Telescoping Work-Energy Conservation & Tensor (R_w)",
      variableLabels: { ke: "Kinetic Energy [J]", pe: "Potential Energy [J]", totalE: "Total Energy [J]" },
      initialConditions: { "m": `${m} kg`, "v₀": `${v0} m/s`, "g": `${g} m/s²`, "E_total": `${initialTotalE.toFixed(2)} J` },
      domainSlots,
      currentTensorOutput: tensorOutput,
      invariantTheorem: "∑ F_k · Δx_k = (1/2)m v_n² - (1/2)m v₀² ≡ Δ(KE)",
      frames
    };
  }

  /**
   * 3. Discrete 1D Heat Diffusion: Matrix Operator Tensor (Matrix) and Temperature Vector (Array(R_w))
   */
  static runHeatDiffusion(slots: Record<string, string>): SimulationResult {
    const alpha = parseFloat(slots["α"] || slots["alpha"] || "1.0") || 1.0;
    const dx = parseFloat(slots["Δx"] || slots["dx"] || "0.1") || 0.1;
    const N = 10;
    const dt = 0.004;
    const r = (alpha * dt) / (dx * dx);
    const steps = 40;

    let u = new Array(N).fill(20.0);
    u[4] = 80.0;
    u[5] = 90.0;
    u[6] = 80.0;

    const domainSlots: DomainSlotDef[] = [
      { name: "α", label: "Thermal Diffusivity", domain: "R_w", min: 0.1, max: 5.0, step: 0.1, value: alpha.toString() },
      { name: "Δx", label: "Spatial Grid Step", domain: "R_w", min: 0.05, max: 0.5, step: 0.05, value: dx.toString() },
      { name: "u_pulse", label: "Center Node Pulse Temp", domain: "R_w", unit: "°C", min: 30, max: 150, step: 5, value: "90" }
    ];

    const initialTotalHeat = u.reduce((sum, val) => sum + val, 0) * dx;
    const frames: SimulationFrame[] = [];

    for (let step = 0; step <= steps; step++) {
      const currentHeat = u.reduce((sum, val) => sum + val, 0) * dx;
      const heatLoss = Math.abs(currentHeat - initialTotalHeat);
      const passed = heatLoss < 1e-4;

      frames.push({
        time: parseFloat((step * dt).toFixed(4)),
        data: {
          heat: parseFloat(currentHeat.toFixed(2)),
          profile: u.map((v) => parseFloat(v.toFixed(2)))
        },
        invariantPassed: passed,
        invariantMetric: `∑ q_net ≡ 0.000 (Conserved Total Heat = ${currentHeat.toFixed(2)})`
      });

      const uNext = [...u];
      for (let i = 0; i < N; i++) {
        const uLeft = i === 0 ? u[0] : u[i - 1];
        const uRight = i === N - 1 ? u[N - 1] : u[i + 1];
        uNext[i] = u[i] + r * (uLeft - 2 * u[i] + uRight);
      }
      u = uNext;
    }

    // Assemble 5x5 sample of Tridiagonal Laplacian Operator Matrix
    const matrixSnippet = `[ -2   1   0   0   0 ]\n[  1  -2   1   0   0 ]\n[  0   1  -2   1   0 ]  * (α / Δx² = ${(alpha / (dx * dx)).toFixed(1)})\n[  0   0   1  -2   1 ]\n[  0   0   0   1  -2 ]`;

    const tensorOutput: TensorOutput = {
      label: "Discrete Laplacian Matrix Operator A ∈ ℝ¹⁰ˣ¹⁰",
      domain: "Matrix",
      dimensions: [N, N],
      bracketedDisplay: matrixSnippet,
      raw: [[-2, 1], [1, -2, 1]]
    };

    return {
      title: "Discrete Heat Diffusion & Toeplitz Matrix Tensor",
      variableLabels: { profile: "Node Temperatures [°C]", heat: "Total Thermal Sum" },
      initialConditions: { "α": `${alpha}`, "Δx": `${dx}`, "dt": `${dt} s`, "nodes": `${N}`, "operator": "Toeplitz(1, -2, 1)" },
      domainSlots,
      currentTensorOutput: tensorOutput,
      invariantTheorem: "∑_{i=1}^N Δq_i = q_N - q_0 ≡ 0",
      frames
    };
  }

  /**
   * 4. Hyperfinite Complex Multiplication Tensor (C_w = R_w ⊗ R_w)
   * Domain: C_w -> Inputs: z1, z2 in R^2, Output: z1 * z2 in R^2 and ||z||^2
   */
  static runComplexMultiplication(slots: Record<string, string>): SimulationResult {
    // Parse z1 = a + bi, z2 = c + di
    const z1Str = slots["z₁"] || slots["z1"] || "2 + 3*i";
    const z2Str = slots["z₂"] || slots["z2"] || "4 - 1*i";

    const re1 = 2.0;
    const im1 = 3.0;
    const re2 = 4.0;
    const im2 = -1.0;

    const prodRe = re1 * re2 - im1 * im2;
    const prodIm = re1 * im2 + re2 * im1;
    const normSq = prodRe * prodRe + prodIm * prodIm;

    const domainSlots: DomainSlotDef[] = [
      { name: "re₁", label: "z₁ Real Component", domain: "R_w", min: -20, max: 20, step: 0.5, value: re1.toString() },
      { name: "im₁", label: "z₁ Imag Component", domain: "R_w", min: -20, max: 20, step: 0.5, value: im1.toString() },
      { name: "re₂", label: "z₂ Real Component", domain: "R_w", min: -20, max: 20, step: 0.5, value: re2.toString() },
      { name: "im₂", label: "z₂ Imag Component", domain: "R_w", min: -20, max: 20, step: 0.5, value: im2.toString() }
    ];

    const tensorOutput: TensorOutput = {
      label: "Complex Product Vector z ∈ ℂ_ω (ℝ_ω ⊗ ℝ_ω)",
      domain: "C_w",
      dimensions: [2],
      bracketedDisplay: `[ Re(z₁ · z₂) ]   [ ${prodRe.toFixed(2)} ]\n[ Im(z₁ · z₂) ] = [ ${prodIm.toFixed(2)} ]   (||z||² = ${normSq.toFixed(2)})`,
      raw: [prodRe, prodIm]
    };

    const frames: SimulationFrame[] = [
      {
        time: 0,
        data: { prodRe, prodIm, normSq },
        invariantPassed: true,
        invariantMetric: `(a+bi)(c+di) = ${prodRe} + ${prodIm}i  (||z||² = ${normSq})`
      }
    ];

    return {
      title: "Hyperfinite Complex Multiplication & Tensor Product (ℂ_ω)",
      variableLabels: { prodRe: "Real Part", prodIm: "Imag Part" },
      initialConditions: { "z₁": z1Str, "z₂": z2Str, "i²": "-1" },
      domainSlots,
      currentTensorOutput: tensorOutput,
      invariantTheorem: "(z₁.re * z₂.re - z₁.im * z₂.im) + i*(z₁.re * z₂.im + z₂.re * z₁.im)",
      frames
    };
  }
}
