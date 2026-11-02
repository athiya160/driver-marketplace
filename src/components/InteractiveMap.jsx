import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Car, Layers, Compass, ZoomIn, ZoomOut, CheckCircle2 } from 'lucide-react';

export default function InteractiveMap({
  pickupAddress = 'DLF The Crest, Sector 54, Gurugram',
  dropAddress = 'Ambience Mall, NH-8, Gurugram',
  driverName = 'Rajesh Kumar',
  driverPhoto = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  isLiveTracking = false,
  onPickupChange = null,
  height = '240px'
}) {
  const [carProgress, setCarProgress] = useState(0.35); // 0 (pickup) to 1.0 (drop)
  const [mapType, setMapType] = useState('dark'); // 'dark' or 'satellite'
  const [userInteracting, setUserInteracting] = useState(false);

  // Smooth car animation along polyline if live tracking
  useEffect(() => {
    let interval = null;
    if (isLiveTracking) {
      interval = setInterval(() => {
        setCarProgress(prev => (prev >= 0.95 ? 0.1 : prev + 0.02));
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isLiveTracking]);

  // Coordinate math for SVG path
  // Pickup: (80, 180), Waypoint 1: (180, 140), Waypoint 2: (260, 90), Drop: (340, 50)
  const p0 = { x: 70, y: 175 };
  const p1 = { x: 160, y: 130 };
  const p2 = { x: 250, y: 95 };
  const p3 = { x: 330, y: 55 };

  // Interpolate position along polyline
  const getCarCoordinates = (t) => {
    if (t <= 0.33) {
      const subT = t / 0.33;
      return { x: p0.x + (p1.x - p0.x) * subT, y: p0.y + (p1.y - p0.y) * subT };
    } else if (t <= 0.66) {
      const subT = (t - 0.33) / 0.33;
      return { x: p1.x + (p2.x - p1.x) * subT, y: p1.y + (p2.y - p1.y) * subT };
    } else {
      const subT = (t - 0.66) / 0.34;
      return { x: p2.x + (p3.x - p2.x) * subT, y: p2.y + (p3.y - p2.y) * subT };
    }
  };

  const carPos = getCarCoordinates(carProgress);

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl transition-all ${
        mapType === 'satellite' ? 'bg-slate-900' : 'bg-[#0b1329]'
      }`}
      style={{ height }}
    >
      {/* Map Vector Canvas (Simulated Indian City Grid: Golf Course Rd & NH-8) */}
      <svg className="w-full h-full absolute inset-0 select-none" viewBox="0 0 400 240">
        <defs>
          {/* Subtle Grid Pattern for Roads */}
          <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
          </pattern>
          {/* Linear gradient for Route Highway */}
          <linearGradient id="routeGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#0EA5E9" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Map Background Grid */}
        <rect width="100%" height="100%" fill="url(#roadGrid)" />

        {/* Arterial Highways (NH-8, MG Road, Golf Course Extension) */}
        <path d="M 20 220 Q 150 180 380 40" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="14" fill="none" />
        <path d="M 10 90 Q 200 120 390 160" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="10" fill="none" />
        <path d="M 160 10 L 170 230" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="8" fill="none" />
        <path d="M 270 10 L 260 230" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="8" fill="none" />

        {/* Area Landmarks Text */}
        <text x="35" y="210" fill="rgba(148, 163, 184, 0.4)" fontSize="9" fontWeight="bold">SEC-54 GOLF COURSE</text>
        <text x="180" y="35" fill="rgba(148, 163, 184, 0.4)" fontSize="9" fontWeight="bold">CYBER HUB / NH-48</text>
        <text x="270" y="220" fill="rgba(148, 163, 184, 0.4)" fontSize="9" fontWeight="bold">AMBIENCE MALL</text>

        {/* Active GPS Route Polyline */}
        <path
          d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`}
          stroke="url(#routeGradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="drop-shadow-md"
        />
        {/* Animated Dashed Pulse Line */}
        <path
          d={`M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y}`}
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="6, 6"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />

        {/* Pickup Pin Marker (Green) */}
        <g transform={`translate(${p0.x}, ${p0.y})`}>
          <circle r="12" fill="#10B981" opacity="0.25" className="animate-ping" />
          <circle r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
          <circle r="2.5" fill="#FFFFFF" />
        </g>

        {/* Drop Destination Pin Marker (Amber/Red) */}
        <g transform={`translate(${p3.x}, ${p3.y})`}>
          <circle r="10" fill="#EF4444" opacity="0.2" />
          <circle r="7" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
          <circle r="2.5" fill="#FFFFFF" />
        </g>

        {/* Live Moving Driver Car Marker */}
        <g transform={`translate(${carPos.x}, ${carPos.y})`} className="transition-all duration-700">
          <circle r="14" fill="#0EA5E9" opacity="0.3" className="animate-pulse" />
          <circle r="9" fill="#0284C7" stroke="#FFFFFF" strokeWidth="2" />
          <text x="-4" y="3.5" fontSize="8" fill="#FFFFFF" fontWeight="bold">🚗</text>
        </g>
      </svg>

      {/* Floating Map HUD Overlays */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Live Tracking Status Badge */}
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[10px] font-extrabold text-white shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{isLiveTracking ? 'Live GPS Navigation • 42 km/h' : 'Map Route Overview'}</span>
        </div>

        {/* Map Style Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 text-[10px]">
          <button
            onClick={() => setMapType(mapType === 'dark' ? 'satellite' : 'dark')}
            className="p-1 rounded-lg text-slate-300 hover:text-white"
            title="Toggle Map Style"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Bottom Live Route Cards */}
      <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-auto bg-slate-950/85 backdrop-blur-md p-2 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
            📍
          </div>
          <div className="truncate">
            <p className="font-extrabold text-[11px] text-white truncate">{pickupAddress}</p>
            <p className="text-[9px] text-slate-400 truncate">Drop: {dropAddress}</p>
          </div>
        </div>

        {isLiveTracking && (
          <div className="shrink-0 text-right pl-2 border-l border-slate-800">
            <span className="text-[9px] text-slate-500 uppercase font-bold block">Chauffeur ETA</span>
            <span className="font-mono font-extrabold text-xs text-brand-400">4 Mins Away</span>
          </div>
        )}
      </div>
    </div>
  );
}
