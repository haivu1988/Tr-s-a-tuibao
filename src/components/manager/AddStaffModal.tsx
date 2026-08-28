import React, { useState } from 'react';
import { User, Branch } from '../../types';
import { 
  UserPlus, 
  X, 
  Check, 
  Building2, 
  Phone, 
  Lock, 
  User as UserIcon, 
  Briefcase, 
  DollarSign, 
  Sparkles 
} from 'lucide-react';

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  activeBranchId: string;
  existingUsers: User[];
  onAddStaff: (newStaff: User) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
];

const DEPARTMENTS = [
  'Nhân viên Phục vụ',
  'Nhân viên Pha chế (Barista)',
  'Nhân viên Thu ngân',
  'Nhân viên Bếp / Phụ bếp',
  'Nhân viên Part-time đa năng',
  'Trưởng ca / Giám sát',
];

const SALARY_PRESETS = [
  { label: '20.000 đ', value: 20000 },
  { label: '22.000 đ (Chuẩn)', value: 22000 },
  { label: '25.000 đ', value: 25000 },
  { label: '28.000 đ', value: 28000 },
  { label: '30.000 đ', value: 30000 },
];

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  onClose,
  branches,
  activeBranchId,
  existingUsers,
  onAddStaff,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [branchId, setBranchId] = useState(activeBranchId || branches[0]?.id || 'cn_quan1');
  const [department, setDepartment] = useState('Nhân viên Phục vụ');
  const [hourlyRate, setHourlyRate] = useState<number>(22000);
  const [rateInput, setRateInput] = useState('22000');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-generate username suggestion from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username.startsWith('nv_')) {
      const cleanName = val
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (cleanName) {
        setUsername(`nv_${cleanName}`);
      }
    }
  };

  const handleSalaryChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setRateInput(clean);
    const num = parseInt(clean, 10);
    if (!isNaN(num)) {
      setHourlyRate(num);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('Vui lòng nhập Tên đăng nhập / Mã nhân viên');
      return;
    }

    // Check duplicate username
    const isExisted = existingUsers.some(
      (u) => u.id.toLowerCase() === cleanUsername
    );
    if (isExisted) {
      setErrorMsg(`Mã nhân viên / Tên đăng nhập "${cleanUsername}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác!`);
      return;
    }

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập Họ và tên nhân viên');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Vui lòng nhập Số điện thoại');
      return;
    }

    const newStaff: User = {
      id: cleanUsername,
      name: name.trim(),
      phone: phone.trim(),
      password: password.trim() || '123456',
      role: 'staff',
      branchId: branchId,
      department: department,
      hourlyRate: hourlyRate >= 1000 ? hourlyRate : 22000,
      avatar: selectedAvatar,
      registeredDeviceId: null, // Sẽ tự động khóa MAC máy khi nhân viên check-in lần đầu
      status: 'active',
    };

    onAddStaff(newStaff);
    setSuccessMsg(`Đã thêm thành công nhân viên "${newStaff.name}" (ID: ${newStaff.id})!`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
      // Reset form
      setName('');
      setUsername('');
      setPhone('');
      setPassword('123456');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Thêm Nhân Viên Mới
              </h3>
              <p className="text-xs text-slate-500">
                Tạo hồ sơ và cấp tài khoản nhân viên vào chi nhánh
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Avatar Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Chọn Ảnh Đại Diện (Avatar)
            </label>
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              {PRESET_AVATARS.map((av, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setSelectedAvatar(av)}
                  className={`relative shrink-0 rounded-full p-0.5 transition-all cursor-pointer ${
                    selectedAvatar === av
                      ? 'ring-3 ring-emerald-500 scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={av}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  {selectedAvatar === av && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Họ và Tên Nhân Viên *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="vd: Nguyễn Thúy Nga"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Username / ID */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên Đăng Nhập / Mã NV *
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="vd: nga123 hoặc nv_nga"
                className="w-full px-3 py-2 text-xs font-mono font-bold text-slate-800 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Điện Thoại *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0909 123 456"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật Khẩu Đăng Nhập *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Branch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chi Nhánh Làm Việc *
              </label>
              <div className="relative">
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium bg-white cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vị Trí / Chức Vụ *
              </label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium bg-white cursor-pointer"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700">
                Mức Lương Theo Giờ (VNĐ / Giờ) *
              </label>
              <span className="text-[11px] font-bold text-emerald-700 font-mono">
                {hourlyRate.toLocaleString('vi-VN')} đ/h
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={rateInput ? parseInt(rateInput, 10).toLocaleString('vi-VN') : ''}
                onChange={(e) => handleSalaryChange(e.target.value)}
                placeholder="22.000"
                className="w-full pl-9 pr-14 py-2.5 text-sm font-bold font-mono text-emerald-800 bg-emerald-50/50 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              <DollarSign className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                đ / h
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
              {SALARY_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setHourlyRate(p.value);
                    setRateInput(String(p.value));
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    hourlyRate === p.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Cơ chế bảo mật thiết bị & Chấm công:</span>
            </div>
            <p>
              Tài khoản nhân viên sau khi tạo có thể đăng nhập ngay bằng Tên đăng nhập và Mật khẩu vừa tạo. Địa chỉ MAC điện thoại sẽ được tự động khóa khi nhân viên thực hiện Check-in lần đầu tại chi nhánh.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo Nhân Viên Mới</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
