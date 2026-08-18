export const DEFAULT_BIRTHDAY_PALETTE = [
    '#222222', // bd 0 (black)
    '#2e7d32', // bd 1 (dark green)
    '#1565c0', // bd 2 (blue)
    '#c62828', // bd 3 (red)
    '#00695c', // bd 4 (teal/darkgreen)
    '#ef6c00', // bd 5 (orange)
    '#283593', // bd 6 (dark blue)
    '#689f38', // bd 7 (light olive green)
];
export const DEFAULT_PALETTE = {
    baseNode: '#e6c896', // warm tan
    baseLink: '#c4aa7d',
    hoverNode: '#ff80ab', // pink
    selectedNode: '#212121', // black/dark
    firstSelection: '#1976d2', // blue
    secondSelection: '#d32f2f', // red
    leftSubtree: '#d32f2f', // red
    rightSubtree: '#1976d2', // blue
    leftSimpler: '#d32f2f', // red
    rightSimpler: '#1976d2', // blue
    cutResult: '#000000',
    antenna: '#c4aa7d',
    projectionLine: '#b0bec5',
    highlightLink: '#78909c',
    omegaStatePath: '#0284c7', // sky blue
    omegaStateNode: '#d97706', // amber gold
    bg: '#f8fbff', // alice blue tint
    frame: '#1565c0',
    birthdayColors: DEFAULT_BIRTHDAY_PALETTE,
};
export const BTreePresets = {
    plain: {
        mode: 'plain',
        width: 900,
        height: 400,
        maxBD: 6,
        nodeSize: 4,
        labelType: 'none',
        antenna: false,
        arity: 0,
    },
    birthday: {
        mode: 'birthday',
        width: 900,
        height: 420,
        maxBD: 6,
        nodeSize: 4,
        labelType: 'birthday',
        antenna: true,
        arity: 0,
    },
    labeled: {
        mode: 'labeled',
        width: 900,
        height: 440,
        maxBD: 4,
        nodeSize: 24,
        fontSize: 11,
        labelType: 'sign',
        antenna: true,
        topRoom: 60,
        bottomRoom: 30,
        arity: 0,
    },
    dyadic: {
        mode: 'dyadic',
        width: 900,
        height: 440,
        maxBD: 4,
        nodeSize: 22,
        fontSize: 11,
        labelType: 'dyadic',
        antenna: true,
        topRoom: 60,
        bottomRoom: 30,
        arity: 0,
    },
    projected: {
        mode: 'projected',
        width: 900,
        height: 400,
        maxBD: 6,
        nodeSize: 4,
        labelType: 'none',
        antenna: false,
        bottomRoom: 50,
        arity: 0,
    },
    precision: {
        mode: 'precision',
        width: 900,
        height: 400,
        maxBD: 6,
        nodeSize: 4,
        labelType: 'none',
        antenna: false,
        precisionRoot: '--+',
        bottomRoom: 50,
        arity: 0,
    },
    subtree: {
        mode: 'subtree',
        width: 900,
        height: 400,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: false,
        bottomRoom: 60,
        arity: 1,
    },
    simplicity: {
        mode: 'simplicity',
        width: 900,
        height: 420,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: false,
        bottomRoom: 85,
        arity: 1,
    },
    order: {
        mode: 'order',
        width: 900,
        height: 400,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: false,
        bottomRoom: 60,
        arity: 1,
    },
    cut: {
        mode: 'cut',
        width: 900,
        height: 420,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: true,
        topRoom: 30,
        bottomRoom: 70,
        arity: 2,
    },
    addition: {
        mode: 'addition',
        width: 900,
        height: 420,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: true,
        topRoom: 30,
        bottomRoom: 90,
        arity: 2,
    },
    multiplication: {
        mode: 'multiplication',
        width: 900,
        height: 420,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: true,
        topRoom: 30,
        bottomRoom: 90,
        arity: 2,
    },
    isomorphism: {
        mode: 'isomorphism',
        width: 900,
        height: 430,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: true,
        topRoom: 30,
        bottomRoom: 100,
        arity: 2,
    },
    omegaState: {
        mode: 'omegaState',
        width: 900,
        height: 420,
        maxBD: 6,
        nodeSize: 6,
        labelType: 'none',
        antenna: true,
        topRoom: 25,
        bottomRoom: 75,
        arity: 1,
    },
};
