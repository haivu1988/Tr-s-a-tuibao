import React, { useState, useEffect } from 'react';
import { Branch, User } from '../../types';
import { 
  X, 
  MapPin, 
  Smartphone, 
  RotateCcw, 
  Check, 
  Building2, 
  AlertCircle,
  ExternalLink,
  Navigation,
  Compass,
  LocateFixed,
  ShieldCheck,
  Radio,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { 
  getCurrentDeviceGpsPosition, 
  calculateDistanceMeters, 
  GeoCoordinates 
} from '../../utils/geolocation';

interface GpsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onSaveBranch: (branch: Branch) => void;
  staffList: User[];
  onResetDevice: (userId: string) => void;
}

export const GpsSettingsModal: React.FC<GpsSettingsModalProps> = ({
  isOpen,
  onClose,
  branches = [],
  activeBranchId,
  onSelectBranch,
  onSaveBranch,
  staffList = [],
  onResetDevice,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>(activeBranchId);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [currentDeviceGps, setCurrentDeviceGps] = useState<GeoCoordinates | null>(null);

  // Form states for the selected branch
  const currentBranch = branches?.find((b) => b.id === selectedBranchId) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)',
    shortName: 'Quận 1',
    address: '128 Nguyễn Huệ, Quận 1',
    latitude: 10.77428,
    longitude: 106.70395,
    radiusMeters: 50,
    status: 'active',
  };

  const [latInput, setLatInput] = useState<string>(String(currentBranch.latitude || 10.77428));
  const [lngInput, setLngInput] = useState<string>(String(currentBranch.longitude || 106.70395));
  const [radiusInput, setRadiusInput] = useState<number>(currentBranch.radiusMeters || 50);

  // Sync inputs when active/selected branch changes
  useEffect(() => {
    if (currentBranch) {
      setLatInput(String(currentBranch.latitude || 10.77428));
      setLngInput(String(currentBranch.longitude || 106.70395));
      setRadiusInput(currentBranch.radiusMeters || 50);
    }
  }, [selectedBranchId, currentBranch]);

  // Read current device position on mount to show distance to store
  useEffect(() => {
    if (isOpen) {
      getCurrentDeviceGpsPosition()
        .then((coords) => setCurrentDeviceGps(coords))
        .catch(() => {
          // Geolocation optional for preview
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showSuccess = (msg: string) => {
    setMessage(msg);
    setError('');
    setTimeout(() => setMessage(''), 3500);
  };

  const showError = (err: string) => {
    setError(err);
    setTimeout(() => setError(''), 4000);
  };

  // 1-Click Auto-detect & Pin Current GPS Location of Store
  const handleAutoDetectAndPinGps = async () => {
    setIsDetectingGps(true);
    setError('');
    try {
      const coords = await getCurrentDeviceGpsPosition();
      setCurrentDeviceGps(coords);
      
      const newLat = Math.round(coords.latitude * 1000000) / 1000000;
      const newLng = Math.round(coords.longitude * 1000000) / 1000000;

      setLatInput(String(newLat));
      setLngInput(String(newLng));

      const updatedBranch: Branch = {
        ...currentBranch,
        latitude: newLat,
        longitude: newLng,
        radiusMeters: radiusInput,
      };

      onSaveBranch(updatedBranch);
      showSuccess(`Đã tự động lấy & ghim tọa độ GPS thực tế (${newLat}, ${newLng}) cho ${currentBranch.name} (Độ chính xác: ±${coords.accuracy}m)!`);
    } catch (err: any) {
      showError(err?.message || 'Không thể lấy GPS. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt hoặc nhập tọa độ thủ công.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  // Save manual GPS coordinates & radius
  const handleSaveGpsCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(latInput.trim());
    const lngNum = parseFloat(lngInput.trim());

    if (isNaN(latNum) || isNaN(lngNum)) {
      showError('Vui lòng nhập tọa độ Vĩ độ và Kinh độ hợp lệ (số thực)!');
      return;
    }

    if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
      showError('Tọa độ GPS không hợp lệ (Vĩ độ: -90 đến 90, Kinh độ: -180 đến 180).');
      return;
    }

    const updatedBranch: Branch = {
      ...currentBranch,
      latitude: latNum,
      longitude: lngNum,
      radiusMeters: Number(radiusInput) || 50,
    };

    onSaveBranch(updatedBranch);
    showSuccess(`Đã cập nhật tọa độ GPS và bán kính (${radiusInput}m) cho ${currentBranch.name}!`);
  };

  // Calculate live distance between current user device and store pinned GPS
  const parsedLat = parseFloat(latInput) || currentBranch.latitude || 10.77428;
  const parsedLng = parseFloat(lngInput) || currentBranch.longitude || 106.70395;
  const liveDistance = currentDeviceGps
    ? calculateDistanceMeters(
        currentDeviceGps.latitude,
        currentDeviceGps.longitude,
        parsedLat,
        parsedLng
      )
    : null;

  const isWithinRadius = liveDistance !== null && liveDistance <= radiusInput;

  // Filter staff belonging to this branch
  const branchStaff = staffList.filter((s) => s.role === 'staff' && s.branchId === selectedBranchId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                Cài Đặt Ghim GPS Quán & Khóa Thiết Bị
              </h3>
              <p className="text-xs text-slate-400">
                Định vị tọa độ chuẩn mét & bảo mật chống chấm công hộ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Selector Tabs */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center space-x-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Chi Nhánh:</span>
          </span>
          <div className="flex space-x-2">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setSelectedBranchId(b.id);
                  onSelectBranch(b.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  b.id === selectedBranchId
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {b.shortName || b.name}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback alerts */}
        {message && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-2xs shrink-0 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-300 text-red-800 rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-2xs shrink-0 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* SECTION 1: AUTO GPS PIN & MANUAL COORDINATES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-800">
                  1. Ghim Tọa Độ GPS Của Quán ({currentBranch.name})
                </h4>
              </div>

              {/* Direct Link to Google Maps */}
              <a
                href={`https://www.google.com/maps?q=${parsedLat},${parsedLng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                <span>Xem trên Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Big 1-Click Auto Pin GPS Button */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900">
                    <Navigation className="w-4 h-4 text-emerald-600" />
                    <span>Lấy Tọa Độ GPS Tự Động Tại Vị Trí Quán</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-md">
                    Khi người quản lý đang đứng trực tiếp tại quán, nhấn nút này để chip GPS tự động định vị và ghim chính xác vị trí quán chuẩn từng mét.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAutoDetectAndPinGps}
                  disabled={isDetectingGps}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <LocateFixed className={`w-4 h-4 ${isDetectingGps ? 'animate-spin' : ''}`} />
                  <span>{isDetectingGps ? 'Đang quét GPS...' : '📍 Ghim GPS Vị Trí Này'}</span>
                </button>
              </div>
            </div>

            {/* GPS Form Fields */}
            <form onSubmit={handleSaveGpsCoordinates} className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vĩ Độ GPS (Latitude) *
                  </label>
                  <input
                    type="text"
                    required
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    placeholder="vd: 10.774280"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tọa độ Bắc/Nam (TP.HCM: ~10.7x)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kinh Độ GPS (Longitude) *
                  </label>
                  <input
                    type="text"
                    required
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    placeholder="vd: 106.703950"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tọa độ Đông/Tây (TP.HCM: ~106.7x)</span>
                </div>
              </div>

              {/* Radius Configuration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Bán Kính GPS Cho Phép Chấm Công Quanh Quán:</span>
                  <span className="text-emerald-700 font-bold font-mono">{radiusInput} mét</span>
                </label>

                {/* Quick select radius pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                  {[
                    { value: 30, label: '30m (Chuẩn)' },
                    { value: 50, label: '50m (Mặc định)' },
                    { value: 100, label: '100m (Rộng)' },
                    { value: 200, label: '200m (Tòa nhà)' },
                  ].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRadiusInput(r.value)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        radiusInput === r.value
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min={10}
                    max={300}
                    step={10}
                    value={radiusInput}
                    onChange={(e) => setRadiusInput(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  *Nhân viên đứng trong phạm vi {radiusInput} mét quanh quán mới được duyệt chấm công hợp lệ.
                </p>
              </div>

              {/* Live Distance Preview Radar */}
              {currentDeviceGps && (
                <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  isWithinRadius 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Radio className={`w-4 h-4 ${isWithinRadius ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <div>
                      <div className="font-bold">
                        Khoảng cách từ thiết bị của bạn đến tọa độ ghim: <span className="font-mono text-sm underline">{liveDistance} mét</span>
                      </div>
                      <div className="text-[10px] opacity-80">
                        {isWithinRadius ? '✓ Bạn đang nằm TRONG bán kính cho phép của quán!' : '⚠️ Bạn đang ở NGOÀI bán kính cho phép của quán.'}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isWithinRadius ? 'bg-emerald-200 text-emerald-950' : 'bg-amber-200 text-amber-950'
                  }`}>
                    {isWithinRadius ? 'HỢP LỆ' : 'NGOÀI BÁN KÍNH'}
                  </span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu Tọa Độ & Bán Kính GPS
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: DEVICE ID RESET & HARDWARE SECURITY */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800">
                    2. Bảo Mật Mã Máy Phần Cứng ({branchStaff.length} Nhân Sự)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Khóa thiết bị ngăn chấm công hộ. Quản lý có thể Reset khi nhân viên đổi điện thoại mới.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden divide-y divide-slate-200/70">
              {branchStaff.length > 0 ? (
                branchStaff.map((staff) => {
                  const hasLocked = Boolean(staff.registeredDeviceId);
                  return (
                    <div
                      key={staff.id}
                      className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {staff.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {staff.department || 'Nhân viên'} • ID: {staff.id}
                          </div>
                          <div className="mt-1 flex items-center space-x-1.5">
                            {hasLocked ? (
                              <span className="inline-flex items-center text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                                Đã khóa: {staff.registeredDeviceId}
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Chưa khóa mã máy (Tự nhận lần đầu)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasLocked ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Xác nhận reset mã máy cho nhân viên ${staff.name}?`)) {
                              onResetDevice(staff.id);
                              showSuccess(`Đã reset mã máy cho ${staff.name}!`);
                            }
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl flex items-center space-x-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Mã Máy</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Chưa có thiết bị
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  Không có nhân viên nào trực thuộc {currentBranch.name}.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
