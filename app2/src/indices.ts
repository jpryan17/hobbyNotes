import { IndexItemDesc } from "../../clientLib/navIndex.js";
import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";

export const course1Index: IndexItemDesc[] = [
  {
    type: "html",
    topic: "course overview: linear algebra",
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
    topic: "course overview: analysis 1D",
    htmlSegmentId: "analysis1DIntro",
  },
  {
    type: "html",
    topic: "lecture 1: the infinitesimal microscope & continuity",
    htmlSegmentId: "analysis1DLecture1",
  },
  {
    type: "html",
    topic: "lecture 2: algebraic derivatives & local linearity",
    htmlSegmentId: "analysis1DLecture2",
  },
  {
    type: "html",
    topic: "lecture 3: accumulation & telescoping calculus",
    htmlSegmentId: "analysis1DLecture3",
  },
];

export const course3Index: IndexItemDesc[] = [
  {
    type: "html",
    topic: "course overview: analysis 2D",
    htmlSegmentId: "analysis2DIntro",
  },
  {
    type: "html",
    topic: "lecture 1: the 2D complex grid & conformal maps",
    htmlSegmentId: "analysis2DLecture1",
  },
  {
    type: "html",
    topic: "lecture 2: discrete contour integrals & residues",
    htmlSegmentId: "analysis2DLecture2",
  },
  {
    type: "html",
    topic: "lecture 3: quantum state evolution & phase transitions",
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
    topic: "seminar 2: the logic of the particle zoo",
    htmlSegmentId: "particleZooSeminar",
  },
  {
    type: "html",
    topic: "seminar 3: quantum entanglement & reality",
    htmlSegmentId: "quantumEntanglementSeminar",
  },
  {
    type: "html",
    topic: "seminar 4: algebraic geometry & the infinitesimal microscope",
    htmlSegmentId: "algebraicGeometrySeminar",
  },
  {
    type: "html",
    topic: "seminar 4.A: Grothendieck’s sheaf theory & stalks",
    htmlSegmentId: "grothendieckSheafSeminar",
  },
];

export const miniSeminarsIndex: IndexItemDesc[] = [
  {
    type: "html",
    topic: "mini-seminar 1: the Fourier duality",
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
    topic: "mini-seminar 4: higher-successor definitions",
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
