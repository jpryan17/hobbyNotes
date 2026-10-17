// crud/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    // The `publicDir` line has been removed.
    // Vite will now correctly use `crud/index.html` as the entry point.

    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
