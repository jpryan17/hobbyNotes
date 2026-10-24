// crud/src/main.ts
// Entry point for the Middle Way Mathematics Database CRUD Studio.

import { validateAndBuildMetadata } from './validation.js';
import { initializeUI } from './ui.js';
import { navigations, dependents } from './crudConfig.js';
import { getDatabaseHealth, queryDatabase } from '../../clientLib/db/api.js';
import { syncMenuTreeFromDatabase } from './menuTree.js';

let isBootstrapping = false;

async function bootstrap() {
    if (isBootstrapping) return;
    isBootstrapping = true;

    const healthBadge = document.getElementById('db-health-badge');
    const statusMessage = document.getElementById('status-message');
    const displayPanel = document.getElementById('display-panel');

    const MAX_RETRIES = 5;
    const RETRY_INTERVAL_MS = 600;
    let lastError: any = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (statusMessage) {
                statusMessage.textContent = attempt === 1
                    ? 'Connecting to database & loading schema...'
                    : `Connecting to database (attempt ${attempt}/${MAX_RETRIES})...`;
                statusMessage.style.color = '#718096';
            }

            // 1. Health check probe
            try {
                const health = await getDatabaseHealth();
                if (health.status === 'connected') {
                    if (healthBadge) {
                        healthBadge.textContent = '🟢 DB Connected';
                        healthBadge.style.background = '#ecfdf5';
                        healthBadge.style.borderColor = '#a7f3d0';
                        healthBadge.style.color = '#065f46';
                    }
                } else {
                    if (healthBadge) {
                        healthBadge.textContent = '🟡 DB Disconnected';
                        healthBadge.style.background = '#fffbeb';
                        healthBadge.style.borderColor = '#fde68a';
                        healthBadge.style.color = '#92400e';
                    }
                }
            } catch (healthErr) {
                console.warn('[main] Database health probe non-critical warning:', healthErr);
                if (healthBadge) {
                    healthBadge.textContent = '🟡 DB Connecting...';
                    healthBadge.style.background = '#fffbeb';
                    healthBadge.style.borderColor = '#fde68a';
                    healthBadge.style.color = '#92400e';
                }
            }

            // 2. Build and validate runtime metadata against PostgreSQL
            const metadata = await validateAndBuildMetadata();

            // 2b. Synchronize live navigation menu instances directly from PostgreSQL
            await syncMenuTreeFromDatabase(queryDatabase);

            // 3. Initialize the universal UI engine
            initializeUI(metadata, navigations, dependents);

            if (statusMessage) {
                statusMessage.textContent = 'Ready';
                statusMessage.style.color = '#4a5568';
            }

            console.log('[main] MWM Database CRUD Studio successfully initialized.');
            isBootstrapping = false;
            return;
        } catch (err) {
            lastError = err;
            console.warn(`[main] Connection attempt ${attempt}/${MAX_RETRIES} failed:`, err);
            if (attempt < MAX_RETRIES) {
                await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
            }
        }
    }

    isBootstrapping = false;
    console.error('[main] Fatal error initializing MWM Database CRUD Studio after retries:', lastError);
    const errorMsg = (lastError as Error)?.message || String(lastError);

    if (healthBadge) {
        healthBadge.textContent = '🔴 Connection Error';
        healthBadge.style.background = '#fef2f2';
        healthBadge.style.borderColor = '#fecaca';
        healthBadge.style.color = '#991b1b';
    }

    if (statusMessage) {
        statusMessage.textContent = 'Initialization failed.';
        statusMessage.style.color = '#dc2626';
    }

    if (displayPanel) {
        displayPanel.innerHTML = `
            <div style="padding: 24px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px;">
                <h3 style="color: #c53030; margin-bottom: 8px;">⚠️ Schema / Connection Issue</h3>
                <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
                    The CRUD studio could not initialize because of a schema mismatch or database connectivity issue:
                </p>
                <pre style="background: #2d3748; color: #fc8181; padding: 12px; border-radius: 6px; font-size: 13px; overflow-x: auto; white-space: pre-wrap;">${errorMsg}</pre>
                <div style="margin-top: 16px; display: flex; gap: 12px; align-items: center;">
                    <button id="retry-bootstrap-btn" style="padding: 8px 16px; background: #3182ce; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;">
                        🔄 Retry Connection
                    </button>
                    <span style="font-size: 13px; color: #718096;">
                        Please ensure PostgreSQL is running and port 3000 is reachable.
                    </span>
                </div>
            </div>
        `;
        document.getElementById('retry-bootstrap-btn')?.addEventListener('click', () => {
            bootstrap();
        });
    }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
