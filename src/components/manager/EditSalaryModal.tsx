import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { DollarSign, X, Check, Calculator, Sparkles, Building2 } from 'lucide-react';

interface EditSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: User | null;
  branchName?: string;
  onSaveRate: (userId: string, newRate: number) => void;
}

const PRESET_RATES = [
  { label: '20.000 đ/h', value: 20000 },
  { label: '22.000 đ/h (Tiêu chuẩn)', value: 22000, isDefault: true },
  { label: '25.000 đ/h', value: 25000 },
  { label: '28.000 đ/h', value: 28000 },
  { label: '30.000 đ/h', value: 30000 },
  { label: '35.000 đ/h', value: 35000 },
];

export const EditSalaryModal: React.FC<EditSalaryModalProps> = ({
  isOpen,
  onClose,
  staff,
  branchName,
  onSaveRate,
}) => {
  if (!isOpen || !staff) return null;

  const [hourlyRate, setHourlyRate] = useState<number>(staff.hourlyRate || 22000);
  const [inputValue, setInputValue] = useState<string>(String(staff.hourlyRate || 22000));
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (staff) {
      const initial = staff.hourlyRate || 22000;
      setHourlyRate(initial);
      setInputValue(String(initial));
      setSuccessMsg('');
    }
  }, [staff]);

  const handleInputChange = (val: string) => {
    // Only numbers
    const clean = val.replace(/\D/g, '');
    setInputValue(clean);
    const num = parseInt(clean, 10);
    if (!isNaN(num)) {
      setHourlyRate(num);
    }
  };

  const handleSelectPreset = (rate: number) => {
    setHourlyRate(rate);
    setInputValue(String(rate));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hourlyRate < 1000) {
      alert('Vui lòng nhập mức lương hợp lệ (tối thiểu 1.000 đ/giờ)');
      return;
    }

    onSaveRate(staff.id, hourlyRate);
    setSuccessMsg(`Đã cập nhật mức lương cho ${staff.name} thành ${hourlyRate.toLocaleString('vi-VN')} đ/giờ!`);
    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1000);
  };

  // Preview calculations
  const perShift5h = hourlyRate * 5;
  const perWeek6Shifts = perShift5h * 6;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Điều Chỉnh Mức Lương Nhân Viên
              </h3>
              <p className="text-xs text-slate-500">
                Cập nhật đơn giá lương theo giờ (VND/giờ)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Staff Info Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3.5">
            <img
              src={staff.avatar}
              alt={staff.name}
              className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 truncate">
                {staff.name}
              </div>
              <div className="text-xs text-slate-500 font-mono flex items-center space-x-2">
                <span>ID: {staff.id}</span>
                <span>•</span>
                <span>{staff.phone}</span>
              </div>
              {branchName && (
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5 flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span>{branchName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rate Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Mức Lương Mới (VNĐ / Giờ Làm Việc) *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={inputValue ? parseInt(inputValue, 10).toLocaleString('vi-VN') : ''}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="22.000"
                className="w-full text-lg font-black font-mono text-emerald-700 bg-emerald-50/50 border-2 border-emerald-300 rounded-2xl px-4 py-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                đ / giờ
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Chọn nhanh mức lương phổ biến:</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_RATES.map((p) => {
                const isSelected = hourlyRate === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleSelectPreset(p.value)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.value.toLocaleString('vi-VN')} đ
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulation Preview Card */}
          <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs space-y-2">
            <div className="font-bold text-blue-900 flex items-center space-x-1.5">
              <Calculator className="w-3.5 h-3.5 text-blue-700" />
              <span>Ước tính thu nhập theo mức lương này:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <div className="text-[10px] text-slate-500">1 Ca 5 Giờ:</div>
                <div className="text-sm font-bold font-mono text-blue-800 mt-0.5">
                  {perShift5h.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100">
                <div className="text-[10px] text-slate-500">6 Ca / Tuần (30h):</div>
                <div className="text-sm font-bold font-mono text-emerald-700 mt-0.5">
                  {perWeek6Shifts.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          </div>

          {/* Success Message Banner */}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Mức Lương</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
