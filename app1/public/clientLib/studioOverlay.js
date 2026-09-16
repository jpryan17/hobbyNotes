// clientLib/studioOverlay.ts
// Middle Way Math - In-Situ Studio Overlay (WYSIWYG Page-Mimic Authoring)
import { Nav } from './navFW.js';
import { SVGTSpan, textWidth } from './svgElt.js';
import { Index } from './navIndex.js';
import { SI } from './serverInterface.js';
import { initAnyDJSI } from './ida.js';
import { fetchNavItems, publishStaticSiteApi, syncDevStateToDbApi, fetchSegmentByIdOrKey } from './db/clientQueries.js';
import { getApiBaseUrl } from './db/api.js';
export class StudioOverlay {
    // Mode State: false = View (reader simulation), true = Edit (in-situ popups & tools)
    static isEditModeActive = false;
    // SVG Nav Line Controls
    static controlsContainer;
    static controlsWidth = 0;
    static modeWidget;
    static buildWidget;
    static dbWidget;
    static contentWidget;
    static stencilWidget;
    static reloadWidget;
    static consoleWidget;
    static helpWidget;
    static isBuilding = false;
    static cachedSegments = [];
    // Initialize the Studio Overlay into Nav.devLineBlock
    static init(navColors) {
        const stdC = navColors.std;
        const activeC = navColors.active;
        const overC = navColors.over;
        const fontSize = Nav.fontSize - 2;
        // Container SVGTSpan attached to Nav.devLineBlock (falling back to Nav.lineBlock if devLine is not present)
        StudioOverlay.controlsContainer = new SVGTSpan(Nav.devLineBlock || Nav.lineBlock);
        // Studio banner badge
        const badge = new SVGTSpan(StudioOverlay.controlsContainer);
        badge.setAA(['font-size', fontSize, 'stroke', '#92400e', 'font-weight', 'bold', 'pointer-events', 'none']);
        badge.setV('🛠️ STUDIO:');
        const createSpacer = () => {
            const sp = new SVGTSpan(StudioOverlay.controlsContainer);
            sp.setAA(['font-size', fontSize, 'stroke', stdC, 'pointer-events', 'none']);
            sp.setV(' ');
            return sp;
        };
        createSpacer();
        // Helper to construct a stylized clickable SVGTSpan button
        const createButton = (label, clickHandler) => {
            const btn = new SVGTSpan(StudioOverlay.controlsContainer);
            btn.setAA(['font-size', fontSize, 'stroke', activeC, 'pointer-events', 'auto', 'cursor', 'pointer']);
            btn.setV(label);
            btn.elt.addEventListener('mouseover', () => {
                if (btn.getS('stroke') !== navColors.busy) {
                    btn.setA('stroke', overC);
                }
            });
            btn.elt.addEventListener('mouseout', () => {
                if (btn.getS('stroke') !== navColors.busy) {
                    btn.setA('stroke', activeC);
                }
            });
            btn.elt.addEventListener('click', (e) => {
                e.stopPropagation();
                clickHandler(e);
            });
            return btn;
        };
        // 1. Mode Toggle: [Mode: View] <-> [Mode: Edit]
        StudioOverlay.modeWidget = createButton(StudioOverlay.isEditModeActive ? '[✏️ Edit]' : '[👁️ View]', () => StudioOverlay.toggleMode());
        createSpacer();
        // 2. Segment Content In-Situ Editor
        StudioOverlay.contentWidget = createButton('[✏️ Content]', () => StudioOverlay.openContentEditor());
        createSpacer();
        // 3. Stencil Insertion Helper
        StudioOverlay.stencilWidget = createButton('[+ Stencil]', () => StudioOverlay.openStencilPicker());
        createSpacer();
        // 4. Live Reload Segment
        StudioOverlay.reloadWidget = createButton('[🔄 Reload]', () => StudioOverlay.handleReload());
        createSpacer();
        // 5. One-Click Static Site Publisher
        StudioOverlay.buildWidget = createButton('[🚀 Build Page]', () => StudioOverlay.handleBuildPage());
        createSpacer();
        // 6. Commit Dev State to Database
        StudioOverlay.dbWidget = createButton('[💾 Update DB]', () => StudioOverlay.openUpdateDbModal());
        createSpacer();
        // 7. DB Console Quick Link
        StudioOverlay.consoleWidget = createButton('[📊 Console]', () => {
            window.open(`${getApiBaseUrl()}/console`, '_blank');
        });
        createSpacer();
        // 8. Dev Studio Help & Quick Reference Guide
        StudioOverlay.helpWidget = createButton('[ℹ️ Guide]', () => {
            StudioOverlay.openHelpModal();
        });
        // Compute total width for layout positioning
        StudioOverlay.updateWidth();
        // Inject shared modal styles into document head
        StudioOverlay.injectStyles();
        // Preload segment list for dropdown selectors
        StudioOverlay.loadSegmentCatalog();
    }
    // Positions the studio controls on the dedicated dev line
    static setPos(lineWidth) {
        StudioOverlay.updateWidth();
        const yDev = (2 * Nav.frameMargin + Nav.lineHeight) + 0.5 * Nav.devLineHeight + 0.35 * (Nav.fontSize - 2);
        StudioOverlay.controlsContainer.setAA(['x', Nav.margin.start, 'y', yDev]);
    }
    static updateWidth() {
        const text = `🛠️ STUDIO: ${StudioOverlay.modeWidget.getV()} [✏️ Content] [+ Stencil] [🔄 Reload] [🚀 Build Page] [💾 Update DB] [📊 Console] [ℹ️ Guide]`;
        StudioOverlay.controlsWidth = textWidth(text, Nav.fontSize - 2) + 90;
    }
    // Toggle between View mode (normal student navigation) and Edit mode (in-situ outline editing)
    static toggleMode() {
        StudioOverlay.isEditModeActive = !StudioOverlay.isEditModeActive;
        const label = StudioOverlay.isEditModeActive ? '[✏️ Edit]' : '[👁️ View]';
        StudioOverlay.modeWidget.setV(label);
        StudioOverlay.updateWidth();
        // Visual feedback
        if (StudioOverlay.isEditModeActive) {
            StudioOverlay.showToast('Studio Edit Mode active. Click any outline item to edit hierarchy.');
        }
        else {
            StudioOverlay.showToast('Studio View Mode active. Normal navigation enabled.');
        }
        // Trigger nav repaint
        Nav.display();
    }
    // =========================================================================
    // 1. ONE-CLICK STATIC PUBLISHER (BUILD PAGE MATCHING CURRENT STATE)
    // =========================================================================
    static openBuildModal() {
        const existing = document.getElementById('studio-build-modal');
        if (existing) {
            existing.remove();
            return;
        }
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'studio-build-modal';
        modalOverlay.className = 'studio-modal-backdrop';
        modalOverlay.innerHTML = `
            <div class="studio-modal-dialog" style="max-width: 540px;">
                <div class="studio-modal-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.3rem;">🚀</span>
                        <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a;">Build Enhanced Static Page</h3>
                    </div>
                    <button class="studio-close-btn" id="build-modal-close-btn">✕</button>
                </div>
                <div class="studio-modal-body" style="gap: 16px;">
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 0.88rem; color: #475569; line-height: 1.5;">
                        Compiles curriculum chapters, Lean 4 proof stencils, and Maxima CAS calculators directly from PostgreSQL into an isolated, self-contained static HTML page.
                    </div>

                    <div class="studio-field-group">
                        <label>Output Directory:</label>
                        <div style="font-family: monospace; background: #f1f5f9; padding: 8px 12px; border-radius: 6px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; font-size: 0.92rem;">
                            📁 app1/builds/
                        </div>
                        <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">Preserves production <code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">app1/dist/index.html</code> untouched.</div>
                    </div>

                    <div class="studio-field-group">
                        <label>Page Filename:</label>
                        <input type="text" id="build-page-name-input" class="studio-input" value="enhanced_index.html" placeholder="e.g. enhanced_index.html, stage1_draft.html" />
                        <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">Will automatically append <code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">.html</code> if omitted.</div>
                    </div>
                </div>
                <div class="studio-modal-footer" style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="studio-btn secondary" id="build-cancel-btn">Cancel</button>
                    <button class="studio-btn primary" id="build-execute-btn">Build Page →</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        const closeModal = () => modalOverlay.remove();
        document.getElementById('build-modal-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('build-cancel-btn')?.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay)
                closeModal();
        });
        const onEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                window.removeEventListener('keydown', onEsc);
            }
        };
        window.addEventListener('keydown', onEsc);
        const input = document.getElementById('build-page-name-input');
        input?.focus();
        input?.select();
        const executeBtn = document.getElementById('build-execute-btn');
        executeBtn?.addEventListener('click', async () => {
            const pageName = (input?.value || 'enhanced_index.html').trim();
            closeModal();
            await StudioOverlay.handleBuildPage(pageName);
        });
        input?.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const pageName = (input?.value || 'enhanced_index.html').trim();
                closeModal();
                await StudioOverlay.handleBuildPage(pageName);
            }
        });
    }
    static async handleBuildPage(customPageName) {
        if (!customPageName) {
            StudioOverlay.openBuildModal();
            return;
        }
        if (StudioOverlay.isBuilding)
            return;
        StudioOverlay.isBuilding = true;
        StudioOverlay.buildWidget.setV('[Building...]');
        StudioOverlay.buildWidget.setA('stroke', Nav.color.busy);
        StudioOverlay.showToast(`Compiling snapshot of active Dev state into app1/builds/${customPageName}...`);
        try {
            const start = performance.now();
            const outlineTree = StudioOverlay.exportCurrentOutlineTree();
            const segOverrides = StudioOverlay.collectSegmentOverrides();
            const res = await publishStaticSiteApi('app1', {
                pageName: customPageName,
                outDir: 'builds',
                outlineTree,
                segOverrides,
            });
            const duration = Math.round(performance.now() - start);
            if (res.success) {
                const kb = res.byteSize ? `${Math.round(res.byteSize / 1024)} KB` : '';
                const emittedName = res.pageName || customPageName;
                StudioOverlay.buildWidget.setV(`[✓ Built (${duration}ms)]`);
                StudioOverlay.buildWidget.setA('stroke', '#16a34a');
                StudioOverlay.showToast(`✓ Built ${emittedName} in ${duration}ms! ${kb} written to app1/builds/${emittedName}. (Database untouched)`);
            }
            else {
                StudioOverlay.buildWidget.setV('[❌ Failed]');
                StudioOverlay.buildWidget.setA('stroke', 'red');
                StudioOverlay.showToast(`Build failed: ${res.message}`, true);
            }
        }
        catch (err) {
            StudioOverlay.buildWidget.setV('[❌ Error]');
            StudioOverlay.buildWidget.setA('stroke', 'red');
            StudioOverlay.showToast(`Build error: ${err.message}`, true);
        }
        finally {
            setTimeout(() => {
                StudioOverlay.isBuilding = false;
                StudioOverlay.buildWidget.setV('[🚀 Build Page]');
                StudioOverlay.buildWidget.setA('stroke', Nav.color.active);
                StudioOverlay.updateWidth();
            }, 3000);
        }
    }
    // =========================================================================
    // 1b. COMMIT DEV STATE TO POSTGRESQL MODAL
    // =========================================================================
    static openUpdateDbModal() {
        const existing = document.getElementById('studio-update-db-modal');
        if (existing) {
            existing.remove();
            return;
        }
        const outlineTree = StudioOverlay.exportCurrentOutlineTree();
        const segOverrides = StudioOverlay.collectSegmentOverrides();
        const rootCount = outlineTree.length;
        const editedSegCount = Object.keys(segOverrides).length;
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'studio-update-db-modal';
        modalOverlay.className = 'studio-modal-backdrop';
        modalOverlay.innerHTML = `
            <div class="studio-modal-dialog" style="max-width: 540px;">
                <div class="studio-modal-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.3rem;">💾</span>
                        <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a;">Commit Dev State to PostgreSQL</h3>
                    </div>
                    <button class="studio-close-btn" id="db-modal-close-btn">✕</button>
                </div>
                <div class="studio-modal-body" style="gap: 16px;">
                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px; font-size: 0.88rem; color: #166534; line-height: 1.5;">
                        <b>Database Safety:</b> Normal Dev edits and builds leave PostgreSQL untouched. Clicking <b>Commit to DB</b> will synchronize your current in-memory outline hierarchy and segment edits into the established database.
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 0.85rem; color: #334155;">
                        <div style="font-weight: 600; margin-bottom: 6px; color: #0f172a;">Payload Summary:</div>
                        <ul style="margin: 0; padding-left: 18px; line-height: 1.6;">
                            <li>Curriculum outline: <b>${rootCount} root sections</b></li>
                            <li>In-memory modified segments: <b>${editedSegCount} chapters</b></li>
                            <li>Target Database: <b>hobbynotes (app1)</b></li>
                        </ul>
                    </div>
                </div>
                <div class="studio-modal-footer" style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px;">
                    <button class="studio-btn secondary" id="db-cancel-btn">Cancel</button>
                    <button class="studio-btn primary" id="db-confirm-btn" style="background: #16a34a; border-color: #15803d;">✓ Commit to DB</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        const closeModal = () => modalOverlay.remove();
        document.getElementById('db-modal-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('db-cancel-btn')?.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay)
                closeModal();
        });
        const onEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                window.removeEventListener('keydown', onEsc);
            }
        };
        window.addEventListener('keydown', onEsc);
        const confirmBtn = document.getElementById('db-confirm-btn');
        confirmBtn?.addEventListener('click', async () => {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Committing...';
            StudioOverlay.dbWidget.setV('[Saving...]');
            StudioOverlay.dbWidget.setA('stroke', Nav.color.busy);
            try {
                const res = await syncDevStateToDbApi('app1', outlineTree, segOverrides);
                closeModal();
                if (res.status === 'success') {
                    StudioOverlay.dbWidget.setV('[✓ DB Updated]');
                    StudioOverlay.dbWidget.setA('stroke', '#16a34a');
                    StudioOverlay.showToast('✓ Successfully committed Dev state to PostgreSQL database!');
                }
                else {
                    StudioOverlay.dbWidget.setV('[❌ Sync Error]');
                    StudioOverlay.dbWidget.setA('stroke', 'red');
                    StudioOverlay.showToast(`Database commit failed: ${res.message}`, true);
                }
            }
            catch (err) {
                closeModal();
                StudioOverlay.dbWidget.setV('[❌ Error]');
                StudioOverlay.dbWidget.setA('stroke', 'red');
                StudioOverlay.showToast(`Database commit error: ${err.message}`, true);
            }
            finally {
                setTimeout(() => {
                    StudioOverlay.dbWidget.setV('[💾 Update DB]');
                    StudioOverlay.dbWidget.setA('stroke', Nav.color.active);
                    StudioOverlay.updateWidth();
                }, 3000);
            }
        });
    }
    static exportCurrentOutlineTree() {
        const rootIndex = (Nav.indices && Nav.indices.length > 0) ? Nav.indices[0] : null;
        if (!rootIndex)
            return [];
        const rawItems = rootIndex._rawIndexDesc || rootIndex.choices.map((c) => c[0]);
        const serializeNode = (item) => {
            const out = {
                type: item.type,
                topic: item.topic,
            };
            if (item.navTopic)
                out.navTopic = item.navTopic;
            if (item.htmlSegmentId)
                out.htmlSegmentId = item.htmlSegmentId;
            if (item.diagramKey)
                out.diagramKey = item.diagramKey;
            if (item.indexDesc && Array.isArray(item.indexDesc)) {
                out.indexDesc = item.indexDesc.map(serializeNode);
            }
            return out;
        };
        return rawItems.map(serializeNode);
    }
    static collectSegmentOverrides() {
        const overrides = {};
        if (Nav.segMap && Nav.segMap.size > 0) {
            Nav.segMap.forEach((content, key) => {
                if (content && typeof content === 'string') {
                    overrides[key] = content;
                }
            });
        }
        return overrides;
    }
    // =========================================================================
    // 2. LIVE RELOAD SEGMENT CONTENT
    // =========================================================================
    static async handleReload() {
        if (!Nav.segId) {
            StudioOverlay.showToast('No active segment selected to reload.', true);
            return;
        }
        StudioOverlay.reloadWidget.setV('[Reloading...]');
        StudioOverlay.reloadWidget.setA('stroke', Nav.color.busy);
        try {
            // First attempt to fetch updated content from database
            const dbSeg = await fetchSegmentByIdOrKey(Nav.segId);
            if (dbSeg && dbSeg.content_html) {
                Nav.segMap.set(Nav.segId, dbSeg.content_html);
            }
            else {
                // Fallback to serverInterface
                await SI.setSegMap(true, Nav.segId);
            }
            Nav.loadSegment();
            initAnyDJSI();
            if (window.MathJax?.typesetPromise) {
                await window.MathJax.typesetPromise([Nav.segDiv.elt]);
            }
            Nav.setSegPos();
            StudioOverlay.reloadWidget.setV('[✓ Reloaded]');
            StudioOverlay.reloadWidget.setA('stroke', '#16a34a');
            StudioOverlay.showToast(`✓ Chapter '${Nav.segId}' reloaded & re-typeset.`);
        }
        catch (err) {
            StudioOverlay.showToast(`Reload error: ${err.message}`, true);
        }
        finally {
            setTimeout(() => {
                StudioOverlay.reloadWidget.setV('[🔄 Reload]');
                StudioOverlay.reloadWidget.setA('stroke', Nav.color.active);
            }, 1800);
        }
    }
    // =========================================================================
    // 3. IN-SITU OUTLINE ITEM POPUP MODAL (EDIT/INSERT/DELETE TREE NODES)
    // =========================================================================
    static openOutlineModal(indexInstance, itemIndex) {
        const choiceTuple = indexInstance.choices[itemIndex];
        if (!choiceTuple)
            return;
        const item = choiceTuple[0];
        // Remove existing modal if open
        const existing = document.getElementById('studio-outline-modal');
        if (existing)
            existing.remove();
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'studio-outline-modal';
        modalOverlay.className = 'studio-modal-backdrop';
        const segmentsOptions = StudioOverlay.cachedSegments
            .map((s) => `<option value="${s.seg_key}" ${item.htmlSegmentId === s.seg_key ? 'selected' : ''}>${s.title} (${s.seg_key})</option>`)
            .join('');
        modalOverlay.innerHTML = `
            <div class="studio-modal-dialog">
                <div class="studio-modal-header">
                    <h3>🌳 Edit Outline Item</h3>
                    <button class="studio-close-btn" id="outline-close-btn">✕</button>
                </div>
                <div class="studio-modal-body">
                    <div class="studio-field-group">
                        <label>Display Topic Title:</label>
                        <input type="text" id="outline-topic" value="${StudioOverlay.escapeHtml(item.topic || '')}" class="studio-input" />
                    </div>

                    <div class="studio-field-group">
                        <label>Short Tab Label (navTopic):</label>
                        <input type="text" id="outline-nav-topic" value="${StudioOverlay.escapeHtml(item.navTopic || '')}" class="studio-input" placeholder="e.g. Logic, Vectors, Calculus" />
                    </div>

                    <div class="studio-form-row">
                        <div class="studio-field-group flex-1">
                            <label>Item Type:</label>
                            <select id="outline-type" class="studio-select">
                                <option value="html" ${item.type === 'html' ? 'selected' : ''}>📄 HTML Segment (Chapter)</option>
                                <option value="diagram" ${item.type === 'diagram' ? 'selected' : ''}>📊 Interactive Diagram</option>
                                <option value="index" ${item.type === 'index' ? 'selected' : ''}>📁 Sub-Index Folder</option>
                            </select>
                        </div>

                        <div class="studio-field-group flex-1" id="group-segment" style="${item.type === 'html' ? '' : 'display:none;'}">
                            <label>Linked Segment:</label>
                            <select id="outline-segment" class="studio-select">
                                <option value="">-- Choose Segment --</option>
                                ${segmentsOptions}
                            </select>
                        </div>
                    </div>

                    <div class="studio-btn-row">
                        <button class="studio-btn primary" id="btn-save-item">✓ Save Changes</button>
                        <button class="studio-btn secondary" id="btn-insert-before">+ Insert Before</button>
                        <button class="studio-btn secondary" id="btn-insert-after">+ Insert After</button>
                        <button class="studio-btn secondary" id="btn-add-child">+ Add Child</button>
                        <button class="studio-btn danger" id="btn-delete-item">🗑️ Delete</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        // Event: Type selector toggle
        const typeSelect = document.getElementById('outline-type');
        const segmentGroup = document.getElementById('group-segment');
        typeSelect.addEventListener('change', () => {
            segmentGroup.style.display = typeSelect.value === 'html' ? 'block' : 'none';
        });
        // Close handlers
        const closeModal = () => modalOverlay.remove();
        document.getElementById('outline-close-btn')?.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay)
                closeModal();
        });
        // Action: Save Changes
        document.getElementById('btn-save-item')?.addEventListener('click', async () => {
            const topicInput = document.getElementById('outline-topic');
            const navTopicInput = document.getElementById('outline-nav-topic');
            const segSelect = document.getElementById('outline-segment');
            item.topic = topicInput.value.trim() || item.topic;
            item.navTopic = navTopicInput.value.trim() || undefined;
            item.type = typeSelect.value;
            if (item.type === 'html') {
                item.htmlSegmentId = segSelect.value || undefined;
            }
            closeModal();
            StudioOverlay.refreshIndexView(indexInstance);
            StudioOverlay.showToast(`Updated outline item: "${item.topic}" (dev session only)`);
        });
        // Action: Insert Before
        document.getElementById('btn-insert-before')?.addEventListener('click', () => {
            const newItem = {
                type: 'html',
                topic: 'New Curricular Section',
                navTopic: 'New Section',
            };
            StudioOverlay.insertNodeInArray(indexInstance, itemIndex, newItem, false);
            closeModal();
        });
        // Action: Insert After
        document.getElementById('btn-insert-after')?.addEventListener('click', () => {
            const newItem = {
                type: 'html',
                topic: 'New Curricular Section',
                navTopic: 'New Section',
            };
            StudioOverlay.insertNodeInArray(indexInstance, itemIndex, newItem, true);
            closeModal();
        });
        // Action: Add Child
        document.getElementById('btn-add-child')?.addEventListener('click', () => {
            if (!item.indexDesc) {
                item.indexDesc = [];
                item.type = 'index';
            }
            item.indexDesc.push({
                type: 'html',
                topic: 'Child Topic',
            });
            closeModal();
            StudioOverlay.refreshIndexView(indexInstance);
            StudioOverlay.showToast(`Added child node under "${item.topic}".`);
        });
        // Action: Delete Item
        document.getElementById('btn-delete-item')?.addEventListener('click', () => {
            if (confirm(`Are you sure you want to delete "${item.topic}"?`)) {
                StudioOverlay.deleteNodeFromArray(indexInstance, itemIndex);
                closeModal();
            }
        });
    }
    static insertNodeInArray(indexInstance, targetIndex, newNode, after) {
        const rawItems = indexInstance._rawIndexDesc || indexInstance.choices.map((c) => c[0]);
        const insertPos = after ? targetIndex + 1 : targetIndex;
        rawItems.splice(insertPos, 0, newNode);
        StudioOverlay.refreshIndexView(indexInstance, rawItems);
        StudioOverlay.showToast(`Inserted item "${newNode.topic}" ${after ? 'after' : 'before'}.`);
    }
    static deleteNodeFromArray(indexInstance, targetIndex) {
        const rawItems = indexInstance._rawIndexDesc || indexInstance.choices.map((c) => c[0]);
        if (rawItems.length <= 1) {
            StudioOverlay.showToast('Cannot delete the only item in an index.', true);
            return;
        }
        const removed = rawItems.splice(targetIndex, 1);
        StudioOverlay.refreshIndexView(indexInstance, rawItems);
        StudioOverlay.showToast(`Deleted item "${removed[0]?.topic}".`);
    }
    static refreshIndexView(indexInstance, newItems) {
        const items = newItems || indexInstance.choices.map((c) => c[0]);
        const chosen = Math.min(indexInstance.chosen, items.length - 1);
        const newIndex = new Index(items, chosen);
        newIndex._rawIndexDesc = items;
        if (Nav.currentIndex >= 0 && Nav.currentIndex < Nav.indices.length) {
            Nav.indices[Nav.currentIndex] = newIndex;
        }
        Nav.display();
    }
    // =========================================================================
    // 4. IN-SITU SEGMENT HTML/MARKDOWN CONTENT EDITOR
    // =========================================================================
    static openContentEditor() {
        if (!Nav.segId) {
            StudioOverlay.showToast('Please select a chapter before opening Content Editor.', true);
            return;
        }
        const existing = document.getElementById('studio-content-modal');
        if (existing)
            existing.remove();
        const currentHtml = Nav.segMap.get(Nav.segId) || Nav.segDiv.elt.innerHTML || '';
        const modal = document.createElement('div');
        modal.id = 'studio-content-modal';
        modal.className = 'studio-modal-backdrop';
        modal.innerHTML = `
            <div class="studio-modal-dialog large">
                <div class="studio-modal-header">
                    <h3>✏️ Edit Chapter Content: <code>${Nav.segId}</code></h3>
                    <div class="studio-header-actions">
                        <button class="studio-btn small secondary" id="editor-stencil-btn">+ Insert Stencil Tag</button>
                        <button class="studio-close-btn" id="content-close-btn">✕</button>
                    </div>
                </div>
                <div class="studio-modal-body">
                    <p class="studio-hint">Directly edit the HTML narrative of this chapter. Math formulas are written in standard MathML or TeX, and stencils are embedded using <code>&lt;fsd-ref scaffold="..." tier="3" auto-calc&gt;</code>.</p>
                    <textarea id="segment-html-editor" class="studio-code-editor" spellcheck="false">${StudioOverlay.escapeHtml(currentHtml)}</textarea>
                    <div class="studio-btn-row space-between">
                        <span id="editor-char-count" class="studio-char-count">${currentHtml.length} characters</span>
                        <div class="studio-btn-group">
                            <button class="studio-btn secondary" id="btn-cancel-content">Cancel</button>
                            <button class="studio-btn primary" id="btn-save-content">✓ Apply to Dev Session & Reload</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const textarea = document.getElementById('segment-html-editor');
        const charCount = document.getElementById('editor-char-count');
        textarea.addEventListener('input', () => {
            charCount.textContent = `${textarea.value.length} characters`;
        });
        // Close handlers
        const closeModal = () => modal.remove();
        document.getElementById('content-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-content')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal)
                closeModal();
        });
        // Quick stencil insert into textarea
        document.getElementById('editor-stencil-btn')?.addEventListener('click', () => {
            StudioOverlay.openStencilPicker((tag) => {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const val = textarea.value;
                textarea.value = val.substring(0, start) + tag + val.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + tag.length;
                textarea.focus();
            });
        });
        // Apply changes to in-memory Dev Session
        document.getElementById('btn-save-content')?.addEventListener('click', async () => {
            const newHtml = textarea.value;
            Nav.segMap.set(Nav.segId, newHtml);
            Nav.segDiv.elt.innerHTML = newHtml;
            initAnyDJSI();
            if (window.MathJax?.typesetPromise) {
                await window.MathJax.typesetPromise([Nav.segDiv.elt]);
            }
            Nav.setSegPos();
            closeModal();
            StudioOverlay.showToast(`✓ Chapter '${Nav.segId}' updated in active Dev session (database untouched).`);
        });
    }
    // =========================================================================
    // 5. STENCIL CATALOG PICKER MODAL
    // =========================================================================
    static async openStencilPicker(onSelect) {
        const existing = document.getElementById('studio-stencil-modal');
        if (existing)
            existing.remove();
        let stencils = [];
        try {
            const resp = await fetch('./public/fsCatalog.json');
            if (resp.ok) {
                const catalog = await resp.json();
                stencils = catalog.formalStatements || [];
            }
        }
        catch {
            stencils = [];
        }
        const modal = document.createElement('div');
        modal.id = 'studio-stencil-modal';
        modal.className = 'studio-modal-backdrop';
        const listItems = stencils.map((s) => {
            const scaffold = s.scaffoldKey || s.id.replace(/^fs_/, '');
            const tag = `<fsd-ref scaffold="${scaffold}" tier="${s.tier || '3'}" auto-calc>${s.title}</fsd-ref>`;
            return `
                <div class="studio-stencil-card" data-tag="${StudioOverlay.escapeHtml(tag)}">
                    <div class="studio-stencil-title">
                        <strong>${s.title}</strong>
                        <span class="studio-stencil-badge">${s.type || 'math'} • tier ${s.tier || '3'}</span>
                    </div>
                    <div class="studio-stencil-expr"><code>${s.expression || ''}</code></div>
                    <div class="studio-stencil-actions">
                        <button class="studio-btn small primary btn-insert-tag">Insert Stencil</button>
                        <button class="studio-btn small secondary btn-copy-tag">Copy Tag</button>
                    </div>
                </div>
            `;
        }).join('');
        modal.innerHTML = `
            <div class="studio-modal-dialog">
                <div class="studio-modal-header">
                    <h3>🧮 Mathematical Stencils Catalog</h3>
                    <button class="studio-close-btn" id="stencil-close-btn">✕</button>
                </div>
                <div class="studio-modal-body">
                    <p class="studio-hint">Browse deductive theorems and algebraic calculation stencils. Click "Insert" to embed directly into the chapter.</p>
                    <div class="studio-stencil-list">
                        ${listItems || '<div class="empty">No stencils found in catalog.</div>'}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const closeModal = () => modal.remove();
        document.getElementById('stencil-close-btn')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal)
                closeModal();
        });
        modal.querySelectorAll('.studio-stencil-card').forEach((card) => {
            const tag = card.getAttribute('data-tag') || '';
            card.querySelector('.btn-insert-tag')?.addEventListener('click', () => {
                if (onSelect) {
                    onSelect(tag);
                    closeModal();
                }
                else {
                    navigator.clipboard.writeText(tag);
                    StudioOverlay.showToast('Copied stencil tag to clipboard!');
                    closeModal();
                }
            });
            card.querySelector('.btn-copy-tag')?.addEventListener('click', () => {
                navigator.clipboard.writeText(tag);
                StudioOverlay.showToast('Copied stencil tag to clipboard!');
            });
        });
    }
    // =========================================================================
    // 6. SHARED HELPERS & TOAST NOTIFICATIONS
    // =========================================================================
    static showToast(message, isError = false) {
        let toast = document.getElementById('studio-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'studio-toast';
            toast.className = 'studio-toast';
            document.body.appendChild(toast);
        }
        if (StudioOverlay.toastTimeout) {
            clearTimeout(StudioOverlay.toastTimeout);
            StudioOverlay.toastTimeout = null;
        }
        if (isError) {
            toast.innerHTML = `
                <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; max-width: 540px;">
                    <div style="flex: 1; word-break: break-word; line-height: 1.45;">
                        <strong style="display: block; margin-bottom: 3px; font-size: 0.92rem;">⚠️ Notice</strong>
                        ${StudioOverlay.escapeHtml(message)}
                    </div>
                    <button id="toast-got-it-btn" style="background: rgba(255,255,255,0.25); border: 1px solid rgba(255,255,255,0.55); color: #ffffff; padding: 4px 12px; border-radius: 5px; font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.15s;">Got it</button>
                </div>
            `;
            toast.className = 'studio-toast visible error';
            const btn = document.getElementById('toast-got-it-btn');
            btn?.addEventListener('click', () => {
                toast?.classList.remove('visible');
            });
            btn?.addEventListener('mouseover', () => {
                btn.style.background = 'rgba(255,255,255,0.45)';
            });
            btn?.addEventListener('mouseout', () => {
                btn.style.background = 'rgba(255,255,255,0.25)';
            });
        }
        else {
            toast.textContent = message;
            toast.className = 'studio-toast visible success';
            StudioOverlay.toastTimeout = setTimeout(() => {
                toast?.classList.remove('visible');
            }, 3500);
        }
    }
    static async loadSegmentCatalog() {
        try {
            const res = await fetchNavItems('app1');
            StudioOverlay.cachedSegments = (res || [])
                .filter((n) => n.segment_id && n.topic)
                .map((n) => ({
                id: n.segment_id,
                seg_key: String(n.segment_id),
                title: n.topic,
            }));
        }
        catch {
            // Ignore catalog lookup failures
        }
    }
    // =========================================================================
    // 7. DEV STUDIO HELP & QUICK REFERENCE MODAL
    // =========================================================================
    static openHelpModal() {
        const existing = document.getElementById('studio-help-modal');
        if (existing) {
            existing.remove();
            return;
        }
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'studio-help-modal';
        modalOverlay.className = 'studio-modal-backdrop';
        modalOverlay.innerHTML = `
            <div class="studio-modal-dialog" style="max-width: 780px; max-height: 85vh;">
                <div class="studio-modal-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.4rem;">🛠️</span>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a;">Middle Way Math — Dev Studio Guide</h3>
                            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">In-Situ Authoring, PostgreSQL Curriculum Hub & Dual-Engine Verification</div>
                        </div>
                    </div>
                    <button class="studio-close-btn" id="help-close-btn">✕</button>
                </div>
                <div class="studio-modal-body" style="gap: 18px; font-size: 0.92rem; color: #334155; line-height: 1.55;">
                    
                    <!-- Quick Overview Card -->
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px;">
                        <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Welcome to Dev Mode!</strong>
                        This dedicated Studio toolbar enables instructors and authors to navigate, edit, insert interactive widgets, and publish the textbook directly within the live reading environment.
                    </div>

                    <!-- Toolbar Buttons Breakdown -->
                    <div>
                        <h4 style="margin: 0 0 10px 0; font-size: 0.95rem; color: #1e293b; text-transform: uppercase; letter-spacing: 0.04em; font-weight: 700;">
                            Toolbar Controls
                        </h4>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 10px;">
                            
                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[👁️ View / ✏️ Edit]</div>
                                <div><strong>Mode Toggle:</strong> Switch between standard reader simulation and in-situ tree editing. In <em>Edit</em> mode, click any chapter item in the left outline to edit title, re-parent, change order, or create new chapters.</div>
                            </div>

                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[✏️ Content]</div>
                                <div><strong>In-Situ Content Editor:</strong> Edit the active chapter segment's raw HTML, dialogue markup, and embedded templates in a full modal editor with live in-situ reload.</div>
                            </div>

                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[+ Stencil]</div>
                                <div><strong>Interactive Stencil Picker:</strong> Search and insert reusable mathematical scaffolds directly into content: Lean 4 formal statements (<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">&lt;fsd-ref&gt;</code>), CAS Maxima calculation calculators (<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">&lt;cas-ref&gt;</code>), and STEM cards.</div>
                            </div>

                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[🔄 Reload]</div>
                                <div><strong>Instant Live Reload:</strong> Re-fetches the active chapter segment from PostgreSQL and re-runs MathJax typography without losing navigation state or reloading the window.</div>
                            </div>

                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[🚀 Build Page]</div>
                                <div><strong>Build Page Snapshot:</strong> Emits a standalone static HTML page (<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">app1/builds/&lt;name&gt;.html</code>) snapshotting your active in-memory Dev outline and segment edits without touching PostgreSQL.</div>
                            </div>

                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[💾 Update DB]</div>
                                <div><strong>Commit to Database:</strong> Explicitly writes your active in-memory Dev outline hierarchy and segment content into PostgreSQL. Normal dev edits and builds leave the database completely alone.</div>
                            </div>

                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[📊 Console]</div>
                                <div><strong>Database Console:</strong> Opens the interactive PostgreSQL query console in a new tab (<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">/console</code>) to run queries against curriculum tables.</div>
                            </div>

                            <div style="display: flex; gap: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px;">
                                <div style="font-family: monospace; font-weight: 700; color: #2563eb; min-width: 110px;">[ℹ️ Guide]</div>
                                <div><strong>Studio Guide:</strong> Displays this in-situ documentation and architecture overview.</div>
                            </div>

                        </div>
                    </div>

                    <!-- Architecture & Workflow Box -->
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px;">
                        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #92400e; font-weight: 700;">
                            Architecture & Key Guidelines
                        </h4>
                        <ul style="margin: 0; padding-left: 20px; font-size: 0.88rem; color: #78350f;">
                            <li><strong>Local DB Bridge:</strong> Runs at <code style="background:#fef3c7; padding:1px 4px; border-radius:3px;">localhost:3000</code> backed by PostgreSQL, decoupled from the live HTTP dev server at <code style="background:#fef3c7; padding:1px 4px; border-radius:3px;">localhost:8080</code>.</li>
                            <li><strong>Clean Separation:</strong> Production static builds (<code style="background:#fef3c7; padding:1px 4px; border-radius:3px;">npm run build</code>) run with <code style="background:#fef3c7; padding:1px 4px; border-radius:3px;">editMode = false</code>, hiding the Studio toolbar completely so readers experience pure textbook navigation.</li>
                            <li><strong>Dual Formal Verification:</strong> Segments dynamically bridge Lean 4 proof-assistant statements with Maxima computer-algebra (CAS) computations.</li>
                        </ul>
                    </div>

                </div>
                <div class="studio-modal-footer" style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end;">
                    <button class="studio-btn primary" id="help-ok-btn">Got It</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        const closeModal = () => modalOverlay.remove();
        document.getElementById('help-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('help-ok-btn')?.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay)
                closeModal();
        });
        const onEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                window.removeEventListener('keydown', onEsc);
            }
        };
        window.addEventListener('keydown', onEsc);
    }
    static escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    static injectStyles() {
        if (document.getElementById('studio-overlay-styles'))
            return;
        const style = document.createElement('style');
        style.id = 'studio-overlay-styles';
        style.textContent = `
            .studio-modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.65);
                backdrop-filter: blur(4px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.15s ease-out;
            }
            .studio-modal-dialog {
                background: #ffffff;
                color: #1e293b;
                border-radius: 12px;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                width: 520px;
                max-width: 95vw;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .studio-modal-dialog.large {
                width: 960px;
            }
            .studio-modal-header {
                padding: 16px 20px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: #f8fafc;
            }
            .studio-modal-header h3 {
                margin: 0;
                font-size: 1.15rem;
                font-weight: 600;
                color: #0f172a;
            }
            .studio-header-actions {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .studio-close-btn {
                background: transparent;
                border: none;
                font-size: 1.25rem;
                cursor: pointer;
                color: #64748b;
                padding: 4px 8px;
                border-radius: 6px;
            }
            .studio-close-btn:hover {
                color: #0f172a;
                background: #e2e8f0;
            }
            .studio-modal-body {
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .studio-field-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .studio-field-group label {
                font-size: 0.85rem;
                font-weight: 600;
                color: #475569;
            }
            .studio-input, .studio-select {
                padding: 8px 12px;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                font-size: 0.95rem;
                outline: none;
                transition: border-color 0.15s;
            }
            .studio-input:focus, .studio-select:focus {
                border-color: #2563eb;
                box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
            }
            .studio-form-row {
                display: flex;
                gap: 12px;
            }
            .flex-1 { flex: 1; }
            .studio-btn-row {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 10px;
            }
            .studio-btn-row.space-between {
                justify-content: space-between;
                align-items: center;
            }
            .studio-btn-group {
                display: flex;
                gap: 8px;
            }
            .studio-btn {
                padding: 8px 16px;
                border-radius: 6px;
                font-weight: 500;
                font-size: 0.9rem;
                cursor: pointer;
                border: 1px solid transparent;
                transition: all 0.15s;
            }
            .studio-btn.primary {
                background: #2563eb;
                color: white;
            }
            .studio-btn.primary:hover {
                background: #1d4ed8;
            }
            .studio-btn.secondary {
                background: #f1f5f9;
                color: #334155;
                border-color: #cbd5e1;
            }
            .studio-btn.secondary:hover {
                background: #e2e8f0;
            }
            .studio-btn.danger {
                background: #fee2e2;
                color: #b91c1c;
                border-color: #fca5a5;
            }
            .studio-btn.danger:hover {
                background: #fecaca;
            }
            .studio-btn.small {
                padding: 4px 10px;
                font-size: 0.8rem;
            }
            .studio-code-editor {
                width: 100%;
                height: 440px;
                font-family: Consolas, Monaco, monospace;
                font-size: 0.9rem;
                line-height: 1.45;
                padding: 12px;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                box-sizing: border-box;
                resize: vertical;
                background: #fcfcfc;
            }
            .studio-code-editor:focus {
                outline: none;
                border-color: #2563eb;
            }
            .studio-hint {
                font-size: 0.85rem;
                color: #64748b;
                margin: 0;
            }
            .studio-char-count {
                font-size: 0.8rem;
                color: #64748b;
            }
            .studio-stencil-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-height: 450px;
                overflow-y: auto;
            }
            .studio-stencil-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                background: #f8fafc;
            }
            .studio-stencil-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .studio-stencil-badge {
                font-size: 0.75rem;
                background: #e0e7ff;
                color: #3730a3;
                padding: 2px 8px;
                border-radius: 12px;
                text-transform: uppercase;
                font-weight: 600;
            }
            .studio-stencil-expr code {
                font-family: monospace;
                font-size: 0.85rem;
                color: #0369a1;
            }
            .studio-stencil-actions {
                display: flex;
                gap: 8px;
                margin-top: 4px;
            }
            .studio-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 500;
                font-size: 0.9rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
                z-index: 100000;
                opacity: 0;
                pointer-events: none;
                transform: translateY(12px);
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .studio-toast.visible {
                opacity: 1;
                pointer-events: auto;
                transform: translateY(0);
            }
            .studio-toast.success {
                background: #065f46;
                color: #ecfdf5;
                border: 1px solid #059669;
            }
            .studio-toast.error {
                background: #991b1b;
                color: #fef2f2;
                border: 1px solid #dc2626;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}
