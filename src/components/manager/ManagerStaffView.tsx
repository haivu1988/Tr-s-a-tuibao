import React, { useState } from 'react';
import { User, Branch } from '../../types';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit2, 
  Search, 
  Building2, 
  Phone, 
  DollarSign, 
  Smartphone, 
  ShieldCheck, 
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Filter
} from 'lucide-react';
import { AddStaffModal } from './AddStaffModal';
import { EditSalaryModal } from './EditSalaryModal';

interface ManagerStaffViewProps {
  allStaff: User[];
  branches: Branch[];
  activeBranchId: string;
  onAddStaff: (newStaff: User) => void;
  onDeleteStaff: (userId: string) => void;
  onUpdateStaffHourlyRate: (userId: string, newRate: number) => void;
  onReassignStaffBranch: (userId: string, newBranchId: string) => void;
  onResetStaffDevice?: (userId: string) => void;
}

export const ManagerStaffView: React.FC<ManagerStaffViewProps> = ({
  allStaff,
  branches,
  activeBranchId,
  onAddStaff,
  onDeleteStaff,
  onUpdateStaffHourlyRate,
  onReassignStaffBranch,
  onResetStaffDevice,
}) => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>(activeBranchId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState<boolean>(false);
  const [editingSalaryUser, setEditingSalaryUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Filter only staff members (exclude managers from staff deletion/reassignment or include all staff role)
  const staffMembers = allStaff.filter((u) => u.role === 'staff');

  const filteredStaff = staffMembers.filter((staff) => {
    const matchBranch = selectedBranchFilter === 'all' || staff.branchId === selectedBranchFilter;
    const matchSearch = 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.department && staff.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchBranch && matchSearch;
  });

  const getBranchName = (branchId: string) => {
    const b = branches.find((item) => item.id === branchId);
    return b ? b.name : branchId;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
              <Users className="w-3.5 h-3.5" />
              <span>Quản Trị Nhân Lực & Hồ Sơ</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Quản Lý Danh Sách Nhân Viên
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Thêm nhân viên mới, xóa nhân sự nghỉ việc, điều chỉnh mức lương theo giờ (VNĐ/h) và điều chuyển chi nhánh làm việc.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs shadow-md hover:shadow-lg transition-all flex items-center space-x-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>+ Thêm Nhân Viên Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã NV, số điện thoại, vị trí..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        {/* Branch Filter */}
        <div className="flex items-center space-x-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Chi nhánh:
          </span>
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Tất cả chi nhánh ({staffMembers.length} NV)</option>
            {branches.map((b) => {
              const count = staffMembers.filter((u) => u.branchId === b.id).length;
              return (
                <option key={b.id} value={b.id}>
                  {b.name} ({count} NV)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Staff Grid / Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-slate-900">
              Danh Sách Nhân Viên
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {filteredStaff.length} người
            </span>
          </div>

          <span className="text-xs text-slate-400">
            *Dữ liệu tự động đồng bộ thời gian thực qua Cloud Firestore
          </span>
        </div>

        {filteredStaff.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* User Info */}
                <div className="flex items-center space-x-3.5 min-w-0">
                  <img
                    src={staff.avatar}
                    alt={staff.name}
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {staff.name}
                      </h4>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        ID: {staff.id}
                      </span>
                      {staff.status === 'active' ? (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang làm việc
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-500">
                          Nghỉ việc
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{staff.phone}</span>
                      </span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">
                        {staff.department || 'Nhân viên phục vụ'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1 text-slate-400">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>
                          {staff.registeredDeviceId ? (
                            <span className="font-mono text-[11px] text-emerald-700 font-semibold">
                              Đã khóa MAC: {staff.registeredDeviceId}
                            </span>
                          ) : (
                            <span className="italic text-amber-600">
                              Chưa khóa MAC (Tự khóa khi Check-in)
                            </span>
                          )}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions: Salary, Branch Reassign & Remove */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Hourly Salary Pill */}
                  <div className="flex items-center space-x-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{(staff.hourlyRate || 22000).toLocaleString('vi-VN')} đ/h</span>
                    <button
                      type="button"
                      onClick={() => setEditingSalaryUser(staff)}
                      title="Chỉnh sửa mức lương"
                      className="p-1 hover:bg-emerald-200 text-emerald-800 rounded-md transition-colors cursor-pointer ml-1"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Branch Reassignment */}
                  <div className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={staff.branchId}
                      onChange={(e) => onReassignStaffBranch(staff.id, e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Remove Staff Button */}
                  <button
                    type="button"
                    onClick={() => setDeletingUser(staff)}
                    title="Xóa nhân viên khỏi hệ thống"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <span className="hidden sm:inline text-rose-600">Xóa</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">
              Không tìm thấy nhân viên phù hợp
            </div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Không có nhân viên nào thỏa mãn tiêu chí tìm kiếm. Hãy nhấn nút "+ Thêm Nhân Viên Mới" để tạo tài khoản nhân viên.
            </p>
            <button
              type="button"
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              + Thêm Nhân Viên Mới
            </button>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <AddStaffModal
          isOpen={isAddStaffOpen}
          onClose={() => setIsAddStaffOpen(false)}
          branches={branches}
          activeBranchId={selectedBranchFilter !== 'all' ? selectedBranchFilter : activeBranchId}
          existingUsers={allStaff}
          onAddStaff={onAddStaff}
        />
      )}

      {/* Edit Salary Modal */}
      {editingSalaryUser && (
        <EditSalaryModal
          isOpen={!!editingSalaryUser}
          onClose={() => setEditingSalaryUser(null)}
          user={editingSalaryUser}
          onSaveSalary={(userId, newRate) => {
            onUpdateStaffHourlyRate(userId, newRate);
            setEditingSalaryUser(null);
          }}
        />
      )}

      {/* Delete Staff Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                Xác Nhận Xóa Nhân Viên
              </h4>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa nhân viên <strong className="text-slate-800">{deletingUser.name}</strong> (Mã NV: {deletingUser.id}) khỏi hệ thống? 
              </p>
              <p className="text-[11px] text-rose-600 font-medium pt-1">
                Tài khoản và hồ sơ nhân viên sẽ bị xóa vĩnh viễn trên cơ sở dữ liệu.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteStaff(deletingUser.id);
                  setDeletingUser(null);
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
