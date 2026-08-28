import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  FileSpreadsheet, 
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import { User } from '../../types';

interface BottomNavProps {
  currentUser: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCheckInModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
}) => {
  const isManager = currentUser?.role === 'manager';

  if (!currentUser) return null;

  if (isManager) {
    const managerTabs = [
      { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
      { id: 'schedule', label: 'Phân Ca', icon: CalendarDays },
      { id: 'attendance', label: 'Chấm Công', icon: Clock },
      { id: 'reports', label: 'Báo Cáo', icon: FileSpreadsheet },
    ];

    return (
      <nav 
        id="mobile-bottom-nav" 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around select-none shadow-2xl safe-area-inset-bottom"
      >
        {managerTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 py-1.5 px-1 flex flex-col items-center justify-center rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className={`relative p-1 rounded-xl transition-transform ${isActive ? 'bg-emerald-500/20 scale-105' : ''}`}>
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] tracking-tight truncate mt-0.5">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    );
  }

  // Staff Bottom Bar
  const staffTabs = [
    { id: 'staff_dashboard', label: 'Bàn Làm Việc', icon: LayoutDashboard },
    { id: 'staff_register', label: 'Đăng Ký Ca', icon: CalendarDays },
    { id: 'staff_checkin', label: 'Chấm Công', icon: Clock, isCenterHighlight: true },
    { id: 'staff_schedule', label: 'Lịch Làm', icon: UserCheck },
    { id: 'staff_reports', label: 'Thu Nhập', icon: FileSpreadsheet },
  ];

  return (
    <nav 
      id="mobile-bottom-nav-staff" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-1 py-1 flex items-center justify-around select-none shadow-2xl safe-area-inset-bottom"
    >
      {staffTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isCenterHighlight) {
          return (
            <button
              key={tab.id}
              id={`mobile-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-w-0 flex flex-col items-center justify-center -mt-4 relative group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-90 ${
                isActive 
                  ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/30' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}>
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                Chấm Công
              </span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            id={`mobile-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-0 py-1 px-1 flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`relative p-1 rounded-xl transition-transform ${isActive ? 'bg-emerald-500/20 scale-105' : ''}`}>
              <Icon className="w-5 h-5" />
              {isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate mt-0.5">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
