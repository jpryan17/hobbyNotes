// crud/src/menuTree.ts
// Hierarchical Navigation Tree specification for Middle Way Mathematics CRUD Studio.
// Mimics the canonical curriculum course index and organizes custom elements and auxiliary tables.

export interface MenuItem {
    label: string;
    icon?: string;
    typeKey?: string;
    filterKind?: { column: string; value: string };
    instanceKey?: string;
    instanceId?: string | number;
    children?: MenuItem[];
}

export const navigationMenuTree: MenuItem[] = [
    // -------------------------------------------------------------------------
    // 1. Curriculum Outline Index Entries (The Course Tree Hierarchy)
    // -------------------------------------------------------------------------
    {
        label: 'Index Entries',
        icon: '🌲',
        typeKey: 'curriculum_nav_item',
        children: [
            {
                label: 'Introduction & Overview',
                children: [
                    { label: 'Mission & Epistemology', typeKey: 'curriculum_nav_item', instanceKey: 'introduction' },
                    { label: 'The Three Architectural Models', typeKey: 'curriculum_nav_item', instanceKey: 'modelsOverview' },
                    { label: 'Conceptual History & Methodological Notes', typeKey: 'curriculum_nav_item', instanceKey: 'conceptualHistoryIntro' }
                ]
            },
            {
                label: 'Level 1: Logic & Number',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'level1Overview' },
                    {
                        label: 'Propositional Logic',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'propLogicIntro' },
                            { label: 'Truth Tables & Paradoxes', typeKey: 'curriculum_nav_item', instanceKey: 'propLogicLecture' }
                        ]
                    },
                    {
                        label: 'Formal Statements',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'formalStatementsIntro' },
                            { label: 'Sets, Tuples & Constructors', typeKey: 'curriculum_nav_item', instanceKey: 'formalStatementsLecture1' },
                            { label: 'Algebra of Sets', typeKey: 'curriculum_nav_item', instanceKey: 'formalStatementsLecture2' }
                        ]
                    },
                    {
                        label: 'Numbers & Conway Trees',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'numbersIntro' },
                            { label: 'Binary Sequences & Counting', typeKey: 'curriculum_nav_item', instanceKey: 'numbersLecture1' },
                            { label: 'Surreal Number Line & Growth', typeKey: 'curriculum_nav_item', instanceKey: 'numbersLecture2' },
                            { label: 'Infinitesimal Arithmetic & STEM Spaces', typeKey: 'curriculum_nav_item', instanceKey: 'numbersLecture3' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 2: Algebraic Structure & Linearity',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'lamOverview' },
                    { label: 'Sequences & Progressions', typeKey: 'curriculum_nav_item', instanceKey: 'sequencesAndSums' },
                    { label: 'Vector Foundations Overview', typeKey: 'curriculum_nav_item', instanceKey: 'vectorFoundationsIntro' },
                    {
                        label: 'Linear Algebra & Symmetries',
                        children: [
                            { label: 'Emergent Groups & Fields', typeKey: 'curriculum_nav_item', instanceKey: 'vectorsLecture1' },
                            { label: 'Structure-Preserving Maps', typeKey: 'curriculum_nav_item', instanceKey: 'vectorsLecture2' },
                            { label: 'Vector Spaces & Duality', typeKey: 'curriculum_nav_item', instanceKey: 'vectorsLecture3' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 3: Continuum & Calculus',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DIntro' },
                    {
                        label: '1D Analysis',
                        children: [
                            { label: 'Continuum & Continuity', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DLecture1' },
                            { label: 'Derivatives & Linearity', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DLecture2' },
                            { label: 'Accumulation & Calculus', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DLecture3' }
                        ]
                    },
                    {
                        label: '2D Analysis',
                        children: [
                            { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DIntro' },
                            { label: '2D Grid & Conformal Maps', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DLecture1' },
                            { label: 'Contour Integrals & Residues', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DLecture2' },
                            { label: 'State Evolution & Phase', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DLecture3' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 4: Space & Growth',
                children: [
                    { label: 'Trigonometry & Rotor Foundations', typeKey: 'curriculum_nav_item', instanceKey: 'stemTrigFoundations' },
                    {
                        label: 'Transcendental Engine',
                        children: [
                            { label: 'Exponential & Logarithmic Foundations', typeKey: 'curriculum_nav_item', instanceKey: 'stemExpLogFoundations' },
                            { label: 'Circular Dynamics & Trigonometric Derivatives', typeKey: 'curriculum_nav_item', instanceKey: 'stemTrigDerivatives' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 5: Quantum & Information',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'level5Overview' },
                    {
                        label: 'Bayesian Inference',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceIntro' },
                            { label: 'Normalized Probability Space', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture1' },
                            { label: 'Conditional Probability & Bayes Filter', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture2' },
                            { label: 'Sequential Updating & Evidence Streams', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture3' },
                            { label: 'State Spaces & Entropy', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture4' }
                        ]
                    },
                    {
                        label: 'Quantum Logic',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicIntro' },
                            { label: 'Three Polarizers & Venn Failure', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicLecture1' },
                            { label: 'Complex Amplitudes & Projection', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicLecture2' },
                            { label: 'Orthomodular Lattice Geometry', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicLecture3' }
                        ]
                    },
                    {
                        label: 'Quantum Bayesian Inference',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'quantumBayesianInferenceIntro' },
                            { label: 'Density Operators & Lüders Rule', typeKey: 'curriculum_nav_item', instanceKey: 'quantumBayesianInferenceLecture1' },
                            { label: 'Entanglement & Macroscopic Emergence', typeKey: 'curriculum_nav_item', instanceKey: 'quantumBayesianInferenceLecture2' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 6: Applied Seminars',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'satelliteSeminarsIntro' },
                    {
                        label: 'Applied Physics',
                        children: [
                            { label: 'Newtonian Kinematics & Conservation', typeKey: 'curriculum_nav_item', instanceKey: 'stemNewtonianBridge' },
                            { label: '1D Heat Diffusion', typeKey: 'curriculum_nav_item', instanceKey: 'stemHeatDiffusion' }
                        ]
                    },
                    {
                        label: 'Mini-Seminars',
                        children: [
                            { label: 'Fourier Transforms', typeKey: 'curriculum_nav_item', instanceKey: 'fourierTransformSeminar' },
                            { label: 'Halo Soup & Cosmology', typeKey: 'curriculum_nav_item', instanceKey: 'haloSoupSeminar' },
                            { label: 'Holographic Principle & Boundary Codings', typeKey: 'curriculum_nav_item', instanceKey: 'holographicPrincipleSeminar' },
                            { label: 'Higher Successors & Transfinite Hierarchies', typeKey: 'curriculum_nav_item', instanceKey: 'higherSuccessorsSeminar' },
                            { label: 'Cosmology as Information', typeKey: 'curriculum_nav_item', instanceKey: 'cosmologyAsInformation' }
                        ]
                    },
                    {
                        label: 'Satellite Masterclasses',
                        children: [
                            { label: 'Particle Zoo Logic', typeKey: 'curriculum_nav_item', instanceKey: 'particleZooSeminar' },
                            { label: 'Quantum Entanglement & Tensor Networks', typeKey: 'curriculum_nav_item', instanceKey: 'quantumEntanglementSeminar' },
                            { label: 'Algebraic Geometry on Dyadic Rings', typeKey: 'curriculum_nav_item', instanceKey: 'algebraicGeometrySeminar' }
                        ]
                    }
                ]
            },
            {
                label: 'Research & Proposals',
                children: [
                    { label: 'Lean 4 General Education Curriculum', typeKey: 'curriculum_nav_item', instanceKey: 'lean4GenEdProposal' },
                    { label: 'Dual-Agent Academic Pair Programming', typeKey: 'curriculum_nav_item', instanceKey: 'dualAgentAcademicProposal' },
                    { label: 'Minimal Axiomatic Core for General Science', typeKey: 'curriculum_nav_item', instanceKey: 'minimalAxiomaticCoreProposal' }
                ]
            },
            { label: 'Browse All Index Entries', typeKey: 'curriculum_nav_item' }
        ]
    },

    // -------------------------------------------------------------------------
    // 2. Formal Axiomatic Statements (Dual-Axis Taxonomy)
    // -------------------------------------------------------------------------
    {
        label: 'Formal Statements',
        icon: '📐',
        typeKey: 'formal_statement',
        children: [
            {
                label: 'Axioms',
                typeKey: 'axiom',
                filterKind: { column: 'statement_kind', value: 'axiom' },
                children: [
                    { label: 'Hyperfinite Probability Space', typeKey: 'formal_statement', instanceKey: 'fs_hyperfinite_probability' },
                    { label: 'Core Dyadic Isomorphism', typeKey: 'formal_statement', instanceKey: 'fs_dyadic_isomorphism' },
                    { label: 'van den Dries–Ehrlich Subfield', typeKey: 'formal_statement', instanceKey: 'fs_van_den_dries_ehrlich' },
                    { label: 'Browse All Axioms', typeKey: 'axiom' }
                ]
            },
            {
                label: 'Theorems',
                typeKey: 'theorem',
                filterKind: { column: 'statement_kind', value: 'theorem' },
                children: [
                    { label: 'Newtonian Dynamics & Acceleration', typeKey: 'formal_statement', instanceKey: 'fs_newtonian_mechanics' },
                    { label: 'Telescoping FTC', typeKey: 'formal_statement', instanceKey: 'fs_telescoping_ftc' },
                    { label: 'Cauchy-Riemann Coordinate Symmetry', typeKey: 'formal_statement', instanceKey: 'fs_cauchy_riemann_symmetry' },
                    { label: 'Hyperfinite Cauchy-Goursat Loop Vanishing', typeKey: 'formal_statement', instanceKey: 'fs_contour_cauchy_goursat' },
                    { label: 'Lee-Yang Unit Circle Partition', typeKey: 'formal_statement', instanceKey: 'fs_lee_yang_circle' },
                    { label: 'Total Ordering on Tree2', typeKey: 'formal_statement', instanceKey: 'fs_tree2_totally_ordered' },
                    { label: 'Standard Part Ring Homomorphism', typeKey: 'formal_statement', instanceKey: 'fs_standard_part_homomorphism' },
                    { label: 'Discrete Cauchy-Schwarz Inequality', typeKey: 'formal_statement', instanceKey: 'fs_cauchy_schwarz_discrete' },
                    { label: 'Browse All Theorems', typeKey: 'theorem' }
                ]
            },
            {
                label: 'Directed Equalities',
                typeKey: 'directed_equality',
                filterKind: { column: 'statement_kind', value: 'directed_equality' },
                children: [
                    { label: 'Uniform Free Fall Kinematics', typeKey: 'formal_statement', instanceKey: 'fs_free_fall_accel' },
                    { label: 'Telescoping Work-Energy Principle', typeKey: 'formal_statement', instanceKey: 'fs_work_energy' },
                    { label: 'Discrete Thermal Diffusion Balance', typeKey: 'formal_statement', instanceKey: 'fs_heat_flux' },
                    { label: 'Hyperfinite Difference Quotient Derivative', typeKey: 'formal_statement', instanceKey: 'fs_hyperfinite_derivative' },
                    { label: '2D Complex Step & Modulus Invariance', typeKey: 'formal_statement', instanceKey: 'fs_complex_step_invariance' },
                    { label: 'Harmonic Leapfrog Phase Space Orbit', typeKey: 'formal_statement', instanceKey: 'fs_harmonic_oscillator' },
                    { label: 'Three-Polarizer Geometric Transmission', typeKey: 'formal_statement', instanceKey: 'fs_three_polarizer_quantum' },
                    { label: 'Hyperfinite Bayesian Likelihood Inversion', typeKey: 'formal_statement', instanceKey: 'fs_bayes_updating' },
                    { label: 'Dyadic Ptolemaic Half-Angle Root Bisection', typeKey: 'formal_statement', instanceKey: 'fs_ptolemaic_half_angle' },
                    { label: 'Dyadic Polygonal Rim Chord Law', typeKey: 'formal_statement', instanceKey: 'fs_polygonal_rim_chord' },
                    { label: 'Euler Polar Rotor Decomposition', typeKey: 'formal_statement', instanceKey: 'fs_euler_identity_rotor' },
                    { label: 'Unit Rotor Sine & Cosine Projection', typeKey: 'formal_statement', instanceKey: 'fs_unit_rotor_projection' },
                    { label: 'Conway Inductive Addition (+)', typeKey: 'formal_statement', instanceKey: 'fs_conway_addition' },
                    { label: 'Conway Inductive Multiplication (·)', typeKey: 'formal_statement', instanceKey: 'fs_conway_multiplication' },
                    { label: 'Browse All Directed Equalities', typeKey: 'directed_equality' }
                ]
            },
            { label: 'Browse All Formal Statements', typeKey: 'formal_statement' }
        ]
    },

    // -------------------------------------------------------------------------
    // 3. Demo Initializations (Interactive Sandbox Demos & Presets)
    // -------------------------------------------------------------------------
    {
        label: 'Demo Initializations',
        icon: '🎛️',
        typeKey: 'demo_initializations',
        children: [
            {
                label: 'Truth Table Demo (TTD)',
                typeKey: 'ttd',
                children: [
                    { label: "De Morgan's First Law", typeKey: 'interactive_demo', instanceKey: 'ttd_demorgan' },
                    { label: 'Modus Ponens (Detachment)', typeKey: 'interactive_demo', instanceKey: 'ttd_modus_ponens' },
                    { label: 'Law of Excluded Middle', typeKey: 'interactive_demo', instanceKey: 'ttd_excluded_middle' },
                    { label: 'Principle of Non-Contradiction', typeKey: 'interactive_demo', instanceKey: 'ttd_non_contradiction' },
                    { label: 'Material Implication (→)', typeKey: 'interactive_demo', instanceKey: 'ttd_implication' },
                    { label: 'Material Equivalence (↔)', typeKey: 'interactive_demo', instanceKey: 'ttd_equivalence' },
                    { label: 'Hypothetical Syllogism', typeKey: 'interactive_demo', instanceKey: 'ttd_hypothetical_syllogism' },
                    { label: 'Browse All TTD Initializations', typeKey: 'ttd' }
                ]
            },
            {
                label: 'Binary Tree Demo (BTD)',
                typeKey: 'btd',
                children: [
                    { label: 'Surreal Tree Total Order', typeKey: 'interactive_demo', instanceKey: 'btd_order' },
                    { label: 'Conway Inductive Addition (+)', typeKey: 'interactive_demo', instanceKey: 'btd_addition' },
                    { label: 'Conway Inductive Multiplication (·)', typeKey: 'interactive_demo', instanceKey: 'btd_multiplication' },
                    { label: 'Labeled Dyadic Sequences', typeKey: 'interactive_demo', instanceKey: 'btd_labeled' },
                    { label: 'Browse All BTD Initializations', typeKey: 'btd' }
                ]
            },
            {
                label: 'Binary Interval Demo (BID)',
                typeKey: 'bid',
                children: [
                    { label: 'Dyadic Interval Subdivision', typeKey: 'interactive_demo', instanceKey: 'bid_euler' },
                    { label: 'Unit Rotor Circle Projection', typeKey: 'interactive_demo', instanceKey: 'bid_rotor' },
                    { label: 'Browse All BID Initializations', typeKey: 'bid' }
                ]
            },
            {
                label: 'Formal Statements Demo (FSD)',
                typeKey: 'fsd',
                children: [
                    { label: 'Formal Structure Stage Visualizer', typeKey: 'interactive_demo', instanceKey: 'fsd_stage' },
                    { label: 'Browse All FSD Initializations', typeKey: 'fsd' }
                ]
            },
            { label: 'Browse All Demo Initializations', typeKey: 'interactive_demos' }
        ]
    }
];

/**
 * Recursively renders the multi-level cascading HTML markup.
 */
export function renderMenuHierarchy(items: MenuItem[]): string {
    return items.map((item) => {
        const hasChildren = item.children && item.children.length > 0;
        const iconHtml = item.icon ? `<span class="menu-icon">${item.icon}</span>` : '';
        const arrowHtml = hasChildren ? `<span class="submenu-arrow">▸</span>` : '';
        const dataAttrs = [
            item.typeKey ? `data-type="${item.typeKey}"` : '',
            item.instanceKey ? `data-instance-key="${item.instanceKey}"` : '',
            item.instanceId !== undefined ? `data-instance-id="${item.instanceId}"` : '',
            `data-label="${item.label.replace(/"/g, '&quot;')}"`,
            hasChildren ? 'data-has-submenu="true"' : '',
        ].filter(Boolean).join(' ');

        if (hasChildren) {
            return `
                <div class="dropdown-item has-submenu" ${dataAttrs}>
                    <div class="item-label-content">
                        ${iconHtml}<span>${item.label}</span>
                    </div>
                    ${arrowHtml}
                    <div class="dropdown-submenu">
                        ${renderMenuHierarchy(item.children!)}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="dropdown-item" ${dataAttrs}>
                    <div class="item-label-content">
                        ${iconHtml}<span>${item.label}</span>
                    </div>
                </div>
            `;
        }
    }).join('');
}
