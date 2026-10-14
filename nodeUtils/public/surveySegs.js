"use strict";
/**
 * Curricular Segment Tag Survey & Migration Utility
 *
 * Scans all 52+ curricular HTML segments in app1/segs, discovers legacy and
 * inconsistent tags (<eq-ref>, <pseudo-ref>, <fs-ref id="1"> placeholders),
 * maps them to authoritative formal_statements.id from the database schema,
 * and optionally applies the migration in-place.
 *
 * Usage:
 *   npx ts-node nodeUtils/surveySegs.ts          # Survey / Dry-Run Report
 *   npx ts-node nodeUtils/surveySegs.ts --apply  # In-place Migration
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
exports.surveySegments = surveySegments;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Load FS_CATALOG from JSON
const rootDir = path.resolve(__dirname, '../../');
const catalogPath = path.resolve(rootDir, 'clientLib/fsCatalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const formalStatements = catalog.formalStatements || [];
const calculationModes = catalog.calculationModes || [];
// Map equation id -> formal statement id via equation_statement_links logic
const equationToStatementMap = {
    1: 2, // ff_v_from_v0_g_t -> fs_free_fall_accel (#2)
    2: 2, // ff_t_from_v_v0_g -> fs_free_fall_accel (#2)
    3: 2, // ff_s_from_v0_g_t -> fs_free_fall_accel (#2)
    4: 4, // we_ke_from_m_v -> fs_work_energy (#4)
    5: 4, // we_v_from_ke_m -> fs_work_energy (#4)
    6: 5, // diff_heat_step -> fs_heat_flux (#5)
    7: 7, // complex_mult_eval -> fs_complex_arithmetic (#7)
    8: 12, // polarizer_transmission -> fs_three_polarizer (#12)
    9: 14, // bayes_posterior -> fs_bayes_updating (#14)
    10: 15, // scale_reciprocity_eval -> fs_scale_reciprocity (#15)
    11: 6, // diff_x4_st -> fs_quartic_diff (#6)
    12: 16, // ivt_root_bisection -> fs_discrete_ivt (#16)
    13: 18, // trig_dyadic_angle -> fs_dyadic_angle_bisection (#18)
    14: 19, // polygonal_horn_chord -> fs_polygonal_horn_chord (#19)
    15: 20, // trig_dyadic_sine -> fs_sin_dyadic_bisection (#20)
    16: 21, // sin_rotor_projection -> fs_sin_rotor_projection (#21)
    17: 17, // nucleus_halo -> fs_nucleus_halo_decomposition (#17)
};
// Map pseudocode algo key -> formal statement id
const algoToStatementMap = {
    'conway_add': 22,
    'conway_mul': 22,
    'conway_order': 22,
    'conway_sort': 22,
    'conway_sub': 22,
    'kinematics_step': 2,
    'laplacian_heat_step': 5,
    'bayes_discrete_update': 14,
    'rotor_trig_cordic': 21,
    'cordic_angle': 18
};
// Fuzzy match description text to statement id
function resolveStatementByDesc(desc) {
    const d = desc.toLowerCase().trim();
    if (d.includes('dyadic tree sine') || d.includes('dyadic sine'))
        return 20;
    if (d.includes('rotor group sine') || d.includes('unit rotor sine') || d.includes('rotor projection'))
        return 21;
    if (d.includes('dyadic angle') || d.includes('rotor generation') || d.includes('half-angle') || d.includes('angle generator') || d.includes('ptolemaic'))
        return 18;
    if (d.includes('chord') || d.includes('horn rim') || d.includes('rim chord'))
        return 19;
    if (d.includes('intermediate value') || d.includes('ivt') || d.includes('root isolation') || d.includes('grid march for f(x)'))
        return 16;
    if (d.includes('telescoping') && (d.includes('ftc') || d.includes('calculus') || d.includes('fundamental theorem') || d.includes('boundary flux') || d.includes('total thermal energy') || d.includes('telescoping sum')))
        return 3;
    if (d.includes('free fall') || d.includes('gravitational acceleration') || d.includes('kinematics'))
        return 2;
    if (d.includes('work') && d.includes('energy'))
        return 4;
    if (d.includes('toeplitz') || d.includes('heat flux') || d.includes('thermal') || d.includes('laplacian'))
        return 5;
    if (d.includes('quartic') || d.includes('second derivative') || d.includes('curvature') || d.includes('Δf = (x + k·dx)'))
        return 6;
    if (d.includes('complex') && (d.includes('step') || d.includes('grid') || d.includes('arithmetic') || d.includes('cauchy') || d.includes('modulus')))
        return 7;
    if (d.includes('cauchy-riemann') || d.includes('conformal'))
        return 8;
    if (d.includes('residue') || d.includes('vortex'))
        return 9;
    if (d.includes('lee-yang') || d.includes('phase transition'))
        return 10;
    if (d.includes('unitary') || d.includes('norm isometry') || d.includes('isometry') || d.includes('norm invariance') || d.includes('norm conservation') || d.includes('superposition') || d.includes('bilinear pairing') || d.includes('leapfrog'))
        return 11;
    if (d.includes('polarizer') || d.includes('born') || d.includes('born probability') || d.includes('distributivity'))
        return 12;
    if (d.includes('probability measure') || d.includes('discrete probability'))
        return 13;
    if (d.includes('bayes') || d.includes('bayesian') || d.includes('p(h|d)'))
        return 14;
    if (d.includes('scale reciprocity') || d.includes('scale horizon') || d.includes('ω · dx'))
        return 15;
    if (d.includes('halo') || d.includes('nucleus') || d.includes('x = x₀') || d.includes('standard part'))
        return 17;
    if (d.includes('dyadic isomorphism') || d.includes('tree2') || d.includes('conway add') || d.includes('conway mul') || d.includes('conway order') || d.includes('conway sort'))
        return 22;
    if (d.includes('van den dries') || d.includes('ehrlich') || d.includes('subfield') || d.includes('eps0'))
        return 23;
    return null;
}
function surveySegments(applyFix = false) {
    const segsDir = path.resolve(rootDir, 'app1/segs');
    const files = fs.readdirSync(segsDir).filter(f => f.endsWith('.html'));
    const findings = [];
    let filesModified = 0;
    let totalTagsReplaced = 0;
    for (const file of files) {
        const fullPath = path.join(segsDir, file);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        let fileChanged = false;
        let newContent = content;
        lines.forEach((lineText, lineIdx) => {
            // 1. Check <eq-ref ...>
            const eqMatches = Array.from(lineText.matchAll(/<eq-ref\b([^>]*?)>(.*?)<\/eq-ref>/gi));
            for (const m of eqMatches) {
                const fullMatch = m[0];
                const attrs = m[1];
                const idMatch = attrs.match(/\b(?:id|eq-id)=["']([^"']+)["']/i);
                const descMatch = attrs.match(/\bdesc=["']([^"']+)["']/i);
                const currentId = idMatch ? idMatch[1].trim() : '';
                const currentDesc = descMatch ? descMatch[1].trim() : '';
                let targetStmtId = null;
                let confidence = 'direct';
                if (currentDesc) {
                    const descMatch = resolveStatementByDesc(currentDesc);
                    if (descMatch) {
                        targetStmtId = descMatch;
                        confidence = 'fuzzy_desc';
                    }
                }
                if (!targetStmtId && /^\d+$/.test(currentId)) {
                    const num = parseInt(currentId, 10);
                    if (equationToStatementMap[num]) {
                        targetStmtId = equationToStatementMap[num];
                        confidence = 'equation_link';
                    }
                    else if (num >= 1 && num <= formalStatements.length) {
                        targetStmtId = num;
                        confidence = 'direct';
                    }
                }
                const finalId = targetStmtId || currentId;
                const stmtObj = formalStatements.find(s => s.numId === finalId);
                const finalDesc = currentDesc || stmtObj?.title || 'Active Formal Calculation';
                findings.push({
                    file,
                    line: lineIdx + 1,
                    tagType: 'eq-ref',
                    rawTag: fullMatch,
                    currentId,
                    currentDesc,
                    proposedId: finalId,
                    proposedDesc: finalDesc,
                    confidence
                });
                if (applyFix) {
                    const newTag = `<fs-ref id="${finalId}" desc="${finalDesc}"></fs-ref>`;
                    newContent = newContent.replace(fullMatch, newTag);
                    fileChanged = true;
                    totalTagsReplaced++;
                }
            }
            // 2. Check <pseudo-ref ...>
            const pseudoMatches = Array.from(lineText.matchAll(/<pseudo-ref\b([^>]*?)>(.*?)<\/pseudo-ref>/gi));
            for (const m of pseudoMatches) {
                const fullMatch = m[0];
                const attrs = m[1];
                const innerText = m[2].trim();
                const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
                const currentId = idMatch ? idMatch[1].trim() : '';
                const targetStmtId = algoToStatementMap[currentId] || resolveStatementByDesc(innerText) || 22;
                const stmtObj = formalStatements.find(s => s.numId === targetStmtId);
                const finalDesc = innerText || stmtObj?.title || 'Discrete Machine Algorithm';
                findings.push({
                    file,
                    line: lineIdx + 1,
                    tagType: 'pseudo-ref',
                    rawTag: fullMatch,
                    currentId,
                    currentDesc: innerText,
                    proposedId: targetStmtId,
                    proposedDesc: finalDesc,
                    confidence: 'algo_link'
                });
                if (applyFix) {
                    const newTag = `<fs-ref id="${targetStmtId}" desc="${finalDesc}"></fs-ref>`;
                    newContent = newContent.replace(fullMatch, newTag);
                    fileChanged = true;
                    totalTagsReplaced++;
                }
            }
            // 3. Check <fs-ref id="1" ...> placeholders
            const fsMatches = Array.from(lineText.matchAll(/<fs-ref\b([^>]*?)>(.*?)<\/fs-ref>/gi));
            for (const m of fsMatches) {
                const fullMatch = m[0];
                const attrs = m[1];
                const idMatch = attrs.match(/\bid=["']([^"']+)["']/i);
                const descMatch = attrs.match(/\bdesc=["']([^"']+)["']/i);
                const currentId = idMatch ? idMatch[1].trim() : '';
                const currentDesc = descMatch ? descMatch[1].trim() : '';
                if (currentId === '1' && currentDesc) {
                    const betterId = resolveStatementByDesc(currentDesc);
                    if (betterId && betterId !== 1) {
                        findings.push({
                            file,
                            line: lineIdx + 1,
                            tagType: 'fs-ref',
                            rawTag: fullMatch,
                            currentId,
                            currentDesc,
                            proposedId: betterId,
                            proposedDesc: currentDesc,
                            confidence: 'fuzzy_desc'
                        });
                        if (applyFix) {
                            const newTag = `<fs-ref id="${betterId}" desc="${currentDesc}"></fs-ref>`;
                            newContent = newContent.replace(fullMatch, newTag);
                            fileChanged = true;
                            totalTagsReplaced++;
                        }
                    }
                }
            }
        });
        if (applyFix && fileChanged) {
            fs.writeFileSync(fullPath, newContent, 'utf8');
            filesModified++;
        }
    }
    // Summary Report
    console.log(`\n========================================================================`);
    console.log(`CURRICULAR SEGMENT CUSTOM ELEMENT SURVEY REPORT`);
    console.log(`========================================================================`);
    console.log(`Total Findings Discovered: ${findings.length}`);
    console.log(`  - <eq-ref> to translate:      ${findings.filter(f => f.tagType === 'eq-ref').length}`);
    console.log(`  - <pseudo-ref> to translate:  ${findings.filter(f => f.tagType === 'pseudo-ref').length}`);
    console.log(`  - <fs-ref id="1"> corrected:  ${findings.filter(f => f.tagType === 'fs-ref').length}`);
    console.log(`------------------------------------------------------------------------`);
    console.log(`\nAll Mappings:`);
    findings.forEach((f, idx) => {
        console.log(`${idx + 1}. [${f.file}:${f.line}] ${f.tagType} id="${f.currentId}" ("${f.currentDesc.slice(0, 45)}") ⟹ <fs-ref id="${f.proposedId}" desc="${f.proposedDesc.slice(0, 45)}"> [${f.confidence}]`);
    });
    if (applyFix) {
        console.log(`\n[APPLIED MIGRATION] Modified ${filesModified} files and updated ${totalTagsReplaced} tags to unified <fs-ref id="X"> format.`);
    }
    else {
        console.log(`\nDry run complete. To apply changes in-place across all segments, run:\n  node nodeUtils/public/surveySegs.js --apply`);
    }
}
if (require.main === module) {
    const args = process.argv.slice(2);
    const applyFix = args.includes('--apply');
    surveySegments(applyFix);
}
