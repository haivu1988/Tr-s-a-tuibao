import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  BarChart3, 
  Wifi, 
  LogOut, 
  LogIn, 
  CheckCircle2, 
  CalendarPlus, 
  CalendarCheck2, 
  Pin,
  X,
  Building2,
  ChevronRight,
  Users,
  Camera
} from 'lucide-react';
import { User, Branch, WifiStoreConfig } from '../../types';

interface SidebarProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onOpenBranchModal: () => void;
  wifiConfig: WifiStoreConfig;
  currentSimulatedWifi: string;
  currentDeviceId: string;
  onOpenWifiModal: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenAvatarModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  branches = [],
  activeBranchId,
  onSelectBranch,
  onOpenBranchModal,
  wifiConfig,
  currentSimulatedWifi,
  currentDeviceId,
  onOpenWifiModal,
  onLogout,
  onOpenAuth,
  isMobileOpen = false,
  onCloseMobile,
  onOpenAvatarModal,
}) => {
  const isManager = currentUser?.role === 'manager';
  const currentBranch = branches?.find((b) => b.id === (isManager ? activeBranchId : currentUser?.branchId)) || branches?.[0] || {
    id: 'cn_quan1',
    name: 'Chi Nhánh 1 - Quận 1',
    shortName: 'Quận 1',
    pinnedWifiSsid: 'Store_Main_5G',
  };

  const managerNavItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { id: 'staff_mgmt', label: 'Quản Lý Nhân Viên', icon: Users },
    { id: 'schedule', label: 'Lịch & Xếp Ca (Dương Lịch)', icon: CalendarDays },
    { id: 'attendance', label: 'Chấm Công & Thiết Bị', icon: Clock },
    { id: 'reports', label: 'Báo Cáo & Tính Lương', icon: BarChart3 },
  ];

  const staffNavItems = [
    { id: 'staff_dashboard', label: 'Tổng Quan Ca Làm', icon: LayoutDashboard },
    { id: 'staff_checkin', label: 'Chấm Công Vào / Ra', icon: CheckCircle2 },
    { id: 'staff_register', label: 'Đăng Ký Ca Rảnh', icon: CalendarPlus },
    { id: 'staff_schedule', label: 'Lịch Làm Của Tôi', icon: CalendarCheck2 },
    { id: 'staff_reports', label: 'Công & Thu Nhập', icon: BarChart3 },
  ];

  const navItems = isManager ? managerNavItems : staffNavItems;

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const isConnectedPinnedWifi = currentBranch?.pinnedWifiSsid?.toLowerCase() === currentSimulatedWifi.toLowerCase();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        id="app-sidebar"
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 select-none
          transform transition-transform duration-300 ease-in-out md:translate-x-0
          ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        {/* Brand / Logo Area */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center font-black text-lg tracking-tighter shadow-md">
                P
              </div>
              <div>
                <h1 className="font-bold text-white tracking-tight text-base leading-none">
                  PartFlow
                </h1>
                <span className="text-[10px] text-emerald-400 font-medium tracking-wide">
                  ĐA CHI NHÁNH • DƯƠNG LỊCH
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* ACTIVE BRANCH CARD */}
          <div className="p-3 mx-3 mt-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[10px] font-semibold mb-1">
              <span className="flex items-center space-x-1 uppercase tracking-wider text-emerald-400">
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span>{isManager ? 'Chi Nhánh Đang Quản Lý' : 'Chi Nhánh Làm Việc'}</span>
              </span>
            </div>
            
            <div className="font-bold text-white text-xs truncate">
              {currentBranch?.name}
            </div>

            {/* Pinned WiFi indicator */}
            <div className="mt-1.5 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center space-x-1">
                <Pin className="w-2.5 h-2.5 text-amber-400" />
                <span>WiFi Đã Ghim:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 text-[10px] truncate max-w-[100px]" title={currentBranch?.pinnedWifiSsid}>
                {currentBranch?.pinnedWifiSsid}
              </span>
            </div>

            {/* Branch Management Quick Action for manager */}
            {isManager && (
              <button
                onClick={() => {
                  onOpenBranchModal();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full mt-2 py-1 px-2 bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>🏢 Đổi / Quản Trị Chi Nhánh</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {isManager ? 'Quản Trị Chi Nhánh' : 'Không Gian Nhân Viên'}
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-900/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: WiFi Quick Status & Auth */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {/* Quick WiFi Pin status */}
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-700/60 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span>Trạng Thái Mạng</span>
              </span>
              {isManager && (
                <button
                  onClick={() => {
                    onOpenWifiModal();
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer flex items-center space-x-0.5"
                >
                  <Pin className="w-2.5 h-2.5" />
                  <span>Ghim WiFi</span>
                </button>
              )}
            </div>

            <div className="font-mono text-[11px] truncate flex items-center justify-between">
              <span className="text-slate-300 truncate">{currentSimulatedWifi}</span>
              {isConnectedPinnedWifi ? (
                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.2 rounded font-bold border border-emerald-800">
                  HỢP LỆ
                </span>
              ) : (
                <span className="text-[9px] bg-red-950 text-red-400 px-1.5 py-0.2 rounded font-bold border border-red-800">
                  CHƯA GHIM
                </span>
              )}
            </div>
          </div>

          {/* User Profile Card / Auth Button */}
          {currentUser ? (
            <div className="flex items-center justify-between p-2 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <div 
                onClick={() => {
                  if (onOpenAvatarModal) onOpenAvatarModal();
                }}
                title="Nhấn để đổi ảnh đại diện"
                className="flex items-center space-x-2.5 min-w-0 cursor-pointer group flex-1"
              >
                <div className="relative shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-600 group-hover:border-emerald-400 transition-colors shrink-0"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate flex items-center space-x-1">
                    <span className="truncate">{currentUser.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center space-x-1">
                    <span>{isManager ? 'Quản lý cửa hàng' : currentBranch?.shortName}</span>
                    <span className="text-[9px] text-emerald-400/80 hover:underline">(Đổi ảnh)</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Đăng xuất / Đổi tài khoản"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập / Đăng Ký</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
