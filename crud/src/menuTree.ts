// crud/src/menuTree.ts
// Hierarchical Navigation Tree specification for Middle Way Mathematics CRUD Studio.
// Organizes curriculum index entries, formal statements (axioms, theorems, directed equalities),
// and interactive demo initializations, with first-class Subject Domain tagging & filtering.

export interface MenuItem {
    label: string;
    icon?: string;
    typeKey?: string;
    filterKind?: { column: string; value: string };
    instanceKey?: string;
    instanceId?: string | number;
    subject?: string; // 'logic' | 'numbers_trees' | 'algebra' | 'analysis' | 'physics' | 'information' | 'all'
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
                subject: 'all',
                children: [
                    { label: 'Mission & Epistemology', typeKey: 'curriculum_nav_item', instanceKey: 'introduction', subject: 'all' },
                    { label: 'The Three Architectural Models', typeKey: 'curriculum_nav_item', instanceKey: 'modelsOverview', subject: 'all' },
                    { label: 'Conceptual History & Methodological Notes', typeKey: 'curriculum_nav_item', instanceKey: 'conceptualHistoryIntro', subject: 'all' }
                ]
            },
            {
                label: 'Level 1: Logic & Number',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'level1Overview', subject: 'logic' },
                    {
                        label: 'Propositional Logic',
                        subject: 'logic',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'propLogicIntro', subject: 'logic' },
                            { label: 'Truth Tables & Paradoxes', typeKey: 'curriculum_nav_item', instanceKey: 'propLogicLecture', subject: 'logic' }
                        ]
                    },
                    {
                        label: 'Formal Statements',
                        subject: 'logic',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'formalStatementsIntro', subject: 'logic' },
                            { label: 'Sets, Tuples & Constructors', typeKey: 'curriculum_nav_item', instanceKey: 'formalStatementsLecture1', subject: 'logic' },
                            { label: 'Algebra of Sets', typeKey: 'curriculum_nav_item', instanceKey: 'formalStatementsLecture2', subject: 'logic' }
                        ]
                    },
                    {
                        label: 'Numbers & Conway Trees',
                        subject: 'numbers_trees',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'numbersIntro', subject: 'numbers_trees' },
                            { label: 'Binary Sequences & Counting', typeKey: 'curriculum_nav_item', instanceKey: 'numbersLecture1', subject: 'numbers_trees' },
                            { label: 'Surreal Number Line & Growth', typeKey: 'curriculum_nav_item', instanceKey: 'numbersLecture2', subject: 'numbers_trees' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 2: Algebraic Structure & Linearity',
                subject: 'algebra',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'lamOverview', subject: 'algebra' },
                    { label: 'Sequences & Progressions', typeKey: 'curriculum_nav_item', instanceKey: 'sequencesAndSums', subject: 'algebra' },
                    { label: 'Vector Foundations Overview', typeKey: 'curriculum_nav_item', instanceKey: 'vectorFoundationsIntro', subject: 'algebra' },
                    {
                        label: 'Linear Algebra & Symmetries',
                        subject: 'algebra',
                        children: [
                            { label: 'Emergent Groups & Fields', typeKey: 'curriculum_nav_item', instanceKey: 'vectorsLecture1', subject: 'algebra' },
                            { label: 'Structure-Preserving Maps', typeKey: 'curriculum_nav_item', instanceKey: 'vectorsLecture2', subject: 'algebra' },
                            { label: 'Vector Spaces & Duality', typeKey: 'curriculum_nav_item', instanceKey: 'vectorsLecture3', subject: 'algebra' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 3: Continuum & Calculus',
                subject: 'analysis',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DIntro', subject: 'analysis' },
                    {
                        label: '1D Analysis',
                        subject: 'analysis',
                        children: [
                            { label: 'Continuum & Continuity', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DLecture1', subject: 'analysis' },
                            { label: 'Derivatives & Linearity', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DLecture2', subject: 'analysis' },
                            { label: 'Accumulation & Calculus', typeKey: 'curriculum_nav_item', instanceKey: 'analysis1DLecture3', subject: 'analysis' }
                        ]
                    },
                    {
                        label: '2D Analysis',
                        subject: 'analysis',
                        children: [
                            { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DIntro', subject: 'analysis' },
                            { label: '2D Grid & Conformal Maps', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DLecture1', subject: 'analysis' },
                            { label: 'Contour Integrals & Residues', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DLecture2', subject: 'analysis' },
                            { label: 'State Evolution & Phase', typeKey: 'curriculum_nav_item', instanceKey: 'analysis2DLecture3', subject: 'analysis' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 4: Space & Growth',
                subject: 'analysis',
                children: [
                    { label: 'Trigonometry & Rotor Foundations', typeKey: 'curriculum_nav_item', instanceKey: 'stemTrigFoundations', subject: 'analysis' },
                    {
                        label: 'Transcendental Engine',
                        subject: 'analysis',
                        children: [
                            { label: 'Exponential & Logarithmic Foundations', typeKey: 'curriculum_nav_item', instanceKey: 'stemExpLogFoundations', subject: 'analysis' },
                            { label: 'Circular Dynamics & Trigonometric Derivatives', typeKey: 'curriculum_nav_item', instanceKey: 'stemTrigDerivatives', subject: 'analysis' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 5: Quantum & Information',
                subject: 'information',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'level5Overview', subject: 'information' },
                    {
                        label: 'Bayesian Inference',
                        subject: 'information',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceIntro', subject: 'information' },
                            { label: 'Normalized Probability Space', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture1', subject: 'information' },
                            { label: 'Conditional Probability & Bayes Filter', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture2', subject: 'information' },
                            { label: 'Sequential Updating & Evidence Streams', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture3', subject: 'information' },
                            { label: 'State Spaces & Entropy', typeKey: 'curriculum_nav_item', instanceKey: 'bayesianInferenceLecture4', subject: 'information' }
                        ]
                    },
                    {
                        label: 'Quantum Logic',
                        subject: 'information',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicIntro', subject: 'information' },
                            { label: 'Three Polarizers & Venn Failure', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicLecture1', subject: 'information' },
                            { label: 'Complex Amplitudes & Projection', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicLecture2', subject: 'information' },
                            { label: 'Orthomodular Lattice Geometry', typeKey: 'curriculum_nav_item', instanceKey: 'quantumLogicLecture3', subject: 'information' }
                        ]
                    },
                    {
                        label: 'Quantum Bayesian Inference',
                        subject: 'information',
                        children: [
                            { label: 'Introduction', typeKey: 'curriculum_nav_item', instanceKey: 'quantumBayesianInferenceIntro', subject: 'information' },
                            { label: 'Density Operators & Lüders Rule', typeKey: 'curriculum_nav_item', instanceKey: 'quantumBayesianInferenceLecture1', subject: 'information' },
                            { label: 'Entanglement & Macroscopic Emergence', typeKey: 'curriculum_nav_item', instanceKey: 'quantumBayesianInferenceLecture2', subject: 'information' }
                        ]
                    }
                ]
            },
            {
                label: 'Level 6: Applied Seminars',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'satelliteSeminarsIntro', subject: 'physics' },
                    {
                        label: 'Applied Physics',
                        subject: 'physics',
                        children: [
                            { label: 'Newtonian Kinematics & Conservation', typeKey: 'curriculum_nav_item', instanceKey: 'stemNewtonianBridge', subject: 'physics' },
                            { label: '1D Heat Diffusion', typeKey: 'curriculum_nav_item', instanceKey: 'stemHeatDiffusion', subject: 'physics' }
                        ]
                    },
                    {
                        label: 'Mini-Seminars',
                        subject: 'analysis',
                        children: [
                            { label: 'Fourier Transforms', typeKey: 'curriculum_nav_item', instanceKey: 'fourierTransformSeminar', subject: 'analysis' },
                            { label: 'Halo Soup & Cosmology', typeKey: 'curriculum_nav_item', instanceKey: 'haloSoupSeminar', subject: 'analysis' },
                            { label: 'Holographic Principle & Boundary Codings', typeKey: 'curriculum_nav_item', instanceKey: 'holographicPrincipleSeminar', subject: 'physics' },
                            { label: 'Higher Successors & Transfinite Hierarchies', typeKey: 'curriculum_nav_item', instanceKey: 'higherSuccessorsSeminar', subject: 'numbers_trees' },
                            { label: 'Cosmology as Information', typeKey: 'curriculum_nav_item', instanceKey: 'cosmologyAsInformation', subject: 'information' }
                        ]
                    },
                    {
                        label: 'Satellite Masterclasses',
                        subject: 'physics',
                        children: [
                            { label: 'Particle Zoo Logic', typeKey: 'curriculum_nav_item', instanceKey: 'particleZooSeminar', subject: 'physics' },
                            { label: 'Quantum Entanglement & Tensor Networks', typeKey: 'curriculum_nav_item', instanceKey: 'quantumEntanglementSeminar', subject: 'information' },
                            { label: 'Algebraic Geometry on Dyadic Rings', typeKey: 'curriculum_nav_item', instanceKey: 'algebraicGeometrySeminar', subject: 'numbers_trees' }
                        ]
                    }
                ]
            },
            {
                label: 'Research & Proposals',
                subject: 'all',
                children: [
                    { label: 'Lean 4 General Education Curriculum', typeKey: 'curriculum_nav_item', instanceKey: 'lean4GenEdProposal', subject: 'all' },
                    { label: 'Dual-Agent Academic Pair Programming', typeKey: 'curriculum_nav_item', instanceKey: 'dualAgentAcademicProposal', subject: 'all' },
                    { label: 'Minimal Axiomatic Core for General Science', typeKey: 'curriculum_nav_item', instanceKey: 'minimalAxiomaticCoreProposal', subject: 'all' }
                ]
            },
            { label: 'Browse All Index Entries', typeKey: 'curriculum_nav_item', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 2. Formal Axiomatic Statements (Tier 1: Declarative Statements & DE Rules)
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
                    { label: 'Hyperfinite Probability Space', typeKey: 'formal_statement', instanceKey: 'fs_hyperfinite_probability', subject: 'information' },
                    { label: 'Core Dyadic Isomorphism', typeKey: 'formal_statement', instanceKey: 'fs_dyadic_isomorphism', subject: 'numbers_trees' },
                    { label: 'van den Dries–Ehrlich Subfield', typeKey: 'formal_statement', instanceKey: 'fs_van_den_dries_ehrlich', subject: 'numbers_trees' },
                    { label: 'Browse All Axioms', typeKey: 'axiom', subject: 'all' }
                ]
            },
            {
                label: 'Theorems',
                typeKey: 'theorem',
                filterKind: { column: 'statement_kind', value: 'theorem' },
                children: [
                    { label: 'Newtonian Dynamics & Acceleration', typeKey: 'formal_statement', instanceKey: 'fs_newtonian_mechanics', subject: 'physics' },
                    { label: 'Telescoping FTC', typeKey: 'formal_statement', instanceKey: 'fs_telescoping_ftc', subject: 'analysis' },
                    { label: 'Cauchy-Riemann Coordinate Symmetry', typeKey: 'formal_statement', instanceKey: 'fs_cauchy_riemann_symmetry', subject: 'analysis' },
                    { label: 'Hyperfinite Cauchy-Goursat Loop Vanishing', typeKey: 'formal_statement', instanceKey: 'fs_contour_cauchy_goursat', subject: 'analysis' },
                    { label: 'Lee-Yang Unit Circle Partition', typeKey: 'formal_statement', instanceKey: 'fs_lee_yang_circle', subject: 'physics' },
                    { label: 'Total Ordering on Tree2', typeKey: 'formal_statement', instanceKey: 'fs_tree2_totally_ordered', subject: 'numbers_trees' },
                    { label: 'Standard Part Ring Homomorphism', typeKey: 'formal_statement', instanceKey: 'fs_standard_part_homomorphism', subject: 'analysis' },
                    { label: 'Discrete Cauchy-Schwarz Inequality', typeKey: 'formal_statement', instanceKey: 'fs_cauchy_schwarz_discrete', subject: 'algebra' },
                    { label: 'Browse All Theorems', typeKey: 'theorem', subject: 'all' }
                ]
            },
            {
                label: 'Directed Equalities',
                typeKey: 'directed_equality',
                filterKind: { column: 'statement_kind', value: 'directed_equality' },
                children: [
                    // Directed Equalities alphabetically sorted by unique friendly key (statement_key)
                    { label: 'fs_bayes_updating — Hyperfinite Bayesian Likelihood Inversion', typeKey: 'formal_statement', instanceKey: 'fs_bayes_updating', subject: 'information' },
                    { label: 'fs_complex_step_invariance — 2D Complex Step & Modulus Invariance', typeKey: 'formal_statement', instanceKey: 'fs_complex_step_invariance', subject: 'analysis' },
                    { label: 'fs_conway_addition — Conway Inductive Addition (+)', typeKey: 'formal_statement', instanceKey: 'fs_conway_addition', subject: 'numbers_trees' },
                    { label: 'fs_conway_multiplication — Conway Inductive Multiplication (·)', typeKey: 'formal_statement', instanceKey: 'fs_conway_multiplication', subject: 'numbers_trees' },
                    { label: 'fs_euler_identity_rotor — Euler Polar Rotor Decomposition', typeKey: 'formal_statement', instanceKey: 'fs_euler_identity_rotor', subject: 'analysis' },
                    { label: 'fs_free_fall_accel — Uniform Free Fall Kinematics', typeKey: 'formal_statement', instanceKey: 'fs_free_fall_accel', subject: 'physics' },
                    { label: 'fs_geometric_scale_step — Chromatic Scale Geometric Progression', typeKey: 'formal_statement', instanceKey: 'fs_geometric_scale_step', subject: 'algebra' },
                    { label: 'fs_harmonic_oscillator — Harmonic Leapfrog Phase Space Orbit', typeKey: 'formal_statement', instanceKey: 'fs_harmonic_oscillator', subject: 'physics' },
                    { label: 'fs_heat_flux — Discrete Thermal Diffusion Balance', typeKey: 'formal_statement', instanceKey: 'fs_heat_flux', subject: 'physics' },
                    { label: 'fs_hyperfinite_derivative — Hyperfinite Difference Quotient Derivative', typeKey: 'formal_statement', instanceKey: 'fs_hyperfinite_derivative', subject: 'analysis' },
                    { label: 'fs_polygonal_rim_chord — Dyadic Polygonal Rim Chord Law', typeKey: 'formal_statement', instanceKey: 'fs_polygonal_rim_chord', subject: 'analysis' },
                    { label: 'fs_pred_assign — Definitional Assignment (:=)', typeKey: 'formal_statement', instanceKey: 'fs_pred_assign', subject: 'logic' },
                    { label: 'fs_pred_div — Divisibility (DIV / ∣)', typeKey: 'formal_statement', instanceKey: 'fs_pred_div', subject: 'numbers_trees' },
                    { label: 'fs_pred_eq — Identity / Equality (EQ / =)', typeKey: 'formal_statement', instanceKey: 'fs_pred_eq', subject: 'logic' },
                    { label: 'fs_pred_even — Even Parity (EVEN)', typeKey: 'formal_statement', instanceKey: 'fs_pred_even', subject: 'numbers_trees' },
                    { label: 'fs_pred_gt — Greater-Than (GT / >)', typeKey: 'formal_statement', instanceKey: 'fs_pred_gt', subject: 'logic' },
                    { label: 'fs_pred_le — Less-Than-or-Equal (LE / ≤)', typeKey: 'formal_statement', instanceKey: 'fs_pred_le', subject: 'logic' },
                    { label: 'fs_pred_lt — Less-Than (LT / <)', typeKey: 'formal_statement', instanceKey: 'fs_pred_lt', subject: 'logic' },
                    { label: 'fs_pred_mem — Set Membership (MEM / ∈)', typeKey: 'formal_statement', instanceKey: 'fs_pred_mem', subject: 'logic' },
                    { label: 'fs_pred_near — Infinitesimal Proximity (NEAR / ≈)', typeKey: 'formal_statement', instanceKey: 'fs_pred_near', subject: 'analysis' },
                    { label: 'fs_pred_odd — Odd Parity (ODD)', typeKey: 'formal_statement', instanceKey: 'fs_pred_odd', subject: 'numbers_trees' },
                    { label: 'fs_pred_subset — Subset Inclusion (SUBSET / ⊆)', typeKey: 'formal_statement', instanceKey: 'fs_pred_subset', subject: 'logic' },
                    { label: 'fs_pred_succ — Successor Step (SUCC / +1)', typeKey: 'formal_statement', instanceKey: 'fs_pred_succ', subject: 'numbers_trees' },
                    { label: 'fs_ptolemaic_half_angle — Dyadic Ptolemaic Half-Angle Root Bisection', typeKey: 'formal_statement', instanceKey: 'fs_ptolemaic_half_angle', subject: 'analysis' },
                    { label: 'fs_three_polarizer_quantum — Three-Polarizer Geometric Transmission', typeKey: 'formal_statement', instanceKey: 'fs_three_polarizer_quantum', subject: 'physics' },
                    { label: 'fs_unit_rotor_projection — Unit Rotor Sine & Cosine Projection', typeKey: 'formal_statement', instanceKey: 'fs_unit_rotor_projection', subject: 'analysis' },
                    { label: 'fs_work_energy — Telescoping Work-Energy Principle', typeKey: 'formal_statement', instanceKey: 'fs_work_energy', subject: 'physics' },
                    { label: 'Browse All Directed Equalities', typeKey: 'directed_equality', subject: 'all' }
                ]
            },
            { label: 'Browse All Formal Statements', typeKey: 'formal_statement', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 3. Demo Initializations (Tier 2: Interactive Sandbox Demos & Presets)
    // -------------------------------------------------------------------------
    {
        label: 'Demo Initializations',
        icon: '🎛️',
        typeKey: 'demo_initializations',
        children: [
            {
                label: 'Truth Table Demo (TTD)',
                typeKey: 'ttd',
                subject: 'logic',
                children: [
                    { label: "De Morgan's First Law", typeKey: 'ttd', instanceId: 2, subject: 'logic' },
                    { label: 'Modus Ponens (Detachment)', typeKey: 'ttd', instanceId: 3, subject: 'logic' },
                    { label: 'Law of Excluded Middle', typeKey: 'ttd', instanceId: 4, subject: 'logic' },
                    { label: 'Principle of Non-Contradiction', typeKey: 'ttd', instanceId: 5, subject: 'logic' },
                    { label: 'Material Implication (→)', typeKey: 'ttd', instanceId: 6, subject: 'logic' },
                    { label: 'Material Equivalence (↔)', typeKey: 'ttd', instanceId: 7, subject: 'logic' },
                    { label: 'Hypothetical Syllogism', typeKey: 'ttd', instanceId: 8, subject: 'logic' },
                    { label: 'Browse All TTD Initializations', typeKey: 'ttd', subject: 'logic' }
                ]
            },
            {
                label: 'Binary Tree Demo (BTD)',
                typeKey: 'btd',
                subject: 'numbers_trees',
                children: [
                    { label: 'Surreal Tree Total Order', typeKey: 'btd', instanceId: 9, subject: 'numbers_trees' },
                    { label: 'Conway Inductive Addition (+)', typeKey: 'btd', instanceId: 10, subject: 'numbers_trees' },
                    { label: 'Conway Inductive Multiplication (·)', typeKey: 'btd', instanceId: 11, subject: 'numbers_trees' },
                    { label: 'Labeled Dyadic Sequences', typeKey: 'btd', instanceId: 12, subject: 'numbers_trees' },
                    { label: 'Browse All BTD Initializations', typeKey: 'btd', subject: 'numbers_trees' }
                ]
            },
            {
                label: 'Binary Interval Demo (BID)',
                typeKey: 'bid',
                subject: 'analysis',
                children: [
                    { label: 'Dyadic Interval Subdivision', typeKey: 'bid', instanceId: 13, subject: 'analysis' },
                    { label: 'Unit Rotor Circle Projection', typeKey: 'bid', instanceId: 14, subject: 'analysis' },
                    { label: 'Browse All BID Initializations', typeKey: 'bid', subject: 'analysis' }
                ]
            },
            {
                label: 'Formal Statements Demo (FSD)',
                typeKey: 'fsd',
                subject: 'all',
                children: [
                    { label: 'Formal Structure Stage Visualizer', typeKey: 'fsd', instanceId: 15, subject: 'all' },
                    { label: 'Browse All FSD Initializations', typeKey: 'fsd', subject: 'all' }
                ]
            },
            { label: 'Browse All Demo Initializations', typeKey: 'interactive_demos', subject: 'all' }
        ]
    }
];

/**
 * Filter the single canonical navigation tree by subject domain and CRUD mode.
 * - If mode is 'create':
 *     Entity type nodes (such as TTD, BTD, Axioms, Theorems) have their instance children pruned,
 *     so they appear directly without submenus and clicking them immediately launches the initialized creation form.
 * - If mode is 'read', 'update', or 'delete':
 *     Entity type nodes retain their instance children so the user can inspect, update, or delete existing records.
 */
export function getFilteredMenuTree(subject: string = 'all', mode: string = 'read'): MenuItem[] {
    const isCreate = mode === 'create';

    function matchesSubjectFilter(itemSubject?: string): boolean {
        if (!subject || subject === 'all') return true;
        if (!itemSubject || itemSubject === 'all') return true;
        return itemSubject === subject;
    }

    function filterItem(item: MenuItem): MenuItem | null {
        // If the item has an explicit subject that does not match the active filter, prune it
        if (!matchesSubjectFilter(item.subject)) {
            return null;
        }

        // In Create mode, prune any direct instance items (records with instanceKey or instanceId or "Browse All")
        if (isCreate && (item.instanceKey !== undefined || item.instanceId !== undefined || item.label.startsWith('Browse All'))) {
            return null;
        }

        // If an item has children:
        if (item.children && item.children.length > 0) {
            // In Create mode, if this item represents a concrete creatable entity type
            // (e.g. typeKey is 'ttd', 'btd', 'bid', 'fsd', 'axiom', 'theorem', 'directed_equality', 'curriculum_nav_item'):
            // prune its children so it becomes a terminal leaf that directly launches creation!
            if (isCreate && item.typeKey && item.typeKey !== 'demo_initializations' && item.typeKey !== 'formal_statement') {
                return {
                    ...item,
                    children: []
                };
            }

            // Otherwise, recursively filter children
            const filteredChildren = item.children
                .map(filterItem)
                .filter((c): c is MenuItem => c !== null);

            if (filteredChildren.length > 0) {
                return {
                    ...item,
                    children: filteredChildren
                };
            }

            return null;
        }

        // Leaf item
        return item;
    }

    return navigationMenuTree
        .map(filterItem)
        .filter((c): c is MenuItem => c !== null);
}

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
            item.subject ? `data-subject="${item.subject}"` : '',
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

/**
 * Dynamically synchronizes instance children in navigationMenuTree directly from the PostgreSQL database.
 */
export async function syncMenuTreeFromDatabase(queryFn: <T = any>(sql: string, params?: any[]) => Promise<T[]>): Promise<void> {
    try {
        // 1. Fetch live interactive demos
        const demos = await queryFn<any>('SELECT id, engine, mode, title FROM interactive_demos ORDER BY id ASC;');
        if (demos && demos.length > 0) {
            const demoInitializationsNode = navigationMenuTree.find((n) => n.typeKey === 'demo_initializations');
            if (demoInitializationsNode && demoInitializationsNode.children) {
                const engineSubjectMap: Record<string, string> = {
                    ttd: 'logic',
                    btd: 'numbers_trees',
                    bid: 'analysis',
                    fsd: 'all'
                };
                for (const engine of ['ttd', 'btd', 'bid', 'fsd']) {
                    const engineNode = demoInitializationsNode.children.find((c) => c.typeKey === engine);
                    if (engineNode) {
                        const engineDemos = demos.filter((d) => d.engine === engine);
                        const subj = engineSubjectMap[engine] || 'all';
                        engineNode.children = [
                            ...engineDemos.map((d) => ({
                                label: d.title || `Demo #${d.id}`,
                                typeKey: engine,
                                instanceId: Number(d.id),
                                subject: subj
                            })),
                            {
                                label: `Browse All ${engine.toUpperCase()} Initializations`,
                                typeKey: engine,
                                subject: subj
                            }
                        ];
                    }
                }
            }
        }

        // 2. Fetch live formal statements
        // 2. Fetch live formal statements sorted by unique friendly key (statement_key)
        const stmts = await queryFn<any>('SELECT id, statement_key, title, statement_kind, domain_category FROM formal_statements ORDER BY statement_key ASC;');
        if (stmts && stmts.length > 0) {
            const fsNode = navigationMenuTree.find((n) => n.typeKey === 'formal_statement');
            if (fsNode && fsNode.children) {
                for (const kind of ['axiom', 'theorem', 'directed_equality']) {
                    const kindNode = fsNode.children.find((c) => c.typeKey === kind);
                    if (kindNode) {
                        const kindStmts = stmts.filter((s) => s.statement_kind === kind);
                        // Ensure strict alphabetical sorting by unique friendly key
                        kindStmts.sort((a, b) => (a.statement_key || '').localeCompare(b.statement_key || ''));
                        kindNode.children = [
                            ...kindStmts.map((s) => {
                                let subj = 'all';
                                const dc = s.domain_category || '';
                                if (dc.includes('logic') || dc.includes('order')) subj = 'logic';
                                else if (dc.includes('tree') || dc.includes('arithmetic')) subj = 'numbers_trees';
                                else if (dc.includes('algebra') || dc.includes('vector') || dc.includes('sequence') || s.statement_key === 'fs_geometric_scale_step') subj = 'algebra';
                                else if (dc.includes('analysis') || dc.includes('trig') || dc.includes('rotor')) subj = 'analysis';
                                else if (dc.includes('physic') || dc.includes('kinematic')) subj = 'physics';
                                else if (dc.includes('bayes') || dc.includes('quantum') || dc.includes('info')) subj = 'information';

                                const key = s.statement_key || `fs_${s.id}`;
                                const displayLabel = s.title ? `${key} — ${s.title}` : key;

                                return {
                                    label: displayLabel,
                                    typeKey: 'formal_statement',
                                    instanceKey: s.statement_key,
                                    subject: subj
                                };
                            }),
                            {
                                label: `Browse All ${kind === 'directed_equality' ? 'Directed Equalities' : kind.charAt(0).toUpperCase() + kind.slice(1) + 's'}`,
                                typeKey: kind,
                                subject: 'all'
                            }
                        ];
                    }
                }
            }
        }
    } catch (err) {
        console.warn('[syncMenuTreeFromDatabase] Could not sync menu tree from live database:', err);
    }
}
