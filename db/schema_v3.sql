-- =====================================================================
-- HobbyNotes / Middle Way Mathematics
-- PostgreSQL Relational Schema: Iteration 3 (Pure Relational Architecture)
-- Standards:
--   1. Synthetic Primary Keys (id BIGINT GENERATED ALWAYS AS IDENTITY)
--   2. Natural/business keys enforced via NOT NULL UNIQUE constraints
--   3. All foreign-key references strictly point to primary key (id)
--   4. Fully normalized, flat relational tables (no array or blob shortcuts)
-- =====================================================================

-- To create the database if not yet existing, run in DBeaver:
-- CREATE DATABASE hobbynotes;

-- ---------------------------------------------------------------------
-- 0. Clean Tear-Down (Safe for re-running)
-- ---------------------------------------------------------------------

DROP TABLE IF EXISTS segment_references CASCADE;
DROP TABLE IF EXISTS segment_prerequisites CASCADE;
DROP TABLE IF EXISTS curriculum_nav_items CASCADE;
DROP TABLE IF EXISTS equation_preset_values CASCADE;
DROP TABLE IF EXISTS equation_presets CASCADE;
DROP TABLE IF EXISTS equation_slots CASCADE;
DROP TABLE IF EXISTS equation_function_calls CASCADE;
DROP TABLE IF EXISTS equation_templates CASCADE;
DROP TABLE IF EXISTS lean_verifications CASCADE;
DROP TABLE IF EXISTS formal_statement_segments CASCADE;
DROP TABLE IF EXISTS formal_statements CASCADE;
DROP TABLE IF EXISTS segments CASCADE;
DROP TABLE IF EXISTS apps CASCADE;

DROP TYPE IF EXISTS statement_type CASCADE;
DROP TYPE IF EXISTS statement_tier CASCADE;
DROP TYPE IF EXISTS governing_seed CASCADE;
DROP TYPE IF EXISTS editorial_status CASCADE;
DROP TYPE IF EXISTS prerequisite_type CASCADE;
DROP TYPE IF EXISTS ref_tag_type CASCADE;

-- ---------------------------------------------------------------------
-- 1. Custom Enumerations & Types
-- ---------------------------------------------------------------------

CREATE TYPE statement_type AS ENUM ('math', 'physics', 'information');
CREATE TYPE statement_tier AS ENUM ('constitutional', 'axiom', 'theorem', 'scenario', 'corollary', 'law');
CREATE TYPE governing_seed AS ENUM ('conway_cut', 'shadow_map', 'boundary_law');
CREATE TYPE editorial_status AS ENUM ('draft', 'staged', 'under_review', 'verified', 'published');
CREATE TYPE prerequisite_type AS ENUM ('foundational', 'recommended', 'historical');
CREATE TYPE ref_tag_type AS ENUM ('eq', 'fsd', 'ttd', 'btd', 'bid', 'stem');

-- ---------------------------------------------------------------------
-- 2. Applications (Curriculum Publication Targets)
-- ---------------------------------------------------------------------

CREATE TABLE apps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    app_code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    domain VARCHAR(128),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE apps IS 'Web application publication targets (app1, app2).';

-- ---------------------------------------------------------------------
-- 3. Curricular Segments (Modular Course Chapters)
-- ---------------------------------------------------------------------

CREATE TABLE segments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    seg_key VARCHAR(64) NOT NULL UNIQUE,
    sequence_order INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128),
    summary TEXT,
    content_html TEXT NOT NULL,
    status editorial_status NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE segments IS 'Modular curricular segments / lecture chapters.';

-- ---------------------------------------------------------------------
-- 4. Curriculum Navigation Outline Tree (The Course Index)
-- ---------------------------------------------------------------------

CREATE TABLE curriculum_nav_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nav_key VARCHAR(64) NOT NULL UNIQUE,
    app_id BIGINT NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES curriculum_nav_items(id) ON DELETE CASCADE,
    segment_id BIGINT REFERENCES segments(id) ON DELETE SET NULL,
    sequence_order INTEGER NOT NULL DEFAULT 0,
    item_type VARCHAR(16) NOT NULL DEFAULT 'html', -- 'section', 'html', 'diagram'
    topic VARCHAR(255) NOT NULL,
    nav_topic VARCHAR(64),
    diagram_key VARCHAR(64),                     -- 'banner', 'ttd', 'fsd', 'eed', 'btd', 'bid'
    diagram_path VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE curriculum_nav_items IS 'Hierarchical navigation outline tree for each app curriculum.';

-- ---------------------------------------------------------------------
-- 5. Middle Way Math Formal Statements (The Axiomatic Engine)
-- ---------------------------------------------------------------------

CREATE TABLE formal_statements (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    statement_key VARCHAR(64) NOT NULL UNIQUE,
    scaffold_key VARCHAR(64) NOT NULL,
    domain_category VARCHAR(64) NOT NULL DEFAULT 'discrete_analysis',
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE formal_statements IS 'Middle Way Math formal axiomatic statements, definitions, theorems, and identities.';

-- ---------------------------------------------------------------------
-- 6. Formal Statement Segments (Normalized Junction Table)
-- ---------------------------------------------------------------------

CREATE TABLE formal_statement_segments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    statement_id BIGINT NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    CONSTRAINT uq_statement_segment UNIQUE (statement_id, segment_id)
);

COMMENT ON TABLE formal_statement_segments IS 'Normalized relational junction mapping formal statements to the segments where they appear.';

-- ---------------------------------------------------------------------
-- 7. Lean 4 Kernel Proof Verifications
-- ---------------------------------------------------------------------

CREATE TABLE lean_verifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    theorem_key VARCHAR(128) NOT NULL UNIQUE,
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

COMMENT ON TABLE lean_verifications IS 'Lean 4 kernel proof verification cache relationally linked to formal statements.';

-- ---------------------------------------------------------------------
-- 8. Equation Evaluator Templates / Nonstandard Calculation Rules
-- ---------------------------------------------------------------------

CREATE TABLE equation_templates (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    eq_key VARCHAR(64) NOT NULL UNIQUE,
    statement_id BIGINT REFERENCES formal_statements(id) ON DELETE SET NULL,
    lean_verification_id BIGINT REFERENCES lean_verifications(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    lhs_formula TEXT NOT NULL,
    rhs_symbol VARCHAR(32) NOT NULL,
    rhs_domain VARCHAR(32) NOT NULL,             -- 'ℝ', 'ℝ_ω', 'ℂ', 'ℂ_ω', 'ℕ', 'ℤ', '𝔹'
    description TEXT,
    is_preset BOOLEAN NOT NULL DEFAULT FALSE,
    hard_rule_expr TEXT,                         -- JS/algebraic rule evaluating standard shadow st(y)
    dust_rule_expr TEXT,                         -- JS/algebraic rule evaluating halo dust ε
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE equation_templates IS 'Semantic Equation Evaluator templates (EED) and nonstandard function calculation rules.';

-- ---------------------------------------------------------------------
-- 9. Equation Function Calls (Normalized Hierarchical Function Invocations)
-- ---------------------------------------------------------------------

CREATE TABLE equation_function_calls (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    caller_template_id BIGINT NOT NULL REFERENCES equation_templates(id) ON DELETE CASCADE,
    callee_template_id BIGINT NOT NULL REFERENCES equation_templates(id) ON DELETE RESTRICT,
    call_alias VARCHAR(64) NOT NULL,
    CONSTRAINT uq_template_function_call UNIQUE (caller_template_id, callee_template_id, call_alias)
);

COMMENT ON TABLE equation_function_calls IS 'Normalized relational junction mapping which constructed equations invoke other equations on the LHS.';

-- ---------------------------------------------------------------------
-- 10. Equation Slots (Input Variable Parameter Specifications)
-- ---------------------------------------------------------------------

CREATE TABLE equation_slots (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    equation_template_id BIGINT NOT NULL REFERENCES equation_templates(id) ON DELETE CASCADE,
    slot_order INTEGER NOT NULL DEFAULT 0,
    slot_name VARCHAR(64) NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    domain VARCHAR(32) NOT NULL,
    unit VARCHAR(32),
    default_value NUMERIC NOT NULL DEFAULT 0,
    step_val NUMERIC DEFAULT 1,
    min_val NUMERIC,
    max_val NUMERIC,
    description TEXT,
    CONSTRAINT uq_eq_template_slot_name UNIQUE (equation_template_id, slot_name),
    CONSTRAINT uq_eq_template_slot_order UNIQUE (equation_template_id, slot_order)
);

COMMENT ON TABLE equation_slots IS 'Typed input parameter slots with interactive stepper bounds for equation templates.';

-- ---------------------------------------------------------------------
-- 11. Equation Presets (Grounding Concrete Scenarios)
-- ---------------------------------------------------------------------

CREATE TABLE equation_presets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    preset_key VARCHAR(64) NOT NULL UNIQUE,
    equation_template_id BIGINT NOT NULL REFERENCES equation_templates(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    display_result VARCHAR(128) NOT NULL,
    hard_part VARCHAR(128),
    dust_part VARCHAR(128),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE equation_presets IS 'Concrete numerical scenarios grounding equation templates in verified numbers.';

-- ---------------------------------------------------------------------
-- 12. Equation Preset Values (Normalized Flat Slot Values)
-- ---------------------------------------------------------------------

CREATE TABLE equation_preset_values (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    preset_id BIGINT NOT NULL REFERENCES equation_presets(id) ON DELETE CASCADE,
    slot_id BIGINT NOT NULL REFERENCES equation_slots(id) ON DELETE CASCADE,
    numeric_value NUMERIC NOT NULL,
    CONSTRAINT uq_preset_slot_value UNIQUE (preset_id, slot_id)
);

COMMENT ON TABLE equation_preset_values IS 'Normalized parameter values for each preset scenario (no JSON blobs).';

-- ---------------------------------------------------------------------
-- 13. Relational Segment References (Embedded Interactive Tags)
-- ---------------------------------------------------------------------

CREATE TABLE segment_references (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ref_key VARCHAR(128) NOT NULL UNIQUE,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    statement_id BIGINT REFERENCES formal_statements(id) ON DELETE SET NULL,
    equation_template_id BIGINT REFERENCES equation_templates(id) ON DELETE SET NULL,
    ref_type ref_tag_type NOT NULL,
    target_identifier VARCHAR(128) NOT NULL,
    occurrence_order INTEGER NOT NULL DEFAULT 0,
    anchor_text TEXT,
    raw_tag TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE segment_references IS 'Tracks every interactive tag (<eq-ref>, <fsd-ref>, <ttd-ref>) embedded in segment HTML.';

-- ---------------------------------------------------------------------
-- 14. Pedagogical Learning Graph (Segment Prerequisites)
-- ---------------------------------------------------------------------

CREATE TABLE segment_prerequisites (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    depends_on_segment_id BIGINT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    prerequisite_type prerequisite_type NOT NULL DEFAULT 'foundational',
    CONSTRAINT uq_segment_prereq UNIQUE (segment_id, depends_on_segment_id),
    CONSTRAINT chk_no_self_prereq CHECK (segment_id <> depends_on_segment_id)
);

COMMENT ON TABLE segment_prerequisites IS 'Directed graph modeling learning prerequisites between curriculum chapters.';

-- ---------------------------------------------------------------------
-- 15. Performance Indexes on Foreign Keys & Lookups
-- ---------------------------------------------------------------------

CREATE INDEX idx_v3_nav_items_app ON curriculum_nav_items(app_id);
CREATE INDEX idx_v3_nav_items_parent ON curriculum_nav_items(parent_id);
CREATE INDEX idx_v3_nav_items_segment ON curriculum_nav_items(segment_id);

CREATE INDEX idx_v3_formal_statements_parent ON formal_statements(parent_id);
CREATE INDEX idx_v3_formal_statements_domain ON formal_statements(domain_category);
CREATE INDEX idx_v3_formal_statements_scaffold ON formal_statements(scaffold_key);

CREATE INDEX idx_v3_fss_statement ON formal_statement_segments(statement_id);
CREATE INDEX idx_v3_fss_segment ON formal_statement_segments(segment_id);

CREATE INDEX idx_v3_lean_verif_statement ON lean_verifications(statement_id);

CREATE INDEX idx_v3_equation_templates_statement ON equation_templates(statement_id);
CREATE INDEX idx_v3_equation_templates_lean ON equation_templates(lean_verification_id);

CREATE INDEX idx_v3_eq_func_caller ON equation_function_calls(caller_template_id);
CREATE INDEX idx_v3_eq_func_callee ON equation_function_calls(callee_template_id);

CREATE INDEX idx_v3_equation_slots_template ON equation_slots(equation_template_id);
CREATE INDEX idx_v3_equation_slots_order ON equation_slots(equation_template_id, slot_order);

CREATE INDEX idx_v3_equation_presets_template ON equation_presets(equation_template_id);
CREATE INDEX idx_v3_eq_preset_values_preset ON equation_preset_values(preset_id);
CREATE INDEX idx_v3_eq_preset_values_slot ON equation_preset_values(slot_id);

CREATE INDEX idx_v3_segment_refs_segment ON segment_references(segment_id);
CREATE INDEX idx_v3_segment_refs_statement ON segment_references(statement_id);
CREATE INDEX idx_v3_segment_refs_template ON segment_references(equation_template_id);
CREATE INDEX idx_v3_segment_refs_type ON segment_references(ref_type);

CREATE INDEX idx_v3_prereq_seg ON segment_prerequisites(segment_id);
CREATE INDEX idx_v3_prereq_depends ON segment_prerequisites(depends_on_segment_id);
