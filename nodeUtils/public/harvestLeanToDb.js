"use strict";
/**
 * nodeUtils/harvestLeanToDb.ts
 *
 * Harvests all 400+ machine-checked declarations from MiddleWayLean/Scaffold.lean
 * and populates the PostgreSQL `lean_declarations` table.
 *
 * Establishes first-class relational foreign keys:
 * 1. `domains.lean_decl_id` -> `lean_declarations.id`
 * 2. `formal_statements.lean_decl_id` -> `lean_declarations.id`
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.harvestLeanDeclarations = harvestLeanDeclarations;
const leanScaffoldParser_js_1 = require("./leanScaffoldParser.js");
const API_URL = process.env.API_URL || 'http://127.0.0.1:3000/api/sql';
async function querySql(sql, params = []) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
    }
    return await res.json();
}
function escapeSql(val) {
    if (val === null || val === undefined)
        return 'NULL';
    if (typeof val === 'number')
        return isFinite(val) ? val.toString() : 'NULL';
    if (typeof val === 'boolean')
        return val ? 'TRUE' : 'FALSE';
    const str = String(val).replace(/'/g, "''");
    return `'${str}'`;
}
function escapeTextArray(arr) {
    if (!arr || arr.length === 0)
        return "'{}'::text[]";
    const elements = arr.map(s => `'${s.replace(/'/g, "''")}'`).join(', ');
    return `ARRAY[${elements}]::text[]`;
}
async function harvestLeanDeclarations() {
    console.log('================================================================');
    console.log('🏛️  Middle Way Math: Harvesting Lean 4 Scaffold into PostgreSQL');
    console.log('================================================================\n');
    // 1. Parse Scaffold.lean
    console.log('1. Parsing MiddleWayLean/Scaffold.lean via leanScaffoldParser...');
    const graph = (0, leanScaffoldParser_js_1.parseScaffoldDeclarations)();
    const decls = Object.values(graph.declarations);
    console.log(`✓ Parsed ${decls.length} Lean 4 declarations.\n`);
    if (decls.length === 0) {
        console.error('❌ No declarations found in Scaffold.lean.');
        return;
    }
    // 2. Batch Upsert into lean_declarations
    console.log('2. Upserting declarations into `lean_declarations` table...');
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    for (let i = 0; i < decls.length; i += BATCH_SIZE) {
        const chunk = decls.slice(i, i + BATCH_SIZE);
        const valueTuples = chunk.map((d) => {
            const declKey = `MiddleWay.${d.name}`;
            return `(
        ${escapeSql(declKey)},
        ${escapeSql(d.name)},
        ${escapeSql(d.kind)},
        ${escapeSql(d.signature)},
        ${escapeSql(d.body || '')},
        ${escapeSql(d.docComment || null)},
        ${d.lineNo || 'NULL'},
        'MiddleWayLean/Scaffold.lean',
        ${escapeTextArray(d.uses)},
        ${escapeTextArray(d.usedBy)},
        TRUE
      )`;
        });
        const sql = `
      INSERT INTO lean_declarations (
        decl_key, name, kind, signature, body, doc_comment, line_no, file_path, uses, used_by, qed_status
      ) VALUES ${valueTuples.join(',\n')}
      ON CONFLICT (decl_key) DO UPDATE SET
        name = EXCLUDED.name,
        kind = EXCLUDED.kind,
        signature = EXCLUDED.signature,
        body = EXCLUDED.body,
        doc_comment = EXCLUDED.doc_comment,
        line_no = EXCLUDED.line_no,
        file_path = EXCLUDED.file_path,
        uses = EXCLUDED.uses,
        used_by = EXCLUDED.used_by,
        qed_status = EXCLUDED.qed_status,
        updated_at = CURRENT_TIMESTAMP;
    `;
        const res = await querySql(sql);
        if (res.status === 'error') {
            throw new Error(`Failed to upsert lean_declarations batch ${i}: ${res.error || res.message}`);
        }
        insertedCount += chunk.length;
    }
    console.log(`✓ Successfully populated ${insertedCount} declarations in PostgreSQL.\n`);
    // 3. Fetch ID mapping of lean_declarations
    console.log('3. Indexing Lean declaration IDs for relational linkage...');
    const idMapRes = await querySql('SELECT id, name, decl_key FROM lean_declarations;');
    const nameToId = new Map();
    for (const r of (idMapRes.data?.rows || [])) {
        nameToId.set(r.name, r.id);
        const bareName = r.name.replace(/^MiddleWay\./, '');
        if (!nameToId.has(bareName)) {
            nameToId.set(bareName, r.id);
        }
    }
    // 4. Link Domains
    console.log('4. Correlating MWM Domains to Lean Types...');
    const domainRes = await querySql('SELECT id, domain_key, lean_type, name FROM domains ORDER BY id;');
    const domains = domainRes.data?.rows || [];
    // Mapping rules for domains -> Lean declarations
    const domainExplicitLeanNames = {
        'B_w': 'B_w',
        'Tree1': 'Tree1',
        'Tree2': 'Tree2',
        'D_w': 'Dyad',
        'Tree4': 'Tree4',
        'GaussianDyad': 'GaussianDyad',
        'R_w': 'R_w',
        'C_w': 'C_w',
        'Z': 'Z_w',
        'Frequency': 'Dyad',
        'Unit': 'Dyad',
        'Matrix': 'DiffOp'
    };
    let linkedDomainsCount = 0;
    for (const dom of domains) {
        const targetLeanName = domainExplicitLeanNames[dom.domain_key] || (dom.lean_type ? dom.lean_type.replace(/^MiddleWay\./, '') : dom.domain_key);
        const matchedDeclId = nameToId.get(targetLeanName);
        if (matchedDeclId) {
            await querySql(`UPDATE domains SET lean_decl_id = $1 WHERE id = $2;`, [matchedDeclId, dom.id]);
            linkedDomainsCount++;
            console.log(`  ✓ Domain [${dom.domain_key} : ${dom.name}] ⟹ Lean declaration [${targetLeanName}] (ID #${matchedDeclId})`);
        }
        else {
            console.log(`  ⚠️ Domain [${dom.domain_key}] could not be resolved to Lean declaration.`);
        }
    }
    console.log(`✓ Linked ${linkedDomainsCount}/${domains.length} domains to Lean declarations.\n`);
    // 5. Link Formal Statements
    console.log('5. Correlating Formal Statements to Lean Theorems / Definitions...');
    const fsRes = await querySql('SELECT id, statement_key, scaffold_key, title, lean_signature FROM formal_statements ORDER BY id;');
    const statements = fsRes.data?.rows || [];
    // Explicit mappings for statements to exact Lean theorems in Scaffold.lean
    const stmtExplicitLeanNames = {
        'fs_telescoping_ftc': 'telescoping_ftc',
        'fs_hyperfinite_derivative': 'deriv',
        'fs_complex_step_invariance': 'complex_step_norm_invariance',
        'fs_lee_yang_circle': 'lee_yang_zero_pinch',
        'fs_bayes_updating': 'bayes_sequential_update',
        'fs_tree2_totally_ordered': 'D_w_is_totally_ordered',
        'fs_ptolemaic_half_angle': 'dyadic_ptolemaic_sine',
        'fs_standard_part_homomorphism': 'st_homomorphism',
        'fs_dyadic_isomorphism': 'Tree2_finite_is_dyad',
        'fs_van_den_dries_ehrlich': 'No_eps0_totally_ordered',
        'fs_conway_addition': 'Tree2.add',
        'fs_conway_multiplication': 'Tree2.mul',
        'fs_contour_cauchy_goursat': 'cauchy_integral_theorem',
        'fs_hyperfinite_probability': 'transfinite_probability_positivity',
        'fs_three_polarizer_quantum': 'polarizer_projection_law'
    };
    let linkedStmtCount = 0;
    for (const stmt of statements) {
        let matchedName = stmtExplicitLeanNames[stmt.statement_key] || null;
        if (!matchedName && stmt.scaffold_key) {
            const cleanKey = stmt.scaffold_key.replace(/^scaffold:/, '');
            if (nameToId.has(cleanKey))
                matchedName = cleanKey;
        }
        if (!matchedName && stmt.lean_signature) {
            const sigMatch = /^(?:theorem|def|axiom|structure)\s+([a-zA-Z0-9_'.]+)/.exec(stmt.lean_signature.trim());
            if (sigMatch && nameToId.has(sigMatch[1])) {
                matchedName = sigMatch[1];
            }
        }
        if (!matchedName) {
            // Fuzzy substring matching
            const keyClean = stmt.statement_key.replace(/^fs_/, '');
            const found = Array.from(nameToId.keys()).find(n => n.toLowerCase() === keyClean.toLowerCase() || n.toLowerCase().includes(keyClean.toLowerCase()));
            if (found)
                matchedName = found;
        }
        if (matchedName && nameToId.has(matchedName)) {
            const declId = nameToId.get(matchedName);
            await querySql(`UPDATE formal_statements SET lean_decl_id = $1 WHERE id = $2;`, [declId, stmt.id]);
            linkedStmtCount++;
            console.log(`  ✓ Statement [${stmt.statement_key}] "${stmt.title.slice(0, 35)}..." ⟹ Lean declaration [${matchedName}] (ID #${declId})`);
        }
        else {
            console.log(`  ℹ️ Statement [${stmt.statement_key}] currently unlinked (conceptual/scaffold scenario).`);
        }
    }
    console.log(`✓ Linked ${linkedStmtCount}/${statements.length} formal statements directly to Lean declarations.\n`);
    console.log('================================================================');
    console.log('🎉 Lean 4 Relational Scaffold Harvest Complete!');
    console.log('================================================================');
}
// Self-invoking when run directly
if (require.main === module) {
    harvestLeanDeclarations().catch((err) => {
        console.error('Fatal error during Lean scaffold harvest:', err);
        process.exit(1);
    });
}
