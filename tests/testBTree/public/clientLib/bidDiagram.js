import { SVGElt, SVGGrpElt, SVGText, SVGSelectableText, } from './svgElt.js';
import { BIDPresets, BID_SCENARIOS, DEFAULT_BID_PALETTE, } from './bidConfig.js';
import { SequentialEvidenceController, BetaBinomialController, } from './bidControllers.js';
export class BIDDiagram extends SVGElt {
    config;
    palette;
    width = 900;
    height = 440;
    fontSize = 13;
    contentGroup;
    scenario;
    // Controllers for stateful modes
    seqController = new SequentialEvidenceController('sensor');
    betaController = new BetaBinomialController(2, 2);
    // Base rate specific state
    baseRatePrevalence = 0.01;
    baseRateSensitivity = 0.95;
    baseRateFPR = 0.05;
    // Odds gauge state
    priorOddsH1 = 0.3;
    likelihoodRatio = 4.0; // Bayes Factor
    // State tree interactive state
    selectedStateDepth = 4;
    selectedStatePos = 13; // default outcome: H H T H
    constructor(configOrMode) {
        super('svg');
        if (typeof configOrMode === 'string') {
            const preset = BIDPresets[configOrMode] || {};
            this.config = { mode: configOrMode, ...preset };
        }
        else {
            this.config = configOrMode;
        }
        this.palette = this.config.palette || DEFAULT_BID_PALETTE;
        this.scenario = this.config.scenario || BID_SCENARIOS.sensor;
        this.contentGroup = new SVGGrpElt();
        this.append(this.contentGroup);
        this.render();
    }
    scaleToWidth(usableWidth) {
        const origWidth = this.config.width || 900;
        const scale = Math.min(1.2, Math.max(0.45, usableWidth / origWidth));
        this.contentGroup.xscale(scale, scale);
        this.setAA(['width', usableWidth, 'height', this.height * scale + 30]);
    }
    setScenario(scenarioKey) {
        if (BID_SCENARIOS[scenarioKey]) {
            this.scenario = BID_SCENARIOS[scenarioKey];
            this.seqController = new SequentialEvidenceController(scenarioKey);
            this.render();
        }
    }
    render() {
        this.contentGroup.removeChildren();
        switch (this.config.mode) {
            case 'stateTree':
                this.renderStateTreeView();
                break;
            case 'transect':
                this.renderTransectView();
                break;
            case 'filter':
                this.renderFilterView();
                break;
            case 'mosaic':
                this.renderMosaicView();
                break;
            case 'treeProjection':
                this.renderTreeProjectionView();
                break;
            case 'sequential':
                this.renderSequentialView();
                break;
            case 'oddsGauge':
                this.renderOddsGaugeView();
                break;
            case 'continuous':
                this.renderContinuousView();
                break;
            case 'baseRate':
                this.renderBaseRateView();
                break;
        }
    }
    // =========================================================================
    // 0. STATE SPACE TREE VIEW (Centerpiece Interactive Omega Inspector)
    // =========================================================================
    renderStateTreeView() {
        const g = this.contentGroup;
        this.addHeader(g, 'State Space Tree (Ω): Connecting Theories to Observations', 30);
        const desc = new SVGText();
        desc.setAA(['x', 40, 'y', 52, 'font-size', 12, 'fill', this.palette.textMuted]);
        desc.setV('The 2-successor tree grows upward from Root 0 to the Sample Space canopy (Ω). Click any node to evaluate evidence!');
        g.append(desc);
        const maxD = 4; // 16 elemental states across the top
        const treeLeft = 40;
        const treeWidth = 470;
        const rootY = 385;
        const canopyY = 100;
        const levelHeight = (rootY - canopyY) / maxD;
        // Helper to get node (x, y)
        const getNodePos = (d, pos) => {
            const count = Math.pow(2, d);
            const slotW = treeWidth / count;
            const x = treeLeft + (pos + 0.5) * slotW;
            const y = rootY - d * levelHeight;
            return [x, y];
        };
        // Helper to get binary / outcome string (H = 1, T = 0)
        const getOutcomeStr = (d, pos) => {
            if (d === 0)
                return '';
            let s = '';
            for (let bit = d - 1; bit >= 0; bit--) {
                const val = (pos >> bit) & 1;
                s += val === 1 ? 'H' : 'T';
            }
            return s;
        };
        const selD = this.selectedStateDepth;
        const selPos = this.selectedStatePos;
        const isTopLeaf = selD >= maxD;
        // Helper to check if a node (d, pos) is on the ascending path from Root to (selD, selPos)
        const isOnAscendingPath = (d, pos) => {
            if (d > selD)
                return false;
            const shift = selD - d;
            return (selPos >> shift) === pos;
        };
        // Helper to check if a node (d, pos) is in the descendant subtree cone above (selD, selPos)
        const isInSubtreeCone = (d, pos) => {
            if (d < selD)
                return false;
            const shift = d - selD;
            return (pos >> shift) === selPos;
        };
        // 1. Draw Canopy Line for Sample Space Omega at top
        const canopyLineY = canopyY - 18;
        this.drawLine(g, treeLeft - 5, canopyLineY, treeLeft + treeWidth + 5, canopyLineY, '#0284c7', 2);
        this.addText(g, 'Sample Space Canopy: Ω (16 Elemental States)', treeLeft + treeWidth / 2, canopyLineY - 6, 11, '#0284c7', 'middle', true);
        // 2. Draw Tree Links
        for (let d = 0; d < maxD; d++) {
            const count = Math.pow(2, d);
            for (let pos = 0; pos < count; pos++) {
                const [px, py] = getNodePos(d, pos);
                const [lx, ly] = getNodePos(d + 1, pos * 2);
                const [rx, ry] = getNodePos(d + 1, pos * 2 + 1);
                const leftOnPath = isOnAscendingPath(d, pos) && isOnAscendingPath(d + 1, pos * 2);
                const rightOnPath = isOnAscendingPath(d, pos) && isOnAscendingPath(d + 1, pos * 2 + 1);
                const leftInCone = isInSubtreeCone(d, pos) && isInSubtreeCone(d + 1, pos * 2);
                const rightInCone = isInSubtreeCone(d, pos) && isInSubtreeCone(d + 1, pos * 2 + 1);
                const leftColor = leftOnPath ? '#0284c7' : (leftInCone ? '#10b981' : '#cbd5e1');
                const leftWidth = leftOnPath ? 3.5 : (leftInCone ? 2.5 : 1.5);
                const rightColor = rightOnPath ? '#0284c7' : (rightInCone ? '#10b981' : '#cbd5e1');
                const rightWidth = rightOnPath ? 3.5 : (rightInCone ? 2.5 : 1.5);
                this.drawLine(g, px, py, lx, ly, leftColor, leftWidth);
                this.drawLine(g, px, py, rx, ry, rightColor, rightWidth);
            }
        }
        // 3. Draw Tree Nodes
        for (let d = 0; d <= maxD; d++) {
            const count = Math.pow(2, d);
            for (let pos = 0; pos < count; pos++) {
                const [nx, ny] = getNodePos(d, pos);
                const isSelected = d === selD && pos === selPos;
                const onPath = isOnAscendingPath(d, pos);
                const inCone = isInSubtreeCone(d, pos);
                const circle = new SVGElt('circle');
                const r = d === 0 ? 12 : (d === maxD ? 8.5 : 10);
                let fillColor = '#ffffff';
                let strokeColor = '#94a3b8';
                let strokeWidth = 1.5;
                if (isSelected) {
                    fillColor = '#f59e0b'; // Amber for selected node
                    strokeColor = '#b45309';
                    strokeWidth = 3;
                }
                else if (onPath) {
                    fillColor = '#e0f2fe'; // Light blue for ancestor spine
                    strokeColor = '#0284c7';
                    strokeWidth = 2.5;
                }
                else if (inCone) {
                    fillColor = '#d1fae5'; // Emerald tint for descendant subtree cone
                    strokeColor = '#10b981';
                    strokeWidth = 2;
                }
                circle.setAA([
                    'cx', nx,
                    'cy', ny,
                    'r', r,
                    'fill', fillColor,
                    'stroke', strokeColor,
                    'stroke-width', strokeWidth,
                    'cursor', 'pointer',
                ]);
                circle.elt.addEventListener('click', () => {
                    this.selectedStateDepth = d;
                    this.selectedStatePos = pos;
                    this.render();
                });
                g.append(circle);
                // Node text label
                if (d === 0) {
                    this.addText(g, '0', nx, ny + 4, 10, isSelected ? '#ffffff' : '#1e293b', 'middle', true);
                }
                else if (d <= 2) {
                    const outcome = getOutcomeStr(d, pos);
                    this.addText(g, outcome, nx, ny + 3.5, 8.5, isSelected ? '#ffffff' : '#1e293b', 'middle', true);
                }
            }
        }
        // 4. Right-Side Descriptive & Interactive Widget Panel
        const cardX = 540;
        const cardY = 65;
        const cardW = 335;
        const cardH = 355;
        this.drawRect(g, cardX, cardY, cardW, cardH, '#ffffff', '#cbd5e1', 1, 10);
        const outcome = getOutcomeStr(selD, selPos);
        const numH = (outcome.match(/H/g) || []).length;
        const numT = (outcome.match(/T/g) || []).length;
        // Hypothesis Likelihoods:
        // Fair: P(H)=0.5 -> P(state) = 0.5^selD
        // Biased: P(H)=0.75 -> P(state) = 0.75^numH * 0.25^numT
        const pHFair = Math.pow(0.5, selD);
        const pHBiased = Math.pow(0.75, numH) * Math.pow(0.25, numT);
        const bayesFactor = pHFair > 0 ? pHBiased / pHFair : 1;
        // Prior 50/50 -> Posterior
        const priorFair = 0.5;
        const priorBiased = 0.5;
        const postBiased = (pHBiased * priorBiased) / (pHBiased * priorBiased + pHFair * priorFair);
        const postFair = 1 - postBiased;
        if (isTopLeaf) {
            // --- Top State Leaf Panel ---
            this.drawRect(g, cardX + 16, cardY + 16, cardW - 32, 28, '#eff6ff', '#bfdbfe', 1, 6);
            this.addText(g, 'State Observation in Ω', cardX + cardW / 2, cardY + 34, 12, '#1e40af', 'middle', true);
            // Outcome Pill & Descriptive Narrative
            const outcomeBadge = outcome.split('').join(' - ');
            this.addText(g, `Outcome: [ ${outcomeBadge} ]`, cardX + 20, cardY + 74, 15, '#1e293b', 'start', true);
            this.addText(g, `Physical result: ${numH} Heads, ${numT} Tails in 4 coin tosses`, cardX + 20, cardY + 94, 11.5, '#64748b');
            // Model Likelihoods Section
            this.addText(g, '1. Likelihood of this State under Competing Theories:', cardX + 20, cardY + 128, 12, '#0f172a', 'start', true);
            // Fair Model Bar
            this.addText(g, 'Fair Coin (50% Heads):', cardX + 24, cardY + 148, 11, '#10b981', 'start', true);
            this.addText(g, `${(pHFair * 100).toFixed(2)}%`, cardX + cardW - 24, cardY + 148, 11, '#10b981', 'end', true);
            this.drawRect(g, cardX + 24, cardY + 154, cardW - 48, 10, '#f1f5f9', '#e2e8f0', 1, 3);
            this.drawRect(g, cardX + 24, cardY + 154, Math.max(4, (cardW - 48) * (pHFair / 0.35)), 10, '#10b981', '#059669', 1, 3);
            // Biased Model Bar
            this.addText(g, 'Biased Coin (75% Heads):', cardX + 24, cardY + 184, 11, '#8b5cf6', 'start', true);
            this.addText(g, `${(pHBiased * 100).toFixed(2)}%`, cardX + cardW - 24, cardY + 184, 11, '#8b5cf6', 'end', true);
            this.drawRect(g, cardX + 24, cardY + 190, cardW - 48, 10, '#f1f5f9', '#e2e8f0', 1, 3);
            this.drawRect(g, cardX + 24, cardY + 190, Math.max(4, (cardW - 48) * (pHBiased / 0.35)), 10, '#8b5cf6', '#7c3aed', 1, 3);
            // Evidence Impact & Bayes Factor
            const favoredModel = bayesFactor >= 1 ? 'Biased Model' : 'Fair Model';
            const bfVal = bayesFactor >= 1 ? bayesFactor : 1 / bayesFactor;
            this.drawRect(g, cardX + 16, cardY + 215, cardW - 32, 42, '#fffbeb', '#fef3c7', 1, 6);
            this.addText(g, `Evidence Multiplier (Bayes Factor): ${bfVal.toFixed(2)}×`, cardX + 24, cardY + 233, 11.5, '#b45309', 'start', true);
            this.addText(g, `This state is ${bfVal.toFixed(1)}× more consistent with the ${favoredModel}.`, cardX + 24, cardY + 248, 10.5, '#92400e');
            // Updated Beliefs (Prior -> Posterior)
            this.addText(g, '2. Updated Belief Distribution (Prior 50/50 → Posterior):', cardX + 20, cardY + 280, 11.5, '#0f172a', 'start', true);
            // Stacked Bar
            const barY = cardY + 294;
            const barW = cardW - 48;
            const fairW = barW * postFair;
            const biasedW = barW * postBiased;
            this.drawRect(g, cardX + 24, barY, fairW, 22, '#10b981', '#059669', 1, 4);
            this.drawRect(g, cardX + 24 + fairW, barY, biasedW, 22, '#8b5cf6', '#7c3aed', 1, 4);
            if (fairW > 35)
                this.addText(g, `Fair ${(postFair * 100).toFixed(0)}%`, cardX + 24 + fairW / 2, barY + 15, 10.5, '#ffffff', 'middle', true);
            if (biasedW > 35)
                this.addText(g, `Biased ${(postBiased * 100).toFixed(0)}%`, cardX + 24 + fairW + biasedW / 2, barY + 15, 10.5, '#ffffff', 'middle', true);
            this.addText(g, 'Click any other leaf or branch node to explore!', cardX + cardW / 2, cardY + cardH - 12, 10.5, '#94a3b8', 'middle');
        }
        else {
            // --- Composite Subtree Event Panel ---
            this.drawRect(g, cardX + 16, cardY + 16, cardW - 32, 28, '#ecfdf5', '#a7f3d0', 1, 6);
            this.addText(g, 'Composite Event in Ω (Subtree)', cardX + cardW / 2, cardY + 34, 12, '#065f46', 'middle', true);
            const spanStates = Math.pow(2, maxD - selD);
            const prefixBadge = outcome.length > 0 ? outcome.split('').join(' - ') + ' - *' : 'All States (Root)';
            this.addText(g, `Event: [ ${prefixBadge} ]`, cardX + 20, cardY + 74, 15, '#1e293b', 'start', true);
            this.addText(g, `Subtree covers ${spanStates} possible states in Ω (green cone)`, cardX + 20, cardY + 94, 11.5, '#059669', 'start', true);
            // Event Likelihood Section
            this.addText(g, '1. Total Event Probability P(Event | Theory):', cardX + 20, cardY + 128, 12, '#0f172a', 'start', true);
            // Fair Model Event Bar
            this.addText(g, 'Fair Coin (50% Heads):', cardX + 24, cardY + 148, 11, '#10b981', 'start', true);
            this.addText(g, `${(pHFair * 100).toFixed(1)}%`, cardX + cardW - 24, cardY + 148, 11, '#10b981', 'end', true);
            this.drawRect(g, cardX + 24, cardY + 154, cardW - 48, 10, '#f1f5f9', '#e2e8f0', 1, 3);
            this.drawRect(g, cardX + 24, cardY + 154, Math.max(4, (cardW - 48) * pHFair), 10, '#10b981', '#059669', 1, 3);
            // Biased Model Event Bar
            this.addText(g, 'Biased Coin (75% Heads):', cardX + 24, cardY + 184, 11, '#8b5cf6', 'start', true);
            this.addText(g, `${(pHBiased * 100).toFixed(1)}%`, cardX + cardW - 24, cardY + 184, 11, '#8b5cf6', 'end', true);
            this.drawRect(g, cardX + 24, cardY + 190, cardW - 48, 10, '#f1f5f9', '#e2e8f0', 1, 3);
            this.drawRect(g, cardX + 24, cardY + 190, Math.max(4, (cardW - 48) * pHBiased), 10, '#8b5cf6', '#7c3aed', 1, 3);
            // Event Bayes Factor
            const favoredModel = bayesFactor >= 1 ? 'Biased Model' : 'Fair Model';
            const bfVal = bayesFactor >= 1 ? bayesFactor : 1 / bayesFactor;
            this.drawRect(g, cardX + 16, cardY + 215, cardW - 32, 42, '#f0fdf4', '#dcfce7', 1, 6);
            this.addText(g, `Event Bayes Factor: ${bfVal.toFixed(2)}×`, cardX + 24, cardY + 233, 11.5, '#166534', 'start', true);
            this.addText(g, `Observing this event gives ${bfVal.toFixed(1)}× support for ${favoredModel}.`, cardX + 24, cardY + 248, 10.5, '#15803d');
            // Updated Beliefs
            this.addText(g, '2. Updated Belief Distribution (Prior 50/50 → Posterior):', cardX + 20, cardY + 280, 11.5, '#0f172a', 'start', true);
            const barY = cardY + 294;
            const barW = cardW - 48;
            const fairW = barW * postFair;
            const biasedW = barW * postBiased;
            this.drawRect(g, cardX + 24, barY, fairW, 22, '#10b981', '#059669', 1, 4);
            this.drawRect(g, cardX + 24 + fairW, barY, biasedW, 22, '#8b5cf6', '#7c3aed', 1, 4);
            if (fairW > 35)
                this.addText(g, `Fair ${(postFair * 100).toFixed(0)}%`, cardX + 24 + fairW / 2, barY + 15, 10.5, '#ffffff', 'middle', true);
            if (biasedW > 35)
                this.addText(g, `Biased ${(postBiased * 100).toFixed(0)}%`, cardX + 24 + fairW + biasedW / 2, barY + 15, 10.5, '#ffffff', 'middle', true);
            this.addText(g, 'Click an individual leaf above to inspect a single state!', cardX + cardW / 2, cardY + cardH - 12, 10.5, '#94a3b8', 'middle');
        }
    }
    // =========================================================================
    // 1. TRANSECT VIEW (Hyperfinite Lattice & Point Masses)
    // =========================================================================
    renderTransectView() {
        const g = this.contentGroup;
        this.addHeader(g, 'Hyperfinite Transect: Discrete Point Masses on ℝ_ω', 30);
        const desc = new SVGText();
        desc.setAA(['x', 40, 'y', 60, 'font-size', 12, 'fill', this.palette.textMuted]);
        desc.setV('The unit interval [0, 1] as an ordered hyperfinite lattice with infinitesimal step size dx = 1/ω = ε > 0.');
        g.append(desc);
        const tx = 60;
        const ty = 140;
        const tWidth = 780;
        const tHeight = 50;
        // Outer Transect Bar
        const bgRect = new SVGElt('rect');
        bgRect.setAA(['x', tx, 'y', ty, 'width', tWidth, 'height', tHeight, 'fill', '#f1f5f9', 'stroke', '#94a3b8', 'stroke-width', 2, 'rx', 6]);
        g.append(bgRect);
        // Hypothesis partition
        const hyps = this.scenario.hypotheses;
        let currentX = tx;
        hyps.forEach((h, idx) => {
            const segW = h.prior * tWidth;
            const segRect = new SVGElt('rect');
            segRect.setAA(['x', currentX, 'y', ty, 'width', segW, 'height', tHeight, 'fill', h.color, 'opacity', 0.85]);
            g.append(segRect);
            // Label inside segment
            const lbl = new SVGText();
            lbl.setAA(['x', currentX + segW / 2, 'y', ty + 30, 'font-size', 13, 'font-weight', 'bold', 'fill', '#ffffff', 'text-anchor', 'middle']);
            lbl.setV(`${h.name} (${(h.prior * 100).toFixed(0)}%)`);
            g.append(lbl);
            currentX += segW;
        });
        // Infinitesimal Lattice ticks
        const numTicks = 32;
        for (let i = 0; i <= numTicks; i++) {
            const tickX = tx + (i / numTicks) * tWidth;
            const line = new SVGElt('line');
            line.setAA(['x1', tickX, 'y1', ty + tHeight, 'x2', tickX, 'y2', ty + tHeight + 8, 'stroke', '#64748b', 'stroke-width', 1]);
            g.append(line);
        }
        // Interval endpoints
        this.addText(g, 'x = 0', tx, ty + tHeight + 24, 12, '#334155', 'start');
        this.addText(g, 'x_k = k · dx', tx + tWidth / 2, ty + tHeight + 24, 12, '#334155', 'middle');
        this.addText(g, 'x = 1', tx + tWidth, ty + tHeight + 24, 12, '#334155', 'end');
        // Infinitesimal Point Mass Callout
        const calloutY = 270;
        const box = new SVGElt('rect');
        box.setAA(['x', tx, 'y', calloutY, 'width', tWidth, 'height', 100, 'fill', '#eff6ff', 'stroke', '#bfdbfe', 'stroke-width', 1.5, 'rx', 8]);
        g.append(box);
        this.addText(g, '• Radically Elementary Properties:', tx + 20, calloutY + 25, 13, '#1e3a8a', 'start', true);
        this.addText(g, '1. Positive Point Masses: Every node x_k has non-zero infinitesimal weight P(x_k) = p(x_k) · dx > 0.', tx + 30, calloutY + 48, 12, '#1e40af');
        this.addText(g, '2. Exact Zero Equivalence: P(E) = 0  ⟺  E = ∅. Only strictly empty events carry zero probability.', tx + 30, calloutY + 70, 12, '#1e40af');
        this.addText(g, '3. Hyperfinite Summation: P(E) = ∑_{x_k ∈ E} P(x_k) = 1.0 (exact finite arithmetic).', tx + 30, calloutY + 92, 12, '#1e40af');
    }
    // =========================================================================
    // 2. FILTER VIEW (The 3-Stage Bayesian Slicing & Rescaling)
    // =========================================================================
    renderFilterView() {
        const g = this.contentGroup;
        this.addHeader(g, "The 3-Stage Bayesian Filter: Slicing & Normalization", 30);
        const tx = 80;
        const tWidth = 740;
        const hyps = this.scenario.hypotheses;
        // Stage 1: Prior Transect
        const y1 = 70;
        this.addText(g, 'Stage 1: Prior Distribution P(H) on Unit Transect', tx, y1 - 8, 12, '#1e293b', 'start', true);
        let curX = tx;
        hyps.forEach((h) => {
            const w = h.prior * tWidth;
            this.drawRect(g, curX, y1, w, 32, h.color, '#cbd5e1', 0.85);
            this.addText(g, `${h.name} : P=${(h.prior).toFixed(2)}`, curX + w / 2, y1 + 20, 11, '#ffffff', 'middle', true);
            curX += w;
        });
        // Arrow 1 -> 2
        this.drawArrowDown(g, tx + tWidth / 2, y1 + 38, `Evidence "${this.scenario.evidenceName}" arrives — Likelihood Slicing P(E | H)`);
        // Stage 2: Likelihood Filtered Slices
        const y2 = 175;
        this.addText(g, 'Stage 2: Likelihood Slicing → Joint Area P(E ∩ H) = P(E|H) · P(H)', tx, y2 - 8, 12, '#1e293b', 'start', true);
        curX = tx;
        let totalJoint = 0;
        const jointData = [];
        hyps.forEach((h) => {
            const w = h.prior * tWidth;
            const activeW = w * h.likelihood;
            const joint = h.prior * h.likelihood;
            totalJoint += joint;
            jointData.push({ h, joint, w, activeW });
            // Inactive / Filtered out portion (dashed/gray)
            this.drawRect(g, curX, y2, w, 32, '#e2e8f0', '#94a3b8', 0.4);
            // Active surviving slice
            this.drawRect(g, curX, y2, activeW, 32, h.color, '#1e293b', 0.95);
            this.addText(g, `Joint: ${(joint).toFixed(3)}`, curX + activeW / 2, y2 + 20, 10, '#ffffff', 'middle', true);
            curX += w;
        });
        // Label total evidence mass P(E)
        this.addText(g, `Total Surviving Evidence Mass P(E) = ∑ P(E ∩ H_i) = ${(totalJoint).toFixed(3)}`, tx + tWidth, y2 - 8, 11, '#d97706', 'end', true);
        // Arrow 2 -> 3
        this.drawArrowDown(g, tx + tWidth / 2, y2 + 38, `Bayes Normalization: Re-expand surviving mass to Unit Width (÷ P(E))`);
        // Stage 3: Posterior Normalized Transect
        const y3 = 280;
        this.addText(g, 'Stage 3: Posterior Distribution P(H | E) = P(E ∩ H) / P(E)', tx, y3 - 8, 12, '#1e293b', 'start', true);
        curX = tx;
        jointData.forEach(({ h, joint }) => {
            const posterior = totalJoint > 0 ? joint / totalJoint : 0;
            const w = posterior * tWidth;
            this.drawRect(g, curX, y3, w, 32, h.color, '#1e293b', 0.95);
            this.addText(g, `${h.name} : Posterior = ${(posterior * 100).toFixed(1)}%`, curX + w / 2, y3 + 20, 11, '#ffffff', 'middle', true);
            curX += w;
        });
        // Summary Formula Box
        const fY = 345;
        this.drawRect(g, tx, fY, tWidth, 60, '#f8fafc', '#cbd5e1', 1, 6);
        this.addText(g, 'Exact Bayes Formula:  P(H_i | E) = [ P(E | H_i) · P(H_i) ] / P(E)', tx + tWidth / 2, fY + 25, 13, '#1e40af', 'middle', true);
        this.addText(g, 'Notice: Because P(E) > 0 on the hyperfinite transect, division by zero is impossible for any observable event.', tx + tWidth / 2, fY + 46, 11, '#64748b', 'middle');
    }
    // =========================================================================
    // 3. MOSAIC VIEW (2D Joint Probability Grid)
    // =========================================================================
    renderMosaicView() {
        const g = this.contentGroup;
        this.addHeader(g, '2D Joint Probability Mosaic Grid: Hypotheses × Evidence', 30);
        const tx = 100;
        const ty = 70;
        const size = 260;
        const hyps = this.scenario.hypotheses;
        // Draw Mosaic Matrix
        let curX = tx;
        let totalE = 0;
        let totalNotE = 0;
        hyps.forEach((h) => {
            const colW = h.prior * size;
            const rowH_E = h.likelihood * size;
            const rowH_NotE = (1 - h.likelihood) * size;
            totalE += h.prior * h.likelihood;
            totalNotE += h.prior * (1 - h.likelihood);
            // Top block: E given H
            this.drawRect(g, curX, ty, colW, rowH_E, h.color, '#ffffff', 0.9);
            if (colW > 40 && rowH_E > 25) {
                this.addText(g, `${(h.prior * h.likelihood).toFixed(2)}`, curX + colW / 2, ty + rowH_E / 2 + 4, 11, '#ffffff', 'middle', true);
            }
            // Bottom block: ¬E given H
            this.drawRect(g, curX, ty + rowH_E, colW, rowH_NotE, h.color, '#ffffff', 0.4);
            if (colW > 40 && rowH_NotE > 25) {
                this.addText(g, `${(h.prior * (1 - h.likelihood)).toFixed(2)}`, curX + colW / 2, ty + rowH_E + rowH_NotE / 2 + 4, 11, '#ffffff', 'middle', true);
            }
            // Column Header
            this.addText(g, h.name, curX + colW / 2, ty - 8, 11, '#1e293b', 'middle', true);
            curX += colW;
        });
        // Row Labels
        this.addText(g, 'Evidence E (+)', tx - 12, ty + (totalE / (totalE + totalNotE) * size) / 2, 11, '#059669', 'end', true);
        this.addText(g, 'Complement ¬E (-)', tx - 12, ty + size - 30, 11, '#64748b', 'end', true);
        // Right Side Analysis Card
        const cardX = tx + size + 50;
        const cardY = ty;
        const cardW = 380;
        const cardH = size;
        this.drawRect(g, cardX, cardY, cardW, cardH, '#f8fafc', '#94a3b8', 1, 8);
        this.addText(g, 'Mosaic Grid Analysis:', cardX + 16, cardY + 28, 14, '#1e293b', 'start', true);
        this.addText(g, `• Total Evidence Area P(E) = ${(totalE).toFixed(3)}`, cardX + 20, cardY + 60, 12, '#059669', 'start', true);
        this.addText(g, `• Total Complement Area P(¬E) = ${(totalNotE).toFixed(3)}`, cardX + 20, cardY + 84, 12, '#64748b');
        this.addText(g, 'Posterior Calculations P(H | E):', cardX + 20, cardY + 120, 13, '#1e3a8a', 'start', true);
        hyps.forEach((h, i) => {
            const joint = h.prior * h.likelihood;
            const post = totalE > 0 ? joint / totalE : 0;
            this.addText(g, `P(${h.id} | E) = ${joint.toFixed(3)} / ${totalE.toFixed(3)} = ${(post * 100).toFixed(1)}%`, cardX + 30, cardY + 148 + i * 24, 12, h.color, 'start', true);
        });
        this.addText(g, 'Conditioning on E corresponds to restricting attention to the top row!', cardX + 16, cardY + cardH - 20, 10.5, '#64748b');
    }
    // =========================================================================
    // 4. TREE-TO-TRANSECT PROJECTION VIEW
    // =========================================================================
    renderTreeProjectionView() {
        const g = this.contentGroup;
        this.addHeader(g, 'Tree-to-Transect Projection: Dyadic Leaves to Probability Line', 30);
        const centerX = 450;
        const treeY = 65;
        const transectY = 320;
        const tWidth = 740;
        const tLeft = centerX - tWidth / 2;
        // Draw Binary Tree up to depth d=3 (8 leaves)
        const levels = [
            [{ x: centerX, y: treeY, label: '0 (Root)' }],
            [
                { x: centerX - 180, y: treeY + 50, label: '[-]' },
                { x: centerX + 180, y: treeY + 50, label: '[+]' },
            ],
            [
                { x: centerX - 270, y: treeY + 105, label: '[--]' },
                { x: centerX - 90, y: treeY + 105, label: '[-+]' },
                { x: centerX + 90, y: treeY + 105, label: '[+-]' },
                { x: centerX + 270, y: treeY + 105, label: '[++]' },
            ],
            [
                { x: tLeft + (1 / 16) * tWidth * 2, y: treeY + 160, label: '---' },
                { x: tLeft + (3 / 16) * tWidth * 2, y: treeY + 160, label: '--+' },
                { x: tLeft + (5 / 16) * tWidth * 2, y: treeY + 160, label: '-+-' },
                { x: tLeft + (7 / 16) * tWidth * 2, y: treeY + 160, label: '-++' },
                { x: tLeft + (9 / 16) * tWidth * 2, y: treeY + 160, label: '+--' },
                { x: tLeft + (11 / 16) * tWidth * 2, y: treeY + 160, label: '+-+' },
                { x: tLeft + (13 / 16) * tWidth * 2, y: treeY + 160, label: '++-' },
                { x: tLeft + (15 / 16) * tWidth * 2, y: treeY + 160, label: '+++' },
            ],
        ];
        // Tree edges
        for (let d = 0; d < 3; d++) {
            const parentLvl = levels[d];
            const childLvl = levels[d + 1];
            parentLvl.forEach((p, idx) => {
                const leftChild = childLvl[idx * 2];
                const rightChild = childLvl[idx * 2 + 1];
                this.drawLine(g, p.x, p.y, leftChild.x, leftChild.y, '#3b82f6', 1.5);
                this.drawLine(g, p.x, p.y, rightChild.x, rightChild.y, '#ef4444', 1.5);
            });
        }
        // Tree nodes
        levels.forEach((lvl, d) => {
            lvl.forEach((node) => {
                const r = d === 3 ? 12 : 14;
                const circle = new SVGElt('circle');
                circle.setAA(['cx', node.x, 'cy', node.y, 'r', r, 'fill', '#ffffff', 'stroke', '#1e293b', 'stroke-width', 2]);
                g.append(circle);
                this.addText(g, node.label, node.x, node.y + 4, d === 3 ? 8 : 10, '#1e293b', 'middle', true);
            });
        });
        // Projection dashed lines down to transect
        const leaves = levels[3];
        const leafW = tWidth / 8;
        leaves.forEach((leaf, i) => {
            const targetX = tLeft + i * leafW + leafW / 2;
            const proj = new SVGElt('line');
            proj.setAA(['x1', leaf.x, 'y1', leaf.y + 12, 'x2', targetX, 'y2', transectY, 'stroke', '#94a3b8', 'stroke-width', 1.2, 'stroke-dasharray', '4,4']);
            g.append(proj);
            // Transect cell
            const cell = new SVGElt('rect');
            const fillC = i < 4 ? '#eff6ff' : '#fef2f2';
            const strokeC = i < 4 ? '#3b82f6' : '#ef4444';
            cell.setAA(['x', tLeft + i * leafW, 'y', transectY, 'width', leafW, 'height', 36, 'fill', fillC, 'stroke', strokeC, 'stroke-width', 1.5]);
            g.append(cell);
            this.addText(g, `Δ_${i + 1}`, targetX, transectY + 16, 10, '#1e293b', 'middle', true);
            this.addText(g, '1/8', targetX, transectY + 29, 9, '#64748b', 'middle');
        });
        this.addText(g, 'Continuous Unit Probability Transect [0, 1] (Divided into 2^d Dyadic Slices)', centerX, transectY + 58, 12, '#1e40af', 'middle', true);
    }
    // =========================================================================
    // 5. SEQUENTIAL EVIDENCE STREAM VIEW
    // =========================================================================
    renderSequentialView() {
        const g = this.contentGroup;
        this.addHeader(g, 'Sequential Evidence Pipeline: "Today\'s Posterior is Tomorrow\'s Prior"', 30);
        const tx = 60;
        const ty = 65;
        const tWidth = 780;
        // Controls Row
        const btnAddE = new SVGSelectableText(() => {
            this.seqController.addEvidence(true);
            this.render();
        }, `+ Observe Evidence [${this.scenario.evidenceName}]`, true);
        btnAddE.setAA(['x', tx, 'y', ty, 'font-size', 12, 'stroke', '#059669', 'cursor', 'pointer', 'font-weight', 'bold']);
        g.append(btnAddE);
        const btnAddNotE = new SVGSelectableText(() => {
            this.seqController.addEvidence(false);
            this.render();
        }, '+ Observe Complement [¬E]', true);
        btnAddNotE.setAA(['x', tx + 310, 'y', ty, 'font-size', 12, 'stroke', '#64748b', 'cursor', 'pointer', 'font-weight', 'bold']);
        g.append(btnAddNotE);
        const btnReset = new SVGSelectableText(() => {
            this.seqController.reset();
            this.render();
        }, '↺ Reset Stream', true);
        btnReset.setAA(['x', tx + 560, 'y', ty, 'font-size', 12, 'stroke', '#dc2626', 'cursor', 'pointer', 'font-weight', 'bold']);
        g.append(btnReset);
        // History Pipeline
        const history = this.seqController.history;
        const rowH = 45;
        const startY = ty + 30;
        history.forEach((rec, stepIdx) => {
            const curY = startY + stepIdx * (rowH + 15);
            if (curY > 380)
                return; // Limit visual overflow
            this.addText(g, rec.eventName, tx, curY - 5, 11, '#1e293b', 'start', true);
            let curX = tx;
            rec.hypotheses.forEach((h) => {
                const w = h.prior * tWidth;
                this.drawRect(g, curX, curY, w, rowH - 12, h.color, '#ffffff', 0.9, 4);
                if (w > 50) {
                    this.addText(g, `${h.name}: ${(h.prior * 100).toFixed(1)}%`, curX + w / 2, curY + 21, 11, '#ffffff', 'middle', true);
                }
                curX += w;
            });
        });
    }
    // =========================================================================
    // 6. ODDS & BAYES FACTOR BALANCE VIEW
    // =========================================================================
    renderOddsGaugeView() {
        const g = this.contentGroup;
        this.addHeader(g, 'Odds Form of Bayes: Posterior Odds = Prior Odds × Bayes Factor', 30);
        const centerX = 450;
        const priorOdds = this.priorOddsH1 / (1 - this.priorOddsH1);
        const bf = this.likelihoodRatio;
        const postOdds = priorOdds * bf;
        const postProb = postOdds / (1 + postOdds);
        // Visual Balance Lever
        const fulcrumX = centerX;
        const fulcrumY = 220;
        const leverLen = 420;
        // Angle of tilt based on log posterior odds
        const logOdds = Math.log10(postOdds);
        const angle = Math.max(-25, Math.min(25, -logOdds * 12));
        const leverGrp = new SVGGrpElt();
        leverGrp.elt.setAttribute('transform', `rotate(${angle} ${fulcrumX} ${fulcrumY})`);
        g.append(leverGrp);
        // Lever arm
        const arm = new SVGElt('rect');
        arm.setAA(['x', fulcrumX - leverLen / 2, 'y', fulcrumY - 6, 'width', leverLen, 'height', 12, 'fill', '#334155', 'rx', 4]);
        leverGrp.append(arm);
        // Hypothesis Pans
        this.drawPan(leverGrp, fulcrumX - leverLen / 2 + 20, fulcrumY + 6, 'H1: Loaded Coin', (postProb * 100).toFixed(1) + '%', '#8b5cf6');
        this.drawPan(leverGrp, fulcrumX + leverLen / 2 - 20, fulcrumY + 6, 'H0: Fair Coin', ((1 - postProb) * 100).toFixed(1) + '%', '#10b981');
        // Fulcrum Base
        const fulcrum = new SVGElt('polygon');
        fulcrum.setAA(['points', `${fulcrumX},${fulcrumY} ${fulcrumX - 25},${fulcrumY + 50} ${fulcrumX + 25},${fulcrumY + 50}`, 'fill', '#64748b']);
        g.append(fulcrum);
        // Interactive Multiplier Controls
        const cY = 70;
        this.addText(g, 'Interactive Bayes Factor Multiplier:', 80, cY, 13, '#1e293b', 'start', true);
        const factors = [0.25, 0.5, 1.0, 2.0, 4.0, 8.0];
        factors.forEach((f, idx) => {
            const btn = new SVGSelectableText(() => {
                this.likelihoodRatio = f;
                this.render();
            }, `BF = ${f}x`, f === this.likelihoodRatio);
            btn.setAA(['x', 80 + idx * 80, 'y', cY + 25, 'font-size', 11, 'cursor', 'pointer']);
            g.append(btn);
        });
        // Equation Card
        const eqY = 320;
        this.drawRect(g, 80, eqY, 740, 80, '#f8fafc', '#cbd5e1', 1, 6);
        this.addText(g, `Prior Odds: ${(priorOdds).toFixed(3)}  |  Bayes Factor: ${bf.toFixed(2)}x  |  Posterior Odds: ${(postOdds).toFixed(3)}`, 450, eqY + 30, 13, '#1e40af', 'middle', true);
        this.addText(g, `Posterior Probability P(H1 | E) = ${(postProb * 100).toFixed(1)}%`, 450, eqY + 55, 13, '#059669', 'middle', true);
    }
    // =========================================================================
    // 7. CONTINUOUS BETA-BINOMIAL VIEW
    // =========================================================================
    renderContinuousView() {
        const g = this.contentGroup;
        this.addHeader(g, 'Continuous Parameter Density on Transect: Beta-Binomial Learning', 30);
        const { a, b } = this.betaController.getEffectiveAlphaBeta();
        const tx = 80;
        const ty = 80;
        const width = 740;
        const height = 200;
        // Controls
        const btnH = new SVGSelectableText(() => {
            this.betaController.addObservation(true);
            this.render();
        }, '+ Observe Heads (H)', true);
        btnH.setAA(['x', tx, 'y', ty - 10, 'font-size', 12, 'stroke', '#059669', 'cursor', 'pointer', 'font-weight', 'bold']);
        g.append(btnH);
        const btnT = new SVGSelectableText(() => {
            this.betaController.addObservation(false);
            this.render();
        }, '+ Observe Tails (T)', true);
        btnT.setAA(['x', tx + 180, 'y', ty - 10, 'font-size', 12, 'stroke', '#dc2626', 'cursor', 'pointer', 'font-weight', 'bold']);
        g.append(btnT);
        const btnR = new SVGSelectableText(() => {
            this.betaController.reset(2, 2);
            this.render();
        }, '↺ Reset Beta(2,2)', true);
        btnR.setAA(['x', tx + 360, 'y', ty - 10, 'font-size', 12, 'stroke', '#64748b', 'cursor', 'pointer', 'font-weight', 'bold']);
        g.append(btnR);
        // Plot Grid Box
        this.drawRect(g, tx, ty, width, height, '#ffffff', '#cbd5e1', 1, 6);
        // Compute continuous PDF on transect
        const points = this.betaController.getTransectPoints(120);
        const maxDensity = Math.max(...points.map((p) => p.density), 3.0);
        // Draw area under curve
        let pathD = `M ${tx} ${ty + height}`;
        points.forEach((p) => {
            const px = tx + p.x * width;
            const py = ty + height - (p.density / maxDensity) * (height - 20);
            pathD += ` L ${px} ${py}`;
        });
        pathD += ` L ${tx + width} ${ty + height} Z`;
        const area = new SVGElt('path');
        area.setAA(['d', pathD, 'fill', '#bfdbfe', 'opacity', 0.65]);
        g.append(area);
        const curve = new SVGElt('path');
        curve.setAA(['d', pathD.replace(` L ${tx + width} ${ty + height} Z`, ''), 'fill', 'none', 'stroke', '#2563eb', 'stroke-width', 2.5]);
        g.append(curve);
        // Axes
        this.addText(g, 'θ = 0.0 (Pure Tails)', tx, ty + height + 20, 11, '#64748b', 'start');
        this.addText(g, 'Parameter θ (Bias on Transect)', tx + width / 2, ty + height + 20, 12, '#1e293b', 'middle', true);
        this.addText(g, 'θ = 1.0 (Pure Heads)', tx + width, ty + height + 20, 11, '#64748b', 'end');
        // Status / Distribution Info
        const mean = a / (a + b);
        const infoY = ty + height + 45;
        this.drawRect(g, tx, infoY, width, 55, '#f8fafc', '#cbd5e1', 1, 6);
        this.addText(g, `Current Posterior Distribution: Beta(α = ${a}, β = ${b})`, tx + 20, infoY + 24, 13, '#1e3a8a', 'start', true);
        this.addText(g, `Observed: ${this.betaController.heads} Heads, ${this.betaController.tails} Tails  |  Expected Bias E[θ] = ${(mean * 100).toFixed(1)}%`, tx + 20, infoY + 44, 12, '#059669', 'start');
    }
    // =========================================================================
    // 8. BASE RATE FALLACY (Medical Screening) VIEW
    // =========================================================================
    renderBaseRateView() {
        const g = this.contentGroup;
        this.addHeader(g, 'Base Rate Fallacy: Why Positive Tests in Rare Conditions Are Mostly False Alarms', 30);
        const prev = this.baseRatePrevalence;
        const sens = this.baseRateSensitivity;
        const fpr = this.baseRateFPR;
        const truePos = prev * sens;
        const falsePos = (1 - prev) * fpr;
        const totalPos = truePos + falsePos;
        const posterior = truePos / totalPos;
        const tx = 80;
        const ty = 75;
        const tWidth = 740;
        // Controls
        this.addText(g, 'Select Condition Prevalence (Base Rate):', tx, ty, 12, '#1e293b', 'start', true);
        const rates = [
            { lbl: '0.1% (Ultra Rare)', v: 0.001 },
            { lbl: '1.0% (Rare Condition)', v: 0.01 },
            { lbl: '5.0% (Moderate)', v: 0.05 },
            { lbl: '20% (High Prevalence)', v: 0.20 },
        ];
        rates.forEach((r, idx) => {
            const btn = new SVGSelectableText(() => {
                this.baseRatePrevalence = r.v;
                this.render();
            }, r.lbl, r.v === this.baseRatePrevalence);
            btn.setAA(['x', tx + idx * 170, 'y', ty + 24, 'font-size', 11, 'cursor', 'pointer']);
            g.append(btn);
        });
        // 1. Population Transect
        const y1 = ty + 65;
        this.addText(g, 'Population Base Rate Transect:', tx, y1 - 8, 12, '#1e293b', 'start', true);
        const sickW = prev * tWidth;
        const healthyW = (1 - prev) * tWidth;
        this.drawRect(g, tx, y1, sickW, 30, '#ef4444', '#b91c1c', 0.9);
        this.drawRect(g, tx + sickW, y1, healthyW, 30, '#3b82f6', '#1d4ed8', 0.8);
        this.addText(g, `Disease Present (${(prev * 100).toFixed(1)}%)`, tx + Math.max(15, sickW / 2), y1 + 19, 10, '#ffffff', 'middle', true);
        this.addText(g, `Healthy Population (${((1 - prev) * 100).toFixed(1)}%)`, tx + sickW + healthyW / 2, y1 + 19, 11, '#ffffff', 'middle', true);
        // 2. Positive Test Slices
        const y2 = y1 + 65;
        this.addText(g, 'Positive Test Breakdown (+): True Positives vs. False Positives', tx, y2 - 8, 12, '#1e293b', 'start', true);
        const tpW = truePos * tWidth;
        const fpW = falsePos * tWidth;
        this.drawRect(g, tx, y2, tpW, 30, '#ef4444', '#b91c1c', 0.95);
        this.drawRect(g, tx + tpW, y2, fpW, 30, '#f59e0b', '#b45309', 0.95);
        this.addText(g, `True Pos: ${(truePos * 100).toFixed(2)}%`, tx + tpW / 2, y2 + 19, 10, '#ffffff', 'middle', true);
        this.addText(g, `False Pos: ${(falsePos * 100).toFixed(2)}%`, tx + tpW + fpW / 2, y2 + 19, 10, '#ffffff', 'middle', true);
        // 3. Normalized Posterior Bar
        const y3 = y2 + 65;
        this.addText(g, 'Actual Probability You Have the Disease Given a Positive Test: P(Disease | +)', tx, y3 - 8, 12, '#1e293b', 'start', true);
        const postW = posterior * tWidth;
        this.drawRect(g, tx, y3, postW, 32, '#ef4444', '#b91c1c', 0.95);
        this.drawRect(g, tx + postW, y3, tWidth - postW, 32, '#f59e0b', '#b45309', 0.85);
        this.addText(g, `P(Disease | +) = ${(posterior * 100).toFixed(1)}%`, tx + postW / 2, y3 + 20, 11, '#ffffff', 'middle', true);
        this.addText(g, `P(False Alarm | +) = ${((1 - posterior) * 100).toFixed(1)}%`, tx + postW + (tWidth - postW) / 2, y3 + 20, 11, '#ffffff', 'middle', true);
        // Takeaway Box
        const boxY = y3 + 48;
        this.drawRect(g, tx, boxY, tWidth, 48, '#fef2f2', '#fecaca', 1, 6);
        this.addText(g, `Key Insight: Even with 95% test accuracy, if the base rate is ${(prev * 100).toFixed(1)}%, a positive test result only gives a ${(posterior * 100).toFixed(1)}% chance of disease!`, tx + 20, boxY + 28, 12, '#991b1b', 'start', true);
    }
    // =========================================================================
    // HELPER DRAWING METHODS
    // =========================================================================
    addHeader(g, title, y) {
        const t = new SVGText();
        t.setAA(['x', 40, 'y', y, 'font-size', 16, 'font-weight', 'bold', 'fill', this.palette.textDark]);
        t.setV(title);
        g.append(t);
    }
    addText(g, text, x, y, size = 12, color = '#1e293b', anchor = 'start', bold = false) {
        const t = new SVGText();
        t.setAA(['x', x, 'y', y, 'font-size', size, 'fill', color, 'text-anchor', anchor]);
        if (bold)
            t.setA('font-weight', 'bold');
        t.setV(text);
        g.append(t);
    }
    drawRect(g, x, y, w, h, fill, stroke = '#cbd5e1', opacity = 1, rx = 0) {
        if (w <= 0 || h <= 0)
            return;
        const r = new SVGElt('rect');
        r.setAA(['x', x, 'y', y, 'width', w, 'height', h, 'fill', fill, 'stroke', stroke, 'stroke-width', 1, 'opacity', opacity]);
        if (rx > 0)
            r.setA('rx', rx);
        g.append(r);
    }
    drawLine(g, x1, y1, x2, y2, stroke = '#94a3b8', width = 1.5) {
        const l = new SVGElt('line');
        l.setAA(['x1', x1, 'y1', y1, 'x2', x2, 'y2', y2, 'stroke', stroke, 'stroke-width', width]);
        g.append(l);
    }
    drawArrowDown(g, x, y, label) {
        this.drawLine(g, x, y, x, y + 25, '#d97706', 2);
        const arrowHead = new SVGElt('polygon');
        arrowHead.setAA(['points', `${x - 5},${y + 25} ${x + 5},${y + 25} ${x},${y + 32}`, 'fill', '#d97706']);
        g.append(arrowHead);
        this.addText(g, label, x + 15, y + 18, 10.5, '#d97706', 'start', true);
    }
    drawPan(g, x, y, label, prob, color) {
        const line = new SVGElt('line');
        line.setAA(['x1', x, 'y1', y, 'x2', x, 'y2', y + 40, 'stroke', '#64748b', 'stroke-width', 2]);
        g.append(line);
        const pan = new SVGElt('rect');
        pan.setAA(['x', x - 65, 'y', y + 40, 'width', 130, 'height', 45, 'fill', color, 'rx', 6]);
        g.append(pan);
        this.addText(g, label, x, y + 58, 11, '#ffffff', 'middle', true);
        this.addText(g, prob, x, y + 74, 12, '#ffffff', 'middle', true);
    }
}
