import React, { useState } from 'react';
import { User, Branch } from '../../types';
import { 
  Lock, 
  User as UserIcon, 
  Phone, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  KeyRound,
  IdCard,
  Building2,
  AlertCircle,
  Wifi,
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  allUsers: User[];
  branches: Branch[];
  activeBranchId: string;
  currentSimulatedWifi: string;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onRegister,
  allUsers = [],
  branches = [],
  activeBranchId,
  currentSimulatedWifi,
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  
  // Login fields
  const [loginId, setLoginId] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [showLoginPass, setShowLoginPass] = useState<boolean>(false);

  // Register fields: ID, Pass, Họ tên, Số điện thoại, Chi nhánh
  const [regId, setRegId] = useState<string>('');
  const [regPass, setRegPass] = useState<string>('');
  const [showRegPass, setShowRegPass] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regBranchId, setRegBranchId] = useState<string>(activeBranchId || (branches.length > 0 ? branches[0].id : 'cn_quan1'));

  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanId = loginId.trim().toLowerCase();
    const cleanPass = loginPass.trim();

    if (!cleanId || !cleanPass) {
      setError('Vui lòng nhập đầy đủ ID và Mật khẩu.');
      return;
    }

    // Fixed Manager Credentials Check: ID: quanly01 / Pass: 19021988
    if (cleanId === 'quanly01') {
      if (cleanPass === '19021988') {
        const manager = allUsers.find((u) => u.id.toLowerCase() === 'quanly01' || u.role === 'manager');
        if (manager) {
          onLogin({
            ...manager,
            id: 'quanly01',
            role: 'manager',
            branchId: manager.branchId || 'cn_quan1',
          });
          return;
        } else {
          // Fallback if not found in array
          const fallbackManager: User = {
            id: 'quanly01',
            password: '19021988',
            name: 'Quản Lý Hệ Thống',
            email: 'quanly@partflow.vn',
            phone: '0908 123 456',
            role: 'manager',
            branchId: 'cn_quan1',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            registeredDeviceId: 'MacBook-Pro-Admin',
            hourlyRate: 60000,
            department: 'Ban Quản Lý Chi Nhánh',
            status: 'active',
          };
          onLogin(fallbackManager);
          return;
        }
      } else {
        setError('Mật khẩu quản lý không chính xác (Mật khẩu cố định: 19021988).');
        return;
      }
    }

    // Staff check
    const user = allUsers.find((u) => u.id.toLowerCase() === cleanId);
    if (!user) {
      setError(`Không tìm thấy tài khoản với ID "${cleanId}". Nếu bạn là nhân viên mới, vui lòng bấm tab "Đăng Ký Nhân Viên Mới" bên dưới.`);
      return;
    }

    // Verify staff password
    if (user.password && user.password !== cleanPass) {
      setError('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      return;
    } else if (!user.password && cleanPass !== '123456' && cleanPass !== '19021988') {
      setError('Mật khẩu không chính xác (Mật khẩu mặc định: 123456).');
      return;
    }

    onLogin(user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanId = regId.trim().toLowerCase();
    const cleanPass = regPass.trim();
    const cleanName = regName.trim();
    const cleanPhone = regPhone.trim();

    if (!cleanId || !cleanPass || !cleanName || !cleanPhone) {
      setError('Vui lòng điền đầy đủ ID, Mật khẩu, Họ và tên và Số điện thoại.');
      return;
    }

    // Cannot register ID quanly01 as staff
    if (cleanId === 'quanly01') {
      setError('ID "quanly01" là tài khoản Quản Lý cố định của hệ thống. Bạn không thể đăng ký ID này.');
      return;
    }

    // Check existing ID
    const existing = allUsers.find((u) => u.id.toLowerCase() === cleanId);
    if (existing) {
      setError(`ID "${cleanId}" đã tồn tại. Vui lòng chọn một ID đăng nhập khác.`);
      return;
    }

    const randomAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    ];

    const newUser: User = {
      id: cleanId,
      password: cleanPass,
      name: cleanName,
      phone: cleanPhone,
      role: 'staff',
      branchId: regBranchId || (branches[0]?.id || 'cn_quan1'),
      avatar: randomAvatars[Math.floor(Math.random() * randomAvatars.length)],
      registeredDeviceId: null, // Sẽ tự động gán mã thiết bị khi chấm công lần đầu
      hourlyRate: 28000,
      department: 'Nhân viên Phục Vụ / Pha Chế',
      status: 'active',
    };

    onRegister(newUser);
  };

  const handleQuickFill = (id: string, pass: string) => {
    setLoginId(id);
    setLoginPass(pass);
    setError('');
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-slate-900 via-slate-850 to-slate-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased text-slate-100 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-xl font-black tracking-tight text-white flex items-center space-x-1.5">
              <span>PartFlow</span>
              <span className="text-emerald-400 text-xs px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full font-bold uppercase tracking-wider">
                Pro
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Quản lý ca & Chấm công WiFi Đa Chi Nhánh
            </p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-full text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{branches.length} Chi Nhánh Đang Hoạt Động</span>
        </div>
      </header>

      {/* Main Center Auth Card */}
      <main className="w-full max-w-md mx-auto my-auto py-6 z-10">
        <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Card Top Title Banner */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {isRegister ? 'Đăng Ký Tài Khoản Nhân Viên' : 'Đăng Nhập Cổng Làm Việc'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isRegister 
                    ? 'Tạo tài khoản để đăng ký lịch và chấm công'
                    : 'Nhập ID & Mật khẩu để bắt đầu phiên làm việc'}
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                !isRegister
                  ? 'text-emerald-800 border-b-2 border-emerald-600 bg-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 bg-slate-50'
              }`}
            >
              <IdCard className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-3.5 text-xs sm:text-sm font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                isRegister
                  ? 'text-emerald-800 border-b-2 border-emerald-600 bg-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Đăng Ký Nhân Viên Mới</span>
            </button>
          </div>

          {/* Form Content Area */}
          <div className="p-5 sm:p-7">
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-relaxed font-medium">{successMsg}</span>
              </div>
            )}

            {!isRegister ? (
              /* =================== LOGIN FORM =================== */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* ID Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    ID Đăng Nhập
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="Nhập ID (vd: quanly01 hoặc nv_nguyenha)"
                      className="w-full pl-10 pr-3.5 py-3 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Mật Khẩu
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPass(!showLoginPass)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Đăng Nhập Vào Hệ Thống</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Staff Registration Shortcut */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 flex items-start space-x-2">
                    <UserIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div className="flex-1 text-[11px] leading-relaxed">
                      <span className="font-bold text-slate-800">Bạn là nhân viên mới?</span>{' '}
                      Vui lòng bấm{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegister(true);
                          setError('');
                        }}
                        className="text-emerald-700 font-bold underline hover:text-emerald-800 cursor-pointer"
                      >
                        Đăng Ký Tài Khoản
                      </button>{' '}
                      để chọn chi nhánh và bắt đầu xếp lịch.
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* =================== REGISTER FORM =================== */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* 1. Branch Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Chi Nhánh Làm Việc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <select
                      value={regBranchId}
                      onChange={(e) => setRegBranchId(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.address})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Họ và Tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* 3. Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0912 345 678"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* 4. ID Account */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đặt ID Đăng Nhập <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={regId}
                      onChange={(e) => setRegId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="vd: an_pham (chữ thường, không dấu)"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dùng ID này để đăng nhập vào ca hàng ngày.
                  </p>
                </div>

                {/* 5. Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Đặt Mật Khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showRegPass ? 'text' : 'password'}
                      required
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="Nhập mật khẩu riêng của bạn"
                      className="w-full pl-10 pr-11 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    >
                      {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  className="w-full mt-3 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Hoàn Tất Đăng Ký & Đăng Nhập</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError('');
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer underline"
                  >
                    Đã có tài khoản? Quay lại đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 z-10 py-2 border-t border-slate-800/80 gap-2">
        <div>
          PartFlow Pro v2.0 • Hệ thống tự động xếp lịch & Chấm công WiFi
        </div>
        <div className="flex items-center space-x-2">
          <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          <span>WiFi hiện tại kết nối: <strong className="text-slate-200 font-mono">{currentSimulatedWifi}</strong></span>
        </div>
      </footer>
    </div>
  );
};
