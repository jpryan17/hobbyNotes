// clientLib/studioOverlay.ts
// Middle Way Math - In-Situ Studio Overlay (WYSIWYG Page-Mimic Authoring)
import { Nav } from './navFW.js';
import { SVGTSpan, textWidth } from './svgElt.js';
import { Index } from './navIndex.js';
import { SI } from './serverInterface.js';
import { initAnyDJSI } from './ida.js';
import { fetchNavItems, publishStaticSiteApi, syncDevStateToDbApi, fetchSegmentByIdOrKey, fetchConsolidatedSegmentsApi } from './db/clientQueries.js';
import { getApiBaseUrl } from './db/api.js';
import { ttd } from './ttd.js';
export class StudioOverlay {
    // Mode State: false = View (reader simulation), true = Edit (in-situ popups & tools)
    static isEditModeActive = false;
    // SVG Nav Line Controls
    static controlsContainer;
    static controlsWidth = 0;
    static modeWidget;
    static buildWidget;
    static stagedWidget;
    static dbWidget;
    static contentWidget;
    static stencilWidget;
    static reloadWidget;
    static consoleWidget;
    static helpWidget;
    static isBuilding = false;
    static cachedSegments = [];
    static cachedConsolidatedSegments = [];
    static segmentSortMode = 'name';
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
        // 5b. Update Established Segments & DB from stagedSegs/
        StudioOverlay.stagedWidget = createButton('[📦 stagedSegs (0)]', () => StudioOverlay.openStagedReviewModal());
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
        // Check for any currently staged segments
        StudioOverlay.checkStagedCount();
    }
    // Positions the studio controls on the dedicated dev line
    static setPos(lineWidth) {
        StudioOverlay.updateWidth();
        const yDev = (2 * Nav.frameMargin + Nav.lineHeight) + 0.5 * Nav.devLineHeight + 0.35 * (Nav.fontSize - 2);
        StudioOverlay.controlsContainer.setAA(['x', Nav.margin.start, 'y', yDev]);
    }
    static updateWidth() {
        const stagedText = StudioOverlay.stagedWidget ? StudioOverlay.stagedWidget.getV() : '[📦 stagedSegs (0)]';
        const text = `🛠️ STUDIO: ${StudioOverlay.modeWidget.getV()} [✏️ Content] [+ Stencil] [🔄 Reload] [🚀 Build Page] ${stagedText} [💾 Update DB] [📊 Console] [ℹ️ Guide]`;
        StudioOverlay.controlsWidth = textWidth(text, Nav.fontSize - 2) + 130;
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
        const renderedOptions = StudioOverlay.renderSegmentOptions(item.htmlSegmentId, StudioOverlay.segmentSortMode);
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
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <label style="margin: 0;">Linked Segment:</label>
                                <div style="display: flex; align-items: center; gap: 4px; font-size: 0.75rem; color: #64748b;">
                                    <span>Sort:</span>
                                    <select id="outline-segment-sort" class="studio-select" style="padding: 1px 6px; font-size: 0.75rem; height: auto; width: auto; background: #fff;">
                                        <option value="name" ${StudioOverlay.segmentSortMode === 'name' ? 'selected' : ''}>Name (A-Z)</option>
                                        <option value="date" ${StudioOverlay.segmentSortMode === 'date' ? 'selected' : ''}>Date (Recent)</option>
                                    </select>
                                </div>
                            </div>
                            <select id="outline-segment" class="studio-select">
                                <option value="">-- Choose Segment --</option>
                                ${renderedOptions}
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
        // Event: Dynamic segment sort toggle
        const sortSelect = document.getElementById('outline-segment-sort');
        const segmentSelect = document.getElementById('outline-segment');
        sortSelect?.addEventListener('change', () => {
            StudioOverlay.segmentSortMode = sortSelect.value;
            const currentVal = segmentSelect.value || item.htmlSegmentId;
            segmentSelect.innerHTML = `<option value="">-- Choose Segment --</option>` + StudioOverlay.renderSegmentOptions(currentVal, StudioOverlay.segmentSortMode);
        });
        // Always refresh catalog on modal open so newly staged segments in stagedSegs/ appear immediately
        fetchConsolidatedSegmentsApi().then((list) => {
            if (list && list.length > 0) {
                StudioOverlay.cachedConsolidatedSegments = list;
                if (segmentSelect) {
                    const currentVal = segmentSelect.value || item.htmlSegmentId;
                    segmentSelect.innerHTML = `<option value="">-- Choose Segment --</option>` + StudioOverlay.renderSegmentOptions(currentVal, StudioOverlay.segmentSortMode);
                }
            }
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
    static async openContentEditor() {
        if (!Nav.segId) {
            StudioOverlay.showToast('Please select a chapter before opening Content Editor.', true);
            return;
        }
        const existing = document.getElementById('studio-content-modal');
        if (existing)
            existing.remove();
        // 1. Established canonical version (default truth)
        let establishedHtml = Nav.segMap.get(Nav.segId) || '';
        if (!establishedHtml) {
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/segment-content/${Nav.segId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.content) {
                        establishedHtml = data.content;
                        Nav.segMap.set(Nav.segId, establishedHtml);
                    }
                }
            }
            catch { }
        }
        if (!establishedHtml) {
            establishedHtml = Nav.segDiv.elt.innerHTML || '';
        }
        // 2. Fetch all drafts in stagedSegs/ to populate version dropdown
        let allStaged = [];
        let currentSegDraft = null;
        try {
            const stagedRes = await fetch(`${getApiBaseUrl()}/api/staged-segments`);
            if (stagedRes.ok) {
                const stagedData = await stagedRes.json();
                if (stagedData && stagedData.status === 'success' && Array.isArray(stagedData.staged)) {
                    allStaged = stagedData.staged;
                    currentSegDraft = allStaged.find((s) => s.segId === Nav.segId);
                }
            }
        }
        catch { }
        // Construct version dropdown options
        let optionsHtml = `<option value="established" selected>📖 Established (Canonical Source)</option>`;
        if (currentSegDraft) {
            optionsHtml += `<option value="staged:${currentSegDraft.segId}">📦 Draft: stagedSegs/${currentSegDraft.filename} (${(currentSegDraft.bytes / 1024).toFixed(1)} KB)</option>`;
        }
        for (const s of allStaged) {
            if (s.segId !== Nav.segId) {
                optionsHtml += `<option value="staged:${s.segId}">📦 Draft: stagedSegs/${s.filename} (${(s.bytes / 1024).toFixed(1)} KB)</option>`;
            }
        }
        const stagedCount = allStaged.length;
        const currentHtml = establishedHtml;
        const modal = document.createElement('div');
        modal.id = 'studio-content-modal';
        modal.className = 'studio-modal-backdrop';
        modal.innerHTML = `
            <div class="studio-modal-dialog xlarge">
                <div class="studio-modal-header">
                    <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                        <h3 style="margin:0;">✏️ Edit Content: <code>${Nav.segId}</code></h3>
                        <div style="display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 2px 8px;">
                            <label for="editor-version-select" style="font-size: 0.8rem; font-weight: 600; color: #475569;">Displaying:</label>
                            <select id="editor-version-select" class="studio-tb-select" style="font-size: 0.82rem; font-weight: 600; color: #0f172a; padding: 3px 6px; border: none; background: transparent; cursor: pointer;">
                                ${optionsHtml}
                            </select>
                        </div>
                        <div class="studio-view-pills">
                            <button id="view-wysiwyg-btn" class="studio-pill active" title="WYSIWYG Normal Visual Editor">👁️ Normal (WYSIWYG)</button>
                            <button id="view-source-btn" class="studio-pill" title="Raw HTML Source Markup">📝 HTML Source</button>
                            <button id="view-split-btn" class="studio-pill" title="Side-by-side Visual & Source">🌓 Split View</button>
                        </div>
                    </div>
                    <div class="studio-header-actions">
                        <button class="studio-close-btn" id="content-close-btn">✕</button>
                    </div>
                </div>

                <!-- Structural Element Formatting Toolbar -->
                <div class="studio-editor-toolbar" id="studio-content-toolbar">
                    <div class="studio-tb-group">
                        <select id="tb-format" class="studio-tb-select" title="Paragraph Format">
                            <option value="p">¶ Paragraph</option>
                            <option value="h2">Heading 2 (Section)</option>
                            <option value="h3">Heading 3 (Sub-section)</option>
                            <option value="h4">Heading 4 (Topic)</option>
                            <option value="pre">Code Block</option>
                        </select>
                    </div>

                    <div class="studio-tb-divider"></div>

                    <div class="studio-tb-group">
                        <button id="tb-bold" class="studio-tb-btn" title="Bold (Ctrl+B)"><b>B</b></button>
                        <button id="tb-italic" class="studio-tb-btn" title="Italic (Ctrl+I)"><i>I</i></button>
                        <button id="tb-underline" class="studio-tb-btn" title="Underline (Ctrl+U)"><u>U</u></button>
                        <button id="tb-code" class="studio-tb-btn" title="Inline Code"><code>&lt;&gt;</code></button>
                    </div>

                    <div class="studio-tb-divider"></div>

                    <div class="studio-tb-group">
                        <button id="tb-ul" class="studio-tb-btn" title="Bulleted List">• List</button>
                        <button id="tb-ol" class="studio-tb-btn" title="Numbered List">1. List</button>
                    </div>

                    <div class="studio-tb-divider"></div>

                    <!-- MWM Callout Palette -->
                    <div class="studio-tb-group">
                        <button id="tb-box-blue" class="studio-tb-btn" style="color: #1d4ed8; border-color: #bfdbfe;" title="Insert Blue Note Box">📘 Note</button>
                        <button id="tb-box-emerald" class="studio-tb-btn" style="color: #047857; border-color: #a7f3d0;" title="Insert Emerald Theorem Box">📗 Theorem</button>
                        <button id="tb-box-amber" class="studio-tb-btn" style="color: #b45309; border-color: #fde68a;" title="Insert Amber Caution Box">📙 Caution</button>
                        <button id="tb-box-card" class="studio-tb-btn" title="Insert Structured Card Container">🗂️ Card</button>
                    </div>

                    <div class="studio-tb-divider"></div>

                    <!-- Stencils & Mathematical Notation -->
                    <div class="studio-tb-group">
                        <button id="tb-insert-stencil" class="studio-tb-btn" style="color: #4338ca; border-color: #c7d2fe; font-weight: 700;" title="Insert Verified Stencil Tag">🧮 + Stencil</button>
                        <button id="tb-insert-ttd" class="studio-tb-btn" style="color: #b91c1c; border-color: #fca5a5; font-weight: 700;" title="Insert Truth Table Demo (TTD) Expression Tag">⚖️ + TTD</button>
                        <button id="tb-insert-math" class="studio-tb-btn" title="Insert Inline Math Formula">∑ Math</button>
                        <button id="tb-render-math" class="studio-tb-btn" style="color: #0369a1; border-color: #bae6fd;" title="Typeset MathJax in Visual View">🔄 Render Math</button>
                    </div>

                    <div class="studio-tb-divider"></div>

                    <!-- Unicode Math & Symbol Palette -->
                    <div class="studio-tb-group" style="position: relative;">
                        <!-- Quick Top Chips -->
                        <div class="studio-symbol-chips">
                            <button type="button" class="studio-sym-chip" data-sym="ω" title="Omega (U+03C9)">ω</button>
                            <button type="button" class="studio-sym-chip" data-sym="ℝ" title="Real Numbers (U+211D)">ℝ</button>
                            <button type="button" class="studio-sym-chip" data-sym="ℂ" title="Complex Numbers (U+2102)">ℂ</button>
                            <button type="button" class="studio-sym-chip" data-sym="ℕ" title="Natural Numbers (U+2115)">ℕ</button>
                            <button type="button" class="studio-sym-chip" data-sym="∈" title="Element of (U+2208)">∈</button>
                            <button type="button" class="studio-sym-chip" data-sym="→" title="Right Arrow (U+2192)">→</button>
                            <button type="button" class="studio-sym-chip" data-sym="·" title="Multiplication Dot (U+00B7)">·</button>
                            <button type="button" class="studio-sym-chip" data-sym="⊗" title="Tensor Product (U+2297)">⊗</button>
                        </div>
                        <button type="button" id="tb-unicode-more" class="studio-tb-btn" style="color: #7c3aed; border-color: #ddd6fe; font-weight: 600;" title="Open Mathematical &amp; Logical Unicode Palette">Ω More ▾</button>

                        <!-- Floating Popover Palette -->
                        <div id="studio-unicode-popover" class="studio-unicode-popover" style="display: none;">
                            <div class="studio-unicode-header">
                                <span>Mathematical &amp; Logical Unicode Palette</span>
                                <button type="button" id="studio-unicode-close" class="studio-unicode-close" title="Close">✕</button>
                            </div>
                            <div class="studio-unicode-categories">
                                <div class="studio-unicode-section">
                                    <div class="studio-unicode-cat-title">Number Sets &amp; Spaces</div>
                                    <div class="studio-unicode-grid">
                                        <button type="button" class="studio-sym-cell" data-sym="ℝ" title="Real Numbers (U+211D)">ℝ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ℂ" title="Complex Numbers (U+2102)">ℂ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ℕ" title="Natural Numbers (U+2115)">ℕ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ℤ" title="Integers (U+2124)">ℤ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ℚ" title="Rational Numbers (U+211A)">ℚ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="𝔹" title="Booleans (U+1D539)">𝔹</button>
                                        <button type="button" class="studio-sym-cell" data-sym="𝔻" title="Dyadic Rationals (U+1D53B)">𝔻</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∅" title="Empty Set (U+2205)">∅</button>
                                    </div>
                                </div>

                                <div class="studio-unicode-section">
                                    <div class="studio-unicode-cat-title">Greek Letters</div>
                                    <div class="studio-unicode-grid">
                                        <button type="button" class="studio-sym-cell" data-sym="ω" title="Omega lowercase (U+03C9)">ω</button>
                                        <button type="button" class="studio-sym-cell" data-sym="Ω" title="Omega uppercase (U+03A9)">Ω</button>
                                        <button type="button" class="studio-sym-cell" data-sym="π" title="Pi (U+03C0)">π</button>
                                        <button type="button" class="studio-sym-cell" data-sym="θ" title="Theta (U+03B8)">θ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ρ" title="Rho (U+03C1)">ρ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ψ" title="Psi (U+03C8)">ψ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="Δ" title="Delta (U+0394)">Δ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ε" title="Epsilon (U+03B5)">ε</button>
                                        <button type="button" class="studio-sym-cell" data-sym="μ" title="Mu (U+03BC)">μ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="β" title="Beta (U+03B2)">β</button>
                                        <button type="button" class="studio-sym-cell" data-sym="α" title="Alpha (U+03B1)">α</button>
                                        <button type="button" class="studio-sym-cell" data-sym="λ" title="Lambda (U+03BB)">λ</button>
                                    </div>
                                </div>

                                <div class="studio-unicode-section">
                                    <div class="studio-unicode-cat-title">Logic &amp; Set Relations</div>
                                    <div class="studio-unicode-grid">
                                        <button type="button" class="studio-sym-cell" data-sym="∈" title="Element of (U+2208)">∈</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∉" title="Not element of (U+2209)">∉</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⊆" title="Subset or equal (U+2286)">⊆</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⊂" title="Proper subset (U+2282)">⊂</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∀" title="For all (U+2200)">∀</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∃" title="There exists (U+2203)">∃</button>
                                        <button type="button" class="studio-sym-cell" data-sym="¬" title="Not (U+00AC)">¬</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∧" title="Logical AND (U+2227)">∧</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∨" title="Logical OR (U+2228)">∨</button>
                                        <button type="button" class="studio-sym-cell" data-sym="→" title="Implies / to (U+2192)">→</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⇒" title="Double implies (U+21D2)">⇒</button>
                                        <button type="button" class="studio-sym-cell" data-sym="↔" title="Equivalent / iff (U+2194)">↔</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⇔" title="Double equivalent (U+21D4)">⇔</button>
                                        <button type="button" class="studio-sym-cell" data-sym="≡" title="Identical to (U+2261)">≡</button>
                                        <button type="button" class="studio-sym-cell" data-sym="≈" title="Approximately equal (U+2248)">≈</button>
                                        <button type="button" class="studio-sym-cell" data-sym="≠" title="Not equal (U+2260)">≠</button>
                                        <button type="button" class="studio-sym-cell" data-sym="≤" title="Less than or equal (U+2264)">≤</button>
                                        <button type="button" class="studio-sym-cell" data-sym="≥" title="Greater than or equal (U+2265)">≥</button>
                                        <button type="button" class="studio-sym-cell" data-sym="≺" title="Precedes in simplicity (U+227A)">≺</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⊥" title="Perpendicular / bottom (U+22A5)">⊥</button>
                                    </div>
                                </div>

                                <div class="studio-unicode-section">
                                    <div class="studio-unicode-cat-title">Operators &amp; Calculus</div>
                                    <div class="studio-unicode-grid">
                                        <button type="button" class="studio-sym-cell" data-sym="·" title="Middle dot / product (U+00B7)">·</button>
                                        <button type="button" class="studio-sym-cell" data-sym="×" title="Cross product (U+00D7)">×</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⊗" title="Tensor product (U+2297)">⊗</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⊕" title="Direct sum (U+2295)">⊕</button>
                                        <button type="button" class="studio-sym-cell" data-sym="±" title="Plus-minus (U+00B1)">±</button>
                                        <button type="button" class="studio-sym-cell" data-sym="√" title="Square root (U+221A)">√</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∑" title="Summation (U+2211)">∑</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∏" title="Product (U+220F)">∏</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∫" title="Integral (U+222B)">∫</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∂" title="Partial derivative (U+2202)">∂</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⋃" title="Union (U+22C3)">⋃</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⋂" title="Intersection (U+22C2)">⋂</button>
                                        <button type="button" class="studio-sym-cell" data-sym="∞" title="Infinity (U+221E)">∞</button>
                                    </div>
                                </div>

                                <div class="studio-unicode-section">
                                    <div class="studio-unicode-cat-title">Quantum, Brackets &amp; Scripts</div>
                                    <div class="studio-unicode-grid">
                                        <button type="button" class="studio-sym-cell" data-sym="⟨" title="Left angle bracket / Bra (U+27E8)">⟨</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⟩" title="Right angle bracket / Ket (U+27E9)">⟩</button>
                                        <button type="button" class="studio-sym-cell" data-sym="†" title="Dagger / Adjoint (U+2020)">†</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ℋ" title="Hilbert Space H (U+210B)">ℋ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="𝒮" title="State Space S (U+1D4AE)">𝒮</button>
                                        <button type="button" class="studio-sym-cell" data-sym="𝒫" title="Projection / Probability P (U+1D4AB)">𝒫</button>
                                        <button type="button" class="studio-sym-cell" data-sym="𝒯" title="Transformation T (U+1D4AF)">𝒯</button>
                                    </div>
                                </div>

                                <div class="studio-unicode-section">
                                    <div class="studio-unicode-cat-title">Subscripts &amp; Superscripts</div>
                                    <div class="studio-unicode-grid">
                                        <button type="button" class="studio-sym-cell" data-sym="₀" title="Subscript 0 (U+2080)">₀</button>
                                        <button type="button" class="studio-sym-cell" data-sym="₁" title="Subscript 1 (U+2081)">₁</button>
                                        <button type="button" class="studio-sym-cell" data-sym="₂" title="Subscript 2 (U+2082)">₂</button>
                                        <button type="button" class="studio-sym-cell" data-sym="₃" title="Subscript 3 (U+2083)">₃</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ᵢ" title="Subscript i (U+1D62)">ᵢ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ⱼ" title="Subscript j (U+2C7C)">ⱼ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ₖ" title="Subscript k (U+2096)">ₖ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ₙ" title="Subscript n (U+2099)">ₙ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="⁰" title="Superscript 0 (U+2070)">⁰</button>
                                        <button type="button" class="studio-sym-cell" data-sym="¹" title="Superscript 1 (U+00B9)">¹</button>
                                        <button type="button" class="studio-sym-cell" data-sym="²" title="Superscript 2 (U+00B2)">²</button>
                                        <button type="button" class="studio-sym-cell" data-sym="³" title="Superscript 3 (U+00B3)">³</button>
                                        <button type="button" class="studio-sym-cell" data-sym="ⁿ" title="Superscript n (U+207F)">ⁿ</button>
                                        <button type="button" class="studio-sym-cell" data-sym="°" title="Degree sign (U+00B0)">°</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Editor Canvases (Panes) -->
                <div class="studio-editor-panes mode-wysiwyg" id="studio-editor-panes">
                    <!-- Visual WYSIWYG Pane -->
                    <div id="pane-wysiwyg" class="studio-pane">
                        <div id="segment-wysiwyg-editor" class="studio-wysiwyg-editor" contenteditable="true" spellcheck="false"></div>
                    </div>

                    <!-- Raw HTML Source Pane -->
                    <div id="pane-source" class="studio-pane">
                        <textarea id="segment-html-editor" class="studio-code-editor" spellcheck="false"></textarea>
                    </div>
                </div>

                <!-- Modal Footer -->
                <div class="studio-modal-body" style="padding: 12px 20px; border-top: 1px solid #e2e8f0; flex: 0 0 auto; gap: 0;">
                    <div class="studio-btn-row space-between" style="margin-top: 0;">
                        <span id="editor-char-count" class="studio-char-count">0 characters</span>
                        <div class="studio-btn-group" style="gap: 8px;">
                            <button class="studio-btn secondary" id="btn-cancel-content">Cancel</button>
                            <button class="studio-btn secondary" id="btn-stage-content" style="color: #b45309; border-color: #fcd34d; font-weight: 600; background: #fffbeb;" title="Save draft to stagedSegs/ on disk without modifying established source files">💾 Save to stagedSegs</button>
                            ${stagedCount > 0 ? `<button class="studio-btn emerald" id="btn-promote-from-editor" style="font-weight: 700; background: #059669; color: white;" title="Update established source files, reseed DB, and clear stagedSegs/">🚀 Update Established &amp; DB (${stagedCount})</button>` : ''}
                            <button class="studio-btn primary" id="btn-save-content">✓ Apply to Dev Session</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const panesContainer = document.getElementById('studio-editor-panes');
        const wysiwygDiv = document.getElementById('segment-wysiwyg-editor');
        const textarea = document.getElementById('segment-html-editor');
        const charCount = document.getElementById('editor-char-count');
        const pillWysiwyg = document.getElementById('view-wysiwyg-btn');
        const pillSource = document.getElementById('view-source-btn');
        const pillSplit = document.getElementById('view-split-btn');
        const formatSelect = document.getElementById('tb-format');
        const btnBold = document.getElementById('tb-bold');
        const btnItalic = document.getElementById('tb-italic');
        const btnUnderline = document.getElementById('tb-underline');
        const btnCode = document.getElementById('tb-code');
        const btnUl = document.getElementById('tb-ul');
        const btnOl = document.getElementById('tb-ol');
        const btnBoxBlue = document.getElementById('tb-box-blue');
        const btnBoxEmerald = document.getElementById('tb-box-emerald');
        const btnBoxAmber = document.getElementById('tb-box-amber');
        const btnCard = document.getElementById('tb-box-card');
        const btnInsertStencil = document.getElementById('tb-insert-stencil');
        const btnInsertTtd = document.getElementById('tb-insert-ttd');
        const btnInsertMath = document.getElementById('tb-insert-math');
        const btnRenderMath = document.getElementById('tb-render-math');
        let currentMode = 'wysiwyg';
        let isWysiwygDirty = false;
        let isSourceDirty = false;
        let lastWysiwygRange = null;
        const saveWysiwygRange = () => {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const r = sel.getRangeAt(0);
                if (wysiwygDiv.contains(r.commonAncestorContainer)) {
                    lastWysiwygRange = r.cloneRange();
                }
            }
        };
        document.addEventListener('selectionchange', saveWysiwygRange);
        wysiwygDiv.addEventListener('keyup', saveWysiwygRange);
        wysiwygDiv.addEventListener('mouseup', saveWysiwygRange);
        const protectStencils = (root) => {
            root.querySelectorAll('fsd-ref, cas-ref, ttd-ref').forEach((el) => {
                el.setAttribute('contenteditable', 'false');
                if (el.tagName.toLowerCase() === 'ttd-ref' && !el.querySelector('.ttd-chip-del')) {
                    const delBtn = document.createElement('span');
                    delBtn.className = 'ttd-chip-del';
                    delBtn.title = 'Delete TTD tag';
                    delBtn.setAttribute('contenteditable', 'false');
                    delBtn.textContent = '✕';
                    el.appendChild(delBtn);
                }
            });
        };
        const cleanWysiwygHtml = (html) => {
            return html
                .replace(/<span class="ttd-chip-del"[^>]*>.*?<\/span>/gi, '')
                .replace(/\s+contenteditable="false"/gi, '')
                .replace(/\s+spellcheck="false"/gi, '');
        };
        const updateStats = () => {
            const text = currentMode === 'source' ? textarea.value : (wysiwygDiv.innerText || '');
            const chars = (currentMode === 'source' ? textarea.value.length : (wysiwygDiv.innerHTML.length));
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            charCount.textContent = `${chars.toLocaleString()} chars • ${words.toLocaleString()} words`;
        };
        // Initialize editor content with pristine raw HTML
        wysiwygDiv.innerHTML = currentHtml;
        protectStencils(wysiwygDiv);
        textarea.value = currentHtml;
        updateStats();
        // In-situ click on ttd-ref chips inside visual editor to modify or delete
        wysiwygDiv.addEventListener('click', (e) => {
            const target = e.target;
            // Direct click on inline delete button (✕)
            if (target.classList.contains('ttd-chip-del') || target.closest('.ttd-chip-del')) {
                e.preventDefault();
                e.stopPropagation();
                const chip = target.closest('ttd-ref');
                if (chip) {
                    chip.remove();
                    isWysiwygDirty = true;
                    if (currentMode === 'split') {
                        textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                    }
                    updateStats();
                    StudioOverlay.showToast('✓ Deleted <ttd-ref> tag.');
                }
                return;
            }
            const ttdRef = target.closest('ttd-ref');
            if (ttdRef) {
                e.preventDefault();
                e.stopPropagation();
                const currentExp = ttdRef.getAttribute('exp') || '';
                StudioOverlay.openTtdInFullCanvas(currentExp, (returnedExp, returnedFmt, isValid, action) => {
                    if (action === 'delete') {
                        ttdRef.remove();
                        isWysiwygDirty = true;
                        if (currentMode === 'split') {
                            textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                        }
                        updateStats();
                        StudioOverlay.showToast('✓ Deleted <ttd-ref> tag from document.');
                        return;
                    }
                    if (!returnedExp || !returnedExp.trim()) {
                        ttdRef.remove();
                        isWysiwygDirty = true;
                        if (currentMode === 'split') {
                            textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                        }
                        updateStats();
                        StudioOverlay.showToast('✓ Removed empty <ttd-ref> tag from document.');
                        return;
                    }
                    if (isValid === false) {
                        StudioOverlay.showToast('⚠️ Expression was incomplete. Chip was not changed.', true);
                        return;
                    }
                    ttdRef.setAttribute('exp', returnedExp);
                    ttdRef.setAttribute('style', 'color:firebrick;font-weight:bold');
                    ttdRef.innerHTML = `${returnedFmt}<span class="ttd-chip-del" title="Delete TTD tag" contenteditable="false">✕</span>`;
                    isWysiwygDirty = true;
                    if (currentMode === 'split') {
                        textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                    }
                    updateStats();
                    StudioOverlay.showToast(`✓ Updated TTD expression: ${returnedFmt}`);
                }, true);
            }
        });
        // Initial MathJax rendering in visual editor
        if (window.MathJax?.typesetPromise) {
            window.MathJax.typesetPromise([wysiwygDiv]).catch(() => { });
        }
        // View Mode Switcher
        const setMode = (mode) => {
            if (mode === currentMode)
                return;
            // Synchronize contents across views before switching if modified
            if (currentMode === 'wysiwyg') {
                if (isWysiwygDirty) {
                    textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                    isWysiwygDirty = false;
                }
            }
            else if (currentMode === 'source') {
                if (isSourceDirty) {
                    wysiwygDiv.innerHTML = textarea.value;
                    protectStencils(wysiwygDiv);
                    isSourceDirty = false;
                }
            }
            else if (currentMode === 'split') {
                if (isSourceDirty) {
                    wysiwygDiv.innerHTML = textarea.value;
                    protectStencils(wysiwygDiv);
                    isSourceDirty = false;
                    isWysiwygDirty = false;
                }
                else if (isWysiwygDirty) {
                    textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                    isWysiwygDirty = false;
                }
            }
            currentMode = mode;
            panesContainer.className = `studio-editor-panes mode-${mode}`;
            pillWysiwyg.classList.toggle('active', mode === 'wysiwyg');
            pillSource.classList.toggle('active', mode === 'source');
            pillSplit.classList.toggle('active', mode === 'split');
            if (mode === 'source') {
                textarea.focus();
            }
            else if (mode === 'wysiwyg') {
                wysiwygDiv.focus();
            }
            else {
                textarea.focus();
            }
            updateStats();
        };
        pillWysiwyg.addEventListener('click', () => setMode('wysiwyg'));
        pillSource.addEventListener('click', () => setMode('source'));
        pillSplit.addEventListener('click', () => setMode('split'));
        // Helper: Insert HTML snippet at active cursor/selection
        const insertHtmlSnippet = (html) => {
            if (currentMode === 'source') {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const val = textarea.value;
                textarea.value = val.substring(0, start) + html + val.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + html.length;
                textarea.focus();
                updateStats();
                return;
            }
            wysiwygDiv.focus();
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                range.deleteContents();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                const frag = document.createDocumentFragment();
                let node;
                let lastNode = null;
                while ((node = tempDiv.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                range.insertNode(frag);
                if (lastNode) {
                    range.setStartAfter(lastNode);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                protectStencils(wysiwygDiv);
                updateStats();
            }
        };
        // Toolbar: Block Formats
        formatSelect.addEventListener('change', () => {
            const val = formatSelect.value;
            if (currentMode !== 'source') {
                wysiwygDiv.focus();
                document.execCommand('formatBlock', false, `<${val}>`);
            }
        });
        // Toolbar: Inline Typography
        btnBold.addEventListener('click', () => {
            if (currentMode !== 'source') {
                wysiwygDiv.focus();
                document.execCommand('bold');
            }
        });
        btnItalic.addEventListener('click', () => {
            if (currentMode !== 'source') {
                wysiwygDiv.focus();
                document.execCommand('italic');
            }
        });
        btnUnderline.addEventListener('click', () => {
            if (currentMode !== 'source') {
                wysiwygDiv.focus();
                document.execCommand('underline');
            }
        });
        btnCode.addEventListener('click', () => {
            if (currentMode === 'source') {
                insertHtmlSnippet('<code>code</code>');
            }
            else {
                wysiwygDiv.focus();
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const code = document.createElement('code');
                    code.appendChild(range.extractContents());
                    range.insertNode(code);
                }
                else {
                    insertHtmlSnippet('<code>code</code>');
                }
            }
        });
        // Toolbar: Lists
        btnUl.addEventListener('click', () => {
            if (currentMode !== 'source') {
                wysiwygDiv.focus();
                document.execCommand('insertUnorderedList');
            }
        });
        btnOl.addEventListener('click', () => {
            if (currentMode !== 'source') {
                wysiwygDiv.focus();
                document.execCommand('insertOrderedList');
            }
        });
        // Toolbar: MWM Callout Containers
        btnBoxBlue.addEventListener('click', () => {
            insertHtmlSnippet('\n<div class="box-blue"><b>Note:</b> Enter conceptual note here...</div>\n<p><br></p>');
        });
        btnBoxEmerald.addEventListener('click', () => {
            insertHtmlSnippet('\n<div class="box-emerald"><b>Theorem:</b> Enter machine-verified claim or invariant...</div>\n<p><br></p>');
        });
        btnBoxAmber.addEventListener('click', () => {
            insertHtmlSnippet('\n<div class="box-amber"><b>Caution:</b> Enter caution or boundary condition...</div>\n<p><br></p>');
        });
        btnCard.addEventListener('click', () => {
            insertHtmlSnippet('\n<div class="card">\n  <h3>Section Header</h3>\n  <p>Enter narrative content here...</p>\n</div>\n<p><br></p>');
        });
        // Toolbar: Stencils & Mathematical Notation
        btnInsertStencil.addEventListener('click', () => {
            StudioOverlay.openStencilPicker((tag) => {
                insertHtmlSnippet(tag);
            });
        });
        btnInsertTtd?.addEventListener('mousedown', (e) => {
            // Prevent button click from clearing active selection in wysiwygDiv
            e.preventDefault();
            saveWysiwygRange();
        });
        btnInsertTtd?.addEventListener('click', () => {
            saveWysiwygRange();
            let savedSourcePos = null;
            if (currentMode === 'source') {
                savedSourcePos = {
                    start: textarea.selectionStart,
                    end: textarea.selectionEnd
                };
            }
            else {
                // In WYSIWYG or Split mode: place temporary marker at caret
                const oldMarker = document.getElementById('studio-ttd-caret-marker');
                if (oldMarker)
                    oldMarker.remove();
                const marker = document.createElement('span');
                marker.id = 'studio-ttd-caret-marker';
                marker.style.display = 'inline-block';
                marker.style.width = '0';
                marker.style.height = '0';
                marker.style.overflow = 'hidden';
                const sel = window.getSelection();
                let range = null;
                if (sel && sel.rangeCount > 0 && wysiwygDiv.contains(sel.getRangeAt(0).commonAncestorContainer)) {
                    range = sel.getRangeAt(0);
                }
                else if (lastWysiwygRange && wysiwygDiv.contains(lastWysiwygRange.commonAncestorContainer)) {
                    range = lastWysiwygRange;
                }
                if (range) {
                    range.deleteContents();
                    range.insertNode(marker);
                }
                else {
                    wysiwygDiv.appendChild(marker);
                }
            }
            StudioOverlay.openTtdInFullCanvas('', (returnedExp, returnedFmt, isValid, action) => {
                const marker = document.getElementById('studio-ttd-caret-marker');
                if (action === 'delete') {
                    if (marker)
                        marker.remove();
                    StudioOverlay.showToast('TTD insertion cancelled.');
                    return;
                }
                if (!returnedExp || !returnedExp.trim() || isValid === false) {
                    if (marker)
                        marker.remove();
                    StudioOverlay.showToast(isValid === false ? '⚠️ Incomplete expression. Tag not inserted.' : 'TTD cancelled (no expression entered).');
                    return;
                }
                const tag = `<ttd-ref exp="${returnedExp}" style="color:firebrick;font-weight:bold">${returnedFmt}</ttd-ref>`;
                if (currentMode === 'source' && savedSourcePos) {
                    const val = textarea.value;
                    textarea.value = val.substring(0, savedSourcePos.start) + tag + val.substring(savedSourcePos.end);
                    textarea.selectionStart = textarea.selectionEnd = savedSourcePos.start + tag.length;
                    textarea.focus();
                    isSourceDirty = true;
                    updateStats();
                    StudioOverlay.showToast(`✓ Inserted TTD tag: ${returnedFmt}`);
                    return;
                }
                // In WYSIWYG or Split mode:
                if (marker && marker.parentNode) {
                    const temp = document.createElement('div');
                    temp.innerHTML = tag;
                    protectStencils(temp);
                    const newEl = temp.firstElementChild;
                    if (newEl) {
                        marker.parentNode.insertBefore(newEl, marker);
                        marker.remove();
                        // Place caret immediately after the new tag
                        wysiwygDiv.focus();
                        const newSel = window.getSelection();
                        if (newSel) {
                            const newRange = document.createRange();
                            newRange.setStartAfter(newEl);
                            newRange.collapse(true);
                            newSel.removeAllRanges();
                            newSel.addRange(newRange);
                            lastWysiwygRange = newRange.cloneRange();
                        }
                    }
                    else {
                        marker.remove();
                    }
                }
                else {
                    insertHtmlSnippet(tag);
                }
                if (currentMode === 'split') {
                    textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                }
                isWysiwygDirty = true;
                updateStats();
                StudioOverlay.showToast(`✓ Inserted TTD tag: ${returnedFmt}`);
            }, false);
        });
        btnInsertMath.addEventListener('click', () => {
            insertHtmlSnippet(' $\\omega = \\text{transfinite}$ ');
        });
        btnRenderMath.addEventListener('click', async () => {
            btnRenderMath.textContent = '⏳ Rendering...';
            if (window.MathJax?.typesetPromise) {
                try {
                    await window.MathJax.typesetPromise([wysiwygDiv]);
                    StudioOverlay.showToast('✓ Math rendered in visual editor.');
                }
                catch (e) {
                    console.error('MathJax error:', e);
                }
            }
            btnRenderMath.innerHTML = '<span>🔄 Render Math</span>';
        });
        // Unicode Symbol Insertion from Toolbar Chips & Palette Cells
        modal.querySelectorAll('.studio-sym-chip, .studio-sym-cell').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const sym = btn.getAttribute('data-sym');
                if (sym) {
                    insertHtmlSnippet(sym);
                }
            });
        });
        // Toggle Unicode More Popover
        const btnUnicodeMore = document.getElementById('tb-unicode-more');
        const unicodePopover = document.getElementById('studio-unicode-popover');
        btnUnicodeMore?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (unicodePopover) {
                const isHidden = unicodePopover.style.display === 'none';
                unicodePopover.style.display = isHidden ? 'flex' : 'none';
            }
        });
        document.getElementById('studio-unicode-close')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (unicodePopover)
                unicodePopover.style.display = 'none';
        });
        modal.addEventListener('click', (e) => {
            if (unicodePopover && unicodePopover.style.display !== 'none') {
                if (!unicodePopover.contains(e.target) && e.target !== btnUnicodeMore) {
                    unicodePopover.style.display = 'none';
                }
            }
        });
        // Split Mode Live Sync
        let wysiwygSyncTimer = null;
        wysiwygDiv.addEventListener('input', () => {
            isWysiwygDirty = true;
            updateStats();
            if (currentMode === 'split') {
                clearTimeout(wysiwygSyncTimer);
                wysiwygSyncTimer = setTimeout(() => {
                    textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                    isWysiwygDirty = false;
                }, 300);
            }
        });
        let sourceSyncTimer = null;
        textarea.addEventListener('input', () => {
            isSourceDirty = true;
            updateStats();
            if (currentMode === 'split') {
                clearTimeout(sourceSyncTimer);
                sourceSyncTimer = setTimeout(() => {
                    wysiwygDiv.innerHTML = textarea.value;
                    protectStencils(wysiwygDiv);
                    isSourceDirty = false;
                }, 400);
            }
        });
        // Close handlers
        const closeModal = () => {
            document.removeEventListener('selectionchange', saveWysiwygRange);
            modal.remove();
        };
        document.getElementById('content-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-content')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal)
                closeModal();
        });
        // Version Dropdown Switcher (Established Canonical vs stagedSegs Drafts)
        const versionSelect = document.getElementById('editor-version-select');
        versionSelect?.addEventListener('change', async () => {
            const val = versionSelect.value;
            if (val === 'established') {
                wysiwygDiv.innerHTML = establishedHtml;
                protectStencils(wysiwygDiv);
                textarea.value = establishedHtml;
                isWysiwygDirty = false;
                isSourceDirty = false;
                updateStats();
                if (window.MathJax?.typesetPromise) {
                    window.MathJax.typesetPromise([wysiwygDiv]).catch(() => { });
                }
                StudioOverlay.showToast(`Displaying Established (Canonical) version of '${Nav.segId}'.`);
            }
            else if (val.startsWith('staged:')) {
                const draftSegId = val.replace('staged:', '');
                const found = allStaged.find((s) => s.segId === draftSegId);
                let draftHtml = found?.contentHtml;
                if (!draftHtml) {
                    try {
                        const r = await fetch(`${getApiBaseUrl()}/api/staged-segments/${draftSegId}`);
                        const d = await r.json();
                        draftHtml = d?.contentHtml;
                    }
                    catch { }
                }
                if (draftHtml) {
                    wysiwygDiv.innerHTML = draftHtml;
                    protectStencils(wysiwygDiv);
                    textarea.value = draftHtml;
                    isWysiwygDirty = false;
                    isSourceDirty = false;
                    updateStats();
                    if (window.MathJax?.typesetPromise) {
                        window.MathJax.typesetPromise([wysiwygDiv]).catch(() => { });
                    }
                    StudioOverlay.showToast(`Displaying draft from stagedSegs/${draftSegId}.html`);
                }
            }
        });
        // Action: Promote All stagedSegs directly from editor footer
        document.getElementById('btn-promote-from-editor')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-promote-from-editor');
            btn.disabled = true;
            btn.textContent = '⏳ Updating Established & DB...';
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/promote-staged-segments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ app: 'app1' })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    StudioOverlay.showToast(`🎉 ${data.message}`);
                    closeModal();
                    StudioOverlay.checkStagedCount();
                    StudioOverlay.handleReload();
                }
                else {
                    throw new Error(data.message || 'Promotion failed');
                }
            }
            catch (e) {
                StudioOverlay.showToast(`❌ Error: ${e.message}`, true);
                btn.disabled = false;
                btn.textContent = '🚀 Update Established Segs & DB';
            }
        });
        // Action: Stage Draft to stagedSegs/ directory on disk
        document.getElementById('btn-stage-content')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-stage-content');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.textContent = '⏳ Staging...';
            const finalHtml = (currentMode === 'source' || currentMode === 'split' || isSourceDirty)
                ? textarea.value
                : cleanWysiwygHtml(wysiwygDiv.innerHTML);
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/stage-segment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        segId: Nav.segId,
                        contentHtml: finalHtml
                    })
                });
                const data = await res.json();
                if (data.status === 'success' || data.ok) {
                    // Update in-memory session and DOM so the user sees their changes immediately
                    Nav.segMap.set(Nav.segId, finalHtml);
                    Nav.segDiv.elt.innerHTML = finalHtml;
                    initAnyDJSI();
                    if (window.MathJax?.typesetPromise) {
                        await window.MathJax.typesetPromise([Nav.segDiv.elt]);
                    }
                    Nav.setSegPos();
                    closeModal();
                    StudioOverlay.showToast(`✓ Staged '${Nav.segId}' to stagedSegs/ (${data.filePath || data.filename || ''})`);
                    StudioOverlay.checkStagedCount();
                }
                else {
                    throw new Error(data.message || data.error || 'Failed to stage segment');
                }
            }
            catch (err) {
                console.error('Staging error:', err);
                StudioOverlay.showToast(`❌ Error staging segment: ${err.message}`, true);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
        // Action: Apply Changes to In-Memory Dev Session
        document.getElementById('btn-save-content')?.addEventListener('click', async () => {
            const finalHtml = (currentMode === 'source' || currentMode === 'split' || isSourceDirty)
                ? textarea.value
                : cleanWysiwygHtml(wysiwygDiv.innerHTML);
            Nav.segMap.set(Nav.segId, finalHtml);
            Nav.segDiv.elt.innerHTML = finalHtml;
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
    // 5b. NATIVE FULL TTD CANVAS STAGE DISPATCH & RETURN
    // =========================================================================
    static openTtdInFullCanvas(initialExp = '', onReturn, isEditingExisting = false) {
        const contentModal = document.getElementById('studio-content-modal');
        // Temporarily hide Content Editor modal so DOM state & unsaved prose are preserved
        if (contentModal) {
            contentModal.style.display = 'none';
        }
        // Set up native TTD on Nav.fo
        Nav.setLastVisit();
        ttd.clear();
        ttd.pxe.exp = initialExp ? initialExp.trim() : '';
        let nl = 0;
        for (const ch of ttd.pxe.exp) {
            if (ch === '[')
                nl++;
            else if (ch === ']')
                nl--;
        }
        ttd.pxe.nl = Math.max(0, nl);
        ttd.pxe.displayText();
        ttd.setContentEditorCallback((returnedExp, returnedFmt, isValid, action) => {
            // Restore Nav & chapter segment in fo
            Nav.loadSegment();
            Nav.setSegPos();
            Nav.display();
            // Unhide Content Editor modal
            if (contentModal) {
                contentModal.style.display = '';
            }
            if (onReturn) {
                onReturn(returnedExp, returnedFmt, isValid, action);
            }
        }, isEditingExisting);
        Nav.fo.removeChildren();
        Nav.fo.append(ttd);
        ttd.layoutEditor();
        if (initialExp.trim() && ttd.pxe.displayState === 'Valid') {
            ttd.displayTable();
        }
        Nav.display();
        if (isEditingExisting) {
            StudioOverlay.showToast('🚀 Native TTD active. Edit formula and click "return to content editor", or click "delete tag from document".');
        }
        else {
            StudioOverlay.showToast('🚀 Native TTD active. Build expression and click "return to content editor".');
        }
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
    static renderSegmentOptions(selectedSegId, sortMode = 'name') {
        let items = [];
        if (StudioOverlay.cachedConsolidatedSegments && StudioOverlay.cachedConsolidatedSegments.length > 0) {
            items = StudioOverlay.cachedConsolidatedSegments.map((s) => ({
                segId: s.segId,
                modifiedMs: s.modifiedMs || 0,
                modifiedAt: s.modifiedAt,
                isStaged: !!s.isStaged,
            }));
        }
        else if (StudioOverlay.cachedSegments && StudioOverlay.cachedSegments.length > 0) {
            items = StudioOverlay.cachedSegments.map((s) => ({
                segId: s.seg_key,
                modifiedMs: 0,
                isStaged: false,
            }));
        }
        const stagedItems = items.filter(it => it.isStaged);
        const canonicalItems = items.filter(it => !it.isStaged);
        const sortFn = (a, b) => {
            if (sortMode === 'date') {
                return (b.modifiedMs || 0) - (a.modifiedMs || 0);
            }
            return a.segId.localeCompare(b.segId, undefined, { sensitivity: 'base' });
        };
        stagedItems.sort(sortFn);
        canonicalItems.sort(sortFn);
        const renderOption = (s) => {
            const isSel = s.segId === selectedSegId ? 'selected' : '';
            let dateLabel = '';
            if (sortMode === 'date' && s.modifiedMs > 0) {
                const d = new Date(s.modifiedMs);
                const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`;
                dateLabel = ` (${dateStr})`;
            }
            const prefix = s.isStaged ? '📦 ' : '';
            return `<option value="${StudioOverlay.escapeHtml(s.segId)}" ${isSel}>${prefix}${StudioOverlay.escapeHtml(s.segId)}${dateLabel}</option>`;
        };
        let html = '';
        if (selectedSegId && !items.some((it) => it.segId === selectedSegId)) {
            html += `<option value="${StudioOverlay.escapeHtml(selectedSegId)}" selected>${StudioOverlay.escapeHtml(selectedSegId)} (current)</option>`;
        }
        if (stagedItems.length > 0) {
            html += `<optgroup label="📦 Staged Drafts (stagedSegs/)">` + stagedItems.map(renderOption).join('') + `</optgroup>`;
        }
        if (canonicalItems.length > 0) {
            html += (stagedItems.length > 0 ? `<optgroup label="Canonical Segments">` : '') +
                canonicalItems.map(renderOption).join('') +
                (stagedItems.length > 0 ? `</optgroup>` : '');
        }
        return html;
    }
    static async loadSegmentCatalog() {
        try {
            const [navRes, consRes] = await Promise.all([
                fetchNavItems('app1').catch(() => []),
                fetchConsolidatedSegmentsApi().catch(() => []),
            ]);
            StudioOverlay.cachedSegments = (navRes || [])
                .filter((n) => n.segment_id && n.topic)
                .map((n) => ({
                id: n.segment_id,
                seg_key: String(n.segment_id),
                title: n.topic,
            }));
            if (consRes && consRes.length > 0) {
                StudioOverlay.cachedConsolidatedSegments = consRes;
            }
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
                                <div style="font-family: monospace; font-weight: 700; color: #d97706; min-width: 110px;">[📦 Staged]</div>
                                <div><strong>2-Phase Staging & Promotion:</strong> Review drafts saved in <code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">stagedSegs/</code> before modifying source code. Promote drafts directly into canonical source files (<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">app1/segs/</code>), regenerate seeds, update PostgreSQL, and rebuild <code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">app1/dist/index.html</code> in one coordinated operation.</div>
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
    // =========================================================================
    // 9. STAGED SEGMENTS REVIEW & PROMOTION MODAL
    // =========================================================================
    static async checkStagedCount() {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/staged-segments`);
            const data = await res.json();
            if (data && data.status === 'success' && Array.isArray(data.staged)) {
                const count = data.staged.length;
                if (StudioOverlay.stagedWidget) {
                    if (count > 0) {
                        StudioOverlay.stagedWidget.setV(`[🚀 Update from stagedSegs (${count})]`);
                        StudioOverlay.stagedWidget.setAA(['stroke', '#d97706', 'font-weight', 'bold']);
                    }
                    else {
                        StudioOverlay.stagedWidget.setV(`[📦 stagedSegs (0)]`);
                        StudioOverlay.stagedWidget.setAA(['stroke', '#64748b', 'font-weight', 'normal']);
                    }
                    StudioOverlay.updateWidth();
                }
            }
        }
        catch {
            // Ignore if backend not reachable
        }
    }
    static async openStagedReviewModal() {
        const existing = document.getElementById('studio-staged-modal');
        if (existing) {
            existing.remove();
            return;
        }
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'studio-staged-modal';
        modalOverlay.className = 'studio-modal-backdrop';
        modalOverlay.innerHTML = `
            <div class="studio-modal-dialog large" style="max-height: 85vh;">
                <div class="studio-modal-header">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.4rem;">📦</span>
                        <div>
                            <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a;" id="staged-modal-title">Update Established Segments &amp; DB from stagedSegs/</h3>
                            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">Promote drafted chapters from stagedSegs/ into canonical source files (app1/segs/) and PostgreSQL</div>
                        </div>
                    </div>
                    <button class="studio-close-btn" id="staged-close-btn">✕</button>
                </div>
                <div class="studio-modal-body" style="gap: 16px;">
                    
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 0.88rem; color: #92400e;">
                        <strong>2-Phase Staging Workflow:</strong> Drafts saved in <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">stagedSegs/</code> allow you to draft, diff, and review edits without touching canonical source files. When ready, click <strong>Update Established Segments &amp; Reseed DB</strong> below to copy all stagedSegs to <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">app1/segs/</code>, regenerate <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">db/seed_v2.sql</code>, update PostgreSQL, rebuild <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">index.html</code>, and clear the staged directory.
                    </div>

                    <div id="staged-list-container" class="studio-staged-list">
                        <div style="text-align: center; padding: 30px; color: #94a3b8;">
                            ⏳ Loading staged segments...
                        </div>
                    </div>

                </div>
                <div class="studio-modal-footer" style="padding: 12px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button class="studio-btn danger small" id="btn-discard-all" style="display: none;">🗑️ Discard All</button>
                    </div>
                    <div class="studio-btn-group" style="gap: 10px;">
                        <button class="studio-btn secondary" id="btn-close-staged">Close</button>
                        <button class="studio-btn emerald" id="btn-promote-all" style="display: none; font-weight: 700; padding: 10px 18px; font-size: 0.95rem;">🚀 Update Established Segments &amp; Reseed DB (Clears stagedSegs/)</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
        const closeModal = () => {
            modalOverlay.remove();
            StudioOverlay.checkStagedCount();
        };
        document.getElementById('staged-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('btn-close-staged')?.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay)
                closeModal();
        });
        const listContainer = document.getElementById('staged-list-container');
        const btnPromoteAll = document.getElementById('btn-promote-all');
        const btnDiscardAll = document.getElementById('btn-discard-all');
        const modalTitle = document.getElementById('staged-modal-title');
        const loadStagedList = async () => {
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/staged-segments`);
                const data = await res.json();
                if (!data || data.status !== 'success' || !Array.isArray(data.staged)) {
                    throw new Error(data?.message || 'Invalid server response');
                }
                const staged = data.staged;
                modalTitle.textContent = `Staged Segments (${staged.length})`;
                if (staged.length === 0) {
                    listContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px;">
                            <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📭</span>
                            <strong style="color: #475569; font-size: 1rem; display: block;">No Staged Segments in stagedSegs/</strong>
                            <p style="color: #64748b; font-size: 0.85rem; margin: 6px 0 0 0;">
                                To stage an edit, open any chapter in the Content Editor (<code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">[✏️ Content]</code>) and click <strong>💾 Save to stagedSegs</strong>.
                            </p>
                        </div>
                    `;
                    btnPromoteAll.style.display = 'none';
                    btnDiscardAll.style.display = 'none';
                    StudioOverlay.checkStagedCount();
                    return;
                }
                btnPromoteAll.style.display = 'inline-block';
                btnDiscardAll.style.display = 'inline-block';
                const currentOutline = StudioOverlay.exportCurrentOutlineTree();
                const findLinkPath = (segId, nodes, path = []) => {
                    for (const node of nodes) {
                        const currentPath = [...path, node.topic];
                        if (node.htmlSegmentId === segId) {
                            return currentPath.join(' › ');
                        }
                        if (node.indexDesc && Array.isArray(node.indexDesc)) {
                            const res = findLinkPath(segId, node.indexDesc, currentPath);
                            if (res)
                                return res;
                        }
                    }
                    return null;
                };
                let unlinkedCount = 0;
                listContainer.innerHTML = '';
                for (const item of staged) {
                    const linkPath = findLinkPath(item.segId, currentOutline);
                    const isLinked = !!linkPath;
                    if (!isLinked)
                        unlinkedCount++;
                    const badgeHtml = isLinked
                        ? `<span style="background:#dcfce7; color:#166534; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600;">✓ Linked: ${StudioOverlay.escapeHtml(linkPath)}</span>`
                        : `<span style="background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600;">⚠️ Not yet linked in Outline</span>`;
                    const card = document.createElement('div');
                    card.className = 'studio-staged-card';
                    const kb = (item.bytes / 1024).toFixed(1);
                    const modDate = new Date(item.modifiedMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    card.innerHTML = `
                        <div class="studio-staged-info">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span class="studio-staged-name">${StudioOverlay.escapeHtml(item.segId)}.html</span>
                                <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">${StudioOverlay.escapeHtml(item.title)}</span>
                                ${badgeHtml}
                            </div>
                            <div class="studio-staged-meta">
                                <span>${kb} KB</span> • <span>Modified: ${modDate}</span> • <code>stagedSegs/${StudioOverlay.escapeHtml(item.filename)}</code>
                            </div>
                        </div>
                        <div class="studio-staged-actions">
                            <button class="studio-btn secondary small btn-preview-item" data-seg="${item.segId}" title="Load into Content Editor">✏️ Preview / Edit</button>
                            <button class="studio-btn danger small btn-discard-item" data-seg="${item.segId}" title="Discard staged draft">🗑️ Discard</button>
                        </div>
                    `;
                    // Preview / Edit handler
                    card.querySelector('.btn-preview-item')?.addEventListener('click', async () => {
                        Nav.segId = item.segId;
                        if (item.contentHtml) {
                            Nav.segMap.set(item.segId, item.contentHtml);
                            Nav.segDiv.elt.innerHTML = item.contentHtml;
                            initAnyDJSI();
                            if (window.MathJax?.typesetPromise) {
                                await window.MathJax.typesetPromise([Nav.segDiv.elt]);
                            }
                            Nav.setSegPos();
                        }
                        closeModal();
                        StudioOverlay.openContentEditor();
                    });
                    // Discard single draft handler
                    card.querySelector('.btn-discard-item')?.addEventListener('click', async () => {
                        if (!confirm(`Discard staged draft for '${item.segId}'?`))
                            return;
                        try {
                            const delRes = await fetch(`${getApiBaseUrl()}/api/staged-segments/${item.segId}`, {
                                method: 'DELETE'
                            });
                            const delData = await delRes.json();
                            if (delData.status === 'success') {
                                StudioOverlay.showToast(`✓ Discarded draft '${item.segId}'.`);
                                loadStagedList();
                                StudioOverlay.checkStagedCount();
                            }
                            else {
                                throw new Error(delData.message || 'Failed to discard');
                            }
                        }
                        catch (e) {
                            StudioOverlay.showToast(`❌ Error: ${e.message}`, true);
                        }
                    });
                    listContainer.appendChild(card);
                }
                if (unlinkedCount > 0) {
                    const notice = document.createElement('div');
                    notice.style.cssText = 'background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:10px 14px; margin-bottom:12px; font-size:0.84rem; color:#92400e; line-height:1.5;';
                    notice.innerHTML = `<strong>⚠️ Action Required:</strong> ${unlinkedCount} staged segment(s) are not yet connected to the curriculum outline. Any staged segment must be hooked up to an index entry before being promoted. Switch to <strong>[✏️ Edit]</strong> mode and link them in the outline first.`;
                    listContainer.prepend(notice);
                }
                StudioOverlay.checkStagedCount();
            }
            catch (err) {
                listContainer.innerHTML = `
                    <div style="color: #b91c1c; background: #fee2e2; padding: 14px; border-radius: 6px;">
                        ❌ Failed to load staged segments: ${err.message}
                    </div>
                `;
            }
        };
        // Discard all handler
        btnDiscardAll.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to discard ALL staged drafts in stagedSegs/? This cannot be undone.'))
                return;
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/staged-segments`, { method: 'DELETE' });
                const data = await res.json();
                if (data.status === 'success') {
                    StudioOverlay.showToast('✓ All staged drafts discarded.');
                    loadStagedList();
                    StudioOverlay.checkStagedCount();
                }
                else {
                    throw new Error(data.message || 'Failed to discard all');
                }
            }
            catch (e) {
                StudioOverlay.showToast(`❌ Error: ${e.message}`, true);
            }
        });
        // Promote all handler
        btnPromoteAll.addEventListener('click', async () => {
            const currentOutline = StudioOverlay.exportCurrentOutlineTree();
            const findLink = (segId, nodes) => {
                for (const node of nodes) {
                    if (node.htmlSegmentId === segId)
                        return true;
                    if (node.indexDesc && findLink(segId, node.indexDesc))
                        return true;
                }
                return false;
            };
            // Ensure all staged segments are connected to the outline before promoting
            try {
                const checkRes = await fetch(`${getApiBaseUrl()}/api/staged-segments`);
                const checkData = await checkRes.json();
                if (checkData?.staged && Array.isArray(checkData.staged)) {
                    const unlinked = checkData.staged.filter((s) => !findLink(s.segId, currentOutline));
                    if (unlinked.length > 0) {
                        alert(`Cannot promote: All staged segments must be connected to an index entry first.\n\nPlease link the following segment(s) in Outline Edit mode:\n• ` + unlinked.map((u) => u.segId).join('\n• '));
                        return;
                    }
                }
            }
            catch (err) {
                console.warn('Pre-promotion check error:', err);
            }
            btnPromoteAll.disabled = true;
            btnPromoteAll.textContent = '⏳ Promoting, Reseeding & Building...';
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/promote-staged-segments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        app: 'app1',
                        outlineTree: currentOutline
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    StudioOverlay.showToast(`🎉 ${data.message}`);
                    closeModal();
                    StudioOverlay.checkStagedCount();
                    // Reload active chapter from database to reflect changes live
                    StudioOverlay.handleReload();
                }
                else {
                    throw new Error(data.message || 'Failed to promote staged segments');
                }
            }
            catch (e) {
                console.error('Promotion error:', e);
                StudioOverlay.showToast(`❌ Promotion failed: ${e.message}`, true);
                btnPromoteAll.disabled = false;
                btnPromoteAll.textContent = '🚀 Update Established Segments & Reseed DB (Clears stagedSegs/)';
            }
        });
        loadStagedList();
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
            .studio-modal-dialog.xlarge {
                width: 1180px;
                max-width: 96vw;
                height: 90vh;
            }
            .studio-view-pills {
                display: flex;
                background: #e2e8f0;
                padding: 3px;
                border-radius: 8px;
                gap: 2px;
            }
            .studio-pill {
                background: transparent;
                border: none;
                padding: 5px 12px;
                font-size: 0.82rem;
                font-weight: 600;
                color: #475569;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .studio-pill:hover {
                color: #0f172a;
            }
            .studio-pill.active {
                background: #ffffff;
                color: #2563eb;
                box-shadow: 0 1px 3px rgba(0,0,0,0.12);
            }
            .studio-editor-toolbar {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
                padding: 8px 16px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
            }
            .studio-tb-group {
                display: flex;
                align-items: center;
                gap: 3px;
            }
            .studio-tb-divider {
                width: 1px;
                height: 22px;
                background: #cbd5e1;
                margin: 0 4px;
            }
            .studio-tb-btn {
                background: #ffffff;
                border: 1px solid #cbd5e1;
                border-radius: 5px;
                padding: 4px 8px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #334155;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 4px;
                transition: all 0.15s;
            }
            .studio-tb-btn:hover {
                background: #f1f5f9;
                border-color: #94a3b8;
                color: #0f172a;
            }
            .studio-tb-btn:active {
                background: #e2e8f0;
            }
            .studio-tb-select {
                background: #ffffff;
                border: 1px solid #cbd5e1;
                border-radius: 5px;
                padding: 4px 8px;
                font-size: 0.8rem;
                font-weight: 600;
                color: #334155;
                cursor: pointer;
                outline: none;
            }
            .studio-symbol-chips {
                display: flex;
                align-items: center;
                gap: 2px;
                background: #f8fafc;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                padding: 2px 4px;
            }
            .studio-sym-chip {
                background: transparent;
                border: 1px solid transparent;
                border-radius: 4px;
                padding: 2px 6px;
                font-family: 'Cambria Math', 'Times New Roman', serif, monospace;
                font-size: 0.95rem;
                font-weight: 600;
                color: #1e293b;
                cursor: pointer;
                transition: all 0.12s;
                line-height: 1.2;
            }
            .studio-sym-chip:hover {
                background: #e2e8f0;
                border-color: #94a3b8;
                color: #1d4ed8;
                transform: scale(1.08);
            }
            .studio-unicode-popover {
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: 6px;
                width: 440px;
                max-height: 400px;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            .studio-unicode-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: #f8fafc;
                border-bottom: 1px solid #e2e8f0;
                font-size: 0.8rem;
                font-weight: 700;
                color: #334155;
            }
            .studio-unicode-close {
                background: transparent;
                border: none;
                font-size: 0.85rem;
                cursor: pointer;
                color: #64748b;
                padding: 2px 6px;
                border-radius: 4px;
            }
            .studio-unicode-close:hover {
                background: #fee2e2;
                color: #dc2626;
            }
            .studio-unicode-categories {
                padding: 10px;
                overflow-y: auto;
                max-height: 350px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .studio-unicode-section {
                display: flex;
                flex-direction: column;
            }
            .studio-unicode-cat-title {
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                color: #64748b;
                margin-bottom: 4px;
            }
            .studio-unicode-grid {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }
            .studio-sym-cell {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 4px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Cambria Math', 'Times New Roman', serif, monospace;
                font-size: 1.05rem;
                font-weight: 600;
                color: #0f172a;
                cursor: pointer;
                transition: all 0.12s;
            }
            .studio-sym-cell:hover {
                background: #eff6ff;
                border-color: #3b82f6;
                color: #1d4ed8;
                transform: scale(1.15);
            }
            .studio-editor-panes {
                display: flex;
                flex: 1;
                min-height: 0;
                overflow: hidden;
                position: relative;
            }
            .studio-editor-panes.mode-wysiwyg #pane-source {
                display: none !important;
            }
            .studio-editor-panes.mode-wysiwyg #pane-wysiwyg {
                display: flex !important;
                flex: 1;
                min-width: 0;
                min-height: 0;
                height: 100%;
            }
            .studio-editor-panes.mode-source #pane-wysiwyg {
                display: none !important;
            }
            .studio-editor-panes.mode-source #pane-source {
                display: flex !important;
                flex: 1;
                min-width: 0;
                min-height: 0;
                height: 100%;
            }
            .studio-editor-panes.mode-split #pane-wysiwyg {
                display: flex !important;
                flex: 1 1 50%;
                min-width: 0;
                min-height: 0;
                height: 100%;
                border-right: 2px solid #cbd5e1;
            }
            .studio-editor-panes.mode-split #pane-source {
                display: flex !important;
                flex: 1 1 50%;
                min-width: 0;
                min-height: 0;
                height: 100%;
            }
            .studio-pane {
                flex-direction: column;
                min-width: 0;
                min-height: 0;
                height: 100%;
                overflow: hidden;
            }
            #pane-source {
                background: #0f172a;
            }
            #pane-wysiwyg {
                overflow-y: auto;
                background: #ffffff;
            }
            .studio-wysiwyg-editor {
                flex: 1;
                padding: 24px 32px;
                background: #ffffff;
                color: #1e293b;
                outline: none;
                overflow-y: auto;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 15px;
                line-height: 1.65;
            }
            .studio-wysiwyg-editor h1 { font-size: 1.6rem; color: #0f172a; margin-top: 14px; margin-bottom: 8px; }
            .studio-wysiwyg-editor h2 { font-size: 1.35rem; color: #1e3a8a; margin-top: 18px; margin-bottom: 8px; }
            .studio-wysiwyg-editor h3 { font-size: 1.15rem; color: #1e40af; margin-top: 16px; margin-bottom: 6px; }
            .studio-wysiwyg-editor h4 { font-size: 1.0rem; color: #0369a1; margin-top: 14px; margin-bottom: 4px; }
            .studio-wysiwyg-editor p { margin: 8px 0; }
            .studio-wysiwyg-editor code { font-family: monospace; background: #f1f5f9; padding: 2px 5px; border-radius: 4px; color: #0f172a; font-size: 13.5px; }
            .studio-wysiwyg-editor pre { background: #0f172a; color: #f8fafc; padding: 12px 16px; border-radius: 6px; overflow-x: auto; font-family: monospace; }
            .studio-wysiwyg-editor pre code { background: transparent; color: inherit; padding: 0; }
            .studio-wysiwyg-editor .box-blue { background-color: #eff6ff; border: 1.5px solid #3b82f6; border-radius: 8px; padding: 14px 18px; color: #1e3a8a; margin: 14px 0; }
            .studio-wysiwyg-editor .box-emerald { background-color: #ecfdf5; border: 1.5px solid #10b981; border-radius: 8px; padding: 14px 18px; color: #064e3b; margin: 14px 0; }
            .studio-wysiwyg-editor .box-amber { background-color: #fffbeb; border: 1.5px solid #f59e0b; border-radius: 8px; padding: 14px 18px; color: #78350f; margin: 14px 0; }
            .studio-wysiwyg-editor .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 14px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
            .studio-wysiwyg-editor table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 14px; }
            .studio-wysiwyg-editor th { background: #1e3a8a; color: white; padding: 8px 12px; text-align: left; }
            .studio-wysiwyg-editor td { border-bottom: 1px solid #e2e8f0; padding: 8px 12px; }
            /* Atomic Stencil Chips in WYSIWYG */
            .studio-wysiwyg-editor fsd-ref, .studio-wysiwyg-editor cas-ref {
                display: inline-block;
                background: #eff6ff;
                border: 1.5px solid #3b82f6;
                border-radius: 6px;
                padding: 2px 8px;
                margin: 2px 4px;
                font-weight: 600;
                color: #1e40af;
                cursor: pointer;
                user-select: all;
            }
            .studio-wysiwyg-editor cas-ref {
                background: #ecfdf5;
                border-color: #10b981;
                color: #064e3b;
            }
            .studio-wysiwyg-editor ttd-ref {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                background: #fef2f2;
                border: 1.5px solid #dc2626;
                border-radius: 6px;
                padding: 2px 8px;
                margin: 2px 4px;
                font-weight: 700;
                color: #b91c1c;
                cursor: pointer;
                user-select: all;
                transition: all 0.15s ease;
                vertical-align: middle;
            }
            .studio-wysiwyg-editor ttd-ref:hover {
                background: #fee2e2;
                border-color: #991b1b;
                box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
            }
            .studio-wysiwyg-editor ttd-ref .ttd-chip-del {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 15px;
                height: 15px;
                border-radius: 50%;
                background: rgba(220, 38, 38, 0.15);
                color: #991b1b;
                font-size: 10px;
                line-height: 1;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.15s ease;
                user-select: none;
            }
            .studio-wysiwyg-editor ttd-ref .ttd-chip-del:hover {
                background: #dc2626;
                color: #ffffff;
                transform: scale(1.2);
            }

            .studio-code-editor {
                flex: 1 1 100%;
                width: 100%;
                height: 100%;
                min-height: 0;
                display: block;
                font-family: 'Fira Code', Consolas, Monaco, 'Courier New', monospace;
                font-size: 0.9rem;
                line-height: 1.5;
                padding: 16px 20px;
                border: none;
                box-sizing: border-box;
                resize: none;
                background: #0f172a !important;
                color: #f8fafc !important;
                tab-size: 2;
                white-space: pre-wrap;
                word-break: break-word;
                overflow-y: auto;
                outline: none;
                caret-color: #38bdf8;
            }
            .studio-code-editor:focus {
                outline: none;
            }
            .studio-hint {
                font-size: 0.85rem;
                color: #64748b;
            }
            .studio-staged-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-height: 480px;
                overflow-y: auto;
            }
            .studio-staged-card {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 14px 18px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 14px;
            }
            .studio-staged-title {
                font-weight: 600;
                color: #0f172a;
                font-size: 0.95rem;
            }
            .studio-staged-meta {
                font-size: 0.8rem;
                color: #64748b;
                margin-top: 2px;
            }
            .studio-staged-badge {
                background: #fef3c7;
                color: #92400e;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 12px;
                margin-left: 8px;
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
            .studio-staged-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-height: 440px;
                overflow-y: auto;
            }
            .studio-staged-card {
                border: 1px solid #fed7aa;
                border-radius: 8px;
                padding: 12px 14px;
                background: #fffbeb;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
                transition: border-color 0.15s ease;
            }
            .studio-staged-card:hover {
                border-color: #f97316;
            }
            .studio-staged-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .studio-staged-name {
                font-family: monospace;
                font-weight: 700;
                font-size: 0.95rem;
                color: #9a3412;
            }
            .studio-staged-meta {
                font-size: 0.8rem;
                color: #78350f;
            }
            .studio-staged-actions {
                display: flex;
                gap: 8px;
            }
            .studio-btn.emerald {
                background: #059669;
                color: white;
            }
            .studio-btn.emerald:hover {
                background: #047857;
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
