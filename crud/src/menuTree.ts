// crud/src/menuTree.ts
// Hierarchical Navigation Tree specification for Middle Way Mathematics CRUD Studio.
// Organizes curriculum index entries, lecture segments, computational stencils, formal statements,
// pseudocode algorithms, interactive demo initializations, and Lean formal declarations,
// with first-class Subject Domain tagging & filtering.

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

export function inferSubject(text?: string, key?: string, category?: string): string {
    const s = `${text || ''} ${key || ''} ${category || ''}`.toLowerCase();
    if (s.includes('logic') || s.includes('prop') || s.includes('truth table') || s.includes('ttd') || s.includes('boolean')) return 'logic';
    if (s.includes('tree') || s.includes('btd') || s.includes('number') || s.includes('conway') || s.includes('surreal') || s.includes('arithmetic') || s.includes('dyadic')) return 'numbers_trees';
    if (s.includes('algebra') || s.includes('vector') || s.includes('linear') || s.includes('matrix') || s.includes('field') || s.includes('group') || s.includes('sequence')) return 'algebra';
    if (s.includes('analysis') || s.includes('calculus') || s.includes('infinitesimal') || s.includes('derivative') || s.includes('integral') || s.includes('bid') || s.includes('trig') || s.includes('rotor') || s.includes('complex')) return 'analysis';
    if (s.includes('physic') || s.includes('kinematic') || s.includes('force') || s.includes('energy') || s.includes('oscillator') || s.includes('heat') || s.includes('wave')) return 'physics';
    if (s.includes('bayes') || s.includes('probability') || s.includes('quantum') || s.includes('entropy') || s.includes('information')) return 'information';
    return 'all';
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
                subject: 'logic',
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
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'vectorFoundationsIntro', subject: 'algebra' },
                    { label: 'Sequences & Progressions', typeKey: 'curriculum_nav_item', instanceKey: 'sequencesAndSums', subject: 'algebra' },
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
                label: 'Level 3: Infinitesimal Analysis',
                subject: 'analysis',
                children: [
                    { label: 'Overview', typeKey: 'curriculum_nav_item', instanceKey: 'lamOverview', subject: 'analysis' },
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
                label: 'Level 4: Space, Trigonometry & The Transcendental Engine',
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
                subject: 'physics',
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
    // 2. Lecture Segments (The Core Modular Chapters)
    // -------------------------------------------------------------------------
    {
        label: 'Lecture Segments',
        icon: '📖',
        typeKey: 'segments',
        children: [
            { label: 'Browse All Lecture Segments', typeKey: 'segments', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 3. Computational Stencils (Directed Equations, Slots & Presets)
    // -------------------------------------------------------------------------
    {
        label: 'Computational Stencils',
        icon: '📐',
        typeKey: 'directed_equations',
        children: [
            {
                label: 'Equations & Stencils',
                typeKey: 'directed_equations',
                subject: 'all',
                children: [
                    { label: 'Browse All Stencils', typeKey: 'directed_equations', subject: 'all' }
                ]
            },
            { label: 'Browse All Calculation Mode Slots', typeKey: 'mode_slots', subject: 'all' },
            { label: 'Browse All Stencil Presets', typeKey: 'stencil_presets', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 4. Formal Axiomatic Statements (Axioms, Theorems, Directed Equalities)
    // -------------------------------------------------------------------------
    {
        label: 'Formal Statements',
        icon: '🏛️',
        typeKey: 'formal_statement',
        children: [
            {
                label: 'Axioms',
                typeKey: 'axiom',
                filterKind: { column: 'statement_kind', value: 'axiom' },
                children: [
                    { label: 'Browse All Axioms', typeKey: 'axiom', subject: 'all' }
                ]
            },
            {
                label: 'Theorems',
                typeKey: 'theorem',
                filterKind: { column: 'statement_kind', value: 'theorem' },
                children: [
                    { label: 'Browse All Theorems', typeKey: 'theorem', subject: 'all' }
                ]
            },
            {
                label: 'Directed Equalities',
                typeKey: 'directed_equality',
                filterKind: { column: 'statement_kind', value: 'directed_equality' },
                children: [
                    { label: 'Browse All Directed Equalities', typeKey: 'directed_equality', subject: 'all' }
                ]
            },
            { label: 'Browse All Formal Statements', typeKey: 'formal_statement', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 5. Pseudocode Algorithms (Operations, Primitives & Procedures)
    // -------------------------------------------------------------------------
    {
        label: 'Pseudocode Algorithms',
        icon: '💻',
        typeKey: 'pseudocode_algorithms',
        children: [
            { label: 'Browse All Algorithms', typeKey: 'pseudocode_algorithms', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 6. Demo Initializations (Interactive Sandbox Demos & Presets)
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
                    { label: 'Browse All TTD Initializations', typeKey: 'ttd', subject: 'logic' }
                ]
            },
            {
                label: 'Binary Tree Demo (BTD)',
                typeKey: 'btd',
                subject: 'numbers_trees',
                children: [
                    { label: 'Browse All BTD Initializations', typeKey: 'btd', subject: 'numbers_trees' }
                ]
            },
            {
                label: 'Binary Interval Demo (BID)',
                typeKey: 'bid',
                subject: 'analysis',
                children: [
                    { label: 'Browse All BID Initializations', typeKey: 'bid', subject: 'analysis' }
                ]
            },
            {
                label: 'Formal Statements Demo (FSD)',
                typeKey: 'fsd',
                subject: 'all',
                children: [
                    { label: 'Browse All FSD Initializations', typeKey: 'fsd', subject: 'all' }
                ]
            },
            { label: 'Browse All Demo Initializations', typeKey: 'interactive_demos', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 7. Lean 4 Formal Declarations & Verifications
    // -------------------------------------------------------------------------
    {
        label: 'Lean Declarations',
        icon: '📜',
        typeKey: 'lean_declarations',
        children: [
            {
                label: 'Inductive Types',
                typeKey: 'lean_declarations',
                subject: 'all',
                filterKind: { column: 'kind', value: 'inductive' },
                children: [
                    { label: 'Browse Inductive Types', typeKey: 'lean_declarations', subject: 'all' }
                ]
            },
            {
                label: 'Definitions',
                typeKey: 'lean_declarations',
                subject: 'all',
                filterKind: { column: 'kind', value: 'def' },
                children: [
                    { label: 'Browse Definitions', typeKey: 'lean_declarations', subject: 'all' }
                ]
            },
            {
                label: 'Theorems',
                typeKey: 'lean_declarations',
                subject: 'all',
                filterKind: { column: 'kind', value: 'theorem' },
                children: [
                    { label: 'Browse Theorems', typeKey: 'lean_declarations', subject: 'all' }
                ]
            },
            {
                label: 'Structures',
                typeKey: 'lean_declarations',
                subject: 'all',
                filterKind: { column: 'kind', value: 'structure' },
                children: [
                    { label: 'Browse Structures', typeKey: 'lean_declarations', subject: 'all' }
                ]
            },
            { label: 'Browse All Lean Declarations', typeKey: 'lean_declarations', subject: 'all' },
            { label: 'Browse Lean Kernel Verifications', typeKey: 'lean_verifications', subject: 'all' }
        ]
    },

    // -------------------------------------------------------------------------
    // 8. Mathematical & Physical Domains
    // -------------------------------------------------------------------------
    {
        label: 'Domains & Curricula',
        icon: '🌐',
        typeKey: 'domains',
        children: [
            { label: 'Browse All Domains', typeKey: 'domains', subject: 'all' },
            { label: 'Browse Curriculum Applications', typeKey: 'apps', subject: 'all' }
        ]
    }
];

/**
 * Filter the single canonical navigation tree by subject domain and CRUD mode.
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

        // In Create mode, prune direct instance items
        if (isCreate && (item.instanceKey !== undefined || item.instanceId !== undefined || item.label.startsWith('Browse All'))) {
            return null;
        }

        // If an item has children:
        if (item.children && item.children.length > 0) {
            // In Create mode, if this item represents a concrete creatable entity type:
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
        // ---------------------------------------------------------------------
        // 1. Sync Curriculum Outline Index Entries (curriculum_nav_items + segments)
        // ---------------------------------------------------------------------
        const navRows = await queryFn<any>(`
            SELECT c.id, c.nav_key, c.parent_id, c.sequence_order, c.item_type, c.topic, c.nav_topic, c.segment_id,
                   s.seg_key, s.title as seg_title
            FROM curriculum_nav_items c
            LEFT JOIN segments s ON c.segment_id = s.id
            ORDER BY c.parent_id NULLS FIRST, c.sequence_order ASC, c.id ASC;
        `);

        if (navRows && navRows.length > 0) {
            const navIndexNode = navigationMenuTree.find((n) => n.typeKey === 'curriculum_nav_item');
            if (navIndexNode) {
                const byParent = new Map<string, any[]>();
                for (const r of navRows) {
                    const p = r.parent_id ? String(r.parent_id) : 'root';
                    if (!byParent.has(p)) byParent.set(p, []);
                    byParent.get(p)!.push(r);
                }

                function buildNavChildren(parentId: string): MenuItem[] {
                    const children = byParent.get(parentId) || [];
                    return children.map((c) => {
                        const subChildren = buildNavChildren(String(c.id));
                        const subj = inferSubject(c.topic, c.seg_key || c.nav_key);
                        const hasSubs = subChildren.length > 0;

                        const label = c.topic || c.nav_topic || `Item #${c.id}`;

                        const node: MenuItem = {
                            label: label,
                            typeKey: 'curriculum_nav_item',
                            subject: subj,
                        };

                        if (hasSubs) {
                            node.children = subChildren;
                        } else {
                            node.instanceId = Number(c.id);
                            if (c.seg_key) node.instanceKey = c.seg_key;
                            else if (c.nav_key) node.instanceKey = c.nav_key;
                        }
                        return node;
                    });
                }

                navIndexNode.children = [
                    ...buildNavChildren('root').filter((n) => n.label !== 'title'),
                    { label: 'Browse All Index Entries', typeKey: 'curriculum_nav_item', subject: 'all' }
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 2. Sync Lecture Segments (segments)
        // ---------------------------------------------------------------------
        const segRows = await queryFn<any>(`
            SELECT id, seg_key, title, sequence_order, slug FROM segments ORDER BY sequence_order ASC, id ASC;
        `);
        if (segRows && segRows.length > 0) {
            const segNode = navigationMenuTree.find((n) => n.typeKey === 'segments');
            if (segNode) {
                segNode.children = [
                    ...segRows.map((s) => ({
                        label: s.title ? `${s.sequence_order}. ${s.title}` : (s.slug || s.seg_key || `Segment #${s.id}`),
                        typeKey: 'segments',
                        instanceId: Number(s.id),
                        instanceKey: s.seg_key || s.slug,
                        subject: inferSubject(s.title, s.seg_key)
                    })),
                    { label: 'Browse All Lecture Segments', typeKey: 'segments', subject: 'all' }
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 3. Sync Computational Stencils (directed_equations)
        // ---------------------------------------------------------------------
        const eqRows = await queryFn<any>(`SELECT id, equation_key, title, label FROM directed_equations ORDER BY id ASC;`);
        if (eqRows && eqRows.length > 0) {
            const stencilsNode = navigationMenuTree.find((n) => n.typeKey === 'directed_equations');
            if (stencilsNode && stencilsNode.children) {
                const subEquationNode = stencilsNode.children.find((c) => c.typeKey === 'directed_equations');
                if (subEquationNode) {
                    subEquationNode.children = [
                        ...eqRows.map((e) => ({
                            label: e.title ? `${e.equation_key} — ${e.title}` : e.equation_key,
                            typeKey: 'directed_equations',
                            instanceId: Number(e.id),
                            instanceKey: e.equation_key,
                            subject: inferSubject(e.title, e.equation_key)
                        })),
                        { label: 'Browse All Stencils', typeKey: 'directed_equations', subject: 'all' }
                    ];
                }
            }
        }

        // ---------------------------------------------------------------------
        // 4. Sync Formal Statements (formal_statements)
        // ---------------------------------------------------------------------
        const stmts = await queryFn<any>('SELECT id, statement_key, title, statement_kind, domain_category FROM formal_statements ORDER BY statement_key ASC;');
        if (stmts && stmts.length > 0) {
            const fsNode = navigationMenuTree.find((n) => n.typeKey === 'formal_statement');
            if (fsNode && fsNode.children) {
                for (const kind of ['axiom', 'theorem', 'directed_equality']) {
                    const kindNode = fsNode.children.find((c) => c.typeKey === kind);
                    if (kindNode) {
                        const kindStmts = stmts.filter((s) => s.statement_kind === kind);
                        kindStmts.sort((a, b) => (a.statement_key || '').localeCompare(b.statement_key || ''));
                        kindNode.children = [
                            ...kindStmts.map((s) => {
                                const subj = inferSubject(s.title, s.statement_key, s.domain_category);
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

        // ---------------------------------------------------------------------
        // 5. Sync Pseudocode Algorithms (pseudocode_algorithms)
        // ---------------------------------------------------------------------
        const algoRows = await queryFn<any>('SELECT id, algo_key, name, category, algo_kind FROM pseudocode_algorithms ORDER BY algo_key ASC;');
        if (algoRows && algoRows.length > 0) {
            const algoNode = navigationMenuTree.find((n) => n.typeKey === 'pseudocode_algorithms');
            if (algoNode) {
                const algoCategories = Array.from(new Set(algoRows.map((a) => a.category || 'general')));
                algoNode.children = [
                    ...algoCategories.map((cat) => {
                        const inCat = algoRows.filter((a) => (a.category || 'general') === cat);
                        return {
                            label: cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' '),
                            typeKey: 'pseudocode_algorithms',
                            subject: inferSubject(cat),
                            children: [
                                ...inCat.map((a) => ({
                                    label: a.name ? `${a.algo_key} — ${a.name}` : a.algo_key,
                                    typeKey: 'pseudocode_algorithms',
                                    instanceId: Number(a.id),
                                    instanceKey: a.algo_key,
                                    subject: inferSubject(a.name, a.algo_key, a.category)
                                })),
                                { label: `Browse All ${cat} Algorithms`, typeKey: 'pseudocode_algorithms', subject: inferSubject(cat) }
                            ]
                        };
                    }),
                    { label: 'Browse All Algorithms', typeKey: 'pseudocode_algorithms', subject: 'all' }
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 6. Sync Interactive Demos (interactive_demos)
        // ---------------------------------------------------------------------
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

        // ---------------------------------------------------------------------
        // 7. Sync Lean Declarations (lean_declarations)
        // ---------------------------------------------------------------------
        const declRows = await queryFn<any>('SELECT id, name, kind, decl_key FROM lean_declarations ORDER BY name ASC;');
        if (declRows && declRows.length > 0) {
            const leanNode = navigationMenuTree.find((n) => n.typeKey === 'lean_declarations');
            if (leanNode && leanNode.children) {
                for (const k of ['inductive', 'def', 'theorem', 'structure']) {
                    const kNode = leanNode.children.find((c) => c.filterKind?.value === k);
                    if (kNode) {
                        const inKind = declRows.filter((d) => d.kind === k);
                        kNode.children = [
                            ...inKind.slice(0, 30).map((d) => ({
                                label: d.name,
                                typeKey: 'lean_declarations',
                                instanceId: Number(d.id),
                                instanceKey: d.decl_key || d.name,
                                subject: 'all'
                            })),
                            { label: `Browse All ${k.charAt(0).toUpperCase() + k.slice(1)} Declarations (${inKind.length})`, typeKey: 'lean_declarations', subject: 'all' }
                        ];
                    }
                }
            }
        }

        // ---------------------------------------------------------------------
        // 8. Sync Domains (domains)
        // ---------------------------------------------------------------------
        const domainRows = await queryFn<any>('SELECT id, domain_key, name, symbol FROM domains ORDER BY domain_key ASC;');
        if (domainRows && domainRows.length > 0) {
            const domainNode = navigationMenuTree.find((n) => n.typeKey === 'domains');
            if (domainNode) {
                domainNode.children = [
                    ...domainRows.map((d) => ({
                        label: `${d.symbol ? `[${d.symbol}] ` : ''}${d.name || d.domain_key}`,
                        typeKey: 'domains',
                        instanceId: Number(d.id),
                        instanceKey: d.domain_key,
                        subject: inferSubject(d.name, d.domain_key)
                    })),
                    { label: 'Browse All Domains', typeKey: 'domains', subject: 'all' },
                    { label: 'Browse Curriculum Applications', typeKey: 'apps', subject: 'all' }
                ];
            }
        }

    } catch (err) {
        console.warn('[syncMenuTreeFromDatabase] Could not sync menu tree from live database:', err);
    }
}
