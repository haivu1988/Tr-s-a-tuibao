import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Users, 
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
  Globe
} from 'lucide-react';
import { User, Branch } from '../../types';
import { formatSolarDateWithWeekday } from '../../utils/solarCalendar';

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
}) => {
  const [time, setTime] = useState<string>('');
  const [solarDateStr, setSolarDateStr] = useState<string>('');
  const [showSimulateDrawer, setShowSimulateDrawer] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState<boolean>(false);

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
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 md:hidden"
            />
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
                    setShowUserDropdown(false);
                    setShowSimulateDrawer(false);
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

        {/* Live Firestore Sync Status */}
        <div className="hidden lg:flex items-center space-x-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-medium shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Globe className="w-3 h-3 text-emerald-600" />
          <span>Cloud Firestore Online</span>
        </div>
      </div>

      {/* Right side: Switcher, Simulator Tools & Main Action Button */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Switch Account Quick Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowSimulateDrawer(false);
              setShowBranchDropdown(false);
            }}
            className="flex items-center space-x-1 sm:space-x-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Đổi tài khoản kiểm thử demo"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Đổi tài khoản</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserDropdown && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Tài Khoản Đang Hoạt Động</span>
                  <button onClick={() => setShowUserDropdown(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {allUsers.map((user) => {
                    const userBranch = branches.find((b) => b.id === user.branchId);
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSelectUser(user);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left flex items-center space-x-3 hover:bg-slate-50 transition-colors ${
                          currentUser?.id === user.id ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
                        }`}
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate flex items-center justify-between">
                            <span>{user.name}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                user.role === 'manager'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {user.role === 'manager' ? 'Quản Lý' : userBranch?.shortName || 'Nhân Viên'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {user.role === 'manager' ? 'ID: quanly01 • Ban Quản Lý' : `ID: ${user.id} • ${userBranch?.name || 'Chi Nhánh'}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="p-2 border-t border-slate-100 space-y-1.5">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenAuth();
                    }}
                    className="w-full text-center py-2 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    + Đăng Ký Nhân Viên / Đổi Tài Khoản
                  </button>

                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-3 text-xs text-red-600 hover:bg-red-50 font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center space-x-1.5 border border-red-100"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Đăng Xuất (Về Màn Hình Đăng Nhập)</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* WiFi & Device Simulation Tool Pill */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSimulateDrawer(!showSimulateDrawer);
              setShowUserDropdown(false);
              setShowBranchDropdown(false);
            }}
            title="Mô phỏng WiFi & Thiết Bị Đi Thoại"
            className={`flex items-center space-x-1 sm:space-x-1.5 border px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isWifiAllowed
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100/70'
                : 'bg-red-50/70 border-red-200 text-red-800 hover:bg-red-100/70'
            }`}
          >
            <Wifi className={`w-3.5 h-3.5 ${isWifiAllowed ? 'text-emerald-600' : 'text-red-500 animate-pulse'}`} />
            <span className="hidden sm:inline font-mono text-[11px] max-w-[100px] truncate">
              {currentSimulatedWifi}
            </span>
            <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showSimulateDrawer && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setShowSimulateDrawer(false)}
              />
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bộ Giả Lập Mạng & Thiết Bị</span>
                  </div>
                  <button
                    onClick={() => setShowSimulateDrawer(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Mạng WiFi Đang Kết Nối:
                    </label>
                    <select
                      value={currentSimulatedWifi}
                      onChange={(e) => {
                        const newSsid = e.target.value;
                        onChangeSimulatedWifi(newSsid);
                        // If selected a branch, also switch IP to that branch
                        const matchedBranch = branches.find(b => b.pinnedWifiSsid === newSsid);
                        if (matchedBranch && onChangeSimulatedIp && matchedBranch.pinnedWifiIp) {
                          onChangeSimulatedIp(matchedBranch.pinnedWifiIp);
                        }
                      }}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800 focus:ring-1 focus:ring-emerald-500"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.pinnedWifiSsid}>
                          {b.pinnedWifiSsid} (📌 WiFi Đã Ghim - {b.shortName})
                        </option>
                      ))}
                      <option value="Home_WiFi_Guest">Home_WiFi_Guest (WiFi Nhà - Không Hợp Lệ)</option>
                      <option value="4G / 5G Mobile Data">4G / 5G Mobile Data (Dữ liệu di động - Không Hợp Lệ)</option>
                      <option value="Cafe_Neighbor_Free">Cafe_Neighbor_Free (WiFi Quán Khác - Không Hợp Lệ)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      *WiFi đã ghim cho {currentBranch.shortName}: <span className="font-bold text-emerald-700 font-mono">{currentBranch.pinnedWifiSsid}</span>
                    </p>
                  </div>

                  {/* IP Address Simulator */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-600 flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-emerald-600" />
                        <span>Địa Chỉ IP WiFi Đang Kết Nối:</span>
                      </label>
                      {currentBranch?.pinnedWifiIp && currentSimulatedIp === currentBranch.pinnedWifiIp && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                          Khớp IP Quán
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentSimulatedIp}
                        onChange={(e) => onChangeSimulatedIp && onChangeSimulatedIp(e.target.value)}
                        placeholder="vd: 118.69.182.45"
                        className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800 focus:ring-1 focus:ring-emerald-500"
                      />
                      {currentBranch?.pinnedWifiIp && (
                        <button
                          type="button"
                          onClick={() => onChangeSimulatedIp && onChangeSimulatedIp(currentBranch.pinnedWifiIp!)}
                          title={`Gán IP của ${currentBranch.shortName}`}
                          className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Khớp IP
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      *IP ghim của {currentBranch.shortName}: <span className="font-mono font-bold text-emerald-700">{currentBranch.pinnedWifiIp || 'Chưa thiết lập'}</span>
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      Mã Máy Điện Thoại Hiện Tại (Device ID):
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={currentDeviceId}
                        onChange={(e) => onChangeDeviceId(e.target.value)}
                        className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-800"
                      />
                      <button
                        onClick={() => {
                          const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
                          onChangeDeviceId(`iPhone-${randomHex}-${Math.floor(1000 + Math.random() * 9000)}`);
                        }}
                        title="Tạo mã máy ngẫu nhiên mới"
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {currentUser?.registeredDeviceId ? (
                        <span className="text-emerald-600 font-medium">
                          Mã đã khóa: {currentUser.registeredDeviceId}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">
                          Chưa khóa mã. Sẽ tự động ghim mã này khi check in lần đầu!
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
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
