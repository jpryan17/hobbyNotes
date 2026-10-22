// crud/src/crudConfig.ts
// Metadata specification for Middle Way Mathematics relational tables.

import { TableConfig, Dependent, TableNavigationPath } from './types';

export const tables: TableConfig[] = [
    // -------------------------------------------------------------------------
    // 1. Formal Axiomatic Statements & Proofs
    // -------------------------------------------------------------------------
    {
        table: 'formal_statements',
        label: 'Formal Statements & Axioms',
        singularLabel: 'Formal Statement',
        columns: [
            { column: 'statement_key', label: 'Unique Key', canModify: true, len: 32 },
            { column: 'scaffold_key', label: 'Scaffold Key', canModify: true, len: 32 },
            { column: 'title', label: 'Statement Title', canModify: true, len: 45 },
            { column: 'tier', label: 'Epistemic Tier (Role)', canModify: true, len: 20 },
            { column: 'type', label: 'Subject Type', canModify: true, len: 18 },
            { column: 'statement_kind', label: 'Syntactic Kind (Form)', canModify: true, len: 20 },
            { column: 'domain_category', label: 'Domain Category', canModify: true, len: 24 },
            { column: 'governing_seed', label: 'Governing Seed', canModify: true, len: 20 },
            { column: 'expression', label: 'Mathematical Expression', canModify: true, len: 60, rows: 2 },
            { column: 'description', label: 'Conceptual Summary', canModify: true, len: 60, rows: 3, useHints: true },
            { column: 'lean_signature', label: 'Lean 4 Signature', canModify: true, len: 60, rows: 2 },
            { column: 'lean_snippet', label: 'Lean Code Snippet', canModify: true, len: 60, rows: 4 },
            { column: 'lean_decl_id', label: 'Governing Lean Declaration', canModify: true, len: 28 },
            { column: 'status', label: 'Editorial Status', canModify: true, len: 16 }
        ]
    },
    {
        table: 'lean_declarations',
        label: 'Lean 4 Formal Declarations',
        singularLabel: 'Lean Declaration',
        columns: [
            { column: 'name', label: 'Declaration Name', canModify: true, len: 32 },
            { column: 'kind', label: 'Kind (inductive/def/theorem/structure)', canModify: true, len: 18 },
            { column: 'signature', label: 'Lean Signature', canModify: true, len: 60, rows: 2 },
            { column: 'doc_comment', label: 'Docstring / Commentary', canModify: true, len: 60, rows: 3 },
            { column: 'line_no', label: 'Line in Scaffold.lean', canModify: false, len: 10 },
            { column: 'qed_status', label: 'Q.E.D. Verified', canModify: true, len: 10 },
            { column: 'decl_key', label: 'Unique Identifier', canModify: true, len: 32 }
        ]
    },
    {
        table: 'domains',
        label: 'Mathematical & Physical Domains',
        singularLabel: 'Domain',
        columns: [
            { column: 'domain_key', label: 'Domain Key', canModify: true, len: 24 },
            { column: 'symbol', label: 'Mathematical Symbol', canModify: true, len: 16 },
            { column: 'name', label: 'Domain Name', canModify: true, len: 36 },
            { column: 'category', label: 'Domain Category', canModify: true, len: 20 },
            { column: 'lean_type', label: 'Lean 4 Type Name', canModify: true, len: 28 },
            { column: 'lean_decl_id', label: 'Grounded Lean Declaration', canModify: true, len: 28 },
            { column: 'base_unit', label: 'Physical Base Unit', canModify: true, len: 16 },
            { column: 'description', label: 'Domain Description', canModify: true, len: 60, rows: 3 }
        ]
    },
    {
        table: 'lean_verifications',
        label: 'Lean Kernel Verifications',
        singularLabel: 'Lean Verification',
        columns: [
            { column: 'statement_id', label: 'Governing Statement', canModify: false, len: 24 },
            { column: 'theorem_name', label: 'Lean Theorem Name', canModify: true, len: 32 },
            { column: 'proof_status', label: 'Proof Status', canModify: true, len: 20 },
            { column: 'elapsed_ms', label: 'Verification Elapsed (ms)', canModify: true, len: 12 },
            { column: 'lean_code', label: 'Verified Proof Code', canModify: true, len: 60, rows: 6 },
            { column: 'diagnostics', label: 'Compiler Output & Diagnostics', canModify: true, len: 60, rows: 4 }
        ]
    },

    // -------------------------------------------------------------------------
    // 2. Directed Equations, Slots, & Numerical Presets
    // -------------------------------------------------------------------------
    {
        table: 'directed_equations',
        label: 'Computational Stencils',
        singularLabel: 'Computational Stencil',
        columns: [
            { column: 'equation_key', label: 'Equation Key', canModify: true, len: 32 },
            { column: 'title', label: 'Equation Title', canModify: true, len: 45 },
            { column: 'label', label: 'Short Label', canModify: true, len: 24 },
            { column: 'formula_expr', label: 'Formula Expression', canModify: true, len: 55, rows: 2 },
            { column: 'target_symbol', label: 'Target Output Symbol', canModify: true, len: 12 },
            { column: 'target_domain', label: 'Target Domain (e.g. ℝ_ω, 𝔹)', canModify: true, len: 16 },
            { column: 'target_unit', label: 'Target Unit', canModify: true, len: 16 },
            { column: 'statement_id', label: 'Governing Formal Statement', canModify: true, len: 30 },
            { column: 'pseudo_algo_id', label: 'Linked Pseudocode Algorithm', canModify: true, len: 30 },
            { column: 'formula_description', label: 'Formula Description', canModify: true, len: 60, rows: 3 },
            { column: 'has_simulation', label: 'Simulation Sandbox Ready', canModify: true, len: 10 }
        ]
    },
    {
        table: 'mode_slots',
        label: 'Equation Mode Slots',
        singularLabel: 'Mode Slot',
        columns: [
            { column: 'equation_id', label: 'Parent Equation', canModify: false, len: 24 },
            { column: 'slot_index', label: 'Slot Index (#)', canModify: true, len: 8 },
            { column: 'symbol', label: 'Parameter Symbol', canModify: true, len: 12 },
            { column: 'label', label: 'Parameter Label', canModify: true, len: 24 },
            { column: 'domain_set', label: 'Parameter Domain', canModify: true, len: 16 },
            { column: 'default_val', label: 'Default Value', canModify: true, len: 16 },
            { column: 'min_val', label: 'Minimum Range', canModify: true, len: 14 },
            { column: 'max_val', label: 'Maximum Range', canModify: true, len: 14 },
            { column: 'step_val', label: 'Step Precision', canModify: true, len: 14 },
            { column: 'unit', label: 'Unit', canModify: true, len: 16 }
        ]
    },

    // -------------------------------------------------------------------------
    // 3. Curriculum, Outline Tree, & Modular Chapters
    // -------------------------------------------------------------------------
    {
        table: 'apps',
        label: 'Applications (Curricula)',
        singularLabel: 'Application',
        columns: [
            { column: 'app_code', label: 'Application Code', canModify: true, len: 20 },
            { column: 'name', label: 'Application Title', canModify: true, len: 36 },
            { column: 'domain', label: 'Target Web Domain', canModify: true, len: 36 },
            { column: 'description', label: 'Description', canModify: true, len: 55, rows: 2 },
            { column: 'is_active', label: 'Is Active Publication', canModify: true, len: 10 }
        ]
    },
    {
        table: 'curriculum_nav_items',
        label: 'Curriculum Outline Tree',
        singularLabel: 'Outline Item',
        columns: [
            { column: 'nav_key', label: 'Navigation Key', canModify: true, len: 32 },
            { column: 'app_id', label: 'Application', canModify: true, len: 20 },
            { column: 'parent_id', label: 'Parent Section (Outline Tree)', canModify: true, len: 24 },
            { column: 'sequence_order', label: 'Display Order (#)', canModify: true, len: 8 },
            { column: 'item_type', label: 'Item Type (html/section/diagram)', canModify: true, len: 16 },
            { column: 'topic', label: 'Course Topic / Title', canModify: true, len: 45 },
            { column: 'nav_topic', label: 'Short Nav Pill Label', canModify: true, len: 24 },
            { column: 'segment_id', label: 'Target Segment Chapter', canModify: true, len: 28 },
            { column: 'diagram_key', label: 'Attached Interactive Diagram', canModify: true, len: 28 }
        ]
    },
    {
        table: 'segments',
        label: 'Lecture Segments (Chapters)',
        singularLabel: 'Segment Chapter',
        columns: [
            { column: 'seg_key', label: 'Segment Key', canModify: true, len: 32 },
            { column: 'sequence_order', label: 'Chapter Order (#)', canModify: true, len: 8 },
            { column: 'title', label: 'Lecture Title', canModify: true, len: 45 },
            { column: 'slug', label: 'URL Slug', canModify: true, len: 32 },
            { column: 'summary', label: 'Executive Chapter Summary', canModify: true, len: 60, rows: 3 },
            { column: 'content_html', label: 'Full HTML Lecture Body', canModify: true, len: 60, rows: 12 },
            { column: 'status', label: 'Editorial Status', canModify: true, len: 16 }
        ]
    },

    // -------------------------------------------------------------------------
    // 4. Algorithms & Interactive Demos
    // -------------------------------------------------------------------------
    {
        table: 'pseudocode_algorithms',
        label: 'Pseudocode Algorithms',
        singularLabel: 'Algorithm',
        columns: [
            { column: 'algo_key', label: 'Algorithm Key', canModify: true, len: 32 },
            { column: 'name', label: 'Algorithm Name', canModify: true, len: 40 },
            { column: 'func_name', label: 'Internal Function Name', canModify: true, len: 28 },
            { column: 'category', label: 'Algorithmic Domain', canModify: true, len: 24 },
            { column: 'algo_kind', label: 'Kind (operation/predicate)', canModify: true, len: 20 },
            { column: 'badge', label: 'Display Badge', canModify: true, len: 20 },
            { column: 'signature', label: 'Formal Type Signature', canModify: true, len: 45 },
            { column: 'scaffold_key', label: 'Supporting FS Scaffold', canModify: true, len: 32 },
            { column: 'summary', label: 'Algorithmic Summary', canModify: true, len: 60, rows: 3 },
            { column: 'code', label: 'Pseudocode Definition', canModify: true, len: 60, rows: 8 },
            { column: 'tree_complexity', label: 'Tree Time Complexity', canModify: true, len: 20 },
            { column: 'dyadic_complexity', label: 'Dyadic Space Complexity', canModify: true, len: 20 }
        ]
    },
    {
        table: 'interactive_demos',
        label: 'Interactive Sandbox Demos',
        singularLabel: 'Interactive Demo',
        columns: [
            { column: 'title', label: 'Demo Title', canModify: true, len: 45 },
            { column: 'engine', label: 'Engine Type', canModify: false, len: 16 },
            { column: 'mode', label: 'Canvas / Operational Mode', canModify: false, len: 24 },
            { column: 'expression', label: 'Proposition Formula / Expression', canModify: true, len: 45 },
            { column: 'status', label: 'Logical Status', canModify: true, len: 16, options: ['taut', 'cont', 'unsat'] },
            { column: 'init_packet', label: 'Initialization JSON / Expression Packet', canModify: true, len: 55, rows: 4 },
            { column: 'description', label: 'Instructional Description', canModify: true, len: 60, rows: 3 }
        ]
    },

    // -------------------------------------------------------------------------
    // 5. Cross-References & Prerequisites
    // -------------------------------------------------------------------------
    {
        table: 'segment_references',
        label: 'Segment Embedded Citations',
        singularLabel: 'Segment Reference',
        columns: [
            { column: 'segment_id', label: 'Source Segment Chapter', canModify: false, len: 24 },
            { column: 'ref_type', label: 'Reference Tag Type (fs/stencil/ttd/demo/algo)', canModify: true, len: 18 },
            { column: 'target_key', label: 'Target Referenced Key', canModify: true, len: 32 },
            { column: 'statement_id', label: 'Linked Formal Statement', canModify: true, len: 24 },
            { column: 'equation_id', label: 'Linked Stencil Equation', canModify: true, len: 24 },
            { column: 'demo_id', label: 'Linked Interactive Demo / TTD', canModify: true, len: 24 },
            { column: 'algo_id', label: 'Linked Pseudocode Algorithm', canModify: true, len: 24 },
            { column: 'anchor_text', label: 'Embedded Anchor Text', canModify: true, len: 36 },
            { column: 'occurrence_order', label: 'Occurrence Order (#)', canModify: true, len: 8 }
        ]
    },
    {
        table: 'segment_prerequisites',
        label: 'Segment Prerequisites Graph',
        singularLabel: 'Segment Prerequisite',
        columns: [
            { column: 'segment_id', label: 'Target Segment Chapter', canModify: false, len: 24 },
            { column: 'prerequisite_segment_id', label: 'Prerequisite Segment', canModify: true, len: 24 },
            { column: 'prereq_type', label: 'Prerequisite Dependency Kind', canModify: true, len: 20 },
            { column: 'rationale', label: 'Pedagogical Rationale', canModify: true, len: 55, rows: 2 }
        ]
    },
    {
        table: 'domains',
        label: 'Mathematical & Physical Domains',
        singularLabel: 'Domain',
        columns: [
            { column: 'domain_key', label: 'Domain Key', canModify: true, len: 24 },
            { column: 'symbol', label: 'Unicode Symbol', canModify: true, len: 12 },
            { column: 'name', label: 'Domain Name', canModify: true, len: 36 },
            { column: 'category', label: 'Category', canModify: true, len: 20 },
            { column: 'lean_type', label: 'Lean 4 Type / Structure', canModify: true, len: 32 },
            { column: 'lean_file', label: 'Lean Source File', canModify: true, len: 45 },
            { column: 'base_unit', label: 'Base Unit', canModify: true, len: 16 },
            { column: 'description', label: 'Semantic Description', canModify: true, len: 60, rows: 3 }
        ]
    }
];

export const dependents: Dependent[] = [
    { table: 'directed_equations', parent: 'formal_statements', displayColumns: ['equation_key', 'title'] },
    { table: 'lean_verifications', parent: 'formal_statements', displayColumns: ['theorem_name', 'proof_status'] },
    { table: 'mode_slots', parent: 'directed_equations', displayColumns: ['slot_index', 'symbol', 'label'] },
    { table: 'curriculum_nav_items', parent: 'apps', displayColumns: ['sequence_order', 'topic'] },
    { table: 'segment_references', parent: 'segments', displayColumns: ['ref_type', 'target_key'] },
    { table: 'segment_references', parent: 'interactive_demos', displayColumns: ['ref_type', 'segment_id'] },
    { table: 'segment_prerequisites', parent: 'segments', displayColumns: ['prerequisite_segment_id', 'prereq_type'] }
];

export const navigations: TableNavigationPath[] = [
    {
        label: '📜 Axioms & Formal Statements',
        children: [
            { table: 'formal_statements' },
            { table: 'lean_verifications' }
        ]
    },
    {
        label: '📐 Computational Stencils',
        children: [
            { table: 'directed_equations' },
            { table: 'mode_slots' }
        ]
    },
    {
        label: '🌲 Curriculum & Chapters',
        children: [
            { table: 'apps' },
            { table: 'curriculum_nav_items' },
            { table: 'segments' }
        ]
    },
    {
        label: '💻 Algorithms & Demos',
        children: [
            { table: 'pseudocode_algorithms' },
            { table: 'interactive_demos' }
        ]
    },
    {
        label: '🔗 Cross-References & Citations',
        children: [
            { table: 'segment_references' },
            { table: 'segment_prerequisites' }
        ]
    }
];
