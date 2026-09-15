import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import express from 'express';
import conversionsHandler from './api/meta/conversions.js';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss(), {
      name: 'local-meta-conversions',
      configureServer(server) {
        const env = loadEnv(mode, process.cwd(), 'META_');
        for (const [key, value] of Object.entries(env)) process.env[key] ??= value;
        const api = express();
        api.post('/api/meta/conversions', express.json({ limit: '64kb' }), conversionsHandler);
        server.middlewares.use(api);
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
