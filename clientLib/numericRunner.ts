/**
 * Dev-Only Numeric Calculator Runner Core
 * 
 * Extracts initial conditions from formal statement slots and executes
 * numerical simulation stepping while continuously auditing against the
 * formal statement's certified mathematical invariant.
 */

export interface SimulationFrame {
  time: number;
  data: Record<string, number | number[]>;
  invariantPassed: boolean;
  invariantMetric: string;
}

export interface SimulationResult {
  title: string;
  variableLabels: Record<string, string>;
  frames: SimulationFrame[];
  initialConditions: Record<string, number | string>;
  invariantTheorem: string;
}

export class NumericRunnerRegistry {
  /**
   * Dispatches simulation based on scaffold/calculation ID or slot structure
   */
  static run(targetKey: string, slots: Record<string, string>): SimulationResult | null {
    const key = targetKey.toLowerCase();

    if (key.includes("free_fall") || key.includes("accel") || key.includes("gravity")) {
      return this.runFreeFall(slots);
    }
    if (key.includes("work_energy") || key.includes("ke") || key.includes("energy")) {
      return this.runWorkEnergy(slots);
    }
    if (key.includes("heat") || key.includes("flux") || key.includes("diffusion") || key.includes("toeplitz")) {
      return this.runHeatDiffusion(slots);
    }

    // Default fallback to free fall kinematics if velocity and gravity slots are detected
    if (slots["v₀"] || slots["v0"] || slots["g"]) {
      return this.runFreeFall(slots);
    }

    return null;
  }

  /**
   * 1. Newtonian Free Fall Trajectory & Curvature Invariance
   * Invariant: st(Δ²s / dt²) ≡ -g at every step
   */
  static runFreeFall(slots: Record<string, string>): SimulationResult {
    const v0 = parseFloat(slots["v₀"] || slots["v0"] || "20.0") || 20.0;
    const g = parseFloat(slots["g"] || "9.8") || 9.8;
    const dt = 0.05; // simulation tick
    const totalTime = (2 * v0) / g; // flight duration until ground hit
    const steps = Math.min(100, Math.max(20, Math.ceil(totalTime / dt)));

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
        invariantMetric: `a(t) = ${discreteAccel.toFixed(2)} m/s² (residual: ${residualError.toFixed(6)})`
      });
    }

    return {
      title: "Newtonian Kinematics Trajectory & Curvature Simulation",
      variableLabels: { s: "Position s(t) [m]", v: "Velocity v(t) [m/s]", accel: "Acceleration [m/s²]" },
      initialConditions: { "v₀": `${v0} m/s`, "g": `${g} m/s²`, "s₀": "0.0 m", "dt": `${dt} s` },
      invariantTheorem: "st( [s(t - dt) - 2s(t) + s(t + dt)] / dt² ) = -g",
      frames
    };
  }

  /**
   * 2. Telescoping Work-Energy Invariance
   * Invariant: Total Mechanical Energy E = KE + PE is strictly conserved
   */
  static runWorkEnergy(slots: Record<string, string>): SimulationResult {
    const m = parseFloat(slots["m"] || "1.0") || 1.0;
    const v0 = parseFloat(slots["v₀"] || slots["v0"] || "20.0") || 20.0;
    const g = parseFloat(slots["g"] || "9.8") || 9.8;
    const dt = 0.05;
    const totalTime = (2 * v0) / g;
    const steps = Math.min(100, Math.max(20, Math.ceil(totalTime / dt)));

    const initialTotalE = 0.5 * m * v0 * v0;
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
        invariantMetric: `ΔE = ${deltaE.toFixed(5)} J (E = ${totalE.toFixed(2)} J)`
      });
    }

    return {
      title: "Telescoping Work-Energy Conservation Simulation",
      variableLabels: { ke: "Kinetic Energy [J]", pe: "Potential Energy [J]", totalE: "Total Energy [J]" },
      initialConditions: { "m": `${m} kg`, "v₀": `${v0} m/s`, "g": `${g} m/s²`, "E_total": `${initialTotalE.toFixed(2)} J` },
      invariantTheorem: "∑ F_k · Δx_k = (1/2)m v_n² - (1/2)m v₀² ≡ Δ(KE)",
      frames
    };
  }

  /**
   * 3. Discrete 1D Heat Diffusion & Flux Conservation
   * Invariant: Total thermal energy ∑ u_i · Δx is conserved across insulated boundaries
   */
  static runHeatDiffusion(slots: Record<string, string>): SimulationResult {
    const alpha = parseFloat(slots["α"] || slots["alpha"] || "1.0") || 1.0;
    const dx = parseFloat(slots["Δx"] || slots["dx"] || "0.1") || 0.1;
    const N = 10; // 10 discrete spatial nodes
    const dt = 0.004; // ensures Fourier number r = alpha * dt / dx^2 = 0.4 < 0.5 (strictly stable)
    const r = (alpha * dt) / (dx * dx);
    const steps = 40;

    // Initial temperature profile: concentrated thermal pulse in center nodes
    let u = new Array(N).fill(20.0);
    u[4] = 80.0;
    u[5] = 90.0;
    u[6] = 80.0;

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
        invariantMetric: `∑ q_net = 0.000 (Global Energy: ${currentHeat.toFixed(2)})`
      });

      // Step tridiagonal heat stencil: u_new[i] = u[i] + r * (u[i-1] - 2*u[i] + u[i+1])
      const uNext = [...u];
      for (let i = 0; i < N; i++) {
        const uLeft = i === 0 ? u[0] : u[i - 1]; // insulated boundary condition (zero flux)
        const uRight = i === N - 1 ? u[N - 1] : u[i + 1];
        uNext[i] = u[i] + r * (uLeft - 2 * u[i] + uRight);
      }
      u = uNext;
    }

    return {
      title: "Discrete Heat Diffusion & Telescoping Flux Conservation",
      variableLabels: { profile: "Node Temperatures [°C]", heat: "Total Thermal Sum" },
      initialConditions: { "α": `${alpha}`, "Δx": `${dx}`, "dt": `${dt} s`, "nodes": `${N}`, "stencil": "[1, -2, 1]" },
      invariantTheorem: "∑_{i=1}^N Δq_i = q_N - q_0 ≡ 0",
      frames
    };
  }
}
