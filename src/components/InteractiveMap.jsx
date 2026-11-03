import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Car, Layers, Compass, ZoomIn, ZoomOut, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function InteractiveMap({
  pickupAddress = 'DLF The Crest, Sector 54, Gurugram',
  dropAddress = 'Ambience Mall, NH-8, Gurugram',
  driverName = 'Rajesh Kumar',
  driverPhoto = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  isLiveTracking = false,
  isOffRoute = false,
  onPickupChange = null,
  onPinDrop = null,
  routePolyline = null,
  height = '260px'
}) {
  const [carProgress, setCarProgress] = useState(0.35); // 0 (pickup) to 1.0 (drop)
  const [mapType, setMapType] = useState('dark'); // 'dark' or 'satellite'
  const [isInsideGeofence, setIsInsideGeofence] = useState(false);
  const [activePin, setActivePin] = useState(null); // 'pickup' | 'drop'

  // Smooth car animation along polyline if live tracking
  useEffect(() => {
    let interval = null;
    if (isLiveTracking) {
      interval = setInterval(() => {
        setCarProgress(prev => {
          const next = prev >= 0.95 ? 0.1 : prev + 0.015;
          if (next <= 0.20 || next >= 0.90) {
            setIsInsideGeofence(true);
          } else {
            setIsInsideGeofence(false);
          }
          return next;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLiveTracking]);

  // SVG road polyline coordinates
  const p0 = { x: 70, y: 185 };
  const p1 = { x: 155, y: 135 };
  const p2 = { x: 245, y: 100 };
  const p3 = { x: 335, y: 55 };

  // Interpolate position along polyline
  const getCarCoordinates = (t) => {
    if (t <= 0.33) {
      const subT = t / 0.33;
      return { x: p0.x + (p1.x - p0.x) * subT, y: p0.y + (p1.y - p0.y) * subT, heading: 45 };
    } else if (t <= 0.66) {
      const subT = (t - 0.33) / 0.33;
      return { x: p1.x + (p2.x - p1.x) * subT, y: p1.y + (p2.y - p1.y) * subT, heading: 60 };
    } else {
      const subT = (t - 0.66) / 0.34;
      return { x: p2.x + (p3.x - p2.x) * subT, y: p2.y + (p3.y - p2.y) * subT, heading: 75 };
    }
  };

  const carPos = getCarCoordinates(carProgress);

  const handleMapClick = (e) => {
    if (!onPinDrop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Map normalized coordinates to Indian metro bounding coordinates
    const normX = clickX / rect.width;
    const normY = clickY / rect.height;

    // Approximate Bengaluru lat/lon for demo pin drop
    const droppedLat = 12.9800 - normY * 0.0800;
    const droppedLon = 77.5800 + normX * 0.1200;

    onPinDrop({
      latitude: Number(droppedLat.toFixed(5)),
      longitude: Number(droppedLon.toFixed(5)),
      type: activePin || 'pickup'
    });
  };

  return (
    <div
      onClick={handleMapClick}
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl transition-all cursor-crosshair ${
        mapType === 'satellite' ? 'bg-slate-900' : 'bg-[#0b1329]'
      }`}
      style={{ height }}
    >
      {/* Map Vector Canvas (Simulated Indian Road Corridor Grid) */}
      <svg className="w-full h-full absolute inset-0 select-none" viewBox="0 0 400 240">
        <defs>
          <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
          </pattern>
          <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Map Background Grid */}
        <rect width="100%" height="100%" fill="url(#roadGrid)" />

        {/* Arterial Highways (NH-48 / Ring Road / Expressways) */}
        <path d="M 20 220 Q 150 180 380 40" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="16" fill="none" />
        <path d="M 10 90 Q 200 120 390 160" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="10" fill="none" />
        <path d="M 160 10 L 170 230" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="8" fill="none" />
        <path d="M 270 10 L 260 230" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="8" fill="none" />

        {/* Area Landmarks */}
        <text x="35" y="215" fill="rgba(148, 163, 184, 0.45)" fontSize="9" fontWeight="bold">SEC-54 GOLF COURSE / MG RD</text>
        <text x="180" y="32" fill="rgba(148, 163, 184, 0.45)" fontSize="9" fontWeight="bold">NH-48 EXPRESSWAY</text>
        <text x="270" y="225" fill="rgba(148, 163, 184, 0.45)" fontSize="9" fontWeight="bold">AMBIENCE MALL / TECH PARK</text>

        {/* 150m Arrival Geofence Boundary (Pulsing around Pickup) */}
        <g transform={`translate(${p0.x}, ${p0.y})`}>
          <circle r="36" fill="rgba(16, 185, 129, 0.12)" stroke="#10B981" strokeWidth="1.5" strokeDasharray="4, 4" className="animate-pulse" />
          <text x="-24" y="-40" fill="#10B981" fontSize="7" fontWeight="bold">150m Geofence</text>
        </g>

        {/* Active Road Route Polyline */}
        <path
          d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`}
          stroke="url(#routeGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="drop-shadow-md"
        />

        {/* Animated Dashed Flow Line */}
        <path
          d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`}
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="6, 6"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />

        {/* Pickup Pin Marker */}
        <g transform={`translate(${p0.x}, ${p0.y})`}>
          <circle r="12" fill="#10B981" opacity="0.25" className="animate-ping" />
          <circle r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          <circle r="2.5" fill="#FFFFFF" />
        </g>

        {/* Drop Destination Pin Marker */}
        <g transform={`translate(${p3.x}, ${p3.y})`}>
          <circle r="10" fill="#EF4444" opacity="0.2" />
          <circle r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
          <circle r="2.5" fill="#FFFFFF" />
        </g>

        {/* Live Moving Driver Car Marker with Bearing Indicator */}
        <g transform={`translate(${carPos.x}, ${carPos.y})`} className="transition-all duration-700">
          <circle r="15" fill="#0EA5E9" opacity="0.35" className="animate-pulse" />
          <circle r="9" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
          <text x="-4.5" y="3.5" fontSize="9" fill="#FFFFFF" fontWeight="bold">🚗</text>
        </g>
      </svg>

      {/* Floating HUD Badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Live Tracking & Geofence Status */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[10px] font-extrabold text-white shadow-lg">
          <span className={`w-2 h-2 rounded-full ${isInsideGeofence ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-ping'}`}></span>
          <span>
            {isOffRoute ? '⚠️ Off-Route • Recalculating' : isInsideGeofence ? 'Arrived in 150m Geofence' : isLiveTracking ? 'Live Road Navigation • 38 km/h' : 'Road Route (Google Maps / Graph)'}
          </span>
        </div>

        {/* Layer Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 text-[10px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMapType(mapType === 'dark' ? 'satellite' : 'dark');
            }}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
            title="Toggle Map Style"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Bottom HUD Card */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-auto bg-slate-950/90 backdrop-blur-md p-2 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
            📍
          </div>
          <div className="truncate">
            <p className="font-extrabold text-[11px] text-white truncate">{pickupAddress}</p>
            <p className="text-[9px] text-slate-400 truncate">Drop: {dropAddress}</p>
          </div>
        </div>

        <div className="shrink-0 text-right pl-2 border-l border-slate-800">
          <span className="text-[9px] text-slate-500 uppercase font-bold block">Road ETA</span>
          <span className="font-mono font-extrabold text-xs text-brand-400">
            {isInsideGeofence ? 'Arrived' : '8 Mins (Road)'}
          </span>
        </div>
      </div>
    </div>
  );
}
