import { defineConfig } from 'vite';

export default defineConfig({
    // NEW: Tell Vite where the public directory is now located.
    // The path is relative to this config file.
    publicDir: '../server/public',

    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
