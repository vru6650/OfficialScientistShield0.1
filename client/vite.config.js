import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                secure: false,
            },
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;

                    if (id.includes('@tiptap')) return 'vendor-tiptap';
                    if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'vendor-monaco';
                    if (id.includes('pdfjs-dist')) return 'vendor-pdf';
                    if (id.includes('tsparticles')) return 'vendor-tsparticles';
                    if (id.includes('recharts')) return 'vendor-charts';
                    if (id.includes('@tanstack')) return 'vendor-react-query';
                    if (id.includes('flowbite')) return 'vendor-flowbite';
                    if (id.includes('@mui')) return 'vendor-mui';
                    if (id.includes('framer-motion')) return 'vendor-motion';
                    if (id.includes('react-router')) return 'vendor-router';
                    if (id.includes('react-dom') || id.includes('react')) return 'vendor-react';
                    return 'vendor';
                },
            },
        },
    },
    plugins: [react()],
});
