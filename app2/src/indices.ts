import { IndexItemDesc } from "../../clientLib/navIndex.js";
import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";

export const course1Index: IndexItemDesc[] = [
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

export const course2Index: IndexItemDesc[] = [
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

export const course3Index: IndexItemDesc[] = [
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

export const satelliteIndex: IndexItemDesc[] = [
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

export const miniSeminarsIndex: IndexItemDesc[] = [
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
    htmlSegmentId: "introduction",
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
