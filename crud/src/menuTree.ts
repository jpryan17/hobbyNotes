// crud/src/menuTree.ts
// Two-Index Navigation Architecture for Middle Way Mathematics CRUD Studio.
// 1. Curriculum Index: The Course Outline & Lecture Segments Hierarchy
// 2. Custom Element Instruments: Reusable Catalogs of FSD, Presets, BTD, and BID

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
    // =========================================================================
    // INDEX 1: CURRICULUM ARCHITECTURE (Course Tree & Lecture Segments)
    // =========================================================================
    {
        label: 'Curriculum Index',
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
            { label: 'Browse All Index Entries', typeKey: 'curriculum_nav_item', subject: 'all' },
            { label: 'Browse All Lecture Segments', typeKey: 'segments', subject: 'all' }
        ]
    },

    // =========================================================================
    // INDEX 2: CUSTOM ELEMENT INSTRUMENTS (Reusable Component Catalog)
    // =========================================================================
    {
        label: 'Custom Element Instruments',
        icon: '🔬',
        typeKey: 'custom_elements',
        children: [
            // -----------------------------------------------------------------
            // Sub-Index 1: Formal Statements & Scaffolds (FSD)
            // -----------------------------------------------------------------
            {
                label: 'Formal Statements & Scaffolds (FSD)',
                icon: '📜',
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
                        label: 'Directed Equalities (DE)',
                        typeKey: 'directed_equality',
                        filterKind: { column: 'statement_kind', value: 'directed_equality' },
                        children: [
                            { label: 'Browse Mode Slots', typeKey: 'mode_slots', subject: 'all' },
                            { label: 'Browse Stencil Presets', typeKey: 'stencil_presets', subject: 'all' },
                            { label: 'Browse Pseudocode Algorithms', typeKey: 'pseudocode_algorithms', subject: 'all' },
                            { label: 'Browse All Directed Equalities', typeKey: 'directed_equality', subject: 'all' }
                        ]
                    },
                    { label: 'Browse All Formal Statements', typeKey: 'formal_statement', subject: 'all' },
                    { label: 'Browse Registered FSD Scaffolds', typeKey: 'fsd', subject: 'all' }
                ]
            },

            // -----------------------------------------------------------------
            // Sub-Index 2: Stencil Input Default Presets (Preset)
            // -----------------------------------------------------------------
            {
                label: 'Stencil Input Default Presets (Preset)',
                icon: '🎛️',
                typeKey: 'stencil_presets',
                subject: 'all',
                children: [
                    { label: 'Browse All Stencil Presets', typeKey: 'stencil_presets', subject: 'all' }
                ]
            },

            // -----------------------------------------------------------------
            // Sub-Index 3: Conway Binary Tree Instruments (BTD)
            // -----------------------------------------------------------------
            {
                label: 'Binary Tree Instruments (BTD)',
                icon: '🌲',
                typeKey: 'btd',
                subject: 'numbers_trees',
                children: [
                    { label: 'Browse All BTD Instruments', typeKey: 'btd', subject: 'numbers_trees' }
                ]
            },

            // -----------------------------------------------------------------
            // Sub-Index 4: Binary Interval Instruments (BID)
            // -----------------------------------------------------------------
            {
                label: 'Binary Interval Instruments (BID)',
                icon: '🔢',
                typeKey: 'bid',
                subject: 'analysis',
                children: [
                    { label: 'Browse All BID Instruments', typeKey: 'bid', subject: 'analysis' }
                ]
            },

            // -----------------------------------------------------------------
            // Sub-Index 5: Proposition Truth Tables (TTD)
            // -----------------------------------------------------------------
            {
                label: 'Proposition Truth Tables (TTD)',
                icon: '⚖️',
                typeKey: 'ttd',
                subject: 'logic',
                children: [
                    { label: 'Browse All TTD Propositions', typeKey: 'ttd', subject: 'logic' }
                ]
            },

            { label: 'Browse All Registered Custom Elements', typeKey: 'custom_elements', subject: 'all' }
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
            if (isCreate && item.typeKey && item.typeKey !== 'custom_elements' && item.typeKey !== 'formal_statement') {
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
        // 1. Sync Index 1: Curriculum Outline (curriculum_nav_items + segments)
        // ---------------------------------------------------------------------
        const navRows = await queryFn<any>(`
            SELECT c.id, c.nav_key, c.parent_id, c.sequence_order, c.item_type, c.topic, c.nav_topic, c.segment_id,
                   s.seg_key, s.title as seg_title
            FROM curriculum_nav_items c
            LEFT JOIN segments s ON c.segment_id = s.id
            ORDER BY c.parent_id NULLS FIRST, c.sequence_order ASC, c.id ASC;
        `);

        if (navRows && navRows.length > 0) {
            const navIndexNode = navigationMenuTree.find((n) => n.typeKey === 'curriculum_nav_item' || n.label === 'Curriculum Index');
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
                    { label: 'Browse All Index Entries', typeKey: 'curriculum_nav_item', subject: 'all' },
                    { label: 'Browse All Lecture Segments', typeKey: 'segments', subject: 'all' }
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 2. Sync Index 2: Custom Element Instruments
        // ---------------------------------------------------------------------
        const customElementsNode = navigationMenuTree.find((n) => n.typeKey === 'custom_elements');
        if (customElementsNode && customElementsNode.children) {

            // 2a. Sync Formal Statements (FSD)
            const stmts = await queryFn<any>('SELECT id, statement_key, title, statement_kind, domain_category FROM formal_statements ORDER BY statement_key ASC;');
            const fsTopNode = customElementsNode.children.find((c) => c.typeKey === 'formal_statement');
            if (stmts && stmts.length > 0 && fsTopNode && fsTopNode.children) {
                for (const kind of ['axiom', 'theorem', 'directed_equality']) {
                    const kindNode = fsTopNode.children.find((c) => c.typeKey === kind);
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

            // 2b. Sync Stencil Presets
            const presetRows = await queryFn<any>('SELECT id, preset_key, title, statement_id FROM stencil_presets ORDER BY id ASC;');
            const presetNode = customElementsNode.children.find((c) => c.typeKey === 'stencil_presets');
            if (presetRows && presetRows.length > 0 && presetNode) {
                presetNode.children = [
                    ...presetRows.map((p) => ({
                        label: p.title || p.preset_key || `Preset #${p.id}`,
                        typeKey: 'stencil_presets',
                        instanceId: Number(p.id),
                        instanceKey: p.preset_key,
                        subject: inferSubject(p.title, p.preset_key)
                    })),
                    { label: 'Browse All Stencil Presets', typeKey: 'stencil_presets', subject: 'all' }
                ];
            }

            // 2c. Sync Custom Elements (BTD, BID, TTD, FSD)
            const demoRows = await queryFn<any>('SELECT id, engine, mode, title FROM custom_elements ORDER BY id ASC;');
            if (demoRows && demoRows.length > 0) {
                for (const eng of ['btd', 'bid', 'ttd', 'fsd']) {
                    let targetNode = customElementsNode.children.find((c) => c.typeKey === eng);
                    if (!targetNode && eng === 'fsd' && fsTopNode && fsTopNode.children) {
                        targetNode = fsTopNode.children.find((c) => c.typeKey === 'fsd');
                    }
                    if (targetNode) {
                        const inEng = demoRows.filter((d) => d.engine === eng);
                        targetNode.children = [
                            ...inEng.map((d) => ({
                                label: d.title || `${eng.toUpperCase()} #${d.id}`,
                                typeKey: eng,
                                instanceId: Number(d.id),
                                subject: eng === 'ttd' ? 'logic' : (eng === 'btd' ? 'numbers_trees' : (eng === 'bid' ? 'analysis' : 'all'))
                            })),
                            { label: `Browse All ${eng.toUpperCase()} Instruments`, typeKey: eng, subject: 'all' }
                        ];
                    }
                }
            }
        }

    } catch (err) {
        console.warn('[syncMenuTreeFromDatabase] Could not sync menu tree from live database:', err);
    }
}
