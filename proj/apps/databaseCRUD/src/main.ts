// crud/src/main.ts

import { initializeApp } from './init';
/**
 * The main application function.
 */
async function main() {
    const statusMessage = document.getElementById('status-message') as HTMLParagraphElement;

    try {
        statusMessage.textContent = 'Initializing...';
        await initializeApp();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        statusMessage.textContent = `FATAL: ${errorMessage}`;
        statusMessage.className = 'status-error';
        console.error('Application failed to initialize:', error);
    }
}
document.addEventListener('DOMContentLoaded', main);
