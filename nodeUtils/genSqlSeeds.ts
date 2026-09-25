/**
 * PostgreSQL Seed Data Generator (Iteration 2: Refined Conceptual Architecture)
 * Normalized MWM-DB: Middle Way Math Single Source of Truth
 *
 * Reads:
 * 1. fsCatalog.json (clientLib/fsCatalog.json)
 * 2. leanCache.json (clientLib/leanCache.json)
 * 3. maximaCache.json (clientLib/maximaCache.json)
 * 4. segsFile.json (app1/segs/segsFile.json)
 *
 * Compiles an idempotent, fully normalized seed script (db/seed_v2.sql)
 * with all 52 segments, navigation outline tree, apps, embedded reference links,
 * MWM statements, calculation modes, slots, presets, proof caches,
 * and studio workspaces.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadAppMainIndex } from './indexUtils.js';

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return isFinite(val) ? val.toString() : 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const str = String(val).replace(/'/g, "''");
  return `'${str}'`;
}

function escapeJson(val: any): string {
  if (val === null || val === undefined) return "'{}'::jsonb";
  const jsonStr = JSON.stringify(val).replace(/'/g, "''");
  return `'${jsonStr}'::jsonb`;
}

function escapeTextArray(arr: string[] | undefined | null): string {
  if (!arr || arr.length === 0) return "'{}'::text[]";
  const elements = arr.map(s => `'${s.replace(/'/g, "''")}'`).join(', ');
  return `ARRAY[${elements}]::text[]`;
}

function cleanTitle(raw: string): string {
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

function extractTitleFromHtml(segId: string, html: string): string {
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

export async function generateSeedSql(): Promise<string> {
  const rootDir = path.resolve(__dirname, '..', '..');
  const catalogPath = path.join(rootDir, 'clientLib', 'fsCatalog.json');
  const leanCachePath = path.join(rootDir, 'clientLib', 'leanCache.json');
  const maximaCachePath = path.join(rootDir, 'clientLib', 'maximaCache.json');
  const segsFilePath = path.join(rootDir, 'app1', 'segs', 'segsFile.json');

  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  const leanCache = JSON.parse(fs.readFileSync(leanCachePath, 'utf8'));
  const maximaCache = JSON.parse(fs.readFileSync(maximaCachePath, 'utf8'));
  const segsList: { id: string; seg: string }[] = JSON.parse(fs.readFileSync(segsFilePath, 'utf8'));

  const sql: string[] = [];

  sql.push(`-- =====================================================================`);
  sql.push(`-- HobbyNotes / Middle Way Mathematics`);
  sql.push(`-- Seed Data: Iteration 2 (Refined Conceptual Architecture)`);
  sql.push(`-- Normalized MWM-DB: Middle Way Math Single Source of Truth`);
  sql.push(`-- Generated At: ${new Date().toISOString()}`);
  sql.push(`-- =====================================================================\n`);

  // 0. Clean Table Reset for Idempotent Seeding
  sql.push(`-- 0. Clean Table Reset for Idempotent Seeding`);
  sql.push(`TRUNCATE TABLE`);
  sql.push(`  segment_references,`);
  sql.push(`  segment_prerequisites,`);
  sql.push(`  curriculum_nav_items,`);
  sql.push(`  verified_presets,`);
  sql.push(`  mode_slots,`);
  sql.push(`  calculation_modes,`);
  sql.push(`  parameter_mining_jobs,`);
  sql.push(`  lean_verifications,`);
  sql.push(`  maxima_verifications,`);
  sql.push(`  formal_statements,`);
  sql.push(`  segments,`);
  sql.push(`  apps`);
  sql.push(`RESTART IDENTITY CASCADE;\n`);

  // Key-to-ID Maps
  const appKeyToId: Record<string, number> = { app1: 1, app2: 2 };
  const segKeyToId: Record<string, number> = {};
  const navKeyToId: Record<string, number> = {};
  const statementKeyToId: Record<string, number> = {};
  const modeKeyToId: Record<string, number> = {};
  const presetKeyToId: Record<string, number> = {};

  // 1. Apps
  sql.push(`-- 1. Applications (Curriculum Targets)`);
  sql.push(`INSERT INTO apps (id, app_code, name, domain, description, is_active) OVERRIDING SYSTEM VALUE VALUES`);
  sql.push(`  (1, 'app1', 'Mathematics and the Middle Way', 'middlewaymath.app', 'The flagship 0–12 developmental curriculum from elementary logic to quantum reality.', TRUE),`);
  sql.push(`  (2, 'app2', 'Middle Way Math: Satellite Seminars', 'satellite.middlewaymath.app', 'Tertiary extensions, research masterclasses, and experimental seminars.', TRUE)`);
  sql.push(`ON CONFLICT (id) DO UPDATE SET`);
  sql.push(`  app_code = EXCLUDED.app_code,`);
  sql.push(`  name = EXCLUDED.name,`);
  sql.push(`  domain = EXCLUDED.domain,`);
  sql.push(`  description = EXCLUDED.description;\n`);

  // 2. Segments (All 52 Modular Chapters)
  sql.push(`-- 2. Curricular Segments (52 Chapters)`);
  const segmentInserts: string[] = [];

  segsList.forEach((item, idx) => {
    const segId = idx + 1;
    segKeyToId[item.id] = segId;
    const title = extractTitleFromHtml(item.id, item.seg);
    const slug = item.id.replace(/([A-Z])/g, '-$1').toLowerCase();

    segmentInserts.push(
      `  (${segId}, ${escapeSql(item.id)}, ${idx}, ${escapeSql(title)}, ${escapeSql(slug)}, ${escapeSql(item.seg)}, 'published')`
    );
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

  // 3. Curriculum Navigation Outline Tree (Canonical Course Hierarchy)
  sql.push(`-- 3. Curriculum Navigation Outline Tree (The Course Index)`);

  interface ExtractedNavItem {
    rawKey: string;
    appCode: string;
    parentRawKey: string | null;
    sequenceOrder: number;
    itemType: string;
    topic: string;
    navTopic: string | null;
    segmentKey: string | null;
    diagramKey: string | null;
  }

  function getDiagramKey(item: any): string | null {
    if (item.type !== 'diagram') return null;
    const name = item.initCB ? item.initCB.name : '';
    const topic = (item.topic || '').toLowerCase();
    if (name.includes('Banner') || topic.includes('title')) return 'banner';
    if (name.includes('TTD') || topic.includes('truth table')) return 'ttd';
    if (name.includes('FSD') || topic.includes('formal statement')) return 'fsd';
    if (name.includes('BTD') || topic.includes('successor tree')) return 'btd';
    if (name.includes('BID') || topic.includes('bayesian inference')) return 'bid';
    return 'diagram';
  }

  function traverse(
    app: string,
    items: any[],
    parentId: string | null = null,
    prefix: string = `${app}_nav`,
    out: ExtractedNavItem[] = []
  ): ExtractedNavItem[] {
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
        segmentKey: segKey,
        diagramKey: dKey,
      });

      if (it.indexDesc && Array.isArray(it.indexDesc)) {
        traverse(app, it.indexDesc, rawKey, rawKey, out);
      }
    });
    return out;
  }

  const navRows: ExtractedNavItem[] = [];
  try {
    const app1Index = await loadAppMainIndex('app1');
    traverse('app1', app1Index, null, 'app1_nav', navRows);
  } catch (e) {
    console.warn('[genSqlSeeds] Warning loading app1 mainIndex:', e);
  }

  try {
    const app2Index = await loadAppMainIndex('app2');
    traverse('app2', app2Index, null, 'app2_nav', navRows);
  } catch (e) {
    console.warn('[genSqlSeeds] Warning loading app2 mainIndex:', e);
  }

  navRows.forEach((row, idx) => {
    navKeyToId[row.rawKey] = idx + 1;
  });

  const navInserts: string[] = [];
  navRows.forEach((row, idx) => {
    const nId = idx + 1;
    const appId = appKeyToId[row.appCode] || 1;
    const parentId = row.parentRawKey ? (navKeyToId[row.parentRawKey] || null) : null;
    const segId = row.segmentKey ? (segKeyToId[row.segmentKey] || null) : null;

    navInserts.push(
      `  (${nId}, ${escapeSql(row.rawKey)}, ${appId}, ${parentId !== null ? parentId : 'NULL'}, ${row.sequenceOrder}, ` +
      `${escapeSql(row.itemType)}, ${escapeSql(row.topic)}, ${escapeSql(row.navTopic)}, ${segId !== null ? segId : 'NULL'}, ` +
      `${escapeSql(row.diagramKey)}, NULL, NULL, '{}'::jsonb, TRUE)`
    );
  });

  if (navInserts.length > 0) {
    sql.push(`INSERT INTO curriculum_nav_items (`);
    sql.push(`  id, nav_key, app_id, parent_id, sequence_order, item_type, topic, nav_topic, segment_id, diagram_key, diagram_path, notes, metadata, is_active`);
    sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(navInserts.join(',\n'));
    sql.push(`ON CONFLICT (id) DO UPDATE SET`);
    sql.push(`  nav_key = EXCLUDED.nav_key,`);
    sql.push(`  parent_id = EXCLUDED.parent_id,`);
    sql.push(`  sequence_order = EXCLUDED.sequence_order,`);
    sql.push(`  topic = EXCLUDED.topic,`);
    sql.push(`  nav_topic = EXCLUDED.nav_topic,`);
    sql.push(`  segment_id = EXCLUDED.segment_id,`);
    sql.push(`  diagram_key = EXCLUDED.diagram_key;\n`);
  }

  // 4. Formal Statements
  sql.push(`-- 4. Formal Statements (Axiomatic Engine)`);

  const orderedStatements: any[] = [];
  const visited = new Set<string>();

  function visitStatement(stmt: any) {
    if (visited.has(stmt.id)) return;
    if (stmt.parentId && !visited.has(stmt.parentId)) {
      const parent = catalog.formalStatements.find((s: any) => s.id === stmt.parentId);
      if (parent) visitStatement(parent);
    }
    visited.add(stmt.id);
    orderedStatements.push(stmt);
  }

  catalog.formalStatements.forEach((s: any) => visitStatement(s));

  orderedStatements.forEach((stmt: any, idx: number) => {
    statementKeyToId[stmt.id] = idx + 1;
  });

  const statementInserts: string[] = [];
  orderedStatements.forEach((stmt: any, idx: number) => {
    const stId = idx + 1;
    const parentId = stmt.parentId ? (statementKeyToId[stmt.parentId] || null) : null;
    const domainCategory = stmt.type === 'physics' ? 'kinematics_and_dynamics' :
                           stmt.type === 'information' ? 'information_and_signals' : 'discrete_analysis';

    statementInserts.push(
      `  (${stId}, ${escapeSql(stmt.id)}, ${escapeSql(stmt.scaffoldKey)}, ${escapeSql(domainCategory)}, ` +
      `${parentId !== null ? parentId : 'NULL'}, ${escapeSql(stmt.type)}, ${escapeSql(stmt.tier)}, ` +
      `${escapeSql(stmt.governingSeed || null)}, ${escapeSql(stmt.title)}, ${escapeSql(stmt.description || null)}, ` +
      `${escapeSql(stmt.expression)}, ${escapeSql(stmt.leanSignature || null)}, ${escapeSql(stmt.leanSnippet || null)}, ` +
      `'published', ${escapeTextArray(stmt.referencedInSegments)})`
    );
  });

  if (statementInserts.length > 0) {
    sql.push(`INSERT INTO formal_statements (`);
    sql.push(`  id, statement_key, scaffold_key, domain_category, parent_id, type, tier, governing_seed,`);
    sql.push(`  title, description, expression, lean_signature, lean_snippet, status, referenced_segments`);
    sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(statementInserts.join(',\n'));
    sql.push(`ON CONFLICT (id) DO UPDATE SET`);
    sql.push(`  statement_key = EXCLUDED.statement_key,`);
    sql.push(`  scaffold_key = EXCLUDED.scaffold_key,`);
    sql.push(`  domain_category = EXCLUDED.domain_category,`);
    sql.push(`  parent_id = EXCLUDED.parent_id,`);
    sql.push(`  title = EXCLUDED.title,`);
    sql.push(`  description = EXCLUDED.description,`);
    sql.push(`  expression = EXCLUDED.expression,`);
    sql.push(`  lean_signature = EXCLUDED.lean_signature,`);
    sql.push(`  lean_snippet = EXCLUDED.lean_snippet,`);
    sql.push(`  referenced_segments = EXCLUDED.referenced_segments;\n`);
  }

  // 5. Calculation Modes
  sql.push(`-- 5. Calculation Modes (Directional Stencils)`);
  catalog.calculationModes.forEach((mode: any, idx: number) => {
    modeKeyToId[mode.id] = idx + 1;
  });

  const modeInserts: string[] = [];
  catalog.calculationModes.forEach((mode: any, idx: number) => {
    const mId = idx + 1;
    const stmtId = statementKeyToId[mode.statementId] || 1;

    modeInserts.push(
      `  (${mId}, ${escapeSql(mode.id)}, ${stmtId}, ${escapeSql(mode.label)}, ` +
      `${escapeSql(mode.targetSymbol)}, ${escapeSql(mode.targetDomain)}, ${escapeSql(mode.targetUnit || null)}, ` +
      `${escapeSql(mode.formulaDescription)}, ${escapeSql(mode.formulaExpr)}, ${escapeSql(!!mode.hasSimulation)})`
    );
  });

  if (modeInserts.length > 0) {
    sql.push(`INSERT INTO calculation_modes (`);
    sql.push(`  id, mode_key, statement_id, label, target_symbol, target_domain, target_unit, formula_description, formula_expr, has_simulation`);
    sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(modeInserts.join(',\n'));
    sql.push(`ON CONFLICT (id) DO UPDATE SET`);
    sql.push(`  mode_key = EXCLUDED.mode_key,`);
    sql.push(`  label = EXCLUDED.label,`);
    sql.push(`  target_symbol = EXCLUDED.target_symbol,`);
    sql.push(`  target_domain = EXCLUDED.target_domain,`);
    sql.push(`  target_unit = EXCLUDED.target_unit,`);
    sql.push(`  formula_description = EXCLUDED.formula_description,`);
    sql.push(`  formula_expr = EXCLUDED.formula_expr,`);
    sql.push(`  has_simulation = EXCLUDED.has_simulation;\n`);
  }

  // 6. Mode Slots
  sql.push(`-- 6. Mode Slots`);
  sql.push(`DELETE FROM mode_slots;\n`);
  const slotInserts: string[] = [];
  let slotCounter = 1;

  for (const mode of catalog.calculationModes) {
    if (!mode.inputs) continue;
    const mId = modeKeyToId[mode.id];
    mode.inputs.forEach((slot: any, idx: number) => {
      const defVal = Array.isArray(slot.defaultValue) ? slot.defaultValue[0] : slot.defaultValue;
      slotInserts.push(
        `  (${slotCounter++}, ${mId}, ${idx}, ${escapeSql(slot.name)}, ${escapeSql(slot.symbol)}, ` +
        `${escapeSql(slot.domain)}, ${escapeSql(slot.unit || null)}, ${escapeSql(defVal ?? 0)}, ` +
        `${escapeSql(slot.min ?? null)}, ${escapeSql(slot.max ?? null)}, ${escapeSql(slot.step ?? null)}, ` +
        `${escapeSql(slot.description || null)})`
      );
    });
  }

  if (slotInserts.length > 0) {
    sql.push(`INSERT INTO mode_slots (`);
    sql.push(`  id, mode_id, slot_order, name, symbol, domain, unit, default_value, min_val, max_val, step_val, description`);
    sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(slotInserts.join(',\n'));
    sql.push(`;\n`);
  }

  // 7. Verified Presets (Belonging to Calculation Modes)
  sql.push(`-- 7. Verified Presets`);
  const presetInserts: string[] = [];
  catalog.examples.forEach((ex: any, idx: number) => {
    const pId = idx + 1;
    presetKeyToId[ex.id] = pId;
    const mId = modeKeyToId[ex.modeId] || 1;

    presetInserts.push(
      `  (${pId}, ${escapeSql(ex.id)}, ${mId}, ` +
      `${escapeSql(ex.title)}, ${escapeJson(ex.values)}, ` +
      `${escapeSql(ex.displayResult)}, ${escapeSql(ex.formattedFormula)}, ${escapeSql(ex.domainBadge)}, ` +
      `${escapeSql(ex.notes || null)})`
    );
  });

  if (presetInserts.length > 0) {
    sql.push(`INSERT INTO verified_presets (`);
    sql.push(`  id, preset_key, mode_id, title, input_values, display_result, formatted_formula, domain_badge, notes`);
    sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(presetInserts.join(',\n'));
    sql.push(`ON CONFLICT (id) DO UPDATE SET`);
    sql.push(`  preset_key = EXCLUDED.preset_key,`);
    sql.push(`  mode_id = EXCLUDED.mode_id,`);
    sql.push(`  input_values = EXCLUDED.input_values,`);
    sql.push(`  display_result = EXCLUDED.display_result,`);
    sql.push(`  formatted_formula = EXCLUDED.formatted_formula,`);
    sql.push(`  notes = EXCLUDED.notes;\n`);
  }

  // 8. Segment References (Unified Stencil Citations)
  sql.push(`-- 8. Segment References (Embedded Stencil Links)`);
  sql.push(`DELETE FROM segment_references;\n`);
  const refInserts: string[] = [];
  let refCounter = 1;

  for (const item of segsList) {
    const html = item.seg;
    const segId = segKeyToId[item.id];
    let occurrence = 0;

    // Scan for fsd-ref tags (deductive emphasis: initial_focus = 'proof')
    const fsdRegex = /<fsd-ref\s+([^>]*?)>(.*?)<\/fsd-ref>/gi;
    let match: RegExpExecArray | null;
    while ((match = fsdRegex.exec(html)) !== null) {
      const attrs = match[1];
      const anchor = match[2].replace(/<[^>]*>/g, '').trim();

      const idMatch = /id=["']([^"']+)["']/i.exec(attrs);
      const scaffoldMatch = /scaffold=["']([^"']+)["']/i.exec(attrs);
      let stmtKey: string | null = null;

      if (idMatch && catalog.formalStatements.some((s: any) => s.id === idMatch[1])) {
        stmtKey = idMatch[1];
      } else if (scaffoldMatch) {
        const found = catalog.formalStatements.find((s: any) => s.scaffoldKey === scaffoldMatch[1]);
        if (found) stmtKey = found.id;
      }

      if (stmtKey && statementKeyToId[stmtKey]) {
        const stId = statementKeyToId[stmtKey];
        const isCalc = /auto-calc|open-calc/i.test(attrs);
        const focus = isCalc ? 'calculator' : 'proof';
        const mode = catalog.calculationModes.find((m: any) => m.statementId === stmtKey);
        const mId = isCalc && mode ? (modeKeyToId[mode.id] || null) : null;
        refInserts.push(
          `  (${refCounter++}, ${segId}, ${stId}, ${mId !== null ? mId : 'NULL'}, NULL, '${focus}', ${occurrence++}, ${escapeSql(anchor)}, ${escapeSql(match[0])})`
        );
      }
    }

    // Scan for cas-ref tags (computational emphasis: initial_focus = 'calculator')
    const casRegex = /<cas-ref\s+([^>]*?)>(.*?)<\/cas-ref>/gi;
    while ((match = casRegex.exec(html)) !== null) {
      const attrs = match[1];
      const anchor = match[2].replace(/<[^>]*>/g, '').trim();
      const calcMatch = /calc-id=["']([^"']+)["']/i.exec(attrs);
      const calcId = calcMatch ? calcMatch[1] : null;

      let stId: number | null = null;
      let mId: number | null = null;
      let pId: number | null = null;

      if (calcId) {
        const preset = catalog.examples.find((p: any) => p.presetKey === calcId || p.id === calcId);
        if (preset) {
          pId = presetKeyToId[preset.id] || null;
          mId = modeKeyToId[preset.modeId] || null;
          stId = statementKeyToId[preset.statementId] || null;
        } else {
          const mode = catalog.calculationModes.find((m: any) => m.id === calcId);
          if (mode) {
            mId = modeKeyToId[mode.id] || null;
            stId = statementKeyToId[mode.statementId] || null;
          }
        }
      }

      if (stId) {
        refInserts.push(
          `  (${refCounter++}, ${segId}, ${stId}, ${mId !== null ? mId : 'NULL'}, ${pId !== null ? pId : 'NULL'}, 'calculator', ${occurrence++}, ${escapeSql(anchor)}, ${escapeSql(match[0])})`
        );
      }
    }
  }

  if (refInserts.length > 0) {
    sql.push(`INSERT INTO segment_references (`);
    sql.push(`  id, segment_id, statement_id, mode_id, preset_id, initial_focus, occurrence_order, anchor_text, raw_tag`);
    sql.push(`) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(refInserts.join(',\n'));
    sql.push(`;\n`);
  }

  // 9. Segment Prerequisites (Pedagogical Graph Sample)
  sql.push(`-- 9. Segment Prerequisites`);
  sql.push(`DELETE FROM segment_prerequisites;\n`);
  const prereqSamples = [
    { from: 'stemNewtonianBridge', to: 'introduction', type: 'foundational' },
    { from: 'stemNewtonianBridge', to: 'editedNumbersLecture3V1', type: 'recommended' },
    { from: 'stemHeatDiffusion', to: 'stemNewtonianBridge', type: 'foundational' },
    { from: 'stemHeatDiffusion', to: 'analysis1DLecture3', type: 'foundational' },
    { from: 'analysis1DLecture1', to: 'introduction', type: 'foundational' },
    { from: 'analysis1DLecture2', to: 'analysis1DLecture1', type: 'foundational' },
    { from: 'analysis1DLecture3', to: 'analysis1DLecture2', type: 'foundational' },
    { from: 'analysis2DLecture1', to: 'analysis1DLecture3', type: 'foundational' },
  ];

  const prereqInserts = prereqSamples
    .filter(p => segKeyToId[p.from] && segKeyToId[p.to])
    .map((p, idx) => `  (${idx + 1}, ${segKeyToId[p.from]}, ${segKeyToId[p.to]}, '${p.type}')`);

  if (prereqInserts.length > 0) {
    sql.push(`INSERT INTO segment_prerequisites (id, segment_id, depends_on_segment_id, prerequisite_type) OVERRIDING SYSTEM VALUE VALUES`);
    sql.push(prereqInserts.join(',\n'));
    sql.push(`ON CONFLICT (segment_id, depends_on_segment_id) DO NOTHING;\n`);
  }

  // 10. Lean Verifications (Relationally Linked to formal_statements)
  sql.push(`-- 10. Lean 4 Verifications`);
  const leanInserts: string[] = [];
  const processedLeanKeys = new Set<string>();

  for (const [key, entry] of Object.entries(leanCache as Record<string, any>)) {
    if (!entry || !entry.key || processedLeanKeys.has(key)) continue;
    processedLeanKeys.add(key);

    const matchedStmt = catalog.formalStatements.find(
      (s: any) => s.scaffoldKey === key || s.id === key || s.id === entry.target
    );
    const stId = matchedStmt ? (statementKeyToId[matchedStmt.id] || null) : null;

    leanInserts.push(
      `  (${escapeSql(key)}, ${stId !== null ? stId : 'NULL'}, ${escapeSql(entry.target || entry.key)}, ${escapeSql(entry.expression || '')}, ` +
      `${escapeSql(entry.signature || '')}, ${escapeSql(!!entry.verdict)}, ${escapeSql(!!entry.qed)}, ` +
      `${escapeSql(entry.timeMs ?? null)}, ${escapeSql(entry.engine || null)}, ` +
      `${escapeSql(entry.verifiedAt || null)}, ${escapeSql(entry.leanSnippet || null)}, ` +
      `${escapeSql(entry.summary || null)})`
    );
  }

  if (leanInserts.length > 0) {
    sql.push(`INSERT INTO lean_verifications (`);
    sql.push(`  key, statement_id, target, expression, signature, verdict, qed, time_ms, engine, verified_at, lean_snippet, summary`);
    sql.push(`) VALUES`);
    sql.push(leanInserts.join(',\n'));
    sql.push(`ON CONFLICT (key) DO UPDATE SET`);
    sql.push(`  statement_id = EXCLUDED.statement_id,`);
    sql.push(`  verdict = EXCLUDED.verdict,`);
    sql.push(`  qed = EXCLUDED.qed,`);
    sql.push(`  time_ms = EXCLUDED.time_ms,`);
    sql.push(`  verified_at = EXCLUDED.verified_at,`);
    sql.push(`  summary = EXCLUDED.summary;\n`);
  }

  // 11. Maxima CAS Verifications (Relationally Linked to calculation_modes)
  sql.push(`-- 11. Maxima CAS Verifications`);
  const maximaInserts: string[] = [];
  for (const [id, session] of Object.entries(maximaCache as Record<string, any>)) {
    if (!session || !session.id) continue;
    const middleWay = session.middleWayLink || {};

    const matchedMode = catalog.calculationModes.find((m: any) => m.id === session.id);
    const matchedExample = catalog.examples.find((ex: any) => ex.id === session.id || ex.presetKey === session.id);
    const mId = matchedMode ? modeKeyToId[matchedMode.id] : (matchedExample ? modeKeyToId[matchedExample.modeId] : null);

    maximaInserts.push(
      `  (${escapeSql(session.id)}, ${mId !== null ? mId : 'NULL'}, ${escapeSql(session.title)}, ${escapeSql(session.category)}, ` +
      `${escapeSql(session.problemStatement)}, ${escapeSql(middleWay.domain || 'ℝ_ω')}, ` +
      `${escapeTextArray(middleWay.operators)}, ${escapeTextArray(middleWay.scaffoldTheorems)}, ` +
      `${escapeTextArray(session.maximaSession?.inputs)}, ${escapeTextArray(session.maximaSession?.outputs)}, ` +
      `${escapeJson(session.maximaSession?.formattedSteps || [])})`
    );
  }

  if (maximaInserts.length > 0) {
    sql.push(`INSERT INTO maxima_verifications (`);
    sql.push(`  id, mode_id, title, category, problem_statement, domain, operators, scaffold_theorems, session_inputs, session_outputs, formatted_steps`);
    sql.push(`) VALUES`);
    sql.push(maximaInserts.join(',\n'));
    sql.push(`ON CONFLICT (id) DO UPDATE SET`);
    sql.push(`  mode_id = EXCLUDED.mode_id,`);
    sql.push(`  category = EXCLUDED.category,`);
    sql.push(`  problem_statement = EXCLUDED.problem_statement,`);
    sql.push(`  formatted_steps = EXCLUDED.formatted_steps;\n`);
  }

  // 12. Automated Parameter Mining
  sql.push(`-- 12. Automated Parameter Mining`);
  const defaultStmtId = statementKeyToId['fs_free_fall_accel'] || 1;
  const defaultModeId = modeKeyToId['ff_v_from_v0_g_t'] || 1;

  sql.push(`INSERT INTO parameter_mining_jobs (id, job_key, statement_id, mode_id, target_symbol, parameter_grid, require_integer_outputs, status, discovered_candidates) OVERRIDING SYSTEM VALUE VALUES`);
  sql.push(`  (1, 'job_free_fall_grid', ${defaultStmtId}, ${defaultModeId}, 'v', '{"v0": [0, 50], "g": [9.8, 9.8], "t": [0, 10]}'::jsonb, FALSE, 'completed', '[{"v0": 20, "g": 9.8, "t": 1.5, "v": 5.3}, {"v0": 49, "g": 9.8, "t": 5, "v": 0}]'::jsonb)`);
  sql.push(`ON CONFLICT (id) DO UPDATE SET`);
  sql.push(`  job_key = EXCLUDED.job_key,`);
  sql.push(`  status = EXCLUDED.status,`);
  sql.push(`  discovered_candidates = EXCLUDED.discovered_candidates;\n`);

  // 13. Sequence Synchronization
  sql.push(`-- 13. Sequence Synchronization for System-Generated Identity Keys`);
  const tablesWithIdentity = [
    'apps',
    'segments',
    'curriculum_nav_items',
    'formal_statements',
    'calculation_modes',
    'mode_slots',
    'verified_presets',
    'segment_references',
    'segment_prerequisites',
    'parameter_mining_jobs'
  ];

  for (const t of tablesWithIdentity) {
    sql.push(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), coalesce(max(id), 1)) FROM ${t};`);
  }
  sql.push('\n');

  return sql.join('\n');
}

// Write to db/seed_v2.sql
if (require.main === module) {
  const rootDir = path.resolve(__dirname, '..', '..');
  const outPathV2 = path.join(rootDir, 'db', 'seed_v2.sql');
  (async () => {
    try {
      const sqlContent = await generateSeedSql();
      fs.writeFileSync(outPathV2, sqlContent, 'utf8');
      console.log(`Successfully generated PostgreSQL seed v2 at: ${outPathV2} (${Buffer.byteLength(sqlContent)} bytes)`);
    } catch (err) {
      console.error('Error generating seeds:', err);
      process.exit(1);
    }
  })();
}
