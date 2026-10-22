-- =====================================================================
-- HobbyNotes / Middle Way Mathematics
-- PostgreSQL Relational Schema (Canonical MWM-DB Schema)
-- Normalized Single Source of Truth
-- =====================================================================

-- To create the database if not yet existing, run in DBeaver / psql:
-- CREATE DATABASE hobbynotes;

-- ---------------------------------------------------------------------
-- 0. Clean Tear-Down (Safe for re-running)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS parameter_mining_jobs CASCADE;
DROP TABLE IF EXISTS studio_workspaces CASCADE;
DROP TABLE IF EXISTS lean_verifications CASCADE;
DROP TABLE IF EXISTS segment_prerequisites CASCADE;
DROP TABLE IF EXISTS segment_references CASCADE;
DROP TABLE IF EXISTS curriculum_nav_items CASCADE;
DROP TABLE IF EXISTS mode_slots CASCADE;
DROP VIEW IF EXISTS calculation_modes CASCADE;
DROP TABLE IF EXISTS equation_statement_links CASCADE;
DROP TABLE IF EXISTS directed_equations CASCADE;
DROP TABLE IF EXISTS formal_statements CASCADE;
DROP TABLE IF EXISTS interactive_demos CASCADE;
DROP TABLE IF EXISTS pseudocode_algorithms CASCADE;
DROP TABLE IF EXISTS formalisms CASCADE;
DROP TABLE IF EXISTS situations CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS curriculum_tracks CASCADE;
DROP TABLE IF EXISTS apps CASCADE;
DROP TABLE IF EXISTS domains CASCADE;

DROP TYPE IF EXISTS statement_kind CASCADE;
DROP TYPE IF EXISTS statement_type CASCADE;
DROP TYPE IF EXISTS statement_tier CASCADE;
DROP TYPE IF EXISTS governing_seed CASCADE;
DROP TYPE IF EXISTS editorial_status CASCADE;
DROP TYPE IF EXISTS prerequisite_type CASCADE;

-- ---------------------------------------------------------------------
-- 1. Custom Enumerations & Types
-- ---------------------------------------------------------------------

CREATE TYPE statement_kind AS ENUM ('axiom', 'theorem', 'directed_equality');
CREATE TYPE statement_type AS ENUM ('math', 'physics', 'information');
CREATE TYPE statement_tier AS ENUM ('constitutional', 'law', 'scenario');
CREATE TYPE governing_seed AS ENUM ('conway_cut', 'shadow_map', 'boundary_law');
CREATE TYPE editorial_status AS ENUM ('draft', 'staged', 'under_review', 'verified', 'published');
CREATE TYPE prerequisite_type AS ENUM ('foundational', 'recommended', 'historical');

-- ---------------------------------------------------------------------
-- 2. Applications (Curriculum Publication Targets)
-- ---------------------------------------------------------------------

CREATE TABLE apps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    app_code VARCHAR(32) UNIQUE NOT NULL,        -- e.g. 'app1', 'app2'
    name VARCHAR(128) NOT NULL,
    domain VARCHAR(128),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apps IS 'Web application publication targets (e.g. app1, app2).';

-- ---------------------------------------------------------------------
-- ---------------------------------------------------------------------
-- 2b. Lean 4 Formal Scaffold Declarations (The Verified Proof Engine)
-- ---------------------------------------------------------------------

CREATE TABLE lean_declarations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    decl_key VARCHAR(255) UNIQUE NOT NULL,       -- e.g. 'MiddleWay.Tree1', 'MiddleWay.Tree2.totally_ordered'
    name VARCHAR(255) NOT NULL,                  -- e.g. 'Tree1', 'Tree2.totally_ordered'
    kind VARCHAR(32) NOT NULL,                   -- 'inductive', 'structure', 'def', 'theorem', 'axiom', 'class', 'instance'
    signature TEXT NOT NULL,
    body TEXT,
    doc_comment TEXT,
    line_no INTEGER,
    file_path VARCHAR(255) NOT NULL DEFAULT 'MiddleWayLean/Scaffold.lean',
    uses TEXT[] NOT NULL DEFAULT '{}',           -- Upstream Lean prerequisites
    used_by TEXT[] NOT NULL DEFAULT '{}',        -- Downstream Lean dependents
    qed_status BOOLEAN NOT NULL DEFAULT TRUE,    -- Machine-checked verdict
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE lean_declarations IS 'Machine-checked Lean 4 declarations, inductive types, and theorems parsed from MiddleWayLean/Scaffold.lean.';

-- ---------------------------------------------------------------------
-- 2c. Mathematical & Physical Domains (Directly Tied to Lean 4 Scaffold)
-- ---------------------------------------------------------------------

CREATE TABLE domains (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    domain_key VARCHAR(64) UNIQUE NOT NULL,       -- e.g. 'D_w', 'Tree1', 'R_w', 'Frequency'
    symbol VARCHAR(32) NOT NULL,                   -- e.g. '𝔻', 'ℕ', 'ℝ_ω', 'Hz'
    name VARCHAR(128) NOT NULL,                    -- e.g. 'Dyadic Rationals (Fraction Model)'
    category VARCHAR(32) NOT NULL DEFAULT 'mathematical', -- 'inductive_tree', 'continuum', 'physical', 'operator'
    lean_type VARCHAR(128),                        -- e.g. 'MiddleWay.Dyad', 'MiddleWay.Tree1', 'MiddleWay.R_w'
    lean_file VARCHAR(255) DEFAULT 'MiddleWayLean/Scaffold.lean',
    lean_decl_id BIGINT REFERENCES lean_declarations(id) ON DELETE SET NULL,
    base_unit VARCHAR(32),                         -- e.g. 'Hz', 'm/s', NULL
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE domains IS 'Mathematical domains and physical grounded spaces anchored directly to Lean 4 types in Scaffold.lean.';

-- ---------------------------------------------------------------------
-- 3. Curricular Segments (The 52 Modular Chapters)
-- ---------------------------------------------------------------------

CREATE TABLE segments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seg_key VARCHAR(64) UNIQUE NOT NULL,         -- e.g. 'stemNewtonianBridge', 'middlewayIntro'
    sequence_order INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128),
    summary TEXT,
    content_html TEXT NOT NULL,                  -- Full HTML body of the lecture
    status editorial_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE segments IS 'The 52 modular curricular segments / lecture chapters.';

-- ---------------------------------------------------------------------
-- 4. Curriculum Navigation Outline Tree (The Course Index)
-- ---------------------------------------------------------------------

CREATE TABLE curriculum_nav_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nav_key VARCHAR(64) UNIQUE,                  -- e.g. 'app1_nav_sec_1', 'app1_nav_ch_middlewayIntro'
    app_id BIGINT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES curriculum_nav_items(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL DEFAULT 0,
    item_type VARCHAR(16) NOT NULL DEFAULT 'html', -- 'section', 'html', 'diagram'
    topic VARCHAR(255) NOT NULL,
    nav_topic VARCHAR(64),
    segment_id BIGINT REFERENCES segments(id) ON DELETE SET NULL,
    diagram_key VARCHAR(64),                     -- 'banner', 'ttd', 'fsd', 'btd', 'bid'
    diagram_path VARCHAR(255),
    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE curriculum_nav_items IS 'Hierarchical navigation outline tree for each app curriculum (canonical course hierarchy).';

-- ---------------------------------------------------------------------
-- 4b. Middle Way Pseudocode Algorithms (The Discrete Machine Library)
-- ---------------------------------------------------------------------

CREATE TABLE pseudocode_algorithms (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    algo_key VARCHAR(64) UNIQUE NOT NULL,        -- e.g. 'conway_add', 'kinematics_step'
    func_name VARCHAR(64),                       -- e.g. 'ConwayAdd', 'KinematicStep'
    name VARCHAR(255) NOT NULL,
    badge VARCHAR(64) NOT NULL,                  -- UI Badge, e.g. 'Tree-Inductive Arithmetic'
    category VARCHAR(64) NOT NULL DEFAULT 'arithmetic', -- e.g. 'order_theory', 'arithmetic', 'analysis', 'rotor_trig', 'quantum_bayes', 'primitives'
    algo_kind VARCHAR(32) NOT NULL DEFAULT 'operation', -- e.g. 'predicate', 'operation', 'stepper', 'primitive'
    signature VARCHAR(255),                      -- e.g. '(Node × Node) → Node'
    summary TEXT,
    domain VARCHAR(128) NOT NULL,
    scaffold_key VARCHAR(64),                    -- e.g. 'abelian_group', 'D_w_is_totally_ordered'
    primitives TEXT[] NOT NULL DEFAULT '{}',
    tree_complexity TEXT,
    dyadic_complexity TEXT,
    code TEXT NOT NULL,
    explanation JSONB NOT NULL DEFAULT '[]'::jsonb,
    example JSONB,
    presets JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE pseudocode_algorithms IS 'Middle Way structured pseudocode algorithms executable on the discrete dyadic machine.';

-- ---------------------------------------------------------------------
-- 4b. Interactive Visual Demonstrations (BTD, BID, TTD Sandboxes)
-- ---------------------------------------------------------------------

CREATE TABLE interactive_demos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    engine VARCHAR(32) NOT NULL,                 -- 'btd' (Binary Tree), 'bid' (Binary Interval), 'ttd' (Truth Table)
    mode VARCHAR(64) NOT NULL,                   -- e.g. 'order', 'addition', 'multiplication', 'isomorphism', 'labeled'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expression TEXT,                             -- Propositional formula (for TTD) or canonical expression
    status VARCHAR(16),                          -- 'taut' | 'cont' | 'unsat' (for TTD)
    init_packet JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE interactive_demos IS 'Independent interactive visual demonstrations and simulation sandboxes for intrinsic mathematical structures.';

-- ---------------------------------------------------------------------
-- 5. Middle Way Math Formal Statements (The Axiomatic Engine)
-- ---------------------------------------------------------------------

CREATE TABLE formal_statements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    statement_key VARCHAR(64) UNIQUE NOT NULL,   -- e.g. 'fs_free_fall_accel'
    scaffold_key VARCHAR(64) NOT NULL,
    domain_category VARCHAR(64) NOT NULL DEFAULT 'discrete_analysis', -- e.g. 'tree_topology', 'arithmetic', 'order_theory', 'discrete_analysis', 'complex_analysis', 'rotor_trig', 'quantum_bayes'
    subject_type statement_type NOT NULL DEFAULT 'math',              -- 'math', 'physics', 'information'
    structure_kind VARCHAR(32) NOT NULL DEFAULT 'theorem',            -- 'axiom', 'theorem', 'defn', 'scenario', 'corollary', 'law'
    parent_id BIGINT REFERENCES formal_statements(id) ON DELETE SET NULL,
    statement_kind statement_kind NOT NULL DEFAULT 'theorem',         -- 'axiom', 'theorem' (Lean 4 proof), 'directed_equality' (computational rule)
    pseudo_algo_id BIGINT REFERENCES pseudocode_algorithms(id) ON DELETE SET NULL,
    demo_id BIGINT REFERENCES interactive_demos(id) ON DELETE SET NULL,
    type statement_type NOT NULL DEFAULT 'math',
    tier statement_tier NOT NULL DEFAULT 'law',                        -- 'constitutional', 'law', 'scenario'
    governing_seed governing_seed,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expression TEXT NOT NULL,
    lean_signature TEXT,
    lean_snippet TEXT,
    lean_decl_id BIGINT REFERENCES lean_declarations(id) ON DELETE SET NULL,
    status editorial_status NOT NULL DEFAULT 'published',
    referenced_segments TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE formal_statements IS 'Middle Way Math formal axiomatic statements, definitions, theorems, and identities.';

-- ---------------------------------------------------------------------
-- 6. Active Directed Equations (Stencils / Computational Rules)
-- ---------------------------------------------------------------------

CREATE TABLE directed_equations (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equation_key VARCHAR(64) UNIQUE NOT NULL,    -- e.g. 'ff_v_from_v0_g_t'
    title VARCHAR(255) NOT NULL,                 -- e.g. 'Kinematic Velocity Decrement'
    label VARCHAR(128) NOT NULL,                 -- e.g. '(v₀, g, t) → v'
    formula_expr TEXT NOT NULL,                  -- e.g. 'v0 - g * t'
    target_symbol VARCHAR(32) NOT NULL,          -- e.g. 'v'
    target_domain VARCHAR(32) NOT NULL,          -- e.g. 'ℝ_ω'
    target_unit VARCHAR(32),                     -- e.g. 'm/s'
    pseudo_algo_id BIGINT NOT NULL REFERENCES pseudocode_algorithms(id) ON DELETE RESTRICT,
    formula_description TEXT NOT NULL,
    has_simulation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE directed_equations IS 'Active directed equations and calculation stencils operating on the discrete dyadic machine.';

-- ---------------------------------------------------------------------
-- 6b. Equation-to-Statement Links (Instantiates & Has-Properties)
-- ---------------------------------------------------------------------

CREATE TABLE equation_statement_links (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equation_id BIGINT NOT NULL REFERENCES directed_equations(id) ON DELETE CASCADE,
    statement_id BIGINT NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    relation_type VARCHAR(32) NOT NULL DEFAULT 'instantiates', -- 'instantiates' | 'has_property' | 'derived_from'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_eq_stmt_rel UNIQUE(equation_id, statement_id, relation_type)
);

COMMENT ON TABLE equation_statement_links IS 'Relational bridge connecting active directed equations to their governing inactive formal statements.';


-- ---------------------------------------------------------------------
-- 7. Mode Slots (Input Variable Parameter Specs)
-- ---------------------------------------------------------------------

CREATE TABLE mode_slots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equation_id BIGINT NOT NULL REFERENCES directed_equations(id) ON DELETE CASCADE,
    slot_order INTEGER NOT NULL DEFAULT 0,
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    domain VARCHAR(32) NOT NULL,
    unit VARCHAR(32),
    default_value NUMERIC NOT NULL,
    min_val NUMERIC,
    max_val NUMERIC,
    step_val NUMERIC,
    description TEXT,
    CONSTRAINT uq_mode_slot_order UNIQUE(equation_id, slot_order)
);

COMMENT ON TABLE mode_slots IS 'Ordered input parameters with boundary ranges for calculation modes.';

-- ---------------------------------------------------------------------
-- 8. Relational Segment References (Embedded Stencil Links)
-- ---------------------------------------------------------------------

CREATE TABLE segment_references (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    statement_id BIGINT REFERENCES formal_statements(id) ON DELETE CASCADE,
    equation_id BIGINT REFERENCES directed_equations(id) ON DELETE SET NULL,
    demo_id BIGINT REFERENCES interactive_demos(id) ON DELETE SET NULL,
    algo_id BIGINT REFERENCES pseudocode_algorithms(id) ON DELETE SET NULL,
    ref_type VARCHAR(16) NOT NULL DEFAULT 'fs',  -- 'fs', 'stencil', 'ttd', 'demo', 'algo'
    initial_focus VARCHAR(16) NOT NULL DEFAULT 'proof', -- 'proof', 'calculator', 'demo'
    occurrence_order INTEGER NOT NULL DEFAULT 0,
    anchor_text TEXT,
    raw_tag TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE segment_references IS 'Tracks every interactive stencil citation embedded inside segment text.';

-- ---------------------------------------------------------------------
-- 10. Pedagogical Graph (Segment Prerequisites)
-- ---------------------------------------------------------------------

CREATE TABLE segment_prerequisites (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    depends_on_segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    prerequisite_type prerequisite_type NOT NULL DEFAULT 'foundational',
    CONSTRAINT uq_segment_prereq UNIQUE(segment_id, depends_on_segment_id),
    CONSTRAINT chk_no_self_prereq CHECK (segment_id <> depends_on_segment_id)
);

COMMENT ON TABLE segment_prerequisites IS 'Directed graph modeling learning prerequisites between curriculum chapters.';

-- ---------------------------------------------------------------------
-- 11. Verification Proof & CAS Caches (Relationally Connected)
-- ---------------------------------------------------------------------

CREATE TABLE lean_verifications (
    key VARCHAR(128) PRIMARY KEY,
    statement_id BIGINT REFERENCES formal_statements(id) ON DELETE SET NULL,
    target VARCHAR(128) NOT NULL,
    expression TEXT NOT NULL,
    signature TEXT NOT NULL,
    verdict BOOLEAN NOT NULL DEFAULT TRUE,
    qed BOOLEAN NOT NULL DEFAULT TRUE,
    time_ms INTEGER,
    engine VARCHAR(255),
    verified_at TIMESTAMPTZ,
    lean_snippet TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE lean_verifications IS 'Lean 4 kernel proof verification cache, relationally linked to formal statements.';

-- ---------------------------------------------------------------------
-- 12. Performance & Relational Indexes
-- ---------------------------------------------------------------------

CREATE INDEX idx_segments_key ON segments(seg_key);
CREATE INDEX idx_segments_status ON segments(status);

CREATE INDEX idx_nav_items_app ON curriculum_nav_items(app_id);
CREATE INDEX idx_nav_items_parent ON curriculum_nav_items(parent_id);
CREATE INDEX idx_nav_items_segment ON curriculum_nav_items(segment_id);
CREATE INDEX idx_nav_items_key ON curriculum_nav_items(nav_key);

CREATE INDEX idx_formal_statements_parent ON formal_statements(parent_id);
CREATE INDEX idx_formal_statements_domain ON formal_statements(domain_category);
CREATE INDEX idx_formal_statements_key ON formal_statements(statement_key);
CREATE INDEX idx_formal_statements_scaffold ON formal_statements(scaffold_key);
CREATE INDEX idx_formal_statements_pseudo_algo ON formal_statements(pseudo_algo_id);
CREATE INDEX idx_formal_statements_demo ON formal_statements(demo_id);

CREATE INDEX idx_interactive_demos_engine ON interactive_demos(engine);

CREATE INDEX idx_directed_equations_key ON directed_equations(equation_key);
CREATE INDEX idx_directed_equations_pseudo_algo ON directed_equations(pseudo_algo_id);

CREATE INDEX idx_eq_stmt_links_eq ON equation_statement_links(equation_id);
CREATE INDEX idx_eq_stmt_links_stmt ON equation_statement_links(statement_id);
CREATE INDEX idx_eq_stmt_links_rel ON equation_statement_links(relation_type);

CREATE INDEX idx_mode_slots_eq ON mode_slots(equation_id);

CREATE INDEX idx_verified_presets_eq ON verified_presets(equation_id);
CREATE INDEX idx_verified_presets_key ON verified_presets(preset_key);

CREATE INDEX idx_segment_refs_segment ON segment_references(segment_id);
CREATE INDEX idx_segment_refs_statement ON segment_references(statement_id);
CREATE INDEX idx_segment_refs_equation ON segment_references(equation_id);
CREATE INDEX idx_segment_refs_preset ON segment_references(preset_id);
CREATE INDEX idx_segment_refs_demo ON segment_references(demo_id);

CREATE INDEX idx_lean_verif_statement ON lean_verifications(statement_id);

CREATE INDEX idx_presets_input_values ON verified_presets USING GIN (input_values);

