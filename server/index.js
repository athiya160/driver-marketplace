import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './apiRouter.js';
import {
  getCorsOriginValidator,
  securityHeadersMiddleware
} from './middleware/securityMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security hardening: Disable Express fingerprinting
app.disable('x-powered-by');

// Security hardening: Enterprise response headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
app.use(securityHeadersMiddleware);

// Security hardening: Production CORS allowlist
app.use(cors({
  origin: getCorsOriginValidator(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

// Security hardening: Request payload size limits (protects against memory exhaustion and DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API Endpoints
app.use('/api', apiRouter);

// Serve static assets & QR code preview files
app.use('/public', express.static(path.join(__dirname, '../public')));

// Serve production built frontend from dist
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Root healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Sarathi Driver Rental Backend API (Across India)',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for client-side routing (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start listening if run directly as process entrypoint
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server/index.js') || process.argv[1].endsWith('server\\index.js'));
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚗 SARATHI: DRIVER RENTAL BOOKING PLATFORM (INDIA)`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API Health Check: http://localhost:${PORT}/health`);
    console.log(`📱 QR Code Scanner & Preview: http://localhost:${PORT}/public/qr_preview.html`);
    console.log(`=======================================================`);
  });
}

export default app;
