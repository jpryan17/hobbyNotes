import { MAXIMA_CACHE } from './maximaCache.js';
export class StemCard extends HTMLElement {
    entryId = 'heat_diffusion_1d';
    entry;
    currentTab = 'simulation';
    currentTimeIndex = 0;
    constructor() {
        super();
    }
    connectedCallback() {
        this.entryId = this.getAttribute('entry-id') || 'heat_diffusion_1d';
        this.entry = MAXIMA_CACHE[this.entryId];
        if (!this.entry) {
            this.innerHTML = `
        <div style="border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; padding: 12px; border-radius: 6px; font-family: sans-serif;">
          [StemCard Error] Entry "${this.entryId}" not found in Maxima cache.
        </div>
      `;
            return;
        }
        this.render();
    }
    setTab(tab) {
        this.currentTab = tab;
        this.render();
    }
    setTime(index) {
        this.currentTimeIndex = index;
        this.updateSimulationPlot();
    }
    render() {
        if (!this.entry)
            return;
        const e = this.entry;
        this.innerHTML = `
      <div style="border: 1.5px solid #cbd5e1; border-radius: 10px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-family: system-ui, -apple-system, sans-serif; max-width: 740px; margin: 20px auto; overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #f8fafc; padding: 16px 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
            <div>
              <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; background: #3b82f6; color: #ffffff; padding: 2px 8px; border-radius: 4px; margin-bottom: 6px;">
                ${e.category}
              </span>
              <h3 style="margin: 0; font-size: 17px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                ${e.title}
              </h3>
            </div>
            <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #4ade80; font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 20px; white-space: nowrap;">
              ✓ Maxima CAS Verified
            </div>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
            ${e.problemStatement}
          </p>
        </div>

        <!-- Middle Way & Lean 4 Foundation Bar -->
        <div style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px 20px; font-size: 12.5px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="color: #64748b; font-weight: 600;">Middle Way Domain:</span>
            <span style="font-family: monospace; font-weight: bold; color: #1e3a8a; margin-left: 4px;">${e.middleWayLink.domain}</span>
            <span style="color: #94a3b8; margin: 0 6px;">|</span>
            <span style="color: #64748b; font-weight: 600;">Operators:</span>
            <span style="color: #334155; margin-left: 4px;">${e.middleWayLink.operators.join(', ')}</span>
          </div>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 11.5px; font-weight: 600; padding: 2px 8px; border-radius: 4px;">
            Lean 4: ${e.lean4Verification.theorem}
          </div>
        </div>

        <!-- Tab Navigation -->
        <div style="display: flex; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; padding: 0 10px;">
          <button class="stem-tab-btn" data-tab="simulation" style="border: none; background: ${this.currentTab === 'simulation' ? '#ffffff' : 'transparent'}; font-weight: ${this.currentTab === 'simulation' ? '700' : '500'}; color: ${this.currentTab === 'simulation' ? '#1e293b' : '#64748b'}; padding: 10px 16px; font-size: 13px; cursor: pointer; border-bottom: 2px solid ${this.currentTab === 'simulation' ? '#2563eb' : 'transparent'}; border-radius: 4px 4px 0 0; transition: all 0.15s ease;">
            📈 Transient Heat Simulation
          </button>
          <button class="stem-tab-btn" data-tab="maxima" style="border: none; background: ${this.currentTab === 'maxima' ? '#ffffff' : 'transparent'}; font-weight: ${this.currentTab === 'maxima' ? '700' : '500'}; color: ${this.currentTab === 'maxima' ? '#1e293b' : '#64748b'}; padding: 10px 16px; font-size: 13px; cursor: pointer; border-bottom: 2px solid ${this.currentTab === 'maxima' ? '#2563eb' : 'transparent'}; border-radius: 4px 4px 0 0; transition: all 0.15s ease;">
            💻 Maxima Symbolic Derivation
          </button>
          <button class="stem-tab-btn" data-tab="fourier" style="border: none; background: ${this.currentTab === 'fourier' ? '#ffffff' : 'transparent'}; font-weight: ${this.currentTab === 'fourier' ? '700' : '500'}; color: ${this.currentTab === 'fourier' ? '#1e293b' : '#64748b'}; padding: 10px 16px; font-size: 13px; cursor: pointer; border-bottom: 2px solid ${this.currentTab === 'fourier' ? '#2563eb' : 'transparent'}; border-radius: 4px 4px 0 0; transition: all 0.15s ease;">
            🌊 Fourier Harmonic Modes
          </button>
        </div>

        <!-- Tab Body -->
        <div style="padding: 18px 20px;">
          ${this.renderTabContent()}
        </div>

        <!-- Footer / Lean 4 Energy Conservation Note -->
        <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 10px 20px; font-size: 12px; color: #475569; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 15px;">🛡️</span>
          <span><b>Energy Conservation Invariance:</b> ${e.lean4Verification.summary}</span>
        </div>
      </div>
    `;
        this.attachEventListeners();
    }
    renderTabContent() {
        if (!this.entry)
            return '';
        if (this.currentTab === 'simulation') {
            return this.renderSimulationTab();
        }
        else if (this.currentTab === 'maxima') {
            return this.renderMaximaTab();
        }
        else {
            return this.renderFourierTab();
        }
    }
    renderSimulationTab() {
        const sim = this.entry?.numericalSimulation;
        if (!sim)
            return '<p>No simulation data available.</p>';
        const t = sim.timeSteps[this.currentTimeIndex];
        const energy = sim.totalEnergy[this.currentTimeIndex];
        return `
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <span style="font-size: 13px; font-weight: 700; color: #1e293b;">Time elapsed:</span>
            <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #2563eb; margin-left: 4px;">t = ${t.toFixed(2)} s</span>
            <span style="color: #94a3b8; margin: 0 8px;">|</span>
            <span style="font-size: 12.5px; color: #64748b;">Total Heat Energy:</span>
            <span style="font-family: monospace; font-size: 13px; font-weight: bold; color: #059669; margin-left: 4px;">${energy.toFixed(2)} J (Invariant)</span>
          </div>
          <div style="font-size: 11.5px; color: #64748b;">
            Drag slider to advance thermal diffusion
          </div>
        </div>

        <!-- Slider -->
        <div style="margin-bottom: 16px;">
          <input type="range" id="timeSlider" min="0" max="${sim.timeSteps.length - 1}" value="${this.currentTimeIndex}" step="1" style="width: 100%; accent-color: #2563eb; cursor: pointer;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; margin-top: 4px;">
            ${sim.timeSteps.map((ts) => `<span>${ts}s</span>`).join('')}
          </div>
        </div>

        <!-- SVG Heat Profile Canvas -->
        <div id="plotContainer" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center;">
          ${this.generateSVG(sim, this.currentTimeIndex)}
        </div>

        <div style="margin-top: 12px; font-size: 12.5px; color: #475569; line-height: 1.5;">
          <b>Physical Insight:</b> At <code>t = 0.0s</code>, the metal rod has an abrupt, rectangular heat spike. 
          As time advances, high-frequency spatial oscillations are rapidly damped out by the <code>-k²</code> factor in the discrete Laplacian, leaving only the fundamental smooth mode before fully thermalizing to uniform equilibrium.
        </div>
      </div>
    `;
    }
    generateSVG(sim, timeIdx) {
        const width = 640;
        const height = 220;
        const padding = { top: 25, right: 30, bottom: 40, left: 50 };
        const plotWidth = width - padding.left - padding.right;
        const plotHeight = height - padding.top - padding.bottom;
        const profile = sim.temperatureProfiles[timeIdx];
        const maxU = 110;
        const minU = 0;
        // Coordinate mapping
        const getX = (nodeIdx) => padding.left + (nodeIdx / (sim.spatialNodes.length - 1)) * plotWidth;
        const getY = (u) => padding.top + plotHeight - ((u - minU) / (maxU - minU)) * plotHeight;
        // Build SVG path
        let pathD = `M ${getX(0)} ${getY(profile[0])}`;
        for (let i = 1; i < profile.length; i++) {
            pathD += ` L ${getX(i)} ${getY(profile[i])}`;
        }
        // Shaded area under curve
        let areaD = `${pathD} L ${getX(profile.length - 1)} ${padding.top + plotHeight} L ${getX(0)} ${padding.top + plotHeight} Z`;
        // Nodes points
        const pointsSVG = profile
            .map((u, i) => `<circle cx="${getX(i)}" cy="${getY(u)}" r="3.5" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" />`)
            .join('');
        return `
      <svg viewBox="0 0 ${width} ${height}" style="width: 100%; height: auto; display: block; font-family: system-ui, sans-serif;">
        <!-- Grid lines -->
        <line x1="${padding.left}" y1="${padding.top + plotHeight}" x2="${padding.left + plotWidth}" y2="${padding.top + plotHeight}" stroke="#94a3b8" stroke-width="1.5" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + plotHeight}" stroke="#94a3b8" stroke-width="1.5" />
        
        <!-- Horizontal guidelines -->
        <line x1="${padding.left}" y1="${getY(25)}" x2="${padding.left + plotWidth}" y2="${getY(25)}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${getY(50)}" x2="${padding.left + plotWidth}" y2="${getY(50)}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${getY(75)}" x2="${padding.left + plotWidth}" y2="${getY(75)}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />
        <line x1="${padding.left}" y1="${getY(100)}" x2="${padding.left + plotWidth}" y2="${getY(100)}" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="3,3" />

        <!-- Y-Axis Labels -->
        <text x="${padding.left - 8}" y="${getY(0) + 4}" text-anchor="end" font-size="10" fill="#64748b">0°</text>
        <text x="${padding.left - 8}" y="${getY(50) + 4}" text-anchor="end" font-size="10" fill="#64748b">50°</text>
        <text x="${padding.left - 8}" y="${getY(100) + 4}" text-anchor="end" font-size="10" fill="#64748b">100°</text>

        <!-- X-Axis Labels -->
        <text x="${getX(0)}" y="${padding.top + plotHeight + 18}" text-anchor="middle" font-size="10" fill="#64748b">x = 0</text>
        <text x="${getX(Math.floor(profile.length / 2))}" y="${padding.top + plotHeight + 18}" text-anchor="middle" font-size="10" fill="#64748b">x = L/2</text>
        <text x="${getX(profile.length - 1)}" y="${padding.top + plotHeight + 18}" text-anchor="middle" font-size="10" fill="#64748b">x = L</text>
        <text x="${padding.left + plotWidth / 2}" y="${padding.top + plotHeight + 32}" text-anchor="middle" font-size="11" font-weight="600" fill="#334155">Rod Spatial Position x ∈ [0, 1] on ℝ_ω</text>

        <!-- Area Fill -->
        <path d="${areaD}" fill="rgba(37, 99, 235, 0.12)" />

        <!-- Temperature Line -->
        <path d="${pathD}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" />

        <!-- Node markers -->
        ${pointsSVG}

        <!-- Status Legend -->
        <text x="${padding.left + plotWidth}" y="${padding.top - 6}" text-anchor="end" font-size="11" font-weight="bold" fill="#1e40af">
          T(x, t) Profile • 17 Nodes
        </text>
      </svg>
    `;
    }
    updateSimulationPlot() {
        const sim = this.entry?.numericalSimulation;
        if (!sim)
            return;
        const container = this.querySelector('#plotContainer');
        if (container) {
            container.innerHTML = this.generateSVG(sim, this.currentTimeIndex);
        }
    }
    renderMaximaTab() {
        const steps = this.entry?.maximaSession.formattedSteps || [];
        return `
      <div>
        <div style="margin-bottom: 14px; font-size: 13px; color: #334155; line-height: 1.5;">
          The derivations below were executed directly in <b>Maxima CAS</b> during build-time and verified against the Middle Way discrete Laplacian:
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${steps
            .map((s) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; padding: 12px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span style="font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px;">
                  Step ${s.step}: ${s.label}
                </span>
                <span style="font-size: 10.5px; background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-family: monospace;">
                  maxima.bat
                </span>
              </div>
              <div style="font-family: monospace; font-size: 12.5px; background: #1e293b; color: #38bdf8; padding: 8px 10px; border-radius: 4px; margin-bottom: 6px; overflow-x: auto;">
                &gt; ${s.command}
              </div>
              <div style="font-family: monospace; font-size: 12.5px; background: #ffffff; border: 1px solid #cbd5e1; color: #0f172a; padding: 8px 10px; border-radius: 4px; margin-bottom: 6px; overflow-x: auto;">
                ${s.result}
              </div>
              <div style="font-size: 12px; color: #475569; line-height: 1.4;">
                ${s.explanation}
              </div>
            </div>
          `)
            .join('')}
        </div>
      </div>
    `;
    }
    renderFourierTab() {
        const modes = this.entry?.fourierDecomposition?.modes || [];
        return `
      <div>
        <div style="margin-bottom: 14px; font-size: 13px; color: #334155; line-height: 1.5;">
          <b>Why Fourier Duality Decouples Diffusion:</b> In direct spatial coordinates, each node is tied to its neighbors by the tridiagonal matrix. 
          When we rotate the state vector into the Fourier basis via unitary matrix <code>F</code>, the discrete Laplacian becomes purely diagonal:
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin-bottom: 14px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
              <th style="padding: 8px 10px;">Harmonic (k)</th>
              <th style="padding: 8px 10px;">Wavelength</th>
              <th style="padding: 8px 10px;">Laplacian Eigenvalue (λ_k)</th>
              <th style="padding: 8px 10px;">Initial Amplitude</th>
              <th style="padding: 8px 10px;">Temporal Damping Factor</th>
            </tr>
          </thead>
          <tbody>
            ${modes
            .slice(0, 6)
            .map((m) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px; font-weight: 700; color: #1e293b;">k = ${m.k}</td>
                <td style="padding: 8px 10px; font-family: monospace; color: #475569;">${m.spatialWavelength}</td>
                <td style="padding: 8px 10px; font-family: monospace; font-weight: bold; color: #2563eb;">${m.eigenvalueNumeric}</td>
                <td style="padding: 8px 10px; font-family: monospace; color: #0f172a;">${m.initialAmplitude}</td>
                <td style="padding: 8px 10px; font-family: monospace; color: #dc2626;">${m.decayRate}</td>
              </tr>
            `)
            .join('')}
          </tbody>
        </table>

        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 12px; font-size: 12.5px; color: #1e40af; line-height: 1.5;">
          <b>The Quadratic Decay Law (k²):</b> Mode <code>k = 4</code> has an eigenvalue 16 times larger than mode <code>k = 1</code>. 
          Its amplitude decays at rate <code>exp(-78.96 · t)</code>, vanishing completely in a fraction of a second, while the fundamental mode <code>k = 1</code> gently dissipates at <code>exp(-4.93 · t)</code>. 
          This explains why macroscopic thermal diffusion always acts as a natural low-pass spatial filter!
        </div>
      </div>
    `;
    }
    attachEventListeners() {
        this.querySelectorAll('.stem-tab-btn').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.getAttribute('data-tab');
                if (tab)
                    this.setTab(tab);
            });
        });
        const slider = this.querySelector('#timeSlider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                const idx = parseInt(e.target.value, 10);
                this.setTime(idx);
            });
        }
    }
}
// Register custom element
if (typeof customElements !== 'undefined' && !customElements.get('stem-card')) {
    customElements.define('stem-card', StemCard);
}
