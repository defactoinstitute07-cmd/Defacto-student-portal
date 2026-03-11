import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        const parts = id.split('node_modules/')[1]?.split('/') || [];
                        let pkg = parts[0] || 'vendor';
                        if (pkg.startsWith('@') && parts.length > 1) {
                            pkg = `${pkg}_${parts[1]}`;
                        }

                        if (pkg.includes('react') || pkg.includes('@remix-run') || pkg.includes('history') || pkg.includes('scheduler') || pkg.includes('use-sync-external-store')) {
                            return 'vendor_react';
                        }
                        if (pkg.includes('chart.js') || pkg.includes('react-chartjs-2')) return 'vendor_charts';
                        if (pkg.includes('jspdf')) return 'vendor_pdf';

                        return `vendor_${pkg.replace('@', '').replace(/[^a-zA-Z0-9_]/g, '_')}`;
                    }
                }
            }
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5005',
                changeOrigin: true,
            },
            '/uploads': {
                target: 'http://localhost:5005',
                changeOrigin: true,
            }
        }
    }
})
