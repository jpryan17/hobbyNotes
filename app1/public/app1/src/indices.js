import { ttd } from "../../clientLib/ttd.js";
import { fsd } from "../../clientLib/fsd.js";
import { initBTD, layoutBTD } from "../../clientLib/btd.js";
import { initBID, layoutBID } from "../../clientLib/bid.js";
import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";
export const propLogicIndex = [
    {
        type: "html",
        topic: "introduction",
    },
    {
        type: "html",
        topic: "lecture: truth tables & paradoxes",
        htmlSegmentId: "editedPropLogicLectureV1",
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
        htmlSegmentId: "editedFormalStatementsLectureV2",
    },
    {
        type: "html",
        topic: "lecture 2: algebra of sets",
        htmlSegmentId: "editedFormalStatementsLecture2V1",
    },
    {
        type: "diagram",
        topic: "formal statement demo (FSD)",
        initCB: initFSD,
        layoutCB: layoutFSD,
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
        htmlSegmentId: "editedNumbersLecture1V1",
    },
    {
        type: "html",
        topic: "lecture 2: 2-successor trees & growth",
        htmlSegmentId: "editedNumbersLecture2V1",
    },
    {
        type: "html",
        topic: "lecture 3: STEM & spaces",
        htmlSegmentId: "editedNumbersLecture3V1",
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
        htmlSegmentId: "editedBayesianInferenceLecture1V1",
    },
    {
        type: "html",
        topic: "lecture 2: sequential updating",
        htmlSegmentId: "editedBayesianInferenceLecture2V1",
    },
    {
        type: "html",
        topic: "lecture 3: standard vs nonstandard prob",
        htmlSegmentId: "editedBayesianInferenceLecture3V1",
    },
    {
        type: "html",
        topic: "lecture 4: state spaces & entropy",
        htmlSegmentId: "editedBayesianInferenceLecture4V1",
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
        htmlSegmentId: "editedQuantumLogicLecture1V1",
    },
    {
        type: "html",
        topic: "lecture 2: complex amplitudes on ℂ_ω",
        htmlSegmentId: "editedQuantumLogicLecture2V1",
    },
    {
        type: "html",
        topic: "lecture 3: measurement & projection",
        htmlSegmentId: "editedQuantumLogicLecture3V1",
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
        htmlSegmentId: "editedQuantumBayesianInferenceLecture1V1",
    },
    {
        type: "html",
        topic: "lecture 2: reality as an ensemble",
        htmlSegmentId: "editedQuantumBayesianInferenceLecture2V1",
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
export const foundationIndex = [
    {
        type: "html",
        topic: "overview: general science mission",
        htmlSegmentId: "introduction",
    },
    {
        type: "index",
        topic: "conceptual history",
        navTopic: "history",
        indexDesc: conceptualHistoryIndex,
    },
    { type: "index", topic: "propositional logic", navTopic: "prop logic", indexDesc: propLogicIndex },
    {
        type: "index",
        topic: "formal statements",
        navTopic: "formal statements",
        indexDesc: formalStatementsIndex,
    },
    { type: "html", topic: "fsd test", htmlSegmentId: "fsdTest" },
    { type: "index", topic: "numbers & trees", navTopic: "numbers", indexDesc: numbersIndex },
    {
        type: "index",
        topic: "Bayesian inference",
        navTopic: "Bayesian",
        indexDesc: bayesianInferenceIndex,
    },
    { type: "index", topic: "quantum logic", navTopic: "quantum logic", indexDesc: quantumLogicIndex },
    {
        type: "index",
        topic: "quantum Bayesian inference",
        navTopic: "quantum Bayesian",
        indexDesc: quantumBayesianInferenceIndex,
    },
];
export const proposalsIndex = [
    {
        type: "html",
        topic: "proposal 1: Lean 4 interface",
        htmlSegmentId: "lean4GenEdProposal",
    },
    {
        type: "html",
        topic: "academic paper: dual-agent tutor",
        htmlSegmentId: "dualAgentAcademicProposal",
    },
];
export const analysisAndSeminarsIndex = [
    {
        type: "html",
        topic: "overview: continuous analysis & seminars",
        htmlSegmentId: "lamOverview",
    },
    {
        type: "index",
        topic: "course 1: linear algebra",
        navTopic: "course 1",
        indexDesc: course1Index,
    },
    {
        type: "index",
        topic: "course 2: analysis 1D",
        navTopic: "course 2",
        indexDesc: course2Index,
    },
    {
        type: "index",
        topic: "course 3: analysis 2D",
        navTopic: "course 3",
        indexDesc: course3Index,
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
export const lamIndex = analysisAndSeminarsIndex;
export const stemBridgeIndex = [
    {
        type: "html",
        topic: "Newtonian bridge: kinematics & conservation",
        htmlSegmentId: "stemNewtonianBridge",
    },
    {
        type: "html",
        topic: "1D heat diffusion: Laplacian & Fourier",
        htmlSegmentId: "stemHeatDiffusion",
    },
];
export const mainIndex = [
    {
        type: "diagram",
        topic: "title",
        initCB: initOutlineBanner,
        layoutCB: layoutOutlineBanner,
    },
    {
        type: "html",
        topic: "curriculum overview",
        htmlSegmentId: "middlewayIntro",
    },
    {
        type: "index",
        topic: "Phase 1: Foundation",
        navTopic: "Phase 1",
        indexDesc: foundationIndex,
    },
    {
        type: "index",
        topic: "Phase 2: analysis and seminars",
        navTopic: "Phase 2",
        indexDesc: analysisAndSeminarsIndex,
    },
    {
        type: "index",
        topic: "STEM Bridge: Applied Math & CAS",
        navTopic: "STEM Bridge",
        indexDesc: stemBridgeIndex,
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
