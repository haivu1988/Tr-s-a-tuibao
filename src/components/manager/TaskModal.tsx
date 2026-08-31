import React, { useState } from 'react';
import { User, TaskItem, ShiftType } from '../../types';
import { X, Plus, Trash2, CheckSquare, Calendar, UserCheck } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: TaskItem) => void;
  staffList: User[];
  taskToEdit?: TaskItem | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  staffList,
  taskToEdit,
}) => {
  const [title, setTitle] = useState<string>(taskToEdit?.title || '');
  const [description, setDescription] = useState<string>(taskToEdit?.description || '');
  const [assignedToUserId, setAssignedToUserId] = useState<string>(taskToEdit?.assignedToUserId || '');
  const [assignedToShift, setAssignedToShift] = useState<ShiftType | ''>(taskToEdit?.assignedToShift || 'morning');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(taskToEdit?.priority || 'medium');
  const [date, setDate] = useState<string>(taskToEdit?.date || new Date().toISOString().split('T')[0]);
  const [checklists, setChecklists] = useState<{ id: string; text: string; done: boolean }[]>(
    taskToEdit?.checklists || [
      { id: '1', text: 'Bước 1: Chuẩn bị dụng cụ & nguyên liệu', done: false },
      { id: '2', text: 'Bước 2: Thực hiện công việc đúng quy trình', done: false },
      { id: '3', text: 'Bước 3: Kiểm tra nghiệm thu & bàn giao', done: false },
    ]
  );
  const [newChecklistText, setNewChecklistText] = useState<string>('');

  if (!isOpen) return null;

  const handleAddChecklist = () => {
    if (newChecklistText.trim()) {
      setChecklists([
        ...checklists,
        { id: `chk_${Date.now()}`, text: newChecklistText.trim(), done: false },
      ]);
      setNewChecklistText('');
    }
  };

  const handleRemoveChecklist = (id: string) => {
    setChecklists(checklists.filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const completedCount = checklists.filter((c) => c.done).length;
    const progress = checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;
    const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'todo';

    const task: TaskItem = {
      id: taskToEdit?.id || `tsk_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      assignedToUserId: assignedToUserId || undefined,
      assignedToShift: (assignedToShift as ShiftType) || undefined,
      date,
      priority,
      progress,
      status,
      createdBy: 'Trần Hoàng Nam (Quản lý)',
      createdAt: taskToEdit?.createdAt || new Date().toISOString(),
      checklists,
    };

    onSaveTask(task);
    onClose();
  };

  const activeStaff = staffList.filter((s) => s.role === 'staff' && s.status === 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold">
              {taskToEdit ? 'Chỉnh Sửa Nhiệm Vụ' : 'Phân Công Nhiệm Vụ Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề nhiệm vụ *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="vd: Kiểm tra hạn sử dụng sữa và siro quầy bar"
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả chi tiết & yêu cầu chất lượng
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ghi chú cụ thể các tiêu chuẩn cần đạt..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giao cho Nhân viên
              </label>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Toàn bộ ca làm việc --</option>
                {activeStaff.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ca làm việc áp dụng
              </label>
              <select
                value={assignedToShift}
                onChange={(e) => setAssignedToShift(e.target.value as ShiftType)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="morning">Ca Sáng (08:00 - 13:00)</option>
                <option value="afternoon">Ca Chiều (13:00 - 18:00)</option>
                <option value="evening">Ca Tối (18:00 - 23:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày thực hiện
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
              >
                <option value="low">Thấp (Low)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="high">Cao / Khẩn cấp (High)</option>
              </select>
            </div>
          </div>

          {/* Checklist subtasks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Checklist các bước thực hiện ({checklists.length})</span>
            </label>

            <div className="space-y-1.5 max-h-36 overflow-y-auto mb-2">
              {checklists.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-2 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                >
                  <span className="font-mono text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                  <span className="flex-1 text-slate-700">{item.text}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklist(item.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist();
                  }
                }}
                placeholder="Nhập thêm đầu mục kiểm tra..."
                className="flex-1 text-xs p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddChecklist}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{taskToEdit ? 'Lưu Thay Đổi' : 'Tạo & Giao Nhiệm Vụ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
