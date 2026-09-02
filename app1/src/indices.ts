import { IndexItemDesc } from "../../clientLib/navIndex.js";
import { ttd } from "../../clientLib/ttd.js";
import { fsd } from "../../clientLib/fsd.js";
import { btd, initBTD, layoutBTD } from "../../clientLib/btd.js";
import { bid, initBID, layoutBID } from "../../clientLib/bid.js";

import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";

export const propLogicIndex: IndexItemDesc[] = [
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
export const formalStatementsIndex: IndexItemDesc[] = [
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
export const numbersIndex: IndexItemDesc[] = [
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
    htmlSegmentId: "editedNumbersLecture2V1",
  },
  {
    type: "html",
    topic: "lecture 3: STEM connections & spaces",
    htmlSegmentId: "editedNumbersLecture3V1",
  },
  {
    type: "diagram",
    topic: "2-successor tree demo (BTD)",
    initCB: initBTD,
    layoutCB: layoutBTD,
  },
];
export const bayesianInferenceIndex: IndexItemDesc[] = [
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
    topic: "lecture 3: standard vs nonstandard probability",
    htmlSegmentId: "editedBayesianInferenceLecture3V1",
  },
  {
    type: "html",
    topic: "lecture 4: state spaces, entropy & ensembles",
    htmlSegmentId: "editedBayesianInferenceLecture4V1",
  },
  {
    type: "diagram",
    topic: "Bayesian inference demo (BID)",
    initCB: initBID,
    layoutCB: layoutBID,
  },
];
export const quantumLogicIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "introduction",
    htmlSegmentId: "quantumLogicIntro",
  },
  {
    type: "html",
    topic: "lecture 1: the 3 polarizers & Venn failure",
    htmlSegmentId: "editedQuantumLogicLecture1V1",
  },
  {
    type: "html",
    topic: "lecture 2: complex amplitudes on ℂ_ω",
    htmlSegmentId: "editedQuantumLogicLecture2V1",
  },
  {
    type: "html",
    topic: "lecture 3: measurement as vector projection",
    htmlSegmentId: "editedQuantumLogicLecture3V1",
  },
];
export const quantumBayesianInferenceIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "introduction",
    htmlSegmentId: "quantumBayesianInferenceIntro",
  },
  {
    type: "html",
    topic: "lecture 1: density operators & quantum Bayes",
    htmlSegmentId: "editedQuantumBayesianInferenceLecture1V1",
  },
  {
    type: "html",
    topic: "lecture 2: physical reality as an ensemble",
    htmlSegmentId: "editedQuantumBayesianInferenceLecture2V1",
  },
];

import {
  course1Index,
  course2Index,
  course3Index,
  miniSeminarsIndex,
  satelliteIndex,
} from "../../app2/src/indices.js";

export const conceptualHistoryIndex: IndexItemDesc[] = [
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

export const foundationIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "overview: general science mission",
    htmlSegmentId: "introduction",
  },
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
  { type: "index", topic: "numbers & graph trees", indexDesc: numbersIndex },
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

export const proposalsIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "proposal 1: narrowed-scope Lean 4 educational interface",
    htmlSegmentId: "lean4GenEdProposal",
  },
  {
    type: "html",
    topic: "academic whitepaper: dual-agent verified AI tutor",
    htmlSegmentId: "dualAgentAcademicProposal",
  },
];

export const analysisAndSeminarsIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "overview: continuous analysis & seminars",
    htmlSegmentId: "lamOverview",
  },
  {
    type: "index",
    topic: "course 1: linear algebra",
    indexDesc: course1Index,
  },
  {
    type: "index",
    topic: "course 2: analysis 1D",
    indexDesc: course2Index,
  },
  {
    type: "index",
    topic: "course 3: analysis 2D",
    indexDesc: course3Index,
  },
  {
    type: "index",
    topic: "mini-seminars",
    indexDesc: miniSeminarsIndex,
  },
  {
    type: "index",
    topic: "satellite seminars",
    indexDesc: satelliteIndex,
  },
];

export const lamIndex = analysisAndSeminarsIndex;

export const mainIndex: IndexItemDesc[] = [
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
    topic: "Phase 1: General Science Foundation",
    indexDesc: foundationIndex,
  },
  {
    type: "index",
    topic: "Phase 2: Continuous Structures & Seminars (Tertiary)",
    indexDesc: analysisAndSeminarsIndex,
  },
  {
    type: "index",
    topic: "Phase 3: Adjacent Research & Proposals",
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
