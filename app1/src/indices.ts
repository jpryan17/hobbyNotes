import { IndexItemDesc } from "../../clientLib/navIndex.js";
import { ttd } from "../../clientLib/ttd.js";

import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";

export const propLogicIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "introduction",
    htmlSegmentId: "propLogicIntro",
  },
  { type: "html", topic: "lecture", htmlSegmentId: "propLogicLecture" },
  {
    type: "diagram",
    topic: "truth table demo",
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
  { type: "html", topic: "lecture", htmlSegmentId: "formalStatementsLecture" },
];
export const numbersIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "introduction",
    htmlSegmentId: "numbersIntro",
  },
];
export const bayesianInferenceIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "introduction",
    htmlSegmentId: "bayesianInferenceIntro",
  },
];
export const quantumLogicIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "introduction",
    htmlSegmentId: "quantumLogicIntro",
  },
];
export const quantumBayesianInferenceIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "introduction",
    htmlSegmentId: "quantumBayesianInferenceIntro",
  },
];

export const mainIndex: IndexItemDesc[] = [
  {
    type: "diagram",
    topic: "title",
    initCB: initOutlineBanner,
    layoutCB: layoutOutlineBanner,
  },
  { type: "html", topic: "introduction", htmlSegmentId: "introduction" },
  { type: "index", topic: "propositional logic", indexDesc: propLogicIndex },
  {
    type: "index",
    topic: "formal statements",
    indexDesc: formalStatementsIndex,
  },
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
