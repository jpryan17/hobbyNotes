// crud/src/contentEditor.ts
// Integrated Segment Content Authoring Surface & Reader for Middle Way Mathematics CRUD Studio.
// Provides dual-mode capability (Read inspection vs. Update authoring), complete standalone editing controls,
// top-line LHS controls (slug, status, custom element insertions), and direct PostgreSQL database persistence.

import { executeSql, queryDatabase } from '../../clientLib/db/api.js';
import { PxeEngine } from '../../clientLib/pxeEngine.js';

export interface SegmentEditorOptions {
    container: HTMLElement;
    segmentRecord: any;
    initialMode: 'read' | 'update';
    onBack: () => void;
    onSaved?: (updatedRecord: any) => void;
    onSwitchMode?: (newMode: 'read' | 'update') => void;
}

export async function renderSegmentContentSurface(options: SegmentEditorOptions): Promise<void> {
    const { container, segmentRecord, onBack, onSaved, onSwitchMode } = options;
    let activeMode: 'wysiwyg' | 'source' | 'split' = 'wysiwyg';
    let isReadMode = options.initialMode === 'read';
    let isDirty = false;
    let currentZoom = 1.0;
    const zoomLevels = [0.75, 0.85, 1.0, 1.15, 1.25, 1.5, 1.75, 2.0];
    let spellCheckActive = true;
    let lastWysiwygRange: Range | null = null;
    let lastSourceSelection: { start: number; end: number } | null = null;
    let activeTableContext: { table: HTMLTableElement; row: HTMLTableRowElement; cell: HTMLTableCellElement } | null = null;

    const segId = segmentRecord.id;
    if (segId && (segmentRecord.content_html === undefined || segmentRecord.content_html === null)) {
        try {
            const rows = await queryDatabase<any>('SELECT id, slug, seg_key, title, content_html, status FROM segments WHERE id = $1 LIMIT 1;', [segId]);
            if (rows && rows.length > 0) {
                const dbRow = rows[0];
                if (!segmentRecord.title && dbRow.title) segmentRecord.title = dbRow.title;
                if (!segmentRecord.slug && dbRow.slug) segmentRecord.slug = dbRow.slug;
                if (!segmentRecord.status && dbRow.status) segmentRecord.status = dbRow.status;
                segmentRecord.content_html = dbRow.content_html;
            }
        } catch (fetchErr) {
            console.error('[contentEditor] Error querying segment from database:', fetchErr);
        }
    }
    const segSlug = segmentRecord.slug || segmentRecord.seg_key || `segment_${segId}`;
    const segTitle = segmentRecord.title || segSlug;
    let currentStatus = segmentRecord.status || segmentRecord.editorial_status || 'raw';
    const rawContentHtml = segmentRecord.content_html || '<p></p>';

    // 1. Inject Styles once into document head
    injectEditorStyles();

    // 2. Build Component Markup
    container.innerHTML = `
        <div id="segment-authoring-surface" class="content-editor-container ${isReadMode ? 'read-mode' : 'edit-mode'}">
            <!-- Top Control Bar -->
            <header class="editor-header-bar">
                <!-- Top-line LHS: Segment slug, title, status, custom elements, Save to DB -->
                <div class="editor-header-lhs">
                    <button id="editor-btn-back" class="btn btn-secondary" title="Return to entity attributes table">
                        <span>← Back to Record</span>
                    </button>

                    <div class="editor-seg-meta">
                        <span class="editor-seg-title">${escapeHtml(segTitle)}</span>
                        <span class="editor-seg-slug">${escapeHtml(segSlug)}</span>
                    </div>

                    <!-- Editorial Status -->
                    <div id="editor-status-container" class="editor-status-wrapper">
                        ${isReadMode
                            ? `<span class="editorial-status-pill status-${escapeHtml(currentStatus)}">Status: ${escapeHtml(currentStatus)}</span>`
                            : `
                            <div style="display: flex; align-items: center; gap: 5px;">
                                <label for="editor-status-select" style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Status:</label>
                                <select id="editor-status-select" class="tb-select" style="font-weight: 600; padding: 4px 8px;">
                                    <option value="raw" ${currentStatus === 'raw' ? 'selected' : ''}>raw</option>
                                    <option value="staged" ${currentStatus === 'staged' ? 'selected' : ''}>staged</option>
                                    <option value="reviewed" ${currentStatus === 'reviewed' ? 'selected' : ''}>reviewed</option>
                                    <option value="published" ${currentStatus === 'published' ? 'selected' : ''}>published</option>
                                </select>
                            </div>
                            `
                        }
                    </div>

                    <!-- Custom Element Insertion Dropdown (Visible in Edit Mode) -->
                    <div class="tb-dropdown custom-elem-dropdown" id="dropdown-custom-elems" style="${isReadMode ? 'display: none;' : 'display: inline-flex;'}">
                        <button id="btn-dropdown-custom-elems" class="btn btn-secondary" style="background: #fdf2f8; border-color: #fbcfe8; color: #be185d; font-weight: 700;" title="Insert Curricular Custom Elements (<ttd-ref>, <fs-ref>, etc.)">
                            <span>⨁ Insert Element</span> ▾
                        </button>
                        <div class="tb-dropdown-menu" id="menu-custom-elems">
                            <button class="tb-dropdown-item" data-action="insert-ttd">⚖️ Truth Table (&lt;ttd-ref&gt;)...</button>
                            <button class="tb-dropdown-item" data-action="insert-fs">📜 Formal Statement (&lt;fs-ref&gt;)...</button>
                            <button class="tb-dropdown-item" data-action="insert-stencil">📐 Computational Stencil (&lt;interactive-stencil&gt;)...</button>
                            <button class="tb-dropdown-item" data-action="insert-demo">🎨 Interactive Visual Demo (&lt;visual-demo&gt;)...</button>
                            <button class="tb-dropdown-item" data-action="insert-pseudo">⚡ Pseudocode Algorithm (&lt;pseudo-ref&gt;)...</button>
                        </div>
                    </div>

                    <!-- Direct Save (Visible in Edit Mode) -->
                    <button id="editor-btn-save-db" class="btn btn-primary" style="${isReadMode ? 'display: none;' : 'display: inline-flex;'} background: var(--emerald); font-weight: 700;" title="Save and replace content_html column value (Ctrl+S)">
                        💾 Save
                    </button>
                    <div id="editor-save-status-pill" class="status-pill" style="${isReadMode ? 'display: none;' : 'display: inline-flex;'}">✓ Ready</div>

                    <!-- Mode Toggle Button -->
                    <button id="editor-btn-toggle-mode" class="btn ${isReadMode ? 'btn-primary' : 'btn-secondary'}" title="Toggle between Read mode and Edit mode">
                        ${isReadMode ? '✏️ Switch to Edit Mode' : '👁️ Switch to Read Mode'}
                    </button>
                </div>

                <!-- Top-line RHS: Zoom, Spell check, View mode pills -->
                <div class="editor-header-rhs">
                    <div class="header-zoom" title="Zoom In / Out for content pane">
                        <span style="font-size: 11px; font-weight: 700; color: #94a3b8; user-select: none;">Zoom:</span>
                        <button id="btn-zoom-out" class="btn btn-secondary" style="padding: 2px 7px; font-size: 12px;">−</button>
                        <button id="btn-zoom-reset" class="btn btn-secondary" style="padding: 2px 8px; font-size: 11px; font-weight: 700; min-width: 44px; text-align: center; color: #38bdf8;">100%</button>
                        <button id="btn-zoom-in" class="btn btn-secondary" style="padding: 2px 7px; font-size: 12px;">+</button>
                    </div>

                    <button id="editor-tb-spell" class="btn btn-secondary active" style="${isReadMode ? 'display: none;' : 'display: inline-flex;'}" title="Toggle spell check">🔤 Spell: ON</button>

                    <div class="view-pills" style="${isReadMode ? 'display: none;' : 'display: inline-flex;'}">
                        <button id="pill-wysiwyg" class="pill active">👁️ Normal</button>
                        <button id="pill-source" class="pill">📝 HTML Source</button>
                        <button id="pill-split" class="pill">🌓 Split</button>
                    </div>
                </div>
            </header>

            <!-- Formatting Toolbar (Hidden in Read Mode) -->
            <div id="editor-formatting-toolbar" class="toolbar" style="${isReadMode ? 'display: none;' : 'display: flex;'}">
                <!-- 1. Text Styles -->
                <div class="tb-section" title="Text Styles">
                    <div class="tb-group">
                        <button id="tb-bold" class="tb-btn" title="Bold (Ctrl+B)"><b>B</b></button>
                        <button id="tb-italic" class="tb-btn" title="Italic (Ctrl+I)"><i>I</i></button>
                    </div>

                    <div class="tb-divider"></div>

                    <!-- Script Level Controls: x₂, x₁, x, x¹, x² -->
                    <div class="tb-group" id="tb-script-group" title="Script level: sub-sub (-2), sub (-1), base (0), sup (+1), sup-sup (+2)">
                        <button id="tb-script-sub2" class="tb-btn script-level-btn" data-level="-2" title="Sub-subscript (level -2)">x<sub><sub>2</sub></sub></button>
                        <button id="tb-script-sub1" class="tb-btn script-level-btn" data-level="-1" title="Subscript (level -1)">x<sub>1</sub></button>
                        <button id="tb-script-base" class="tb-btn script-level-btn active" data-level="0" title="Base text (level 0)">x</button>
                        <button id="tb-script-sup1" class="tb-btn script-level-btn" data-level="1" title="Superscript (level +1)">x<sup>1</sup></button>
                        <button id="tb-script-sup2" class="tb-btn script-level-btn" data-level="2" title="Super-superscript (level +2)">x<sup><sup>2</sup></sup></button>
                    </div>

                    <div class="tb-divider"></div>

                    <!-- Font Size Controls -->
                    <div class="tb-group">
                        <select id="tb-font-size" class="tb-select" title="Font size of selected text">
                            <option value="" disabled selected>Size</option>
                            <option value="1">10px (Tiny)</option>
                            <option value="2">13px (Small)</option>
                            <option value="3">16px (Normal)</option>
                            <option value="4">18px (Medium)</option>
                            <option value="5">24px (Large)</option>
                            <option value="6">32px (X-Large)</option>
                            <option value="7">48px (Huge)</option>
                        </select>
                        <button id="tb-size-down" class="tb-btn" title="Decrease font size (A⁻)">A⁻</button>
                        <button id="tb-size-up" class="tb-btn" title="Increase font size (A⁺)">A⁺</button>
                    </div>

                    <div class="tb-divider"></div>

                    <!-- Heading Dropdown -->
                    <div class="tb-dropdown" id="dropdown-heading">
                        <button id="btn-dropdown-h" class="tb-btn" title="Heading Level (Paragraph, H1, H2, H3, H4, Code)">
                            <span><b>H</b></span> ▾
                        </button>
                        <div class="tb-dropdown-menu" id="menu-heading">
                            <button class="tb-dropdown-item" data-action="format-block" data-val="p">¶ Paragraph (Normal)</button>
                            <button class="tb-dropdown-item" data-action="format-block" data-val="h1" style="font-weight: 700; font-size: 14px;">H1 Heading 1</button>
                            <button class="tb-dropdown-item" data-action="format-block" data-val="h2" style="font-weight: 700; font-size: 13px;">H2 Heading 2</button>
                            <button class="tb-dropdown-item" data-action="format-block" data-val="h3" style="font-weight: 600; font-size: 12px;">H3 Heading 3</button>
                            <button class="tb-dropdown-item" data-action="format-block" data-val="h4" style="font-weight: 600; font-size: 11px;">H4 Heading 4</button>
                            <button class="tb-dropdown-item" data-action="format-block" data-val="pre" style="font-family: var(--font-mono);">&lt;/&gt; Preformatted Code</button>
                        </div>
                    </div>

                    <!-- More Styles Dropdown -->
                    <div class="tb-dropdown" id="dropdown-more-styles">
                        <button id="btn-dropdown-more-styles" class="tb-btn" title="More Styles (Underline, Strikethrough, Code, Colors, Clear)">
                            <span>Styles</span> ▾
                        </button>
                        <div class="tb-dropdown-menu" id="menu-more-styles">
                            <button class="tb-dropdown-item" data-action="underline"><u>U</u> Underline</button>
                            <button class="tb-dropdown-item" data-action="strike"><s>S</s> Strikethrough</button>
                            <button class="tb-dropdown-item" data-action="code"><code>&lt;&gt;</code> Inline Code</button>
                            <button class="tb-dropdown-item" data-action="foreColor">🎨 Text Color...</button>
                            <button class="tb-dropdown-item" data-action="hiliteColor">🖍️ Highlight Color...</button>
                            <div style="border-top: 1px solid #e2e8f0; margin: 2px 0;"></div>
                            <button class="tb-dropdown-item" data-action="removeFormat">🧹 Clear Formatting</button>
                        </div>
                    </div>
                </div>

                <!-- 2. Structure & Alignment -->
                <div class="tb-section" title="Structure & Alignment">
                    <div class="tb-group">
                        <button id="tb-align-left" class="tb-btn" title="Align Left">⯇</button>
                        <button id="tb-align-center" class="tb-btn" title="Align Center">☰</button>
                        <button id="tb-align-right" class="tb-btn" title="Align Right">⯈</button>
                    </div>

                    <div class="tb-divider"></div>

                    <div class="tb-group">
                        <button id="tb-ul" class="tb-btn" title="Bullet List">• List</button>
                        <button id="tb-ol" class="tb-btn" title="Numbered List">1. List</button>
                    </div>

                    <div class="tb-divider"></div>

                    <div class="tb-group">
                        <button id="tb-outdent" class="tb-btn" title="Outdent / Decrease Indent">⇤ Outdent</button>
                        <button id="tb-indent" class="tb-btn" title="Indent / Increase Indent">⇥ Indent</button>
                    </div>

                    <div class="tb-divider"></div>

                    <!-- Blocks Dropdown -->
                    <div class="tb-dropdown" id="dropdown-more-structures">
                        <button id="btn-dropdown-more-structures" class="tb-btn" title="More Blocks (Blockquote, Details, Callout, Definition)">
                            <span>Blocks</span> ▾
                        </button>
                        <div class="tb-dropdown-menu" id="menu-more-structures">
                            <button class="tb-dropdown-item" data-action="blockquote">❝ Blockquote</button>
                            <button class="tb-dropdown-item" data-action="details">🗋 Collapsible Details</button>
                            <button class="tb-dropdown-item" data-action="callout-note">📦 Callout Note Box</button>
                            <button class="tb-dropdown-item" data-action="callout-def">🏷️ Definition Box</button>
                        </div>
                    </div>
                </div>

                <!-- 3. Inserts Section -->
                <div class="tb-section" title="Insert Elements">
                    <div class="tb-dropdown" id="dropdown-insert">
                        <button id="btn-dropdown-insert" class="tb-btn" title="Insert Media, Tables & Content">
                            <span>⨁ Insert</span> ▾
                        </button>
                        <div class="tb-dropdown-menu" id="menu-insert">
                            <button class="tb-dropdown-item" data-action="insert-link">🔗 Hyperlink</button>
                            <button class="tb-dropdown-item" data-action="insert-image">🖼️ Image</button>
                            <button class="tb-dropdown-item" data-action="insert-table">📊 Table (Rows × Cols)</button>
                            <button class="tb-dropdown-item" data-action="insert-hr">― Horizontal Divider</button>
                        </div>
                    </div>

                    <div class="tb-divider"></div>

                    <div class="tb-group">
                        <button id="tb-insert-latex" class="btn btn-primary" style="padding: 4px 10px; font-size: 12px; background: #059669;" title="Insert or edit LaTeX formula">∑ + LaTeX Math</button>
                        <button id="tb-insert-diagram" class="btn btn-primary" style="padding: 4px 10px; font-size: 12px;" title="Draw and embed Draw.io diagram">🎨 + Diagram</button>
                    </div>
                </div>
            </div>

            <!-- Unicode Character Palette Strip (Hidden in Read Mode) -->
            <div id="editor-unicode-palette" class="unicode-palette" style="${isReadMode ? 'display: none;' : 'display: flex;'}">
                <span class="palette-label">Unicode:</span>

                <!-- 1. Typesets -->
                <div class="u-section">
                    <span class="u-section-label">Typesets:</span>
                    <button class="u-btn u-bold" data-char="ℝ" title="Real numbers (R)">ℝ</button>
                    <button class="u-btn u-bold" data-char="ℕ" title="Natural numbers (N)">ℕ</button>
                    <button class="u-btn u-bold" data-char="ℤ" title="Integers (Z)">ℤ</button>
                    <button class="u-btn u-bold" data-char="ℚ" title="Rational numbers (Q)">ℚ</button>
                    <button class="u-btn u-bold" data-char="ℂ" title="Complex numbers (C)">ℂ</button>
                    <button class="u-btn u-bold" data-char="𝔹" title="Booleans (B)">𝔹</button>
                    <button class="u-btn u-bold" data-char="𝔻" title="Dyadic rationals (D)">𝔻</button>
                    <button class="u-btn u-bold" data-char="ⅆ" title="Differential d">ⅆ</button>

                    <!-- Blackboard Bold Dropdown -->
                    <div class="u-dropdown">
                        <button class="u-dropdown-btn" title="Full Blackboard Bold set">BB ▾</button>
                        <div class="u-dropdown-popover">
                            <div class="u-popover-title"><span>Blackboard Bold</span><span style="font-size:10px;color:#94a3b8;">Double-Struck</span></div>
                            <div class="u-popover-subtitle">Uppercase (A-Z)</div>
                            <div class="u-grid">
                                ${['𝔸','𝔹','ℂ','𝔻','𝔼','𝔽','𝔾','ℍ','𝕀','𝕁','𝕂','𝕃','𝕄','ℕ','𝕆','ℙ','ℚ','ℝ','𝕊','𝕋','𝕌','𝕍','𝕎','𝕏','𝕐','ℤ'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                            <div class="u-popover-subtitle">Lowercase & Digits</div>
                            <div class="u-grid">
                                ${['𝕒','𝕓','𝕔','𝕕','𝕖','𝕗','𝕘','𝕙','𝕚','𝕛','𝕜','𝕝','𝕞','𝕟','𝕠','𝕡','𝕢','𝕣','𝕤','𝕥','𝕦','𝕧','𝕨','𝕩','𝕪','𝕫','𝟘','𝟙','𝟚','𝟛','𝟜','𝟝','𝟞','𝟟','𝟠','𝟡'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Script Dropdown -->
                    <div class="u-dropdown">
                        <button class="u-dropdown-btn" title="Script / Calligraphic mathematical letters">𝒫 Script ▾</button>
                        <div class="u-dropdown-popover">
                            <div class="u-popover-title"><span>Script / Calligraphic</span></div>
                            <div class="u-popover-subtitle">Uppercase</div>
                            <div class="u-grid">
                                ${['𝒜','ℬ','𝒞','𝒟','ℰ','ℱ','𝒢','ℋ','ℐ','𝒥','𝒦','ℒ','ℳ','𝒩','𝒪','𝒫','𝒬','ℛ','𝒮','𝒯','𝒰','𝒱','𝒲','𝒳','𝒴','𝒵'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                            <div class="u-popover-subtitle">Lowercase</div>
                            <div class="u-grid">
                                ${['𝒶','𝒷','𝒸','𝒹','ℯ','𝒻','ℊ','𝒽','𝒾','𝒿','𝓀','𝓁','𝓂','𝓃','ℴ','𝓅','𝓆','𝓇','𝓈','𝓉','𝓊','𝓋','𝓌','𝓍','𝓎','𝓏'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Fraktur Dropdown -->
                    <div class="u-dropdown">
                        <button class="u-dropdown-btn" title="Fraktur / Blackletter letters">𝔉 Fraktur ▾</button>
                        <div class="u-dropdown-popover">
                            <div class="u-popover-title"><span>Fraktur / Blackletter</span></div>
                            <div class="u-popover-subtitle">Uppercase</div>
                            <div class="u-grid">
                                ${['𝔄','𝔅','ℭ','𝔇','𝔈','𝔉','𝔊','ℌ','ℑ','𝔍','𝔎','𝔏','𝔐','𝔑','𝔒','𝔓','𝔔','ℜ','𝔖','𝔗','𝔘','𝔙','𝔚','𝔛','𝔜','ℨ'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                            <div class="u-popover-subtitle">Lowercase</div>
                            <div class="u-grid">
                                ${['𝔞','𝔟','𝔠','𝔡','𝔢','𝔣','𝔤','𝔥','𝔦','𝔧','𝔨','𝔩','𝔪','𝔫','𝔬','𝔭','𝔮','𝔯','𝔰','𝔱','𝔲','𝔳','𝔴','𝔵','𝔶','𝔷'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. Greek -->
                <div class="u-section">
                    <span class="u-section-label">Greek:</span>
                    <button class="u-btn" data-char="α" title="alpha">α</button>
                    <button class="u-btn" data-char="β" title="beta">β</button>
                    <button class="u-btn" data-char="γ" title="gamma">γ</button>
                    <button class="u-btn" data-char="δ" title="delta">δ</button>
                    <button class="u-btn" data-char="ε" title="epsilon">ε</button>
                    <button class="u-btn" data-char="θ" title="theta">θ</button>
                    <button class="u-btn" data-char="λ" title="lambda">λ</button>
                    <button class="u-btn" data-char="μ" title="mu">μ</button>
                    <button class="u-btn" data-char="π" title="pi">π</button>
                    <button class="u-btn" data-char="σ" title="sigma">σ</button>
                    <button class="u-btn" data-char="τ" title="tau">τ</button>
                    <button class="u-btn" data-char="φ" title="phi">φ</button>
                    <button class="u-btn" data-char="ψ" title="psi">ψ</button>
                    <button class="u-btn" data-char="ω" title="omega">ω</button>
                    <button class="u-btn" data-char="Δ" title="Delta">Δ</button>
                    <button class="u-btn" data-char="Γ" title="Gamma">Γ</button>
                    <button class="u-btn" data-char="Ω" title="Omega">Ω</button>

                    <div class="u-dropdown">
                        <button class="u-dropdown-btn" title="Complete Greek alphabet">Greek ▾</button>
                        <div class="u-dropdown-popover">
                            <div class="u-popover-title"><span>Greek Alphabet</span></div>
                            <div class="u-popover-subtitle">Lowercase</div>
                            <div class="u-grid">
                                ${['α','β','γ','δ','ε','ζ','η','θ','ι','κ','λ','μ','ν','ξ','ο','π','ρ','ς','σ','τ','υ','φ','χ','ψ','ω'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                            <div class="u-popover-subtitle">Uppercase</div>
                            <div class="u-grid">
                                ${['Α','Β','Γ','Δ','Ε','Ζ','Η','Θ','Ι','Κ','Λ','Μ','Ν','Ξ','Ο','Π','Ρ','Σ','Τ','Υ','Φ','Χ','Ψ','Ω'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Logic & Sets -->
                <div class="u-section">
                    <span class="u-section-label">Logic & Sets:</span>
                    <button class="u-btn" data-char="→" title="Right arrow">→</button>
                    <button class="u-btn" data-char="⇒" title="Implies">⇒</button>
                    <button class="u-btn" data-char="↔" title="Equivalent">↔</button>
                    <button class="u-btn" data-char="⇔" title="Iff">⇔</button>
                    <button class="u-btn" data-char="↦" title="Maps to">↦</button>
                    <button class="u-btn" data-char="¬" title="Not">¬</button>
                    <button class="u-btn" data-char="∧" title="And">∧</button>
                    <button class="u-btn" data-char="∨" title="Or">∨</button>
                    <button class="u-btn" data-char="∀" title="For all">∀</button>
                    <button class="u-btn" data-char="∃" title="There exists">∃</button>
                    <span class="u-divider"></span>
                    <button class="u-btn" data-char="∈" title="Element of">∈</button>
                    <button class="u-btn" data-char="∉" title="Not element of">∉</button>
                    <button class="u-btn" data-char="⊆" title="Subset equal">⊆</button>
                    <button class="u-btn" data-char="⊂" title="Proper subset">⊂</button>
                    <button class="u-btn" data-char="∪" title="Union">∪</button>
                    <button class="u-btn" data-char="∩" title="Intersection">∩</button>
                    <button class="u-btn" data-char="∅" title="Empty set">∅</button>
                    <button class="u-btn" data-char="≠" title="Not equal">≠</button>
                    <button class="u-btn" data-char="≤" title="Less equal">≤</button>
                    <button class="u-btn" data-char="≥" title="Greater equal">≥</button>
                    <button class="u-btn" data-char="≈" title="Approx equal">≈</button>
                    <button class="u-btn" data-char="≡" title="Identical">≡</button>

                    <div class="u-dropdown">
                        <button class="u-dropdown-btn" title="Extended logic, arrows & deduction">Logic ▾</button>
                        <div class="u-dropdown-popover">
                            <div class="u-popover-title"><span>Deduction & Relations</span></div>
                            <div class="u-grid">
                                ${['⊢','⊨','⊣','⊩','⊤','⊥','∴','∵','∄','∎','⊕','←','⇐','⇑','⇓','⇄','⇅','↺','↻','↪','↩','↠','⊇','⊃','⊄','⊅','⊈','⊊','⊋','℘','∖','∁','∝','≔','≅','≇'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. Ops & Delimiters -->
                <div class="u-section">
                    <span class="u-section-label">Ops & Delims:</span>
                    <button class="u-btn" data-char="·" title="Center dot">·</button>
                    <button class="u-btn" data-char="×" title="Times">×</button>
                    <button class="u-btn" data-char="÷" title="Divide">÷</button>
                    <button class="u-btn" data-char="±" title="Plus minus">±</button>
                    <button class="u-btn" data-char="∓" title="Minus plus">∓</button>
                    <button class="u-btn" data-char="√" title="Sqrt">√</button>
                    <button class="u-btn" data-char="∞" title="Infinity">∞</button>
                    <button class="u-btn" data-char="∂" title="Partial">∂</button>
                    <button class="u-btn" data-char="∇" title="Nabla">∇</button>
                    <button class="u-btn" data-char="∫" title="Integral">∫</button>
                    <button class="u-btn" data-char="∑" title="Sum">∑</button>
                    <button class="u-btn" data-char="∏" title="Product">∏</button>
                    <span class="u-divider"></span>
                    <button class="u-btn" data-char="⟨" title="Left angle">⟨</button>
                    <button class="u-btn" data-char="⟩" title="Right angle">⟩</button>
                    <button class="u-btn" data-char="⟦" title="Left double bracket">⟦</button>
                    <button class="u-btn" data-char="⟧" title="Right double bracket">⟧</button>
                    <button class="u-btn" data-char="⌈" title="Left ceil">⌈</button>
                    <button class="u-btn" data-char="⌉" title="Right ceil">⌉</button>
                    <button class="u-btn" data-char="⌊" title="Left floor">⌊</button>
                    <button class="u-btn" data-char="⌋" title="Right floor">⌋</button>

                    <div class="u-dropdown">
                        <button class="u-dropdown-btn" title="Extended operators & calculus">Ops ▾</button>
                        <div class="u-dropdown-popover popover-right">
                            <div class="u-popover-title"><span>Extended Operators</span></div>
                            <div class="u-grid">
                                ${['∬','∭','∮','∯','∰','∛','∜','⊗','⊕','⊙','⊚','⊞','⊠','⋆','∘','∙','⋄','⋅','⋇','⋈','⋉','ℏ','ℵ','ℶ','†','‡','⟂','∥','⟪','⟫','⦃','⦄','⦅','⦆','‖'].map(c => `<button class="u-grid-btn" data-char="${c}">${c}</button>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Editing / Reading Workspace -->
            <div id="editor-workspace" class="editor-workspace">
                <div id="editor-wysiwyg-pane" class="editor-pane" contenteditable="${!isReadMode}" spellcheck="true"></div>
                <div id="editor-source-pane" class="editor-pane" style="display: none;">
                    <textarea id="editor-source-textarea" spellcheck="false"></textarea>
                </div>
            </div>

            <!-- LaTeX Math Modal -->
            <div id="editor-math-modal" class="modal-backdrop">
                <div class="modal-card">
                    <div class="modal-header">
                        <h3 id="editor-math-modal-title">📐 Insert LaTeX Math Formula</h3>
                        <button id="btn-close-math" class="btn btn-secondary" style="padding: 2px 8px; font-size: 12px;">✕</button>
                    </div>
                    <div class="modal-body">
                        <div style="display: flex; gap: 16px; align-items: center; font-size: 13px; color: #334155;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="editor-math-mode" id="editor-math-mode-inline" checked />
                                <span>Inline formula: <code>\\( ... \\)</code></span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="radio" name="editor-math-mode" id="editor-math-mode-display" />
                                <span>Display (Centered block): <code>\\[ ... \\]</code></span>
                            </label>
                        </div>

                        <!-- Chips -->
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${[
                                { l: '\\frac{a}{b}', t: '\\frac{a}{b}' },
                                { l: '\\sqrt{x}', t: '\\sqrt{x}' },
                                { l: 'x^{2}', t: 'x^{2}' },
                                { l: 'x_{i}', t: 'x_{i}' },
                                { l: '\\sum_{i=1}^{n}', t: '\\sum_{i=1}^{n}' },
                                { l: '\\int_{a}^{b}', t: '\\int_{a}^{b}' },
                                { l: '\\to', t: '\\to' },
                                { l: '\\Rightarrow', t: '\\Rightarrow' },
                                { l: '\\leftrightarrow', t: '\\leftrightarrow' },
                                { l: '\\land', t: '\\land' },
                                { l: '\\lor', t: '\\lor' },
                                { l: '\\neg', t: '\\neg' },
                                { l: '\\in', t: '\\in' },
                                { l: '\\subseteq', t: '\\subseteq' },
                                { l: '\\pi', t: '\\pi' },
                                { l: '\\sigma', t: '\\sigma' },
                                { l: '\\omega', t: '\\omega' },
                            ].map(ch => `<button type="button" class="m-chip" data-tex="${escapeHtml(ch.t)}">${escapeHtml(ch.l)}</button>`).join('')}
                        </div>

                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; display: block;">LaTeX Expression:</label>
                            <textarea id="editor-latex-input" rows="3" style="width: 100%; font-family: var(--font-mono); font-size: 13px; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 6px; outline: none; box-sizing: border-box; resize: vertical;" placeholder="e.g. \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"></textarea>
                        </div>

                        <div>
                            <label style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 4px; display: block;">Rendered Formula Preview:</label>
                            <div id="editor-latex-preview-box" style="min-height: 56px; max-height: 120px; overflow-y: auto; background: #f8fafc; border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px;">
                                <span style="color: #94a3b8; font-size: 13px;">Type LaTeX above to see preview</span>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 6px;">
                            <button id="btn-cancel-math" class="btn btn-secondary" style="padding: 6px 14px;">Cancel</button>
                            <button id="btn-apply-math" class="btn btn-primary" style="padding: 6px 16px;">Insert Formula</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Table Modal -->
            <div id="editor-table-modal" class="modal-backdrop">
                <div class="modal-card" style="max-width: 480px;">
                    <div class="modal-header">
                        <h3 id="table-modal-title">📊 Insert &amp; Construct Table</h3>
                        <button id="btn-close-table" class="btn btn-secondary" style="padding: 2px 8px; font-size: 12px;">✕</button>
                    </div>
                    <div class="modal-body">
                        <div id="table-context-actions" style="display: none; background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 6px; padding: 10px 12px; margin-bottom: 14px;">
                            <div style="font-size: 12px; font-weight: 700; color: #1e3a8a; margin-bottom: 6px;">Active Table Detected — Quick Actions:</div>
                            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                <button type="button" id="btn-tbl-add-row-above" class="tb-btn">⬆ Row Above</button>
                                <button type="button" id="btn-tbl-add-row-below" class="tb-btn">⬇ Row Below</button>
                                <button type="button" id="btn-tbl-del-row" class="tb-btn" style="color: #b91c1c;">✕ Del Row</button>
                                <button type="button" id="btn-tbl-add-col-left" class="tb-btn">⬅ Col Left</button>
                                <button type="button" id="btn-tbl-add-col-right" class="tb-btn">➡ Col Right</button>
                                <button type="button" id="btn-tbl-del-col" class="tb-btn" style="color: #b91c1c;">✕ Del Col</button>
                                <button type="button" id="btn-tbl-delete" class="tb-btn" style="color: #dc2626; font-weight: 700;">🗑️ Delete Table</button>
                            </div>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                            <div>
                                <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Rows (body):</label>
                                <input type="number" id="tbl-input-rows" min="1" max="50" value="3" style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box;" />
                            </div>
                            <div>
                                <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Columns:</label>
                                <input type="number" id="tbl-input-cols" min="1" max="20" value="3" style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px; outline: none; box-sizing: border-box;" />
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <label style="font-size: 12px; font-weight: 600; color: #475569; display: block; margin-bottom: 4px;">Table Visual Style:</label>
                            <select id="tbl-select-style" style="width: 100%; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 13px; outline: none; background: #ffffff; cursor: pointer; box-sizing: border-box;">
                                <option value="mwm" selected>📘 MWM Curricular (Navy header, striped rows, clean borders)</option>
                                <option value="grid">▦ Clean Bordered Grid (Light header, full gridlines)</option>
                                <option value="minimal">― Minimalist (Top/bottom dividing lines, no vertical borders)</option>
                            </select>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; font-size: 13px; color: #334155;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="tbl-check-header" checked />
                                <span>Include header row (&lt;thead&gt; &lt;th&gt;)</span>
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                                <input type="checkbox" id="tbl-check-fullwidth" checked />
                                <span>Full width (100%)</span>
                            </label>
                        </div>

                        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 14px;">
                            <button id="btn-cancel-table" class="btn btn-secondary" style="padding: 6px 14px;">Cancel</button>
                            <button id="btn-insert-table-apply" class="btn btn-primary" style="padding: 6px 16px;">Insert Table</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Custom Element Selector Modal -->
            <div id="editor-custom-elem-modal" class="modal-backdrop">
                <div class="modal-card" style="max-width: 620px;">
                    <div class="modal-header">
                        <h3 id="custom-elem-modal-title">⨁ Insert Curricular Element</h3>
                        <button id="btn-close-custom-elem" class="btn btn-secondary" style="padding: 2px 8px; font-size: 12px;">✕</button>
                    </div>
                    <div class="modal-body" id="custom-elem-modal-body">
                        <!-- Populated dynamically per custom element type -->
                    </div>
                </div>
            </div>

            <!-- Custom Element Quick Inspector Modal -->
            <div id="editor-custom-inspector-modal" class="modal-backdrop">
                <div class="modal-card" style="width: 760px; max-width: 95vw;">
                    <div class="modal-header" style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span id="inspector-modal-badge" class="inspector-badge"></span>
                            <h3 id="inspector-modal-title" style="margin: 0; font-size: 15px; font-weight: 700;">Authoritative Entity Inspector</h3>
                        </div>
                        <button id="btn-close-inspector" class="btn btn-secondary" style="padding: 2px 8px; font-size: 12px;">✕</button>
                    </div>
                    <div class="modal-body" id="inspector-modal-body" style="padding: 16px; overflow-y: auto; max-height: 70vh;">
                        <!-- Populated dynamically with .attr-table -->
                    </div>
                    <div class="modal-footer" id="inspector-modal-footer" style="padding: 12px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                        <div id="inspector-mode-hint" style="font-size: 12px; color: #64748b; font-style: italic;">
                            📖 Authoritative Read Mode
                        </div>
                        <div style="display: flex; gap: 8px;" id="inspector-action-buttons">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Floating Hover Tooltip -->
            <div id="custom-ref-tooltip" class="custom-ref-tooltip" style="display: none;"></div>

            <!-- Toast Notification -->
            <div id="editor-toast" class="editor-toast">Notification</div>
        </div>
    `;

    // 3. Obtain DOM references
    const rootEl = container.querySelector('#segment-authoring-surface') as HTMLDivElement;
    const wysiwygPane = container.querySelector('#editor-wysiwyg-pane') as HTMLDivElement;
    const sourcePane = container.querySelector('#editor-source-pane') as HTMLDivElement;
    const sourceTextarea = container.querySelector('#editor-source-textarea') as HTMLTextAreaElement;
    const workspace = container.querySelector('#editor-workspace') as HTMLDivElement;
    const saveStatusPill = container.querySelector('#editor-save-status-pill') as HTMLDivElement;
    const toast = container.querySelector('#editor-toast') as HTMLDivElement;

    const mathModal = container.querySelector('#editor-math-modal') as HTMLDivElement;
    const latexInput = container.querySelector('#editor-latex-input') as HTMLTextAreaElement;
    const latexPreviewBox = container.querySelector('#editor-latex-preview-box') as HTMLDivElement;
    const mathModalTitle = container.querySelector('#editor-math-modal-title') as HTMLElement;
    const btnApplyMath = container.querySelector('#btn-apply-math') as HTMLButtonElement;

    const tableModal = container.querySelector('#editor-table-modal') as HTMLDivElement;
    const customElemModal = container.querySelector('#editor-custom-elem-modal') as HTMLDivElement;
    const inspectorModal = container.querySelector('#editor-custom-inspector-modal') as HTMLDivElement;
    const inspectorBadge = container.querySelector('#inspector-modal-badge') as HTMLElement;
    const inspectorTitle = container.querySelector('#inspector-modal-title') as HTMLElement;
    const inspectorBody = container.querySelector('#inspector-modal-body') as HTMLElement;
    const inspectorModeHint = container.querySelector('#inspector-mode-hint') as HTMLElement;
    const inspectorActions = container.querySelector('#inspector-action-buttons') as HTMLElement;
    const tooltipEl = container.querySelector('#custom-ref-tooltip') as HTMLElement;

    const entityMetaCache = new Map<string, any>();

    function showToast(msg: string) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2600);
    }

    function setDirty(dirty: boolean) {
        isDirty = dirty;
        if (!saveStatusPill) return;
        if (dirty) {
            saveStatusPill.textContent = '● Modified';
            saveStatusPill.classList.add('dirty');
        } else {
            saveStatusPill.textContent = '✓ Saved';
            saveStatusPill.classList.remove('dirty');
        }
    }

    function cleanHtml(html: string): string {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Restore raw LaTeX content so rendered MathJax markup is never saved to database
        const mathEls = temp.querySelectorAll('.latex-math, .latex-math-block');
        mathEls.forEach((el) => {
            const rawTex = decodeURIComponent(el.getAttribute('data-latex') || '');
            const isDisplay = el.getAttribute('data-display') === 'true' || el.classList.contains('latex-math-block');
            if (rawTex) {
                el.innerHTML = isDisplay ? `\\[ ${rawTex} \\]` : `\\( ${rawTex} \\)`;
            }
        });

        // Strip any lingering MathJax containers
        temp.querySelectorAll('mjx-container, mjx-assistive-mml').forEach((mjx) => {
            if (!mjx.closest('.latex-math, .latex-math-block')) {
                mjx.remove();
            }
        });

        // Restore custom elements so decorations are never saved to database or leaked into source mode
        temp.querySelectorAll('ttd-ref, fs-ref, interactive-stencil, visual-demo, pseudo-ref').forEach((el) => {
            if (el.hasAttribute('data-orig-inner')) {
                el.innerHTML = el.getAttribute('data-orig-inner') || '';
            }
            el.removeAttribute('contenteditable');
            el.removeAttribute('data-custom-ref');
            el.removeAttribute('data-orig-inner');
            el.removeAttribute('data-resolved-title');
            el.removeAttribute('data-resolved-subtitle');
            el.removeAttribute('data-resolved-formula');
            el.removeAttribute('data-resolved-status');
            el.classList.remove('custom-ref-chip', 'chip-ttd', 'chip-fs', 'chip-stencil', 'chip-demo', 'chip-pseudo');
            if (!el.getAttribute('class')) {
                el.removeAttribute('class');
            }
        });

        let res = temp.innerHTML
            .replace(/\s*contenteditable="false"/gi, '')
            .replace(/\s*onclick="[^"]*"/gi, '');

        res = res.replace(/(?:<p[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/p>|<div[^>]*>\s*(?:<br\s*\/?>|&nbsp;|\s)*<\/div>|\s*<br\s*\/?>\s*)+$/gi, '');
        return res.trim();
    }

    async function resolveEntityRecord(tagName: string, el: Element): Promise<any> {
        const normTag = tagName.toLowerCase();
        if (normTag === 'ttd-ref') {
            const id = el.getAttribute('id');
            const exp = el.getAttribute('exp');
            const cacheKey = id ? `ttd:id:${id}` : `ttd:exp:${exp}`;
            if (entityMetaCache.has(cacheKey)) return entityMetaCache.get(cacheKey);

            let row = null;
            if (id) {
                const rows = await queryDatabase<any>("SELECT * FROM interactive_demos WHERE id = $1 LIMIT 1;", [id]);
                row = rows?.[0] || null;
            } else if (exp) {
                const rows = await queryDatabase<any>("SELECT * FROM interactive_demos WHERE expression = $1 OR init_packet LIKE $2 LIMIT 1;", [exp, `%"${exp}"%`]);
                row = rows?.[0] || {
                    expression: exp,
                    title: PxeEngine.fmt(exp) || exp,
                    engine: 'ttd',
                    status: 'published'
                };
            }
            if (row) entityMetaCache.set(cacheKey, row);
            return row;
        } else if (normTag === 'fs-ref') {
            const id = el.getAttribute('id');
            const key = el.getAttribute('statement-key');
            const desc = el.getAttribute('desc');
            const algo = el.getAttribute('algo');
            const cacheKey = id ? `fs:id:${id}` : `fs:key:${key || desc || algo}`;
            if (entityMetaCache.has(cacheKey)) return entityMetaCache.get(cacheKey);

            let row = null;
            if (id) {
                const rows = await queryDatabase<any>("SELECT * FROM formal_statements WHERE id = $1 LIMIT 1;", [id]);
                row = rows?.[0] || null;
            } else if (key) {
                const rows = await queryDatabase<any>("SELECT * FROM formal_statements WHERE statement_key = $1 LIMIT 1;", [key]);
                row = rows?.[0] || null;
            }
            if (!row && (desc || algo)) {
                row = {
                    title: desc || algo,
                    statement_key: key || algo || `fs_${id || 'ref'}`,
                    description: desc,
                    status: 'published'
                };
            }
            if (row) entityMetaCache.set(cacheKey, row);
            return row;
        } else if (normTag === 'interactive-stencil') {
            const eqKey = el.getAttribute('equation-key');
            const id = el.getAttribute('id');
            const cacheKey = eqKey ? `stencil:key:${eqKey}` : `stencil:id:${id}`;
            if (entityMetaCache.has(cacheKey)) return entityMetaCache.get(cacheKey);

            let row = null;
            if (eqKey) {
                const rows = await queryDatabase<any>("SELECT * FROM directed_equations WHERE equation_key = $1 LIMIT 1;", [eqKey]);
                row = rows?.[0] || null;
            } else if (id) {
                const rows = await queryDatabase<any>("SELECT * FROM directed_equations WHERE id = $1 LIMIT 1;", [id]);
                row = rows?.[0] || null;
            }
            if (row) entityMetaCache.set(cacheKey, row);
            return row;
        } else if (normTag === 'visual-demo') {
            const id = el.getAttribute('id');
            const cacheKey = `demo:id:${id}`;
            if (entityMetaCache.has(cacheKey)) return entityMetaCache.get(cacheKey);

            let row = null;
            if (id) {
                const rows = await queryDatabase<any>("SELECT * FROM interactive_demos WHERE id = $1 LIMIT 1;", [id]);
                row = rows?.[0] || null;
            }
            if (row) entityMetaCache.set(cacheKey, row);
            return row;
        } else if (normTag === 'pseudo-ref') {
            const algoKey = el.getAttribute('algo-key');
            const id = el.getAttribute('id');
            const cacheKey = algoKey ? `pseudo:key:${algoKey}` : `pseudo:id:${id}`;
            if (entityMetaCache.has(cacheKey)) return entityMetaCache.get(cacheKey);

            let row = null;
            if (algoKey) {
                const rows = await queryDatabase<any>("SELECT * FROM pseudocode_algorithms WHERE algo_key = $1 LIMIT 1;", [algoKey]);
                row = rows?.[0] || null;
            } else if (id) {
                const rows = await queryDatabase<any>("SELECT * FROM pseudocode_algorithms WHERE id = $1 LIMIT 1;", [id]);
                row = rows?.[0] || null;
            }
            if (row) entityMetaCache.set(cacheKey, row);
            return row;
        }
        return null;
    }

    async function decorateCustomElements(pane: HTMLElement) {
        const customTags = pane.querySelectorAll('ttd-ref, fs-ref, interactive-stencil, visual-demo, pseudo-ref');
        if (customTags.length === 0) return;

        for (const el of Array.from(customTags)) {
            const htmlEl = el as HTMLElement;
            const normTag = htmlEl.tagName.toLowerCase();

            htmlEl.setAttribute('contenteditable', 'false');
            htmlEl.setAttribute('data-custom-ref', 'true');

            if (!htmlEl.hasAttribute('data-orig-inner')) {
                htmlEl.setAttribute('data-orig-inner', htmlEl.innerHTML);
            }

            let icon = '⚖️';
            let kindLabel = 'TTD';
            let chipThemeClass = 'chip-ttd';
            if (normTag === 'fs-ref') {
                icon = '📜'; kindLabel = 'FS'; chipThemeClass = 'chip-fs';
            } else if (normTag === 'interactive-stencil') {
                icon = '📐'; kindLabel = 'Stencil'; chipThemeClass = 'chip-stencil';
            } else if (normTag === 'visual-demo') {
                icon = '🔬'; kindLabel = 'Demo'; chipThemeClass = 'chip-demo';
            } else if (normTag === 'pseudo-ref') {
                icon = '⚡'; kindLabel = 'Algo'; chipThemeClass = 'chip-pseudo';
            }

            htmlEl.classList.add('custom-ref-chip', chipThemeClass);

            const rec = await resolveEntityRecord(normTag, htmlEl);

            let displayTitle = '';
            let displaySubtitle = '';
            let formulaPreview = '';
            let statusBadge = '';

            if (normTag === 'ttd-ref') {
                const exp = htmlEl.getAttribute('exp') || rec?.expression || '';
                const id = htmlEl.getAttribute('id') || rec?.id || '';
                const fmt = exp ? PxeEngine.fmt(exp) : '';
                const rawInner = (htmlEl.getAttribute('data-orig-inner') || '').trim();
                displayTitle = fmt || rawInner || rec?.title || (id ? `#${id}` : exp);
                displaySubtitle = id ? `interactive_demos · ID ${id}` : 'truth_table proposition';
                formulaPreview = fmt || exp;
                statusBadge = rec?.status || 'published';
            } else if (normTag === 'fs-ref') {
                const desc = htmlEl.getAttribute('desc') || '';
                const key = htmlEl.getAttribute('statement-key') || '';
                const id = htmlEl.getAttribute('id') || rec?.id || '';
                const algo = htmlEl.getAttribute('algo') || '';
                displayTitle = desc || rec?.title || key || (id ? `Statement #${id}` : 'Formal Statement');
                displaySubtitle = `formal_statements · ${key || (id ? `ID ${id}` : '')}`;
                formulaPreview = rec?.expression || (algo ? `Algo: ${algo}` : '');
                statusBadge = rec?.status || rec?.statement_kind || 'formal';
            } else if (normTag === 'interactive-stencil') {
                const eqKey = htmlEl.getAttribute('equation-key') || '';
                const id = htmlEl.getAttribute('id') || rec?.id || '';
                displayTitle = rec?.title || rec?.label || eqKey || `Stencil #${id}`;
                displaySubtitle = `directed_equations · ${eqKey || `ID ${id}`}`;
                formulaPreview = rec?.formula_expr || '';
                statusBadge = 'stencil';
            } else if (normTag === 'visual-demo') {
                const id = htmlEl.getAttribute('id') || rec?.id || '';
                displayTitle = rec?.title || (rec?.mode ? `Demo: ${rec.mode}` : `Demo #${id}`);
                displaySubtitle = `interactive_demos · ID ${id} (${rec?.engine || 'canvas'})`;
                statusBadge = rec?.status || 'active';
            } else if (normTag === 'pseudo-ref') {
                const key = htmlEl.getAttribute('algo-key') || '';
                const id = htmlEl.getAttribute('id') || rec?.id || '';
                displayTitle = rec?.name || rec?.func_name || key || `Algorithm #${id}`;
                displaySubtitle = `pseudocode_algorithms · ${key || `ID ${id}`}`;
                formulaPreview = rec?.signature || '';
                statusBadge = rec?.badge || 'algo';
            }

            htmlEl.innerHTML = `
                <span class="chip-icon">${icon}</span>
                <span class="chip-badge">${kindLabel}</span>
                <span class="chip-label">${escapeHtml(displayTitle)}</span>
            `;

            htmlEl.dataset.resolvedTitle = displayTitle;
            htmlEl.dataset.resolvedSubtitle = displaySubtitle;
            htmlEl.dataset.resolvedFormula = formulaPreview;
            htmlEl.dataset.resolvedStatus = statusBadge;
            htmlEl.title = '';
        }
    }

    function attachTooltipListeners() {
        if (!tooltipEl) return;
        wysiwygPane.addEventListener('mouseover', (e) => {
            const target = (e.target as HTMLElement)?.closest('[data-custom-ref="true"]') as HTMLElement | null;
            if (!target) {
                tooltipEl.style.display = 'none';
                return;
            }

            const normTag = target.tagName.toLowerCase();
            const title = target.dataset.resolvedTitle || target.textContent || '';
            const subtitle = target.dataset.resolvedSubtitle || '';
            const formula = target.dataset.resolvedFormula || '';
            const status = target.dataset.resolvedStatus || '';

            let badgeIcon = '⚖️';
            let badgeColor = '#991b1b';
            let badgeBg = '#fee2e2';
            if (normTag === 'fs-ref') {
                badgeIcon = '📜'; badgeColor = '#1d4ed8'; badgeBg = '#dbeafe';
            } else if (normTag === 'interactive-stencil') {
                badgeIcon = '📐'; badgeColor = '#166534'; badgeBg = '#dcfce7';
            } else if (normTag === 'visual-demo') {
                badgeIcon = '🔬'; badgeColor = '#6b21a8'; badgeBg = '#f3e8ff';
            } else if (normTag === 'pseudo-ref') {
                badgeIcon = '⚡'; badgeColor = '#92400e'; badgeBg = '#fef3c7';
            }

            tooltipEl.innerHTML = `
                <div class="tooltip-header">
                    <span class="tooltip-badge" style="background:${badgeBg}; color:${badgeColor};">${badgeIcon} ${escapeHtml(subtitle || normTag)}</span>
                    ${status ? `<span class="tooltip-status-pill">${escapeHtml(status)}</span>` : ''}
                </div>
                <div class="tooltip-title">${escapeHtml(title)}</div>
                ${formula ? `<div class="tooltip-formula">${escapeHtml(formula)}</div>` : ''}
                <div class="tooltip-footer">
                    <span>💡 <strong>Click</strong> to inspect authoritative DB record</span>
                </div>
            `;

            tooltipEl.style.display = 'block';
            const rect = target.getBoundingClientRect();
            const tooltipRect = tooltipEl.getBoundingClientRect();

            let top = rect.top - tooltipRect.height - 8;
            if (top < 10) {
                top = rect.bottom + 8;
            }
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            if (left < 10) left = 10;
            if (left + tooltipRect.width > window.innerWidth - 10) {
                left = window.innerWidth - tooltipRect.width - 10;
            }

            tooltipEl.style.top = `${top}px`;
            tooltipEl.style.left = `${left}px`;
        });

        wysiwygPane.addEventListener('mouseout', (e) => {
            const related = e.relatedTarget as HTMLElement | null;
            if (!related || !related.closest('[data-custom-ref="true"]')) {
                tooltipEl.style.display = 'none';
            }
        });
    }

    function buildAttrTableHtml(tableName: string, record: any): string {
        const rows = Object.entries(record || {}).map(([col, val]) => {
            let displayVal: string;
            if (val === null || val === undefined) {
                displayVal = '<span style="color: #94a3b8; font-style: italic;">NULL</span>';
            } else if (typeof val === 'object') {
                displayVal = `<pre style="margin: 0; padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; font-family: var(--font-mono); font-size: 11px; max-height: 140px; overflow: auto;">${escapeHtml(JSON.stringify(val, null, 2))}</pre>`;
            } else if (col === 'status' || col === 'editorial_status') {
                displayVal = `<span class="badge" style="background: #e0f2fe; color: #0369a1; font-weight: 700; padding: 2px 7px; border-radius: 4px; font-size: 11px;">${escapeHtml(String(val))}</span>`;
            } else if (col === 'expression' || col === 'formula_expr') {
                const expStr = String(val);
                const fmt = PxeEngine.fmt(expStr);
                displayVal = `<div style="font-family: var(--font-mono); font-weight: 700; font-size: 13px; color: #0f172a; background: #f1f5f9; padding: 4px 8px; border-radius: 4px; display: inline-block;">${escapeHtml(fmt || expStr)}</div>`;
            } else if (col === 'code') {
                displayVal = `<pre style="margin: 0; padding: 6px; background: #0f172a; color: #f8fafc; border-radius: 4px; font-family: var(--font-mono); font-size: 11px; max-height: 140px; overflow: auto;">${escapeHtml(String(val))}</pre>`;
            } else {
                displayVal = `<span style="font-family: var(--font-mono); font-size: 12px; color: #334155;">${escapeHtml(String(val))}</span>`;
            }

            return `
                <tr>
                    <td style="font-weight: 700; color: #1e293b; width: 180px; font-family: var(--font-mono); font-size: 12px; padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(col)}</td>
                    <td style="color: #64748b; font-size: 11px; font-family: var(--font-mono); width: 110px; padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${typeof val}</td>
                    <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${displayVal}</td>
                </tr>
            `;
        }).join('');

        return `
            <table class="attr-table" style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                        <th style="padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">DB Attribute</th>
                        <th style="padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">Data Type</th>
                        <th style="padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">Authoritative Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    function closeQuickInspectorModal() {
        inspectorModal.classList.remove('active');
    }

    container.querySelector('#btn-close-inspector')?.addEventListener('click', closeQuickInspectorModal);
    inspectorModal.addEventListener('click', (e) => {
        if (e.target === inspectorModal) closeQuickInspectorModal();
    });

    async function openQuickInspectorModal(chipEl: HTMLElement) {
        const normTag = chipEl.tagName.toLowerCase();
        let kind: 'ttd' | 'fs' | 'stencil' | 'demo' | 'pseudo' = 'ttd';
        let tableName = 'interactive_demos';
        let badgeColor = '#991b1b';
        let badgeBg = '#fee2e2';
        let badgeText = '⚖️ Truth Table Proposition';

        if (normTag === 'fs-ref') {
            kind = 'fs';
            tableName = 'formal_statements';
            badgeColor = '#1d4ed8';
            badgeBg = '#dbeafe';
            badgeText = '📜 Formal Statement';
        } else if (normTag === 'interactive-stencil') {
            kind = 'stencil';
            tableName = 'directed_equations';
            badgeColor = '#166534';
            badgeBg = '#dcfce7';
            badgeText = '📐 Computational Stencil';
        } else if (normTag === 'visual-demo') {
            kind = 'demo';
            tableName = 'interactive_demos';
            badgeColor = '#6b21a8';
            badgeBg = '#f3e8ff';
            badgeText = '🔬 Interactive Demo';
        } else if (normTag === 'pseudo-ref') {
            kind = 'pseudo';
            tableName = 'pseudocode_algorithms';
            badgeColor = '#92400e';
            badgeBg = '#fef3c7';
            badgeText = '⚡ Pseudocode Algorithm';
        }

        inspectorBadge.style.background = badgeBg;
        inspectorBadge.style.color = badgeColor;
        inspectorBadge.textContent = badgeText;
        inspectorTitle.textContent = chipEl.dataset.resolvedTitle || 'Loading record...';
        inspectorBody.innerHTML = '<div style="padding: 24px; text-align: center; color: #64748b;">Loading authoritative record from PostgreSQL...</div>';

        inspectorModeHint.innerHTML = isReadMode
            ? '📖 <strong>Read Mode:</strong> Authoritative PostgreSQL attributes inspection'
            : '✏️ <strong>Authoring Mode:</strong> Authoritative inspection & reference management';

        inspectorModal.classList.add('active');

        const rec = await resolveEntityRecord(normTag, chipEl);
        if (!rec) {
            inspectorBody.innerHTML = `
                <div style="padding: 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; color: #991b1b;">
                    <strong>Reference Unresolved:</strong> No matching database record found in <code>${tableName}</code>.
                </div>
            `;
        } else {
            inspectorTitle.textContent = rec.title || rec.name || rec.label || chipEl.dataset.resolvedTitle || `Record #${rec.id}`;
            inspectorBody.innerHTML = buildAttrTableHtml(tableName, rec);
        }

        if (isReadMode) {
            inspectorActions.innerHTML = `
                <button type="button" class="btn btn-secondary" id="btn-inspector-close" style="padding: 6px 14px;">✕ Close</button>
            `;
            inspectorActions.querySelector('#btn-inspector-close')?.addEventListener('click', closeQuickInspectorModal);
        } else {
            inspectorActions.innerHTML = `
                <button type="button" class="btn btn-secondary" id="btn-inspector-remove" style="color: #dc2626; border-color: #fca5a5; background: #fef2f2; font-weight: 600; padding: 6px 12px;" title="Remove this reference tag from content">
                    🗑️ Remove Tag
                </button>
                <button type="button" class="btn btn-primary" id="btn-inspector-switch" style="font-weight: 600; padding: 6px 14px;" title="Switch to a different reference in the database">
                    ✎ Switch Reference
                </button>
                <button type="button" class="btn btn-secondary" id="btn-inspector-close" style="padding: 6px 14px;">✕ Close</button>
            `;

            inspectorActions.querySelector('#btn-inspector-close')?.addEventListener('click', closeQuickInspectorModal);

            inspectorActions.querySelector('#btn-inspector-remove')?.addEventListener('click', () => {
                if (confirm('Remove this custom element tag from the segment?')) {
                    chipEl.remove();
                    setDirty(true);
                    if (activeMode === 'split') {
                        sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
                    }
                    showToast('✓ Removed custom element tag');
                    closeQuickInspectorModal();
                }
            });

            inspectorActions.querySelector('#btn-inspector-switch')?.addEventListener('click', () => {
                closeQuickInspectorModal();
                openCustomElementPicker(kind, chipEl);
            });
        }
    }

    // Typeset MathJax in WYSIWYG
    function typesetMath() {
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
            const mathElements = wysiwygPane.querySelectorAll('.latex-math, .latex-math-block');
            if (mathElements.length > 0) {
                (window as any).MathJax.typesetPromise(Array.from(mathElements)).then(() => {
                    attachMathClickListeners();
                }).catch((err: any) => console.log('MathJax typeset notice:', err));
            }
        }
    }

    function attachMathClickListeners() {
        if (isReadMode) return;
        wysiwygPane.querySelectorAll('.latex-math, .latex-math-block').forEach((el) => {
            el.setAttribute('title', 'Double-click to edit LaTeX formula');
            (el as HTMLElement).ondblclick = (e) => {
                e.stopPropagation();
                openMathEditor(el as HTMLElement);
            };
        });
    }

    // Initialize content in panes
    wysiwygPane.innerHTML = rawContentHtml;
    sourceTextarea.value = rawContentHtml;
    typesetMath();
    decorateCustomElements(wysiwygPane);
    attachTooltipListeners();

    // Click handler on WYSIWYG pane for custom element tags (Read or Update mode)
    wysiwygPane.addEventListener('click', async (e) => {
        const chip = (e.target as HTMLElement)?.closest('[data-custom-ref="true"]') as HTMLElement | null;
        if (!chip) return;
        e.preventDefault();
        e.stopPropagation();
        if (tooltipEl) tooltipEl.style.display = 'none';
        await openQuickInspectorModal(chip);
    });

    // -------------------------------------------------------------------------
    // Mode Toggling (Read Inspection vs. Edit Authoring)
    // -------------------------------------------------------------------------
    function setReadMode(enable: boolean) {
        isReadMode = enable;
        rootEl.classList.toggle('read-mode', isReadMode);
        rootEl.classList.toggle('edit-mode', !isReadMode);

        const toolbar = container.querySelector('#editor-formatting-toolbar') as HTMLElement;
        const unicodePalette = container.querySelector('#editor-unicode-palette') as HTMLElement;
        const toggleBtn = container.querySelector('#editor-btn-toggle-mode') as HTMLButtonElement;
        const saveDbBtn = container.querySelector('#editor-btn-save-db') as HTMLButtonElement;
        const customDropdown = container.querySelector('#dropdown-custom-elems') as HTMLElement;
        const spellBtn = container.querySelector('#editor-tb-spell') as HTMLElement;
        const viewPills = container.querySelector('.view-pills') as HTMLElement;
        const statusWrapper = container.querySelector('#editor-status-container') as HTMLElement;

        if (isReadMode) {
            wysiwygPane.setAttribute('contenteditable', 'false');
            sourceTextarea.setAttribute('readonly', 'true');
            if (toolbar) toolbar.style.display = 'none';
            if (unicodePalette) unicodePalette.style.display = 'none';
            if (saveDbBtn) saveDbBtn.style.display = 'none';
            if (saveStatusPill) saveStatusPill.style.display = 'none';
            if (customDropdown) customDropdown.style.display = 'none';
            if (spellBtn) spellBtn.style.display = 'none';
            if (viewPills) viewPills.style.display = 'none';

            if (statusWrapper) {
                statusWrapper.innerHTML = `<span class="editorial-status-pill status-${escapeHtml(currentStatus)}">Status: ${escapeHtml(currentStatus)}</span>`;
            }

            if (toggleBtn) {
                toggleBtn.textContent = '✏️ Switch to Edit Mode';
                toggleBtn.className = 'btn btn-primary';
            }

            // In Read mode, force normal WYSIWYG reader view
            setComposerViewMode('wysiwyg');
            showToast('📖 Reader View (MathJax rendered, read-only)');
        } else {
            wysiwygPane.setAttribute('contenteditable', 'true');
            sourceTextarea.removeAttribute('readonly');
            if (toolbar) toolbar.style.display = 'flex';
            if (unicodePalette) unicodePalette.style.display = 'flex';
            if (saveDbBtn) saveDbBtn.style.display = 'inline-flex';
            if (saveStatusPill) saveStatusPill.style.display = 'inline-flex';
            if (customDropdown) customDropdown.style.display = 'inline-flex';
            if (spellBtn) spellBtn.style.display = 'inline-flex';
            if (viewPills) viewPills.style.display = 'inline-flex';

            if (statusWrapper) {
                statusWrapper.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <label for="editor-status-select" style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Status:</label>
                        <select id="editor-status-select" class="tb-select" style="font-weight: 600; padding: 4px 8px;">
                            <option value="raw" ${currentStatus === 'raw' ? 'selected' : ''}>raw</option>
                            <option value="staged" ${currentStatus === 'staged' ? 'selected' : ''}>staged</option>
                            <option value="reviewed" ${currentStatus === 'reviewed' ? 'selected' : ''}>reviewed</option>
                            <option value="published" ${currentStatus === 'published' ? 'selected' : ''}>published</option>
                        </select>
                    </div>
                `;
                const statusSelect = statusWrapper.querySelector('#editor-status-select') as HTMLSelectElement;
                if (statusSelect) {
                    statusSelect.addEventListener('change', () => {
                        currentStatus = statusSelect.value;
                        setDirty(true);
                    });
                }
            }

            if (toggleBtn) {
                toggleBtn.textContent = '👁️ Switch to Read Mode';
                toggleBtn.className = 'btn btn-secondary';
            }
            showToast('✏️ Edit Mode: full authoring surface & controls active');
        }

        if (onSwitchMode) {
            onSwitchMode(isReadMode ? 'read' : 'update');
        }
    }

    container.querySelector('#editor-btn-toggle-mode')?.addEventListener('click', () => {
        setReadMode(!isReadMode);
    });

    container.querySelector('#editor-btn-back')?.addEventListener('click', () => {
        if (isDirty) {
            if (!confirm('You have unsaved changes. Do you really want to leave this segment?')) {
                return;
            }
        }
        onBack();
    });

    // -------------------------------------------------------------------------
    // Direct Database Persistence (Save to DB)
    // -------------------------------------------------------------------------
    async function saveToDatabase() {
        if (isReadMode) {
            showToast('ℹ️ Read Mode: click "Switch to Edit Mode" to save changes.');
            return;
        }

        syncContent(activeMode, activeMode);
        const finalContentHtml = activeMode === 'source' ? sourceTextarea.value.trim() : cleanHtml(wysiwygPane.innerHTML);

        const statusSelect = container.querySelector('#editor-status-select') as HTMLSelectElement;
        if (statusSelect) {
            currentStatus = statusSelect.value;
        }

        try {
            saveStatusPill.textContent = 'Saving...';

            let targetId = segId || segmentRecord.id;
            let res: any = null;

            if (targetId) {
                res = await executeSql(
                    `UPDATE segments SET content_html = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING id, status;`,
                    [finalContentHtml, currentStatus, targetId]
                );
            } else if (segSlug) {
                res = await executeSql(
                    `UPDATE segments SET content_html = $1, status = $2, updated_at = NOW() WHERE slug = $3 OR seg_key = $3 RETURNING id, status;`,
                    [finalContentHtml, currentStatus, segSlug]
                );
            }

            if (res && res.status === 'success' && res.data && res.data.rowCount > 0) {
                if (res.data.rows?.[0]?.id) {
                    segmentRecord.id = res.data.rows[0].id;
                }
                segmentRecord.content_html = finalContentHtml;
                segmentRecord.status = currentStatus;
                segmentRecord.editorial_status = currentStatus;

                setDirty(false);
                saveStatusPill.textContent = '✓ Saved';
                saveStatusPill.classList.remove('dirty');
                showToast('✓ Saved and replaced content_html in database');

                if (onSaved) {
                    onSaved(segmentRecord);
                }
            } else if (!targetId) {
                // In-memory update for draft record not yet committed to DB
                segmentRecord.content_html = finalContentHtml;
                segmentRecord.status = currentStatus;
                segmentRecord.editorial_status = currentStatus;

                setDirty(false);
                saveStatusPill.textContent = '✓ Saved';
                saveStatusPill.classList.remove('dirty');
                showToast('✓ Updated content_html draft (submit record form to persist)');

                if (onSaved) {
                    onSaved(segmentRecord);
                }
            } else {
                const errMsg = res ? (res.error || res.message) : 'Unknown database error';
                alert('Database save error: ' + errMsg);
                saveStatusPill.textContent = '● Save failed';
            }
        } catch (err: any) {
            alert('Database save error: ' + err.message);
            saveStatusPill.textContent = '● Error';
        }
    }

    container.querySelector('#editor-btn-save-db')?.addEventListener('click', saveToDatabase);

    // Ctrl+S shortcut handler
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            if (!isReadMode && document.body.contains(rootEl)) {
                e.preventDefault();
                saveToDatabase();
            }
        }
    });

    // -------------------------------------------------------------------------
    // Content Synchronization & View Switching (Normal, Source, Split)
    // -------------------------------------------------------------------------
    function syncContent(fromMode: 'wysiwyg' | 'source' | 'split', toMode: 'wysiwyg' | 'source' | 'split') {
        if (fromMode === 'source') {
            const src = sourceTextarea.value.trim();
            wysiwygPane.innerHTML = src;
            decorateCustomElements(wysiwygPane);
        } else {
            const html = cleanHtml(wysiwygPane.innerHTML);
            sourceTextarea.value = html;
        }
    }

    function setComposerViewMode(mode: 'wysiwyg' | 'source' | 'split') {
        if (mode === activeMode) return;
        const prev = activeMode;
        activeMode = mode;

        container.querySelectorAll('.view-pills .pill').forEach((p) => p.classList.remove('active'));
        syncContent(prev, mode);

        if (mode === 'wysiwyg') {
            container.querySelector('#pill-wysiwyg')?.classList.add('active');
            workspace.classList.remove('split-mode');
            wysiwygPane.style.display = 'block';
            sourcePane.style.display = 'none';
            typesetMath();
            decorateCustomElements(wysiwygPane);
        } else if (mode === 'source') {
            container.querySelector('#pill-source')?.classList.add('active');
            workspace.classList.remove('split-mode');
            wysiwygPane.style.display = 'none';
            sourcePane.style.display = 'block';
            sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
        } else if (mode === 'split') {
            container.querySelector('#pill-split')?.classList.add('active');
            workspace.classList.add('split-mode');
            wysiwygPane.style.display = 'block';
            sourcePane.style.display = 'block';
            sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
            typesetMath();
            decorateCustomElements(wysiwygPane);
        }
    }

    container.querySelector('#pill-wysiwyg')?.addEventListener('click', () => setComposerViewMode('wysiwyg'));
    container.querySelector('#pill-source')?.addEventListener('click', () => setComposerViewMode('source'));
    container.querySelector('#pill-split')?.addEventListener('click', () => setComposerViewMode('split'));

    wysiwygPane.addEventListener('input', () => {
        setDirty(true);
        if (activeMode === 'split') {
            sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
        }
    });

    sourceTextarea.addEventListener('input', () => {
        setDirty(true);
        if (activeMode === 'split') {
            wysiwygPane.innerHTML = sourceTextarea.value;
        }
    });

    // -------------------------------------------------------------------------
    // Selection Preservation & Text Insertion Helpers
    // -------------------------------------------------------------------------
    function saveEditorSelection() {
        if (activeMode === 'source' || (activeMode === 'split' && document.activeElement === sourceTextarea)) {
            lastSourceSelection = {
                start: sourceTextarea.selectionStart,
                end: sourceTextarea.selectionEnd
            };
        } else {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const r = sel.getRangeAt(0);
                if (wysiwygPane.contains(r.commonAncestorContainer) || r.commonAncestorContainer === wysiwygPane) {
                    lastWysiwygRange = r.cloneRange();
                }
            }
        }
    }

    ['keyup', 'mouseup', 'click'].forEach((evt) => {
        wysiwygPane.addEventListener(evt, () => {
            saveEditorSelection();
            updateScriptLevelUI();
        });
        sourceTextarea.addEventListener(evt, saveEditorSelection);
    });

    function insertTextAtCursor(text: string) {
        if (isReadMode) return;
        if (activeMode === 'wysiwyg' || activeMode === 'split') {
            wysiwygPane.focus();
            const sel = window.getSelection();
            if (lastWysiwygRange && wysiwygPane.contains(lastWysiwygRange.commonAncestorContainer)) {
                sel?.removeAllRanges();
                sel?.addRange(lastWysiwygRange);
            }
            document.execCommand('insertText', false, text);
            saveEditorSelection();
            setDirty(true);
            if (activeMode === 'split') {
                sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
            }
        } else if (activeMode === 'source') {
            sourceTextarea.focus();
            const start = sourceTextarea.selectionStart;
            const end = sourceTextarea.selectionEnd;
            const val = sourceTextarea.value;
            sourceTextarea.value = val.substring(0, start) + text + val.substring(end);
            sourceTextarea.selectionStart = sourceTextarea.selectionEnd = start + text.length;
            saveEditorSelection();
            setDirty(true);
        }
    }

    function insertHtmlAtCursor(html: string) {
        if (isReadMode) return;
        if (activeMode === 'wysiwyg' || activeMode === 'split') {
            wysiwygPane.focus();
            let inserted = false;
            try {
                inserted = document.execCommand('insertHTML', false, html);
            } catch (e) {
                console.warn('execCommand fallback', e);
            }
            if (!inserted) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount) {
                    const r = sel.getRangeAt(0);
                    r.deleteContents();
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    const frag = document.createDocumentFragment();
                    let node;
                    while ((node = temp.firstChild)) frag.appendChild(node);
                    r.insertNode(frag);
                }
            }
            saveEditorSelection();
            decorateCustomElements(wysiwygPane);
            setDirty(true);
            if (activeMode === 'split') {
                sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
            }
        } else if (activeMode === 'source') {
            sourceTextarea.focus();
            const start = sourceTextarea.selectionStart;
            const end = sourceTextarea.selectionEnd;
            const val = sourceTextarea.value;
            sourceTextarea.value = val.substring(0, start) + html + val.substring(end);
            sourceTextarea.selectionStart = sourceTextarea.selectionEnd = start + html.length;
            saveEditorSelection();
            setDirty(true);
        }
    }

    // -------------------------------------------------------------------------
    // Script Level Handlers (x₂, x₁, x, x¹, x²)
    // -------------------------------------------------------------------------
    function getSelectionScriptLevel(): number {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return 0;
        let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        if (!node || !wysiwygPane.contains(node)) return 0;

        let supCount = 0;
        let subCount = 0;
        let curr: HTMLElement | null = node as HTMLElement;
        while (curr && curr !== wysiwygPane) {
            if (curr.nodeName === 'SUP') supCount++;
            if (curr.nodeName === 'SUB') subCount++;
            curr = curr.parentElement;
        }
        if (supCount >= 2) return 2;
        if (supCount === 1) return 1;
        if (subCount >= 2) return -2;
        if (subCount === 1) return -1;
        return 0;
    }

    function updateScriptLevelUI(forceLevel: number | null = null) {
        const level = forceLevel !== null ? forceLevel : getSelectionScriptLevel();
        container.querySelectorAll('.script-level-btn').forEach((btn) => {
            const btnLevel = parseInt(btn.getAttribute('data-level') || '0', 10);
            if (btnLevel === level) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function applyScriptLevel(targetLevel: number) {
        if (isReadMode) return;
        wysiwygPane.focus();
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const currentLevel = getSelectionScriptLevel();
        if (currentLevel === targetLevel) return;

        // Strip existing script tags from selection
        document.execCommand('superscript', false);
        document.execCommand('subscript', false);

        if (targetLevel === 1) {
            document.execCommand('superscript', false);
        } else if (targetLevel === 2) {
            document.execCommand('superscript', false);
            const r = sel.getRangeAt(0);
            const supEl = document.createElement('sup');
            r.surroundContents(supEl);
        } else if (targetLevel === -1) {
            document.execCommand('subscript', false);
        } else if (targetLevel === -2) {
            document.execCommand('subscript', false);
            const r = sel.getRangeAt(0);
            const subEl = document.createElement('sub');
            r.surroundContents(subEl);
        }

        updateScriptLevelUI(targetLevel);
        setDirty(true);
    }

    container.querySelectorAll('.script-level-btn').forEach((btn) => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            saveEditorSelection();
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lvl = parseInt(btn.getAttribute('data-level') || '0', 10);
            applyScriptLevel(lvl);
        });
    });

    // -------------------------------------------------------------------------
    // Toolbar Actions (Formatting, Fonts, Headings, Blocks)
    // -------------------------------------------------------------------------
    container.querySelector('#tb-bold')?.addEventListener('click', () => {
        document.execCommand('bold', false);
        setDirty(true);
    });

    container.querySelector('#tb-italic')?.addEventListener('click', () => {
        document.execCommand('italic', false);
        setDirty(true);
    });

    container.querySelector('#tb-ul')?.addEventListener('click', () => {
        document.execCommand('insertUnorderedList', false);
        setDirty(true);
    });

    container.querySelector('#tb-ol')?.addEventListener('click', () => {
        document.execCommand('insertOrderedList', false);
        setDirty(true);
    });

    container.querySelector('#tb-indent')?.addEventListener('click', () => {
        document.execCommand('indent', false);
        setDirty(true);
    });

    container.querySelector('#tb-outdent')?.addEventListener('click', () => {
        document.execCommand('outdent', false);
        setDirty(true);
    });

    container.querySelector('#tb-align-left')?.addEventListener('click', () => {
        document.execCommand('justifyLeft', false);
        setDirty(true);
    });

    container.querySelector('#tb-align-center')?.addEventListener('click', () => {
        document.execCommand('justifyCenter', false);
        setDirty(true);
    });

    container.querySelector('#tb-align-right')?.addEventListener('click', () => {
        document.execCommand('justifyRight', false);
        setDirty(true);
    });

    // Font size selector and step buttons
    const fontSizeSelect = container.querySelector('#tb-font-size') as HTMLSelectElement;
    fontSizeSelect?.addEventListener('change', () => {
        const val = fontSizeSelect.value;
        if (val) {
            wysiwygPane.focus();
            document.execCommand('fontSize', false, val);
            setDirty(true);
            fontSizeSelect.value = '';
        }
    });

    container.querySelector('#tb-size-down')?.addEventListener('click', () => {
        wysiwygPane.focus();
        const cur = parseInt(document.queryCommandValue('fontSize')) || 3;
        document.execCommand('fontSize', false, Math.max(1, cur - 1).toString());
        setDirty(true);
    });

    container.querySelector('#tb-size-up')?.addEventListener('click', () => {
        wysiwygPane.focus();
        const cur = parseInt(document.queryCommandValue('fontSize')) || 3;
        document.execCommand('fontSize', false, Math.min(7, cur + 1).toString());
        setDirty(true);
    });

    // Zoom Controls
    function setZoom(zoom: number) {
        currentZoom = Math.max(0.6, Math.min(2.5, Math.round(zoom * 100) / 100));
        const resetBtn = container.querySelector('#btn-zoom-reset');
        if (resetBtn) resetBtn.textContent = `${Math.round(currentZoom * 100)}%`;
        wysiwygPane.style.zoom = currentZoom.toString();
        sourceTextarea.style.fontSize = `${Math.round(13 * currentZoom)}px`;
    }

    container.querySelector('#btn-zoom-in')?.addEventListener('click', () => {
        const next = zoomLevels.find((z) => z > currentZoom + 0.01) || currentZoom + 0.25;
        setZoom(next);
    });

    container.querySelector('#btn-zoom-out')?.addEventListener('click', () => {
        const prev = [...zoomLevels].reverse().find((z) => z < currentZoom - 0.01) || currentZoom - 0.25;
        setZoom(prev);
    });

    container.querySelector('#btn-zoom-reset')?.addEventListener('click', () => setZoom(1.0));

    // Spell Check Toggle
    const tbSpell = container.querySelector('#editor-tb-spell');
    tbSpell?.addEventListener('click', () => {
        spellCheckActive = !spellCheckActive;
        wysiwygPane.setAttribute('spellcheck', spellCheckActive ? 'true' : 'false');
        sourceTextarea.setAttribute('spellcheck', spellCheckActive ? 'true' : 'false');
        if (spellCheckActive) {
            tbSpell.classList.add('active');
            tbSpell.textContent = '🔤 Spell: ON';
            showToast('✓ Spell check enabled');
        } else {
            tbSpell.classList.remove('active');
            tbSpell.textContent = '🔤 Spell: OFF';
            showToast('Spell check disabled');
        }
    });

    // Dropdown Toggles and Action Dispatchers
    container.querySelectorAll('.tb-dropdown').forEach((dropdown) => {
        const trigger = dropdown.querySelector('button');
        if (!trigger) return;
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            container.querySelectorAll('.tb-dropdown.open, .u-dropdown.open').forEach((d) => d.classList.remove('open'));
            if (!isOpen) dropdown.classList.add('open');
        });
    });

    document.addEventListener('click', () => {
        container.querySelectorAll('.tb-dropdown.open, .u-dropdown.open').forEach((d) => d.classList.remove('open'));
    });

    // Menu Item Actions (Heading, More Styles, Blocks, Inserts)
    container.querySelectorAll('.tb-dropdown-item').forEach((item) => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            container.querySelectorAll('.tb-dropdown.open').forEach((d) => d.classList.remove('open'));

            const action = item.getAttribute('data-action');
            const val = item.getAttribute('data-val');

            if (action === 'format-block' && val) {
                wysiwygPane.focus();
                document.execCommand('formatBlock', false, val);
                setDirty(true);
            } else if (action === 'underline') {
                document.execCommand('underline', false);
                setDirty(true);
            } else if (action === 'strike') {
                document.execCommand('strikeThrough', false);
                setDirty(true);
            } else if (action === 'code') {
                insertHtmlAtCursor('<code>' + (window.getSelection()?.toString() || 'code') + '</code>');
            } else if (action === 'foreColor') {
                const color = prompt('Enter hex color or CSS color name:', '#0284c7');
                if (color) {
                    document.execCommand('foreColor', false, color);
                    setDirty(true);
                }
            } else if (action === 'hiliteColor') {
                const color = prompt('Enter background highlight color:', '#fef08a');
                if (color) {
                    document.execCommand('hiliteColor', false, color);
                    setDirty(true);
                }
            } else if (action === 'removeFormat') {
                document.execCommand('removeFormat', false);
                setDirty(true);
            } else if (action === 'blockquote') {
                insertHtmlAtCursor('<blockquote>' + (window.getSelection()?.toString() || 'Quoted text') + '</blockquote>');
            } else if (action === 'details') {
                insertHtmlAtCursor('<details style="margin: 12px 0; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px;"><summary style="cursor: pointer; font-weight: 700; color: #0369a1;">Click to expand details</summary><div style="margin-top: 8px;">Detailed content...</div></details>');
            } else if (action === 'callout-note') {
                insertHtmlAtCursor('<div class="axiom-box" style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 16px 0; border-radius: 0 6px 6px 0;"><strong>Note:</strong> Enter note text...</div>');
            } else if (action === 'callout-def') {
                insertHtmlAtCursor('<div class="demo-box" style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 18px; margin: 16px 0;"><strong>Definition:</strong> Enter definition...</div>');
            } else if (action === 'insert-link') {
                const url = prompt('Enter URL to link to:', 'https://');
                if (url) {
                    document.execCommand('createLink', false, url);
                    setDirty(true);
                }
            } else if (action === 'insert-image') {
                const url = prompt('Enter image URL or asset path:', '');
                if (url) {
                    insertHtmlAtCursor(`<img src="${escapeHtml(url)}" style="max-width: 100%; height: auto; border-radius: 6px;" alt="Image" />`);
                }
            } else if (action === 'insert-table') {
                openTableModal();
            } else if (action === 'insert-hr') {
                insertHtmlAtCursor('<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />');
            } else if (action === 'insert-ttd') {
                openCustomElementPicker('ttd');
            } else if (action === 'insert-fs') {
                openCustomElementPicker('fs');
            } else if (action === 'insert-stencil') {
                openCustomElementPicker('stencil');
            } else if (action === 'insert-demo') {
                openCustomElementPicker('demo');
            } else if (action === 'insert-pseudo') {
                openCustomElementPicker('pseudo');
            }
        });
    });

    // Unicode button click handlers
    container.querySelectorAll('.u-btn, .u-grid-btn').forEach((btn) => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            saveEditorSelection();
        });
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const ch = btn.getAttribute('data-char');
            if (ch) insertTextAtCursor(ch);
        });
    });

    // -------------------------------------------------------------------------
    // Custom Element Pickers (<ttd-ref>, <fs-ref>, <interactive-stencil>, <visual-demo>, <pseudo-ref>)
    // -------------------------------------------------------------------------
    async function openCustomElementPicker(kind: 'ttd' | 'fs' | 'stencil' | 'demo' | 'pseudo', targetElemToReplace: HTMLElement | null = null) {
        saveEditorSelection();
        const isReplace = !!targetElemToReplace;
        const modalTitle = container.querySelector('#custom-elem-modal-title') as HTMLElement;
        const modalBody = container.querySelector('#custom-elem-modal-body') as HTMLElement;

        if (kind === 'ttd') {
            modalTitle.textContent = isReplace ? '⚖️ Switch Truth Table Reference (<ttd-ref>)' : '⚖️ Insert Truth Table Custom Element (<ttd-ref>)';
            modalBody.innerHTML = '<div style="padding: 16px; color: #64748b;">Querying authoritative propositions from PostgreSQL database...</div>';
            customElemModal.classList.add('active');

            try {
                const ttdRows = await queryDatabase<any>(
                    "SELECT id, title, engine, mode, expression, status, init_packet FROM interactive_demos WHERE engine = 'ttd' ORDER BY id ASC;"
                );

                modalBody.innerHTML = `
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">
                        Select a proposition from the Truth Table database to link as a canonical <code>&lt;ttd-ref id="..."&gt;</code> reference:
                    </p>
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                            Authoritative Propositions (${ttdRows?.length || 0} registered):
                        </label>
                        <select id="modal-select-ttd-item" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px; background: #ffffff;">
                            ${(ttdRows || []).map((d: any) => {
                                const exp = d.expression || '';
                                const fmt = exp ? PxeEngine.fmt(exp) : '';
                                const statusSuffix = d.status ? ` [${d.status}]` : '';
                                const label = `[#${d.id}] ${d.title ? d.title + ' — ' : ''}${fmt || exp || 'TTD'}${statusSuffix}`;
                                return `<option value="${d.id}">${escapeHtml(label)}</option>`;
                            }).join('')}
                        </select>
                    </div>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #64748b; margin-bottom: 16px;">
                        💡 <strong>Live Citation:</strong> The reader will dynamically embed the interactive truth table widget populated directly with this database proposition.
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-custom-elem">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-insert-ttd">${isReplace ? 'Update Reference' : 'Insert &lt;ttd-ref&gt;'}</button>
                    </div>
                `;

                modalBody.querySelector('#btn-cancel-custom-elem')?.addEventListener('click', closeCustomElemModal);
                modalBody.querySelector('#btn-confirm-insert-ttd')?.addEventListener('click', () => {
                    const sel = modalBody.querySelector('#modal-select-ttd-item') as HTMLSelectElement;
                    if (sel && sel.value) {
                        if (targetElemToReplace) {
                            targetElemToReplace.setAttribute('id', sel.value);
                            targetElemToReplace.removeAttribute('exp');
                            targetElemToReplace.removeAttribute('style');
                            decorateCustomElements(wysiwygPane);
                            setDirty(true);
                            if (activeMode === 'split') {
                                sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
                            }
                            showToast(`✓ Updated <ttd-ref id="${sel.value}">`);
                        } else {
                            insertHtmlAtCursor(`\n<ttd-ref id="${sel.value}"></ttd-ref>\n`);
                            showToast(`✓ Inserted <ttd-ref id="${sel.value}">`);
                        }
                    }
                    closeCustomElemModal();
                });
            } catch (err: any) {
                modalBody.innerHTML = `<div style="color: #dc2626;">Error: ${err.message}</div>`;
            }
        } else if (kind === 'fs') {
            modalTitle.textContent = isReplace ? '📜 Switch Formal Statement Citation (<fs-ref>)' : '📜 Insert Formal Statement Citation (<fs-ref>)';
            modalBody.innerHTML = '<div style="padding: 16px; color: #64748b;">Loading formal statements from PostgreSQL...</div>';
            customElemModal.classList.add('active');

            try {
                const fsRows = await queryDatabase<any>(
                    "SELECT id, statement_key, title, statement_kind FROM formal_statements ORDER BY id ASC;"
                );

                modalBody.innerHTML = `
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">Choose a formal statement or directed equality to cite:</p>
                    <div style="margin-bottom: 16px;">
                        <select id="modal-select-fs-item" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px;">
                            ${(fsRows || []).map((s: any) => `
                                <option value="${escapeHtml(s.statement_key)}">
                                    [${escapeHtml((s.statement_kind || 'fs').toUpperCase())}] ${escapeHtml(s.title || s.statement_key)} (${escapeHtml(s.statement_key)})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-custom-elem">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-insert-fs">${isReplace ? 'Update Reference' : 'Insert &lt;fs-ref&gt;'}</button>
                    </div>
                `;

                modalBody.querySelector('#btn-cancel-custom-elem')?.addEventListener('click', closeCustomElemModal);
                modalBody.querySelector('#btn-confirm-insert-fs')?.addEventListener('click', () => {
                    const sel = modalBody.querySelector('#modal-select-fs-item') as HTMLSelectElement;
                    if (sel && sel.value) {
                        if (targetElemToReplace) {
                            targetElemToReplace.setAttribute('statement-key', sel.value);
                            targetElemToReplace.removeAttribute('id');
                            targetElemToReplace.removeAttribute('desc');
                            decorateCustomElements(wysiwygPane);
                            setDirty(true);
                            if (activeMode === 'split') {
                                sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
                            }
                            showToast(`✓ Updated <fs-ref statement-key="${sel.value}">`);
                        } else {
                            insertHtmlAtCursor(`\n<fs-ref statement-key="${sel.value}"></fs-ref>\n`);
                            showToast(`✓ Inserted <fs-ref statement-key="${sel.value}">`);
                        }
                    }
                    closeCustomElemModal();
                });
            } catch (err: any) {
                modalBody.innerHTML = `<div style="color: #dc2626;">Error: ${err.message}</div>`;
            }
        } else if (kind === 'stencil') {
            modalTitle.textContent = isReplace ? '📐 Switch Computational Stencil (<interactive-stencil>)' : '📐 Insert Computational Stencil (<interactive-stencil>)';
            modalBody.innerHTML = '<div style="padding: 16px; color: #64748b;">Loading stencils from PostgreSQL...</div>';
            customElemModal.classList.add('active');

            try {
                const stencilRows = await queryDatabase<any>(
                    "SELECT id, equation_key, title, label FROM directed_equations ORDER BY id ASC;"
                );

                modalBody.innerHTML = `
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">Choose a computational stencil to embed:</p>
                    <div style="margin-bottom: 16px;">
                        <select id="modal-select-stencil-item" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px;">
                            ${(stencilRows || []).map((st: any) => `
                                <option value="${escapeHtml(st.equation_key)}">
                                    ${escapeHtml(st.title || st.label || st.equation_key)} [${escapeHtml(st.equation_key)}]
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-custom-elem">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-insert-stencil">${isReplace ? 'Update Reference' : 'Insert &lt;interactive-stencil&gt;'}</button>
                    </div>
                `;

                modalBody.querySelector('#btn-cancel-custom-elem')?.addEventListener('click', closeCustomElemModal);
                modalBody.querySelector('#btn-confirm-insert-stencil')?.addEventListener('click', () => {
                    const sel = modalBody.querySelector('#modal-select-stencil-item') as HTMLSelectElement;
                    if (sel && sel.value) {
                        if (targetElemToReplace) {
                            targetElemToReplace.setAttribute('equation-key', sel.value);
                            targetElemToReplace.removeAttribute('id');
                            decorateCustomElements(wysiwygPane);
                            setDirty(true);
                            if (activeMode === 'split') {
                                sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
                            }
                            showToast(`✓ Updated <interactive-stencil equation-key="${sel.value}">`);
                        } else {
                            insertHtmlAtCursor(`\n<interactive-stencil equation-key="${sel.value}"></interactive-stencil>\n`);
                            showToast(`✓ Inserted <interactive-stencil equation-key="${sel.value}">`);
                        }
                    }
                    closeCustomElemModal();
                });
            } catch (err: any) {
                modalBody.innerHTML = `<div style="color: #dc2626;">Error: ${err.message}</div>`;
            }
        } else if (kind === 'demo') {
            modalTitle.textContent = isReplace ? '🎨 Switch Interactive Demo (<visual-demo>)' : '🎨 Insert Interactive Visual Demo (<visual-demo>)';
            modalBody.innerHTML = '<div style="padding: 16px; color: #64748b;">Loading interactive demos from PostgreSQL...</div>';
            customElemModal.classList.add('active');

            try {
                const demoRows = await queryDatabase<any>(
                    "SELECT id, title, engine, mode FROM interactive_demos ORDER BY id ASC;"
                );

                modalBody.innerHTML = `
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">Choose an interactive demo to embed:</p>
                    <div style="margin-bottom: 16px;">
                        <select id="modal-select-demo-item" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px;">
                            ${(demoRows || []).map((d: any) => `
                                <option value="${d.id}">
                                    [${escapeHtml((d.engine || 'demo').toUpperCase())}] #${d.id} ${escapeHtml(d.title || d.mode || 'Demo')}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-custom-elem">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-insert-demo">${isReplace ? 'Update Reference' : 'Insert &lt;visual-demo&gt;'}</button>
                    </div>
                `;

                modalBody.querySelector('#btn-cancel-custom-elem')?.addEventListener('click', closeCustomElemModal);
                modalBody.querySelector('#btn-confirm-insert-demo')?.addEventListener('click', () => {
                    const sel = modalBody.querySelector('#modal-select-demo-item') as HTMLSelectElement;
                    if (sel && sel.value) {
                        if (targetElemToReplace) {
                            targetElemToReplace.setAttribute('id', sel.value);
                            decorateCustomElements(wysiwygPane);
                            setDirty(true);
                            if (activeMode === 'split') {
                                sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
                            }
                            showToast(`✓ Updated <visual-demo id="${sel.value}">`);
                        } else {
                            insertHtmlAtCursor(`\n<visual-demo id="${sel.value}"></visual-demo>\n`);
                            showToast(`✓ Inserted <visual-demo id="${sel.value}">`);
                        }
                    }
                    closeCustomElemModal();
                });
            } catch (err: any) {
                modalBody.innerHTML = `<div style="color: #dc2626;">Error: ${err.message}</div>`;
            }
        } else if (kind === 'pseudo') {
            modalTitle.textContent = isReplace ? '⚡ Switch Pseudocode Algorithm (<pseudo-ref>)' : '⚡ Insert Pseudocode Algorithm (<pseudo-ref>)';
            modalBody.innerHTML = '<div style="padding: 16px; color: #64748b;">Loading pseudocode algorithms from PostgreSQL...</div>';
            customElemModal.classList.add('active');

            try {
                const pseudoRows = await queryDatabase<any>(
                    "SELECT id, algo_key, name, func_name, badge FROM pseudocode_algorithms ORDER BY id ASC;"
                );

                modalBody.innerHTML = `
                    <p style="color: #64748b; font-size: 13px; margin-bottom: 12px;">Choose a pseudocode algorithm to reference:</p>
                    <div style="margin-bottom: 16px;">
                        <select id="modal-select-pseudo-item" style="width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 6px;">
                            ${(pseudoRows || []).map((p: any) => `
                                <option value="${escapeHtml(p.algo_key)}">
                                    [${escapeHtml((p.badge || 'ALGO').toUpperCase())}] ${escapeHtml(p.name || p.func_name || p.algo_key)} (${escapeHtml(p.algo_key)})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 8px;">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-custom-elem">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btn-confirm-insert-pseudo">${isReplace ? 'Update Reference' : 'Insert &lt;pseudo-ref&gt;'}</button>
                    </div>
                `;

                modalBody.querySelector('#btn-cancel-custom-elem')?.addEventListener('click', closeCustomElemModal);
                modalBody.querySelector('#btn-confirm-insert-pseudo')?.addEventListener('click', () => {
                    const sel = modalBody.querySelector('#modal-select-pseudo-item') as HTMLSelectElement;
                    if (sel && sel.value) {
                        if (targetElemToReplace) {
                            targetElemToReplace.setAttribute('algo-key', sel.value);
                            targetElemToReplace.removeAttribute('id');
                            decorateCustomElements(wysiwygPane);
                            setDirty(true);
                            if (activeMode === 'split') {
                                sourceTextarea.value = cleanHtml(wysiwygPane.innerHTML);
                            }
                            showToast(`✓ Updated <pseudo-ref algo-key="${sel.value}">`);
                        } else {
                            insertHtmlAtCursor(`\n<pseudo-ref algo-key="${sel.value}"></pseudo-ref>\n`);
                            showToast(`✓ Inserted <pseudo-ref algo-key="${sel.value}">`);
                        }
                    }
                    closeCustomElemModal();
                });
            } catch (err: any) {
                modalBody.innerHTML = `<div style="color: #dc2626;">Error: ${err.message}</div>`;
            }
        }
    }

    function closeCustomElemModal() {
        customElemModal.classList.remove('active');
    }

    container.querySelector('#btn-close-custom-elem')?.addEventListener('click', closeCustomElemModal);
    customElemModal.addEventListener('click', (e) => {
        if (e.target === customElemModal) closeCustomElemModal();
    });

    // -------------------------------------------------------------------------
    // LaTeX Math Modal Handlers
    // -------------------------------------------------------------------------
    let editingMathTarget: HTMLElement | null = null;

    async function updateLatexPreview() {
        const tex = latexInput.value.trim();
        const isDisplay = (container.querySelector('#editor-math-mode-display') as HTMLInputElement)?.checked;
        if (!tex) {
            latexPreviewBox.innerHTML = '<span style="color: #94a3b8; font-size: 13px;">Type LaTeX above to see preview</span>';
            return;
        }
        latexPreviewBox.innerHTML = isDisplay ? `\\[ ${tex} \\]` : `\\( ${tex} \\)`;
        if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
            try {
                await (window as any).MathJax.typesetPromise([latexPreviewBox]);
            } catch (err) {
                console.warn('MathJax preview err', err);
            }
        }
    }

    function openMathEditor(target: HTMLElement | null = null) {
        saveEditorSelection();
        editingMathTarget = target;
        if (target) {
            const rawTex = decodeURIComponent(target.getAttribute('data-latex') || '');
            latexInput.value = rawTex;
            const isDisplay = target.getAttribute('data-display') === 'true' || target.classList.contains('latex-math-block');
            (container.querySelector('#editor-math-mode-display') as HTMLInputElement).checked = isDisplay;
            (container.querySelector('#editor-math-mode-inline') as HTMLInputElement).checked = !isDisplay;
            mathModalTitle.textContent = '📐 Edit LaTeX Math Formula';
            btnApplyMath.textContent = 'Apply Changes';
        } else {
            latexInput.value = '\\frac{a}{b}';
            (container.querySelector('#editor-math-mode-inline') as HTMLInputElement).checked = true;
            mathModalTitle.textContent = '📐 Insert LaTeX Math Formula';
            btnApplyMath.textContent = 'Insert Formula';
        }
        mathModal.classList.add('active');
        latexInput.focus();
        updateLatexPreview();
    }

    function closeMathEditor() {
        mathModal.classList.remove('active');
        editingMathTarget = null;
    }

    container.querySelector('#tb-insert-latex')?.addEventListener('click', () => openMathEditor(null));
    container.querySelector('#btn-close-math')?.addEventListener('click', closeMathEditor);
    container.querySelector('#btn-cancel-math')?.addEventListener('click', closeMathEditor);
    latexInput.addEventListener('input', updateLatexPreview);
    container.querySelector('#editor-math-mode-inline')?.addEventListener('change', updateLatexPreview);
    container.querySelector('#editor-math-mode-display')?.addEventListener('change', updateLatexPreview);

    container.querySelectorAll('.m-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
            const tex = chip.getAttribute('data-tex') || '';
            const start = latexInput.selectionStart;
            const end = latexInput.selectionEnd;
            const val = latexInput.value;
            latexInput.value = val.substring(0, start) + tex + val.substring(end);
            latexInput.selectionStart = latexInput.selectionEnd = start + tex.length;
            latexInput.focus();
            updateLatexPreview();
        });
    });

    btnApplyMath.addEventListener('click', () => {
        const tex = latexInput.value.trim();
        if (!tex) {
            closeMathEditor();
            return;
        }
        const isDisplay = (container.querySelector('#editor-math-mode-display') as HTMLInputElement).checked;
        closeMathEditor();

        if (editingMathTarget && editingMathTarget.parentElement) {
            editingMathTarget.setAttribute('data-latex', encodeURIComponent(tex));
            editingMathTarget.setAttribute('data-display', isDisplay ? 'true' : 'false');
            editingMathTarget.innerHTML = isDisplay ? `\\[ ${tex} \\]` : `\\( ${tex} \\)`;
            setDirty(true);
            typesetMath();
            showToast('✓ Formula updated');
        } else {
            const formulaHtml = isDisplay
                ? `\n<div class="latex-math-block" data-latex="${encodeURIComponent(tex)}" data-display="true" contenteditable="false" style="cursor: pointer; text-align: center; margin: 12px 0; padding: 4px;" title="Double-click to edit LaTeX">\\[ ${tex} \\]</div>\n<p><br></p>\n`
                : `<span class="latex-math" data-latex="${encodeURIComponent(tex)}" data-display="false" contenteditable="false" style="cursor: pointer; display: inline-block; padding: 1px 4px; border-radius: 3px;" title="Double-click to edit LaTeX">\\( ${tex} \\)</span> `;
            insertHtmlAtCursor(formulaHtml);
            typesetMath();
            showToast('✓ Formula inserted');
        }
    });

    // -------------------------------------------------------------------------
    // HTML Table Construction Modal & Helpers
    // -------------------------------------------------------------------------
    function openTableModal() {
        saveEditorSelection();
        const sel = window.getSelection();
        let targetTable: HTMLTableElement | null = null;
        let targetRow: HTMLTableRowElement | null = null;
        let targetCell: HTMLTableCellElement | null = null;

        if (sel && sel.rangeCount > 0) {
            let n: Node | null = sel.getRangeAt(0).commonAncestorContainer;
            if (n.nodeType === Node.TEXT_NODE) n = n.parentNode;
            if (n && wysiwygPane.contains(n)) {
                targetCell = (n as HTMLElement).closest('td, th') as HTMLTableCellElement;
                targetRow = (n as HTMLElement).closest('tr') as HTMLTableRowElement;
                targetTable = (n as HTMLElement).closest('table') as HTMLTableElement;
            }
        }

        const contextBar = container.querySelector('#table-context-actions') as HTMLElement;
        if (targetTable && targetRow && targetCell) {
            activeTableContext = { table: targetTable, row: targetRow, cell: targetCell };
            if (contextBar) contextBar.style.display = 'block';
        } else {
            activeTableContext = null;
            if (contextBar) contextBar.style.display = 'none';
        }

        tableModal.classList.add('active');
    }

    function closeTableModal() {
        tableModal.classList.remove('active');
        activeTableContext = null;
    }

    container.querySelector('#btn-close-table')?.addEventListener('click', closeTableModal);
    container.querySelector('#btn-cancel-table')?.addEventListener('click', closeTableModal);

    container.querySelector('#btn-insert-table-apply')?.addEventListener('click', () => {
        const rows = Math.max(1, parseInt((container.querySelector('#tbl-input-rows') as HTMLInputElement).value, 10) || 3);
        const cols = Math.max(1, parseInt((container.querySelector('#tbl-input-cols') as HTMLInputElement).value, 10) || 3);
        const hasHeader = (container.querySelector('#tbl-check-header') as HTMLInputElement).checked;
        const styleType = (container.querySelector('#tbl-select-style') as HTMLSelectElement).value;
        const isFullWidth = (container.querySelector('#tbl-check-fullwidth') as HTMLInputElement).checked;

        const tableStyle = isFullWidth
            ? 'width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;'
            : 'border-collapse: collapse; margin: 16px 0; font-size: 14px;';

        let html = `<table style="${tableStyle}">\n`;
        if (hasHeader) {
            html += '  <thead>\n    <tr style="background-color: #0f172a; color: #ffffff;">\n';
            for (let c = 1; c <= cols; c++) {
                html += `      <th style="padding: 10px 14px; text-align: left; font-weight: 600; border: 1px solid #cbd5e1;">Header ${c}</th>\n`;
            }
            html += '    </tr>\n  </thead>\n';
        }
        html += '  <tbody>\n';
        for (let r = 1; r <= rows; r++) {
            const trBg = styleType === 'mwm' && r % 2 === 0 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
            html += `    <tr style="${trBg}">\n`;
            for (let c = 1; c <= cols; c++) {
                html += `      <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">Cell ${r},${c}</td>\n`;
            }
            html += '    </tr>\n';
        }
        html += '  </tbody>\n</table>\n<p><br></p>\n';

        closeTableModal();
        insertHtmlAtCursor(html);
        showToast('✓ Table inserted');
    });

    // -------------------------------------------------------------------------
    // Draw.io Diagram Embedding
    // -------------------------------------------------------------------------
    container.querySelector('#tb-insert-diagram')?.addEventListener('click', () => {
        openDrawio({
            diagramName: `${segSlug}_diagram`,
            onEmbed: (svgXml) => {
                insertHtmlAtCursor(`\n<div class="mwm-diagram-box" style="text-align: center; margin: 20px 0;">${svgXml}</div>\n<p><br></p>\n`);
            }
        });
    });

    function openDrawio({ diagramName = 'diagram', onEmbed }: { diagramName: string; onEmbed: (svg: string) => void }) {
        const rawContent = '<mxfile host="embed.diagrams.net"><diagram id="page-1" name="Page-1"><mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';

        const overlay = document.createElement('div');
        overlay.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(4px); z-index: 999999; display: flex; flex-direction: column; padding: 16px; box-sizing: border-box;`;

        const header = document.createElement('div');
        header.style.cssText = `display: flex; align-items: center; justify-content: space-between; background: #1e293b; color: #f8fafc; padding: 10px 16px; border-radius: 8px 8px 0 0; font-family: var(--font-family); font-size: 14px;`;
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #38bdf8;">Draw.io Diagram Editor</span>
                <span style="color: #94a3b8;">•</span>
                <span style="color: #cbd5e1;">${escapeHtml(diagramName)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <button id="drawio-save-btn" class="btn btn-primary" style="padding: 5px 12px; background: #0284c7;">💾 Embed Changes</button>
                <button id="drawio-close-btn" class="btn btn-secondary" style="padding: 5px 10px;">✕ Close</button>
            </div>
        `;

        const iframe = document.createElement('iframe');
        iframe.referrerPolicy = 'no-referrer';
        iframe.src = 'https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json&configure=1&noSaveBtn=1&saveAndExit=1&libraries=1&gapi=0&db=0&od=0&gh=0&gl=0&tr=0&picker=0&mode=device';
        iframe.style.cssText = 'flex: 1; width: 100%; border: none; border-radius: 0 0 8px 8px; background: #ffffff;';

        overlay.appendChild(header);
        overlay.appendChild(iframe);
        document.body.appendChild(overlay);

        const closeOverlay = () => {
            window.removeEventListener('message', onMsg);
            overlay.remove();
        };

        header.querySelector('#drawio-close-btn')?.addEventListener('click', closeOverlay);

        const triggerExport = () => {
            iframe.contentWindow?.postMessage(JSON.stringify({ action: 'export', format: 'xmlsvg', spinKey: 'saving' }), '*');
        };

        header.querySelector('#drawio-save-btn')?.addEventListener('click', triggerExport);

        const onMsg = (ev: MessageEvent) => {
            if (ev.source !== iframe.contentWindow) return;
            let msg: any = null;
            try { msg = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data; } catch { return; }
            if (!msg || !msg.event) return;

            if (msg.event === 'configure') {
                iframe.contentWindow?.postMessage(JSON.stringify({ action: 'configure', config: { defaultEdgeStyle: { edgeStyle: 'orthogonalEdgeStyle', rounded: 0 }, compressXml: false } }), '*');
            } else if (msg.event === 'init') {
                iframe.contentWindow?.postMessage(JSON.stringify({ action: 'load', xml: rawContent, title: `${diagramName}.drawio`, autosave: 1 }), '*');
            } else if (msg.event === 'save') {
                triggerExport();
            } else if (msg.event === 'export') {
                const rawData = msg.data || '';
                let decoded = '';
                if (rawData.startsWith('data:image/svg+xml;base64,')) {
                    decoded = atob(rawData.substring('data:image/svg+xml;base64,'.length));
                } else if (rawData.includes('<svg')) {
                    decoded = rawData;
                } else {
                    decoded = decodeURIComponent(rawData);
                }
                onEmbed(decoded);
                setDirty(true);
                showToast(`✓ Diagram embedded`);
                setTimeout(closeOverlay, 200);
            } else if (msg.event === 'exit') {
                closeOverlay();
            }
        };

        window.addEventListener('message', onMsg);
    }
}

function escapeHtml(str: string): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function injectEditorStyles() {
    if (document.getElementById('content-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'content-editor-styles';
    style.textContent = `
        .content-editor-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #ffffff;
            color: #0f172a;
            overflow: hidden;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }

        .editor-header-bar {
            background: #0f172a;
            color: #f8fafc;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            flex-wrap: wrap;
            border-bottom: 1px solid #1e293b;
            z-index: 20;
        }

        .editor-header-lhs {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .editor-header-rhs {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .editor-seg-meta {
            display: flex;
            align-items: baseline;
            gap: 6px;
        }

        .editor-seg-title {
            font-size: 14px;
            font-weight: 700;
            color: #38bdf8;
        }

        .editor-seg-slug {
            font-size: 12px;
            color: #94a3b8;
            font-family: var(--font-mono);
        }

        .editorial-status-pill {
            font-size: 11px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .status-raw { background: #fef3c7; color: #92400e; }
        .status-staged { background: #e0f2fe; color: #0369a1; }
        .status-reviewed { background: #f3e8ff; color: #6b21a8; }
        .status-published { background: #ecfdf5; color: #047857; }

        .btn {
            padding: 5px 12px;
            border-radius: 6px;
            border: none;
            font-size: 12.5px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
            font-family: var(--font-family);
        }
        .btn-primary { background: #0284c7; color: #ffffff; }
        .btn-primary:hover { background: #0369a1; }
        .btn-secondary { background: #334155; color: #f8fafc; }
        .btn-secondary:hover { background: #475569; }

        .header-zoom {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #1e293b;
            border: 1px solid #334155;
            padding: 2px 6px;
            border-radius: 6px;
        }

        .view-pills {
            display: flex;
            background: #1e293b;
            border-radius: 6px;
            padding: 2px;
            gap: 2px;
        }
        .pill {
            background: transparent;
            border: none;
            color: #94a3b8;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 4px;
            cursor: pointer;
        }
        .pill.active { background: #0284c7; color: #ffffff; }

        .status-pill {
            font-size: 11.5px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 12px;
            background: rgba(16, 185, 129, 0.15);
            color: #10b981;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }
        .status-pill.dirty {
            background: rgba(245, 158, 11, 0.15);
            color: #f59e0b;
        }

        /* Toolbar */
        .toolbar {
            background: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            padding: 5px 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            z-index: 10;
        }
        .tb-section {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 2px 5px;
            display: inline-flex;
            align-items: center;
            gap: 3px;
        }
        .tb-group { display: flex; align-items: center; gap: 2px; }
        .tb-btn {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #334155;
            padding: 3px 7px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            line-height: 1.2;
        }
        .tb-btn:hover { background: #f1f5f9; border-color: #94a3b8; }
        .tb-btn.active { background: #0284c7; color: #ffffff; border-color: #0284c7; }
        .tb-select {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            color: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
        }
        .tb-divider { width: 1px; height: 16px; background: #cbd5e1; margin: 0 3px; }

        .script-level-btn {
            font-family: Georgia, serif;
            font-size: 12px;
            padding: 2px 5px;
            min-width: 26px;
            text-align: center;
        }

        /* Dropdowns */
        .tb-dropdown { position: relative; display: inline-flex; }
        .tb-dropdown-menu {
            display: none;
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.15);
            padding: 4px;
            min-width: 175px;
            z-index: 1000;
            flex-direction: column;
            gap: 2px;
        }
        .tb-dropdown.open .tb-dropdown-menu { display: flex; }
        .tb-dropdown-item {
            padding: 5px 10px;
            font-size: 12px;
            border-radius: 4px;
            border: none;
            background: transparent;
            text-align: left;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #1e293b;
            font-weight: 500;
            white-space: nowrap;
        }
        .tb-dropdown-item:hover { background: #f1f5f9; color: #0284c7; }

        /* Unicode Character Strip */
        .unicode-palette {
            background: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 4px 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            overflow-x: auto;
            white-space: nowrap;
        }
        .palette-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-right: 2px;
            user-select: none;
        }
        .u-section {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 2px 5px;
            display: inline-flex;
            align-items: center;
            gap: 2px;
        }
        .u-section-label {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            margin-right: 2px;
            user-select: none;
        }
        .u-btn {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            color: #0f172a;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13px;
            line-height: 1.25;
            cursor: pointer;
            font-family: 'Cambria Math', Georgia, serif;
            user-select: none;
        }
        .u-btn:hover { background: #0284c7; color: #ffffff; border-color: #0284c7; }
        .u-btn.u-bold { font-weight: 700; color: #0369a1; }
        .u-btn.u-bold:hover { color: #ffffff; }
        .u-divider { width: 1px; height: 16px; background: #cbd5e1; margin: 0 3px; display: inline-block; }

        .u-dropdown { position: relative; display: inline-flex; }
        .u-dropdown-btn {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            color: #0369a1;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
        }
        .u-dropdown-btn:hover { background: #0284c7; color: #ffffff; }
        .u-dropdown-popover {
            display: none;
            position: absolute;
            top: calc(100% + 4px);
            left: 0;
            background: #ffffff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
            padding: 8px;
            z-index: 2000;
            min-width: 250px;
            max-height: 320px;
            overflow-y: auto;
        }
        .u-dropdown-popover.popover-right { left: auto; right: 0; }
        .u-dropdown.open .u-dropdown-popover { display: block; }
        .u-popover-title {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            padding-bottom: 4px;
            border-bottom: 1px solid #e2e8f0;
        }
        .u-popover-subtitle { font-size: 10px; font-weight: 600; color: #94a3b8; margin: 6px 0 3px; text-transform: uppercase; }
        .u-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
        .u-grid-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-size: 13px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-family: 'Cambria Math', Georgia, serif;
            color: #0f172a;
        }
        .u-grid-btn:hover { background: #0284c7; color: #ffffff; border-color: #0284c7; }

        /* Workspace & Panes */
        .editor-workspace {
            flex: 1;
            display: flex;
            overflow: hidden;
            position: relative;
        }
        .editor-pane {
            flex: 1;
            height: 100%;
            overflow-y: auto;
            box-sizing: border-box;
        }

        #editor-wysiwyg-pane {
            background: #ffffff;
            outline: none;
            padding: 36px 48px;
            font-family: "Times New Roman", Times, Georgia, serif;
            font-size: 16px;
            line-height: 1.6;
            color: #0f172a;
        }
        .read-mode #editor-wysiwyg-pane {
            background: #fafaf9;
            padding: 40px 60px;
        }

        #editor-wysiwyg-pane h1, #editor-wysiwyg-pane h2, #editor-wysiwyg-pane h3 {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #0f172a;
            margin-top: 1.2em;
            margin-bottom: 0.5em;
        }
        #editor-wysiwyg-pane p { margin-bottom: 1em; }
        #editor-wysiwyg-pane ul, #editor-wysiwyg-pane ol { margin: 0.8em 0 1.2em 2em; }
        #editor-wysiwyg-pane li { margin-bottom: 0.3em; }

        #editor-source-pane {
            background: #0f172a;
            padding: 0;
        }
        #editor-source-textarea {
            width: 100%;
            height: 100%;
            background: #0f172a;
            color: #f8fafc;
            border: none;
            padding: 24px;
            font-family: var(--font-mono);
            font-size: 13px;
            line-height: 1.5;
            resize: none;
            outline: none;
            tab-size: 2;
            box-sizing: border-box;
        }

        .editor-workspace.split-mode #editor-wysiwyg-pane {
            display: block;
            width: 50%;
            flex: 0 0 50%;
            border-right: 1px solid #e2e8f0;
        }
        .editor-workspace.split-mode #editor-source-pane {
            display: block;
            width: 50%;
            flex: 0 0 50%;
        }

        /* In-situ Math Styling */
        .latex-math, .latex-math-block {
            border: 1px dashed transparent;
            border-radius: 4px;
            cursor: pointer;
        }
        .latex-math:hover, .latex-math-block:hover {
            border-color: #0284c7;
            background-color: rgba(2, 132, 199, 0.08);
        }

        /* Modal Backdrop & Cards */
        .modal-backdrop {
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.65);
            backdrop-filter: blur(3px);
            z-index: 99999;
            align-items: center;
            justify-content: center;
        }
        .modal-backdrop.active { display: flex; }
        .modal-card {
            background: #ffffff;
            border-radius: 10px;
            width: 600px;
            max-width: 92vw;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .modal-header {
            background: #0f172a;
            color: #f8fafc;
            padding: 12px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .modal-header h3 { font-size: 15px; font-weight: 600; }
        .modal-body {
            padding: 16px;
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .m-chip {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 3px 8px;
            font-size: 12px;
            font-family: var(--font-mono);
            cursor: pointer;
            user-select: none;
        }
        .m-chip:hover { background: #0284c7; color: #ffffff; border-color: #0284c7; }

        /* Toast */
        .editor-toast {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #1e293b;
            color: #f8fafc;
            padding: 10px 18px;
            border-radius: 6px;
            font-size: 13px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.2s ease;
            z-index: 999999;
            pointer-events: none;
        }
        .editor-toast.show { opacity: 1; transform: translateY(0); }

        /* Custom Elements in WYSIWYG Pane */
        ttd-ref, fs-ref, interactive-stencil, visual-demo, pseudo-ref, .custom-ref-chip {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            padding: 3px 10px !important;
            border-radius: 6px !important;
            font-family: var(--font-mono, monospace) !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            cursor: pointer !important;
            user-select: none !important;
            vertical-align: middle !important;
            margin: 2px 4px !important;
            transition: all 0.15s ease !important;
            box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
            white-space: nowrap !important;
            text-decoration: none !important;
        }

        ttd-ref:hover, fs-ref:hover, interactive-stencil:hover, visual-demo:hover, pseudo-ref:hover, .custom-ref-chip:hover {
            transform: translateY(-1.5px) !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.12) !important;
            filter: brightness(0.97) !important;
        }

        /* Crimson Truth Table Theme */
        ttd-ref, .chip-ttd {
            background: #fef2f2 !important;
            border: 1.5px solid #f87171 !important;
            color: #991b1b !important;
        }
        .chip-ttd .chip-badge {
            background: #fee2e2;
            color: #b91c1c;
        }

        /* Royal Blue Formal Statement Theme */
        fs-ref, .chip-fs {
            background: #eff6ff !important;
            border: 1.5px solid #60a5fa !important;
            color: #1d4ed8 !important;
        }
        .chip-fs .chip-badge {
            background: #dbeafe;
            color: #1e40af;
        }

        /* Emerald Computational Stencil Theme */
        interactive-stencil, .chip-stencil {
            background: #f0fdf4 !important;
            border: 1.5px solid #4ade80 !important;
            color: #166534 !important;
        }
        .chip-stencil .chip-badge {
            background: #dcfce7;
            color: #15803d;
        }

        /* Violet Interactive Demo Theme */
        visual-demo, .chip-demo {
            background: #faf5ff !important;
            border: 1.5px solid #c084fc !important;
            color: #6b21a8 !important;
        }
        .chip-demo .chip-badge {
            background: #f3e8ff;
            color: #7e22ce;
        }

        /* Amber Pseudocode Algorithm Theme */
        pseudo-ref, .chip-pseudo {
            background: #fffbeb !important;
            border: 1.5px solid #fbbf24 !important;
            color: #92400e !important;
        }
        .chip-pseudo .chip-badge {
            background: #fef3c7;
            color: #b45309;
        }

        .chip-icon {
            font-size: 13px;
            line-height: 1;
        }

        .chip-badge {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 1px 5px;
            border-radius: 4px;
            letter-spacing: 0.5px;
        }

        .chip-label {
            font-size: 12px;
            font-weight: 600;
        }

        /* Floating Hover Tooltip */
        .custom-ref-tooltip {
            position: fixed;
            z-index: 1000000;
            background: #0f172a;
            color: #f8fafc;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 10px 14px;
            max-width: 380px;
            box-shadow: 0 12px 24px -4px rgba(0,0,0,0.35);
            pointer-events: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            animation: fadeInTooltip 0.15s ease;
        }

        @keyframes fadeInTooltip {
            from { opacity: 0; transform: translateY(3px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .tooltip-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
        }

        .tooltip-badge {
            font-size: 10px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .tooltip-status-pill {
            font-size: 10px;
            color: #94a3b8;
            background: #1e293b;
            padding: 1px 6px;
            border-radius: 4px;
            font-weight: 600;
        }

        .tooltip-title {
            font-size: 13px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.3;
            margin-bottom: 4px;
        }

        .tooltip-formula {
            font-family: var(--font-mono, monospace);
            font-size: 12px;
            color: #38bdf8;
            background: #1e293b;
            padding: 4px 8px;
            border-radius: 4px;
            margin: 6px 0;
            word-break: break-all;
        }

        .tooltip-footer {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #1e293b;
        }

        /* Quick Inspector Modal Customizations */
        .inspector-badge {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.5px;
        }
    `;
    document.head.appendChild(style);
}
