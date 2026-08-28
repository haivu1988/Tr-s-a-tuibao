import React, { useState } from 'react';
import { User, Branch } from '../../types';
import { 
  X, 
  Lock, 
  User as UserIcon, 
  Phone, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  KeyRound,
  IdCard,
  Building2,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
  allUsers: User[];
  branches?: Branch[];
  activeBranchId?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  allUsers = [],
  branches = [],
  activeBranchId,
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  
  // Login fields
  const [loginId, setLoginId] = useState<string>('');
  const [loginPass, setLoginPass] = useState<string>('');
  const [showLoginPass, setShowLoginPass] = useState<boolean>(false);

  // Register fields: ID, Pass, Họ tên, Số điện thoại (bỏ mức lương & bộ phận & bỏ mục quản lý)
  const [regId, setRegId] = useState<string>('');
  const [regPass, setRegPass] = useState<string>('');
  const [showRegPass, setShowRegPass] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regBranchId, setRegBranchId] = useState<string>(activeBranchId || (branches.length > 0 ? branches[0].id : 'branch_q1'));

  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

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
            branchId: manager.branchId || 'branch_q1',
          });
          onClose();
          return;
        } else {
          // Fallback if not found in array
          const fallbackManager: User = {
            id: 'quanly01',
            password: '19021988',
            name: 'Trần Hoàng Nam',
            phone: '0908 123 456',
            role: 'manager',
            branchId: 'branch_q1',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            registeredDeviceId: 'MacBook-Pro-Admin',
            hourlyRate: 60000,
            department: 'Ban Quản Lý Chi Nhánh',
            status: 'active',
          };
          onLogin(fallbackManager);
          onClose();
          return;
        }
      } else {
        setError('Mật khẩu quản lý không chính xác (Gợi ý cố định: 19021988).');
        return;
      }
    }

    // Staff check
    const user = allUsers.find((u) => u.id.toLowerCase() === cleanId);
    if (!user) {
      setError(`Không tìm thấy tài khoản với ID "${cleanId}". Vui lòng kiểm tra lại hoặc đăng ký mới.`);
      return;
    }

    // Verify staff password (defaulting to 123456 if none set on legacy seed data)
    const expectedPass = user.password || '123456';
    if (user.password && user.password !== cleanPass) {
      setError('Mật khẩu không chính xác. Vui lòng kiểm tra lại.');
      return;
    } else if (!user.password && cleanPass !== '123456' && cleanPass !== '19021988') {
      setError('Mật khẩu không chính xác (Mật khẩu mặc định: 123456).');
      return;
    }

    onLogin(user);
    onClose();
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
      setError('ID "quanly01" là tài khoản Quản lý cố định của hệ thống. Bạn không thể đăng ký ID này.');
      return;
    }

    // Check existing ID
    const existing = allUsers.find((u) => u.id.toLowerCase() === cleanId);
    if (existing) {
      setError(`ID "${cleanId}" đã tồn tại. Vui lòng chọn ID đăng nhập khác.`);
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
      role: 'staff', // Luôn tạo tài khoản nhân viên
      branchId: regBranchId || 'branch_q1',
      avatar: randomAvatars[Math.floor(Math.random() * randomAvatars.length)],
      registeredDeviceId: null, // Sẽ tự động khóa mã máy trong lần đầu Check-in qua WiFi
      hourlyRate: 28000, // Mặc định 28.000đ/giờ
      department: 'Nhân viên Part-time',
      status: 'active',
    };

    onRegister(newUser);
    onClose();
  };

  const handleQuickFill = (id: string, pass: string) => {
    setLoginId(id);
    setLoginPass(pass);
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold leading-tight">
                {isRegister ? 'Đăng Ký Nhân Viên Mới' : 'Đăng Nhập Hệ Thống'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PartFlow Pro • Quản lý chi nhánh & Chấm công WiFi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 shrink-0 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all ${
              !isRegister
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 bg-slate-50'
            }`}
          >
            Đăng Nhập (ID & Pass)
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all ${
              isRegister
                ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-700 bg-slate-50'
            }`}
          >
            Đăng Ký Nhân Viên Mới
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {!isRegister ? (
            /* =================== LOGIN FORM (ID & PASS) =================== */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* ID Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID Đăng nhập
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Nhập ID (vd: quanly01 hoặc usr_tuan)"
                    className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mật khẩu (Pass)
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showLoginPass ? 'text' : 'password'}
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>Đăng Nhập Ngay</span>
              </button>

              {/* Staff Notice */}
              <div className="pt-3 border-t border-slate-100">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
                  <UserIcon className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold text-slate-800">Dành cho Nhân Viên:</span>{' '}
                    Nhân viên đăng nhập bằng ID & Mật khẩu cá nhân đã tạo. Nếu chưa có tài khoản, vui lòng bấm{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegister(true);
                        setError('');
                      }}
                      className="text-emerald-700 font-bold underline hover:text-emerald-800 cursor-pointer"
                    >
                      Đăng Ký Nhân Viên Mới
                    </button>
                    .
                  </div>
                </div>
              </div>
            </form>
          ) : (
            /* =================== REGISTER FORM (ID, PASS, HỌ TÊN, SỐ ĐIỆN THOẠI, CHI NHÁNH) =================== */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800 flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Đăng ký tài khoản nhân viên. Mã thiết bị sẽ được tự động đồng bộ và bảo mật trong lần Check-in đầu tiên qua WiFi cửa hàng.
                </span>
              </div>

              {/* Branch Selector */}
              {branches.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chi nhánh làm việc <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <select
                      value={regBranchId}
                      onChange={(e) => setRegBranchId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.address})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* 1. ID Đăng nhập */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ID Đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regId}
                    onChange={(e) => setRegId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="vd: tuan123, phuong99, hoangnam..."
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Dùng để đăng nhập hệ thống (không dấu, viết liền).
                </p>
              </div>

              {/* 2. Mật khẩu (Pass) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mật khẩu (Pass) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    required
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPass(!showRegPass)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 3. Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="vd: Nguyễn Minh Tuấn"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* 4. Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số điện thoại <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="vd: 0912 345 678"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1.5 mt-2"
              >
                <span>Hoàn Tất Đăng Ký Nhân Viên</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
