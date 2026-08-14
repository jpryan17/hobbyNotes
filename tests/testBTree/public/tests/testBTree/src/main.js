import { createBTree } from '../../../clientLib/bTreeDiagram.js';
let currentDiagram = null;
let currentMode = 'plain';
const modeDescriptions = {
    plain: '<strong>Plain Tree:</strong> Base binary tree topology up to max birthday depth (6).',
    birthday: '<strong>Birthday Palette:</strong> Distinct color highlighting for each generation/birthday level (0 to 6).',
    labeled: '<strong>Sign Expansion:</strong> Conway sign expansion notation [ - + + ] displayed inside enlarged nodes.',
    dyadic: '<strong>Dyadic Rational:</strong> Exact binary fractional values (0, 1, -1/2, 3/4, etc.) formatted on nodes.',
    projected: '<strong>Number Line Projection:</strong> Vertical projection drop lines connecting each tree node to the horizontal number line.',
    precision: '<strong>Precision Interval:</strong> Highlights a prefix path and shows bounding interval projections.',
    subtree: '<strong>Subtree Highlight (1-node):</strong> Click any node to highlight its left subtree in red and right subtree in blue.',
    simplicity: '<strong>Simplicity Order (1-node):</strong> Click any node to trace simpler ancestors and partition them into Left Simpler (<) and Right Simpler (>).',
    order: '<strong>Total Order (1-node):</strong> Visualizes Conway total ordering by coloring all strictly smaller and larger nodes and subtrees.',
    cut: '<strong>Conway Cut (2-node):</strong> Click 2 nodes to find the unique simplest real number strictly between them (r = L | R).',
    addition: '<strong>Surreal Addition (+):</strong> Click 2 operands to execute recursive Surreal addition and display recursion metrics.',
    multiplication: '<strong>Surreal Multiplication (*):</strong> Click 2 operands to execute recursive Surreal multiplication.',
    isomorphism: '<strong>Dyadic Isomorphism:</strong> Computes both Surreal sign expansion and Dyadic Rational arithmetic simultaneously.',
    omegaState: '<strong>State/Ω Inspector (1-node):</strong> Click any state node in the tree or top canopy to trace its ascending path from Root 0, revealing its sign address, coordinates, hypothesis likelihoods, and Bayes factor.',
};
function renderDiagram(mode) {
    currentMode = mode;
    const slot = document.getElementById('diagram-slot');
    const info = document.getElementById('mode-info');
    if (info) {
        info.innerHTML = modeDescriptions[mode] || `<strong>Mode:</strong> ${mode}`;
    }
    if (slot) {
        slot.innerHTML = '';
        currentDiagram = createBTree(slot, mode);
        handleResize();
    }
}
function handleResize() {
    if (currentDiagram) {
        const slot = document.getElementById('diagram-slot');
        const availableWidth = slot ? slot.clientWidth : window.innerWidth - 80;
        currentDiagram.scaleToWidth(availableWidth);
    }
}
// Setup button click handlers
document.querySelectorAll('.btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        if (mode)
            renderDiagram(mode);
    });
});
window.addEventListener('resize', handleResize);
// Initial render
renderDiagram('plain');
