import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import express from 'express';
import { apiRouter } from './server/apiRouter.js';

// Dev Server Plugin: mounts Express API router inside Vite
function sarathiApiPlugin() {
  const apiApp = express();
  apiApp.use(express.json());
  apiApp.use(apiRouter);

  return {
    name: 'sarathi-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/api')) {
          const originalUrl = req.url;
          req.url = req.url.replace(/^\/api/, '') || '/';
          return apiApp(req, res, (err) => {
            req.url = originalUrl;
            next(err);
          });
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), sarathiApiPlugin()],
  server: {
    port: 5173,
    host: true
  }
});
