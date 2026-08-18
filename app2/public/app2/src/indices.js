import { initOutlineBanner, layoutOutlineBanner } from "./appBanners.js";
export const course1Index = [
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
export const course2Index = [
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
export const course3Index = [
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
];
