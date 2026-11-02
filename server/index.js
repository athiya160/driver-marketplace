import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './apiRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
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
