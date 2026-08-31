import React, { useState } from 'react';
import { Branch, User } from '../../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  ChevronRight, 
  DollarSign, 
  Edit2, 
  UserPlus, 
  AlertTriangle,
  Compass,
  Navigation,
  LocateFixed,
  ExternalLink,
  Radio
} from 'lucide-react';
import { getCurrentDeviceGpsPosition } from '../../utils/geolocation';
import { EditSalaryModal } from './EditSalaryModal';
import { AddStaffModal } from './AddStaffModal';

interface BranchManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  activeBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onSaveBranch: (branch: Branch) => void;
  onDeleteBranch: (branchId: string) => void;
  allStaff: User[];
  onReassignStaffBranch: (userId: string, newBranchId: string) => void;
  onPinWifi: (branchId: string, wifiSsid: string) => void;
  onUpdateStaffHourlyRate?: (userId: string, newRate: number) => void;
  onAddStaff?: (newStaff: User) => void;
  onDeleteStaff?: (userId: string) => void;
}

export const BranchManagementModal: React.FC<BranchManagementModalProps> = ({
  isOpen,
  onClose,
  branches = [],
  activeBranchId,
  onSelectBranch,
  onSaveBranch,
  onDeleteBranch,
  allStaff = [],
  onReassignStaffBranch,
  onPinWifi,
  onUpdateStaffHourlyRate,
  onAddStaff,
  onDeleteStaff,
}) => {
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newWifiInput, setNewWifiInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'list' | 'edit' | 'staff'>('list');
  const [selectedBranchForStaff, setSelectedBranchForStaff] = useState<string>(activeBranchId);
  const [message, setMessage] = useState<string>('');
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [editingStaffSalary, setEditingStaffSalary] = useState<User | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [deletingStaff, setDeletingStaff] = useState<User | null>(null);

  if (!isOpen) return null;

  // New branch template with GPS coordinates
  const handleStartCreate = () => {
    const nextNum = branches.length + 1;
    setEditingBranch({
      id: `cn_${Date.now()}`,
      name: `Chi Nhánh ${nextNum} - Mới`,
      shortName: `CN ${nextNum}`,
      address: 'Số ..., Đường ..., TP. Hồ Chí Minh',
      phone: '028 3000 ' + Math.floor(1000 + Math.random() * 9000),
      latitude: 10.77428,
      longitude: 106.70395,
      radiusMeters: 50,
      pinnedWifiIp: '118.69.182.45',
      allowedWifiIps: ['118.69.182.45'],
      pinnedWifiSsid: `Store_Branch${nextNum}_5G`,
      availableWifis: [`Store_Branch${nextNum}_5G`, `Store_Staff_WiFi`],
      managerName: 'Trần Hoàng Nam',
      status: 'active',
    });
    setIsCreatingNew(true);
    setActiveTab('edit');
  };

  const handleStartEdit = (branch: Branch) => {
    setEditingBranch({ 
      ...branch,
      latitude: branch.latitude || 10.77428,
      longitude: branch.longitude || 106.70395,
      radiusMeters: branch.radiusMeters || 50,
    });
    setIsCreatingNew(false);
    setActiveTab('edit');
  };

  const handleAutoDetectGpsForEdit = async () => {
    setIsDetectingGps(true);
    try {
      const coords = await getCurrentDeviceGpsPosition();
      if (coords && editingBranch) {
        const newLat = Math.round(coords.latitude * 1000000) / 1000000;
        const newLng = Math.round(coords.longitude * 1000000) / 1000000;
        setEditingBranch({
          ...editingBranch,
          latitude: newLat,
          longitude: newLng,
        });
        alert(`Đã lấy tọa độ GPS thực tế: ${newLat}, ${newLng} (Độ chính xác: ±${coords.accuracy}m)!`);
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể lấy GPS. Vui lòng cho phép quyền định vị trên trình duyệt hoặc nhập tọa độ thủ công.');
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    if (!editingBranch.name.trim()) {
      alert('Vui lòng điền tên chi nhánh!');
      return;
    }

    const lat = Number(editingBranch.latitude);
    const lng = Number(editingBranch.longitude);
    const rad = Number(editingBranch.radiusMeters) || 50;

    if (isNaN(lat) || isNaN(lng)) {
      alert('Tọa độ GPS Vĩ độ và Kinh độ phải là số hợp lệ!');
      return;
    }

    const finalBranch: Branch = {
      ...editingBranch,
      latitude: lat,
      longitude: lng,
      radiusMeters: rad,
    };

    onSaveBranch(finalBranch);
    setMessage(`Đã lưu thông tin ${finalBranch.name} thành công!`);
    setTimeout(() => {
      setMessage('');
      setActiveTab('list');
      setEditingBranch(null);
      setIsCreatingNew(false);
    }, 1200);
  };

  const handleAddWifiToBranch = () => {
    if (!newWifiInput.trim() || !editingBranch) return;
    const trimmed = newWifiInput.trim();
    if (!editingBranch.availableWifis.includes(trimmed)) {
      setEditingBranch({
        ...editingBranch,
        availableWifis: [...editingBranch.availableWifis, trimmed],
      });
    }
    setNewWifiInput('');
  };

  const handleRemoveWifiFromBranch = (wifiToRemove: string) => {
    if (!editingBranch) return;
    if (editingBranch.pinnedWifiSsid === wifiToRemove) {
      alert('Không thể xóa WiFi đang được ghim làm WiFi chấm công chính thức! Hãy ghim WiFi khác trước.');
      return;
    }
    setEditingBranch({
      ...editingBranch,
      availableWifis: editingBranch.availableWifis.filter((w) => w !== wifiToRemove),
    });
  };

  const currentBranchStaff = allStaff.filter(
    (s) => s.role === 'staff' && s.branchId === selectedBranchForStaff
  );
  const otherStaff = allStaff.filter(
    (s) => s.role === 'staff' && s.branchId !== selectedBranchForStaff
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-900 flex items-center justify-center font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                Quản Trị Chi Nhánh & Phân Bổ Nhân Sự
              </h3>
              <p className="text-xs text-slate-400">
                Mỗi chi nhánh có lượng nhân viên riêng biệt, lịch phân ca & WiFi chấm công độc lập
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Danh Sách Chi Nhánh ({branches.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'staff'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Phân Bổ Nhân Viên
          </button>
          {editingBranch && (
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'edit'
                  ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {isCreatingNew ? '+ Thêm Chi Nhánh Mới' : `Chỉnh Sửa: ${editingBranch.shortName}`}
            </button>
          )}
        </div>

        {/* Feedback Message */}
        {message && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2 shrink-0">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: LIST BRANCHES */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Chọn chi nhánh để chuyển đổi vùng làm việc quản lý, hoặc chỉnh sửa thông tin chi nhánh:
                </p>
                <button
                  onClick={handleStartCreate}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm Chi Nhánh</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {branches.map((branch) => {
                  const staffCount = allStaff.filter(
                    (s) => s.role === 'staff' && s.branchId === branch.id
                  ).length;
                  const isCurrentActive = activeBranchId === branch.id;

                  return (
                    <div
                      key={branch.id}
                      className={`p-4 rounded-2xl border transition-all relative ${
                        isCurrentActive
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Active branch indicator pill */}
                      {isCurrentActive && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                          Đang Chọn
                        </span>
                      )}

                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0 pr-14">
                          <h4 className="font-bold text-slate-900 text-sm truncate">
                            {branch.name}
                          </h4>
                          <div className="flex items-center space-x-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{branch.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Branch Info Row */}
                      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span>Nhân sự:</span>
                          </div>
                          <div className="font-bold text-slate-800 mt-0.5 truncate">
                            {staffCount} nhân viên
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                            <Compass className="w-3 h-3 text-emerald-600" />
                            <span>GPS Ghim:</span>
                          </div>
                          <div className="font-mono font-bold text-emerald-700 mt-0.5 truncate text-[11px]" title={`${branch.latitude}, ${branch.longitude}`}>
                            {branch.latitude ? `${branch.latitude.toFixed(4)}, ${branch.longitude?.toFixed(4)}` : 'Chưa ghim'}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1">
                            <Navigation className="w-3 h-3 text-slate-500" />
                            <span>Bán kính:</span>
                          </div>
                          <div className="font-mono font-semibold text-slate-700 mt-0.5 truncate text-[11px]">
                            ±{branch.radiusMeters || 50} mét
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-3 pt-2 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleStartEdit(branch)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Chỉnh sửa</span>
                          </button>
                          {branches.length > 1 && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Bạn có chắc chắn muốn xóa "${branch.name}"? Tất cả nhân viên sẽ cần được chuyển sang chi nhánh khác.`
                                  )
                                ) {
                                  onDeleteBranch(branch.id);
                                }
                              }}
                              className="px-2 py-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-semibold cursor-pointer transition-colors"
                              title="Xóa chi nhánh"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {!isCurrentActive ? (
                          <button
                            onClick={() => {
                              onSelectBranch(branch.id);
                              onClose();
                            }}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            Chọn Chi Nhánh
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-bold">
                            Đang quản lý
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STAFF ALLOCATION PER BRANCH */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2">
                  <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                    Xem chi nhánh:
                  </label>
                  <select
                    value={selectedBranchForStaff}
                    onChange={(e) => setSelectedBranchForStaff(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {onAddStaff && (
                  <button
                    type="button"
                    onClick={() => setIsAddStaffOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow-md transition-all cursor-pointer self-start sm:self-auto"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Thêm Nhân Viên Mới</span>
                  </button>
                )}
              </div>

              {/* Staff table for this branch */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>
                    Danh sách ({currentBranchStaff.length} nhân sự)
                  </span>
                  <span className="text-slate-400 font-normal text-[11px]">
                    *Có thể chỉnh lương, chuyển chi nhánh hoặc xóa nhân viên
                  </span>
                </div>

                <div className="divide-y divide-slate-200/70 max-h-80 overflow-y-auto">
                  {currentBranchStaff.length > 0 ? (
                    currentBranchStaff.map((staff) => (
                      <div
                        key={staff.id}
                        className="p-3 bg-white flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {staff.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {staff.id} • {staff.phone} • {staff.department || 'Nhân viên'}
                            </div>
                          </div>
                        </div>

                        {/* Branch Transfer Selector & Edit Salary & Delete */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {/* Mức lương */}
                          <div className="flex items-center space-x-1">
                            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                              {(staff.hourlyRate || 22000).toLocaleString('vi-VN')} đ/h
                            </span>
                            {onUpdateStaffHourlyRate && (
                              <button
                                type="button"
                                onClick={() => setEditingStaffSalary(staff)}
                                title="Chỉnh sửa mức lương cho nhân viên này"
                                className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 hidden sm:inline">
                            Chuyển sang:
                          </span>
                          <select
                            value={staff.branchId}
                            onChange={(e) => {
                              onReassignStaffBranch(staff.id, e.target.value);
                              setMessage(`Đã chuyển nhân viên ${staff.name} sang chi nhánh mới!`);
                              setTimeout(() => setMessage(''), 2000);
                            }}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium cursor-pointer"
                          >
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.shortName}
                              </option>
                            ))}
                          </select>

                          {/* Delete staff button */}
                          {onDeleteStaff && (
                            <button
                              type="button"
                              onClick={() => setDeletingStaff(staff)}
                              title="Xóa nhân viên khỏi hệ thống"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Chưa có nhân viên nào được phân vào chi nhánh này. Bấm nút "+ Thêm Nhân Viên Mới" ở trên để tạo hồ sơ nhân viên!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EDIT / CREATE BRANCH FORM */}
          {activeTab === 'edit' && editingBranch && (
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Chi Nhánh Đầy Đủ *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBranch.name}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, name: e.target.value })
                    }
                    placeholder="vd: Chi Nhánh 1 - Quận 1 (Nguyễn Huệ)"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Rút Gọn / Khu Vực *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBranch.shortName}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, shortName: e.target.value })
                    }
                    placeholder="vd: Quận 1"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Địa Chỉ Chi Nhánh *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBranch.address}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, address: e.target.value })
                    }
                    placeholder="vd: 128 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. HCM"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Số Điện Thoại Chi Nhánh
                  </label>
                  <input
                    type="text"
                    value={editingBranch.phone}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, phone: e.target.value })
                    }
                    placeholder="vd: 028 3822 1234"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* GPS PINNING CONFIGURATION SECTION */}
              <div className="p-4 bg-emerald-50/40 rounded-2xl border-2 border-emerald-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Ghim Tọa Độ GPS & Bán Kính Chấm Công Quán (Bắt Buộc)
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Nhân viên bắt buộc phải có mặt tại phạm vi GPS này để chấm công
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoDetectGpsForEdit}
                    disabled={isDetectingGps}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
                    <span>{isDetectingGps ? 'Đang quét GPS...' : '📍 Lấy GPS Tại Quán'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Vĩ Độ GPS (Latitude) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingBranch.latitude || ''}
                      onChange={(e) =>
                        setEditingBranch({ ...editingBranch, latitude: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="vd: 10.774280"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Tọa độ Vĩ độ (TP.HCM: ~10.7x)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kinh Độ GPS (Longitude) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={editingBranch.longitude || ''}
                      onChange={(e) =>
                        setEditingBranch({ ...editingBranch, longitude: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="vd: 106.703950"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Tọa độ Kinh độ (TP.HCM: ~106.7x)</span>
                  </div>
                </div>

                {/* Radius configuration */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Bán kính GPS cho phép chấm công quanh quán:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      ±{editingBranch.radiusMeters || 50} mét
                    </span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { value: 30, label: '30m (Chuẩn)' },
                      { value: 50, label: '50m (Mặc định)' },
                      { value: 100, label: '100m (Rộng)' },
                      { value: 200, label: '200m (Tòa nhà)' },
                    ].map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setEditingBranch({ ...editingBranch, radiusMeters: r.value })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          editingBranch.radiusMeters === r.value
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={10}
                    max={300}
                    step={10}
                    value={editingBranch.radiusMeters || 50}
                    onChange={(e) =>
                      setEditingBranch({ ...editingBranch, radiusMeters: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-600 cursor-pointer mt-1"
                  />
                </div>

                {/* Google Maps verify link */}
                {editingBranch.latitude && editingBranch.longitude ? (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>Tọa độ đã ghim: {editingBranch.latitude}, {editingBranch.longitude}</span>
                    </span>

                    <a
                      href={`https://www.google.com/maps?q=${editingBranch.latitude},${editingBranch.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:underline"
                    >
                      <span>Xem thử trên Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : null}
              </div>

              {/* Form Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('list');
                    setEditingBranch(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Lưu Thông Tin Chi Nhánh
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Chi nhánh đang chọn: <span className="font-bold text-slate-800">{branches.find(b => b.id === activeBranchId)?.name}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 border border-slate-200 bg-white rounded-xl hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Edit Salary Modal */}
      {editingStaffSalary && (
        <EditSalaryModal
          isOpen={!!editingStaffSalary}
          onClose={() => setEditingStaffSalary(null)}
          staff={editingStaffSalary}
          branchName={branches.find((b) => b.id === editingStaffSalary.branchId)?.name}
          onSaveRate={(userId, newRate) => {
            if (onUpdateStaffHourlyRate) {
              onUpdateStaffHourlyRate(userId, newRate);
            }
          }}
        />
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <AddStaffModal
          isOpen={isAddStaffOpen}
          onClose={() => setIsAddStaffOpen(false)}
          branches={branches}
          activeBranchId={selectedBranchForStaff || activeBranchId}
          existingUsers={allStaff}
          onAddStaff={(newStaff) => {
            if (onAddStaff) {
              onAddStaff(newStaff);
            }
          }}
        />
      )}

      {/* Delete Staff Confirmation Modal */}
      {deletingStaff && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                Xóa Nhân Viên Khỏi Hệ Thống?
              </h4>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa nhân viên <strong className="text-slate-800">{deletingStaff.name}</strong> (Mã: {deletingStaff.id})? Hành động này sẽ xóa tài khoản và hồ sơ nhân viên.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteStaff) {
                    onDeleteStaff(deletingStaff.id);
                  }
                  setDeletingStaff(null);
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
