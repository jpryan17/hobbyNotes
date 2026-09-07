import { BID_SCENARIOS, } from './bidConfig.js';
export class SequentialEvidenceController {
    scenario;
    history = [];
    currentStep = 0;
    constructor(scenarioKey = 'sensor') {
        this.scenario = JSON.parse(JSON.stringify(BID_SCENARIOS[scenarioKey] || BID_SCENARIOS.sensor));
        this.recordInitial();
    }
    recordInitial() {
        this.history = [
            {
                step: 0,
                eventName: 'Initial Prior',
                hypotheses: JSON.parse(JSON.stringify(this.scenario.hypotheses)),
            },
        ];
        this.currentStep = 0;
    }
    reset() {
        this.recordInitial();
    }
    addEvidence(isPositive) {
        const prev = this.history[this.currentStep].hypotheses;
        const nextHypotheses = [];
        // Calculate unnormalized joints
        let totalJoint = 0;
        const joints = prev.map((h) => {
            const pE_given_H = isPositive ? h.likelihood : 1 - h.likelihood;
            const joint = h.prior * pE_given_H;
            totalJoint += joint;
            return joint;
        });
        if (totalJoint <= 0)
            totalJoint = 1e-9;
        // Normalize to new posterior
        prev.forEach((h, i) => {
            const posterior = joints[i] / totalJoint;
            nextHypotheses.push({
                ...h,
                prior: posterior,
            });
        });
        const eventName = isPositive
            ? `Step ${this.currentStep + 1}: ${this.scenario.evidenceName}`
            : `Step ${this.currentStep + 1}: Complement (¬E)`;
        this.currentStep++;
        this.history.push({
            step: this.currentStep,
            eventName,
            hypotheses: nextHypotheses,
        });
    }
    getCurrentState() {
        return this.history[this.currentStep];
    }
}
export class BetaBinomialController {
    alpha = 1;
    beta = 1;
    heads = 0;
    tails = 0;
    constructor(a = 1, b = 1) {
        this.alpha = a;
        this.beta = b;
    }
    reset(a = 1, b = 1) {
        this.alpha = a;
        this.beta = b;
        this.heads = 0;
        this.tails = 0;
    }
    addObservation(isHead) {
        if (isHead) {
            this.heads++;
        }
        else {
            this.tails++;
        }
    }
    getEffectiveAlphaBeta() {
        return {
            a: this.alpha + this.heads,
            b: this.beta + this.tails,
        };
    }
    // Sample the Beta PDF at N discrete transect points in [0, 1]
    getTransectPoints(numPoints = 64) {
        const { a, b } = this.getEffectiveAlphaBeta();
        const points = [];
        const dx = 1 / numPoints;
        // Log-gamma based approximation for normalization constant B(a, b)
        const logBeta = this.logGamma(a) + this.logGamma(b) - this.logGamma(a + b);
        let sumDensity = 0;
        for (let k = 0; k < numPoints; k++) {
            const x = (k + 0.5) * dx;
            let logPdf = (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - logBeta;
            // Clamp for numerical safety
            if (logPdf < -50)
                logPdf = -50;
            const density = Math.exp(logPdf);
            points.push({ x, density, weight: 0 });
            sumDensity += density;
        }
        // Normalize weights to sum to 1
        const norm = sumDensity * dx;
        points.forEach((p) => {
            p.weight = norm > 0 ? (p.density * dx) / norm : 1 / numPoints;
        });
        return points;
    }
    logGamma(z) {
        // Lanczos approximation
        const g = 7;
        const C = [
            0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.138571095836524, 9.9843695780195716e-6, 1.5056327351493116e-7,
        ];
        if (z < 0.5) {
            return Math.log(Math.PI / Math.sin(Math.PI * z)) - this.logGamma(1 - z);
        }
        z -= 1;
        let base = C[0];
        for (let i = 1; i < g + 2; i++) {
            base += C[i] / (z + i);
        }
        const t = z + g + 0.5;
        return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(base);
    }
}
