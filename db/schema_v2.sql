-- =====================================================================
-- HobbyNotes / Middle Way Mathematics
-- PostgreSQL Relational Schema: Iteration 2 (Refined Conceptual Architecture)
-- Normalized MWM-DB: Middle Way Math Single Source of Truth
-- =====================================================================

-- To create the database if not yet existing, run in DBeaver:
-- CREATE DATABASE hobbynotes;

-- ---------------------------------------------------------------------
-- 0. Clean Tear-Down (Safe for re-running)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS parameter_mining_jobs CASCADE;
DROP TABLE IF EXISTS studio_workspaces CASCADE;
DROP TABLE IF EXISTS maxima_verifications CASCADE;
DROP TABLE IF EXISTS lean_verifications CASCADE;
DROP TABLE IF EXISTS segment_prerequisites CASCADE;
DROP TABLE IF EXISTS segment_references CASCADE;
DROP TABLE IF EXISTS curriculum_nav_items CASCADE;
DROP TABLE IF EXISTS verified_presets CASCADE;
DROP TABLE IF EXISTS mode_slots CASCADE;
DROP TABLE IF EXISTS calculation_modes CASCADE;
DROP TABLE IF EXISTS formal_statements CASCADE;
DROP TABLE IF EXISTS formalisms CASCADE;
DROP TABLE IF EXISTS situations CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS curriculum_tracks CASCADE;
DROP TABLE IF EXISTS apps CASCADE;

DROP TYPE IF EXISTS statement_type CASCADE;
DROP TYPE IF EXISTS statement_tier CASCADE;
DROP TYPE IF EXISTS governing_seed CASCADE;
DROP TYPE IF EXISTS editorial_status CASCADE;
DROP TYPE IF EXISTS prerequisite_type CASCADE;

-- ---------------------------------------------------------------------
-- 1. Custom Enumerations & Types
-- ---------------------------------------------------------------------

CREATE TYPE statement_type AS ENUM ('math', 'physics', 'information');
CREATE TYPE statement_tier AS ENUM ('constitutional', 'axiom', 'theorem', 'scenario', 'corollary', 'law');
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
-- 5. Middle Way Math Formal Statements (The Axiomatic Engine)
-- ---------------------------------------------------------------------

CREATE TABLE formal_statements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    statement_key VARCHAR(64) UNIQUE NOT NULL,   -- e.g. 'fs_free_fall_accel'
    scaffold_key VARCHAR(64) NOT NULL,
    domain_category VARCHAR(64) NOT NULL DEFAULT 'discrete_analysis', -- e.g. 'logic', 'number_tree', 'discrete_analysis', 'complex_analysis', 'quantum_logic', 'kinematics'
    parent_id BIGINT REFERENCES formal_statements(id) ON DELETE SET NULL,
    type statement_type NOT NULL DEFAULT 'math',
    tier statement_tier NOT NULL DEFAULT 'theorem',
    governing_seed governing_seed,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    expression TEXT NOT NULL,
    lean_signature TEXT,
    lean_snippet TEXT,
    status editorial_status NOT NULL DEFAULT 'published',
    referenced_segments TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE formal_statements IS 'Middle Way Math formal axiomatic statements, definitions, theorems, and identities.';

-- ---------------------------------------------------------------------
-- 6. Calculation Modes (Directional Inverted Stencils)
-- ---------------------------------------------------------------------

CREATE TABLE calculation_modes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mode_key VARCHAR(64) UNIQUE NOT NULL,         -- e.g. 'ff_v_from_v0_g_t'
    statement_id BIGINT NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    label VARCHAR(128) NOT NULL,                 -- e.g. '(v₀, g, t) → v'
    target_symbol VARCHAR(32) NOT NULL,          -- e.g. 'v'
    target_domain VARCHAR(32) NOT NULL,          -- e.g. 'ℝ_ω'
    target_unit VARCHAR(32),                     -- e.g. 'm/s'
    formula_description TEXT NOT NULL,
    formula_expr TEXT NOT NULL,                  -- e.g. 'v0 - g * t'
    has_simulation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE calculation_modes IS 'Directional stencils and inverted calculation modes.';

-- ---------------------------------------------------------------------
-- 7. Mode Slots (Input Variable Parameter Specs)
-- ---------------------------------------------------------------------

CREATE TABLE mode_slots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mode_id BIGINT NOT NULL REFERENCES calculation_modes(id) ON DELETE CASCADE,
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
    CONSTRAINT uq_v2_mode_slot_order UNIQUE(mode_id, slot_order)
);

COMMENT ON TABLE mode_slots IS 'Ordered input parameters with boundary ranges for calculation modes.';

-- ---------------------------------------------------------------------
-- 8. Verified Presets (Grounding Examples)
-- ---------------------------------------------------------------------

CREATE TABLE verified_presets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    preset_key VARCHAR(64) UNIQUE NOT NULL,       -- e.g. 'ex_earth_free_fall'
    mode_id BIGINT NOT NULL REFERENCES calculation_modes(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    input_values JSONB NOT NULL DEFAULT '{}'::jsonb,
    display_result VARCHAR(128) NOT NULL,
    formatted_formula TEXT NOT NULL,
    domain_badge VARCHAR(32) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE verified_presets IS 'Concrete numerical scenarios grounding MWM stencils in verified numbers.';

-- ---------------------------------------------------------------------
-- 9. Relational Segment References (Embedded Stencil Links)
-- ---------------------------------------------------------------------

CREATE TABLE segment_references (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    statement_id BIGINT NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    mode_id BIGINT REFERENCES calculation_modes(id) ON DELETE SET NULL,
    preset_id BIGINT REFERENCES verified_presets(id) ON DELETE SET NULL,
    initial_focus VARCHAR(16) NOT NULL DEFAULT 'proof', -- 'proof', 'calculator'
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
    CONSTRAINT uq_v2_segment_prereq UNIQUE(segment_id, depends_on_segment_id),
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

CREATE TABLE maxima_verifications (
    id VARCHAR(64) PRIMARY KEY,
    mode_id BIGINT REFERENCES calculation_modes(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(128) NOT NULL,
    problem_statement TEXT NOT NULL,
    domain VARCHAR(64) NOT NULL,
    operators TEXT[] NOT NULL DEFAULT '{}',
    scaffold_theorems TEXT[] NOT NULL DEFAULT '{}',
    session_inputs TEXT[] NOT NULL DEFAULT '{}',
    session_outputs TEXT[] NOT NULL DEFAULT '{}',
    formatted_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE maxima_verifications IS 'Maxima CAS symbolic reduction sessions, relationally linked to calculation modes.';

-- ---------------------------------------------------------------------
-- 12. Automated Parameter Mining
-- ---------------------------------------------------------------------

CREATE TABLE parameter_mining_jobs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    job_key VARCHAR(64) UNIQUE NOT NULL,         -- e.g. 'job_free_fall_grid'
    statement_id BIGINT NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    mode_id BIGINT NOT NULL REFERENCES calculation_modes(id) ON DELETE CASCADE,
    target_symbol VARCHAR(32) NOT NULL,
    parameter_grid JSONB NOT NULL DEFAULT '{}'::jsonb,
    require_integer_outputs BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    discovered_candidates JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE parameter_mining_jobs IS 'Automated parameter space exploration jobs finding clean integers for stencils.';

-- ---------------------------------------------------------------------
-- 13. Performance & Relational Indexes
-- ---------------------------------------------------------------------

CREATE INDEX idx_v2_segments_key ON segments(seg_key);
CREATE INDEX idx_v2_segments_status ON segments(status);

CREATE INDEX idx_v2_nav_items_app ON curriculum_nav_items(app_id);
CREATE INDEX idx_v2_nav_items_parent ON curriculum_nav_items(parent_id);
CREATE INDEX idx_v2_nav_items_segment ON curriculum_nav_items(segment_id);
CREATE INDEX idx_v2_nav_items_key ON curriculum_nav_items(nav_key);

CREATE INDEX idx_v2_formal_statements_parent ON formal_statements(parent_id);
CREATE INDEX idx_v2_formal_statements_domain ON formal_statements(domain_category);
CREATE INDEX idx_v2_formal_statements_key ON formal_statements(statement_key);
CREATE INDEX idx_v2_formal_statements_scaffold ON formal_statements(scaffold_key);

CREATE INDEX idx_v2_calculation_modes_statement ON calculation_modes(statement_id);
CREATE INDEX idx_v2_calculation_modes_key ON calculation_modes(mode_key);

CREATE INDEX idx_v2_mode_slots_mode ON mode_slots(mode_id);

CREATE INDEX idx_v2_verified_presets_mode ON verified_presets(mode_id);
CREATE INDEX idx_v2_verified_presets_key ON verified_presets(preset_key);

CREATE INDEX idx_v2_segment_refs_segment ON segment_references(segment_id);
CREATE INDEX idx_v2_segment_refs_statement ON segment_references(statement_id);
CREATE INDEX idx_v2_segment_refs_mode ON segment_references(mode_id);
CREATE INDEX idx_v2_segment_refs_preset ON segment_references(preset_id);

CREATE INDEX idx_v2_lean_verif_statement ON lean_verifications(statement_id);
CREATE INDEX idx_v2_maxima_verif_mode ON maxima_verifications(mode_id);

CREATE INDEX idx_v2_presets_input_values ON verified_presets USING GIN (input_values);
CREATE INDEX idx_v2_maxima_steps ON maxima_verifications USING GIN (formatted_steps);
