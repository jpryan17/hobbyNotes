import { ttd } from "../../clientLib/ttd.js";
import { fsd } from "../../clientLib/fsd.js";
import { initBTD, layoutBTD } from "../../clientLib/btd.js";
import { initBID, layoutBID } from "../../clientLib/bid.js";
import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";
export const propLogicIndex = [
    {
        type: "html",
        topic: "introduction",
        htmlSegmentId: "propLogicIntro",
    },
    {
        type: "html",
        topic: "lecture: truth, tables & paradoxes",
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
        topic: "lecture 2: the algebra of sets",
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
        topic: "lecture 1: formal definitions & counting",
        htmlSegmentId: "editedNumbersLecture1V1",
    },
    {
        type: "html",
        topic: "lecture 2: 2-successor trees & inductive growth",
        htmlSegmentId: "numbersLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: STEM connections & spaces",
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
        topic: "lecture 3: standard vs nonstandard probability",
        htmlSegmentId: "bayesianInferenceLecture3",
    },
    {
        type: "html",
        topic: "lecture 4: state spaces, entropy & ensembles",
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
        topic: "lecture 1: the 3 polarizers & Venn failure",
        htmlSegmentId: "quantumLogicLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: complex amplitudes on ℂ_ω",
        htmlSegmentId: "quantumLogicLecture2",
    },
    {
        type: "html",
        topic: "lecture 3: measurement as vector projection",
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
        topic: "lecture 1: density operators & quantum Bayes",
        htmlSegmentId: "quantumBayesianInferenceLecture1",
    },
    {
        type: "html",
        topic: "lecture 2: physical reality as an ensemble",
        htmlSegmentId: "quantumBayesianInferenceLecture2",
    },
];
export const conceptualHistoryIndex = [
    {
        type: "html",
        topic: "instructor guide: curriculum roadmap",
        htmlSegmentId: "conceptualHistoryInstructorGuide",
    },
    {
        type: "html",
        topic: "student narrative: evolving models of physical reality",
        htmlSegmentId: "conceptualHistoryIntro",
    },
];
export const mainIndex = [
    {
        type: "diagram",
        topic: "title",
        initCB: initOutlineBanner,
        layoutCB: layoutOutlineBanner,
    },
    { type: "html", topic: "introduction", htmlSegmentId: "introduction" },
    {
        type: "index",
        topic: "conceptual history",
        indexDesc: conceptualHistoryIndex,
    },
    { type: "index", topic: "propositional logic", indexDesc: propLogicIndex },
    {
        type: "index",
        topic: "formal statements",
        indexDesc: formalStatementsIndex,
    },
    { type: "html", topic: "fsd test", htmlSegmentId: "fsdTest" },
    { type: "index", topic: "numbers", indexDesc: numbersIndex },
    {
        type: "index",
        topic: "Bayesian Inference",
        indexDesc: bayesianInferenceIndex,
    },
    { type: "index", topic: "quantum logic", indexDesc: quantumLogicIndex },
    {
        type: "index",
        topic: "quantum Bayesian Inference",
        indexDesc: quantumBayesianInferenceIndex,
    },
];
function initTTD() {
    //setTTD()
    ttd.pxe.exp = "";
    ttd.pxe.nl = 0;
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
