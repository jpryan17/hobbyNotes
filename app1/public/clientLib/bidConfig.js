export const DEFAULT_BID_PALETTE = {
    bg: '#f8fafc',
    frame: '#94a3b8',
    textDark: '#1e293b',
    textMuted: '#64748b',
    transectBar: '#e2e8f0',
    transectGrid: '#cbd5e1',
    hColors: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
    evidenceShade: 'rgba(15, 23, 42, 0.65)',
    posteriorGlow: '#d97706',
    treeBranch: '#64748b',
    highlight: '#2563eb',
    accent: '#0284c7',
};
export const BID_SCENARIOS = {
    medical: {
        id: 'medical',
        name: 'Medical Screening (Rare Condition)',
        description: 'Prior base rate is low (1%). Test is 95% sensitive, 5% false positive rate.',
        evidenceName: 'Positive Test Result (+)',
        hypotheses: [
            { id: 'H1', name: 'Disease Present (D)', prior: 0.01, likelihood: 0.95, color: '#ef4444' },
            { id: 'H0', name: 'Healthy (¬D)', prior: 0.99, likelihood: 0.05, color: '#3b82f6' },
        ],
    },
    sensor: {
        id: 'sensor',
        name: 'Noisy Sensor / Coin Bias',
        description: 'Fair coin (50%) vs Loaded coin (80% heads). Observed evidence: Heads.',
        evidenceName: 'Observed Heads (H)',
        hypotheses: [
            { id: 'H1', name: 'Loaded Coin (80% Heads)', prior: 0.30, likelihood: 0.80, color: '#8b5cf6' },
            { id: 'H0', name: 'Fair Coin (50% Heads)', prior: 0.70, likelihood: 0.50, color: '#10b981' },
        ],
    },
    urn: {
        id: 'urn',
        name: '3-Hypothesis Urn Classification',
        description: 'Three urns with different red/blue ratios. Observed evidence: Drawn Red ball.',
        evidenceName: 'Drawn Red Ball (R)',
        hypotheses: [
            { id: 'H1', name: 'Urn 1 (80% Red)', prior: 0.50, likelihood: 0.80, color: '#3b82f6' },
            { id: 'H2', name: 'Urn 2 (50% Red)', prior: 0.30, likelihood: 0.50, color: '#10b981' },
            { id: 'H3', name: 'Urn 3 (10% Red)', prior: 0.20, likelihood: 0.10, color: '#f59e0b' },
        ],
    },
};
export const BIDPresets = {
    transect: {
        mode: 'transect',
        width: 900,
        height: 440,
        fontSize: 13,
    },
    filter: {
        mode: 'filter',
        width: 900,
        height: 440,
        fontSize: 13,
    },
    mosaic: {
        mode: 'mosaic',
        width: 900,
        height: 440,
        fontSize: 13,
    },
    treeProjection: {
        mode: 'treeProjection',
        width: 900,
        height: 440,
        fontSize: 13,
    },
    stateTree: {
        mode: 'stateTree',
        width: 900,
        height: 460,
        fontSize: 13,
    },
    sequential: {
        mode: 'sequential',
        width: 900,
        height: 440,
        fontSize: 13,
    },
    oddsGauge: {
        mode: 'oddsGauge',
        width: 900,
        height: 440,
        fontSize: 13,
    },
    continuous: {
        mode: 'continuous',
        width: 900,
        height: 440,
        fontSize: 13,
    },
    baseRate: {
        mode: 'baseRate',
        width: 900,
        height: 440,
        fontSize: 13,
    },
};
