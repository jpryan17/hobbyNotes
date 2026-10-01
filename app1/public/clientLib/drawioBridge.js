/**
 * Draw.io In-Browser Visual Diagram Editor Bridge
 *
 * Enables double-clicking any embedded Draw.io diagram in dev/edit mode to open
 * the full Draw.io editor in a modal overlay, with automatic save-back to the server.
 */
import { SI } from './serverInterface.js';
import { getApiBaseUrl } from './db/api.js';
let activeOverlay = null;
let activeMessageListener = null;
/**
 * Initializes double-click to edit for all Draw.io SVGs in the given container.
 * Supports delegated event listening so SVGs inside WYSIWYG or contenteditable containers
 * reliably trigger the modal.
 */
export function initDrawioEditor(container, app, segId, onSaveCallback) {
    if (!container)
        return;
    const svgs = Array.from(container.querySelectorAll('svg[content*="mxfile"], svg[content*="mxGraphModel"], svg[data-diagram-name]'));
    svgs.forEach((svg, index) => {
        // Determine a meaningful diagram name
        let diagramName = svg.getAttribute('data-diagram-name');
        if (!diagramName) {
            if (index === 0 && segId === 'modelsOverview') {
                diagramName = 'ontologyModel';
            }
            else if (index === 1 && segId === 'modelsOverview') {
                diagramName = 'computationalModel';
            }
            else {
                diagramName = `${segId}_diagram${index + 1}`;
            }
            svg.setAttribute('data-diagram-name', diagramName);
        }
        svg.removeAttribute('onclick');
        svg.querySelectorAll('[onclick]').forEach(el => el.removeAttribute('onclick'));
        svg.onclick = (e) => {
            e.stopPropagation();
        };
        svg.style.cursor = 'pointer';
        svg.setAttribute('title', 'Double-click to edit diagram in Draw.io');
        // Isolate SVG from contenteditable parent containers so double-clicks trigger cleanly
        svg.setAttribute('contenteditable', 'false');
    });
    // Attach a delegated dblclick listener to the container
    const oldHandler = container.__drawioDblClickHandler;
    if (oldHandler) {
        container.removeEventListener('dblclick', oldHandler);
    }
    const dblClickHandler = (e) => {
        const target = e.target;
        if (!target)
            return;
        const targetEl = target instanceof Element ? target : target?.parentElement;
        const svg = targetEl?.closest('svg[data-diagram-name], svg[content*="mxfile"], svg[content*="mxGraphModel"]');
        if (!svg || !container.contains(svg))
            return;
        e.preventDefault();
        e.stopPropagation();
        let diagramName = svg.getAttribute('data-diagram-name');
        if (!diagramName) {
            const allSvgs = Array.from(container.querySelectorAll('svg[data-diagram-name], svg[content*="mxfile"], svg[content*="mxGraphModel"]'));
            const idx = allSvgs.indexOf(svg);
            if (idx === 0 && segId === 'modelsOverview')
                diagramName = 'ontologyModel';
            else if (idx === 1 && segId === 'modelsOverview')
                diagramName = 'computationalModel';
            else
                diagramName = `${segId}_diagram${idx + 1}`;
            svg.setAttribute('data-diagram-name', diagramName);
        }
        openDrawioModal(svg, app, segId, diagramName, onSaveCallback);
    };
    container.__drawioDblClickHandler = dblClickHandler;
    container.addEventListener('dblclick', dblClickHandler);
}
function decodeXmlSvgData(data) {
    if (!data)
        return '';
    if (data.startsWith('data:image/svg+xml;base64,')) {
        const b64 = data.substring('data:image/svg+xml;base64,'.length);
        try {
            const binStr = atob(b64);
            const bytes = new Uint8Array(binStr.length);
            for (let i = 0; i < binStr.length; i++)
                bytes[i] = binStr.charCodeAt(i);
            return new TextDecoder('utf-8').decode(bytes);
        }
        catch {
            return atob(b64);
        }
    }
    else if (data.startsWith('data:image/svg+xml;utf8,')) {
        return decodeURIComponent(data.substring('data:image/svg+xml;utf8,'.length));
    }
    else if (data.startsWith('data:image/svg+xml,')) {
        return decodeURIComponent(data.substring('data:image/svg+xml,'.length));
    }
    else if (data.includes('<svg')) {
        return data;
    }
    const commaIdx = data.indexOf(',');
    if (commaIdx !== -1) {
        const header = data.substring(0, commaIdx);
        const body = data.substring(commaIdx + 1);
        if (header.includes('base64')) {
            try {
                const binStr = atob(body);
                const bytes = new Uint8Array(binStr.length);
                for (let i = 0; i < binStr.length; i++)
                    bytes[i] = binStr.charCodeAt(i);
                return new TextDecoder('utf-8').decode(bytes);
            }
            catch {
                return atob(body);
            }
        }
        else {
            try {
                return decodeURIComponent(body);
            }
            catch {
                return body;
            }
        }
    }
    return data;
}
async function openDrawioModal(svg, app, segId, diagramName, onSave) {
    closeDrawioModal();
    let rawContent = svg.getAttribute('content') || '';
    try {
        rawContent = decodeURIComponent(rawContent);
    }
    catch {
        // Already decoded
    }
    // Fallback if content was not directly embedded on the SVG attribute
    if (!rawContent) {
        try {
            const resp = await fetch(`./segPics/${diagramName}.drawio.svg`);
            if (resp.ok) {
                const text = await resp.text();
                const m = text.match(/content="([^"]+)"/i);
                if (m)
                    rawContent = decodeURIComponent(m[1]);
            }
        }
        catch { }
    }
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'drawio-modal-overlay';
    overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(4px);
    z-index: 99999;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    padding: 16px;
    animation: fadeIn 0.15s ease-out;
  `;
    // Header bar
    const header = document.createElement('div');
    header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #1e293b;
    color: #f8fafc;
    padding: 10px 16px;
    border-radius: 8px 8px 0 0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `;
    header.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-weight: 600; color: #38bdf8;">Draw.io Diagram Editor</span>
      <span style="color: #94a3b8;">•</span>
      <span style="color: #cbd5e1;">${diagramName} (${segId})</span>
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <span id="drawio-save-indicator" style="font-size: 12px; color: #94a3b8; transition: color 0.2s;">
        Click "Save and Exit" in Draw.io or "Embed Changes" to update
      </span>
      <button id="drawio-save-close-btn" style="
        background: #0284c7;
        border: none;
        color: #f8fafc;
        padding: 5px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 4px;
      ">💾 Embed Changes</button>
      <button id="drawio-paste-btn" style="
        background: #475569;
        border: none;
        color: #f8fafc;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      " title="Paste SVG exported or embedded from standalone Draw.io">📋 Paste SVG</button>
      <button id="drawio-close-btn" style="
        background: #334155;
        border: none;
        color: #f8fafc;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
      ">✕ Close</button>
    </div>
  `;
    // Draw.io embed iframe: noSaveBtn=1 replaces standard cloud Save with direct Embed/Apply
    const iframe = document.createElement('iframe');
    iframe.id = 'drawio-embed-frame';
    iframe.src = 'https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json&configure=1&noSaveBtn=1&saveAndExit=1&gapi=0&db=0&od=0&gh=0&gl=0&tr=0&picker=0&mode=device';
    iframe.style.cssText = `
    flex: 1;
    width: 100%;
    border: none;
    border-radius: 0 0 8px 8px;
    background: #ffffff;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  `;
    overlay.appendChild(header);
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    activeOverlay = overlay;
    let shouldCloseOnSave = false;
    const closeBtn = header.querySelector('#drawio-close-btn');
    closeBtn?.addEventListener('click', closeDrawioModal);
    const pasteBtn = header.querySelector('#drawio-paste-btn');
    pasteBtn?.addEventListener('click', async () => {
        const input = window.prompt('Paste the SVG code (from Draw.io File -> Embed -> SVG or Export As -> SVG):');
        if (input && input.trim()) {
            const decoded = decodeXmlSvgData(input.trim());
            if (decoded && decoded.includes('<svg')) {
                shouldCloseOnSave = true;
                await processAndSaveSvg(decoded);
            }
            else {
                alert('Invalid SVG content. Please ensure you copied the full <svg> code.');
            }
        }
    });
    const saveCloseBtn = header.querySelector('#drawio-save-close-btn');
    saveCloseBtn?.addEventListener('click', () => {
        shouldCloseOnSave = true;
        const indicator = header.querySelector('#drawio-save-indicator');
        if (indicator) {
            indicator.textContent = 'Embedding changes...';
            indicator.style.color = '#f59e0b';
        }
        iframe.contentWindow?.postMessage(JSON.stringify({
            action: 'export',
            format: 'xmlsvg',
            spinKey: 'saving'
        }), '*');
    });
    // Saves a decoded SVG with embedded diagram XML to DOM, session, and disk
    const processAndSaveSvg = async (svgXml) => {
        const indicator = header.querySelector('#drawio-save-indicator');
        if (indicator) {
            indicator.textContent = 'Saving diagram to disk...';
            indicator.style.color = '#f59e0b';
        }
        let finalSvg = svgXml.trim();
        // Strip any rogue onclick handlers exported by Draw.io
        finalSvg = finalSvg.replace(/\s*onclick="[^"]*"/gi, '');
        if (!finalSvg.includes(`data-diagram-name="${diagramName}"`)) {
            finalSvg = finalSvg.replace(/<svg\b/i, `<svg data-diagram-name="${diagramName}" `);
        }
        // Extract embedded XML model if present
        const contentMatch = finalSvg.match(/content="([^"]+)"/i);
        const updatedModelXml = contentMatch ? decodeURIComponent(contentMatch[1]) : '';
        // 1. Update in-situ DOM element immediately
        const parser = new DOMParser();
        const doc = parser.parseFromString(finalSvg, 'image/svg+xml');
        const newSvg = doc.querySelector('svg');
        if (newSvg && svg.parentElement) {
            newSvg.style.cssText = svg.style.cssText;
            newSvg.setAttribute('data-diagram-name', diagramName);
            newSvg.setAttribute('contenteditable', 'false');
            newSvg.style.cursor = 'pointer';
            newSvg.setAttribute('title', 'Double-click to edit diagram in Draw.io');
            svg.parentElement.replaceChild(newSvg, svg);
            svg = newSvg;
            rawContent = newSvg.getAttribute('content') || updatedModelXml;
        }
        // 2. Invoke sync callback if provided (updates Studio WYSIWYG editor textarea & dirty state)
        if (onSave) {
            try {
                onSave(diagramName, finalSvg);
            }
            catch (callbackErr) {
                console.warn('[drawioBridge] onSave callback error:', callbackErr);
            }
        }
        // 3. Post to backend server to save to diagrams/, segPics/, and segment HTML files
        try {
            const apiBase = getApiBaseUrl();
            const resp = await fetch(`${apiBase}/svgPostWithMeta`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app: app || 'app1',
                    segId,
                    diagramName,
                    svg: finalSvg,
                    xml: updatedModelXml,
                })
            });
            if (!resp.ok) {
                await SI.sendSVG(diagramName, finalSvg);
            }
            // Acknowledge save to Draw.io
            iframe.contentWindow?.postMessage(JSON.stringify({
                action: 'status',
                message: 'Saved successfully',
                modified: false,
            }), '*');
            if (indicator) {
                indicator.textContent = '✓ Saved successfully!';
                indicator.style.color = '#10b981';
                setTimeout(() => {
                    if (indicator) {
                        indicator.textContent = 'Ctrl+S or click "Save" in Draw.io to update';
                        indicator.style.color = '#94a3b8';
                    }
                }, 2500);
            }
            if (shouldCloseOnSave) {
                setTimeout(closeDrawioModal, 300);
            }
        }
        catch (err) {
            console.error('[drawioBridge] Save error:', err);
            try {
                await SI.sendSVG(diagramName, finalSvg);
            }
            catch { }
            if (indicator) {
                indicator.textContent = '⚠ Save failed (check server connection)';
                indicator.style.color = '#ef4444';
            }
        }
    };
    // Message handler for Draw.io embed protocol
    activeMessageListener = async (ev) => {
        if (ev.source !== iframe.contentWindow)
            return;
        let msg = null;
        try {
            msg = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        }
        catch {
            return;
        }
        if (!msg || !msg.event)
            return;
        if (msg.event === 'configure') {
            iframe.contentWindow?.postMessage(JSON.stringify({
                action: 'configure',
                config: {
                    defaultEdgeStyle: { edgeStyle: 'orthogonalEdgeStyle', rounded: 0, jettySize: 'auto', orthogonalLoop: 1 },
                    compressXml: false,
                }
            }), '*');
        }
        else if (msg.event === 'init') {
            // Send diagram XML to draw.io with explicit diagram title
            iframe.contentWindow?.postMessage(JSON.stringify({
                action: 'load',
                xml: rawContent,
                title: `${diagramName}.drawio`,
                autosave: 1,
            }), '*');
        }
        else if (msg.event === 'save') {
            // When Draw.io triggers 'save', request export in xmlsvg format to get full SVG + embedded XML
            const indicator = header.querySelector('#drawio-save-indicator');
            if (indicator) {
                indicator.textContent = 'Exporting diagram...';
                indicator.style.color = '#f59e0b';
            }
            if (msg.svg) {
                await processAndSaveSvg(msg.svg);
            }
            else {
                iframe.contentWindow?.postMessage(JSON.stringify({
                    action: 'export',
                    format: 'xmlsvg',
                    spinKey: 'saving'
                }), '*');
            }
        }
        else if (msg.event === 'export') {
            // Draw.io responded with exported diagram data (xmlsvg data URI)
            const rawData = msg.data || '';
            const decodedSvg = decodeXmlSvgData(rawData);
            if (decodedSvg) {
                await processAndSaveSvg(decodedSvg);
            }
        }
        else if (msg.event === 'exit') {
            closeDrawioModal();
        }
    };
    window.addEventListener('message', activeMessageListener);
}
export function closeDrawioModal() {
    if (activeMessageListener) {
        window.removeEventListener('message', activeMessageListener);
        activeMessageListener = null;
    }
    if (activeOverlay && activeOverlay.parentElement) {
        activeOverlay.parentElement.removeChild(activeOverlay);
        activeOverlay = null;
    }
}
