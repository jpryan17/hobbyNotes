"use strict";
/**
 * PostgreSQL Seed Data Generator (Iteration 3: Pure Relational Architecture)
 * Normalized MWM-DB: Middle Way Math Single Source of Truth
 *
 * Conforms to strict relational standards:
 * 1. Synthetic Primary Keys on all tables (id BIGINT GENERATED ALWAYS AS IDENTITY)
 * 2. Natural keys enforced as UNIQUE
 * 3. All foreign key references point strictly to parent primary key id
 * 4. Completely flat tables:
 *    - formal_statement_segments (junction table for statement-segment pairs)
 *    - equation_preset_values (flat slot-value pairs)
 *    - equation_function_calls (caller-callee junction)
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
exports.generateSeedSqlV3 = generateSeedSqlV3;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const indexUtils_js_1 = require("./indexUtils.js");
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
function cleanTitle(raw) {
    return raw
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}
function extractTitleFromHtml(segId, html) {
    const h1Match = /<h1[^>]*>(.*?)<\/h1>/i.exec(html);
    if (h1Match && h1Match[1]) {
        return cleanTitle(h1Match[1]);
    }
    const hTitleMatch = /<font[^>]*size=["']?\+2["']?[^>]*>(?:<i>)?(?:<b>)?(.*?)(?:<\/b>)?(?:<\/i>)?<\/font>/i.exec(html);
    if (hTitleMatch && hTitleMatch[1]) {
        return cleanTitle(hTitleMatch[1]);
    }
    const h3Match = /<h3>(.*?)<\/h3>/i.exec(html);
    if (h3Match && h3Match[1]) {
        return cleanTitle(h3Match[1]);
    }
    return segId.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}
async function generateSeedSqlV3() {
    const rootDir = path.resolve(__dirname, '..', '..');
    const catalogPath = path.join(rootDir, 'clientLib', 'fsCatalog.json');
    const leanCachePath = path.join(rootDir, 'clientLib', 'leanCache.json');
    const segsFilePath = path.join(rootDir, 'app1', 'segs', 'segsFile.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    const leanCache = JSON.parse(fs.readFileSync(leanCachePath, 'utf8'));
    const segsList = JSON.parse(fs.readFileSync(segsFilePath, 'utf8'));
    const sql = [];
    sql.push(`-- =====================================================================`);
    sql.push(`-- HobbyNotes / Middle Way Mathematics`);
    sql.push(`-- Seed Data: Iteration 3 (Pure Relational Architecture)`);
    sql.push(`-- Standards: Synthetic PKs, unique natural keys, ID-based FK references, flat tables`);
    sql.push(`-- Generated At: ${new Date().toISOString()}`);
    sql.push(`-- =====================================================================\n`);
    // 0. Clean Table Reset
    sql.push(`-- 0. Clean Table Reset for Idempotent Seeding`);
    sql.push(`TRUNCATE TABLE`);
    sql.push(`  segment_references,`);
    sql.push(`  segment_prerequisites,`);
    sql.push(`  curriculum_nav_items,`);
    sql.push(`  equation_preset_values,`);
    sql.push(`  equation_presets,`);
    sql.push(`  equation_slots,`);
    sql.push(`  equation_function_calls,`);
    sql.push(`  equation_templates,`);
    sql.push(`  lean_verifications,`);
    sql.push(`  formal_statement_segments,`);
    sql.push(`  formal_statements,`);
    sql.push(`  segments,`);
    sql.push(`  apps`);
    sql.push(`RESTART IDENTITY CASCADE;\n`);
    // Key-to-ID Maps
    const appKeyToId = { app1: 1, app2: 2 };
    const segKeyToId = {};
    const navKeyToId = {};
    const stmtKeyToId = {};
    const leanKeyToId = {};
    const eqKeyToId = {};
    const slotKeyToId = {}; // `${eqKey}_${slotName}` -> slot_id
    // 1. Applications
    sql.push(`-- 1. Applications (Curriculum Targets)`);
    sql.push(`INSERT INTO apps (id, app_code, name, domain, description, is_active) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(`  (1, 'app1', 'Mathematics and the Middle Way', 'middlewaymath.app', 'The flagship 0–12 developmental curriculum from elementary logic to quantum reality.', TRUE),`);
    sql.push(`  (2, 'app2', 'Middle Way Math: Satellite Seminars', 'satellite.middlewaymath.app', 'Tertiary extensions, research masterclasses, and experimental seminars.', TRUE)`);
    sql.push(`ON CONFLICT (id) DO UPDATE SET`);
    sql.push(`  app_code = EXCLUDED.app_code,`);
    sql.push(`  name = EXCLUDED.name,`);
    sql.push(`  domain = EXCLUDED.domain,`);
    sql.push(`  description = EXCLUDED.description;\n`);
    // 2. Segments
    sql.push(`-- 2. Curricular Segments (Modular Course Chapters)`);
    const segmentInserts = [];
    segsList.forEach((item, idx) => {
        const segId = idx + 1;
        segKeyToId[item.id] = segId;
        const title = extractTitleFromHtml(item.id, item.seg);
        const slug = item.id.replace(/([A-Z])/g, '-$1').toLowerCase();
        segmentInserts.push(`  (${segId}, ${escapeSql(item.id)}, ${idx}, ${escapeSql(title)}, ${escapeSql(slug)}, ${escapeSql(item.seg)}, 'published')`);
    });
    if (segmentInserts.length > 0) {
        sql.push(`INSERT INTO segments (id, seg_key, sequence_order, title, slug, content_html, status) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(segmentInserts.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  seg_key = EXCLUDED.seg_key,`);
        sql.push(`  sequence_order = EXCLUDED.sequence_order,`);
        sql.push(`  title = EXCLUDED.title,`);
        sql.push(`  content_html = EXCLUDED.content_html;\n`);
    }
    // 3. Curriculum Navigation Outline Tree
    sql.push(`-- 3. Curriculum Navigation Outline Tree (The Course Index)`);
    function getDiagramKey(item) {
        if (item.type !== 'diagram')
            return null;
        const name = item.initCB ? item.initCB.name : '';
        const topic = (item.topic || '').toLowerCase();
        if (name.includes('Banner') || topic.includes('title'))
            return 'banner';
        if (name.includes('TTD') || topic.includes('truth table'))
            return 'ttd';
        if (name.includes('FSD') || topic.includes('formal statement'))
            return 'fsd';
        if (name.includes('EED') || topic.includes('equation evaluator'))
            return 'eed';
        if (name.includes('BTD') || topic.includes('successor tree'))
            return 'btd';
        if (name.includes('BID') || topic.includes('bayesian inference'))
            return 'bid';
        return 'diagram';
    }
    function traverse(app, items, parentId = null, prefix = `${app}_nav`, out = []) {
        items.forEach((it, idx) => {
            const rawKey = `${prefix}_${idx}`;
            const itemType = it.type || (it.indexDesc ? 'section' : 'html');
            const segKey = itemType === 'html' ? (it.htmlSegmentId || null) : null;
            const dKey = getDiagramKey(it);
            out.push({
                rawKey,
                appCode: app,
                parentRawKey: parentId,
                sequenceOrder: idx,
                itemType: itemType === 'index' ? 'section' : itemType,
                topic: it.topic || 'Untitled',
                navTopic: it.navTopic || null,
                segKey,
                diagramKey: dKey,
            });
            if (it.indexDesc && Array.isArray(it.indexDesc)) {
                traverse(app, it.indexDesc, rawKey, rawKey, out);
            }
        });
        return out;
    }
    const navRows = [];
    try {
        const app1Index = await (0, indexUtils_js_1.loadAppMainIndex)('app1');
        traverse('app1', app1Index, null, 'app1_nav', navRows);
    }
    catch (e) {
        console.warn('[genSqlSeedsV3] Warning loading app1 mainIndex:', e);
    }
    navRows.forEach((row, idx) => {
        navKeyToId[row.rawKey] = idx + 1;
    });
    const navInserts = [];
    navRows.forEach((row, idx) => {
        const nId = idx + 1;
        const appId = appKeyToId[row.appCode] || 1;
        const parentId = row.parentRawKey ? (navKeyToId[row.parentRawKey] || null) : null;
        const segId = row.segKey ? (segKeyToId[row.segKey] || null) : null;
        navInserts.push(`  (${nId}, ${escapeSql(row.rawKey)}, ${appId}, ${parentId !== null ? parentId : 'NULL'}, ` +
            `${segId !== null ? segId : 'NULL'}, ${row.sequenceOrder}, ${escapeSql(row.itemType)}, ` +
            `${escapeSql(row.topic)}, ${escapeSql(row.navTopic)}, ${escapeSql(row.diagramKey)}, NULL, NULL, TRUE)`);
    });
    if (navInserts.length > 0) {
        sql.push(`INSERT INTO curriculum_nav_items (`);
        sql.push(`  id, nav_key, app_id, parent_id, segment_id, sequence_order, item_type, topic, nav_topic, diagram_key, diagram_path, notes, is_active`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(navInserts.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  nav_key = EXCLUDED.nav_key,`);
        sql.push(`  parent_id = EXCLUDED.parent_id,`);
        sql.push(`  topic = EXCLUDED.topic,`);
        sql.push(`  segment_id = EXCLUDED.segment_id,`);
        sql.push(`  diagram_key = EXCLUDED.diagram_key;\n`);
    }
    // 4. Formal Statements
    sql.push(`-- 4. Middle Way Math Formal Statements (The Axiomatic Engine)`);
    const statementInserts = [];
    const formalStmts = catalog.formalStatements || [];
    const stmtSegmentPairs = [];
    formalStmts.forEach((st, idx) => {
        const sId = idx + 1;
        stmtKeyToId[st.key] = sId;
        const scaffoldKey = st.scaffoldKey || st.key;
        const title = st.title || st.name || st.key;
        const desc = st.description || '';
        const expr = st.expression || st.statement || '';
        const signature = st.leanSignature || '';
        const category = st.domainCategory || 'discrete_analysis';
        const type = st.type === 'physics' ? 'physics' : (st.type === 'information' ? 'information' : 'math');
        const tier = ['constitutional', 'axiom', 'theorem', 'scenario', 'corollary', 'law'].includes(st.tier) ? st.tier : 'theorem';
        const seed = ['conway_cut', 'shadow_map', 'boundary_law'].includes(st.governingSeed) ? escapeSql(st.governingSeed) : 'NULL';
        statementInserts.push(`  (${sId}, ${escapeSql(st.key)}, ${escapeSql(scaffoldKey)}, ${escapeSql(category)}, NULL, '${type}', '${tier}', ` +
            `${seed}, ${escapeSql(title)}, ${escapeSql(desc)}, ${escapeSql(expr)}, ${escapeSql(signature)}, NULL, 'published')`);
        // Track normalized statement <-> segment junction
        const refSegs = st.referencedSegments || [];
        refSegs.forEach((segKey) => {
            const segId = segKeyToId[segKey];
            if (segId) {
                stmtSegmentPairs.push({ statementId: sId, segmentId: segId });
            }
        });
    });
    if (statementInserts.length > 0) {
        sql.push(`INSERT INTO formal_statements (`);
        sql.push(`  id, statement_key, scaffold_key, domain_category, parent_id, type, tier, governing_seed, `);
        sql.push(`  title, description, expression, lean_signature, lean_snippet, status`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(statementInserts.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  statement_key = EXCLUDED.statement_key,`);
        sql.push(`  title = EXCLUDED.title,`);
        sql.push(`  expression = EXCLUDED.expression,`);
        sql.push(`  lean_signature = EXCLUDED.lean_signature;\n`);
    }
    // 5. Formal Statement Segments (Normalized Flat Junction Table)
    if (stmtSegmentPairs.length > 0) {
        sql.push(`-- 5. Formal Statement Segments (Normalized Junction Table)`);
        const fssInserts = [];
        const seenPairs = new Set();
        let fssId = 0;
        stmtSegmentPairs.forEach((pair) => {
            const pairKey = `${pair.statementId}_${pair.segmentId}`;
            if (!seenPairs.has(pairKey)) {
                seenPairs.add(pairKey);
                fssId++;
                fssInserts.push(`  (${fssId}, ${pair.statementId}, ${pair.segmentId})`);
            }
        });
        if (fssInserts.length > 0) {
            sql.push(`INSERT INTO formal_statement_segments (id, statement_id, segment_id) OVERRIDING SYSTEM VALUE VALUES`);
            sql.push(fssInserts.join(',\n'));
            sql.push(`ON CONFLICT (statement_id, segment_id) DO NOTHING;\n`);
        }
    }
    // 6. Lean 4 Kernel Proof Verifications
    sql.push(`-- 6. Lean 4 Kernel Proof Verifications`);
    const leanInserts = [];
    let leanId = 0;
    for (const [key, v] of Object.entries(leanCache)) {
        leanId++;
        leanKeyToId[key] = leanId;
        const target = v.target || key;
        const expr = v.expression || '';
        const sig = v.signature || '';
        const verdict = v.verdict !== false;
        const qed = v.qed !== false;
        const timeMs = v.timeMs || 0;
        const engine = v.engine || 'Lean 4.17.0-rc1';
        const summary = v.summary || '';
        const snippet = v.leanSnippet || '';
        // Match to formal statement ID if present
        const matchingStmt = formalStmts.find((st) => st.key === key || st.scaffoldKey === key || key.startsWith(st.key));
        const stmtIdSql = matchingStmt && stmtKeyToId[matchingStmt.key] ? stmtKeyToId[matchingStmt.key].toString() : 'NULL';
        leanInserts.push(`  (${leanId}, ${escapeSql(key)}, ${stmtIdSql}, ${escapeSql(target)}, ${escapeSql(expr)}, ${escapeSql(sig)}, ` +
            `${verdict ? 'TRUE' : 'FALSE'}, ${qed ? 'TRUE' : 'FALSE'}, ${timeMs}, ${escapeSql(engine)}, CURRENT_TIMESTAMP, ` +
            `${escapeSql(snippet)}, ${escapeSql(summary)})`);
    }
    if (leanInserts.length > 0) {
        sql.push(`INSERT INTO lean_verifications (`);
        sql.push(`  id, theorem_key, statement_id, target, expression, signature, verdict, qed, time_ms, engine, verified_at, lean_snippet, summary`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(leanInserts.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  theorem_key = EXCLUDED.theorem_key,`);
        sql.push(`  verdict = EXCLUDED.verdict,`);
        sql.push(`  qed = EXCLUDED.qed,`);
        sql.push(`  statement_id = EXCLUDED.statement_id;\n`);
    }
    // 7. Equation Evaluator Templates (EED / Nonstandard Rules)
    sql.push(`-- 7. Equation Evaluator Templates (EED / Nonstandard Rules)`);
    const rawPresets = {
        nucleus_halo_1d: {
            id: "nucleus_halo_1d",
            title: "1D Nucleus-Halo Decomposition",
            statementKey: "fs_nucleus_halo_1d",
            governingTheorem: "nucleus_halo_decomposition",
            lhsFormula: "x0 + k * dx",
            rhsSymbol: "y",
            rhsDomain: "ℝ_ω",
            description: "Decomposes any finite hyperreal into its standard real nucleus shadow st(y) and Day ω halo dust.",
            hardRuleExpr: "x0",
            dustRuleExpr: "k * dx",
            inputs: [
                { name: "x0", symbol: "x₀", domain: "ℝ", defaultValue: 4.0, step: 0.5, min: -100, max: 100, description: "Standard real nucleus shadow (st(y))" },
                { name: "k", symbol: "k", domain: "ℤ", defaultValue: 3, step: 1, min: -50, max: 50, description: "Infinitesimal halo step multiplier (dx = 1/ω)" }
            ],
            presets: [
                { key: "ex_nucleus_halo_default", title: "Standard Hyperreal Point 4.0 + 3·dx", values: { x0: 4.0, k: 3 }, display: "4.0 + 3·dx", hard: "4.0", dust: "3·dx" }
            ]
        },
        complex_halo_2d: {
            id: "complex_halo_2d",
            title: "2D Complex Halo Decomposition",
            statementKey: "fs_complex_halo_2d",
            governingTheorem: "nucleus_halo_decomposition",
            lhsFormula: "(x0 + k_x * dx) + i * (y0 + k_y * dx)",
            rhsSymbol: "z",
            rhsDomain: "ℂ_ω",
            description: "Evaluates a 2D complex point into its Gaussian dyadic nucleus and transfinite halo soup.",
            hardRuleExpr: "x0 + i * y0",
            dustRuleExpr: "kx * dx + i * ky * dx",
            inputs: [
                { name: "x0", symbol: "x₀", domain: "ℝ", defaultValue: 3.0, step: 0.5, min: -50, max: 50, description: "Real coordinate nucleus" },
                { name: "y0", symbol: "y₀", domain: "ℝ", defaultValue: 2.0, step: 0.5, min: -50, max: 50, description: "Imaginary coordinate nucleus" },
                { name: "kx", symbol: "k_x", domain: "ℤ", defaultValue: 4, step: 1, min: -20, max: 20, description: "Real halo step multiplier" },
                { name: "ky", symbol: "k_y", domain: "ℤ", defaultValue: -1, step: 1, min: -20, max: 20, description: "Imaginary halo step multiplier" }
            ],
            presets: [
                { key: "ex_complex_halo_default", title: "Gaussian Dyadic Node (3.0, 2.0) + (4, -1)·dx", values: { x0: 3.0, y0: 2.0, kx: 4, ky: -1 }, display: "(3 + 4·dx) + i·(2 - dx)", hard: "3.0 + 2.0i", dust: "4·dx - i·dx" }
            ]
        },
        newton_accel: {
            id: "newton_accel",
            title: "Newtonian Kinematic Acceleration Invariant",
            statementKey: "fs_free_fall_accel",
            governingTheorem: "newtonian_mechanics",
            lhsFormula: "[ s(t - dt) - 2s(t) + s(t + dt) ] / dt^2",
            rhsSymbol: "a",
            rhsDomain: "ℝ",
            description: "Evaluates the second discrete difference stencil on parabolic free fall to reveal the exact acceleration invariant -g.",
            hardRuleExpr: "-g",
            dustRuleExpr: "0",
            inputs: [
                { name: "g", symbol: "g", domain: "ℝ", defaultValue: 9.8, step: 0.1, min: 0, max: 50, description: "Gravitational acceleration" },
                { name: "v0", symbol: "v₀", domain: "ℝ", defaultValue: 20.0, step: 1.0, min: -100, max: 100, description: "Initial launch velocity" },
                { name: "t", symbol: "t", domain: "ℝ", defaultValue: 2.0, step: 0.5, min: 0, max: 20, description: "Flight observation time" }
            ],
            presets: [
                { key: "ex_earth_free_fall", title: "Earth Gravity Stencil (g = 9.8)", values: { g: 9.8, v0: 20.0, t: 2.0 }, display: "-9.8 m/s²", hard: "-9.8", dust: "0" }
            ]
        },
        bayes_filter: {
            id: "bayes_filter",
            title: "3-Stage Bayesian Filter",
            statementKey: "fs_bayes_filter",
            governingTheorem: "bayes_filter_normalization",
            lhsFormula: "(P(D|H) * P(H)) / (P(D|H)*P(H) + P(D|¬H)*P(¬H))",
            rhsSymbol: "P(H|D)",
            rhsDomain: "ℝ",
            description: "Evaluates normalized posterior probability given prior belief and evidence likelihood.",
            hardRuleExpr: "(sens * prior) / (sens * prior + fpr * (1 - prior))",
            dustRuleExpr: "0",
            inputs: [
                { name: "prior", symbol: "P(H)", domain: "ℝ", defaultValue: 0.01, step: 0.01, min: 0.001, max: 0.999, description: "Prior base rate" },
                { name: "sens", symbol: "P(D|H)", domain: "ℝ", defaultValue: 0.95, step: 0.05, min: 0.01, max: 1.0, description: "Sensitivity / true positive rate" },
                { name: "fpr", symbol: "P(D|¬H)", domain: "ℝ", defaultValue: 0.05, step: 0.01, min: 0.001, max: 0.999, description: "False positive rate" }
            ],
            presets: [
                { key: "ex_rare_disease_screen", title: "Rare Medical Screen (1% base rate, 95% sensitivity)", values: { prior: 0.01, sens: 0.95, fpr: 0.05 }, display: "0.1610 (16.1%)", hard: "0.1610", dust: "0" }
            ]
        }
    };
    const eqTemplateInserts = [];
    const eqSlotInserts = [];
    const eqPresetInserts = [];
    const eqPresetValInserts = [];
    let eqTplId = 0;
    let eqSlotId = 0;
    let eqPresetId = 0;
    let eqPresetValId = 0;
    for (const [eqKey, spec] of Object.entries(rawPresets)) {
        eqTplId++;
        eqKeyToId[eqKey] = eqTplId;
        const leanId = leanKeyToId[spec.governingTheorem] ? leanKeyToId[spec.governingTheorem].toString() : 'NULL';
        const stmtId = stmtKeyToId[spec.statementKey] ? stmtKeyToId[spec.statementKey].toString() : 'NULL';
        eqTemplateInserts.push(`  (${eqTplId}, ${escapeSql(eqKey)}, ${stmtId}, ${leanId}, ${escapeSql(spec.title)}, ` +
            `${escapeSql(spec.lhsFormula)}, ${escapeSql(spec.rhsSymbol)}, ${escapeSql(spec.rhsDomain)}, ` +
            `${escapeSql(spec.description)}, TRUE, ${escapeSql(spec.hardRuleExpr)}, ${escapeSql(spec.dustRuleExpr)})`);
        spec.inputs.forEach((slot, sIdx) => {
            eqSlotId++;
            slotKeyToId[`${eqKey}_${slot.name}`] = eqSlotId;
            eqSlotInserts.push(`  (${eqSlotId}, ${eqTplId}, ${sIdx}, ${escapeSql(slot.name)}, ${escapeSql(slot.symbol)}, ` +
                `${escapeSql(slot.domain)}, NULL, ${slot.defaultValue}, ${slot.step || 1}, ` +
                `${slot.min !== undefined ? slot.min : 'NULL'}, ${slot.max !== undefined ? slot.max : 'NULL'}, ${escapeSql(slot.description || '')})`);
        });
        if (spec.presets && Array.isArray(spec.presets)) {
            spec.presets.forEach((p) => {
                eqPresetId++;
                const pId = eqPresetId;
                eqPresetInserts.push(`  (${pId}, ${escapeSql(p.key)}, ${eqTplId}, ${escapeSql(p.title)}, ${escapeSql(p.display)}, ` +
                    `${escapeSql(p.hard)}, ${escapeSql(p.dust)}, NULL)`);
                // Normalized flat preset values
                for (const [sName, sVal] of Object.entries(p.values)) {
                    const sId = slotKeyToId[`${eqKey}_${sName}`];
                    if (sId) {
                        eqPresetValId++;
                        eqPresetValInserts.push(`  (${eqPresetValId}, ${pId}, ${sId}, ${sVal})`);
                    }
                }
            });
        }
    }
    if (eqTemplateInserts.length > 0) {
        sql.push(`INSERT INTO equation_templates (`);
        sql.push(`  id, eq_key, statement_id, lean_verification_id, title, lhs_formula, rhs_symbol, rhs_domain, description, is_preset, hard_rule_expr, dust_rule_expr`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(eqTemplateInserts.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  eq_key = EXCLUDED.eq_key,`);
        sql.push(`  title = EXCLUDED.title,`);
        sql.push(`  lhs_formula = EXCLUDED.lhs_formula,`);
        sql.push(`  rhs_domain = EXCLUDED.rhs_domain;\n`);
    }
    if (eqSlotInserts.length > 0) {
        sql.push(`-- 8. Equation Slots (Input Variable Parameter Specs)`);
        sql.push(`INSERT INTO equation_slots (`);
        sql.push(`  id, equation_template_id, slot_order, slot_name, symbol, domain, unit, default_value, step_val, min_val, max_val, description`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(eqSlotInserts.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  symbol = EXCLUDED.symbol,`);
        sql.push(`  default_value = EXCLUDED.default_value,`);
        sql.push(`  step_val = EXCLUDED.step_val;\n`);
    }
    if (eqPresetInserts.length > 0) {
        sql.push(`-- 9. Equation Presets (Grounding Concrete Scenarios)`);
        sql.push(`INSERT INTO equation_presets (`);
        sql.push(`  id, preset_key, equation_template_id, title, display_result, hard_part, dust_part, notes`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(eqPresetInserts.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  title = EXCLUDED.title,`);
        sql.push(`  display_result = EXCLUDED.display_result;\n`);
    }
    if (eqPresetValInserts.length > 0) {
        sql.push(`-- 10. Equation Preset Values (Normalized Flat Parameter Values)`);
        sql.push(`INSERT INTO equation_preset_values (`);
        sql.push(`  id, preset_id, slot_id, numeric_value`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(eqPresetValInserts.join(',\n'));
        sql.push(`ON CONFLICT (preset_id, slot_id) DO UPDATE SET`);
        sql.push(`  numeric_value = EXCLUDED.numeric_value;\n`);
    }
    // 11. Relational Segment References (<eq-ref>, <fsd-ref>, <ttd-ref>)
    sql.push(`-- 11. Relational Segment References (Embedded Interactive Tags)`);
    const segmentRefs = [];
    let refId = 0;
    segsList.forEach((item) => {
        const html = item.seg;
        const segKey = item.id;
        const segId = segKeyToId[segKey] || 1;
        let occ = 0;
        // Search for <eq-ref ...>
        const eqRegex = /<eq-ref\s+([^>]*?)>([\s\S]*?)<\/eq-ref>/gi;
        let match;
        while ((match = eqRegex.exec(html)) !== null) {
            occ++;
            refId++;
            const attrs = match[1];
            const anchor = cleanTitle(match[2]);
            const eqIdMatch = /eq-id=["']([^"']+)["']/i.exec(attrs);
            const targetIdentifier = eqIdMatch ? eqIdMatch[1] : 'custom_eq';
            const refKey = `${segKey}_eq_${occ}`;
            const eqTplId = eqKeyToId[targetIdentifier] ? eqKeyToId[targetIdentifier].toString() : 'NULL';
            segmentRefs.push(`  (${refId}, ${escapeSql(refKey)}, ${segId}, NULL, ${eqTplId}, 'eq', ${escapeSql(targetIdentifier)}, ${occ}, ${escapeSql(anchor)}, ${escapeSql(match[0])})`);
        }
        // Search for <fsd-ref ...>
        const fsdRegex = /<fsd-ref\s+([^>]*?)>([\s\S]*?)<\/fsd-ref>/gi;
        while ((match = fsdRegex.exec(html)) !== null) {
            occ++;
            refId++;
            const attrs = match[1];
            const anchor = cleanTitle(match[2]);
            const fsIdMatch = /scaffold-key=["']([^"']+)["']/i.exec(attrs) || /statement-key=["']([^"']+)["']/i.exec(attrs);
            const targetIdentifier = fsIdMatch ? fsIdMatch[1] : 'fs_unknown';
            const refKey = `${segKey}_fsd_${occ}`;
            const stmtId = stmtKeyToId[targetIdentifier] ? stmtKeyToId[targetIdentifier].toString() : 'NULL';
            segmentRefs.push(`  (${refId}, ${escapeSql(refKey)}, ${segId}, ${stmtId}, NULL, 'fsd', ${escapeSql(targetIdentifier)}, ${occ}, ${escapeSql(anchor)}, ${escapeSql(match[0])})`);
        }
        // Search for <ttd-ref ...>
        const ttdRegex = /<ttd-ref\s+([^>]*?)>([\s\S]*?)<\/ttd-ref>/gi;
        while ((match = ttdRegex.exec(html)) !== null) {
            occ++;
            refId++;
            const attrs = match[1];
            const anchor = cleanTitle(match[2]);
            const exprMatch = /expr=["']([^"']+)["']/i.exec(attrs);
            const targetIdentifier = exprMatch ? exprMatch[1] : 'ttd_expr';
            const refKey = `${segKey}_ttd_${occ}`;
            segmentRefs.push(`  (${refId}, ${escapeSql(refKey)}, ${segId}, NULL, NULL, 'ttd', ${escapeSql(targetIdentifier)}, ${occ}, ${escapeSql(anchor)}, ${escapeSql(match[0])})`);
        }
    });
    if (segmentRefs.length > 0) {
        sql.push(`INSERT INTO segment_references (`);
        sql.push(`  id, ref_key, segment_id, statement_id, equation_template_id, ref_type, target_identifier, occurrence_order, anchor_text, raw_tag`);
        sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(segmentRefs.join(',\n'));
        sql.push(`ON CONFLICT (id) DO UPDATE SET`);
        sql.push(`  ref_key = EXCLUDED.ref_key,`);
        sql.push(`  target_identifier = EXCLUDED.target_identifier,`);
        sql.push(`  anchor_text = EXCLUDED.anchor_text;\n`);
    }
    // 12. Pedagogical Learning Graph (Segment Prerequisites)
    sql.push(`-- 12. Pedagogical Learning Graph (Segment Prerequisites)`);
    const prereqInserts = [];
    let prereqId = 0;
    for (let i = 1; i < segsList.length; i++) {
        prereqId++;
        const curSegId = segKeyToId[segsList[i].id];
        const prevSegId = segKeyToId[segsList[i - 1].id];
        if (curSegId && prevSegId) {
            prereqInserts.push(`  (${prereqId}, ${curSegId}, ${prevSegId}, 'foundational')`);
        }
    }
    if (prereqInserts.length > 0) {
        sql.push(`INSERT INTO segment_prerequisites (id, segment_id, depends_on_segment_id, prerequisite_type) OVERRIDING SYSTEM VALUE VALUES`);
        sql.push(prereqInserts.join(',\n'));
        sql.push(`ON CONFLICT (segment_id, depends_on_segment_id) DO NOTHING;\n`);
    }
    return sql.join('\n');
}
// Standalone CLI execution
if (process.argv[1] && process.argv[1].includes('genSqlSeeds_v3')) {
    generateSeedSqlV3()
        .then((sql) => {
        const rootDir = path.resolve(__dirname, '..', '..');
        const outputPath = path.join(rootDir, 'db', 'seed_v3.sql');
        fs.writeFileSync(outputPath, sql, 'utf8');
        console.log(`[genSqlSeedsV3] Generated seed_v3.sql at: ${outputPath} (${(sql.length / 1024).toFixed(1)} KB)`);
    })
        .catch((err) => {
        console.error('[genSqlSeedsV3 Error]', err);
        process.exit(1);
    });
}
