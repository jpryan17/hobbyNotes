-- =====================================================================
-- HobbyNotes / Middle Way Mathematics
-- PostgreSQL Relational Schema (Canonical MWM-DB Schema)
-- Normalized Single Source of Truth
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Custom Enumerations & Types
-- ---------------------------------------------------------------------

CREATE TYPE index_item_type AS ENUM ('section', 'html', 'diagram');
CREATE TYPE diagram_type AS ENUM ('static','ui-engine');
CREATE TYPE engine_type AS ENUM ('TTD','FSD','GIU');
CREATE TYPE fsd_type AS ENUM ('statement','directed_equation','preset');

-- ---------------------------------------------------------------------
-- 2. The Application Index Table
-- ---------------------------------------------------------------------

CREATE TABLE application_index (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, 
    nav_key VARCHAR(64) UNIQUE, 
    item_label VARCHAR(32) NOT NULL,           
    topic VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    item_type index_item_type NOT NULL,          
  -- item_type = section columns
    parent_id BIGINT REFERENCES application_index(id),
    sequence_order INTEGER,
    -- item_type = html column
    html_segment text,
    -- item_type = diagram columns
    diagram_type diagram_type NOT NULL,
    -- item_type = diagram & diagram_type = 'static' column
    diagram_key VARCHAR(64),
    -- item_type = diagram & diagram_type = 'ui-engine' column
    custom_element_id BIGINT REFERENCES custom_elements(id)
);

-- ---------------------------------------------------------------------
-- 3. The custom_elements table
-- ---------------------------------------------------------------------
CREATE TABLE custom_elements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(64) UNIQUE NOT NULL,  
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    engine engine_type NOT NULL, 
    --
    -- engine_type = 'TTD' columns 
    ttd_expression TEXT,
    --
    -- engine_type = 'FSD' columns
    fsd_expression TEXT,
    fsd_type fsd_type,
    --
    -- fsd_type = 'statement' columns
    lean_signature TEXT,
    --
    -- fsd_type = 'directed_equation' columns
    directed_equation TEXT,
    --
    -- fsd_type = 'preset' columns
    for_directed_equation BIGINT REFERENCES custom_elements(id),      

    mode VARCHAR(64) NOT NULL,                   -- e.g. 'order', 'addition', 'multiplication', 'isomorphism', 'labeled'

   init_packet JSONB DEFAULT '{}'::jsonb,
  
);

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
-- 4b. Custom Element Instruments (BTD, BID, TTD Sandboxes)
-- ---------------------------------------------------------------------

CREATE TABLE custom_elements (
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

COMMENT ON TABLE custom_elements IS 'Independent interactive visual demonstrations and simulation sandboxes for intrinsic mathematical structures.';

-- ---------------------------------------------------------------------
-- 5. Middle Way Math Formal Statements & Directed Equations (Judgments)
-- ---------------------------------------------------------------------

CREATE TABLE formal_statements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    statement_key VARCHAR(64) UNIQUE NOT NULL,   -- e.g. 'fs_free_fall_accel', 'fs_geom_ladder_step'
    scaffold_key VARCHAR(64) NOT NULL,
    domain_category VARCHAR(64) NOT NULL DEFAULT 'discrete_analysis', -- e.g. 'tree_topology', 'arithmetic', 'order_theory', 'discrete_analysis', 'complex_analysis', 'rotor_trig', 'quantum_bayes'
    subject_type statement_type NOT NULL DEFAULT 'math',              -- 'math', 'physics', 'information'
    structure_kind VARCHAR(32) NOT NULL DEFAULT 'theorem',            -- 'axiom', 'theorem', 'predicate', 'numeric_exp', 'transform'
    parent_id BIGINT REFERENCES formal_statements(id) ON DELETE SET NULL,
    statement_kind statement_kind NOT NULL DEFAULT 'theorem',         -- 'axiom', 'theorem' (Lean 4 proof), 'directed_equality' (computational rule)
    pseudo_algo_id BIGINT REFERENCES pseudocode_algorithms(id) ON DELETE SET NULL,
    type statement_type NOT NULL DEFAULT 'math',
    tier statement_tier NOT NULL DEFAULT 'law',                        -- 'constitutional', 'law', 'scenario'
    governing_seed governing_seed,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expression TEXT NOT NULL,
    label VARCHAR(128),                          -- Short stencil label (when statement_kind = 'directed_equality')
    formula_expr TEXT,                           -- Computable expression (when statement_kind = 'directed_equality')
    target_symbol VARCHAR(32),                   -- Output target symbol, e.g. 'F(k)', 'v', 'b'
    target_domain VARCHAR(32) DEFAULT '𝔹',       -- Codomain, e.g. '𝔹' (propositions), '𝔻_ω', 'ℝ_ω', '𝔹_ω'
    target_unit VARCHAR(32),                     -- Physical unit, e.g. 'm/s', 'Hz'
    formula_description TEXT,
    has_simulation BOOLEAN NOT NULL DEFAULT FALSE,
    lean_signature TEXT,
    lean_snippet TEXT,
    lean_decl_id BIGINT REFERENCES lean_declarations(id) ON DELETE SET NULL,
    status editorial_status NOT NULL DEFAULT 'published',
    referenced_segments TEXT[] NOT NULL DEFAULT '{}',
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE formal_statements IS 'Unified Middle Way Math formal judgments: axioms, theorems, and computable directed equalities.';

-- ---------------------------------------------------------------------
-- 6. Mode Slots (Parameter & Input Variable Specs for Directed Equalities)
-- ---------------------------------------------------------------------

CREATE TABLE mode_slots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    statement_id BIGINT NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    slot_order INTEGER NOT NULL DEFAULT 0,
    slot_role VARCHAR(16) NOT NULL DEFAULT 'input', -- 'param' | 'input'
    slot_kind VARCHAR(16) NOT NULL DEFAULT 'input', -- 'parameter' | 'input'
    name VARCHAR(64) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    domain VARCHAR(32) NOT NULL,
    unit VARCHAR(32),
    default_value NUMERIC NOT NULL,
    min_val NUMERIC,
    max_val NUMERIC,
    step_val NUMERIC,
    description TEXT,
    CONSTRAINT uq_mode_slot_order UNIQUE(statement_id, slot_order)
);

COMMENT ON TABLE mode_slots IS 'Ordered parameter and input slots for computable directed equalities.';

-- ---------------------------------------------------------------------
-- 7. Stencil Presets (Curried Parameter Specializations of Directed Equalities)
-- ---------------------------------------------------------------------

CREATE TABLE stencil_presets (
    id SERIAL PRIMARY KEY,
    preset_key TEXT UNIQUE NOT NULL,
    statement_id BIGINT NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    param_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    input_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
    unit TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE stencil_presets IS 'Curried parameter presets specializing a directed equality in formal_statements.';

-- ---------------------------------------------------------------------
-- 8. Relational Segment References (Embedded Custom Element Citations)
-- ---------------------------------------------------------------------

CREATE TABLE segment_references (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    custom_element_id BIGINT REFERENCES custom_elements(id) ON DELETE CASCADE,
    statement_id BIGINT REFERENCES formal_statements(id) ON DELETE CASCADE,
    preset_id INTEGER REFERENCES stencil_presets(id) ON DELETE CASCADE,
    ref_type VARCHAR(16) NOT NULL DEFAULT 'fs',  -- 'fs', 'stencil', 'preset', 'demo', 'ttd', 'btd', 'bid'
    initial_focus VARCHAR(16) NOT NULL DEFAULT 'proof', -- 'proof', 'calculator', 'demo'
    occurrence_order INTEGER NOT NULL DEFAULT 0,
    anchor_text TEXT,
    raw_tag TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE segment_references IS 'Tracks every custom element citation (custom_elements, formal_statements, stencil_presets) embedded inside segment HTML.';

-- ---------------------------------------------------------------------
-- 9. Verification Proof & CAS Caches (Relationally Connected)
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

CREATE INDEX idx_custom_elements_engine ON custom_elements(engine);

CREATE INDEX idx_mode_slots_stmt ON mode_slots(statement_id);

CREATE INDEX idx_stencil_presets_stmt ON stencil_presets(statement_id);
CREATE INDEX idx_stencil_presets_key ON stencil_presets(preset_key);

CREATE INDEX idx_segment_refs_segment ON segment_references(segment_id);
CREATE INDEX idx_segment_refs_statement ON segment_references(statement_id);
CREATE INDEX idx_segment_refs_preset ON segment_references(preset_id);
CREATE INDEX idx_segment_refs_custom_elt ON segment_references(custom_element_id);

CREATE INDEX idx_lean_verif_statement ON lean_verifications(statement_id);


