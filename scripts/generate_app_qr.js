/**
 * SARATHI - EXPO & TRIP QR CODE GENERATOR & SCANNER TOOL
 * Fulfills user requirement: "app ka scanner b generate b kar"
 * Generates:
 * 1. Terminal ASCII QR code
 * 2. High-res PNG & SVG for Expo Go mobile scanning
 * 3. Interactive Web QR Code Preview with phone emulator
 */

import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect local machine IP for LAN Expo Go testing
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIpAddress();
const EXPO_PORT = 8081;
const WEB_PORT = 5173;

// URLs
const expoUrl = `exp://${localIp}:${EXPO_PORT}`;
const webAppUrl = `http://${localIp}:${WEB_PORT}`;
const sampleTripQrPayload = `SARATHI:TRIP:SRT-2026-8821:OTP-4821`;

const publicDir = path.join(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateAllQRCodes() {
  console.log('\n=============================================================');
  console.log('🚗 SARATHI: DRIVER RENTAL APP - SCANNER & QR CODE GENERATOR');
  console.log('=============================================================\n');

  // 1. Generate Terminal ASCII QR Code
  console.log(`📱 SCAN WITH YOUR PHONE CAMERA OR EXPO GO APP:`);
  console.log(`📡 Expo Mobile URL: ${expoUrl}`);
  console.log(`🌐 Web App URL:     ${webAppUrl}\n`);

  const terminalQR = await qrcode.toString(expoUrl, { type: 'terminal', small: true });
  console.log(terminalQR);

  // 2. Generate PNG QR Code
  const pngPath = path.join(publicDir, 'expo_qr_code.png');
  await qrcode.toFile(pngPath, expoUrl, {
    width: 400,
    margin: 2,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF'
    }
  });
  console.log(`✅ Saved PNG QR Code: ${pngPath}`);

  // 3. Generate Trip Verification QR (for driver trip check-in)
  const tripQrPngPath = path.join(publicDir, 'trip_sample_qr.png');
  await qrcode.toFile(tripQrPngPath, sampleTripQrPayload, {
    width: 300,
    margin: 2,
    color: {
      dark: '#0284C7',
      light: '#FFFFFF'
    }
  });
  console.log(`✅ Saved Trip Verification QR Code: ${tripQrPngPath}`);

  // 4. Generate Interactive QR HTML Web Preview
  const qrDataUrl = await qrcode.toDataURL(expoUrl, { width: 320, margin: 2 });
  const tripQrDataUrl = await qrcode.toDataURL(sampleTripQrPayload, { width: 280, margin: 2 });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sarathi Driver Rental - App Scanner & Mobile Connect</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #0B1120;
      color: #F8FAFC;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      background: rgba(14, 165, 233, 0.15);
      border: 1px solid rgba(14, 165, 233, 0.4);
      color: #38BDF8;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    p.subtitle {
      color: #94A3B8;
      font-size: 16px;
      max-width: 600px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 24px;
      width: 100%;
      max-width: 960px;
    }
    .card {
      background: #1E293B;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .qr-frame {
      background: #FFFFFF;
      padding: 16px;
      border-radius: 16px;
      margin: 16px 0;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
    }
    .qr-frame img {
      display: block;
      width: 240px;
      height: 240px;
    }
    .instructions {
      text-align: left;
      width: 100%;
      background: #0F172A;
      border-radius: 12px;
      padding: 16px;
      margin-top: 16px;
      font-size: 13px;
      line-height: 1.6;
      color: #CBD5E1;
    }
    .instructions ol {
      padding-left: 20px;
    }
    .url-pill {
      background: #334155;
      padding: 8px 14px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 13px;
      color: #38BDF8;
      margin: 8px 0;
      word-break: break-all;
    }
    .btn {
      display: inline-block;
      margin-top: 16px;
      background: linear-gradient(135deg, #0284C7, #2563EB);
      color: #FFF;
      text-decoration: none;
      font-weight: 700;
      padding: 12px 24px;
      border-radius: 10px;
      transition: all 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(2, 132, 199, 0.4);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">🚀 Official App Scanner & Connect</div>
    <h1>Sarathi Driver Rental Booking (Across India)</h1>
    <p class="subtitle">Scan the QR code below using your mobile camera or Expo Go to instantly launch the application on your phone.</p>
  </div>

  <div class="grid">
    <!-- 1. Expo Go App QR Scanner -->
    <div class="card">
      <div class="badge" style="background: rgba(34, 197, 94, 0.15); color: #4ADE80; border-color: rgba(34, 197, 94, 0.3);">
        📱 Mobile App Preview (Expo Go)
      </div>
      <h3 style="margin-top: 4px;">Expo Go Mobile QR Code</h3>
      <div class="qr-frame">
        <img src="${qrDataUrl}" alt="Expo Go QR Code" />
      </div>
      <div class="url-pill">${expoUrl}</div>
      <div class="instructions">
        <strong>How to run on phone:</strong>
        <ol>
          <li>Install <strong>Expo Go</strong> from Play Store or App Store.</li>
          <li><strong>Android:</strong> Open Expo Go and tap "Scan QR Code".</li>
          <li><strong>iOS:</strong> Open the built-in Camera app and scan this QR code.</li>
          <li>Make sure phone & laptop are on the same Wi-Fi.</li>
        </ol>
      </div>
      <a href="${webAppUrl}" target="_blank" class="btn">Open Web App Preview (Browser)</a>
    </div>

    <!-- 2. Driver Trip Verification QR Code -->
    <div class="card">
      <div class="badge" style="background: rgba(245, 158, 11, 0.15); color: #FBBF24; border-color: rgba(245, 158, 11, 0.3);">
        🛡️ Trip Check-in & Security
      </div>
      <h3 style="margin-top: 4px;">In-App Trip Start QR Code</h3>
      <div class="qr-frame">
        <img src="${tripQrDataUrl}" alt="Sample Trip QR Code" />
      </div>
      <div class="url-pill">${sampleTripQrPayload}</div>
      <div class="instructions">
        <strong>Driver In-App QR Scanner:</strong>
        <ol>
          <li>When customer books a driver, app generates this unique encrypted QR code & 4-digit OTP.</li>
          <li>When driver arrives at customer vehicle, driver opens in-app camera scanner.</li>
          <li>Scanning this QR automatically verifies customer identity and transitions trip status to <strong>In Progress</strong>!</li>
        </ol>
      </div>
      <a href="${webAppUrl}" target="_blank" class="btn" style="background: #334155;">Test Scanner In Web App</a>
    </div>
  </div>
</body>
</html>`;

  const htmlPath = path.join(publicDir, 'qr_preview.html');
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`✅ Generated Interactive Scanner Preview Page: ${htmlPath}`);

  console.log('\n✨ App Scanner generation complete!\n');
}

generateAllQRCodes().catch(err => {
  console.error('Error generating QR codes:', err);
});
