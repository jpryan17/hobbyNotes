import dotenv from 'dotenv';
import { Pool } from 'pg';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'hobbynotes',
    password: process.env.DB_PASSWORD || 'repj',
    port: parseInt(process.env.DB_PORT || '5432')
});

interface DemoInitRecord {
    demo_key: string;
    engine: string;
    mode: string;
    title: string;
    description: string;
    init_packet: Record<string, any>;
}

export const DEMO_INITIALIZATIONS: DemoInitRecord[] = [
    // -------------------------------------------------------------------------
    // Truth Table Demos (TTD)
    // -------------------------------------------------------------------------
    {
        demo_key: 'ttd_demorgan',
        engine: 'ttd',
        mode: 'propositional_logic',
        title: "De Morgan's First Law",
        description: "Equivalence between negation of conjunction and disjunction of negations: ¬(p ∧ q) ↔ (¬p ∨ ¬q).",
        init_packet: {
            exp: "n[paq]e[nponq]",
            fmt: "¬(𝑝 ∧ 𝑞) ↔ (¬𝑝 ∨ ¬𝑞)",
            variables: ["p", "q"],
            isTautology: true
        }
    },
    {
        demo_key: 'ttd_modus_ponens',
        engine: 'ttd',
        mode: 'propositional_logic',
        title: "Modus Ponens (Rule of Detachment)",
        description: "Classical deductive validity: if p and p → q are true, then q must be true: ((p → q) ∧ p) → q.",
        init_packet: {
            exp: "[[piq]ap]iq",
            fmt: "((𝑝 → 𝑞) ∧ 𝑝) → 𝑞",
            variables: ["p", "q"],
            isTautology: true
        }
    },
    {
        demo_key: 'ttd_excluded_middle',
        engine: 'ttd',
        mode: 'propositional_logic',
        title: "Law of Excluded Middle",
        description: "Classical dichotomy: for any proposition p, either p or ¬p holds: p ∨ ¬p.",
        init_packet: {
            exp: "ponp",
            fmt: "𝑝 ∨ ¬𝑝",
            variables: ["p"],
            isTautology: true
        }
    },
    {
        demo_key: 'ttd_non_contradiction',
        engine: 'ttd',
        mode: 'propositional_logic',
        title: "Principle of Non-Contradiction",
        description: "No statement can be both true and false simultaneously: ¬(p ∧ ¬p).",
        init_packet: {
            exp: "n[panp]",
            fmt: "¬(𝑝 ∧ ¬𝑝)",
            variables: ["p"],
            isTautology: true
        }
    },
    {
        demo_key: 'ttd_implication',
        engine: 'ttd',
        mode: 'propositional_logic',
        title: "Material Conditional (Implication)",
        description: "Standard truth table for conditional statement p → q.",
        init_packet: {
            exp: "piq",
            fmt: "𝑝 → 𝑞",
            variables: ["p", "q"],
            isTautology: false
        }
    },
    {
        demo_key: 'ttd_equivalence',
        engine: 'ttd',
        mode: 'propositional_logic',
        title: "Material Biconditional (Equivalence)",
        description: "Standard truth table for equivalence statement p ↔ q.",
        init_packet: {
            exp: "peq",
            fmt: "𝑝 ↔ 𝑞",
            variables: ["p", "q"],
            isTautology: false
        }
    },
    {
        demo_key: 'ttd_hypothetical_syllogism',
        engine: 'ttd',
        mode: 'propositional_logic',
        title: "Hypothetical Syllogism (Chain Rule)",
        description: "Transitivity of implication: ((p → q) ∧ (q → r)) → (p → r).",
        init_packet: {
            exp: "[[piq]a[qir]]i[pir]",
            fmt: "((𝑝 → 𝑞) ∧ (𝑞 → 𝑟)) → (𝑝 → 𝑟)",
            variables: ["p", "q", "r"],
            isTautology: true
        }
    },

    // -------------------------------------------------------------------------
    // Binary Tree Demos (BTD)
    // -------------------------------------------------------------------------
    {
        demo_key: 'btd_order',
        engine: 'btd',
        mode: 'order',
        title: "Surreal Tree Total Order",
        description: "Visual navigation of the binary tree total order comparison algorithm on Surreal numbers.",
        init_packet: {
            maxDepth: 4,
            defaultLeft: "[-]",
            defaultRight: "[+]"
        }
    },
    {
        demo_key: 'btd_addition',
        engine: 'btd',
        mode: 'addition',
        title: "Conway Inductive Tree Addition (+)",
        description: "Inductive construction of Conway Surreal addition on binary branching trees.",
        init_packet: {
            maxDepth: 4,
            defaultA: "[+]",
            defaultB: "[-]"
        }
    },
    {
        demo_key: 'btd_multiplication',
        engine: 'btd',
        mode: 'multiplication',
        title: "Conway Inductive Tree Multiplication (·)",
        description: "Recursive cross-product construction of Conway Surreal multiplication.",
        init_packet: {
            maxDepth: 3
        }
    },
    {
        demo_key: 'btd_labeled',
        engine: 'btd',
        mode: 'labeled',
        title: "Labeled Dyadic Sequences",
        description: "Structural labeling of paths in the binary tree corresponding to dyadic rationals.",
        init_packet: {
            maxDepth: 5
        }
    },

    // -------------------------------------------------------------------------
    // Binary Interval Demos (BID)
    // -------------------------------------------------------------------------
    {
        demo_key: 'bid_euler',
        engine: 'bid',
        mode: 'subdivision',
        title: "Dyadic Interval Subdivision",
        description: "Recursive interval bisection and standard part projection on dyadic intervals.",
        init_packet: {
            interval: [0, 1],
            bisections: 4
        }
    },
    {
        demo_key: 'bid_rotor',
        engine: 'bid',
        mode: 'rotor',
        title: "Unit Rotor Circle Projection",
        description: "Geometric projection of unit rotor components onto the dyadic trigonometric unit circle.",
        init_packet: {
            initialAngle: 0.785398
        }
    },

    // -------------------------------------------------------------------------
    // Formal Structure Demos (FSD)
    // -------------------------------------------------------------------------
    {
        demo_key: 'fsd_stage',
        engine: 'fsd',
        mode: 'stage_visualizer',
        title: "Formal Structure Stage Visualizer",
        description: "Interactive visualizer for the hierarchical stages of Conway surreal tree construction.",
        init_packet: {
            stages: [0, 1, 2, 3]
        }
    }
];

export async function seedInteractiveDemos(): Promise<void> {
    console.log(`[seedDemoInitializations] Seeding ${DEMO_INITIALIZATIONS.length} demo initializations into interactive_demos...`);
    for (const d of DEMO_INITIALIZATIONS) {
        const exp = d.init_packet?.exp || null;
        const st = d.init_packet?.status || (d.init_packet?.isTautology !== undefined ? (d.init_packet.isTautology ? 'taut' : 'cont') : null);
        await pool.query(
            `INSERT INTO interactive_demos (demo_key, engine, mode, title, description, expression, status, init_packet, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (demo_key) DO UPDATE SET
                engine = EXCLUDED.engine,
                mode = EXCLUDED.mode,
                title = EXCLUDED.title,
                description = EXCLUDED.description,
                expression = EXCLUDED.expression,
                status = EXCLUDED.status,
                init_packet = EXCLUDED.init_packet,
                updated_at = CURRENT_TIMESTAMP;`,
            [d.demo_key, d.engine, d.mode, d.title, d.description, exp, st, JSON.stringify(d.init_packet)]
        );
    }

    const countRes = await pool.query('SELECT COUNT(*) as cnt FROM interactive_demos;');
    console.log(`[seedDemoInitializations] Done. Total interactive_demos records in DB: ${countRes.rows[0].cnt}`);
}

if (require.main === module) {
    seedInteractiveDemos()
        .then(() => pool.end())
        .catch((err) => {
            console.error('[seedDemoInitializations] Failed:', err);
            pool.end();
            process.exit(1);
        });
}
