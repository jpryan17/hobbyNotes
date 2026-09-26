import { ttd } from "../../clientLib/ttd.js";
import { fsd } from "../../clientLib/fsd.js";
import { initBTD, layoutBTD } from "../../clientLib/btd.js";
import { initBID, layoutBID } from "../../clientLib/bid.js";
import { eqDemo, initEqDemo, layoutEqDemo } from "../../clientLib/eqDemo.js";
import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";
export const propLogicIndex = [
    {
        type: "html",
        topic: "introduction",
        htmlSegmentId: "propLogicIntro",
    },
    {
        type: "html",
        topic: "lecture: truth tables & paradoxes",
        htmlSegmentId: "propLogicLecture",
    },
    {
        type: "diagram",
        topic: "truth table demo (TTD)",
        initCB: initTTD,
        layoutCB: layout,
    },
];
export const formalStatementsIndex = [
    {
        type: "html",
        topic: "introduction",
        htmlSegmentId: "formalStatementsIntro",
    },
    {
        type: "html",
        topic: "lecture 1: sets, tuples & constructors",
        htmlSegmentId: "formalStatementsLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: algebra of sets",
        htmlSegmentId: "formalStatementsLecture2",
    },
    {
        type: "diagram",
        topic: "formal statement demo (FSD)",
        initCB: initFSD,
        layoutCB: layoutFSD,
    },
    {
        type: "diagram",
        topic: "equation evaluator demo (EED)",
        initCB: initEED,
        layoutCB: layoutEED,
    },
];
export const numbersIndex = [
    {
        type: "html",
        topic: "introduction",
        htmlSegmentId: "numbersIntro",
    },
    {
        type: "html",
        topic: "lecture 1: definitions & counting",
        htmlSegmentId: "numbersLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: 2-successor trees & growth",
        htmlSegmentId: "numbersLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: STEM & spaces",
        htmlSegmentId: "numbersLecture3",
    },
    {
        type: "diagram",
        topic: "2-successor tree demo (BTD)",
        initCB: initBTD,
        layoutCB: layoutBTD,
    },
];
export const bayesianInferenceIndex = [
    {
        type: "html",
        topic: "introduction",
        htmlSegmentId: "bayesianInferenceIntro",
    },
    {
        type: "html",
        topic: "lecture 1: hyperfinite probability",
        htmlSegmentId: "bayesianInferenceLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: sequential updating",
        htmlSegmentId: "bayesianInferenceLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: standard vs nonstandard prob",
        htmlSegmentId: "bayesianInferenceLecture3",
    },
    {
        type: "html",
        topic: "lecture 4: state spaces & entropy",
        htmlSegmentId: "bayesianInferenceLecture4",
    },
    {
        type: "diagram",
        topic: "Bayesian inference demo (BID)",
        initCB: initBID,
        layoutCB: layoutBID,
    },
];
export const quantumLogicIndex = [
    {
        type: "html",
        topic: "introduction",
        htmlSegmentId: "quantumLogicIntro",
    },
    {
        type: "html",
        topic: "lecture 1: 3 polarizers & Venn failure",
        htmlSegmentId: "quantumLogicLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: complex amplitudes on ℂ_ω",
        htmlSegmentId: "quantumLogicLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: measurement & projection",
        htmlSegmentId: "quantumLogicLecture3",
    },
];
export const quantumBayesianInferenceIndex = [
    {
        type: "html",
        topic: "introduction",
        htmlSegmentId: "quantumBayesianInferenceIntro",
    },
    {
        type: "html",
        topic: "lecture 1: density ops & quantum Bayes",
        htmlSegmentId: "quantumBayesianInferenceLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: reality as an ensemble",
        htmlSegmentId: "quantumBayesianInferenceLecture2",
    },
];
export const course1Index = [
    {
        type: "html",
        topic: "overview: linear algebra",
        htmlSegmentId: "vectorFoundationsIntro",
    },
    {
        type: "html",
        topic: "lecture 1: emergent groups & fields",
        htmlSegmentId: "vectorsLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: structure-preserving maps",
        htmlSegmentId: "vectorsLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: vector spaces & duality",
        htmlSegmentId: "vectorsLecture3",
    },
];
export const course2Index = [
    {
        type: "html",
        topic: "overview: analysis 1D",
        htmlSegmentId: "analysis1DIntro",
    },
    {
        type: "html",
        topic: "lecture 1: microscope & continuity",
        htmlSegmentId: "analysis1DLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: derivatives & linearity",
        htmlSegmentId: "analysis1DLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: accumulation & calculus",
        htmlSegmentId: "analysis1DLecture3",
    },
    {
        type: "html",
        topic: "lecture 4: trig derivatives & circular motion",
        htmlSegmentId: "stemTrigDerivatives",
    },
    {
        type: "html",
        topic: "lecture 5: exponential & logarithmic foundations",
        htmlSegmentId: "stemExpLogFoundations",
    },
];
export const course3Index = [
    {
        type: "html",
        topic: "overview: analysis 2D",
        htmlSegmentId: "analysis2DIntro",
    },
    {
        type: "html",
        topic: "lecture 1: 2D grid & conformal maps",
        htmlSegmentId: "analysis2DLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: contour integrals & residues",
        htmlSegmentId: "analysis2DLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: state evolution & phase",
        htmlSegmentId: "analysis2DLecture3",
    },
];
export const satelliteIndex = [
    {
        type: "html",
        topic: "overview: satellite seminars",
        htmlSegmentId: "satelliteSeminarsIntro",
    },
    {
        type: "html",
        topic: "seminar 1: cosmology as information",
        htmlSegmentId: "cosmologyAsInformation",
    },
    {
        type: "html",
        topic: "seminar 2: particle zoo logic",
        htmlSegmentId: "particleZooSeminar",
    },
    {
        type: "html",
        topic: "seminar 3: entanglement & reality",
        htmlSegmentId: "quantumEntanglementSeminar",
    },
    {
        type: "html",
        topic: "seminar 4: algebraic geometry",
        htmlSegmentId: "algebraicGeometrySeminar",
    },
];
export const miniSeminarsIndex = [
    {
        type: "html",
        topic: "mini-seminar 1: Fourier duality",
        htmlSegmentId: "fourierTransformSeminar",
    },
    {
        type: "html",
        topic: "mini-seminar 2: ω-nodes to halo soup",
        htmlSegmentId: "haloSoupSeminar",
    },
    {
        type: "html",
        topic: "mini-seminar 3: holography & boundaries",
        htmlSegmentId: "holographicPrincipleSeminar",
    },
    {
        type: "html",
        topic: "mini-seminar 4: higher-successors",
        htmlSegmentId: "higherSuccessorsSeminar",
    },
];
export const conceptualHistoryIndex = [
    {
        type: "html",
        topic: "instructor guide: roadmap",
        htmlSegmentId: "conceptualHistoryInstructorGuide",
    },
    {
        type: "html",
        topic: "student narrative: physical reality",
        htmlSegmentId: "conceptualHistoryIntro",
    },
];
export const proposalsIndex = [
    {
        type: "html",
        topic: "proposal 1: open educational service hubs",
        htmlSegmentId: "lean4GenEdProposal",
    },
    {
        type: "html",
        topic: "academic paper: dual-agent tutor",
        htmlSegmentId: "dualAgentAcademicProposal",
    },
    {
        type: "html",
        topic: "whitepaper: minimal axiomatic core",
        htmlSegmentId: "minimalAxiomaticCoreProposal",
    },
];
export const trigGeometryIndex = [
    {
        type: "html",
        topic: "trigonometric foundations & rotor geometry",
        htmlSegmentId: "stemTrigFoundations",
    },
];
// =====================================================================
// Introduction & Conceptual Overview
// =====================================================================
export const curriculumIntroIndex = [
    {
        type: "html",
        topic: "general science mission",
        htmlSegmentId: "introduction",
    },
    {
        type: "html",
        topic: "curriculum overview",
        htmlSegmentId: "middlewayIntro",
    },
    {
        type: "html",
        topic: "instructor roadmap",
        htmlSegmentId: "conceptualHistoryInstructorGuide",
    },
    {
        type: "html",
        topic: "conceptual history & reality",
        htmlSegmentId: "conceptualHistoryIntro",
    },
];
// =====================================================================
// Level 1: Logic & Number
// =====================================================================
export const level1Index = [
    {
        type: "html",
        topic: "overview: logic & foundations",
        htmlSegmentId: "introduction",
    },
    {
        type: "index",
        topic: "propositional logic",
        navTopic: "prop logic",
        indexDesc: propLogicIndex,
    },
    {
        type: "index",
        topic: "formal statements",
        navTopic: "formal statements",
        indexDesc: formalStatementsIndex,
    },
    {
        type: "html",
        topic: "fsd test",
        htmlSegmentId: "fsdTest",
    },
    {
        type: "index",
        topic: "numbers & trees",
        navTopic: "numbers",
        indexDesc: numbersIndex,
    },
];
// =====================================================================
// Level 2: Continuum & Calculus
// =====================================================================
export const analysis1DIndex = [
    {
        type: "html",
        topic: "overview: analysis 1D",
        htmlSegmentId: "analysis1DIntro",
    },
    {
        type: "html",
        topic: "lecture 1: microscope & continuity",
        htmlSegmentId: "analysis1DLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: derivatives & linearity",
        htmlSegmentId: "analysis1DLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: accumulation & calculus",
        htmlSegmentId: "analysis1DLecture3",
    },
];
export const analysis2DIndex = [
    {
        type: "html",
        topic: "overview: analysis 2D",
        htmlSegmentId: "analysis2DIntro",
    },
    {
        type: "html",
        topic: "lecture 1: 2D grid & conformal maps",
        htmlSegmentId: "analysis2DLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: contour integrals & residues",
        htmlSegmentId: "analysis2DLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: state evolution & phase",
        htmlSegmentId: "analysis2DLecture3",
    },
];
export const level2Index = [
    {
        type: "html",
        topic: "overview: continuous analysis",
        htmlSegmentId: "lamOverview",
    },
    {
        type: "html",
        topic: "sequences, sums & progressions",
        htmlSegmentId: "sequencesAndSums",
    },
    {
        type: "index",
        topic: "course 1: analysis 1D",
        navTopic: "analysis 1D",
        indexDesc: analysis1DIndex,
    },
    {
        type: "index",
        topic: "course 2: analysis 2D",
        navTopic: "analysis 2D",
        indexDesc: analysis2DIndex,
    },
];
// =====================================================================
// Level 3: Space, Direction & Geometry
// =====================================================================
export const vectorsIndex = [
    {
        type: "html",
        topic: "overview: linear algebra",
        htmlSegmentId: "vectorFoundationsIntro",
    },
    {
        type: "html",
        topic: "lecture 1: emergent groups & fields",
        htmlSegmentId: "vectorsLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: structure-preserving maps",
        htmlSegmentId: "vectorsLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: vector spaces & duality",
        htmlSegmentId: "vectorsLecture3",
    },
];
export const level3Index = [
    {
        type: "html",
        topic: "overview: linear algebra & geometry",
        htmlSegmentId: "vectorFoundationsIntro",
    },
    {
        type: "index",
        topic: "course 1: linear algebra",
        navTopic: "linear algebra",
        indexDesc: vectorsIndex,
    },
    {
        type: "html",
        topic: "course 2: trigonometry & rotor geometry",
        htmlSegmentId: "stemTrigFoundations",
    },
];
// =====================================================================
// Level 4: The Transcendental Engine: Growth, Rotation & Logarithm
// =====================================================================
export const level4Index = [
    {
        type: "html",
        topic: "exponential & logarithmic foundations",
        htmlSegmentId: "stemExpLogFoundations",
    },
    {
        type: "html",
        topic: "circular dynamics & trigonometric derivatives",
        htmlSegmentId: "stemTrigDerivatives",
    },
    {
        type: "diagram",
        topic: "Euler compounding demo (BID)",
        initCB: initBID,
        layoutCB: layoutBID,
    },
];
// =====================================================================
// Level 5: Probability, Information & Quantum Logic
// =====================================================================
export const level5Index = [
    {
        type: "html",
        topic: "overview: Bayesian inference & quantum logic",
        htmlSegmentId: "bayesianInferenceIntro",
    },
    {
        type: "index",
        topic: "Bayesian inference",
        navTopic: "Bayesian",
        indexDesc: bayesianInferenceIndex,
    },
    {
        type: "index",
        topic: "quantum logic",
        navTopic: "quantum logic",
        indexDesc: quantumLogicIndex,
    },
    {
        type: "index",
        topic: "quantum Bayesian inference",
        navTopic: "quantum Bayesian",
        indexDesc: quantumBayesianInferenceIndex,
    },
];
// =====================================================================
// Level 6: Applied Seminars & Horizons
// =====================================================================
export const appliedPhysicsSeminarsIndex = [
    {
        type: "html",
        topic: "Newtonian kinematics & conservation",
        htmlSegmentId: "stemNewtonianBridge",
    },
    {
        type: "html",
        topic: "1D heat diffusion: Laplacian & Fourier",
        htmlSegmentId: "stemHeatDiffusion",
    },
];
export const level6Index = [
    {
        type: "html",
        topic: "overview: seminars & applications",
        htmlSegmentId: "satelliteSeminarsIntro",
    },
    {
        type: "index",
        topic: "applied physics seminars",
        navTopic: "applied physics",
        indexDesc: appliedPhysicsSeminarsIndex,
    },
    {
        type: "index",
        topic: "mini-seminars",
        navTopic: "mini-seminars",
        indexDesc: miniSeminarsIndex,
    },
    {
        type: "index",
        topic: "satellite seminars",
        navTopic: "satellites",
        indexDesc: satelliteIndex,
    },
];
// =====================================================================
// Backwards-Compatible Aliases
// =====================================================================
export const foundationIndex = level1Index;
export const phase2AGeometryIndex = level3Index;
export const phase2BAnalysisIndex = level2Index;
export const analysisAndSeminarsIndex = level2Index;
export const lamIndex = level2Index;
export const stemBridgeIndex = appliedPhysicsSeminarsIndex;
export const seminarsIndex = level6Index;
// =====================================================================
// Main Curriculum Index
// =====================================================================
export const mainIndex = [
    {
        type: "diagram",
        topic: "title",
        initCB: initOutlineBanner,
        layoutCB: layoutOutlineBanner,
    },
    {
        type: "index",
        topic: "Introduction & Overview",
        navTopic: "Introduction",
        indexDesc: curriculumIntroIndex,
    },
    {
        type: "index",
        topic: "Level 1: Logic & Number",
        navTopic: "Logic & Number",
        indexDesc: level1Index,
    },
    {
        type: "index",
        topic: "Level 2: Continuum & Calculus",
        navTopic: "Continuum & Calculus",
        indexDesc: level2Index,
    },
    {
        type: "index",
        topic: "Level 3: Space & Geometry",
        navTopic: "Space & Geometry",
        indexDesc: level3Index,
    },
    {
        type: "index",
        topic: "Level 4: Growth & The Logarithm",
        navTopic: "Growth & Logarithm",
        indexDesc: level4Index,
    },
    {
        type: "index",
        topic: "Level 5: Quantum & Information",
        navTopic: "Quantum & Information",
        indexDesc: level5Index,
    },
    {
        type: "index",
        topic: "Level 6: Applied Seminars",
        navTopic: "Applied Seminars",
        indexDesc: level6Index,
    },
    {
        type: "index",
        topic: "Research & Proposals",
        navTopic: "Proposals",
        indexDesc: proposalsIndex,
    },
];
function initTTD() {
    if (ttd && ttd.pxe) {
        ttd.pxe.clear();
    }
    return ttd;
}
function layout() {
    ttd.layoutEditor();
}
function initFSD() {
    fsd.clear();
    return fsd;
}
function layoutFSD() {
    fsd.layoutEditor();
}
export function initEED() {
    if (eqDemo) {
        eqDemo.resetToBuilder();
    }
    return initEqDemo();
}
export function layoutEED() {
    layoutEqDemo();
}
export function hydrateDiagramCallbacks(tree) {
    return tree.map((item) => {
        const cloned = { ...item };
        if (cloned.type === 'diagram') {
            const topicLower = (cloned.topic || '').toLowerCase();
            const keyLower = (cloned.diagramKey || '').toLowerCase();
            if (topicLower.includes('truth table') || keyLower.includes('ttd')) {
                cloned.initCB = initTTD;
                cloned.layoutCB = layout;
            }
            else if (topicLower.includes('formal statement') || keyLower.includes('fsd')) {
                cloned.initCB = initFSD;
                cloned.layoutCB = layoutFSD;
            }
            else if (topicLower.includes('equation') || keyLower.includes('eed') || keyLower.includes('eqd')) {
                cloned.initCB = initEED;
                cloned.layoutCB = layoutEED;
            }
            else if (topicLower.includes('binary tree') || keyLower.includes('btd')) {
                cloned.initCB = initBTD;
                cloned.layoutCB = layoutBTD;
            }
            else if (topicLower.includes('binary interval') || keyLower.includes('bid')) {
                cloned.initCB = initBID;
                cloned.layoutCB = layoutBID;
            }
            else if (topicLower.includes('banner')) {
                cloned.initCB = initOutlineBanner;
                cloned.layoutCB = layoutOutlineBanner;
            }
        }
        if (cloned.indexDesc && Array.isArray(cloned.indexDesc)) {
            cloned.indexDesc = hydrateDiagramCallbacks(cloned.indexDesc);
        }
        return cloned;
    });
}
