// clientLib/studioOverlay.ts
// Middle Way Math - In-Situ Studio Overlay (WYSIWYG Page-Mimic Authoring)

import { Nav } from './navFW.js';
import { Elt } from './elt.js';
import { SVGTSpan, textWidth } from './svgElt.js';
import { Index, IndexItemDesc } from './navIndex.js';
import { SI } from './serverInterface.js';
import { initAnyDJSI } from './ida.js';
import {
    fetchNavItems,
    saveNavItem,
    deleteNavItem,
    updateSegmentContent,
    publishStaticSiteApi,
    syncDevStateToDbApi,
    fetchSegmentByIdOrKey,
    DbCurriculumNavItem
} from './db/clientQueries.js';
import { getApiBaseUrl } from './db/api.js';

type NavColors = { bg: string; std: string; active: string; over: string; busy: string };

export class StudioOverlay {
    // Mode State: false = View (reader simulation), true = Edit (in-situ popups & tools)
    public static isEditModeActive: boolean = false;

    // SVG Nav Line Controls
    public static controlsContainer: SVGTSpan;
    public static controlsWidth: number = 0;
    public static modeWidget: SVGTSpan;
    public static buildWidget: SVGTSpan;
    public static stagedWidget: SVGTSpan;
    public static dbWidget: SVGTSpan;
    public static contentWidget: SVGTSpan;
    public static stencilWidget: SVGTSpan;
    public static reloadWidget: SVGTSpan;
    public static consoleWidget: SVGTSpan;
    public static helpWidget: SVGTSpan;

    private static isBuilding: boolean = false;
    private static cachedSegments: { id: string | number; seg_key: string; title: string }[] = [];

    // Initialize the Studio Overlay into Nav.devLineBlock
    public static init(navColors: NavColors): void {
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

        const createSpacer = (): SVGTSpan => {
            const sp = new SVGTSpan(StudioOverlay.controlsContainer);
            sp.setAA(['font-size', fontSize, 'stroke', stdC, 'pointer-events', 'none']);
            sp.setV(' ');
            return sp;
        };

        createSpacer();

        // Helper to construct a stylized clickable SVGTSpan button
        const createButton = (label: string, clickHandler: (ev: Event) => void): SVGTSpan => {
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
        StudioOverlay.modeWidget = createButton(
            StudioOverlay.isEditModeActive ? '[✏️ Edit]' : '[👁️ View]',
            () => StudioOverlay.toggleMode()
        );
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

        // 5b. Update Established Segments & DB from savedSegs/
        StudioOverlay.stagedWidget = createButton('[📦 savedSegs (0)]', () => StudioOverlay.openStagedReviewModal());
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
    public static setPos(lineWidth?: number): void {
        StudioOverlay.updateWidth();
        const yDev = (2 * Nav.frameMargin + Nav.lineHeight) + 0.5 * Nav.devLineHeight + 0.35 * (Nav.fontSize - 2);
        StudioOverlay.controlsContainer.setAA(['x', Nav.margin.start, 'y', yDev]);
    }

    private static updateWidth(): void {
        const stagedText = StudioOverlay.stagedWidget ? StudioOverlay.stagedWidget.getV() : '[📦 savedSegs (0)]';
        const text = `🛠️ STUDIO: ${StudioOverlay.modeWidget.getV()} [✏️ Content] [+ Stencil] [🔄 Reload] [🚀 Build Page] ${stagedText} [💾 Update DB] [📊 Console] [ℹ️ Guide]`;
        StudioOverlay.controlsWidth = textWidth(text, Nav.fontSize - 2) + 130;
    }

    // Toggle between View mode (normal student navigation) and Edit mode (in-situ outline editing)
    public static toggleMode(): void {
        StudioOverlay.isEditModeActive = !StudioOverlay.isEditModeActive;
        const label = StudioOverlay.isEditModeActive ? '[✏️ Edit]' : '[👁️ View]';
        StudioOverlay.modeWidget.setV(label);
        StudioOverlay.updateWidth();

        // Visual feedback
        if (StudioOverlay.isEditModeActive) {
            StudioOverlay.showToast('Studio Edit Mode active. Click any outline item to edit hierarchy.');
        } else {
            StudioOverlay.showToast('Studio View Mode active. Normal navigation enabled.');
        }

        // Trigger nav repaint
        Nav.display();
    }

    // =========================================================================
    // 1. ONE-CLICK STATIC PUBLISHER (BUILD PAGE MATCHING CURRENT STATE)
    // =========================================================================

    public static openBuildModal(): void {
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
            if (e.target === modalOverlay) closeModal();
        });
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
                window.removeEventListener('keydown', onEsc);
            }
        };
        window.addEventListener('keydown', onEsc);

        const input = document.getElementById('build-page-name-input') as HTMLInputElement;
        input?.focus();
        input?.select();

        const executeBtn = document.getElementById('build-execute-btn') as HTMLButtonElement;
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

    public static async handleBuildPage(customPageName?: string): Promise<void> {
        if (!customPageName) {
            StudioOverlay.openBuildModal();
            return;
        }

        if (StudioOverlay.isBuilding) return;
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
            } else {
                StudioOverlay.buildWidget.setV('[❌ Failed]');
                StudioOverlay.buildWidget.setA('stroke', 'red');
                StudioOverlay.showToast(`Build failed: ${res.message}`, true);
            }
        } catch (err: any) {
            StudioOverlay.buildWidget.setV('[❌ Error]');
            StudioOverlay.buildWidget.setA('stroke', 'red');
            StudioOverlay.showToast(`Build error: ${err.message}`, true);
        } finally {
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

    public static openUpdateDbModal(): void {
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
            if (e.target === modalOverlay) closeModal();
        });
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeModal();
                window.removeEventListener('keydown', onEsc);
            }
        };
        window.addEventListener('keydown', onEsc);

        const confirmBtn = document.getElementById('db-confirm-btn') as HTMLButtonElement;
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
                } else {
                    StudioOverlay.dbWidget.setV('[❌ Sync Error]');
                    StudioOverlay.dbWidget.setA('stroke', 'red');
                    StudioOverlay.showToast(`Database commit failed: ${res.message}`, true);
                }
            } catch (err: any) {
                closeModal();
                StudioOverlay.dbWidget.setV('[❌ Error]');
                StudioOverlay.dbWidget.setA('stroke', 'red');
                StudioOverlay.showToast(`Database commit error: ${err.message}`, true);
            } finally {
                setTimeout(() => {
                    StudioOverlay.dbWidget.setV('[💾 Update DB]');
                    StudioOverlay.dbWidget.setA('stroke', Nav.color.active);
                    StudioOverlay.updateWidth();
                }, 3000);
            }
        });
    }

    public static exportCurrentOutlineTree(): any[] {
        const rootIndex = (Nav.indices && Nav.indices.length > 0) ? Nav.indices[0] : null;
        if (!rootIndex) return [];
        const rawItems = (rootIndex as any)._rawIndexDesc as IndexItemDesc[] || rootIndex.choices.map((c) => c[0]);

        const serializeNode = (item: IndexItemDesc): any => {
            const out: any = {
                type: item.type,
                topic: item.topic,
            };
            if (item.navTopic) out.navTopic = item.navTopic;
            if (item.htmlSegmentId) out.htmlSegmentId = item.htmlSegmentId;
            if ((item as any).diagramKey) out.diagramKey = (item as any).diagramKey;
            if (item.indexDesc && Array.isArray(item.indexDesc)) {
                out.indexDesc = item.indexDesc.map(serializeNode);
            }
            return out;
        };

        return rawItems.map(serializeNode);
    }

    public static collectSegmentOverrides(): Record<string, string> {
        const overrides: Record<string, string> = {};
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

    public static async handleReload(): Promise<void> {
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
            } else {
                // Fallback to serverInterface
                await SI.setSegMap(true, Nav.segId);
            }

            Nav.loadSegment();
            initAnyDJSI();
            if ((window as any).MathJax?.typesetPromise) {
                await (window as any).MathJax.typesetPromise([Nav.segDiv.elt]);
            }
            Nav.setSegPos();

            StudioOverlay.reloadWidget.setV('[✓ Reloaded]');
            StudioOverlay.reloadWidget.setA('stroke', '#16a34a');
            StudioOverlay.showToast(`✓ Chapter '${Nav.segId}' reloaded & re-typeset.`);
        } catch (err: any) {
            StudioOverlay.showToast(`Reload error: ${err.message}`, true);
        } finally {
            setTimeout(() => {
                StudioOverlay.reloadWidget.setV('[🔄 Reload]');
                StudioOverlay.reloadWidget.setA('stroke', Nav.color.active);
            }, 1800);
        }
    }

    // =========================================================================
    // 3. IN-SITU OUTLINE ITEM POPUP MODAL (EDIT/INSERT/DELETE TREE NODES)
    // =========================================================================

    public static openOutlineModal(indexInstance: Index, itemIndex: number): void {
        const choiceTuple = indexInstance.choices[itemIndex];
        if (!choiceTuple) return;
        const item = choiceTuple[0];

        // Remove existing modal if open
        const existing = document.getElementById('studio-outline-modal');
        if (existing) existing.remove();

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
        const typeSelect = document.getElementById('outline-type') as HTMLSelectElement;
        const segmentGroup = document.getElementById('group-segment') as HTMLDivElement;
        typeSelect.addEventListener('change', () => {
            segmentGroup.style.display = typeSelect.value === 'html' ? 'block' : 'none';
        });

        // Close handlers
        const closeModal = () => modalOverlay.remove();
        document.getElementById('outline-close-btn')?.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });

        // Action: Save Changes
        document.getElementById('btn-save-item')?.addEventListener('click', async () => {
            const topicInput = document.getElementById('outline-topic') as HTMLInputElement;
            const navTopicInput = document.getElementById('outline-nav-topic') as HTMLInputElement;
            const segSelect = document.getElementById('outline-segment') as HTMLSelectElement;

            item.topic = topicInput.value.trim() || item.topic;
            item.navTopic = navTopicInput.value.trim() || undefined;
            item.type = typeSelect.value as any;
            if (item.type === 'html') {
                item.htmlSegmentId = segSelect.value || undefined;
            }

            closeModal();
            StudioOverlay.refreshIndexView(indexInstance);
            StudioOverlay.showToast(`Updated outline item: "${item.topic}" (dev session only)`);
        });

        // Action: Insert Before
        document.getElementById('btn-insert-before')?.addEventListener('click', () => {
            const newItem: IndexItemDesc = {
                type: 'html',
                topic: 'New Curricular Section',
                navTopic: 'New Section',
            };
            StudioOverlay.insertNodeInArray(indexInstance, itemIndex, newItem, false);
            closeModal();
        });

        // Action: Insert After
        document.getElementById('btn-insert-after')?.addEventListener('click', () => {
            const newItem: IndexItemDesc = {
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

    private static insertNodeInArray(indexInstance: Index, targetIndex: number, newNode: IndexItemDesc, after: boolean): void {
        const rawItems = (indexInstance as any)._rawIndexDesc as IndexItemDesc[] || indexInstance.choices.map((c) => c[0]);
        const insertPos = after ? targetIndex + 1 : targetIndex;
        rawItems.splice(insertPos, 0, newNode);
        StudioOverlay.refreshIndexView(indexInstance, rawItems);
        StudioOverlay.showToast(`Inserted item "${newNode.topic}" ${after ? 'after' : 'before'}.`);
    }

    private static deleteNodeFromArray(indexInstance: Index, targetIndex: number): void {
        const rawItems = (indexInstance as any)._rawIndexDesc as IndexItemDesc[] || indexInstance.choices.map((c) => c[0]);
        if (rawItems.length <= 1) {
            StudioOverlay.showToast('Cannot delete the only item in an index.', true);
            return;
        }
        const removed = rawItems.splice(targetIndex, 1);
        StudioOverlay.refreshIndexView(indexInstance, rawItems);
        StudioOverlay.showToast(`Deleted item "${removed[0]?.topic}".`);
    }

    private static refreshIndexView(indexInstance: Index, newItems?: IndexItemDesc[]): void {
        const items = newItems || indexInstance.choices.map((c) => c[0]);
        const chosen = Math.min(indexInstance.chosen, items.length - 1);
        const newIndex = new Index(items, chosen);
        (newIndex as any)._rawIndexDesc = items;

        if (Nav.currentIndex >= 0 && Nav.currentIndex < Nav.indices.length) {
            Nav.indices[Nav.currentIndex] = newIndex;
        }
        Nav.display();
    }

    // =========================================================================
    // 4. IN-SITU SEGMENT HTML/MARKDOWN CONTENT EDITOR
    // =========================================================================

    public static async openContentEditor(): Promise<void> {
        if (!Nav.segId) {
            StudioOverlay.showToast('Please select a chapter before opening Content Editor.', true);
            return;
        }

        const existing = document.getElementById('studio-content-modal');
        if (existing) existing.remove();

        // 1. Established canonical version (default truth)
        const establishedHtml = Nav.segMap.get(Nav.segId) || Nav.segDiv.elt.innerHTML || '';

        // 2. Fetch all drafts in savedSegs/ to populate version dropdown
        let allStaged: any[] = [];
        let currentSegDraft: any = null;
        try {
            const stagedRes = await fetch(`${getApiBaseUrl()}/api/staged-segments`);
            if (stagedRes.ok) {
                const stagedData = await stagedRes.json();
                if (stagedData && stagedData.status === 'success' && Array.isArray(stagedData.staged)) {
                    allStaged = stagedData.staged;
                    currentSegDraft = allStaged.find((s: any) => s.segId === Nav.segId);
                }
            }
        } catch {}

        // Construct version dropdown options
        let optionsHtml = `<option value="established" selected>📖 Established (Canonical Source)</option>`;
        if (currentSegDraft) {
            optionsHtml += `<option value="staged:${currentSegDraft.segId}">📦 Draft: savedSegs/${currentSegDraft.filename} (${(currentSegDraft.bytes / 1024).toFixed(1)} KB)</option>`;
        }
        for (const s of allStaged) {
            if (s.segId !== Nav.segId) {
                optionsHtml += `<option value="staged:${s.segId}">📦 Draft: savedSegs/${s.filename} (${(s.bytes / 1024).toFixed(1)} KB)</option>`;
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
                        <button id="tb-insert-math" class="studio-tb-btn" title="Insert Inline Math Formula">∑ Math</button>
                        <button id="tb-render-math" class="studio-tb-btn" style="color: #0369a1; border-color: #bae6fd;" title="Typeset MathJax in Visual View">🔄 Render Math</button>
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
                            <button class="studio-btn secondary" id="btn-stage-content" style="color: #b45309; border-color: #fcd34d; font-weight: 600; background: #fffbeb;" title="Save draft to savedSegs/ on disk without modifying established source files">💾 Save to savedSegs</button>
                            ${stagedCount > 0 ? `<button class="studio-btn emerald" id="btn-promote-from-editor" style="font-weight: 700; background: #059669; color: white;" title="Update established source files, reseed DB, and clear savedSegs/">🚀 Update Established &amp; DB (${stagedCount})</button>` : ''}
                            <button class="studio-btn primary" id="btn-save-content">✓ Apply to Dev Session</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const panesContainer = document.getElementById('studio-editor-panes') as HTMLDivElement;
        const wysiwygDiv = document.getElementById('segment-wysiwyg-editor') as HTMLDivElement;
        const textarea = document.getElementById('segment-html-editor') as HTMLTextAreaElement;
        const charCount = document.getElementById('editor-char-count') as HTMLElement;

        const pillWysiwyg = document.getElementById('view-wysiwyg-btn') as HTMLButtonElement;
        const pillSource = document.getElementById('view-source-btn') as HTMLButtonElement;
        const pillSplit = document.getElementById('view-split-btn') as HTMLButtonElement;

        const formatSelect = document.getElementById('tb-format') as HTMLSelectElement;
        const btnBold = document.getElementById('tb-bold') as HTMLButtonElement;
        const btnItalic = document.getElementById('tb-italic') as HTMLButtonElement;
        const btnUnderline = document.getElementById('tb-underline') as HTMLButtonElement;
        const btnCode = document.getElementById('tb-code') as HTMLButtonElement;
        const btnUl = document.getElementById('tb-ul') as HTMLButtonElement;
        const btnOl = document.getElementById('tb-ol') as HTMLButtonElement;
        const btnBoxBlue = document.getElementById('tb-box-blue') as HTMLButtonElement;
        const btnBoxEmerald = document.getElementById('tb-box-emerald') as HTMLButtonElement;
        const btnBoxAmber = document.getElementById('tb-box-amber') as HTMLButtonElement;
        const btnCard = document.getElementById('tb-box-card') as HTMLButtonElement;
        const btnInsertStencil = document.getElementById('tb-insert-stencil') as HTMLButtonElement;
        const btnInsertMath = document.getElementById('tb-insert-math') as HTMLButtonElement;
        const btnRenderMath = document.getElementById('tb-render-math') as HTMLButtonElement;

        let currentMode: 'wysiwyg' | 'source' | 'split' = 'wysiwyg';

        const protectStencils = (root: HTMLElement) => {
            root.querySelectorAll('fsd-ref, cas-ref').forEach((el) => {
                el.setAttribute('contenteditable', 'false');
            });
        };

        const cleanWysiwygHtml = (html: string): string => {
            return html.replace(/\s+contenteditable="false"/gi, '');
        };

        const updateStats = () => {
            const text = currentMode === 'source' ? textarea.value : (wysiwygDiv.innerText || '');
            const chars = (currentMode === 'source' ? textarea.value.length : (wysiwygDiv.innerHTML.length));
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            charCount.textContent = `${chars.toLocaleString()} chars • ${words.toLocaleString()} words`;
        };

        // Initialize editor content
        wysiwygDiv.innerHTML = currentHtml;
        protectStencils(wysiwygDiv);
        textarea.value = currentHtml;
        updateStats();

        // Initial MathJax rendering in visual editor
        if ((window as any).MathJax?.typesetPromise) {
            (window as any).MathJax.typesetPromise([wysiwygDiv]).catch(() => {});
        }

        // View Mode Switcher
        const setMode = (mode: 'wysiwyg' | 'source' | 'split') => {
            if (mode === currentMode) return;

            // Synchronize contents across views before switching
            if (currentMode === 'wysiwyg') {
                textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
            } else if (currentMode === 'source') {
                wysiwygDiv.innerHTML = textarea.value;
                protectStencils(wysiwygDiv);
            }

            currentMode = mode;
            panesContainer.className = `studio-editor-panes mode-${mode}`;

            pillWysiwyg.classList.toggle('active', mode === 'wysiwyg');
            pillSource.classList.toggle('active', mode === 'source');
            pillSplit.classList.toggle('active', mode === 'split');

            if (mode === 'wysiwyg' || mode === 'split') {
                wysiwygDiv.focus();
            } else {
                textarea.focus();
            }
            updateStats();
        };

        pillWysiwyg.addEventListener('click', () => setMode('wysiwyg'));
        pillSource.addEventListener('click', () => setMode('source'));
        pillSplit.addEventListener('click', () => setMode('split'));

        // Helper: Insert HTML snippet at active cursor/selection
        const insertHtmlSnippet = (html: string) => {
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
                let node: Node | null;
                let lastNode: Node | null = null;
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
            } else {
                wysiwygDiv.focus();
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const code = document.createElement('code');
                    code.appendChild(range.extractContents());
                    range.insertNode(code);
                } else {
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

        btnInsertMath.addEventListener('click', () => {
            insertHtmlSnippet(' $\\omega = \\text{transfinite}$ ');
        });

        btnRenderMath.addEventListener('click', async () => {
            btnRenderMath.textContent = '⏳ Rendering...';
            if ((window as any).MathJax?.typesetPromise) {
                try {
                    await (window as any).MathJax.typesetPromise([wysiwygDiv]);
                    StudioOverlay.showToast('✓ Math rendered in visual editor.');
                } catch (e: any) {
                    console.error('MathJax error:', e);
                }
            }
            btnRenderMath.innerHTML = '<span>🔄 Render Math</span>';
        });

        // Split Mode Live Sync
        let wysiwygSyncTimer: any = null;
        wysiwygDiv.addEventListener('input', () => {
            updateStats();
            if (currentMode === 'split') {
                clearTimeout(wysiwygSyncTimer);
                wysiwygSyncTimer = setTimeout(() => {
                    textarea.value = cleanWysiwygHtml(wysiwygDiv.innerHTML);
                }, 300);
            }
        });

        let sourceSyncTimer: any = null;
        textarea.addEventListener('input', () => {
            updateStats();
            if (currentMode === 'split') {
                clearTimeout(sourceSyncTimer);
                sourceSyncTimer = setTimeout(() => {
                    wysiwygDiv.innerHTML = textarea.value;
                    protectStencils(wysiwygDiv);
                }, 400);
            }
        });

        // Close handlers
        const closeModal = () => modal.remove();
        document.getElementById('content-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('btn-cancel-content')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Version Dropdown Switcher (Established Canonical vs savedSegs Drafts)
        const versionSelect = document.getElementById('editor-version-select') as HTMLSelectElement;
        versionSelect?.addEventListener('change', async () => {
            const val = versionSelect.value;
            if (val === 'established') {
                wysiwygDiv.innerHTML = establishedHtml;
                protectStencils(wysiwygDiv);
                textarea.value = establishedHtml;
                updateStats();
                if ((window as any).MathJax?.typesetPromise) {
                    (window as any).MathJax.typesetPromise([wysiwygDiv]).catch(() => {});
                }
                StudioOverlay.showToast(`Displaying Established (Canonical) version of '${Nav.segId}'.`);
            } else if (val.startsWith('staged:')) {
                const draftSegId = val.replace('staged:', '');
                const found = allStaged.find((s: any) => s.segId === draftSegId);
                let draftHtml = found?.contentHtml;
                if (!draftHtml) {
                    try {
                        const r = await fetch(`${getApiBaseUrl()}/api/staged-segments/${draftSegId}`);
                        const d = await r.json();
                        draftHtml = d?.contentHtml;
                    } catch {}
                }
                if (draftHtml) {
                    wysiwygDiv.innerHTML = draftHtml;
                    protectStencils(wysiwygDiv);
                    textarea.value = draftHtml;
                    updateStats();
                    if ((window as any).MathJax?.typesetPromise) {
                        (window as any).MathJax.typesetPromise([wysiwygDiv]).catch(() => {});
                    }
                    StudioOverlay.showToast(`Displaying draft from savedSegs/${draftSegId}.html`);
                }
            }
        });

        // Action: Promote All savedSegs directly from editor footer
        document.getElementById('btn-promote-from-editor')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-promote-from-editor') as HTMLButtonElement;
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
                } else {
                    throw new Error(data.message || 'Promotion failed');
                }
            } catch (e: any) {
                StudioOverlay.showToast(`❌ Error: ${e.message}`, true);
                btn.disabled = false;
                btn.textContent = '🚀 Update Established Segs & DB';
            }
        });

        // Action: Stage Draft to savedSegs/ directory on disk
        document.getElementById('btn-stage-content')?.addEventListener('click', async () => {
            const btn = document.getElementById('btn-stage-content') as HTMLButtonElement;
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.textContent = '⏳ Staging...';

            const finalHtml = currentMode === 'source' ? textarea.value : cleanWysiwygHtml(wysiwygDiv.innerHTML);

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
                if (data.ok) {
                    // Update in-memory session and DOM so the user sees their changes immediately
                    Nav.segMap.set(Nav.segId, finalHtml);
                    Nav.segDiv.elt.innerHTML = finalHtml;
                    initAnyDJSI();
                    if ((window as any).MathJax?.typesetPromise) {
                        await (window as any).MathJax.typesetPromise([Nav.segDiv.elt]);
                    }
                    Nav.setSegPos();

                    closeModal();
                    StudioOverlay.showToast(`✓ Staged '${Nav.segId}' to savedSegs/ (${data.filename || ''})`);
                    StudioOverlay.checkStagedCount();
                } else {
                    throw new Error(data.error || 'Failed to stage segment');
                }
            } catch (err: any) {
                console.error('Staging error:', err);
                StudioOverlay.showToast(`❌ Error staging segment: ${err.message}`, true);
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });

        // Action: Apply Changes to In-Memory Dev Session
        document.getElementById('btn-save-content')?.addEventListener('click', async () => {
            const finalHtml = currentMode === 'source' ? textarea.value : cleanWysiwygHtml(wysiwygDiv.innerHTML);
            Nav.segMap.set(Nav.segId, finalHtml);
            Nav.segDiv.elt.innerHTML = finalHtml;
            initAnyDJSI();
            if ((window as any).MathJax?.typesetPromise) {
                await (window as any).MathJax.typesetPromise([Nav.segDiv.elt]);
            }
            Nav.setSegPos();
            closeModal();
            StudioOverlay.showToast(`✓ Chapter '${Nav.segId}' updated in active Dev session (database untouched).`);
        });
    }

    // =========================================================================
    // 5. STENCIL CATALOG PICKER MODAL
    // =========================================================================

    public static async openStencilPicker(onSelect?: (tag: string) => void): Promise<void> {
        const existing = document.getElementById('studio-stencil-modal');
        if (existing) existing.remove();

        let stencils: any[] = [];
        try {
            const resp = await fetch('./public/fsCatalog.json');
            if (resp.ok) {
                const catalog = await resp.json();
                stencils = catalog.formalStatements || [];
            }
        } catch {
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
            if (e.target === modal) closeModal();
        });

        modal.querySelectorAll('.studio-stencil-card').forEach((card) => {
            const tag = card.getAttribute('data-tag') || '';
            card.querySelector('.btn-insert-tag')?.addEventListener('click', () => {
                if (onSelect) {
                    onSelect(tag);
                    closeModal();
                } else {
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

    public static showToast(message: string, isError: boolean = false): void {
        let toast = document.getElementById('studio-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'studio-toast';
            toast.className = 'studio-toast';
            document.body.appendChild(toast);
        }

        if ((StudioOverlay as any).toastTimeout) {
            clearTimeout((StudioOverlay as any).toastTimeout);
            (StudioOverlay as any).toastTimeout = null;
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
        } else {
            toast.textContent = message;
            toast.className = 'studio-toast visible success';
            (StudioOverlay as any).toastTimeout = setTimeout(() => {
                toast?.classList.remove('visible');
            }, 3500);
        }
    }

    private static async loadSegmentCatalog(): Promise<void> {
        try {
            const res = await fetchNavItems('app1');
            StudioOverlay.cachedSegments = (res || [])
                .filter((n) => n.segment_id && n.topic)
                .map((n) => ({
                    id: n.segment_id as any,
                    seg_key: String(n.segment_id),
                    title: n.topic,
                }));
        } catch {
            // Ignore catalog lookup failures
        }
    }

    // =========================================================================
    // 7. DEV STUDIO HELP & QUICK REFERENCE MODAL
    // =========================================================================

    public static openHelpModal(): void {
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
                                <div><strong>2-Phase Staging & Promotion:</strong> Review drafts saved in <code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">savedSegs/</code> before modifying source code. Promote drafts directly into canonical source files (<code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">app1/segs/</code>), regenerate seeds, update PostgreSQL, and rebuild <code style="background:#f1f5f9; padding:2px 5px; border-radius:4px;">app1/dist/index.html</code> in one coordinated operation.</div>
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
            if (e.target === modalOverlay) closeModal();
        });
        const onEsc = (e: KeyboardEvent) => {
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

    public static async checkStagedCount(): Promise<void> {
        try {
            const res = await fetch(`${getApiBaseUrl()}/api/staged-segments`);
            const data = await res.json();
            if (data && data.status === 'success' && Array.isArray(data.staged)) {
                const count = data.staged.length;
                if (StudioOverlay.stagedWidget) {
                    if (count > 0) {
                        StudioOverlay.stagedWidget.setV(`[🚀 Update from savedSegs (${count})]`);
                        StudioOverlay.stagedWidget.setAA(['stroke', '#d97706', 'font-weight', 'bold']);
                    } else {
                        StudioOverlay.stagedWidget.setV(`[📦 savedSegs (0)]`);
                        StudioOverlay.stagedWidget.setAA(['stroke', '#64748b', 'font-weight', 'normal']);
                    }
                    StudioOverlay.updateWidth();
                }
            }
        } catch {
            // Ignore if backend not reachable
        }
    }

    public static async openStagedReviewModal(): Promise<void> {
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
                            <h3 style="margin: 0; font-size: 1.15rem; color: #0f172a;" id="staged-modal-title">Update Established Segments &amp; DB from savedSegs/</h3>
                            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">Promote drafted chapters from savedSegs/ into canonical source files (app1/segs/) and PostgreSQL</div>
                        </div>
                    </div>
                    <button class="studio-close-btn" id="staged-close-btn">✕</button>
                </div>
                <div class="studio-modal-body" style="gap: 16px;">
                    
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 0.88rem; color: #92400e;">
                        <strong>2-Phase Staging Workflow:</strong> Drafts saved in <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">savedSegs/</code> allow you to draft, diff, and review edits without touching canonical source files. When ready, click <strong>Update Established Segments &amp; Reseed DB</strong> below to copy all savedSegs to <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">app1/segs/</code>, regenerate <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">db/seed_v2.sql</code>, update PostgreSQL, rebuild <code style="background:#fef3c7; padding:2px 5px; border-radius:4px; font-weight:600;">index.html</code>, and clear the saved directory.
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
                        <button class="studio-btn emerald" id="btn-promote-all" style="display: none; font-weight: 700; padding: 10px 18px; font-size: 0.95rem;">🚀 Update Established Segments &amp; Reseed DB (Clears savedSegs/)</button>
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
            if (e.target === modalOverlay) closeModal();
        });

        const listContainer = document.getElementById('staged-list-container') as HTMLDivElement;
        const btnPromoteAll = document.getElementById('btn-promote-all') as HTMLButtonElement;
        const btnDiscardAll = document.getElementById('btn-discard-all') as HTMLButtonElement;
        const modalTitle = document.getElementById('staged-modal-title') as HTMLElement;

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
                            <strong style="color: #475569; font-size: 1rem; display: block;">No Staged Segments in savedSegs/</strong>
                            <p style="color: #64748b; font-size: 0.85rem; margin: 6px 0 0 0;">
                                To stage an edit, open any chapter in the Content Editor (<code style="background:#e2e8f0; padding:1px 4px; border-radius:3px;">[✏️ Content]</code>) and click <strong>💾 Save to savedSegs</strong>.
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

                listContainer.innerHTML = '';
                for (const item of staged) {
                    const card = document.createElement('div');
                    card.className = 'studio-staged-card';

                    const kb = (item.bytes / 1024).toFixed(1);
                    const modDate = new Date(item.modifiedMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                    card.innerHTML = `
                        <div class="studio-staged-info">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="studio-staged-name">${StudioOverlay.escapeHtml(item.segId)}.html</span>
                                <span style="font-weight: 600; color: #1e293b; font-size: 0.9rem;">${StudioOverlay.escapeHtml(item.title)}</span>
                            </div>
                            <div class="studio-staged-meta">
                                <span>${kb} KB</span> • <span>Modified: ${modDate}</span> • <code>savedSegs/${StudioOverlay.escapeHtml(item.filename)}</code>
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
                            if ((window as any).MathJax?.typesetPromise) {
                                await (window as any).MathJax.typesetPromise([Nav.segDiv.elt]);
                            }
                            Nav.setSegPos();
                        }
                        closeModal();
                        StudioOverlay.openContentEditor();
                    });

                    // Discard single draft handler
                    card.querySelector('.btn-discard-item')?.addEventListener('click', async () => {
                        if (!confirm(`Discard staged draft for '${item.segId}'?`)) return;
                        try {
                            const delRes = await fetch(`${getApiBaseUrl()}/api/staged-segments/${item.segId}`, {
                                method: 'DELETE'
                            });
                            const delData = await delRes.json();
                            if (delData.status === 'success') {
                                StudioOverlay.showToast(`✓ Discarded draft '${item.segId}'.`);
                                loadStagedList();
                                StudioOverlay.checkStagedCount();
                            } else {
                                throw new Error(delData.message || 'Failed to discard');
                            }
                        } catch (e: any) {
                            StudioOverlay.showToast(`❌ Error: ${e.message}`, true);
                        }
                    });

                    listContainer.appendChild(card);
                }

                StudioOverlay.checkStagedCount();
            } catch (err: any) {
                listContainer.innerHTML = `
                    <div style="color: #b91c1c; background: #fee2e2; padding: 14px; border-radius: 6px;">
                        ❌ Failed to load staged segments: ${err.message}
                    </div>
                `;
            }
        };

        // Discard all handler
        btnDiscardAll.addEventListener('click', async () => {
            if (!confirm('Are you sure you want to discard ALL staged drafts in savedSegs/? This cannot be undone.')) return;
            try {
                const res = await fetch(`${getApiBaseUrl()}/api/staged-segments`, { method: 'DELETE' });
                const data = await res.json();
                if (data.status === 'success') {
                    StudioOverlay.showToast('✓ All staged drafts discarded.');
                    loadStagedList();
                    StudioOverlay.checkStagedCount();
                } else {
                    throw new Error(data.message || 'Failed to discard all');
                }
            } catch (e: any) {
                StudioOverlay.showToast(`❌ Error: ${e.message}`, true);
            }
        });

        // Promote all handler
        btnPromoteAll.addEventListener('click', async () => {
            btnPromoteAll.disabled = true;
            btnPromoteAll.textContent = '⏳ Promoting, Reseeding & Building...';
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
                    // Reload active chapter from database to reflect changes live
                    StudioOverlay.handleReload();
                } else {
                    throw new Error(data.message || 'Failed to promote staged segments');
                }
            } catch (e: any) {
                console.error('Promotion error:', e);
                StudioOverlay.showToast(`❌ Promotion failed: ${e.message}`, true);
                btnPromoteAll.disabled = false;
                btnPromoteAll.textContent = '🚀 Update Established Segments & Reseed DB (Clears savedSegs/)';
            }
        });

        loadStagedList();
    }

    private static escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    private static injectStyles(): void {
        if (document.getElementById('studio-overlay-styles')) return;
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
            .studio-editor-panes {
                display: flex;
                flex: 1;
                min-height: 0;
                overflow: hidden;
                position: relative;
            }
            .studio-editor-panes.mode-wysiwyg #pane-source {
                display: none;
            }
            .studio-editor-panes.mode-wysiwyg #pane-wysiwyg {
                display: flex;
                flex: 1;
            }
            .studio-editor-panes.mode-source #pane-wysiwyg {
                display: none;
            }
            .studio-editor-panes.mode-source #pane-source {
                display: flex;
                flex: 1;
            }
            .studio-editor-panes.mode-split #pane-wysiwyg {
                display: flex;
                flex: 1;
                border-right: 2px solid #e2e8f0;
            }
            .studio-editor-panes.mode-split #pane-source {
                display: flex;
                flex: 1;
            }
            .studio-pane {
                flex-direction: column;
                min-width: 0;
                height: 100%;
                overflow-y: auto;
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
            .studio-code-editor {
                flex: 1;
                width: 100%;
                height: 100%;
                font-family: Consolas, Monaco, monospace;
                font-size: 0.9rem;
                line-height: 1.45;
                padding: 16px;
                border: none;
                box-sizing: border-box;
                resize: none;
                background: #0f172a;
                color: #f8fafc;
                outline: none;
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
