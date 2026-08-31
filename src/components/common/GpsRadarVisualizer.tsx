import React from 'react';
import { Branch } from '../../types';
import { GeoCoordinates, GpsValidationResult } from '../../utils/geolocation';
import { 
  MapPin, 
  Navigation, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Radio,
  Crosshair,
  Sliders
} from 'lucide-react';

interface GpsRadarVisualizerProps {
  branch: Branch;
  userCoords: GeoCoordinates | null;
  validation: GpsValidationResult;
  isLoading: boolean;
  onRefreshGps: () => void;
  isSimulatedMode?: boolean;
  onToggleSimulatedDistance?: (distanceMeters: number | null) => void;
}

export const GpsRadarVisualizer: React.FC<GpsRadarVisualizerProps> = ({
  branch,
  userCoords,
  validation,
  isLoading,
  onRefreshGps,
  isSimulatedMode = false,
  onToggleSimulatedDistance,
}) => {
  const radius = branch.radiusMeters || 50;
  const distance = validation.distanceMeters;
  const isInside = validation.isValid;

  // Calculate percentage offset for visual radar dot position (0% = center, 100% = perimeter at radius)
  const ratio = Math.min(distance / radius, 2.2);
  const visualDotOffsetPercent = Math.min(ratio * 45, 90); // max 90% from center

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
      isInside 
        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' 
        : 'bg-rose-50/70 border-rose-300 shadow-xs'
    }`}>
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-xl ${isInside ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
            <Navigation className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Định Vị Vệ Tinh GPS (Bán Kính Quán)</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isInside ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
              }`}>
                {isInside ? '✓ Đúng Trong Quán' : '✗ Ngoài Bán Kính'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Chi nhánh: <strong className="text-slate-800">{branch.name}</strong>
            </div>
          </div>
        </div>

        {/* Refresh GPS Button */}
        <button
          type="button"
          onClick={onRefreshGps}
          disabled={isLoading}
          title="Quét lại toạ độ GPS vệ tinh"
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Quét lại GPS</span>
        </button>
      </div>

      {/* Main Distance Display & Radar Simulation Canvas */}
      <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
        {/* Left: Visual Radar Circle */}
        <div className="sm:col-span-4 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-emerald-400 bg-white/80 flex items-center justify-center shadow-inner overflow-hidden">
            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 rounded-full bg-radial from-emerald-500/10 to-transparent animate-pulse" />
            
            {/* Safe Radius Area Circle */}
            <div className="absolute w-20 h-20 rounded-full bg-emerald-100/50 border border-emerald-300" />

            {/* Branch Store Center Pin */}
            <div className="relative z-10 flex flex-col items-center" title={`Tọa độ quán: ${branch.latitude || 10.77428}, ${branch.longitude || 106.70395}`}>
              <MapPin className="w-5 h-5 text-emerald-600 drop-shadow" />
              <span className="text-[8px] font-black text-emerald-900 bg-emerald-200 px-1 rounded">QUÁN</span>
            </div>

            {/* Employee User GPS Dot */}
            {userCoords && (
              <div
                className="absolute z-20 transition-all duration-500 flex flex-col items-center"
                style={{
                  transform: `translate(${isInside ? visualDotOffsetPercent * 0.35 : visualDotOffsetPercent * 0.6}px, ${
                    isInside ? -visualDotOffsetPercent * 0.25 : -visualDotOffsetPercent * 0.5
                  }px)`,
                }}
              >
                <span className={`relative flex h-3.5 w-3.5`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isInside ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${
                    isInside ? 'bg-emerald-600 shadow-emerald-400 shadow-md' : 'bg-rose-600 shadow-rose-400 shadow-md'
                  }`} />
                </span>
                <span className={`text-[7.5px] font-black px-1 rounded shadow-2xs whitespace-nowrap ${
                  isInside ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
                }`}>
                  BẠN ({distance}m)
                </span>
              </div>
            )}
          </div>
          <span className="text-[9.5px] text-slate-500 mt-1 font-medium">Bán kính cho phép: {radius}m</span>
        </div>

        {/* Right: Distance Numbers & Geolocation Info */}
        <div className="sm:col-span-8 space-y-2">
          {/* Big Distance Badge */}
          <div className="flex items-baseline space-x-2">
            <span className="text-xs text-slate-600 font-bold">Khoảng cách thực tế:</span>
            <span className={`text-2xl font-black font-mono ${
              isInside ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {distance} mét
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / Giới hạn {radius}m
            </span>
          </div>

          {/* Status description */}
          <div className={`text-xs font-semibold rounded-xl p-2.5 border flex items-start space-x-2 ${
            isInside 
              ? 'bg-emerald-100/70 border-emerald-300 text-emerald-900' 
              : 'bg-rose-100/70 border-rose-300 text-rose-900'
          }`}>
            {isInside ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-[11.5px] leading-relaxed">
              {validation.statusText}
            </div>
          </div>

          {/* Coordinates meta */}
          <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono text-slate-600 pt-0.5">
            <div className="bg-white/90 p-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">Toạ độ GPS của bạn:</span>
              <strong className="text-slate-800">
                {userCoords ? `${userCoords.latitude.toFixed(5)}, ${userCoords.longitude.toFixed(5)}` : 'Đang lấy...'}
              </strong>
            </div>
            <div className="bg-white/90 p-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[9px] font-sans">Sai số GPS vệ tinh:</span>
              <strong className="text-slate-800">
                {userCoords?.accuracy ? `±${userCoords.accuracy} mét` : '±10m'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Demo & Testing Toolbar for Quick Testing */}
      {onToggleSimulatedDistance && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span>Chế độ kiểm thử nhanh:</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => onToggleSimulatedDistance(15)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                isSimulatedMode && distance <= radius
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
              }`}
            >
              🎯 Tại quán (15m - Đạt)
            </button>
            <button
              type="button"
              onClick={() => onToggleSimulatedDistance(125)}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold border transition-all cursor-pointer ${
                isSimulatedMode && distance > radius
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
              }`}
            >
              📍 Xa quán (125m - Lỗi)
            </button>
            {isSimulatedMode && (
              <button
                type="button"
                onClick={() => onToggleSimulatedDistance(null)}
                className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-all cursor-pointer"
              >
                Về GPS Thật
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
