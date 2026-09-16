-- =====================================================================
-- HobbyNotes / Middle Way Mathematics
-- PostgreSQL Relational Schema: Iteration 1 (Domains A & B)
-- Delineating Invariant Subject Matter (Situations) & Formalisms (Lenses)
-- =====================================================================

-- To create the database if not yet existing, run in DBeaver/psql:
-- CREATE DATABASE hobbynotes;
-- \c hobbynotes;

-- Enable UUID extension if needed in future iterations
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. Custom Enumerations & Types
-- ---------------------------------------------------------------------

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statement_type') THEN
        CREATE TYPE statement_type AS ENUM ('math', 'physics', 'information');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statement_tier') THEN
        CREATE TYPE statement_tier AS ENUM ('constitutional', 'axiom', 'theorem', 'scenario', 'corollary', 'law');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'governing_seed') THEN
        CREATE TYPE governing_seed AS ENUM ('conway_cut', 'shadow_map', 'boundary_law');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'formalism_engine') THEN
        CREATE TYPE formalism_engine AS ENUM ('lean4', 'mathlib', 'maxima', 'numerical');
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Situations (The Subject Matter / Invariant Phenomenon)
-- ---------------------------------------------------------------------
-- Represents the underlying physical, geometric, or mathematical reality.
-- Invariants, domain dimensions, and physical descriptions reside here,
-- completely independent of whether notation uses Lean 4, Dedekind reals, or CAS.

CREATE TABLE IF NOT EXISTS situations (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    domain_category VARCHAR(64) NOT NULL, -- e.g. 'kinematics', '1d_analysis', 'thermodynamics', 'foundations'
    description TEXT,
    invariant_summary TEXT,              -- Invariant physical or structural laws (e.g. constant acceleration, energy conservation)
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE situations IS 'Invariant subject matter, physical phenomena, or mathematical structures studied across formalisms.';

-- ---------------------------------------------------------------------
-- 3. Formalisms (The Symbolic & Deductive Lens)
-- ---------------------------------------------------------------------
-- Represents the formal axiomatic framework through which situations are examined.

CREATE TABLE IF NOT EXISTS formalisms (
    id VARCHAR(32) PRIMARY KEY,          -- e.g. 'mwm', 'standard_analysis', 'discrete_symplectic'
    name VARCHAR(128) NOT NULL,          -- e.g. 'Middle Way Mathematics'
    specification_standard TEXT,         -- Description of semantics, axioms, and foundation
    kernel_engine formalism_engine NOT NULL DEFAULT 'lean4',
    base_types TEXT,                     -- e.g. 'ℝ_ω, Day ω, infinitesimal dx = 1/ω'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE formalisms IS 'Formal mathematical, logical, or computational systems (MWM, Standard Cauchy Analysis, Symplectic).';

-- ---------------------------------------------------------------------
-- 4. Formal Statements (The Intersection of Situation & Formalism)
-- ---------------------------------------------------------------------
-- The specific formalization of a situation expressed within a chosen formalism.
-- Multiple formal statements across different formalisms can represent the same situation.

CREATE TABLE IF NOT EXISTS formal_statements (
    id VARCHAR(64) PRIMARY KEY,          -- e.g. 'fs_newtonian_mechanics', 'fs_free_fall_accel'
    situation_id VARCHAR(64) NOT NULL REFERENCES situations(id) ON DELETE CASCADE,
    formalism_id VARCHAR(32) NOT NULL REFERENCES formalisms(id) ON DELETE RESTRICT,
    parent_id VARCHAR(64) REFERENCES formal_statements(id) ON DELETE SET NULL,
    type statement_type NOT NULL DEFAULT 'math',
    tier statement_tier NOT NULL DEFAULT 'theorem',
    governing_seed governing_seed,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scaffold_key VARCHAR(64) NOT NULL,
    expression TEXT NOT NULL,
    lean_signature TEXT,
    lean_snippet TEXT,
    referenced_segments TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE formal_statements IS 'Formal statements formulated within a formalism to model an underlying situation.';

-- ---------------------------------------------------------------------
-- 5. Calculation Modes (Directional Inverted Stencils)
-- ---------------------------------------------------------------------
-- Represents an algebraic directional projection (Inputs → Output) derived
-- from the formal statement's governing equation.

CREATE TABLE IF NOT EXISTS calculation_modes (
    id VARCHAR(64) PRIMARY KEY,          -- e.g. 'mode_free_fall_v_from_v0_g_t'
    statement_id VARCHAR(64) NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    label VARCHAR(128) NOT NULL,         -- e.g. '(v₀, g, t) → v'
    target_symbol VARCHAR(32) NOT NULL,  -- e.g. 'v'
    target_domain VARCHAR(32) NOT NULL,  -- e.g. 'ℝ_ω'
    target_unit VARCHAR(32),             -- e.g. 'm/s'
    formula_description TEXT NOT NULL,
    formula_expr TEXT NOT NULL,          -- e.g. 'v0 - g * t'
    has_simulation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE calculation_modes IS 'Directional stencils and inverted calculation channels for a formal statement.';

-- ---------------------------------------------------------------------
-- 6. Mode Slots (Input Variable Specs)
-- ---------------------------------------------------------------------
-- The ordered input parameter definitions required by a calculation mode.

CREATE TABLE IF NOT EXISTS mode_slots (
    id SERIAL PRIMARY KEY,
    mode_id VARCHAR(64) NOT NULL REFERENCES calculation_modes(id) ON DELETE CASCADE,
    slot_order INTEGER NOT NULL DEFAULT 0,
    name VARCHAR(64) NOT NULL,           -- e.g. 'initial_velocity'
    symbol VARCHAR(32) NOT NULL,         -- e.g. 'v₀'
    domain VARCHAR(32) NOT NULL,         -- e.g. 'ℝ_ω'
    unit VARCHAR(32),                    -- e.g. 'm/s'
    default_value NUMERIC NOT NULL,
    min_val NUMERIC,
    max_val NUMERIC,
    step_val NUMERIC,
    description TEXT,
    CONSTRAINT uq_mode_slot_order UNIQUE(mode_id, slot_order)
);

COMMENT ON TABLE mode_slots IS 'Ordered input parameters and numerical boundary constraints for calculation modes.';

-- ---------------------------------------------------------------------
-- 7. Verified Presets (Grounding Examples of the Situation)
-- ---------------------------------------------------------------------
-- Concrete numerical scenarios that ground the situation in real numbers.
-- Bound to a specific calculation mode and statement, with values in JSONB.

CREATE TABLE IF NOT EXISTS verified_presets (
    id VARCHAR(64) PRIMARY KEY,          -- e.g. 'ex_earth_free_fall'
    mode_id VARCHAR(64) NOT NULL REFERENCES calculation_modes(id) ON DELETE CASCADE,
    statement_id VARCHAR(64) NOT NULL REFERENCES formal_statements(id) ON DELETE CASCADE,
    situation_id VARCHAR(64) REFERENCES situations(id) ON DELETE SET NULL,
    preset_key VARCHAR(64),              -- Optional key for fast lookup from cas-ref
    title VARCHAR(255) NOT NULL,
    input_values JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. {"v0": 20, "g": 9.8, "t": 1.5}
    display_result VARCHAR(128) NOT NULL,            -- e.g. "5.300 m/s"
    formatted_formula TEXT NOT NULL,
    domain_badge VARCHAR(32) NOT NULL,               -- e.g. "⚛️ Physics"
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE verified_presets IS 'Verified computational examples and preset scenarios grounding the situation.';

-- ---------------------------------------------------------------------
-- 8. Deductive & Symbolic Verification Caches
-- ---------------------------------------------------------------------

-- Lean 4 Deductive Verification Cache
CREATE TABLE IF NOT EXISTS lean_verifications (
    key VARCHAR(128) PRIMARY KEY,
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

COMMENT ON TABLE lean_verifications IS 'Cached verification runs from the Lean 4 proof kernel.';

-- Maxima CAS Symbolic Verification & Step Sessions
CREATE TABLE IF NOT EXISTS maxima_verifications (
    id VARCHAR(64) PRIMARY KEY,
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

COMMENT ON TABLE maxima_verifications IS 'Cached symbolic reduction sessions and step proofs from Maxima CAS.';

-- ---------------------------------------------------------------------
-- 9. Performance & Lookup Indexes
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_formal_statements_situation ON formal_statements(situation_id);
CREATE INDEX IF NOT EXISTS idx_formal_statements_formalism ON formal_statements(formalism_id);
CREATE INDEX IF NOT EXISTS idx_formal_statements_parent ON formal_statements(parent_id);
CREATE INDEX IF NOT EXISTS idx_formal_statements_scaffold ON formal_statements(scaffold_key);

CREATE INDEX IF NOT EXISTS idx_calculation_modes_statement ON calculation_modes(statement_id);
CREATE INDEX IF NOT EXISTS idx_mode_slots_mode ON mode_slots(mode_id);

CREATE INDEX IF NOT EXISTS idx_verified_presets_mode ON verified_presets(mode_id);
CREATE INDEX IF NOT EXISTS idx_verified_presets_statement ON verified_presets(statement_id);
CREATE INDEX IF NOT EXISTS idx_verified_presets_situation ON verified_presets(situation_id);
CREATE INDEX IF NOT EXISTS idx_verified_presets_key ON verified_presets(preset_key);

-- GIN Indexes for semi-structured JSON querying
CREATE INDEX IF NOT EXISTS idx_presets_input_values ON verified_presets USING GIN (input_values);
CREATE INDEX IF NOT EXISTS idx_maxima_steps ON maxima_verifications USING GIN (formatted_steps);
