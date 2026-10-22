"use strict";
/**
 * nodeUtils/alignCustomElements.ts
 *
 * Migration and alignment utility for Curricular Segments and PostgreSQL Database:
 * Aligns legacy <cas-ref>, <eq-ref>, and <fsd-ref> tags to the unified:
 * - <eq-ref id="X" desc="..."></eq-ref> (Active Directed Equation Stencils)
 * - <fs-ref id="Y" desc="..."></fs-ref> (Inactive Formal Statements / Theorems)
 *
 * Preserves pure diagrammatic <fsd-ref exp="..." quantifiers="..."> visualizer tags.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
async function runAlignment() {
    console.log('=== [alignCustomElements] Starting Custom Element Tag Migration ===');
    const client = new pg_1.Client({
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_DATABASE || 'hobbynotes',
    });
    await client.connect();
    console.log('✓ Connected to PostgreSQL database.');
    // 1. Fetch live statements and equations from PostgreSQL
    const eqRes = await client.query('SELECT id, equation_key, title FROM directed_equations ORDER BY id ASC;');
    const stmtRes = await client.query('SELECT id, statement_key, scaffold_key, title FROM formal_statements ORDER BY id ASC;');
    console.log(`Loaded ${eqRes.rows.length} directed equations and ${stmtRes.rows.length} formal statements from DB.`);
    // Build lookup maps
    const eqKeyMap = new Map();
    for (const eq of eqRes.rows) {
        eqKeyMap.set(eq.equation_key.toLowerCase(), eq);
    }
    // Pre-seed known legacy aliases for equations
    const eqAliasMap = new Map([
        ['nucleus_halo_1d', 'nucleus_halo_decomp_eval'],
        ['sin_halo', 'trig_sin_dyadic_eval'],
        ['complex_halo_2d', 'complex_mult_eval'],
        ['quadratic_halo_diff', 'diff_x4_st'],
        ['cas_derivative_cubic', 'diff_x4_st'],
        ['cas_diff_forms', 'diff_x4_st'],
        ['cas_second_diff', 'diff_x4_st'],
        ['diff_x4', 'diff_x4_st'],
        ['cas_ivt_bisection', 'ivt_root_bisection'],
        ['cas_three_polarizer', 'polarizer_transmission'],
        ['three_polarizer', 'polarizer_transmission'],
        ['cas_quantum_bayes', 'bayes_posterior'],
        ['bayes_filter', 'bayes_posterior'],
        ['telescoping_sum', 'we_ke_from_m_v'],
        ['cas_product_rule', 'diff_x4_st'],
        ['cas_discrete_integral', 'we_ke_from_m_v'],
        ['cas_telescoping_ftc', 'we_ke_from_m_v'],
        ['cas_complex_step', 'complex_mult_eval'],
        ['cas_cauchy_riemann', 'complex_mult_eval'],
        ['cas_cauchy_integral', 'complex_mult_eval'],
        ['cas_residue_integral', 'complex_mult_eval'],
    ]);
    const stmtKeyMap = new Map();
    for (const st of stmtRes.rows) {
        stmtKeyMap.set(st.scaffold_key.toLowerCase(), st);
        stmtKeyMap.set(st.statement_key.toLowerCase(), st);
    }
    // Pre-seed known legacy aliases for statements
    const stmtAliasMap = new Map([
        ['infinitesimal_halo', 'nucleus_halo_decomposition'],
        ['c_w', 'cauchy_edge_cancel'],
        ['r_quartic', 'r_quartic'],
        ['residue_theorem', 'residue_theorem'],
        ['born_rule', 'born_rule'],
        ['quantum_interference', 'born_rule'],
        ['unitary_preservation', 'unitary_isometry'],
        ['bayes_rule', 'bayes_rule'],
        ['omega_inv', 'omega_inv'],
        ['discrete_ivt', 'discrete_ivt'],
        ['scaffold:dyadic_angle', 'dyadic_angle'],
        ['scaffold:dyadic_to_real', 'dyadic_angle'],
        ['scaffold:angle_to_rotor', 'dyadic_angle'],
        ['scaffold:dyadic_to_rotor', 'dyadic_angle'],
        ['scaffold:r_w_circle', 'dyadic_angle'],
    ]);
    // 2. Backup app1/segs directory
    const segsDir = path.resolve(fs.existsSync('app1/segs') ? 'app1/segs' : 'archive/app1_segs');
    const backupDir = path.resolve('app1/segs_backup_pre_migration');
    if (!fs.existsSync(backupDir) && fs.existsSync(segsDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
        const files = fs.readdirSync(segsDir).filter(f => f.endsWith('.html'));
        for (const f of files) {
            fs.copyFileSync(path.join(segsDir, f), path.join(backupDir, f));
        }
        console.log(`✓ Backed up ${files.length} segment HTML files to ${backupDir}`);
    }
    else {
        console.log(`ℹ Backup folder ${backupDir} already exists.`);
    }
    // Helper to transform content
    function transformHtml(content) {
        let eqCount = 0;
        let fsCount = 0;
        // 1. Transform <fsd-ref ...> tags:
        // If it has auto-calc or open-calc, it's an active calculation -> becomes <eq-ref id="X" desc="..."></eq-ref>
        // If it has scaffold="..." without exp="...", it's a formal statement -> becomes <fs-ref id="Y" desc="..."></fs-ref>
        // If it has exp="..." (diagram stage), keep as <fsd-ref exp="...">!
        let updated = content.replace(/<fsd-ref\s+([^>]*?)>(.*?)<\/fsd-ref>/gis, (fullMatch, attrs, innerText) => {
            // Check if it's a visual FSD tree diagram stage
            if (/\bexp=["']/i.test(attrs) && !/\bscaffold=["']/i.test(attrs)) {
                return fullMatch; // Preserve diagram visualizer
            }
            const isAutoCalc = /auto-calc|open-calc/i.test(attrs);
            const scaffoldMatch = /\bscaffold=["']([^"']+)["']/i.exec(attrs);
            const rawScaffold = scaffoldMatch ? scaffoldMatch[1].trim() : '';
            const cleanScaffold = rawScaffold.toLowerCase();
            const titleMatch = /\btitle=["']([^"']+)["']/i.exec(attrs);
            const rawTitle = titleMatch ? titleMatch[1].trim() : innerText.replace(/<[^>]*>/g, '').trim();
            if (isAutoCalc) {
                // Active directed equation
                let resolvedKey = cleanScaffold;
                if (eqAliasMap.has(resolvedKey)) {
                    resolvedKey = eqAliasMap.get(resolvedKey);
                }
                let matchedEq = eqKeyMap.get(resolvedKey);
                if (!matchedEq) {
                    // Try matching by scaffold
                    if (cleanScaffold === 'heat_flux')
                        matchedEq = eqKeyMap.get('diff_heat_step');
                    else if (cleanScaffold === 'free_fall_accel')
                        matchedEq = eqKeyMap.get('ff_v_from_v0_g_t');
                    else if (cleanScaffold === 'work_energy')
                        matchedEq = eqKeyMap.get('we_ke_from_m_v');
                    else if (cleanScaffold === 'sin_dyadic_fn')
                        matchedEq = eqKeyMap.get('trig_sin_dyadic_eval');
                    else if (cleanScaffold === 'sin_rotor_fn')
                        matchedEq = eqKeyMap.get('trig_sin_rotor_eval');
                    else if (cleanScaffold === 'telescoping_ftc')
                        matchedEq = eqKeyMap.get('ff_s_from_v0_g_t');
                    else if (cleanScaffold === 'unitary_preservation')
                        matchedEq = eqKeyMap.get('complex_mult_eval');
                }
                const eqId = matchedEq ? matchedEq.id : '1';
                const eqTitle = rawTitle || (matchedEq ? matchedEq.title : 'Calculation Stencil');
                eqCount++;
                return `<eq-ref id="${eqId}" desc="${escapeAttr(eqTitle)}"></eq-ref>`;
            }
            else {
                // Inactive formal statement
                let resolvedKey = cleanScaffold;
                if (stmtAliasMap.has(resolvedKey)) {
                    resolvedKey = stmtAliasMap.get(resolvedKey);
                }
                const matchedStmt = stmtKeyMap.get(resolvedKey);
                const stmtId = matchedStmt ? matchedStmt.id : '1';
                const stmtTitle = rawTitle || (matchedStmt ? matchedStmt.title : 'Formal Statement');
                fsCount++;
                return `<fs-ref id="${stmtId}" desc="${escapeAttr(stmtTitle)}"></fs-ref>`;
            }
        });
        // 2. Transform legacy <cas-ref> and <eq-ref> tags:
        updated = updated.replace(/<(?:cas-ref|eq-ref)\s+([^>]*?)>(.*?)<\/(?:cas-ref|eq-ref)>/gis, (fullMatch, attrs, innerText) => {
            // Check if it's already in new format: <eq-ref id="X" desc="...">
            const idMatch = /\bid=["'](\d+)["']/i.exec(attrs);
            const descMatch = /\bdesc=["']([^"']*)["']/i.exec(attrs);
            if (idMatch && descMatch && fullMatch.startsWith('<eq-ref')) {
                return fullMatch; // Already aligned!
            }
            const eqIdMatch = /(?:eq-id|calc-id|preset)=["']([^"']+)["']/i.exec(attrs);
            const rawId = eqIdMatch ? eqIdMatch[1].trim() : '';
            const cleanId = rawId.toLowerCase();
            const titleMatch = /\btitle=["']([^"']+)["']/i.exec(attrs);
            let desc = descMatch ? descMatch[1] : (titleMatch ? titleMatch[1] : innerText.replace(/<[^>]*>/g, '').replace(/^[«<]+Eq:\s*/, '').replace(/[»>]+$/, '').trim());
            let resolvedKey = cleanId;
            if (eqAliasMap.has(resolvedKey)) {
                resolvedKey = eqAliasMap.get(resolvedKey);
            }
            const matchedEq = eqKeyMap.get(resolvedKey);
            const eqId = matchedEq ? matchedEq.id : (idMatch ? idMatch[1] : '17');
            if (!desc && matchedEq) {
                desc = matchedEq.title;
            }
            eqCount++;
            return `<eq-ref id="${eqId}" desc="${escapeAttr(desc || 'Equation Stencil')}"></eq-ref>`;
        });
        return { updated, eqCount, fsCount };
    }
    function escapeAttr(s) {
        return s.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    // 3. Process disk files in app1/segs/
    const files = fs.readdirSync(segsDir).filter(f => f.endsWith('.html'));
    let totalDiskEq = 0;
    let totalDiskFs = 0;
    let modifiedFiles = 0;
    for (const f of files) {
        const filePath = path.join(segsDir, f);
        const content = fs.readFileSync(filePath, 'utf8');
        const res = transformHtml(content);
        if (res.eqCount > 0 || res.fsCount > 0) {
            fs.writeFileSync(filePath, res.updated, 'utf8');
            totalDiskEq += res.eqCount;
            totalDiskFs += res.fsCount;
            modifiedFiles++;
        }
    }
    console.log(`✓ Updated ${modifiedFiles} HTML files in app1/segs/ (Transformed: ${totalDiskEq} eq-refs, ${totalDiskFs} fs-refs).`);
    // 4. Update PostgreSQL segments table
    const segRows = await client.query('SELECT id, seg_key, content_html FROM segments ORDER BY sequence_order ASC;');
    let totalDbEq = 0;
    let totalDbFs = 0;
    let updatedDbRows = 0;
    for (const seg of segRows.rows) {
        const res = transformHtml(seg.content_html);
        if (res.eqCount > 0 || res.fsCount > 0) {
            await client.query('UPDATE segments SET content_html = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;', [res.updated, seg.id]);
            totalDbEq += res.eqCount;
            totalDbFs += res.fsCount;
            updatedDbRows++;
        }
    }
    console.log(`✓ Updated ${updatedDbRows} segment rows in PostgreSQL database (Transformed: ${totalDbEq} eq-refs, ${totalDbFs} fs-refs).`);
    await client.end();
    console.log('=== [alignCustomElements] Alignment Completed Successfully ===');
}
runAlignment().catch(err => {
    console.error('[alignCustomElements] FATAL ERROR:', err);
    process.exit(1);
});
