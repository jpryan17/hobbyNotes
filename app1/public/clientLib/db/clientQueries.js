// clientLib/db/clientQueries.ts
// Domain query definitions executed by client-side browser logic.
// Normalized for system-generated BIGINT Identity Primary Keys.
import { queryDatabase, executeSql, getApiBaseUrl } from './api.js';
// =====================================================================
// CURRICULUM REPOSITORY QUERIES
// =====================================================================
export async function fetchAllSegments(appCode = 'app1') {
    const sql = `
        SELECT DISTINCT s.id, s.seg_key, s.sequence_order, s.title, s.slug, s.summary, s.content_html, s.status, s.updated_at
        FROM segments s
        JOIN curriculum_nav_items n ON n.segment_id = s.id
        JOIN apps a ON a.id = n.app_id
        WHERE a.app_code = $1
        ORDER BY s.sequence_order ASC;
    `;
    return queryDatabase(sql, [appCode]);
}
export async function fetchSegmentByIdOrKey(idOrKey) {
    const isNum = typeof idOrKey === 'number' || /^\d+$/.test(String(idOrKey));
    const sql = isNum
        ? `SELECT id, seg_key, sequence_order, title, slug, summary, content_html, status, updated_at FROM segments WHERE id = $1;`
        : `SELECT id, seg_key, sequence_order, title, slug, summary, content_html, status, updated_at FROM segments WHERE seg_key = $1;`;
    const rows = await queryDatabase(sql, [idOrKey]);
    return rows.length > 0 ? rows[0] : null;
}
export async function updateSegmentContent(idOrKey, contentHtml) {
    const isNum = typeof idOrKey === 'number' || /^\d+$/.test(String(idOrKey));
    const sql = isNum
        ? `UPDATE segments SET content_html = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`
        : `UPDATE segments SET content_html = $1, updated_at = CURRENT_TIMESTAMP WHERE seg_key = $2;`;
    return executeSql(sql, [contentHtml, idOrKey]);
}
export async function fetchNavItems(appCode) {
    if (appCode) {
        const sql = `
            SELECT n.id, n.nav_key, n.app_id, n.parent_id, n.sequence_order, n.item_type, n.topic, n.nav_topic, n.segment_id, n.diagram_key, n.diagram_path, n.notes, n.metadata
            FROM curriculum_nav_items n
            JOIN apps a ON a.id = n.app_id
            WHERE a.app_code = $1
            ORDER BY n.sequence_order ASC;
        `;
        return queryDatabase(sql, [appCode]);
    }
    const sql = `
        SELECT id, nav_key, app_id, parent_id, sequence_order, item_type, topic, nav_topic, segment_id, diagram_key, diagram_path, notes, metadata
        FROM curriculum_nav_items
        ORDER BY app_id, sequence_order ASC;
    `;
    return queryDatabase(sql);
}
export async function saveNavItem(item) {
    if (item.id) {
        const sql = `
            UPDATE curriculum_nav_items
            SET 
                nav_key = COALESCE($1, nav_key),
                app_id = $2,
                parent_id = $3,
                sequence_order = COALESCE($4, sequence_order),
                item_type = $5,
                topic = $6,
                nav_topic = $7,
                segment_id = $8,
                diagram_key = $9,
                diagram_path = $10,
                notes = $11,
                metadata = COALESCE($12, metadata),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $13;
        `;
        return executeSql(sql, [
            item.nav_key || null,
            item.app_id,
            item.parent_id || null,
            item.sequence_order ?? null,
            item.item_type,
            item.topic,
            item.nav_topic || null,
            item.segment_id || null,
            item.diagram_key || null,
            item.diagram_path || null,
            item.notes || null,
            item.metadata ? JSON.stringify(item.metadata) : null,
            item.id
        ]);
    }
    else {
        const sql = `
            INSERT INTO curriculum_nav_items (nav_key, app_id, parent_id, sequence_order, item_type, topic, nav_topic, segment_id, diagram_key, diagram_path, notes, metadata)
            VALUES ($1, $2, $3, COALESCE($4, 0), $5, $6, $7, $8, $9, $10, $11, COALESCE($12, '{}'::jsonb))
            RETURNING id;
        `;
        return executeSql(sql, [
            item.nav_key || null,
            item.app_id,
            item.parent_id || null,
            item.sequence_order ?? 0,
            item.item_type,
            item.topic,
            item.nav_topic || null,
            item.segment_id || null,
            item.diagram_key || null,
            item.diagram_path || null,
            item.notes || null,
            item.metadata ? JSON.stringify(item.metadata) : '{}',
        ]);
    }
}
export async function reorderNavItems(updates) {
    if (updates.length === 0) {
        return { status: 'success', message: 'No updates provided' };
    }
    const whenClauses = updates.map(u => `WHEN id = ${u.id} THEN ${u.sequence_order}`).join(' ');
    const parentWhenClauses = updates.map(u => {
        const p = u.parent_id !== null ? `${u.parent_id}` : 'NULL';
        return `WHEN id = ${u.id} THEN ${p}`;
    }).join(' ');
    const idList = updates.map(u => `${u.id}`).join(', ');
    const sql = `
        UPDATE curriculum_nav_items
        SET 
            sequence_order = CASE ${whenClauses} ELSE sequence_order END,
            parent_id = CASE ${parentWhenClauses} ELSE parent_id END
        WHERE id IN (${idList});
    `;
    return executeSql(sql);
}
export async function deleteNavItem(id) {
    // Delete target nav item and cascade delete children
    const sql = `
        WITH RECURSIVE nav_tree AS (
            SELECT id FROM curriculum_nav_items WHERE id = $1
            UNION ALL
            SELECT c.id FROM curriculum_nav_items c
            INNER JOIN nav_tree nt ON c.parent_id = nt.id
        )
        DELETE FROM curriculum_nav_items
        WHERE id IN (SELECT id FROM nav_tree);
    `;
    return executeSql(sql, [id]);
}
export function buildNavTree(items, parentId = null) {
    return items
        .filter(item => String(item.parent_id ?? '') === String(parentId ?? ''))
        .sort((a, b) => a.sequence_order - b.sequence_order)
        .map(item => ({
        ...item,
        children: buildNavTree(items, item.id)
    }));
}
// =====================================================================
// FOUNDATIONS & STENCILS QUERIES
// =====================================================================
export async function fetchFormalStatements() {
    const sql = `
        SELECT id, statement_key, scaffold_key, domain_category, parent_id, type, tier, governing_seed, title, description, expression, lean_signature, lean_snippet, status
        FROM formal_statements
        ORDER BY tier, id;
    `;
    return queryDatabase(sql);
}
export async function fetchModesForStatement(statementId) {
    const sql = `
        SELECT id, mode_key, statement_id, label, target_symbol, target_domain, target_unit, formula_description, formula_expr, has_simulation
        FROM calculation_modes
        WHERE statement_id = $1
        ORDER BY id;
    `;
    return queryDatabase(sql, [statementId]);
}
export async function fetchPresetsForMode(modeId) {
    const sql = `
        SELECT id, preset_key, mode_id, title, input_values, display_result, formatted_formula, domain_badge, notes
        FROM verified_presets
        WHERE mode_id = $1
        ORDER BY id;
    `;
    return queryDatabase(sql, [modeId]);
}
// =====================================================================
// STATIC SITE PUBLISHER API (STUDIO ONE-CLICK BUILD)
// =====================================================================
export async function publishStaticSiteApi(appName = 'app1', options) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app: appName,
                pageName: options?.pageName,
                outDir: options?.outDir,
                outlineTree: options?.outlineTree,
                segOverrides: options?.segOverrides,
            }),
        });
        const json = await response.json();
        if (response.ok && json.status === 'success') {
            return {
                success: true,
                message: `Successfully published ${appName}!`,
                durationMs: json.data?.durationMs,
                byteSize: json.data?.distBytes || json.data?.byteSize,
                distPath: json.data?.distPath,
                pageName: json.data?.pageName,
            };
        }
        return {
            success: false,
            message: json.message || json.data?.error || 'Build failed.',
        };
    }
    catch (err) {
        return {
            success: false,
            message: err?.message || String(err),
        };
    }
}
// =====================================================================
// COMMIT DEV STATE TO POSTGRESQL API
// =====================================================================
export async function syncDevStateToDbApi(appName = 'app1', outlineTree, segOverrides) {
    try {
        const response = await fetch(`${getApiBaseUrl()}/api/sync-to-db`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                app: appName,
                outlineTree,
                segOverrides,
            }),
        });
        const json = await response.json();
        if (response.ok && json.status === 'success') {
            return {
                status: 'success',
                message: json.message || 'Database synchronized successfully.',
                data: json.data,
            };
        }
        return {
            status: 'error',
            message: json.message || json.error || 'Failed to sync database.',
        };
    }
    catch (err) {
        return {
            status: 'error',
            message: err?.message || String(err),
        };
    }
}
