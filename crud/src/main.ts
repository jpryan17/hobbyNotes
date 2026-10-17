// crud/src/main.ts
// Entry point for the Middle Way Mathematics Database CRUD Studio.

import { validateAndBuildMetadata } from './validation.js';
import { initializeUI } from './ui.js';
import { navigations, dependents } from './crudConfig.js';
import { getDatabaseHealth } from '../../clientLib/db/api.js';

async function bootstrap() {
    const healthBadge = document.getElementById('db-health-badge');
    const statusMessage = document.getElementById('status-message');
    const displayPanel = document.getElementById('display-panel');

    try {
        if (statusMessage) statusMessage.textContent = 'Checking database connection...';

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
                healthBadge.textContent = '🟡 DB Probe Failed';
                healthBadge.style.background = '#fffbeb';
                healthBadge.style.borderColor = '#fde68a';
                healthBadge.style.color = '#92400e';
            }
        }

        // 2. Build and validate runtime metadata against PostgreSQL
        if (statusMessage) statusMessage.textContent = 'Validating schema & loading metadata...';
        const metadata = await validateAndBuildMetadata();

        // 3. Initialize the universal UI engine
        initializeUI(metadata, navigations, dependents);

        console.log('[main] MWM Database CRUD Studio successfully initialized.');
    } catch (err) {
        console.error('[main] Fatal error initializing MWM Database CRUD Studio:', err);
        const errorMsg = (err as Error).message || String(err);

        if (healthBadge) {
            healthBadge.textContent = '🔴 Schema Error';
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
                    <h3 style="color: #c53030; margin-bottom: 8px;">⚠️ Schema Validation Failed</h3>
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
                        The CRUD studio could not initialize because of a schema mismatch or database connectivity issue:
                    </p>
                    <pre style="background: #2d3748; color: #fc8181; padding: 12px; border-radius: 6px; font-size: 13px; overflow-x: auto; white-space: pre-wrap;">${errorMsg}</pre>
                    <p style="margin-top: 14px; font-size: 13px; color: #718096;">
                        Please ensure PostgreSQL is running and migrations have been executed.
                    </p>
                </div>
            `;
        }
    }
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
