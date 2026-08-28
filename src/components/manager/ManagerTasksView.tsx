import React, { useState } from 'react';
import { User, TaskItem, ShiftType, SHIFT_DEFINITIONS } from '../../types';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users
} from 'lucide-react';

interface ManagerTasksViewProps {
  tasks: TaskItem[];
  allStaff: User[];
  onOpenCreateTask: () => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
}

export const ManagerTasksView: React.FC<ManagerTasksViewProps> = ({
  tasks,
  allStaff,
  onOpenCreateTask,
  onEditTask,
  onDeleteTask,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesShift = filterShift === 'all' || task.assignedToShift === filterShift;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;

    return matchesSearch && matchesShift && matchesStatus;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.progress === 100 || t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.progress > 0 && t.progress < 100).length;
  const avgProgress = totalTasks > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Tiến độ chung toàn ca</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{avgProgress}%</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full transition-all" style={{ width: `${avgProgress}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Tổng nhiệm vụ hôm nay</div>
          <div className="text-2xl font-black text-slate-800 mt-2">{totalTasks} Việc</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Phân bổ 3 ca làm việc</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Đang thực hiện</div>
          <div className="text-2xl font-black text-blue-600 mt-2">{inProgressTasks} Việc</div>
          <div className="text-[11px] text-blue-500 font-semibold mt-0.5">Nhân viên đang làm</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Đã hoàn thành</div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{completedTasks} Việc</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Nghiệm thu đạt chuẩn</div>
        </div>
      </div>

      {/* Task List Header & Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tiêu đề nhiệm vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả Ca</option>
              <option value="morning">Ca Sáng</option>
              <option value="afternoon">Ca Chiều</option>
              <option value="evening">Ca Tối</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Tất cả Trạng thái</option>
              <option value="todo">Chưa làm (0%)</option>
              <option value="in-progress">Đang làm (1-99%)</option>
              <option value="completed">Đã xong (100%)</option>
            </select>
          </div>

          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Phân Công Nhiệm Vụ Mới</span>
          </button>
        </div>

        {/* Task Cards Grid / List */}
        <div className="divide-y divide-slate-100">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const assignedUser = allStaff.find((s) => s.id === task.assignedToUserId);
              const shiftDef = task.assignedToShift ? SHIFT_DEFINITIONS[task.assignedToShift] : null;

              return (
                <div key={task.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {task.priority === 'high' ? 'Khẩn Cấp' : task.priority === 'medium' ? 'Ưu Tiên Vừa' : 'Bình Thường'}
                        </span>

                        {shiftDef && (
                          <span className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                            {shiftDef.name} ({shiftDef.timeRange})
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 font-mono">
                          Ngày: {task.date}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>

                      {task.description && (
                        <p className="text-xs text-slate-500 leading-relaxed">{task.description}</p>
                      )}

                      {/* Checklist items view */}
                      {task.checklists && task.checklists.length > 0 && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 max-w-xl">
                          <div className="text-[11px] font-bold text-slate-600 mb-1">
                            Tiêu chuẩn thực hiện ({task.checklists.filter((c) => c.done).length}/{task.checklists.length}):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {task.checklists.map((chk) => (
                              <div key={chk.id} className="flex items-center space-x-2 text-xs">
                                <span
                                  className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                                    chk.done ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                                  }`}
                                >
                                  {chk.done && '✓'}
                                </span>
                                <span className={`text-[11px] ${chk.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                  {chk.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side: Progress Bar & Assigned User & Controls */}
                    <div className="w-full md:w-64 shrink-0 space-y-3">
                      {/* Assigned staff info */}
                      <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        {assignedUser ? (
                          <>
                            <img
                              src={assignedUser.avatar}
                              alt={assignedUser.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {assignedUser.name}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">
                                {assignedUser.department}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-600 font-medium flex items-center space-x-1.5">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>Tất cả nhân viên ca</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500 font-semibold text-[11px]">Tiến độ công việc</span>
                          <span
                            className={`font-bold font-mono ${
                              task.progress === 100
                                ? 'text-emerald-600'
                                : task.progress > 0
                                ? 'text-blue-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {task.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              task.progress === 100
                                ? 'bg-emerald-500'
                                : task.progress > 0
                                ? 'bg-blue-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md border border-slate-200 transition-colors"
                          title="Chỉnh sửa nhiệm vụ"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc muốn xóa nhiệm vụ "${task.title}"?`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md border border-slate-200 transition-colors"
                          title="Xóa nhiệm vụ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
