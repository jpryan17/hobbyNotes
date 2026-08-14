import { Nav } from './navFW.js';
import { BTreeDiagram, createBTree } from './bTreeDiagram.js';
import { BTreeConfig, BTreeMode } from './bTreeConfig.js';

export interface DiagramRegistryEntry {
  seg: string;
  diagram: string;
  mode: BTreeMode;
  config?: Partial<BTreeConfig>;
  instance?: BTreeDiagram;
}

/**
 * Declarative diagram registry covering all real numbers narrative segments
 */
export const diagramRegistry: DiagramRegistryEntry[] = [
  // xaTotalOrder interactive diagrams
  { seg: 'xaTotalOrder', diagram: 'subtree', mode: 'subtree' },
  { seg: 'xaTotalOrder', diagram: 'simtree', mode: 'simplicity' },
  { seg: 'xaTotalOrder', diagram: 'orderedtree', mode: 'order' },

  // xaCut interactive cut diagram
  { seg: 'xaCut', diagram: 'cutTree', mode: 'cut' },

  // xaAddition & xaMultiplication interactive diagrams
  { seg: 'xaAddition', diagram: 'addition', mode: 'addition' },
  { seg: 'xaMultiplication', diagram: 'multiplication', mode: 'multiplication' },

  // xaDyadicRationals isomorphism diagram
  { seg: 'xaDyadicRationals', diagram: 'isomorphism', mode: 'isomorphism' },

  // Static tree diagrams (replacing bulky pasted Draw.io SVGs)
  { seg: 'xaTreeRepresentation', diagram: 'staticTreeBirthday', mode: 'birthday' },
  { seg: 'xaTreeRepresentation', diagram: 'staticTreeLabeled', mode: 'labeled' },
  { seg: 'xaTreeRepresentation', diagram: 'staticTreeProjected', mode: 'projected' },
  { seg: 'xaDyadicRationals', diagram: 'staticTreeDyadic', mode: 'dyadic' },
  { seg: 'xaDyadicRationals', diagram: 'staticTreePrecision', mode: 'precision' },
];

/**
 * Tracks currently active instantiated diagrams in the DOM
 */
const activeDiagrams = new Map<string, BTreeDiagram>();

export function initAnyDJSI(): void {
  activeDiagrams.clear();

  // 1. Match from declarative registry
  diagramRegistry.forEach((entry) => {
    if (Nav.segId === entry.seg) {
      const container = document.getElementById(entry.diagram);
      if (container) {
        const diagram = createBTree(container, {
          mode: entry.mode,
          id: entry.diagram,
          ...(entry.config || {}),
        });
        activeDiagrams.set(entry.diagram, diagram);
      }
    }
  });

  // 2. Auto-detect any `<div class="djsi" data-btree="...">` in the current segment
  const djsiNodes = document.querySelectorAll<HTMLElement>('.djsi[data-btree]');
  djsiNodes.forEach((node) => {
    const mode = node.getAttribute('data-btree') as BTreeMode;
    const id = node.id || `btree-${Math.random().toString(36).substring(2, 7)}`;
    if (mode && !activeDiagrams.has(id)) {
      const diagram = createBTree(node, { mode, id });
      activeDiagrams.set(id, diagram);
    }
  });
}

export function displayAnyDJSI(): void {
  const containerWidth = Nav.foWidth || window.innerWidth || 900;
  activeDiagrams.forEach((diagram) => {
    diagram.scaleToWidth(containerWidth);
  });
}

// --- Backward-Compatible Adapter Functions ---

export function initSubtree(id = 'subtree'): BTreeDiagram {
  const d = createBTree(id, 'subtree');
  activeDiagrams.set(id, d);
  return d;
}
export function displaySubtree(id = 'subtree'): void {
  const d = activeDiagrams.get(id);
  if (d) d.scaleToWidth(Nav.foWidth || 900);
}

export function initCutTree(id = 'cutTree'): BTreeDiagram {
  const d = createBTree(id, 'cut');
  activeDiagrams.set(id, d);
  return d;
}
export function displayCutTree(id = 'cutTree'): void {
  const d = activeDiagrams.get(id);
  if (d) d.scaleToWidth(Nav.foWidth || 900);
}

export function initOrderedtree(id = 'orderedtree'): BTreeDiagram {
  const d = createBTree(id, 'order');
  activeDiagrams.set(id, d);
  return d;
}
export function displayOrderedtree(id = 'orderedtree'): void {
  const d = activeDiagrams.get(id);
  if (d) d.scaleToWidth(Nav.foWidth || 900);
}

export function initSimtree(id = 'simtree'): BTreeDiagram {
  const d = createBTree(id, 'simplicity');
  activeDiagrams.set(id, d);
  return d;
}
export function displaySimtree(id = 'simtree'): void {
  const d = activeDiagrams.get(id);
  if (d) d.scaleToWidth(Nav.foWidth || 900);
}

export function initAddTree(id = 'addition'): BTreeDiagram {
  const d = createBTree(id, 'addition');
  activeDiagrams.set(id, d);
  return d;
}
export function displayAddTree(id = 'addition'): void {
  const d = activeDiagrams.get(id);
  if (d) d.scaleToWidth(Nav.foWidth || 900);
}

export function initMultiplyTree(id = 'multiplication'): BTreeDiagram {
  const d = createBTree(id, 'multiplication');
  activeDiagrams.set(id, d);
  return d;
}
export function displayMultiplyTree(id = 'multiplication'): void {
  const d = activeDiagrams.get(id);
  if (d) d.scaleToWidth(Nav.foWidth || 900);
}

export function initIsoTree(id = 'isomorphism'): BTreeDiagram {
  const d = createBTree(id, 'isomorphism');
  activeDiagrams.set(id, d);
  return d;
}
export function displayIsoTree(id = 'isomorphism'): void {
  const d = activeDiagrams.get(id);
  if (d) d.scaleToWidth(Nav.foWidth || 900);
}
