import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Wifi, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Menu,
  Building2,
  Pin,
  Calendar,
  LogOut,
  Globe,
  Users,
  AlertTriangle,
  ExternalLink,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { User, Branch } from '../../types';
import { formatSolarDateWithWeekday } from '../../utils/solarCalendar';
import { OnlinePresence, FIRESTORE_DATABASE_URL } from '../../lib/syncEngine';
import { scanDeviceHardwareProfile, getCachedHardwareDeviceInfo, HardwareDeviceInfo } from '../../utils/deviceFingerprint';

interface HeaderProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onOpenBranchModal: () => void;
  onOpenAutoScheduleModal: () => void;
  onOpenCheckInModal: () => void;
  onOpenAuth: () => void;
  onLogout?: () => void;
  currentSimulatedWifi: string;
  onChangeSimulatedWifi: (ssid: string) => void;
  currentSimulatedIp?: string;
  onChangeSimulatedIp?: (ip: string) => void;
  currentDeviceId: string;
  onChangeDeviceId: (newId: string) => void;
  onOpenMobileSidebar?: () => void;
  onOpenAvatarModal?: () => void;
  onlinePresences?: OnlinePresence[];
  isQuotaExceeded?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers = [],
  onSelectUser,
  branches = [],
  activeBranchId,
  onSelectBranch,
  onOpenBranchModal,
  onOpenAutoScheduleModal,
  onOpenCheckInModal,
  onOpenAuth,
  onLogout,
  currentSimulatedWifi,
  onChangeSimulatedWifi,
  currentSimulatedIp = '118.69.182.45',
  onChangeSimulatedIp,
  currentDeviceId,
  onChangeDeviceId,
  onOpenMobileSidebar,
  onOpenAvatarModal,
  onlinePresences = [],
  isQuotaExceeded = false,
}) => {
  const [time, setTime] = useState<string>('');
  const [solarDateStr, setSolarDateStr] = useState<string>('');
  const [showBranchDropdown, setShowBranchDropdown] = useState<boolean>(false);
  const [showOnlineDropdown, setShowOnlineDropdown] = useState<boolean>(false);
  const [hwInfo, setHwInfo] = useState<HardwareDeviceInfo | null>(() => getCachedHardwareDeviceInfo());
  const [isScanningHw, setIsScanningHw] = useState<boolean>(false);

  useEffect(() => {
    scanDeviceHardwareProfile().then((info) => {
      setHwInfo(info);
      if (info.macAddress && info.macAddress !== currentDeviceId) {
        onChangeDeviceId(info.macAddress);
      }
    });
  }, []);

  const handleScanHardware = async () => {
    setIsScanningHw(true);
    try {
      const info = await scanDeviceHardwareProfile();
      setHwInfo(info);
      if (info.macAddress) {
        onChangeDeviceId(info.macAddress);
      }
    } finally {
      setIsScanningHw(false);
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setSolarDateStr(formatSolarDateWithWeekday(now.toISOString().split('T')[0]));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isManager = currentUser?.role === 'manager';
  const currentBranch = branches?.find((b) => b.id === (isManager ? activeBranchId : currentUser?.branchId)) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1',
    shortName: 'Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
  };
  const isWifiAllowed = currentBranch?.pinnedWifiSsid?.toLowerCase() === currentSimulatedWifi.toLowerCase() ||
    (currentBranch?.backupWifiSsid && currentBranch.backupWifiSsid.toLowerCase() === currentSimulatedWifi.toLowerCase());

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 z-30 select-none">
      {/* Left side: Hamburger (Mobile) + Current Identity / Branch Picker */}
      <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
        {/* Mobile Hamburger Menu button */}
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            id="btn-open-mobile-drawer"
            className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* User Identity */}
        <div className="flex items-center space-x-2 min-w-0">
          {currentUser?.avatar && (
            <button
              type="button"
              onClick={() => {
                if (onOpenAvatarModal) onOpenAvatarModal();
              }}
              title="Đổi ảnh đại diện"
              className="relative group shrink-0 md:hidden cursor-pointer"
            >
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-8 h-8 rounded-full object-cover border border-slate-200 group-hover:ring-2 group-hover:ring-emerald-500"
              />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="text-xs sm:text-base font-bold text-slate-800 truncate flex items-center space-x-1.5">
              <span>{currentUser ? currentUser.name : 'PartFlow Pro'}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                  isManager ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isManager ? 'Quản Lý' : 'Nhân Viên'}
              </span>
            </h2>
            
            {/* Branch Label / Picker for manager */}
            {isManager ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setShowBranchDropdown(!showBranchDropdown);
                  }}
                  className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  <Building2 className="w-3 h-3 text-emerald-600" />
                  <span className="truncate max-w-[130px] sm:max-w-[200px]">{currentBranch?.shortName || 'Chi Nhánh'}</span>
                  <ChevronDown className="w-2.5 h-2.5 text-emerald-600" />
                </button>

                {showBranchDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowBranchDropdown(false)}
                    />
                    <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Chọn Chi Nhánh Quản Lý
                      </div>
                      <div className="py-1 max-h-60 overflow-y-auto">
                        {branches.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              onSelectBranch(b.id);
                              setShowBranchDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 transition-colors ${
                              activeBranchId === b.id ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-slate-700'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="truncate font-semibold">{b.name}</div>
                              <div className="text-[10px] text-slate-400 truncate font-mono">
                                📌 WiFi: {b.pinnedWifiSsid}
                              </div>
                            </div>
                            {activeBranchId === b.id && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setShowBranchDropdown(false);
                            onOpenBranchModal();
                          }}
                          className="w-full text-center py-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                        >
                          ⚙️ Quản Trị & Thêm Chi Nhánh
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span className="truncate">{currentBranch?.name || 'Chi Nhánh'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Solar Calendar Clock (Desktop & Tablet) */}
        <div className="hidden xl:flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{solarDateStr}</span>
          <span className="text-slate-300">•</span>
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono font-semibold text-slate-700">{time}</span>
        </div>

        {/* Live Sync Status & Online Accounts Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowOnlineDropdown(!showOnlineDropdown)}
            title="Xem danh sách tài khoản đang Online và trạng thái đồng bộ"
            className={`hidden sm:flex items-center space-x-1.5 text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all cursor-pointer shadow-2xs ${
              isQuotaExceeded
                ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isQuotaExceeded ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isQuotaExceeded ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <Globe className={`w-3.5 h-3.5 ${isQuotaExceeded ? 'text-amber-600' : 'text-emerald-600'}`} />
            <span>
              {isQuotaExceeded ? 'P2P Realtime' : 'Realtime Sync'}
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              isQuotaExceeded ? 'bg-amber-200 text-amber-950' : 'bg-emerald-200 text-emerald-950'
            }`}>
              {onlinePresences.length > 0 ? `${onlinePresences.length} Online` : '1 Online'}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {/* Online Accounts & Sync Status Popover */}
          {showOnlineDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowOnlineDropdown(false)}
              />
              <div className="absolute left-0 mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Tài Khoản Đang Online (Realtime)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    {onlinePresences.length || 1} hoạt động
                  </span>
                </div>

                {/* Quota Status Notice */}
                {isQuotaExceeded && (
                  <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1.5">
                    <div className="flex items-center space-x-1.5 font-bold text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Thông báo Quota Cloud Firestore</span>
                    </div>
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Cơ sở dữ liệu đám mây đã chạm hạn mức đọc miễn phí (50.000 lượt/ngày) của gói Spark. Hệ thống đang tự động kích hoạt bộ đồng bộ <strong>P2P Realtime Engine</strong> giữa các tab và cửa sổ.
                    </p>
                    <a
                      href={FIRESTORE_DATABASE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 underline hover:text-amber-950"
                    >
                      <span>Mở nâng cấp Firestore Console</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                )}

                {/* List of active online users */}
                <div className="mt-2.5 space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                  {(onlinePresences.length > 0 ? onlinePresences : [
                    {
                      userId: currentUser?.id || 'you',
                      userName: currentUser?.name || 'Bạn',
                      role: currentUser?.role || 'staff',
                      branchId: currentUser?.branchId || activeBranchId,
                      avatar: currentUser?.avatar,
                      lastSeen: Date.now(),
                      isOnline: true
                    }
                  ]).map((p) => {
                    const branch = branches.find((b) => b.id === p.branchId);
                    const isMe = p.userId === currentUser?.id;
                    return (
                      <div
                        key={p.userId}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="relative">
                            <img
                              src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                              alt={p.userName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200"
                            />
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate flex items-center space-x-1">
                              <span>{p.userName}</span>
                              {isMe && (
                                <span className="text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-semibold">
                                  Tôi
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {p.role === 'manager' ? 'Quản lý' : 'Nhân viên'} • {branch?.shortName || 'Chi nhánh'}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-1.5 py-0.5 rounded-md shrink-0">
                          Online
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center">
                  ⚡ Đồng bộ tức thì giữa mọi thiết bị & trình duyệt
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side: Logout, Simulator Tools & Main Action Button */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Direct Logout Button */}
        {onLogout && currentUser && (
          <button
            onClick={onLogout}
            title="Đăng xuất tài khoản"
            className="flex items-center space-x-1 sm:space-x-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        )}

        {/* Real Network IP & Hardware Badge */}
        <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
          <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-mono text-[11px] text-slate-600" title="Địa chỉ IP mạng WiFi đang kết nối thực tế">
            IP: <strong className="text-slate-900">{currentSimulatedIp}</strong>
          </span>
          <span className="text-slate-300">•</span>
          <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-mono text-[11px] font-bold text-slate-800" title={`Mã Máy Điện Thoại: ${currentDeviceId}`}>
            {currentDeviceId}
          </span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
            Mã Máy
          </span>
        </div>

        {/* Primary Action Button based on Role */}
        {isManager ? (
          <button
            id="btn-auto-schedule-trigger"
            onClick={onOpenAutoScheduleModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm flex items-center space-x-1.5 sm:space-x-2 transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
            <span className="font-bold hidden xs:inline sm:inline">Chia Ca Tự Động</span>
            <span className="font-bold xs:hidden sm:hidden">Chia Ca</span>
          </button>
        ) : (
          <button
            id="btn-staff-checkin-trigger"
            onClick={onOpenCheckInModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm flex items-center space-x-1.5 sm:space-x-2 transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            <span className="font-bold">Chấm Công</span>
          </button>
        )}
      </div>
    </header>
  );
};
